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
      const uploadPath = `uploads/bills/${shopId}/${year}/${month}/`;

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
    const filename = 'bill-' + uniqueSuffix + path.extname(file.originalname);
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
    destination: (req, file, cb) => cb(null, 'uploads/bills/'),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'), false);
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
router.post(['/admin/import-excel', '/bills/admin/import-excel'], isAdmin, excelUpload.single('file'), importBillExcel);
router.put(['/admin/cancel-image/:id', '/bills/admin/cancel-image/:id'], isAdmin, cancelBillImage);
router.delete(['/admin/:id', '/bills/admin/:id'], isAdmin, deleteBill);
router.post(['/admin/cleanup', '/bills/admin/cleanup'], isAdmin, cleanupExpiredImages);

export default router;
