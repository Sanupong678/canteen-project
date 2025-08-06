import express from 'express';
import * as monthSettingsController from '../controllers/monthSettingsController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Debug logging middleware
router.use((req, res, next) => {
  console.log('🔍 Month Settings API Request:', {
    method: req.method,
    url: req.url,
    path: req.path,
    params: req.params,
    body: req.body
  });
  next();
});

// Apply auth middleware to all routes
router.use(verifyToken);

// Get all month settings
router.get('/', monthSettingsController.getAllMonthSettings);

// Get current month evaluation status
router.get('/current', monthSettingsController.getCurrentMonthStatus);

// Get month setting by month number
router.get('/:month', monthSettingsController.getMonthSetting);

// Create new month setting
router.post('/', monthSettingsController.createMonthSetting);

// Update month setting
router.put('/:id', monthSettingsController.updateMonthSetting);

// Bulk update month settings
router.post('/bulk', monthSettingsController.bulkUpdateMonthSettings);

// Delete month setting
router.delete('/:id', monthSettingsController.deleteMonthSetting);

export default router; 