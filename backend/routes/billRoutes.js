import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

// ===== Controllers =====
import { 
  uploadRevenueExcel, 
  getMoneyHistory, 
  getCurrentMonthRevenue, 
  getAllMoneyHistory,
  getCombinedHistory,
  upload as uploadMoney 
} from '../controllers/moneyHistoryController.js';

import * as monthSettingsController from '../controllers/monthSettingsController.js';

import { 
  uploadBill,
  getBillHistory,
  getBillHistoryWithPagination,
  verifyBill,
  getAllBills,
  importBillExcel,
  getBillImage,
  cancelBillImage,
  deleteBill,
  cleanupExpiredImages
} from '../controllers/billController.js';

// ===== Middleware =====
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/* ==========================
   Money History Routes
   ========================== */
router.post('/money-history/upload-revenue', uploadMoney.single('file'), uploadRevenueExcel);
router.get('/money-history/shop/:shopId', getMoneyHistory);
router.get('/money-history/shop/:shopId/current', getCurrentMonthRevenue);
router.get('/money-history/shop/:shopId/combined', getCombinedHistory);
router.get('/money-history', getAllMoneyHistory);

/* ==========================
   Month Settings Routes
   ========================== */
router.use('/month-settings', (req, res, next) => {
  console.log('🔍 Month Settings API Request:', {
    method: req.method,
    url: req.url,
    path: req.path,
    params: req.params,
    body: req.body
  });
  next();
});

router.use('/month-settings', verifyToken);

router.get('/month-settings', monthSettingsController.getAllMonthSettings);
router.get('/month-settings/current', monthSettingsController.getCurrentMonthStatus);
router.get('/month-settings/:month', monthSettingsController.getMonthSetting);
router.post('/month-settings', monthSettingsController.createMonthSetting);
router.put('/month-settings/:id', monthSettingsController.updateMonthSetting);
router.post('/month-settings/bulk', monthSettingsController.bulkUpdateMonthSettings);
router.delete('/month-settings/:id', monthSettingsController.deleteMonthSetting);

/* ==========================
   Bill Routes
   ========================== */

// === Multer for bill slips ===
const billStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const shopId = req.user?.shopId || 'default';
      // choose folder based on billType in body: water, electricity, utilities
      const billTypeRaw = req.body?.billType || 'misc';
      const billType = typeof billTypeRaw === 'string' ? billTypeRaw.toLowerCase() : billTypeRaw;
      const typeFolder = ['water', 'electricity', 'utilities'].includes(billType) ? billType : 'misc';
      const uploadPath = `uploads/bills/${shopId}/${year}/${month}/${typeFolder}/`;

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    } catch (error) {
      console.error('Error creating upload directory:', error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const billTypeRaw = req.body?.billType || 'bill';
    const billType = typeof billTypeRaw === 'string' ? billTypeRaw.toLowerCase() : billTypeRaw;
    const filename = `${billType}-` + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

const billUpload = multer({ 
  storage: billStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Not an image! Please upload only images.'), false);
  }
});

// === Multer for Excel import ===
const excelUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = 'uploads/bills/';
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // ตรวจสอบ MIME type และ extension
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream' // บางครั้ง Excel files จะมี MIME type นี้
    ];
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed! (.xlsx, .xls)'), false);
    }
  }
});

// === Public route (no token needed) ===
router.get('/image/:billId', getBillImage);

// === Protected routes ===
router.use(verifyToken);

// Upload bill slip
router.post('/upload', 
  billUpload.single('slip'), 
  uploadBill
);

// Get user bill history
router.get('/history', getBillHistory);
router.get('/history/paginated', getBillHistoryWithPagination);

// Admin bill routes (support legacy paths too)
router.get(['/admin', '/bills/admin'], isAdmin, getAllBills);
router.put(['/admin/verify/:id', '/bills/admin/verify/:id'], isAdmin, verifyBill);
// Excel import with error handling
router.post(['/admin/import-excel', '/bills/admin/import-excel'], isAdmin, (req, res, next) => {
  excelUpload.single('file')(req, res, (err) => {
    if (err) {
      // Handle multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)'
        });
      }
      if (err.message === 'Only Excel files are allowed!') {
        return res.status(400).json({
          success: false,
          message: 'กรุณาอัปโหลดไฟล์ Excel เท่านั้น (.xlsx, .xls)'
        });
      }
      if (err.message && err.message.includes('Unexpected field')) {
        return res.status(400).json({
          success: false,
          message: 'Field name ต้องเป็น "file"',
          hint: 'Make sure to use form-data with field name "file"'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ' + err.message
      });
    }
    next();
  });
}, importBillExcel);
router.put(['/admin/cancel-image/:id', '/bills/admin/cancel-image/:id'], isAdmin, cancelBillImage);
router.delete(['/admin/:id', '/bills/admin/:id'], isAdmin, deleteBill);
router.post(['/admin/cleanup', '/bills/admin/cleanup'], isAdmin, cleanupExpiredImages);

export default router;
