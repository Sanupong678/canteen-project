import Repair from '../models/repairModel.js';
import Shop from '../models/Shop.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

// สร้างโฟลเดอร์ uploads/repairs ถ้ายังไม่มี
const uploadDir = path.join(process.cwd(), 'uploads', 'repairs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // ตรวจสอบประเภทไฟล์
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all repairs (admin)
export const getRepairs = async (req, res) => {
  try {
    // ดึงข้อมูลการแจ้งซ่อมทั้งหมด
    const repairs = await Repair.find().sort({ createdAt: -1 });

    // ดึงข้อมูลร้านค้าและโรงอาหารเพิ่มเติม
    const repairsWithDetails = await Promise.all(repairs.map(async (repair) => {
      const shop = await Shop.findById(repair.shopId);
      return {
        ...repair.toObject(),
        shopName: shop ? shop.name : 'ไม่ระบุร้านค้า',
        canteen: shop ? `โรงอาหาร${getCanteenName(shop.canteenId)}` : 'ไม่ระบุโรงอาหาร'
      };
    }));

    res.json({ data: repairsWithDetails });
  } catch (error) {
    console.error('Error fetching repairs:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to get canteen name
function getCanteenName(canteenId) {
  const canteenMap = {
    1: 'C5',
    2: 'D1',
    3: 'Dormitory',
    4: 'E1',
    5: 'E2',
    6: 'Epark',
    7: 'Msquare',
    8: 'Ruemrim',
    9: 'S2'
  };
  return canteenMap[canteenId] || 'ไม่ระบุ';
}

// Get user's repairs
export const getUserRepairs = async (req, res) => {
  try {
    // ดึง userId จาก token
    const userId = req.user.userId;
    const repairs = await Repair.find({ userId }).sort({ createdAt: -1 });
    res.json({ data: repairs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new repair
export const createRepair = async (req, res) => {
  try {
    console.log('Token data:', req.user);
    
    // ดึงข้อมูลจาก token
    const userId = req.user.userId;
    const shopId = req.user.shopId;

    // ดึงข้อมูลที่ user กรอก
    const { category, issue, images = [] } = req.body;

    const newRepair = new Repair({
      userId,
      shopId,
      category,
      issue,
      status: 'pending',
      report_date: new Date(),
      images: Array.isArray(images) ? images : []
    });

    console.log('Attempting to save repair:', newRepair);

    const savedRepair = await newRepair.save();

    // ดึงข้อมูลร้านค้าเพิ่มเติม
    const shop = await Shop.findById(shopId);
    const repairWithDetails = {
      ...savedRepair.toObject(),
      shopName: shop ? shop.name : 'ไม่ระบุร้านค้า',
      canteen: shop ? `โรงอาหาร${getCanteenName(shop.canteenId)}` : 'ไม่ระบุโรงอาหาร'
    };

    console.log('Successfully saved repair:', repairWithDetails);
    
    res.status(201).json({
      success: true,
      data: repairWithDetails
    });
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(400).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
    });
  }
};

// Update repair status
export const updateRepairStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    // ตรวจสอบว่ามี repair นี้อยู่หรือไม่
    const repair = await Repair.findById(id);
    if (!repair) {
      return res.status(404).json({ message: 'ไม่พบรายการแจ้งซ่อมนี้' });
    }

    // อัพเดทสถานะ
    repair.status = status;
    await repair.save();

    // ดึงข้อมูลร้านค้าเพิ่มเติม
    const shop = await Shop.findById(repair.shopId);
    const repairWithDetails = {
      ...repair.toObject(),
      shopName: shop ? shop.name : 'ไม่ระบุร้านค้า',
      canteen: shop ? `โรงอาหาร${getCanteenName(shop.canteenId)}` : 'ไม่ระบุโรงอาหาร'
    };
    
    res.json(repairWithDetails);
  } catch (error) {
    console.error('Error updating repair status:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete repair
export const deleteRepair = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedRepair = await Repair.findByIdAndDelete(id);
    if (!deletedRepair) {
      return res.status(404).json({ message: 'Repair not found' });
    }
    res.json({ message: 'Repair deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 