import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
  uploadBill,
  getBillHistory,
  verifyBill,
  getAllBills,
  importBillExcel,
  getBillImage,
  cancelBillImage,
  deleteBill
} from '../controllers/billController.js';
import { isAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/bills/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'bill-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
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
router.post('/upload', upload.single('slip'), uploadBill);
router.get('/history', getBillHistory);

// Admin routes
router.get('/admin', isAdmin, getAllBills);
router.put('/admin/verify/:id', isAdmin, verifyBill);
router.post('/admin/import-excel', isAdmin, excelUpload.single('file'), importBillExcel);
router.put('/admin/cancel-image/:id', isAdmin, cancelBillImage);
router.delete('/admin/:id', isAdmin, deleteBill);

export default router; 