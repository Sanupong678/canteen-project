import express from 'express';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';
import { 
  getRepairs, 
  getUserRepairs,
  createRepair, 
  updateRepairStatus, 
  deleteRepair 
} from '../controllers/repairController.js';

const router = express.Router();

// ใช้ middleware กับทุก routes
router.use(verifyToken);

// Admin routes
router.get('/admin', isAdmin, getRepairs);

// User routes
router.get('/user', getUserRepairs);
router.post('/', express.json(), createRepair);
router.put('/:id/status', updateRepairStatus);
router.delete('/:id', deleteRepair);

export default router; 