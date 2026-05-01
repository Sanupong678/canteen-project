import express from 'express';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';
import { 
  getAllNews, 
  getNewsById, 
  createNews, 
  updateNews,
  deleteNews, 
  getNewsImage
} from '../controllers/newsController.js';
import { uploadNewsImage } from '../middleware/uploadMiddleware.js';
import { cache } from '../middleware/cacheMiddleware.js';
import { timedHandler } from '../middleware/requestProfiler.js';

const router = express.Router();

// Get all active news (for users)
router.get('/', cache(60), timedHandler('news.getAllNews', getAllNews));

// Get single news by ID (for users)
router.get('/:id', cache(60), timedHandler('news.getNewsById', getNewsById));

// Get news image
router.get('/:newsId/image', timedHandler('news.getNewsImage', getNewsImage));

// Create news (admin only)
router.post('/', verifyToken, isAdmin, uploadNewsImage.single('image'), timedHandler('news.createNews', createNews));

// Update news (admin only)
router.put('/:id', verifyToken, isAdmin, uploadNewsImage.single('image'), timedHandler('news.updateNews', updateNews));

// Delete news (admin only)
router.delete('/:id', verifyToken, isAdmin, timedHandler('news.deleteNews', deleteNews));

export default router;
