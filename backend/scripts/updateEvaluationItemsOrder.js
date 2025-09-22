import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Evaluation from '../models/Evaluation.js';
import EvaluationItem from '../models/EvaluationItem.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

// Function สำหรับอัปเดต order field ใน evaluation items
async function updateEvaluationItemsOrder() {
  try {
    console.log('🚀 เริ่มต้นการอัปเดต order field ใน evaluation items...');
    
    // เชื่อมต่อ database
    await connectDB();
    console.log('✅ เชื่อมต่อ database สำเร็จ');
    
    // ดึงข้อมูล evaluation items ทั้งหมด
    const evaluationItems = await EvaluationItem.find().sort({ order: 1 });
    console.log(`📋 พบ evaluation items ${evaluationItems.length} รายการ`);
    
    // สร้าง mapping ของ item ID กับ order
    const itemOrderMap = {};
    evaluationItems.forEach((item, index) => {
      itemOrderMap[item._id.toString()] = item.order || (index + 1);
    });
    
    console.log('🗂️  Item order mapping:', itemOrderMap);
    
    // ดึงข้อมูล evaluations ทั้งหมด
    const evaluations = await Evaluation.find();
    console.log(`📊 พบ evaluations ${evaluations.length} รายการ`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const evaluation of evaluations) {
      let hasChanges = false;
      
      // อัปเดต order field ในแต่ละ item
      for (const item of evaluation.items) {
        const itemId = item.id.toString();
        const newOrder = itemOrderMap[itemId];
        
        if (newOrder !== undefined && item.order !== newOrder) {
          item.order = newOrder;
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        // เรียงลำดับ items ตาม order
        evaluation.items.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        await evaluation.save();
        console.log(`🔄 อัปเดต evaluation: ${evaluation._id}`);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }
    
    console.log('🎉 การอัปเดตเสร็จสิ้น!');
    console.log(`📊 สรุปผลลัพธ์:`);
    console.log(`   - อัปเดตสำเร็จ: ${updatedCount} evaluations`);
    console.log(`   - ข้าม: ${skippedCount} evaluations`);
    console.log(`   - รวม: ${evaluations.length} evaluations`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    // ปิดการเชื่อมต่อ database
    await mongoose.disconnect();
    console.log('🔌 ปิดการเชื่อมต่อ database');
  }
}

// Function สำหรับแสดงตัวอย่าง order ที่จะอัปเดต
async function previewEvaluationItemsOrder() {
  try {
    console.log('🔍 แสดงตัวอย่าง order field ที่จะอัปเดต...');
    
    // เชื่อมต่อ database
    await connectDB();
    console.log('✅ เชื่อมต่อ database สำเร็จ');
    
    // ดึงข้อมูล evaluation items ทั้งหมด
    const evaluationItems = await EvaluationItem.find().sort({ order: 1 });
    console.log(`📋 พบ evaluation items ${evaluationItems.length} รายการ`);
    
    console.log('\n📋 ตัวอย่าง order field ที่จะอัปเดต:');
    console.log('='.repeat(80));
    
    evaluationItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`);
      console.log(`   ID: ${item._id}`);
      console.log(`   Order: ${item.order || (index + 1)}`);
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
  previewEvaluationItemsOrder();
} else if (command === 'update') {
  updateEvaluationItemsOrder();
} else {
  console.log('📖 วิธีใช้งาน:');
  console.log('   node updateEvaluationItemsOrder.js preview  - แสดงตัวอย่าง order field ที่จะอัปเดต');
  console.log('   node updateEvaluationItemsOrder.js update   - อัปเดต order field จริง');
  console.log('\n⚠️  คำเตือน: ใช้คำสั่ง update อย่างระมัดระวัง เพราะจะเปลี่ยนข้อมูลใน database');
}

