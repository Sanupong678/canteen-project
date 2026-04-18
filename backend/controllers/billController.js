import mongoose from 'mongoose';
import Bill from '../models/billModel.js';
import Shop from '../models/shopModel.js';
import User from '../models/userModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';
import { createBillNotification, createNotification } from './notificationController.js';
import { createAdminBillNotification } from './adminNotificationController.js';
import { emitToShop, emitToAdmin } from '../socket.js';
import Notification from '../models/notificationModel.js';

// Get current file directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload bill slip
export const uploadBill = async (req, res) => {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
    console.log('\n=== UPLOAD BILL CONTROLLER DEBUG ===');
      console.log('Request body:', { billId: req.body.billId, billType: req.body.billType });
      console.log('Request file:', req.file ? { originalname: req.file.originalname, size: req.file.size } : null);
      console.log('Request user:', { id: req.user?._id, shopId: req.user?.shopId, role: req.user?.role });
    }
    
    // ตรวจสอบ user authentication
    if (!req.user) {
      if (isDev) console.log('❌ No user found in request');
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const { billId, transferDate } = req.body;
    
    // ตรวจสอบ billId
    if (!billId) {
      if (isDev) console.log('❌ billId missing in request body');
      return res.status(400).json({ success: false, error: 'billId is required' });
    }
    
    const bill = await Bill.findById(billId);
    
    if (!bill) {
      if (isDev) console.log('❌ Bill not found for billId:', billId);
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    
    if (isDev) {
    console.log('✅ Bill found:', {
      id: bill._id,
      shopId: bill.shopId,
      userShopId: req.user.shopId,
      dueDate: bill.dueDate,
      contractEndDate: bill.contractEndDate
    });
    }
    
    // ตรวจสอบว่า bill นี้เป็นของ user นี้หรือไม่
    if (bill.shopId.toString() !== req.user.shopId.toString()) {
      if (isDev) console.log('❌ Unauthorized access to bill');
      return res.status(403).json({ success: false, error: 'Unauthorized access to this bill' });
    }
    
    // ตรวจสอบและสร้าง dueDate ถ้าไม่มี
    if (!bill.dueDate) {
      if (isDev) console.log('⚠️ No dueDate found, creating default dueDate');
      bill.dueDate = bill.contractEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    
    // ตรวจสอบไฟล์
    if (!req.file) {
      if (isDev) console.log('❌ No file uploaded');
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    if (isDev) {
    console.log('✅ File uploaded successfully:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size
    });
    }
    
    // บันทึกข้อมูลรูปภาพ
    bill.image = path.basename(req.file.path);
    bill.imagePath = req.file.path;
    bill.slip_image_url = `/uploads/${req.file.path.replace(/\\/g, '/')}`;
    bill.imageUploadDate = new Date();
    bill.imageExpiryDate = new Date(Date.now() + (5 * 365 * 24 * 60 * 60 * 1000)); // 5 ปี
    bill.payment_date = transferDate ? new Date(transferDate) : new Date();

    // Normalize billType if passed (support Utilities/UTILITIES)
    const billTypeRaw = req.body?.billType;
    const billType = typeof billTypeRaw === 'string' ? billTypeRaw.toLowerCase() : billTypeRaw;
    if (billType && ['water','electricity','utilities'].includes(billType)) {
      bill.billType = bill.billType || billType;
    }
    
    // ตรวจสอบว่าอัปโหลดเกินกำหนดหรือไม่
    const dueDate = new Date(bill.dueDate);
    const uploadDate = new Date();
    
    if (uploadDate > dueDate) {
      bill.status = 'เลยกำหนด';
      if (isDev) console.log('⚠️ Bill uploaded after due date - status: เลยกำหนด');
    } else {
      bill.status = 'รอตรวจสอบ';
      if (isDev) console.log('✅ Bill uploaded within due date - status: รอตรวจสอบ');
    }
    
    await bill.save();
    
    if (isDev) {
    console.log('✅ Bill updated successfully');
    console.log('=== UPLOAD BILL CONTROLLER COMPLETED ===\n');
    }
    
    // สร้าง notification สำหรับ admin
    try {
      await createAdminBillNotification(bill, req.user);
      if (isDev) console.log('✅ Admin bill notification created');
      // Realtime: notify admin list updated
      emitToAdmin('admin:bill:newUpload', { billId: bill._id, shopId: bill.shopId });
    } catch (notificationError) {
      if (isDev) {
      console.error('❌ Error creating admin bill notification:', notificationError);
      }
    }

    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
    console.error('❌ UPLOAD BILL ERROR:', error);
    }
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
    const isDev = process.env.NODE_ENV === 'development';
    const { id } = req.params;
    const { status, admin_comment } = req.body;

    const bill = await Bill.findById(id);
    if (!bill) {
      if (isDev) console.log('❌ Bill not found:', id);
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    bill.status = status;
    bill.admin_comment = admin_comment;
    await bill.save();

    // If this is a utilities (combined) bill and marked as เสร็จสิ้น, cascade status to water & electricity of the same period
    if ((bill.billType === 'utilities' || bill.billType === 'Utilities') && bill.status === 'เสร็จสิ้น') {
      const periodMatch = { shopId: bill.shopId, month: bill.month, year: bill.year };
      const related = await Bill.updateMany(
        { ...periodMatch, billType: { $in: ['water', 'electricity'] } },
        { $set: { status: 'เสร็จสิ้น' } }
      );
      if (isDev) {
      console.log('Cascaded status to W/E bills for utilities payment:', related.modifiedCount);
      }
    }

    if (isDev) {
    console.log('✅ Bill updated successfully:', {
      id: bill._id,
      shopId: bill.shopId,
      status: bill.status,
      billType: bill.billType
    });
    }

    // สร้าง notification สำหรับ user
    try {
      await createBillNotification(bill, status);
      if (isDev) console.log('✅ Bill notification created');
      // Realtime: notify shop of bill status change
      emitToShop(bill.shopId, 'user:bill:updated', { billId: bill._id, status: bill.status });
    } catch (notificationError) {
      if (isDev) {
        console.error('❌ Error creating bill notification:', notificationError.message);
      }
    }

    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error in verifyBill:', error.message);
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all bills (admin)
export const getAllBills = async (req, res) => {
  try {
    const { billType, status, canteenId, month, year, shopName } = req.query;
    let query = {};
    
    if (billType) {
      const normalized = String(billType).toLowerCase();
      if (normalized === 'utilities') {
        query.billType = { $in: ['utilities', 'Utilities'] };
      } else if (normalized === 'water' || normalized === 'electricity') {
        query.billType = normalized;
      } else {
        query.billType = billType; // fallback as-is
      }
    }
    
    // Normalize status (support both Thai and English keys, and legacy labels)
    if (status) {
      const statusMap = {
        pending: 'รอดำเนินการ',
        waiting: 'รอตรวจสอบ',
        confirmed: 'เสร็จสิ้น',
        rejected: 'เลยกำหนด',
        'ยืนยันแล้ว': 'เสร็จสิ้น',
        'เลยกำหนดชำระ': 'เลยกำหนด'
      };
      query.status = statusMap[status] || status;
    }

    // ดึงข้อมูลร้านค้าตามตัวกรองโรงอาหารและชื่อร้าน
    const shopFilter = {};
    if (canteenId) shopFilter.canteenId = parseInt(canteenId);
    if (shopName) shopFilter.name = new RegExp(shopName, 'i');
    const shops = await Shop.find(shopFilter).select('_id name customId canteenId contractStartDate contractEndDate').lean();

    // ตรวจสอบและสร้างบิลสำหรับเดือนปัจจุบันเท่านั้น (เฉพาะเมื่อไม่ใช่โหมดประวัติ)
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const isViewingCurrentMonth = !month || (parseInt(month) === currentMonth && parseInt(year) === currentYear);
    const excludeCurrentMonth = req.query.excludeCurrentMonth === 'true';

    // สร้าง bills เฉพาะเมื่อดูข้อมูลเดือนปัจจุบันและไม่ใช่โหมดประวัติ
    if (isViewingCurrentMonth && !excludeCurrentMonth && shops.length > 0) {
      const shopIds = shops.map(shop => shop._id);
      
      // ใช้ bulk operations เพื่อลดจำนวน database queries
      const billsToCreate = [];
      
      // หา bills ที่มีอยู่แล้วทั้งหมดในครั้งเดียว
      const existingBills = await Bill.find({
        shopId: { $in: shopIds },
        month: currentMonth,
        year: currentYear
      }).select('shopId billType').lean();
      
      const existingBillKeys = new Set(
        existingBills.map(b => `${b.shopId}_${b.billType}`)
      );
      
      // เตรียม bills ที่จะสร้าง
      for (const shop of shops) {
        const shopIdStr = shop._id.toString();
        
        // สร้างบิลค่าน้ำ
        if (!existingBillKeys.has(`${shopIdStr}_water`)) {
          billsToCreate.push({
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
      }

        // สร้างบิลค่าไฟ
        if (!existingBillKeys.has(`${shopIdStr}_electricity`)) {
          billsToCreate.push({
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
        }
      }

      // สร้าง bills ทั้งหมดในครั้งเดียว (bulk insert)
      if (billsToCreate.length > 0) {
        await Bill.insertMany(billsToCreate);
        // ลด console.log ใน production
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Created ${billsToCreate.length} bills for current month`);
        }
      }
    }

    // ดึงข้อมูลบิลตาม query
    if (shops && shops.length > 0) {
      const shopIds = shops.map(shop => shop._id);
      query.shopId = { $in: shopIds };
    }

    // ถ้ามีการกรองตามเดือน/ปี
    if (month) {
      query.month = parseInt(month);
    }
    if (year) {
      query.year = parseInt(year);
    }

    // ดึงข้อมูล bills พร้อมกับข้อมูลร้านค้า - ใช้ lean() เพื่อเพิ่มประสิทธิภาพ
    const bills = await Bill.find(query)
      .populate('shopId', 'name customId canteenId contractStartDate contractEndDate')
      .sort({ createdAt: -1 })
      .lean();
    
    // จัดรูปแบบข้อมูล - ใช้ map แบบ asynchronous แต่ไม่ต้องรอ
    const formattedBills = bills.map(bill => ({
      _id: bill._id,
      shopName: bill.shopId ? bill.shopId.name : bill.shopName || '',
      shopId: bill.shopId ? bill.shopId.customId : bill.shopCustomId || '',
      canteenId: bill.shopId ? bill.shopId.canteenId : bill.canteenId || '',
      canteen: bill.shopId ? `โรงอาหาร ${getCanteenName(bill.shopId.canteenId)}` : (bill.canteenId ? `โรงอาหาร ${getCanteenName(bill.canteenId)}` : 'ไม่ระบุ'),
      contractStartDate: bill.shopId ? bill.shopId.contractStartDate : bill.contractStartDate || null,
      contractEndDate: bill.shopId ? bill.shopId.contractEndDate : bill.contractEndDate || null,
      billType: getBillTypeText(bill.billType),
      status: bill.status || 'รอดำเนินการ',
      month: getThaiMonth(bill.month),
      year: bill.year,
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt,
      amount: bill.amount || null,
      image: bill.image || null,
      slip_image_url: bill.slip_image_url || null,
      imagePath: bill.imagePath || null
    }));

    // ส่งข้อมูลกลับ - ลบการบันทึกไฟล์ออกเพื่อเพิ่มประสิทธิภาพ
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
  if (type === 'water') return 'ค่าน้ำ';
  if (type === 'electricity') return 'ค่าไฟ';
  if (type === 'utilities') return 'รวม (ค่าน้ำ+ค่าไฟ)';
  return type;
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
    const isDev = process.env.NODE_ENV === 'development';
    
    // ตรวจสอบว่าไฟล์ถูกอัปโหลดหรือไม่
    if (!req.file) {
      if (isDev) {
        console.log('❌ No file uploaded');
        console.log('📋 Request body:', req.body);
        console.log('📋 Request files:', req.files);
      }
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded. Please upload an Excel file using field name "file".',
        hint: 'Make sure to use form-data with field name "file"'
      });
    }

    if (isDev) {
      console.log('📁 Processing Excel file:', {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });
    }
    
    // ตรวจสอบว่าเป็นไฟล์ Excel หรือไม่
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream' // บางครั้ง Excel files จะมี MIME type นี้
    ];
    
    if (!allowedMimeTypes.includes(req.file.mimetype) && !req.file.originalname.match(/\.(xlsx|xls)$/i)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)',
        receivedMimeType: req.file.mimetype,
        receivedFilename: req.file.originalname
      });
    }
    
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    
    if (isDev) {
      console.log('📊 Excel file parsed:', {
        sheetName: workbook.SheetNames[0],
        rowsCount: rows.length,
        firstRow: rows[0] || null
      });
    }

    if (rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Excel file is empty or has no data rows' 
      });
    }

    // ค้นหา Shop ทั้งหมดเพื่อ map customId -> shopId (เพิ่มประสิทธิภาพ)
    const allShops = await Shop.find().select('_id customId').lean();
    const shopMap = new Map();
    allShops.forEach(shop => {
      if (shop.customId) {
        shopMap.set(shop.customId, shop._id);
      }
    });
    
    if (isDev) {
      console.log(`📋 Loaded ${shopMap.size} shops for mapping customId to shopId`);
    }

    // ใช้ bulk operations เพื่อเพิ่มประสิทธิภาพ
    const updateOperations = [];
    const errors = [];
    let skippedRowsWithoutShopId = 0;
    let candidateRows = 0;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 เพราะ row 1 คือ header, row 2 คือ data แถวแรก
      
      // รองรับไฟล์ที่มีหลายบรรทัดบัญชีต่อ 1 ร้าน โดยข้ามแถวที่ไม่มี shopId
      const customId = row.shopId !== undefined && row.shopId !== null
        ? String(row.shopId).trim()
        : '';
      if (!customId) {
        skippedRowsWithoutShopId += 1;
        continue;
      }
      candidateRows += 1;

      // ตรวจสอบ required fields
      const normalizedBillType = row.billType !== undefined && row.billType !== null
        ? String(row.billType).trim().toLowerCase()
        : '';
      if (!normalizedBillType) {
        errors.push(`Row ${rowNum}: Missing billType`);
        continue;
      }
      if (!row.month) {
        errors.push(`Row ${rowNum}: Missing month`);
        continue;
      }
      if (!row.year) {
        errors.push(`Row ${rowNum}: Missing year`);
        continue;
      }
      if (row.amount === undefined || row.amount === null) {
        errors.push(`Row ${rowNum}: Missing amount`);
        continue;
      }
      
      // ตรวจสอบว่า amount เป็นตัวเลข
      const amount = typeof row.amount === 'number' ? row.amount : parseFloat(row.amount);
      if (isNaN(amount)) {
        errors.push(`Row ${rowNum}: Invalid amount (must be a number), got: ${row.amount}`);
        continue;
      }
      
      // ตรวจสอบ billType
      const validBillTypes = ['water', 'electricity', 'utilities'];
      if (!validBillTypes.includes(normalizedBillType)) {
        errors.push(`Row ${rowNum}: Invalid billType "${row.billType}". Must be one of: ${validBillTypes.join(', ')}`);
        continue;
      }
      
      // ตรวจสอบ month (1-12)
      const month = parseInt(row.month);
      if (isNaN(month) || month < 1 || month > 12) {
        errors.push(`Row ${rowNum}: Invalid month "${row.month}". Must be 1-12`);
        continue;
      }
      
      // ตรวจสอบ year
      const year = parseInt(row.year);
      if (isNaN(year) || year < 2000 || year > 2100) {
        errors.push(`Row ${rowNum}: Invalid year "${row.year}". Must be a valid year`);
        continue;
      }
      
      // ตรวจสอบ shopId (customId) format - ต้องเป็น string เช่น RRN002, E2005
      if (!customId || customId.length < 2) {
        errors.push(`Row ${rowNum}: Invalid shopId (customId) format. Expected shop code like RRN002, E2005, got: ${row.shopId}`);
        continue;
      }
      
      // ค้นหา Shop จาก customId โดยใช้ Map ที่สร้างไว้ (เร็วกว่า query หลายครั้ง)
      const shopObjectId = shopMap.get(customId);
      if (!shopObjectId) {
        errors.push(`Row ${rowNum}: Shop not found with customId "${customId}". Available customIds: ${Array.from(shopMap.keys()).slice(0, 10).join(', ')}...`);
        continue;
      }
      
      updateOperations.push({
        updateOne: {
          filter: {
            shopId: shopObjectId, // ใช้ ObjectId จาก Shop
            billType: normalizedBillType,
            month: month,
            year: year
          },
          update: { $set: { amount: amount } }
        }
      });
    }
    
    // ถ้าไม่มีแถวที่มี shopId เลย ให้แจ้งเตือนชัดเจน
    if (candidateRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid rows with shopId found in Excel file.',
        skippedRowsWithoutShopId
      });
    }

    // ถ้าทุกแถวที่พยายามประมวลผลมีข้อผิดพลาด ให้ return error
    if (errors.length > 0 && errors.length === candidateRows) {
      return res.status(400).json({ 
        success: false, 
        message: 'All rows have errors. Please check your Excel file format.',
        errors: errors.slice(0, 10), // แสดงแค่ 10 errors แรก
        totalErrors: errors.length,
        skippedRowsWithoutShopId
      });
    }
    
    let updated = 0, notFound = 0;
    const updatedShopIds = new Set(); // เก็บ shopId ที่ถูกอัปเดตเพื่อส่ง socket notification
    
    if (updateOperations.length > 0) {
      const result = await Bill.bulkWrite(updateOperations, { ordered: false });
      updated = result.modifiedCount || 0;
      notFound = updateOperations.length - updated;
      
      // เก็บ shopId ที่ถูกอัปเดต
      updateOperations.forEach(op => {
        if (op.updateOne && op.updateOne.filter && op.updateOne.filter.shopId) {
          updatedShopIds.add(op.updateOne.filter.shopId.toString());
        }
      });
      
      if (isDev) {
        console.log('✅ Bulk write result:', {
          total: updateOperations.length,
          updated,
          notFound,
          updatedShops: updatedShopIds.size
        });
      }
      
      // สร้าง notification สำหรับ users ที่เกี่ยวข้อง
      try {
        // หา bills ที่ถูกอัปเดตเพื่อสร้าง notification (ใช้ bulk query เพื่อเพิ่มประสิทธิภาพ)
        const billFilters = updateOperations
          .filter(op => op.updateOne && op.updateOne.filter)
          .map(op => op.updateOne.filter);
        
        const updatedBills = billFilters.length > 0
          ? await Bill.find({ $or: billFilters }).lean()
          : [];
        
        // กรองเฉพาะ bills ที่มี amount
        const billsWithAmount = updatedBills.filter(bill => bill.amount && typeof bill.amount === 'number' && bill.amount > 0);
        
        if (isDev) {
          console.log(`📋 Found ${billsWithAmount.length} updated bills with amount for notification`);
        }
        
        // หา users ทั้งหมดที่เกี่ยวข้องกับ shopIds ที่ถูกอัปเดต (ใช้ bulk query เพื่อเพิ่มประสิทธิภาพ)
        const uniqueShopIds = [...new Set(billsWithAmount.map(bill => bill.shopId))];
        const allUsers = uniqueShopIds.length > 0
          ? await User.find({ shopId: { $in: uniqueShopIds } }).select('_id shopId').lean()
          : [];
        
        // สร้าง Map เพื่อเก็บ users ตาม shopId
        const usersByShopId = new Map();
        allUsers.forEach(user => {
          const shopIdStr = user.shopId?.toString();
          if (shopIdStr) {
            if (!usersByShopId.has(shopIdStr)) {
              usersByShopId.set(shopIdStr, []);
            }
            usersByShopId.get(shopIdStr).push(user);
          }
        });
        
        if (isDev) {
          console.log(`👥 Found ${allUsers.length} users across ${uniqueShopIds.length} shops`);
        }
        
        // สร้าง notification สำหรับแต่ละ bill
        for (const bill of billsWithAmount) {
          try {
            // หา users ที่เกี่ยวข้องกับ shopId นี้จาก Map
            const shopIdStr = bill.shopId.toString();
            const users = usersByShopId.get(shopIdStr) || [];
            
            if (isDev && users.length > 0) {
              console.log(`👥 Found ${users.length} users for shopId: ${shopIdStr}`);
            }
            
            // สร้าง admin notification สำหรับ shop นี้ (ไม่ต้องสร้างแยกตาม user แต่สร้างตาม shopId)
            try {
              const billTypeText = bill.billType === 'electricity' ? 'ค่าไฟ' : bill.billType === 'water' ? 'ค่าน้ำ' : 'ค่าบริการ';
              const monthText = getThaiMonth(bill.month);
              const title = 'บิลค่าบริการ';
              const amountText = bill.amount && typeof bill.amount === 'number' 
                ? bill.amount.toLocaleString('th-TH') 
                : '0';
              const message = `บิล${billTypeText} เดือน${monthText} ${bill.year} มีจำนวนเงิน ${amountText} บาท กรุณาชำระเงิน`;
              
              // หา userId จาก users ที่เกี่ยวข้อง (ใช้ user แรกที่เจอ หรือใช้ shopId)
              const userId = users.length > 0 ? users[0]._id : bill.shopId;
              
              // สร้าง admin notification (ตามรูปแบบเดียวกับ sendAdminNotification)
              const adminNotification = new Notification({
                userId: userId, // ใช้ userId จาก user หรือ shopId (ตามรูปแบบ sendAdminNotification ใช้ shop.userId || shop._id)
                shopId: bill.shopId,
                type: 'admin_notification', // ใช้ admin_notification แทน bill
                title: title,
                message: message,
                status: 'new', // ใช้ 'new' แทน 'รอดำเนินการ' (ตามรูปแบบ sendAdminNotification)
                isRead: false,
                relatedId: bill._id,
                priority: 'high', // ตั้งค่า priority เป็น high เพราะเป็นเรื่องสำคัญ
                sentBy: req.user?._id || req.user?.id || req.user?.username || 'admin', // ใช้ admin ที่อัปโหลด Excel
                sentAt: new Date(),
                recipientShopId: bill.shopId // ระบุ shopId ที่จะรับ notification
                // ไม่ต้องใส่ recipients เพราะมี recipientShopId แล้ว
              });
              
              await adminNotification.save();
              
              if (isDev) {
                console.log(`✅ Admin notification created for shopId: ${shopIdStr} - bill ${bill._id}`);
              }
            } catch (notifError) {
              if (isDev) {
                console.warn(`⚠️ Error creating admin notification for shopId ${shopIdStr}:`, notifError.message);
              }
            }
          } catch (billError) {
            if (isDev) {
              console.warn(`⚠️ Error processing bill ${bill._id}:`, billError.message);
            }
          }
        }
        
        if (isDev) {
          console.log(`✅ Created notifications for ${billsWithAmount.length} bills`);
        }
      } catch (notificationError) {
        if (isDev) {
          console.warn('⚠️ Error creating notifications:', notificationError.message);
        }
        // ไม่ throw error เพราะเป็น operation รอง
      }
      
      // Emit socket events เพื่อ notify users ที่เกี่ยวข้อง
      try {
        updatedShopIds.forEach(shopId => {
          emitToShop(shopId, 'user:bill:amountUpdated', { 
            message: 'จำนวนเงินบิลถูกอัปเดตแล้ว กรุณารีเฟรชหน้าเพจ',
            shopId: shopId
          });
        });
        
        // Notify admin
        emitToAdmin('admin:bill:importCompleted', { 
          updated, 
          notFound,
          totalRows: rows.length,
          candidateRows,
          skippedRowsWithoutShopId
        });
        
        if (isDev) {
          console.log(`📡 Emitted socket events to ${updatedShopIds.size} shops`);
        }
      } catch (socketError) {
        if (isDev) {
          console.warn('⚠️ Error emitting socket events:', socketError.message);
        }
      }
    }
    
    // ลบไฟล์ชั่วคราวหลังจากประมวลผลเสร็จ
    try {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupError) {
      if (isDev) {
        console.warn('⚠️ Error cleaning up temp file:', cleanupError.message);
      }
    }
    
    res.json({ 
      success: true, 
      updated, 
      notFound,
      totalRows: rows.length,
      candidateRows,
      skippedRowsWithoutShopId,
      validRows: updateOperations.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      totalErrors: errors.length > 0 ? errors.length : undefined
    });
  } catch (err) {
    // ลบไฟล์ชั่วคราวถ้าเกิด error
    try {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ importBillExcel error:', err);
      console.error('❌ Error stack:', err.stack);
    }
    res.status(500).json({ 
      success: false, 
      message: err.message || 'An error occurred while processing the Excel file',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// ดึงรูปภาพ base64 จาก MongoDB
export const getBillImage = async (req, res) => {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const billId = req.params.billId;
    
    if (isDev) console.log('🔍 getBillImage called with billId:', billId);
    
    const bill = await Bill.findById(billId);
    if (!bill) {
      if (isDev) console.log('❌ Bill not found:', billId);
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    
    if (isDev) {
      console.log('✅ Bill found:', {
        id: bill._id,
        hasImage: !!bill.image,
        hasImagePath: !!bill.imagePath,
        imagePath: bill.imagePath,
        slip_image_url: bill.slip_image_url
      });
    }
    
    // ตรวจสอบว่า user มีสิทธิ์เข้าถึง bill นี้หรือไม่
    if (req.user && req.user.role !== 'admin' && bill.shopId.toString() !== req.user.shopId.toString()) {
      if (isDev) console.log('❌ Unauthorized access to bill image');
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    
    if (bill.image && bill.imagePath) {
      // ตรวจสอบว่าไฟล์หมดอายุหรือไม่
      if (bill.imageExpiryDate && new Date() > bill.imageExpiryDate) {
        if (isDev) console.log('⚠️ Image expired');
        // ลบข้อมูลรูปภาพที่หมดอายุ
        bill.image = null;
        bill.imagePath = null;
        bill.imageUploadDate = null;
        bill.imageExpiryDate = null;
        await bill.save();
        return res.status(404).json({ success: false, error: 'Image expired' });
      }
      
      if (fs.existsSync(bill.imagePath)) {
        if (isDev) console.log('✅ Image found, sending');
        
        // Set CORS headers
        res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || req.headers.origin || '*');
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
          if (isDev) {
            console.error('❌ Stream error while sending bill image:', err.message);
          }
          if (!res.headersSent) {
            res.status(500).send('Error streaming image');
          } else {
            try { res.end(); } catch (_) {}
          }
        });
        return stream.pipe(res);
      } else {
        if (isDev) console.log('❌ Image file does NOT exist');
        // ลบ path ออกจาก database เมื่อไฟล์หาย
        bill.image = null;
        bill.imagePath = null;
        bill.imageUploadDate = null;
        bill.imageExpiryDate = null;
        await bill.save();
      }
    }
    return res.status(404).send('Not found');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in getBillImage:', error.message);
    }
    res.status(500).send('Error loading image');
  }
};

// Cancel bill slip image (admin)
export const cancelBillImage = async (req, res) => {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const { id } = req.params;

    const bill = await Bill.findById(id);
    if (!bill) {
      if (isDev) console.log('Bill not found:', id);
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    
    // ลบไฟล์ภาพถ้ามี
    if (bill.imagePath && fs.existsSync(bill.imagePath)) {
      fs.unlinkSync(bill.imagePath);
      if (isDev) console.log('Deleted image file');
      }
    
    // ลบข้อมูลรูปภาพและเปลี่ยน status เป็น "รอดำเนินการ"
      bill.image = null;
    bill.imagePath = null;
    bill.slip_image_url = null;
    bill.imageUploadDate = null;
    bill.imageExpiryDate = null;
    bill.payment_date = null;
    bill.status = 'รอดำเนินการ';
    
      await bill.save();
    
    if (isDev) console.log('Bill updated - status changed to รอดำเนินการ');
    
    // สร้าง notification สำหรับ user
    try {
      await createBillNotification(bill, 'รอดำเนินการ');
      if (isDev) console.log('✅ Bill cancellation notification created');
      // Realtime: notify shop of bill image cancellation
      emitToShop(bill.shopId, 'user:bill:imageCancelled', { billId: bill._id });
    } catch (notificationError) {
      if (isDev) {
        console.error('❌ Error creating bill cancellation notification:', notificationError.message);
      }
    }
    
    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in cancelBillImage:', error.message);
    }
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
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
    console.log('Starting cleanup of expired images...');
    }
    
    // หา bills ที่มีรูปภาพหมดอายุ
    const expiredBills = await Bill.find({
      imageExpiryDate: { $lt: new Date() },
      image: { $ne: null }
    });
    
    if (isDev) {
    console.log(`Found ${expiredBills.length} expired images`);
    }
    
    // ใช้ bulk update เพื่อเพิ่มประสิทธิภาพ
    const billIds = expiredBills.map(bill => bill._id);
    
    if (billIds.length > 0) {
      // ลบไฟล์รูปภาพ
      for (const bill of expiredBills) {
      if (bill.imagePath && fs.existsSync(bill.imagePath)) {
          try {
        fs.unlinkSync(bill.imagePath);
          } catch (fileError) {
            if (isDev) {
              console.error('Error deleting file:', fileError.message);
            }
          }
        }
      }
      
      // Bulk update database
      await Bill.updateMany(
        { _id: { $in: billIds } },
        {
          $set: {
            image: null,
            imagePath: null,
            imageUploadDate: null,
            imageExpiryDate: null
          }
        }
      );
    }
    
    if (isDev) {
    console.log('Cleanup completed');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error during cleanup:', error.message);
    }
  }
};

// เรียกใช้ cleanup ทุกวัน - เก็บ reference เพื่อ cleanup เมื่อ server shutdown
let cleanupInterval = null;

export const startCleanupInterval = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  // เรียกครั้งแรกทันที (optional)
  // cleanupExpiredImages();
  
  // เรียกทุก 24 ชั่วโมง
  cleanupInterval = setInterval(cleanupExpiredImages, 24 * 60 * 60 * 1000);
  console.log('✅ Cleanup interval started (runs every 24 hours)');
};

export const stopCleanupInterval = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('✅ Cleanup interval stopped');
  }
};

// เริ่ม cleanup interval เมื่อ module ถูก load
startCleanupInterval(); 