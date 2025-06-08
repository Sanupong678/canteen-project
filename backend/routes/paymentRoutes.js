import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
  uploadPayment, 
  getPaymentStatus, 
  verifyPayment, 
  getAllPayments 
} from '../controllers/paymentController.js';
import { isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/slips/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'slip-' + uniqueSuffix + path.extname(file.originalname));
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

// Routes
router.post('/upload', upload.single('slip'), uploadPayment);
router.get('/status', getPaymentStatus);
router.get('/admin', isAdmin, getAllPayments);
router.put('/admin/verify/:id', isAdmin, verifyPayment);

export default router; 