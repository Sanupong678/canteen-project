import express from 'express';
import authRoutes from './authRoutes.js';
import shopRoutes from './shopRoutes.js';
import repairRoutes from './repairRoutes.js';
import leaveRoutes from './leaveRoutes.js';
import billRoutes from './billRoutes.js';
import canteenRoutes from './canteenRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import rankingRoutes from './rankingRoutes.js';
import evaluationRoutes from './evaluationRoutes.js';
import monthSettingsRoutes from './monthSettingsRoutes.js';
import newsRoutes from './newsRoutes.js';
import backgroundRoutes from './backgroundRoutes.js';
import adminNotificationRoutes from './adminNotificationRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const router = express.Router();

// Use routes
router.use('/api/auth', authRoutes);
router.use('/api/shops', shopRoutes);
router.use('/api/repairs', repairRoutes);
router.use('/api/leaves', leaveRoutes);
router.use('/api/bills', billRoutes);
router.use('/api/canteens', canteenRoutes);
router.use('/api/upload', uploadRoutes);
router.use('/api/rankings', rankingRoutes);
router.use('/api/evaluations', evaluationRoutes);
router.use('/api/month-settings', monthSettingsRoutes);
router.use('/api/news', newsRoutes);
router.use('/api/backgrounds', backgroundRoutes);
router.use('/api/admin-notifications', adminNotificationRoutes);
router.use('/api/notifications', notificationRoutes);

export default router; 