import express from 'express';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';
import { 
  getAllNews, 
  getNewsById, 
  createNews, 
  updateNews, 
  deleteNews, 
  getAllNewsForAdmin,
  toggleNewsStatus,
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

// Admin routes
// Get all news for admin (including inactive)
router.get('/admin/all', verifyToken, isAdmin, getAllNewsForAdmin);

// Create news (admin only)
router.post('/', verifyToken, isAdmin, uploadNewsImage.single('image'), createNews);

// Update news (admin only)
router.put('/:id', verifyToken, isAdmin, uploadNewsImage.single('image'), updateNews);

// Delete news (admin only)
router.delete('/:id', verifyToken, isAdmin, deleteNews);

// Toggle news status (admin only)
router.patch('/:id/toggle', verifyToken, isAdmin, toggleNewsStatus);

export default router;
