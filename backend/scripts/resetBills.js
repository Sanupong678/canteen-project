import mongoose from 'mongoose';
import Shop from '../models/shopModel.js';
import Bill from '../models/billModel.js';
import dotenv from 'dotenv';

dotenv.config();

// เชื่อมต่อกับ MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

async function resetBills() {
  try {
    console.log('กำลังเชื่อมต่อกับ MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('เชื่อมต่อ MongoDB สำเร็จ');

    // ลบข้อมูลบิลทั้งหมด
    console.log('กำลังลบข้อมูลบิลเก่า...');
    const deleteResult = await Bill.deleteMany({});
    console.log(`ลบข้อมูลบิลเก่าสำเร็จ: ${deleteResult.deletedCount} รายการ`);

    // ดึงข้อมูล shops ทั้งหมด
    const shops = await Shop.find({});
    console.log(`พบร้านค้าทั้งหมด ${shops.length} ร้าน`);

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    let billsCreated = 0;

    // สร้างบิลใหม่สำหรับแต่ละร้าน
    for (const shop of shops) {
      // สร้างบิลค่าน้ำ
      const waterBill = new Bill({
        shopId: shop._id,
        shopName: shop.name,
        shopCustomId: shop.customId,
        canteenId: shop.canteenId,
        contractStartDate: shop.contractStartDate,
        contractEndDate: shop.contractEndDate,
        billType: 'water',
        status: 'รอดำเนินการ',
        month: currentMonth,
        year: currentYear
      });
      await waterBill.save();
      billsCreated++;

      // สร้างบิลค่าไฟ
      const electricityBill = new Bill({
        shopId: shop._id,
        shopName: shop.name,
        shopCustomId: shop.customId,
        canteenId: shop.canteenId,
        contractStartDate: shop.contractStartDate,
        contractEndDate: shop.contractEndDate,
        billType: 'electricity',
        status: 'รอดำเนินการ',
        month: currentMonth,
        year: currentYear
      });
      await electricityBill.save();
      billsCreated++;

      console.log(`✅ สร้างบิลสำเร็จสำหรับร้าน: ${shop.name}`);
    }

    console.log('\nสรุปผลการทำงาน:');
    console.log(`- จำนวนบิลที่ถูกลบ: ${deleteResult.deletedCount}`);
    console.log(`- จำนวนร้านค้า: ${shops.length}`);
    console.log(`- จำนวนบิลที่สร้างใหม่: ${billsCreated}`);
    console.log('เสร็จสิ้นการรีเซ็ตข้อมูลบิล');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

resetBills(); 