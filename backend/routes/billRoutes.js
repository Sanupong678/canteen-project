import express from 'express';
import multer from 'multer';
import path from 'path';
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
import { isAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

import fs from 'fs';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
    // จัดเก็บตาม shopId/ปี/เดือน เช่น uploads/bills/shop123/2024/01/
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const shopId = req.user?.shopId || 'default'; // จาก token
    const uploadPath = `uploads/bills/${shopId}/${year}/${month}/`;
      
      console.log('Upload path:', uploadPath);
    
    // สร้างโฟลเดอร์ถ้ายังไม่มี
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
        console.log('Created directory:', uploadPath);
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
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('File upload attempt:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  }
});

// เพิ่ม config multer สำหรับ excel
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

// User routes
router.get('/image/:billId', getBillImage);
router.use(verifyToken);

// Upload route with better error handling
router.post('/upload', (req, res, next) => {
  console.log('=== UPLOAD ROUTE DEBUG ===');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  next();
}, upload.single('slip'), (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        error: 'File size too large. Maximum size is 5MB.' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      error: 'File upload error: ' + err.message 
    });
  } else if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  }
  next();
}, uploadBill);

router.get('/history', getBillHistory);
router.get('/history/paginated', getBillHistoryWithPagination);

// Admin routes
router.get('/admin', isAdmin, getAllBills);
router.put('/admin/verify/:id', isAdmin, verifyBill);
router.post('/admin/import-excel', isAdmin, excelUpload.single('file'), importBillExcel);
router.put('/admin/cancel-image/:id', isAdmin, cancelBillImage);
router.delete('/admin/:id', isAdmin, deleteBill);
router.post('/admin/cleanup', isAdmin, cleanupExpiredImages);

export default router; 