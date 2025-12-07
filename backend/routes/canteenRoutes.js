import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getCanteens, createCanteen, updateCanteen, deleteCanteen } from '../controllers/canteenController.js';
import Canteen from '../models/canteenModel.js';
import Shop from '../models/shopModel.js';

const router = express.Router();

// สร้างโฟลเดอร์ uploads/canteen ถ้ายังไม่มี
const canteenUploadDir = path.join(process.cwd(), 'uploads', 'canteen');
if (!fs.existsSync(canteenUploadDir)) {
  fs.mkdirSync(canteenUploadDir, { recursive: true });
}

// ตั้งค่า multer สำหรับอัปโหลดรูปภาพ canteen
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, canteenUploadDir);
  },
  filename: function (req, file, cb) {
    // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'canteen-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // จำกัดขนาดไฟล์ 5MB
  },
  fileFilter: function (req, file, cb) {
    // ตรวจสอบประเภทไฟล์
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all canteens
router.get('/', getCanteens);

// Create new canteen
router.post('/', createCanteen);

// Update canteen
router.patch('/:id', upload.single('image'), updateCanteen);

// Delete canteen
router.delete('/:id', deleteCanteen);

// Get canteen by ID
router.get('/:id', async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);
    if (!canteen) {
      return res.status(404).json({ message: 'Canteen not found' });
    }
    res.json(canteen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get shops by canteen ID
router.get('/:id/shops', async (req, res) => {
  try {
    const { id } = req.params;
    const canteen = await Canteen.findById(id);
    if (!canteen) {
      return res.status(404).json({ message: 'Canteen not found' });
    }
    
    // Find shops that belong to this canteen
    const shops = await Shop.find({ canteenId: id });
    res.json({ canteen, shops });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 