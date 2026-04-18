import express from 'express';
import Shop from '../models/shopModel.js';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import Evaluation from '../models/Evaluation.js'; // Added import for Evaluation
import Bill from '../models/billModel.js';
import Leave from '../models/leaveModel.js';
import Repair from '../models/repairModel.js';
import Ranking from '../models/rankingModel.js';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';
import { updateShop, createShop } from '../controllers/shopController.js';
import Canteen from '../models/canteenModel.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all shops with optional canteenId filter
router.get('/', async (req, res) => {
  try {
    const { canteenId, includeExpired } = req.query;
    let query = {};
    
    if (canteenId) {
      query.canteenId = parseInt(canteenId);
    }
    
    // เพิ่มเงื่อนไขกรองร้านค้าที่ยังไม่หมดสัญญา (เว้นแต่จะระบุ includeExpired=true)
    if (includeExpired !== 'true') {
      const currentDate = new Date();
      query.contractEndDate = { $gte: currentDate };
    }
    
    const shops = await Shop.find(query);
    console.log(`Found shops with query:`, query, `Count:`, shops.length);
    res.json({ data: shops });
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all shops for C5 canteen
router.get('/c5', async (req, res) => {
  try {
    const currentDate = new Date();
    const shops = await Shop.find({ 
      canteenId: 1,
      contractEndDate: { $gte: currentDate }
    });
    console.log('Found active C5 shops:', shops);
    res.json(shops);
  }catch (error) {
    console.error('Error fetching C5 shops:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all shops for Dormity canteen
router.get('/dormity', async (req, res) => {
  try {
    const currentDate = new Date();
    const shops = await Shop.find({ 
      canteenId: 3,
      contractEndDate: { $gte: currentDate }
    });
    console.log('Found active Dormity shops:', shops);
    res.json(shops);
  }catch (error) {
    console.error('Error fetching Dormity shops:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all shops for D1 canteen
router.get('/d1', async (req, res) => {
  try {
    const currentDate = new Date();
    const shops = await Shop.find({ 
      canteenId: 2,
      contractEndDate: { $gte: currentDate }
    });
    console.log('Found active D1 shops:', shops);
    res.json(shops);
  }catch (error) {
    console.error('Error fetching D1 shops:', error);
    res.status(500).json({ message: error.message });
  }
});

//get all shop for e1 canteen
router.get('/e1', async (req, res) => {
  try {
    const currentDate = new Date();
    const shops = await Shop.find({ 
      canteenId: 4,
      contractEndDate: { $gte: currentDate }
    });
    console.log('Found active E1 shops:', shops);
    res.json(shops);
  }catch (error) {
    console.error('Error fetching E1 shops:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/e2', async (req, res) => {
  try {
    const currentDate = new Date();
    const shops = await Shop.find({ 
      canteenId: 5,
      contractEndDate: { $gte: currentDate }
    });
    console.log('Found active E2 shops:', shops);
    res.json(shops);
  }catch (error) {
    console.error('Error fetching E2 shops:', error);
    res.status(500).json({ message: error.message });
  }
});
  //get all shop for epark canteen
router.get('/epark', async (req, res) => {
  try {
    const currentDate = new Date();
    const shops = await Shop.find({ 
      canteenId: 6,
      contractEndDate: { $gte: currentDate }
    });
    console.log('Found active Epark shops:', shops);
    res.json(shops);
  }catch (error) {
    console.error('Error fetching Epark shops:', error);
    res.status(500).json({ message: error.message });
  }
});
  //get all shop for msquare canteen
router.get('/msquare', async (req, res) => {
  try {
    const currentDate = new Date();
    const shops = await Shop.find({ 
      canteenId: 7,
      contractEndDate: { $gte: currentDate }
    });
    console.log('Found active Msquare shops:', shops);
    res.json(shops);
  }catch (error) {
    console.error('Error fetching Msquare shops:', error);
    res.status(500).json({ message: error.message });
  }
});
//get all shop for ruemrim canteen
router.get('/ruemrim', async (req, res) => {
  try {
    const currentDate = new Date();
    const shops = await Shop.find({ 
      canteenId: 8,
      contractEndDate: { $gte: currentDate }
    });
    console.log('Found active RuemRim shops:', shops);
    res.json(shops);
  }catch (error) {
    console.error('Error fetching RuemRim shops:', error);
    res.status(500).json({ message: error.message });
  }
});

//get all shop for s2 canteen
router.get('/s2', async (req, res) => {
  try {
    const currentDate = new Date();
    const shops = await Shop.find({ 
      canteenId: 9,
      contractEndDate: { $gte: currentDate }
    });
    console.log('Found active S2 shops:', shops);
    res.json(shops);
  }catch (error) {
    console.error('Error fetching S2 shops:', error);
    res.status(500).json({ message: error.message });
  }
});

// Debug: find shops by exact name(s) and show canteenId
router.get('/debug/by-name', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ message: 'Query param "name" is required' });
    }
    const shop = await Shop.findOne({ name });
    if (!shop) {
      return res.status(404).json({ message: `Shop not found for name: ${name}` });
    }
    return res.json({ _id: shop._id, name: shop.name, canteenId: shop.canteenId ?? null });
  } catch (error) {
    console.error('Error in /debug/by-name:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/debug/by-names', async (req, res) => {
  try {
    const { names } = req.query;
    if (!names) {
      return res.status(400).json({ message: 'Query param "names" is required (comma-separated)' });
    }
    const list = String(names)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (list.length === 0) {
      return res.status(400).json({ message: 'No valid names provided' });
    }
    const shops = await Shop.find({ name: { $in: list } });
    const result = list.map(n => {
      const found = shops.find(s => s.name === n);
      return found ? { _id: found._id, name: found.name, canteenId: found.canteenId ?? null } : { name: n, notFound: true };
    });
    return res.json({ data: result });
  } catch (error) {
    console.error('Error in /debug/by-names:', error);
    res.status(500).json({ message: error.message });
  }
});

// Debug: list shops missing canteenId
router.get('/debug/missing-canteen', async (req, res) => {
  try {
    const shops = await Shop.find({ $or: [ { canteenId: { $exists: false } }, { canteenId: null } ] });
    const result = shops.map(s => ({ _id: s._id, name: s.name, canteenId: s.canteenId ?? null }));
    res.json({ count: result.length, data: result });
  } catch (error) {
    console.error('Error in /debug/missing-canteen:', error);
    res.status(500).json({ message: error.message });
  }
});
// Function สำหรับสร้าง customId ใหม่ (copy จาก shopController)
const canteenAbbreviations = {
  'โรงอาหาร C5': 'C5',
  'โรงอาหาร D1': 'D1', 
  'โรงอาหาร Dormity': 'D',
  'โรงอาหาร E1': 'E1',
  'โรงอาหาร E2': 'E2',
  'โรงอาหาร Epark': 'EP',
  'โรงอาหาร Msquare': 'MQ',
  'โรงอาหาร RuemRim': 'RRN',
  'โรงอาหาร S2': 'S2'
};

async function generateNewCustomId(canteenId) {
  try {
    // ดึงข้อมูลโรงอาหาร
    const canteen = await Canteen.findOne({ canteenId });
    if (!canteen) {
      throw new Error(`ไม่พบโรงอาหารที่มี canteenId: ${canteenId}`);
    }
    
    const canteenName = canteen.name;
    const abbreviation = canteenAbbreviations[canteenName];
    
    if (!abbreviation) {
      throw new Error(`ไม่พบชื่อย่อสำหรับโรงอาหาร: ${canteenName}`);
    }
    
    // หาเลขลำดับถัดไป
    let nextNumber = 1;
    const pattern = new RegExp(`^${abbreviation}(\\d{3})$`);
    
    // หาเลขสูงสุดที่มีอยู่แล้ว
    const existingShops = await Shop.find({
      customId: { $regex: pattern }
    });
    
    if (existingShops.length > 0) {
      const existingNumbers = existingShops
        .map(shop => {
          const match = shop.customId.match(pattern);
          return match ? parseInt(match[1]) : 0;
        })
        .sort((a, b) => b - a);
      
      nextNumber = existingNumbers[0] + 1;
    }
    
    // สร้าง customId ใหม่ (3 หลัก)
    return `${abbreviation}${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating customId:', error);
    throw error;
  }
}

// Create a new shop
router.post('/', async (req, res) => {
  try {
    console.log('Creating new shop with data:', req.body);
    
    // ตรวจสอบ canteenId
    if (!req.body.canteenId) {
      return res.status(400).json({ message: 'canteenId is required' });
    }
    
    // Create user account first
    const { credentials } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(credentials.password, salt);
    
    const user = new User({
      name: req.body.name,
      password: hashedPassword,
      role: 'shop',
      department: 'Shop',
      position: 'Shop Owner'
    });
    
    const savedUser = await user.save();
    console.log('Created new user:', savedUser);
    
    // สร้าง customId ใหม่ตามรูปแบบที่กำหนด (C5001, D1001, etc.)
    const newCustomId = await generateNewCustomId(req.body.canteenId);
    console.log('Generated customId:', newCustomId);

    // Validate and normalize googleEmail if provided
    let googleEmail = null;
    if (credentials.googleEmail && typeof credentials.googleEmail === 'string') {
      const email = credentials.googleEmail.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && emailRegex.test(email)) {
        googleEmail = email;
      }
    }

    // Create shop with user reference and hashed password
    const shopCredentials = {
      username: credentials.username.trim(), // trim whitespace
      password: credentials.password, // เก็บไว้สำหรับ fallback (ไม่ควรใช้)
      password_hash: hashedPassword, // ใช้ password_hash สำหรับ login
      status: 'active'
    };
    if (googleEmail) {
      shopCredentials.googleEmail = googleEmail;
    }

    const shop = new Shop({
      ...req.body,
      customId: newCustomId,
      canteenId: parseInt(req.body.canteenId), // แปลงเป็น number
      credentials: shopCredentials,
      userId: savedUser._id
    });
    
    console.log('Shop data before save:', {
      username: shop.credentials.username,
      hasPasswordHash: !!shop.credentials.password_hash,
      passwordHashLength: shop.credentials.password_hash?.length
    });
    
    const newShop = await shop.save();
    console.log('Created new shop:', {
      id: newShop._id,
      name: newShop.name,
      customId: newShop.customId,
      username: newShop.credentials.username,
      hasPasswordHash: !!newShop.credentials.password_hash,
      passwordHashLength: newShop.credentials.password_hash?.length
    });
    
    // ตรวจสอบว่า password_hash ถูกเก็บจริงๆ
    const verifyShop = await Shop.findById(newShop._id);
    if (!verifyShop.credentials.password_hash) {
      console.error('⚠️ WARNING: password_hash not saved! Re-saving...');
      verifyShop.credentials.password_hash = hashedPassword;
      await verifyShop.save();
      console.log('✅ password_hash re-saved');
    }
    
    // Update user with shop reference
    savedUser.shopId = newShop._id;
    await savedUser.save();
    
    res.status(201).json(newShop);
  } catch (error) {
    console.error('Error creating shop:', error);
    
    // จัดการ error สำหรับ duplicate customId
    if (error.code === 11000 && error.keyPattern && error.keyPattern.customId) {
      return res.status(400).json({ 
        message: `รหัสร้านค้า ${req.body.customId || 'ที่สร้างอัตโนมัติ'} มีอยู่แล้ว กรุณาลองใหม่อีกครั้ง`,
        errorType: 'duplicate_customId',
        field: 'customId'
      });
    }
    
    // จัดการ error สำหรับ duplicate username
    if (error.code === 11000 && error.keyPattern && error.keyPattern['credentials.username']) {
      return res.status(400).json({ 
        message: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว กรุณาเปลี่ยนชื่อใหม่',
        errorType: 'duplicate_username',
        field: 'username'
      });
    }
    
    // จัดการ error อื่นๆ
    res.status(400).json({ message: error.message });
  }
});

// Update a shop - ใช้ controller เพื่อให้แน่ใจว่าอัปเดต database และ Bill ที่เกี่ยวข้อง
router.put('/:id', updateShop);

// Delete a shop
router.delete('/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // ลบข้อมูลที่ผูกกับ shopId ออกทั้งหมดก่อนลบร้าน
    // เพื่อป้องกันข้อมูลค้างในหน้า repair/leave/bill/ranking(evaluation)
    const [repairResult, leaveResult, billResult, evaluationResult, rankingResult] = await Promise.all([
      Repair.deleteMany({ shopId: shop._id }),
      Leave.deleteMany({ shopId: shop._id }),
      Bill.deleteMany({ shopId: shop._id }),
      Evaluation.deleteMany({ shopId: shop._id }),
      Ranking.deleteMany({ shopName: shop.name })
    ]);

    // ลบร้าน
    await Shop.findByIdAndDelete(shop._id);

    // ลบ user ที่ถูกสร้างให้ร้านค้านี้ (ถ้ามี)
    if (shop.userId) {
      await User.findByIdAndDelete(shop.userId);
    }

    res.json({
      message: 'Shop and related data deleted successfully',
      deleted: {
        shopId: shop._id,
        userId: shop.userId || null,
        repairs: repairResult.deletedCount || 0,
        leaves: leaveResult.deletedCount || 0,
        bills: billResult.deletedCount || 0,
        evaluations: evaluationResult.deletedCount || 0,
        rankings: rankingResult.deletedCount || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single shop
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update shop password
router.patch('/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update shop password
    shop.credentials.password = password;        // เก็บรหัสผ่านต้นฉบับ
    shop.credentials.password_hash = hashedPassword;  // เก็บรหัสผ่านที่เข้ารหัสแล้ว
    await shop.save();

    // Update associated user password if exists
    if (shop.userId) {
      const user = await User.findById(shop.userId);
      if (user) {
        user.password = hashedPassword;
        await user.save();
      }
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update existing shop passwords to be hashed
router.post('/update-passwords', async (req, res) => {
  try {
    const shops = await Shop.find({});
    let updatedCount = 0;

    for (const shop of shops) {
      // Skip if password is already hashed (bcrypt hashed passwords start with $2)
      if (shop.credentials.password_hash && shop.credentials.password_hash.startsWith('$2')) {
        continue;
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(shop.credentials.password || '', salt);

      // Update the shop's password
      shop.credentials.password = shop.credentials.password;  // เก็บรหัสผ่านต้นฉบับ
      shop.credentials.password_hash = hashedPassword;        // เก็บรหัสผ่านที่เข้ารหัสแล้ว
      await shop.save();
      updatedCount++;

      // Also update the associated user's password if exists
      if (shop.userId) {
        const user = await User.findById(shop.userId);
        if (user) {
          user.password = hashedPassword;
          await user.save();
        }
      }
    }

    res.json({ 
      message: `Updated ${updatedCount} shop passwords to be hashed`,
      updatedCount 
    });
  } catch (error) {
    console.error('Error updating shop passwords:', error);
    res.status(500).json({ message: error.message });
  }
});

// Reset all shop scores
router.post('/reset-all-scores', async (req, res) => {
  try {
    // อัปเดตคะแนนของร้านค้าทั้งหมดให้เป็น 100
    await Shop.updateMany({}, { 
      score: 100, 
      evaluationStatus: 'ไม่ผ่าน',
      evaluationCompleted: false,
      evaluationDate: null
    });
    
    // ลบการประเมินเก่าทั้งหมด
    await Evaluation.updateMany({}, { isActive: false });
    
    res.json({ message: 'Reset scores successfully' });
  } catch (error) {
    console.error('Error resetting scores:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get expired shops for canteen management (all shops including expired)
router.get('/canteen/:canteenId', async (req, res) => {
  try {
    const { canteenId } = req.params;
    // เลือกเฉพาะ fields ที่จำเป็นเพื่อลดขนาดข้อมูลและเพิ่มความเร็ว
    // ไม่ดึง image (base64) เพราะใช้เวลานานในการโหลดและส่งข้อมูล
    // image จะถูกดึงเมื่อต้องการแสดงรายละเอียดเท่านั้น
    const shops = await Shop.find({ canteenId: parseInt(canteenId) })
      .select('-image -credentials.password -credentials.password_hash')
      .lean(); // ใช้ lean() เพื่อเพิ่มความเร็วในการ query
    console.log(`Found all shops for canteen ${canteenId}:`, shops.length);
    res.json(shops);
  } catch (error) {
    console.error('Error fetching canteen shops:', error);
    res.status(500).json({ message: error.message });
  }
});

// Debug: Check evaluation data
router.get('/debug/evaluation-data', async (req, res) => {
  try {
    console.log('=== DEBUG: Checking Evaluation Data ===');
    
    const shops = await Shop.find().select('name evaluationCompleted evaluationDate score evaluationStatus');
    
    console.log('All shops evaluation data:');
    shops.forEach(shop => {
      console.log(`Shop: ${shop.name}`);
      console.log(`  - evaluationCompleted: ${shop.evaluationCompleted}`);
      console.log(`  - evaluationDate: ${shop.evaluationDate}`);
      console.log(`  - score: ${shop.score}`);
      console.log(`  - evaluationStatus: ${shop.evaluationStatus}`);
      console.log('---');
    });
    
    res.json({
      success: true,
      data: shops,
      message: 'Evaluation data checked successfully'
    });
  } catch (error) {
    console.error('Error checking evaluation data:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Debug endpoint to show exact database values
router.get('/debug/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    console.log('🔍 Debug request for shop ID:', shopId);
    
    const shop = await Shop.findById(shopId);
    if (!shop) {
      console.log('❌ Shop not found');
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    console.log('✅ Found shop in database:', {
      _id: shop._id,
      name: shop.name,
      canteenId: shop.canteenId,
      revenue: shop.revenue,
      score: shop.score,
      evaluationCompleted: shop.evaluationCompleted,
      evaluationStatus: shop.evaluationStatus,
      evaluationDate: shop.evaluationDate
    });
    
    res.json({
      message: 'Shop data from database',
      shop: {
        _id: shop._id,
        name: shop.name,
        canteenId: shop.canteenId,
        revenue: shop.revenue,
        score: shop.score,
        evaluationCompleted: shop.evaluationCompleted,
        evaluationStatus: shop.evaluationStatus,
        evaluationDate: shop.evaluationDate
      }
    });
  } catch (error) {
    console.error('❌ Error in debug endpoint:', error);
    res.status(500).json({ message: error.message });
  }
});

// Debug endpoint to check upload
router.post('/debug-upload', upload.any(), (req, res) => {
  console.log('🔍 Debug upload request:');
  console.log('Headers:', req.headers);
  console.log('Body keys:', Object.keys(req.body));
  console.log('Files:', req.files);
  console.log('File:', req.file);
  
  res.json({
    success: true,
    message: 'Debug info logged to console',
    headers: req.headers,
    bodyKeys: Object.keys(req.body),
    files: req.files,
    file: req.file
  });
});

// Get shop details by shopId (for user)
router.get('/details/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    
    console.log('🔍 Getting shop details for shopId:', shopId);
    console.log('🔍 ShopId type:', typeof shopId);
    console.log('🔍 ShopId value:', shopId);
    
    const shop = await Shop.findById(shopId);
    
    console.log('🔍 Shop found in database:', shop ? 'YES' : 'NO');
    if (shop) {
      console.log('🔍 Shop details:', {
        _id: shop._id,
        name: shop.name,
        customId: shop.customId
      });
    } else {
      console.log('❌ No shop found with ID:', shopId);
      
      // ลองหา shop ทั้งหมดเพื่อ debug
      const allShops = await Shop.find({}).select('_id name customId userId');
      console.log('🔍 All shops in database:', allShops);
      
      // ลองหา shop ที่มี userId ตรงกับ shopId
      const shopByUserId = await Shop.findOne({ userId: shopId });
      if (shopByUserId) {
        console.log('🔍 Found shop by userId:', {
          _id: shopByUserId._id,
          name: shopByUserId.name,
          customId: shopByUserId.customId,
          userId: shopByUserId.userId
        });
      }
    }
    
    if (!shop) {
      // ลองหา shop โดย userId
      console.log('🔍 Trying to find shop by userId:', shopId);
      const shopByUserId = await Shop.findOne({ userId: shopId });
      
      if (shopByUserId) {
        console.log('✅ Found shop by userId:', shopByUserId._id);
        // ใช้ shop ที่หาได้โดย userId
        const shopData = {
          _id: shopByUserId._id,
          name: shopByUserId.name,
          customId: shopByUserId.customId,
          type: shopByUserId.type,
          description: shopByUserId.description,
          location: shopByUserId.location,
          contractStartDate: shopByUserId.contractStartDate,
          contractEndDate: shopByUserId.contractEndDate,
          image: shopByUserId.image,
          canteenId: shopByUserId.canteenId,
          score: shopByUserId.score,
          evaluationStatus: shopByUserId.evaluationStatus,
          evaluationCompleted: shopByUserId.evaluationCompleted,
          evaluationDate: shopByUserId.evaluationDate,
          credentials: shopByUserId.credentials,
          createdAt: shopByUserId.createdAt,
          updatedAt: shopByUserId.updatedAt
        };
        
        console.log('✅ Shop details retrieved successfully (by userId)');
        console.log('🔍 Shop description from DB:', shopByUserId.description);
        console.log('🔍 Shop description type:', typeof shopByUserId.description);
        console.log('🔍 ShopData description:', shopData.description);
        
        return res.json({
          success: true,
          data: shopData
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลร้านค้า'
      });
    }
    
    // ส่งข้อมูลจาก Shop Collection เท่านั้น
    const shopData = {
      _id: shop._id,
      name: shop.name,
      customId: shop.customId,
      type: shop.type,
      description: shop.description,
      location: shop.location,
      contractStartDate: shop.contractStartDate,
      contractEndDate: shop.contractEndDate,
      image: shop.image,
      canteenId: shop.canteenId,
      score: shop.score,
      evaluationStatus: shop.evaluationStatus,
      evaluationCompleted: shop.evaluationCompleted,
      evaluationDate: shop.evaluationDate,
      credentials: shop.credentials, // ← ข้อมูลจาก Shop Collection
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt
    };
    
    console.log('✅ Shop details retrieved successfully');
    console.log('🔍 Shop description from DB:', shop.description);
    console.log('🔍 Shop description type:', typeof shop.description);
    console.log('🔍 ShopData description:', shopData.description);
    
    res.json({
      success: true,
      data: shopData
    });
    
  } catch (error) {
    console.error('❌ Error getting shop details:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลร้านค้า',
      error: error.message
    });
  }
});

// Update shop password
// ใช้ middleware protect เพื่อตรวจสอบ authentication
router.put('/update-password/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { newPassword } = req.body;
    
    console.log('🔍 Updating password for shopId:', shopId);
    console.log('👤 Authenticated user:', {
      userId: req.user?._id,
      shopId: req.user?.shopId,
      role: req.user?.role
    });
    
    // ตรวจสอบว่ามี newPassword หรือไม่
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุรหัสผ่านใหม่'
      });
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
      });
    }
    
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่ 1 ตัว'
      });
    }
    
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านต้องมีตัวอักษรพิมพ์เล็ก 1 ตัว'
      });
    }
    
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านต้องมีตัวเลข 1 ตัว'
      });
    }
    
    // Find shop
    const shop = await Shop.findById(shopId);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลร้านค้า'
      });
    }
    
    // ตรวจสอบสิทธิ์: ตรวจสอบว่า user เป็นเจ้าของ shop จริงๆ
    // Admin สามารถเปลี่ยนรหัสผ่านของ shop ใดก็ได้
    // User (shop owner) สามารถเปลี่ยนรหัสผ่านของตัวเองเท่านั้น
    const isAdmin = req.user?.role === 'admin';
    const isShopOwner = req.user?.shopId?.toString() === shopId.toString() || 
                        req.user?._id?.toString() === shopId.toString();
    
    if (!isAdmin && !isShopOwner) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เปลี่ยนรหัสผ่านของร้านค้านี้'
      });
    }
    
    // ตรวจสอบว่า shop มี userId หรือไม่ (ใช้ shop.userId ไม่ใช่ shop.credentials.userId)
    if (!shop.userId) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการเข้าสู่ระบบของร้านค้านี้'
      });
    }
    
    // Hash password ใหม่
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // อัปเดต password ใน User model
    await User.findByIdAndUpdate(shop.userId, {
      password: hashedPassword,
      updatedAt: new Date()
    });
    
    // อัปเดต password ใน Shop model (credentials.password_hash)
    shop.credentials.password_hash = hashedPassword;
    shop.credentials.password = newPassword; // เก็บรหัสผ่านต้นฉบับไว้ด้วย (ถ้าจำเป็น)
    shop.credentials.updatedAt = new Date();
    await shop.save();
    
    console.log('✅ Password updated successfully for shop:', shop.name);
    
    res.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว'
    });
    
  } catch (error) {
    console.error('❌ Error updating password:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน',
      error: error.message
    });
  }
});

// Import revenue from Excel file
router.post('/import-revenue', (req, res) => {
  upload.any()(req, res, async (err) => {
    try {
      // Handle multer errors
      if (err) {
        console.error('❌ Multer error:', err.message);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)'
          });
        }
        if (err.message === 'Only Excel files are allowed!') {
          return res.status(400).json({
            success: false,
            message: 'กรุณาอัปโหลดไฟล์ Excel เท่านั้น (.xlsx, .xls)'
          });
        }
        if (err.message.includes('Unexpected field')) {
          return res.status(400).json({
            success: false,
            message: 'Field name ต้องเป็น "excelFile"'
          });
        }
        return res.status(400).json({
          success: false,
          message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ' + err.message
        });
      }

      // ตรวจสอบไฟล์ที่อัปโหลด (รองรับหลายชื่อ field)
      const uploadedFile = req.file || req.files?.[0];
      if (!uploadedFile) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาอัปโหลดไฟล์ Excel'
        });
      }

    console.log('📁 Processing Excel file:', uploadedFile.filename);
    console.log('📁 Field name:', uploadedFile.fieldname);

    // Read Excel file
    const workbook = xlsx.readFile(uploadedFile.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // อ่านข้อมูลทั้งหมดในไฟล์ (ไม่จำกัด range)
    const allRows = xlsx.utils.sheet_to_json(sheet, { 
      defval: null // ใช้ null สำหรับ cell ที่ว่าง
    });
    
    console.log(`📊 Found ${allRows.length} total rows in Excel file`);
    
    // หา header sections ทั้งหมดในไฟล์
    const headerSections = [];
    let currentSection = null;
    
    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      if (!row || Object.keys(row).length === 0) continue;
      
      // ตรวจสอบว่าเป็น header row หรือไม่ โดยดูที่ค่าทั้งหมดใน row
      const rowValues = Object.values(row);
      const hasShopIdHeader = rowValues.some(val => 
        val && val.toString().toLowerCase().includes('shopid') || 
        val && val.toString().toLowerCase().includes('shop')
      );
      const hasMonthHeader = rowValues.some(val => 
        val && val.toString().toLowerCase().includes('month')
      );
      const hasYearHeader = rowValues.some(val => 
        val && val.toString().toLowerCase().includes('year')
      );
      const hasRevenueHeader = rowValues.some(val => 
        val && val.toString().toLowerCase().includes('revenue')
      );
      
      // ตรวจสอบว่าเป็น header row ที่มีครบทั้ง 4 คอลัมน์
      if (hasShopIdHeader && hasMonthHeader && hasYearHeader && hasRevenueHeader) {
        
        // บันทึก section เก่า (ถ้ามี)
        if (currentSection) {
          headerSections.push(currentSection);
        }
        
        // หา column positions สำหรับ header นี้
        const columnMap = {};
        Object.keys(row).forEach(key => {
          const value = row[key];
          if (value && value.toString().toLowerCase().includes('shopid')) {
            columnMap.shopId = key;
          } else if (value && value.toString().toLowerCase().includes('month')) {
            columnMap.month = key;
          } else if (value && value.toString().toLowerCase().includes('year')) {
            columnMap.year = key;
          } else if (value && value.toString().toLowerCase().includes('revenue')) {
            columnMap.revenue = key;
          }
        });
        
        // เริ่ม section ใหม่
        currentSection = {
          headerRow: i,
          dataStartRow: i + 1,
          dataEndRow: allRows.length - 1, // จะอัปเดตเมื่อเจอ header ใหม่
          columnMap: columnMap // เก็บตำแหน่งคอลัมน์
        };
        
        console.log(`🎯 พบ header section ที่ row ${i + 1}:`, columnMap);
      }
    }
    
    // บันทึก section สุดท้าย
    if (currentSection) {
      headerSections.push(currentSection);
    }
    
    console.log(`📋 พบ ${headerSections.length} header sections`);
    
    // ใช้ข้อมูลทั้งหมด (จะกรองใน loop ถัดไป)
    const rows = allRows;

    // Debug: แสดงข้อมูล header sections
    console.log('🔍 Header sections found:');
    headerSections.forEach((section, index) => {
      console.log(`Section ${index + 1}: Header at row ${section.headerRow + 1}, Data from row ${section.dataStartRow + 1} to ${section.dataEndRow + 1}`);
    });

    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const results = [];

    // Process each row
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      
      try {
        // Skip empty rows
        if (!row || Object.keys(row).length === 0) {
          continue;
        }
        
        // ตรวจสอบว่า row นี้อยู่ใน data section หรือไม่
        const isInDataSection = headerSections.some(section => 
          rowIndex >= section.dataStartRow && rowIndex <= section.dataEndRow
        );
        
        if (!isInDataSection) {
          console.log(`⏭️ ข้าม row ${rowIndex + 1} (ไม่อยู่ใน data section)`);
          continue;
        }

        // หา section ที่ row นี้อยู่ใน
        const currentSection = headerSections.find(section => 
          rowIndex >= section.dataStartRow && rowIndex <= section.dataEndRow
        );
        
        if (!currentSection) {
          console.log(`❌ ไม่พบ section สำหรับ row ${rowIndex + 1}`);
          continue;
        }
        
        // ใช้ column map จาก section นี้
        const columnMap = currentSection.columnMap;
        let shopId = row[columnMap.shopId];
        const month = row[columnMap.month];
        const year = row[columnMap.year];
        const revenue = row[columnMap.revenue];

        // ทำความสะอาด shopId (ลบ \r\n และ whitespace)
        if (shopId) {
          shopId = shopId.toString().replace(/[\r\n\t]/g, '').trim();
        }

        console.log(`🔍 แยกข้อมูล (Section ${headerSections.indexOf(currentSection) + 1}): shopId="${shopId}", month=${month}, year=${year}, revenue=${revenue}`);

        // Skip header rows (rows that contain text like "shopId", "revenue", etc.)
        if (shopId === 'shopId' || shopId === 'ShopID' || 
            month === 'month' || month === 'Month' ||
            year === 'year' || year === 'Year' ||
            revenue === 'revenue' || revenue === 'Revenue') {
          console.log(`⏭️ ข้าม header row: shopId=${shopId}, month=${month}, year=${year}, revenue=${revenue}`);
          continue;
        }

        // Skip rows with empty shopId or non-shop data
        if (!shopId || shopId === '' || shopId === null || 
            !month || !year || (revenue === null || revenue === undefined || revenue === '')) {
          const error = `ข้อมูลไม่ครบหรือผิดพลาด: shopId=${shopId}, month=${month}, year=${year}, revenue=${revenue}`;
          console.log('❌', error);
          errors.push(error);
          errorCount++;
          continue;
        }

        // Convert revenue to number
        const revenueNumber = parseFloat(revenue);
        if (isNaN(revenueNumber)) {
          const error = `revenue ไม่ใช่ตัวเลข: ${revenue}`;
          console.log('❌', error);
          errors.push(error);
          errorCount++;
          continue;
        }

        // Find shop by customId only (ไม่ใช้ _id)
        const shop = await Shop.findOne({ customId: shopId });

        if (!shop) {
          const error = `ไม่พบร้านค้า: customId=${shopId}`;
          console.log('❌', error);
          errors.push(error);
          errorCount++;
          continue;
        }

        console.log(`✅ พบร้านค้า: ${shop.name} (${shop.customId})`);

        console.log(`🔍 ค้นหาการประเมิน: shopId=${shop._id}, month=${parseInt(month)}, year=${parseInt(year)}`);

        // ตรวจสอบว่ามีการประเมินอยู่หรือไม่
        const existingEvaluations = await Evaluation.find({
          shopId: shop._id,
          evaluationMonth: parseInt(month),
          evaluationYear: parseInt(year)
        });

        console.log(`📊 พบการประเมิน ${existingEvaluations.length} รายการสำหรับร้าน ${shop.name}`);

        // อัปเดต revenue ในการประเมินที่มีอยู่ (ถ้ามี)
        const result = await Evaluation.updateMany(
          {
            shopId: shop._id,
            evaluationMonth: parseInt(month),
            evaluationYear: parseInt(year)
          },
          { $set: { revenue: revenueNumber, isActive: true } }
        );

        if (result.modifiedCount > 0) {
          const successMsg = `อัปเดตรายได้ร้าน ${shop.name} (${shop.customId}) เดือน ${month}/${year} => ${revenueNumber} บาท (${result.modifiedCount} การประเมิน)`;
          console.log('✅', successMsg);
          results.push(successMsg);
          successCount++;
        } else {
          // สร้าง Evaluation ใหม่เพื่อเก็บ revenue
          const newEvaluation = new Evaluation({
            shopId: shop._id,
            evaluationMonth: parseInt(month),
            evaluationYear: parseInt(year),
            revenue: revenueNumber,
            totalScore: 0,
            finalStatus: 'ไม่ผ่าน',
            evaluationSent: false,
            isActive: true,
            resetId: 1
          });

          await newEvaluation.save();

          const successMsg = `สร้างการประเมินใหม่และอัปเดตรายได้ร้าน ${shop.name} (${shop.customId}) เดือน ${month}/${year} => ${revenueNumber} บาท`;
          console.log('✅', successMsg);
          results.push(successMsg);
          successCount++;
        }

      } catch (error) {
        const errorMsg = `เกิดข้อผิดพลาดในการประมวลผลแถว: ${JSON.stringify(row)} - ${error.message}`;
        console.log('❌', errorMsg);
        errors.push(errorMsg);
        errorCount++;
      }
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(uploadedFile.path);
      console.log('🗑️ Cleaned up uploaded file:', uploadedFile.filename);
    } catch (cleanupError) {
      console.log('⚠️ Could not clean up file:', cleanupError.message);
    }

      // Return response
      res.json({
        success: true,
        message: 'อัปเดตรายได้เสร็จสิ้น',
        summary: {
          totalRows: rows.length,
          successCount,
          errorCount
        },
        results,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('❌ Error importing revenue:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์',
        error: error.message
      });
    }
  });
});

export default router; 