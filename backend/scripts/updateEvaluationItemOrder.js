import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EvaluationItem from '../models/EvaluationItem.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

// Function สำหรับอัปเดต order field ใน EvaluationItem collection
async function updateEvaluationItemOrder() {
  try {
    console.log('🚀 เริ่มต้นการอัปเดต order field ใน EvaluationItem collection...');
    
    // เชื่อมต่อ database
    await connectDB();
    console.log('✅ เชื่อมต่อ database สำเร็จ');
    
    // ดึงข้อมูล evaluation items ทั้งหมด
    const evaluationItems = await EvaluationItem.find().sort({ createdAt: 1 });
    console.log(`📋 พบ evaluation items ${evaluationItems.length} รายการ`);
    
    let updatedCount = 0;
    
    // อัปเดต order field ตามลำดับที่ถูกต้อง
    for (let i = 0; i < evaluationItems.length; i++) {
      const item = evaluationItems[i];
      const newOrder = i + 1;
      
      if (item.order !== newOrder) {
        item.order = newOrder;
        await item.save();
        console.log(`🔄 อัปเดต item: ${item.title} -> Order: ${newOrder}`);
        updatedCount++;
      } else {
        console.log(`⏭️  ข้าม item: ${item.title} (Order: ${item.order} ถูกต้องแล้ว)`);
      }
    }
    
    console.log('🎉 การอัปเดตเสร็จสิ้น!');
    console.log(`📊 สรุปผลลัพธ์:`);
    console.log(`   - อัปเดตสำเร็จ: ${updatedCount} items`);
    console.log(`   - รวม: ${evaluationItems.length} items`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    // ปิดการเชื่อมต่อ database
    await mongoose.disconnect();
    console.log('🔌 ปิดการเชื่อมต่อ database');
  }
}

// Function สำหรับแสดงตัวอย่าง order ที่จะอัปเดต
async function previewEvaluationItemOrder() {
  try {
    console.log('🔍 แสดงตัวอย่าง order field ที่จะอัปเดต...');
    
    // เชื่อมต่อ database
    await connectDB();
    console.log('✅ เชื่อมต่อ database สำเร็จ');
    
    // ดึงข้อมูล evaluation items ทั้งหมด
    const evaluationItems = await EvaluationItem.find().sort({ createdAt: 1 });
    console.log(`📋 พบ evaluation items ${evaluationItems.length} รายการ`);
    
    console.log('\n📋 ตัวอย่าง order field ที่จะอัปเดต:');
    console.log('='.repeat(80));
    
    evaluationItems.forEach((item, index) => {
      const newOrder = index + 1;
      console.log(`${newOrder}. ${item.title}`);
      console.log(`   ID: ${item._id}`);
      console.log(`   Order ปัจจุบัน: ${item.order}`);
      console.log(`   Order ใหม่: ${newOrder}`);
      console.log(`   Max Score: ${item.maxScore}`);
      console.log('---');
    });
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 ปิดการเชื่อมต่อ database');
  }
}

// ตรวจสอบ command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === 'preview') {
  previewEvaluationItemOrder();
} else if (command === 'update') {
  updateEvaluationItemOrder();
} else {
  console.log('📖 วิธีใช้งาน:');
  console.log('   node updateEvaluationItemOrder.js preview  - แสดงตัวอย่าง order field ที่จะอัปเดต');
  console.log('   node updateEvaluationItemOrder.js update   - อัปเดต order field จริง');
  console.log('\n⚠️  คำเตือน: ใช้คำสั่ง update อย่างระมัดระวัง เพราะจะเปลี่ยนข้อมูลใน database');
}
