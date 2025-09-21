import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Controllers
import { 
  uploadWelcomeImage, 
  getWelcomeData, 
  deleteWelcomeImage 
} from '../controllers/welcomeController.js';

// Middleware
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer configuration for welcome page images
const welcomeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const welcomeDir = path.join(__dirname, '../uploads/welcomepage');
    
    // สร้างโฟลเดอร์ถ้ายังไม่มี
    if (!fs.existsSync(welcomeDir)) {
      fs.mkdirSync(welcomeDir, { recursive: true });
    }
    
    cb(null, welcomeDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `temp-${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

const welcomeUpload = multer({ 
  storage: welcomeStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // ตรวจสอบประเภทไฟล์
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      error: 'Only image files are allowed!'
    });
  }
  
  next(error);
};

// Public routes (no authentication required)
router.get('/data', getWelcomeData);

// Protected routes (require authentication)
router.use(verifyToken);

// Admin routes (require admin role)
router.post('/upload', isAdmin, welcomeUpload.single('image'), handleMulterError, uploadWelcomeImage);
router.delete('/delete', isAdmin, deleteWelcomeImage);

export default router;
