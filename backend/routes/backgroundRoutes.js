import express from 'express';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';
import { 
  getBackgrounds, 
  createBackground, 
  updateBackground, 
  deleteBackground, 
  toggleBackgroundStatus,
  getBackgroundImage
} from '../controllers/backgroundController.js';
import { uploadBannerImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Get all active backgrounds (for users)
router.get('/', getBackgrounds);

// Get background image
router.get('/:backgroundId/image', getBackgroundImage);

// Admin routes
// Create background (admin only)
router.post('/', verifyToken, isAdmin, uploadBannerImage.single('image'), createBackground);

// Update background (admin only)
router.put('/:id', verifyToken, isAdmin, uploadBannerImage.single('image'), updateBackground);

// Delete background (admin only)
router.delete('/:id', verifyToken, isAdmin, deleteBackground);

// Toggle background status (admin only)
router.patch('/:id/toggle', verifyToken, isAdmin, toggleBackgroundStatus);

export default router; 