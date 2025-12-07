import xlsx from 'xlsx';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Shop from '../models/shopModel.js';

dotenv.config();

// ข้อมูลตัวอย่างสำหรับ bill import
// ต้องมี columns: shopId, billType, month, year, amount
const createBillExcelSample = async () => {
  try {
    // เชื่อมต่อ database เพื่อดึง shopId จริง
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ดึงข้อมูล shops ตัวอย่าง 5 ร้านแรก
    const shops = await Shop.find().limit(5).select('_id customId name').lean();
    
    if (shops.length === 0) {
      console.log('⚠️ ไม่พบข้อมูล shops ใน database');
      console.log('📝 กำลังสร้างข้อมูลตัวอย่างด้วย shopId ตัวอย่าง...');
      
      // สร้างข้อมูลตัวอย่างด้วย shopId ตัวอย่าง (ต้องแก้ไขให้ตรงกับข้อมูลจริง)
      const sampleData = [
        {
          shopId: '507f1f77bcf86cd799439011', // ตัวอย่าง ObjectId - ต้องแก้ไขให้ตรงกับข้อมูลจริง
          billType: 'water',
          month: 10,
          year: 2025,
          amount: 1500.50
        },
        {
          shopId: '507f1f77bcf86cd799439011',
          billType: 'electricity',
          month: 10,
          year: 2025,
          amount: 2300.75
        },
        {
          shopId: '507f1f77bcf86cd799439012', // ตัวอย่าง ObjectId - ต้องแก้ไขให้ตรงกับข้อมูลจริง
          billType: 'water',
          month: 10,
          year: 2025,
          amount: 1200.00
        },
        {
          shopId: '507f1f77bcf86cd799439012',
          billType: 'electricity',
          month: 10,
          year: 2025,
          amount: 2100.50
        },
        {
          shopId: '507f1f77bcf86cd799439013', // ตัวอย่าง ObjectId - ต้องแก้ไขให้ตรงกับข้อมูลจริง
          billType: 'water',
          month: 10,
          year: 2025,
          amount: 1800.25
        },
        {
          shopId: '507f1f77bcf86cd799439013',
          billType: 'electricity',
          month: 10,
          year: 2025,
          amount: 2500.00
        }
      ];

      console.log('\n📋 ข้อมูลตัวอย่าง (ต้องแก้ไข shopId ให้ตรงกับข้อมูลจริง):');
      console.table(sampleData);

      // สร้าง workbook
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(sampleData);
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Bill Data');
      
      // บันทึกไฟล์
      xlsx.writeFile(workbook, './bill_import_sample.xlsx');
      console.log('\n✅ สร้างไฟล์ Excel ตัวอย่างเสร็จสิ้น: bill_import_sample.xlsx');
      console.log('\n⚠️ หมายเหตุ: ต้องแก้ไข shopId ในไฟล์ให้ตรงกับข้อมูลจริงใน database');
      
      await mongoose.connection.close();
      return;
    }

    // สร้างข้อมูลตัวอย่างจาก shops จริง
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const sampleData = [];
    
    shops.forEach((shop, index) => {
      // สร้าง bill สำหรับ water และ electricity ของแต่ละร้าน
      // ใช้ customId แทน ObjectId (เช่น RRN002, E2005)
      sampleData.push({
        shopId: shop.customId, // ใช้ customId (เช่น RRN002, E2005)
        billType: 'water',
        month: currentMonth,
        year: currentYear,
        amount: Math.round((1000 + (index * 200) + Math.random() * 500) * 100) / 100 // จำนวนเงินตัวอย่าง
      });
      
      sampleData.push({
        shopId: shop.customId, // ใช้ customId (เช่น RRN002, E2005)
        billType: 'electricity',
        month: currentMonth,
        year: currentYear,
        amount: Math.round((2000 + (index * 300) + Math.random() * 700) * 100) / 100 // จำนวนเงินตัวอย่าง
      });
    });

    console.log('\n📋 ข้อมูลตัวอย่างที่สร้างจาก database:');
    console.table(sampleData.map(item => ({
      shopId: item.shopId, // แสดง customId (เช่น RRN002, E2005)
      shopName: shops.find(s => s.customId === item.shopId)?.name || 'N/A',
      billType: item.billType,
      month: item.month,
      year: item.year,
      amount: item.amount.toFixed(2)
    })));

    // สร้าง workbook
    const workbook = xlsx.utils.book_new();
    
    // สร้าง worksheet พร้อม header
    const worksheet = xlsx.utils.json_to_sheet(sampleData, {
      header: ['shopId', 'billType', 'month', 'year', 'amount']
    });

    // ตั้งค่า column width
    worksheet['!cols'] = [
      { wch: 30 }, // shopId
      { wch: 12 }, // billType
      { wch: 8 },  // month
      { wch: 8 },  // year
      { wch: 15 }  // amount
    ];

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Bill Data');
    
    // บันทึกไฟล์
    const filePath = './bill_import_sample.xlsx';
    xlsx.writeFile(workbook, filePath);
    
    console.log(`\n✅ สร้างไฟล์ Excel ตัวอย่างเสร็จสิ้น: ${filePath}`);
    console.log(`📊 จำนวนข้อมูล: ${sampleData.length} rows`);
    console.log(`\n📋 รายละเอียดไฟล์:`);
    console.log(`   - Columns: shopId, billType, month, year, amount`);
    console.log(`   - billType: water, electricity, utilities`);
    console.log(`   - month: 1-12 (เดือนปัจจุบัน: ${currentMonth})`);
    console.log(`   - year: ${currentYear}`);
    console.log(`   - amount: จำนวนเงิน (ตัวเลข)`);
    console.log(`\n📝 วิธีทดสอบ API:`);
    console.log(`   1. ใช้ Postman: PUT /api/bills/import-excel`);
    console.log(`   2. Body: form-data, Key: file, Value: เลือกไฟล์ ${filePath}`);
    console.log(`   3. Headers: Authorization: Bearer <token>`);
    console.log(`\n⚠️ หมายเหตุ:`);
    console.log(`   - shopId ต้องเป็น customId (รหัสร้านค้า) เช่น RRN002, E2005, D1001`);
    console.log(`   - billType ต้องเป็น: water, electricity, หรือ utilities`);
    console.log(`   - month และ year ต้องตรงกับ Bill ที่มีอยู่แล้ว`);
    console.log(`   - amount ต้องเป็นตัวเลข`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error creating Excel sample:', error);
    process.exit(1);
  }
};

createBillExcelSample();

