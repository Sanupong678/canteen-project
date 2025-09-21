import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  checkAndCreateMonthlyRankingNotification,
  checkShopRankingStatus,
  createShopMonthlyNotification
} from '../controllers/monthlyRankingNotificationController.js';

const router = express.Router();

// ตรวจสอบและสร้าง monthly ranking notification สำหรับทุกร้านค้า
router.post('/check-all', verifyToken, checkAndCreateMonthlyRankingNotification);

// ตรวจสอบสถานะข้อมูล ranking สำหรับร้านค้าเฉพาะ
router.get('/shop/:shopId/status', verifyToken, checkShopRankingStatus);

// สร้าง monthly ranking notification สำหรับร้านค้าเฉพาะ (manual)
router.post('/shop/:shopId/create', verifyToken, createShopMonthlyNotification);

export default router;
