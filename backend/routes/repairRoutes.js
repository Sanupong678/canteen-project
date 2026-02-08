import express from 'express';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/authMiddleware.js';
import { 
  getRepairs, 
  getUserRepairs,
  createRepair, 
  updateRepair,
  updateRepairStatus, 
  deleteRepair,
  getRepairImage
} from '../controllers/repairController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// สร้างโฟลเดอร์ uploads/repairs ถ้ายังไม่มี
const uploadDir = path.join(process.cwd(), 'uploads', 'repairs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for repair image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // จัดเก็บตาม shopId/ปี/เดือน เช่น uploads/repairs/shop123/2024/01/
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const shopId = req.user.shopId;
    const uploadPath = `uploads/repairs/${shopId}/${year}/${month}/`;
    
    // สร้างโฟลเดอร์ถ้ายังไม่มี
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'repair-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // จำนวนไฟล์สูงสุด
  }
});

// Image routes (ไม่ต้องใช้ middleware เพื่อให้เข้าถึงได้ง่าย)
router.get('/:repairId/image/:imageIndex', getRepairImage);

// ใช้ middleware กับ routes อื่นๆ
router.use(protect);

// Admin routes
router.get('/admin', isAdmin, getRepairs);

// User routes
router.get('/user', getUserRepairs);
router.post('/', upload.array('images', 5), createRepair); // รองรับการอัปโหลดรูปภาพ
router.put('/:id', upload.array('images', 5), updateRepair); // User can update their own repairs
router.delete('/:id', deleteRepair); // User can delete their own repairs

// Admin routes for status update
router.put('/:id/status', isAdmin, updateRepairStatus);

export default router; 