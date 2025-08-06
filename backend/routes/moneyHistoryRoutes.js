import express from 'express';
import { 
  uploadRevenueExcel, 
  getMoneyHistory, 
  getCurrentMonthRevenue, 
  getAllMoneyHistory,
  getCombinedHistory,
  upload 
} from '../controllers/moneyHistoryController.js';

const router = express.Router();

// Upload revenue Excel file
router.post('/upload-revenue', upload.single('file'), uploadRevenueExcel);

// Get money history for a specific shop
router.get('/shop/:shopId', getMoneyHistory);

// Get current month revenue for a shop
router.get('/shop/:shopId/current', getCurrentMonthRevenue);

// Get combined money and evaluation history for a shop
router.get('/shop/:shopId/combined', getCombinedHistory);

// Get all money history (admin)
router.get('/', getAllMoneyHistory);

export default router; 