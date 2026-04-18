import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';
import {
  getPaymentSettings,
  upsertPaymentSettings,
  addPaymentQrItem,
  updatePaymentQrItem,
  deletePaymentQrItem
} from '../controllers/paymentSettingsController.js';

const router = express.Router();

const paymentQrStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/payment-settings/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `payment-qr-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const paymentQrUpload = multer({
  storage: paymentQrStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed for QR code'), false);
  }
});

router.use(verifyToken);
router.get('/', getPaymentSettings);
router.put('/', isAdmin, upsertPaymentSettings);
router.post('/qr-items', isAdmin, paymentQrUpload.single('qrCodeImage'), addPaymentQrItem);
router.put('/qr-items/:id', isAdmin, paymentQrUpload.single('qrCodeImage'), updatePaymentQrItem);
router.delete('/qr-items/:id', isAdmin, deletePaymentQrItem);

export default router;
