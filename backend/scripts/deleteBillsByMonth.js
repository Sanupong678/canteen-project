import mongoose from 'mongoose';
import Bill from '../models/billModel.js';
import dotenv from 'dotenv';

dotenv.config();

// เชื่อมต่อกับ MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

async function deleteBillsByMonth() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is required');
    }
    const targetMonths = [7, 8]; // เดือนที่ต้องการลบ
    
    console.log('กำลังเชื่อมต่อกับ MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ');

    // นับจำนวนบิลที่มี month = 7 หรือ 8 ก่อนลบ
    const countBefore = await Bill.countDocuments({ month: { $in: targetMonths } });
    console.log(`\n📊 พบบิลที่มี month = ${targetMonths.join(', ')} ทั้งหมด: ${countBefore} รายการ`);

    if (countBefore === 0) {
      console.log(`⚠️ ไม่พบบิลที่มี month = ${targetMonths.join(', ')} ในระบบ`);
      await mongoose.connection.close();
      process.exit(0);
    }

    // แสดงรายละเอียดบิลที่จะถูกลบ แยกตามเดือน
    for (const month of targetMonths) {
      const monthCount = await Bill.countDocuments({ month });
      if (monthCount > 0) {
        console.log(`\n📋 เดือน ${month} - พบ ${monthCount} รายการ`);
        const billsToDelete = await Bill.find({ month })
          .select('_id shopName billType month year status amount')
          .limit(5)
          .lean();
        
        billsToDelete.forEach((bill, index) => {
          console.log(`  ${index + 1}. ${bill.shopName} - ${bill.billType} - เดือน ${bill.month}/${bill.year} - Status: ${bill.status} - Amount: ${bill.amount || 'ไม่มี'}`);
        });
        
        if (monthCount > 5) {
          console.log(`  ... และอีก ${monthCount - 5} รายการ`);
        }
      }
    }

    // ลบบิลที่มี month = 7 หรือ 8
    console.log(`\n🗑️ กำลังลบบิลที่มี month = ${targetMonths.join(', ')}...`);
    const deleteResult = await Bill.deleteMany({ month: { $in: targetMonths } });
    
    console.log(`\n✅ ลบบิลสำเร็จ: ${deleteResult.deletedCount} รายการ`);

    // ตรวจสอบว่าลบหมดแล้วหรือไม่
    const countAfter = await Bill.countDocuments({ month: { $in: targetMonths } });
    if (countAfter > 0) {
      console.log(`⚠️ ยังมีบิลเหลืออยู่: ${countAfter} รายการ`);
    } else {
      console.log('✅ ลบบิลทั้งหมดเรียบร้อยแล้ว');
    }

    // แสดงสรุปแยกตามเดือน
    console.log('\n📊 สรุปผลการทำงาน:');
    for (const month of targetMonths) {
      const monthCountAfter = await Bill.countDocuments({ month });
      console.log(`- เดือน ${month}: ${monthCountAfter === 0 ? 'ลบหมดแล้ว' : `ยังเหลือ ${monthCountAfter} รายการ`}`);
    }
    console.log(`- จำนวนบิลที่ลบทั้งหมด: ${deleteResult.deletedCount} รายการ`);
    console.log(`- เดือนที่ลบ: ${targetMonths.join(', ')}`);
    console.log('✅ เสร็จสิ้นการลบบิล');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

deleteBillsByMonth();

