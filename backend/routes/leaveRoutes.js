import express from 'express';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/authMiddleware.js';
import {
  getLeaves,
  getUserLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
  updateLeaveStatus
} from '../controllers/leaveController.js';

const router = express.Router();

// ใช้ middleware กับทุก routes
router.use(protect);

// Admin routes
router.get('/admin', isAdmin, getLeaves);

// User routes
router.get('/user', getUserLeaves);
router.post('/', express.json(), createLeave);
router.put('/:id', updateLeave);
router.delete('/:id', deleteLeave);
router.put('/:id/status', isAdmin, updateLeaveStatus);

export default router; 