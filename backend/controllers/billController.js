import Bill from '../models/billModel.js';
import Shop from '../models/Shop.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';
import { createBillNotification } from './notificationController.js';
import { createAdminBillNotification } from './adminNotificationController.js';
import { emitToShop, emitToAdmin } from '../socket.js';

// Get current file directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload bill slip
export const uploadBill = async (req, res) => {
  try {
    console.log('\n=== UPLOAD BILL CONTROLLER DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Request user:', req.user);
    
    // ตรวจสอบ user authentication
    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const { billId, transferDate } = req.body;
    
    // ตรวจสอบ billId
    if (!billId) {
      console.log('❌ billId missing in request body');
      return res.status(400).json({ success: false, error: 'billId is required' });
    }
    
    console.log('🔍 Looking for bill with ID:', billId);
    const bill = await Bill.findById(billId);
    
    if (!bill) {
      console.log('❌ Bill not found for billId:', billId);
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    
    console.log('✅ Bill found:', {
      id: bill._id,
      shopId: bill.shopId,
      userShopId: req.user.shopId,
      dueDate: bill.dueDate,
      contractEndDate: bill.contractEndDate
    });
    
    // ตรวจสอบว่า bill นี้เป็นของ user นี้หรือไม่
    if (bill.shopId.toString() !== req.user.shopId.toString()) {
      console.log('❌ Unauthorized access to bill. User shopId:', req.user.shopId, 'Bill shopId:', bill.shopId);
      return res.status(403).json({ success: false, error: 'Unauthorized access to this bill' });
    }
    
    // ตรวจสอบและสร้าง dueDate ถ้าไม่มี
    if (!bill.dueDate) {
      console.log('⚠️ No dueDate found, creating default dueDate');
      bill.dueDate = bill.contractEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    
    // ตรวจสอบไฟล์
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    console.log('✅ File uploaded successfully:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size
    });
    
    // บันทึกข้อมูลรูปภาพ
    bill.image = path.basename(req.file.path);
    bill.imagePath = req.file.path;
    bill.slip_image_url = `/uploads/${req.file.path.replace(/\\/g, '/')}`;
    bill.imageUploadDate = new Date();
    bill.imageExpiryDate = new Date(Date.now() + (5 * 365 * 24 * 60 * 60 * 1000)); // 5 ปี
    bill.payment_date = transferDate ? new Date(transferDate) : new Date();
    
    // ตรวจสอบว่าอัปโหลดเกินกำหนดหรือไม่
    const dueDate = new Date(bill.dueDate);
    const uploadDate = new Date();
    
    if (uploadDate > dueDate) {
      bill.status = 'เลยกำหนด'; // ถ้าเกินกำหนด
      console.log('⚠️ Bill uploaded after due date - status: เลยกำหนด');
    } else {
      bill.status = 'รอตรวจสอบ'; // ถ้าอยู่ในกำหนด - เปลี่ยนเป็น รอตรวจสอบ
      console.log('✅ Bill uploaded within due date - status: รอตรวจสอบ');
    }
    
    console.log('💾 Saving bill with updated data...');
    await bill.save();
    
    console.log('✅ Bill updated successfully');
    console.log('=== UPLOAD BILL CONTROLLER COMPLETED ===\n');
    
    // สร้าง notification สำหรับ admin
    try {
      await createAdminBillNotification(bill, req.user);
      console.log('✅ Admin bill notification created');
      // Realtime: notify admin list updated
      emitToAdmin('admin:bill:newUpload', { billId: bill._id, shopId: bill.shopId });
    } catch (notificationError) {
      console.error('❌ Error creating admin bill notification:', notificationError);
    }

    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    console.error('❌ UPLOAD BILL ERROR:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get bill history for a shop
export const getBillHistory = async (req, res) => {
  try {
    const bills = await Bill.find({ shopId: req.user.shopId })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: bills });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Admin verify bill
export const verifyBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_comment } = req.body;

    console.log('🔍 Verify bill request:', { id, status, admin_comment, body: req.body });

    const bill = await Bill.findById(id);
    if (!bill) {
      console.log('❌ Bill not found:', id);
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    console.log('📋 Bill before update:', {
      id: bill._id,
      shopId: bill.shopId,
      status: bill.status,
      billType: bill.billType
    });

    bill.status = status;
    bill.admin_comment = admin_comment;
    await bill.save();

    console.log('✅ Bill updated successfully:', {
      id: bill._id,
      shopId: bill.shopId,
      status: bill.status,
      billType: bill.billType
    });

    // สร้าง notification สำหรับ user
    try {
      await createBillNotification(bill, status);
      console.log('✅ Bill notification created');
      // Realtime: notify shop of bill status change
      emitToShop(bill.shopId, 'user:bill:updated', { billId: bill._id, status: bill.status });
      
      // ส่ง event ไปยัง frontend (ถ้ามี WebSocket หรือ Server-Sent Events)
      // emit('billUpdated', { shopId: bill.shopId, billId: bill._id, status });
      
    } catch (notificationError) {
      console.error('❌ Error creating bill notification:', notificationError);
    }

    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    console.error('❌ Error in verifyBill:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all bills (admin)
export const getAllBills = async (req, res) => {
  try {
    const { billType, status, canteenId, month } = req.query;
    let query = {};
    
    if (billType) query.billType = billType;
    if (status) query.status = status;

    // ดึงข้อมูลร้านค้าทั้งหมด
    let shops;
    if (canteenId) {
      shops = await Shop.find({ canteenId });
    } else {
      shops = await Shop.find();
    }

    // ตรวจสอบและสร้างบิลสำหรับเดือนปัจจุบันเท่านั้น
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    for (const shop of shops) {
      // ตรวจสอบบิลค่าน้ำของเดือนปัจจุบัน
      let waterBill = await Bill.findOne({ 
        shopId: shop._id,
        billType: 'water',
        month: currentMonth,
        year: currentYear
      });

      if (!waterBill) {
        waterBill = new Bill({
          shopId: shop._id,
          shopName: shop.name,
          shopCustomId: shop.customId,
          canteenId: shop.canteenId,
          contractStartDate: shop.contractStartDate,
          contractEndDate: shop.contractEndDate,
          billType: 'water',
          status: 'รอดำเนินการ',
          month: currentMonth,
          year: currentYear,
          amount: null
        });
        await waterBill.save();
        console.log(`Created water bill for shop ${shop.name} for month ${currentMonth}/${currentYear}`);
      }

      // ตรวจสอบบิลค่าไฟของเดือนปัจจุบัน
      let electricityBill = await Bill.findOne({
        shopId: shop._id,
        billType: 'electricity',
        month: currentMonth,
        year: currentYear
      });

      if (!electricityBill) {
        electricityBill = new Bill({
          shopId: shop._id,
          shopName: shop.name,
          shopCustomId: shop.customId,
          canteenId: shop.canteenId,
          contractStartDate: shop.contractStartDate,
          contractEndDate: shop.contractEndDate,
          billType: 'electricity',
          status: 'รอดำเนินการ',
          month: currentMonth,
          year: currentYear,
          amount: null
        });
        await electricityBill.save();
        console.log(`Created electricity bill for shop ${shop.name} for month ${currentMonth}/${currentYear}`);
      }
    }

    // ดึงข้อมูลบิลตาม query
    if (shops && shops.length > 0) {
      const shopIds = shops.map(shop => shop._id);
      query.shopId = { $in: shopIds };
    }

    // ถ้ามีการกรองตามเดือน
    if (month) {
      query.month = month;
    }

    // ดึงข้อมูล bills พร้อมกับข้อมูลร้านค้า
    const bills = await Bill.find(query)
      .populate('shopId', 'name customId canteenId contractStartDate contractEndDate')
      .sort({ createdAt: -1 });
    
    // จัดรูปแบบข้อมูล
    const formattedBills = bills.map(bill => ({
      _id: bill._id,
      shopName: bill.shopId ? bill.shopId.name : '',
      shopId: bill.shopId ? bill.shopId.customId : '',
      canteenId: bill.shopId ? bill.shopId.canteenId : '',
      canteen: bill.shopId ? `โรงอาหาร ${getCanteenName(bill.shopId.canteenId)}` : 'ไม่ระบุ',
      contractStartDate: bill.shopId ? bill.shopId.contractStartDate : null,
      contractEndDate: bill.shopId ? bill.shopId.contractEndDate : null,
      billType: getBillTypeText(bill.billType),
      status: bill.status || 'รอดำเนินการ',
      month: getThaiMonth(bill.month),
      year: bill.year,
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt,
      amount: bill.amount || null,
      image: bill.image || null,
      slip_image_url: bill.slip_image_url || null
    }));

    // บันทึกข้อมูลลงใน data/bill
    const billDataPath = path.join(__dirname, '../data/bill');

    // สร้างโฟลเดอร์ถ้ายังไม่มี
    if (!fs.existsSync(billDataPath)) {
      fs.mkdirSync(billDataPath, { recursive: true });
    }

    // บันทึกข้อมูลลงไฟล์
    fs.writeFileSync(
      path.join(billDataPath, 'bills.json'),
      JSON.stringify(formattedBills, null, 2)
    );

    // ส่งข้อมูลกลับ
    res.status(200).json({ 
      success: true, 
      data: formattedBills
    });
  } catch (error) {
    console.error('Error in getAllBills:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get bill history with pagination and filtering
export const getBillHistoryWithPagination = async (req, res) => {
  try {
    const { page = 1, limit = 20, year, month, status } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { shopId: req.user.shopId };
    
    // Filter by year
    if (year) {
      query.year = parseInt(year);
    }
    
    // Filter by month
    if (month) {
      query.month = parseInt(month);
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Get bills with pagination
    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Bill.countDocuments(query);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    
    res.status(200).json({
      success: true,
      data: bills,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Helper functions
const getCanteenName = (canteenId) => {
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
  return canteenMap[canteenId] || canteenId;
};

const getBillTypeText = (type) => {
  return type === 'water' ? 'ค่าน้ำ' : 'ค่าไฟ';
};

const getThaiMonth = (monthNumber) => {
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  return months[monthNumber - 1] || '';
};

export const importBillExcel = async (req, res) => {
  try {
    console.log('importBillExcel called');
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    console.log('File uploaded:', req.file.path);
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    console.log('Rows parsed:', rows.length);

    let updated = 0, notFound = 0;
    for (const row of rows) {
      if (!row.shopId || !row.billType || !row.month || !row.year || typeof row.amount !== 'number') continue;
      const result = await Bill.updateOne(
        {
          shopId: row.shopId,
          billType: row.billType,
          month: row.month,
          year: row.year
        },
        { $set: { amount: row.amount } }
      );
      if (result.nModified > 0) updated++;
      else notFound++;
    }
    res.json({ success: true, updated, notFound });
  } catch (err) {
    console.error('importBillExcel error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ดึงรูปภาพ base64 จาก MongoDB
export const getBillImage = async (req, res) => {
  try {
    console.log('=== GET BILL IMAGE DEBUG ===');
    console.log('Bill ID:', req.params.billId);
    console.log('User:', req.user);
    
    const bill = await Bill.findById(req.params.billId);
    if (!bill) {
      console.log('❌ Bill not found:', req.params.billId);
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    
    console.log('✅ Bill found:', {
      id: bill._id,
      shopId: bill.shopId,
      image: bill.image,
      imagePath: bill.imagePath
    });
    
    // ตรวจสอบว่า user มีสิทธิ์เข้าถึง bill นี้หรือไม่
    if (req.user && req.user.role !== 'admin' && bill.shopId.toString() !== req.user.shopId.toString()) {
      console.log('❌ Unauthorized access to bill image');
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    
    if (bill.image && bill.imagePath) {
      // ตรวจสอบว่าไฟล์หมดอายุหรือไม่
      if (bill.imageExpiryDate && new Date() > bill.imageExpiryDate) {
        console.log('⚠️ Image expired:', bill.imageExpiryDate);
        // ลบข้อมูลรูปภาพที่หมดอายุ
        bill.image = null;
        bill.imagePath = null;
        bill.imageUploadDate = null;
        bill.imageExpiryDate = null;
        await bill.save();
        return res.status(404).json({ success: false, error: 'Image expired' });
      }
      
      console.log('🔍 Looking for image at:', bill.imagePath);
      if (fs.existsSync(bill.imagePath)) {
        console.log('✅ Image found, sending:', bill.imagePath);
        
        // Set CORS headers
        res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Cross-Origin-Resource-Policy', 'cross-origin');
        res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
        
        // Determine content type based on file extension
        const ext = path.extname(bill.imagePath).toLowerCase();
        let contentType = 'image/jpeg';
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.webp') contentType = 'image/webp';
        
        res.set('Content-Type', contentType);
        const stream = fs.createReadStream(bill.imagePath);
        stream.on('error', (err) => {
          console.error('❌ Stream error while sending bill image:', err);
          if (!res.headersSent) {
            res.status(500).send('Error streaming image');
          } else {
            try { res.end(); } catch (_) {}
          }
        });
        return stream.pipe(res);
      } else {
        console.log('❌ Image file does NOT exist:', bill.imagePath);
        // ลบ path ออกจาก database เมื่อไฟล์หาย
        bill.image = null;
        bill.imagePath = null;
        bill.imageUploadDate = null;
        bill.imageExpiryDate = null;
        await bill.save();
        console.log('Removed image path from database');
      }
    } else {
      console.log('Bill has no image field:', bill);
    }
    return res.status(404).send('Not found');
  } catch (error) {
    console.log('Error in getBillImage:', error);
    res.status(500).send('Error loading image');
  }
};

// Cancel bill slip image (admin)
export const cancelBillImage = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Cancel bill image request:', { id });

    const bill = await Bill.findById(id);
    if (!bill) {
      console.log('Bill not found:', id);
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    
    // ลบไฟล์ภาพถ้ามี
    if (bill.imagePath && fs.existsSync(bill.imagePath)) {
      fs.unlinkSync(bill.imagePath);
      console.log('Deleted image file:', bill.imagePath);
      }
    
    // ลบข้อมูลรูปภาพและเปลี่ยน status เป็น "รอดำเนินการ"
      bill.image = null;
    bill.imagePath = null;
    bill.slip_image_url = null;
    bill.imageUploadDate = null;
    bill.imageExpiryDate = null;
    bill.payment_date = null;
    bill.status = 'รอดำเนินการ'; // เปลี่ยน status กลับเป็น รอดำเนินการ
    
      await bill.save();
    console.log('Bill updated - status changed to รอดำเนินการ');
    
    // สร้าง notification สำหรับ user
    try {
      await createBillNotification(bill, 'รอดำเนินการ');
      console.log('✅ Bill cancellation notification created');
      // Realtime: notify shop of bill image cancellation
      emitToShop(bill.shopId, 'user:bill:imageCancelled', { billId: bill._id });
    } catch (notificationError) {
      console.error('❌ Error creating bill cancellation notification:', notificationError);
    }
    
    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    console.error('Error in cancelBillImage:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    // ลบไฟล์ภาพถ้ามี
    if (bill.image) {
      const imagePath = path.join(__dirname, '../uploads/bills/', bill.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    await bill.deleteOne();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 

// Cleanup expired images (เรียกใช้ทุกวัน)
export const cleanupExpiredImages = async () => {
  try {
    console.log('Starting cleanup of expired images...');
    
    // หา bills ที่มีรูปภาพหมดอายุ
    const expiredBills = await Bill.find({
      imageExpiryDate: { $lt: new Date() },
      image: { $ne: null }
    });
    
    console.log(`Found ${expiredBills.length} expired images`);
    
    for (const bill of expiredBills) {
      // ลบไฟล์รูปภาพ
      if (bill.imagePath && fs.existsSync(bill.imagePath)) {
        fs.unlinkSync(bill.imagePath);
        console.log('Deleted expired image:', bill.imagePath);
      }
      
      // ลบข้อมูลจาก database
      bill.image = null;
      bill.imagePath = null;
      bill.imageUploadDate = null;
      bill.imageExpiryDate = null;
      await bill.save();
    }
    
    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

// เรียกใช้ cleanup ทุกวัน
setInterval(cleanupExpiredImages, 24 * 60 * 60 * 1000); // 24 ชั่วโมง 