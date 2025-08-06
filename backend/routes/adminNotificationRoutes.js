import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  sendAdminNotification,
  getAdminNotifications,
  getShopAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead
} from '../controllers/adminNotificationController.js';

const router = express.Router();

// ส่งการแจ้งเตือนจาก admin
router.post('/send', verifyToken, sendAdminNotification);

// ดึงข้อมูล admin notifications (สำหรับ admin)
router.get('/admin', verifyToken, getAdminNotifications);

// ดึงข้อมูล admin notifications สำหรับร้านค้า
router.get('/shop/:shopId', verifyToken, getShopAdminNotifications);

// Mark admin notification as read
router.put('/admin/:id/read', verifyToken, markAdminNotificationAsRead);

// Mark all admin notifications as read
router.put('/admin/mark-all-read', verifyToken, markAllAdminNotificationsAsRead);

export default router; 