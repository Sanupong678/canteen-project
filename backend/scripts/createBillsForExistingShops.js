import mongoose from 'mongoose';
import Shop from '../models/shopModel.js';
import Bill from '../models/billModel.js';
import dotenv from 'dotenv';

dotenv.config();

// เชื่อมต่อกับ MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

async function createBillsForExistingShops() {
  try {
    console.log('กำลังเชื่อมต่อกับ MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('เชื่อมต่อ MongoDB สำเร็จ');

    // ดึงข้อมูล shops ทั้งหมด
    const shops = await Shop.find({});
    console.log(`พบ ${shops.length} ร้านค้า`);

    let billsCreated = 0;

    for (const shop of shops) {
      // ตรวจสอบว่ามี bills อยู่แล้วหรือไม่
      const existingBills = await Bill.find({ shopId: shop._id });
      
      if (existingBills.length === 0) {
        // สร้าง bills สำหรับค่าน้ำและค่าไฟ
        const waterBill = new Bill({
          shopId: shop._id,
          shopName: shop.name,
          canteenId: shop.canteenId,
          contractEndDate: shop.contractEndDate,
          status: 'รอดำเนินการ',
          billType: 'water'
        });

        const electricityBill = new Bill({
          shopId: shop._id,
          shopName: shop.name,
          canteenId: shop.canteenId,
          contractEndDate: shop.contractEndDate,
          status: 'รอดำเนินการ',
          billType: 'electricity'
        });

        await waterBill.save();
        await electricityBill.save();
        billsCreated += 2;

        console.log(`✅ สร้าง bills สำเร็จสำหรับร้าน: ${shop.name}`);
      } else {
        console.log(`ℹ️ ร้าน ${shop.name} มี bills อยู่แล้ว (${existingBills.length} bills)`);
      }
    }

    console.log('\nสรุปผลการทำงาน:');
    console.log(`- จำนวนร้านค้าทั้งหมด: ${shops.length}`);
    console.log(`- จำนวน bills ที่สร้างใหม่: ${billsCreated}`);
    console.log('เสร็จสิ้นการสร้าง bills');

    // ปิดการเชื่อมต่อ MongoDB
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createBillsForExistingShops(); 