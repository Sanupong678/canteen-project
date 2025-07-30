import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead
} from '../controllers/adminNotificationController.js';

const router = express.Router();

// Get admin notifications
router.get('/admin', verifyToken, getAdminNotifications);

// Mark notification as read
router.put('/admin/:id/read', verifyToken, markAdminNotificationAsRead);

// Mark all notifications as read
router.put('/admin/mark-all-read', verifyToken, markAllAdminNotificationsAsRead);

export default router; 