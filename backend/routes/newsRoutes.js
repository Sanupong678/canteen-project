import express from 'express';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';
import { 
  getAllNews, 
  getNewsById, 
  createNews, 
  deleteNews, 
  getNewsImage
} from '../controllers/newsController.js';
import { uploadNewsImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Get all active news (for users)
router.get('/', getAllNews);

// Get single news by ID (for users)
router.get('/:id', getNewsById);

// Get news image
router.get('/:newsId/image', getNewsImage);

// Create news (admin only)
router.post('/', verifyToken, isAdmin, uploadNewsImage.single('image'), createNews);

// Delete news (admin only)
router.delete('/:id', verifyToken, isAdmin, deleteNews);

export default router;
