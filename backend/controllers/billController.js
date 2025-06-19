import Bill from '../models/billModel.js';
import Shop from '../models/Shop.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

// Get current file directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload bill slip
export const uploadBill = async (req, res) => {
  try {
    const { billType, amount } = req.body;
    const slip_image_url = req.file.path;

    const bill = new Bill({
      shopId: req.user.shopId,
      billType,
      amount,
      slip_image_url,
      payment_date: new Date(req.body.payment_date)
    });

    await bill.save();
    res.status(201).json({ success: true, data: bill });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get bill history for a shop
export const getBillHistory = async (req, res) => {
  try {
    const bills = await Bill.find({ shopId: req.user.shopId })
      .sort({ created_at: -1 });
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

    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    bill.status = status;
    bill.admin_comment = admin_comment;
    await bill.save();

    res.status(200).json({ success: true, data: bill });
  } catch (error) {
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