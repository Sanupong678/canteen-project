import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../controllers/notificationController.js';

const router = express.Router();

// Get user notifications
router.get('/user', verifyToken, getUserNotifications);

// Mark notification as read
router.put('/:id/read', verifyToken, markNotificationAsRead);

// Mark all notifications as read
router.put('/mark-all-read', verifyToken, markAllNotificationsAsRead);

export default router; 