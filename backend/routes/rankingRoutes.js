import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as rankingController from '../controllers/rankingController.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ranking-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('รองรับเฉพาะไฟล์ Excel (.xlsx, .xls) เท่านั้น'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET /api/rankings - Get all rankings with filters
router.get('/', rankingController.getRankings);

// GET /api/rankings/stats - Get ranking statistics
router.get('/stats', rankingController.getRankingStats);

// GET /api/rankings/current - Get current month data for user ranking
router.get('/current', rankingController.getCurrentRankingData);

// GET /api/rankings/monthly-history - Get monthly history for user ranking
router.get('/monthly-history', rankingController.getMonthlyHistory);

// POST /api/rankings - Create new ranking
router.post('/', rankingController.createRanking);

// PUT /api/rankings/:id - Update ranking
router.put('/:id', rankingController.updateRanking);

// DELETE /api/rankings/:id - Delete ranking
router.delete('/:id', rankingController.deleteRanking);

// POST /api/rankings/upload-excel - Upload Excel file
router.post('/upload-excel', upload.single('excelFile'), rankingController.uploadExcel);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)'
      });
    }
  } else if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

export default router; 