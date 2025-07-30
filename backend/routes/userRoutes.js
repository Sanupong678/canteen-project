import express from 'express';
import { protect } from '../middleware/auth.js';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} from '../controllers/userController.js';

const router = express.Router();

// ใช้ middleware กับทุก routes
router.use(protect);

// Routes ที่ต้องการป้องกัน
router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
