import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { 
  getLeaves, 
  createLeave, 
  updateLeave, 
  deleteLeave 
} from '../controllers/leaveController.js';

const router = express.Router();

// ใช้ middleware กับทุก routes
router.use(verifyToken);

// Routes ที่ต้องการป้องกัน
router.get('/', getLeaves);
router.post('/', createLeave);
router.put('/:id', updateLeave);
router.delete('/:id', deleteLeave);

export default router; 