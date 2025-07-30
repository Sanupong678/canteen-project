import express from 'express';
import authRoutes from './authRoutes.js';
import shopRoutes from './shopRoutes.js';
import repairRoutes from './repairRoutes.js';
import leaveRoutes from './leaveRoutes.js';
import billRoutes from './billRoutes.js';
import canteenRoutes from './canteenRoutes.js';
import uploadRoutes from './uploadRoutes.js';

const router = express.Router();

// Use routes
router.use('/api/auth', authRoutes);
router.use('/api/shops', shopRoutes);
router.use('/api/repairs', repairRoutes);
router.use('/api/leaves', leaveRoutes);
router.use('/api/bills', billRoutes);
router.use('/api/canteens', canteenRoutes);
router.use('/api/upload', uploadRoutes);

export default router; 