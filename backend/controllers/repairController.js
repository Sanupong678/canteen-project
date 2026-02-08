import Repair from '../models/repairModel.js';
import Shop from '../models/shopModel.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { createRepairNotification } from './notificationController.js';
import { createAdminRepairNotification } from './adminNotificationController.js';
import { emitToShop, emitToAdmin } from '../socket.js';

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
    // ดึงข้อมูลการแจ้งซ่อมทั้งหมด (ไม่ดึง images เพื่อเพิ่มประสิทธิภาพ)
    const repairs = await Repair.find()
      .select('-images') // ไม่ดึง base64 images เพื่อเพิ่มความเร็ว
      .sort({ createdAt: -1 })
      .lean(); // ใช้ lean() เพื่อเพิ่มความเร็ว

    // รวบรวม shopIds ทั้งหมด
    const shopIds = [...new Set(repairs.map(repair => repair.shopId?.toString()).filter(Boolean))];
    
    // Query shops ทั้งหมดในครั้งเดียว (batch query)
    const shops = await Shop.find({ _id: { $in: shopIds } })
      .select('name canteenId') // เลือกเฉพาะ fields ที่จำเป็น
      .lean();
    
    // สร้าง Map เพื่อ lookup เร็ว
    const shopMap = new Map();
    shops.forEach(shop => {
      shopMap.set(shop._id.toString(), shop);
    });

    // Map ข้อมูล repairs พร้อม shop details
    const repairsWithDetails = repairs.map(repair => {
      const shop = shopMap.get(repair.shopId?.toString());
      return {
        ...repair,
        shopName: shop ? shop.name : 'ไม่ระบุร้านค้า',
        canteen: shop ? `โรงอาหาร${getCanteenName(shop.canteenId)}` : 'ไม่ระบุโรงอาหาร'
      };
    });

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
    // ดึง userId และ shopId จาก token
    const userId = req.user.userId;
    const shopId = req.user.shopId;

    // ตรวจสอบว่ามี userId และ shopId หรือไม่
    if (!userId || !shopId) {
      console.log('User has no userId or shopId:', { userId, shopId });
      return res.json({ 
        data: [],
        message: 'ยังไม่เคยแจ้งซ่อมมาก่อน',
        hasHistory: false
      });
    }

    const repairs = await Repair.find({ userId }).sort({ createdAt: -1 });

    // ถ้าไม่มีประวัติการแจ้งซ่อม
    if (repairs.length === 0) {
      return res.json({ 
        data: [],
        message: 'ยังไม่เคยแจ้งซ่อมมาก่อน',
        hasHistory: false
      });
    }

    res.json({ 
      data: repairs,
      hasHistory: true
    });
  } catch (error) {
    console.error('Error fetching user repairs:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create new repair
export const createRepair = async (req, res) => {
  try {
    console.log('=== REPAIR CREATE DEBUG ===');
    console.log('Token data:', req.user);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Request headers:', req.headers);
    console.log('==========================');
    
    // ดึงข้อมูลจาก token
    const userId = req.user.userId;
    const shopId = req.user.shopId;

    // ตรวจสอบว่ามี userId และ shopId หรือไม่
    if (!userId || !shopId) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบข้อมูลร้านค้าหรือผู้ใช้ กรุณาติดต่อผู้ดูแลระบบ'
      });
    }

    // ดึงข้อมูลที่ user กรอก
    const category = req.body.category;
    const issue = req.body.issue;

    console.log('Extracted data:', { category, issue });

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!category || !issue) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกหมวดหมู่และรายละเอียดปัญหา'
      });
    }

    // จัดการรูปภาพที่อัปโหลด
    const imagePaths = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        imagePaths.push(file.path);
      });
    }

    console.log('Image paths:', imagePaths);

    const newRepair = new Repair({
      userId,
      shopId,
      category,
      issue,
      status: 'pending',
      report_date: new Date(),
      imagePaths: imagePaths // เก็บ path แทน Base64
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
    
    // สร้าง notification สำหรับ admin
    try {
      await createAdminRepairNotification(savedRepair, req.user);
      console.log('✅ Admin repair notification created');
      emitToAdmin('admin:repair:new', { repairId: savedRepair._id, shopId });
    } catch (notificationError) {
      console.error('❌ Error creating admin repair notification:', notificationError);
    }
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
  
  console.log('🔍 Update repair status request:', { id, status, body: req.body });
  
  try {
    // ตรวจสอบว่ามี repair นี้อยู่หรือไม่
    const repair = await Repair.findById(id);
    if (!repair) {
      console.log('❌ Repair not found:', id);
      return res.status(404).json({ message: 'ไม่พบรายการแจ้งซ่อมนี้' });
    }

    console.log('📋 Repair before update:', {
      id: repair._id,
      shopId: repair.shopId,
      status: repair.status,
      category: repair.category
    });

    // อัพเดทสถานะ
    repair.status = status;
    await repair.save();

    console.log('✅ Repair updated successfully:', {
      id: repair._id,
      shopId: repair.shopId,
      status: repair.status,
      category: repair.category
    });

    // สร้าง notification สำหรับ user
    try {
      await createRepairNotification(repair, status);
      console.log('✅ Repair notification created');
      emitToShop(repair.shopId, 'user:repair:updated', { repairId: repair._id, status: repair.status });
    } catch (notificationError) {
      console.error('❌ Error creating repair notification:', notificationError);
    }

    // ดึงข้อมูลร้านค้าเพิ่มเติม
    const shop = await Shop.findById(repair.shopId);
    const repairWithDetails = {
      ...repair.toObject(),
      shopName: shop ? shop.name : 'ไม่ระบุร้านค้า',
      canteen: shop ? `โรงอาหาร${getCanteenName(shop.canteenId)}` : 'ไม่ระบุโรงอาหาร'
    };
    
    res.json(repairWithDetails);
  } catch (error) {
    console.error('❌ Error updating repair status:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update repair (user can update their own repairs if status is pending)
export const updateRepair = async (req, res) => {
  const { id } = req.params;
  const { category, issue } = req.body;
  const userId = req.user.userId;
  const shopId = req.user.shopId;

  try {
    const repair = await Repair.findById(id);
    if (!repair) {
      return res.status(404).json({ 
        success: false,
        message: 'ไม่พบรายการแจ้งซ่อมนี้' 
      });
    }

    // ตรวจสอบว่าเป็นเจ้าของ repair หรือไม่
    if (repair.userId.toString() !== userId.toString() || repair.shopId.toString() !== shopId.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'คุณไม่มีสิทธิ์แก้ไขรายการนี้' 
      });
    }

    // ตรวจสอบว่าสถานะเป็น pending หรือไม่ (แก้ไขได้เฉพาะรายการที่ยังรอดำเนินการ)
    if (repair.status !== 'pending' && repair.status !== 'รอดำเนินการ') {
      return res.status(400).json({ 
        success: false,
        message: 'ไม่สามารถแก้ไขรายการที่กำลังดำเนินการหรือเสร็จสิ้นแล้ว' 
      });
    }

    // อัปเดตข้อมูลหมวดหมู่และรายละเอียดปัญหา
    if (category) {
      repair.category = category;
    }
    if (issue) {
      repair.issue = issue;
    }

    // จัดการรูปภาพ
    // ถ้ามีรูปใหม่ที่อัปโหลดมา ให้เพิ่มเข้าไปใน imagePaths
    if (req.files && req.files.length > 0) {
      // เก็บรูปเดิมไว้ (ถ้ามี)
      const existingImagePaths = repair.imagePaths || [];
      const existingImages = repair.images || [];
      
      // เพิ่มรูปใหม่เข้าไป
      const newImagePaths = req.files.map(file => file.path);
      
      // รวมรูปเดิมกับรูปใหม่
      repair.imagePaths = [...existingImagePaths, ...newImagePaths];
      
      // อัปเดต images array ด้วย (สำหรับ backward compatibility)
      // เพิ่ม path ของรูปใหม่เข้าไปใน images array
      repair.images = [...existingImages, ...newImagePaths];
    }

    // เปลี่ยนสถานะกลับเป็นรออนุมัติ (pending) เพื่อให้ admin ตรวจสอบใหม่
    repair.status = 'pending';

    await repair.save();

    // ดึงข้อมูล repair ใหม่เพื่อให้แน่ใจว่าข้อมูลครบถ้วน
    const updatedRepair = await Repair.findById(id).lean();

    // แปลง _id เป็น string เพื่อให้ frontend ใช้งานได้
    if (updatedRepair) {
      updatedRepair._id = updatedRepair._id.toString();
    }

    res.json({ 
      success: true,
      message: 'อัปเดตรายการแจ้งซ่อมเรียบร้อยแล้ว',
      data: updatedRepair 
    });
  } catch (error) {
    console.error('❌ Error updating repair:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Delete repair
export const deleteRepair = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const shopId = req.user.shopId;

  try {
    const repair = await Repair.findById(id);
    if (!repair) {
      return res.status(404).json({ message: 'ไม่พบรายการแจ้งซ่อมนี้' });
    }

    // ตรวจสอบว่าเป็นเจ้าของ repair หรือไม่
    if (repair.userId.toString() !== userId.toString() || repair.shopId.toString() !== shopId.toString()) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบรายการนี้' });
    }

    // ตรวจสอบว่าสถานะเป็น pending หรือไม่ (ลบได้เฉพาะรายการที่ยังรอดำเนินการ)
    if (repair.status !== 'pending' && repair.status !== 'รอดำเนินการ') {
      return res.status(400).json({ 
        message: 'ไม่สามารถลบรายการที่กำลังดำเนินการหรือเสร็จสิ้นแล้ว' 
      });
    }

    await Repair.findByIdAndDelete(id);
    res.json({ 
      success: true,
      message: 'ลบรายการแจ้งซ่อมเรียบร้อยแล้ว' 
    });
  } catch (error) {
    console.error('❌ Error deleting repair:', error);
    res.status(500).json({ message: error.message });
  }
}; 

// Get repair image
export const getRepairImage = async (req, res) => {
  try {
    const { repairId, imageIndex } = req.params;
    
    const repair = await Repair.findById(repairId);
    if (!repair) {
      return res.status(404).send('Repair not found');
    }

    // ไม่ต้องตรวจสอบสิทธิ์เพื่อให้เข้าถึงได้ง่าย
    // (ในอนาคตอาจเพิ่มการตรวจสอบเพิ่มเติม)

    const imagePaths = repair.imagePaths || [];
    const imageIndexNum = parseInt(imageIndex);
    
    if (imageIndexNum < 0 || imageIndexNum >= imagePaths.length) {
      return res.status(404).send('Image not found');
    }

    const imagePath = imagePaths[imageIndexNum];
    
    if (!fs.existsSync(imagePath)) {
      console.log('Image file not found:', imagePath);
      return res.status(404).send('Image file not found');
    }

    // ส่งรูปภาพแบบปลอดภัยด้วยการดักจับ error ของ stream
    const ext = path.extname(imagePath).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    res.set('Content-Type', contentType);

    const stream = fs.createReadStream(imagePath);
    stream.on('error', (err) => {
      console.error('❌ Stream error while sending repair image:', err);
      if (!res.headersSent) {
        res.status(500).send('Error streaming image');
      } else {
        try { res.end(); } catch (_) {}
      }
    });
    stream.pipe(res);
    
  } catch (error) {
    console.error('Error getting repair image:', error);
    res.status(500).send('Error loading image');
  }
}; 