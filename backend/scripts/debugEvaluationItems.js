import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Evaluation from '../models/Evaluation.js';
import EvaluationItem from '../models/EvaluationItem.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

async function debugEvaluationItems() {
  try {
    console.log('🔍 Debug evaluation items...');
    
    // เชื่อมต่อ database
    await connectDB();
    console.log('✅ เชื่อมต่อ database สำเร็จ');
    
    // ดึงข้อมูล evaluation items ทั้งหมด
    const evaluationItems = await EvaluationItem.find().sort({ order: 1 });
    console.log(`📋 พบ evaluation items ${evaluationItems.length} รายการ`);
    
    // ดึงข้อมูล evaluations ทั้งหมด
    const evaluations = await Evaluation.find();
    console.log(`📊 พบ evaluations ${evaluations.length} รายการ`);
    
    // ตรวจสอบ evaluation แรก
    if (evaluations.length > 0) {
      const firstEvaluation = evaluations[0];
      console.log('\n🔍 ตรวจสอบ evaluation แรก:');
      console.log(`ID: ${firstEvaluation._id}`);
      console.log(`Items count: ${firstEvaluation.items.length}`);
      
      console.log('\n📋 Items ใน evaluation แรก:');
      firstEvaluation.items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
        console.log(`   ID: ${item.id}`);
        console.log(`   Order: ${item.order || 'undefined'}`);
        console.log(`   Max Score: ${item.maxScore}`);
        console.log('---');
      });
    }
    
    // ตรวจสอบ evaluation ที่มี items มากที่สุด
    const evaluationWithMostItems = evaluations.reduce((max, current) => 
      current.items.length > max.items.length ? current : max
    );
    
    if (evaluationWithMostItems) {
      console.log('\n🔍 ตรวจสอบ evaluation ที่มี items มากที่สุด:');
      console.log(`ID: ${evaluationWithMostItems._id}`);
      console.log(`Items count: ${evaluationWithMostItems.items.length}`);
      
      console.log('\n📋 Items ใน evaluation นี้:');
      evaluationWithMostItems.items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
        console.log(`   ID: ${item.id}`);
        console.log(`   Order: ${item.order || 'undefined'}`);
        console.log(`   Max Score: ${item.maxScore}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    // ปิดการเชื่อมต่อ database
    await mongoose.disconnect();
    console.log('🔌 ปิดการเชื่อมต่อ database');
  }
}

debugEvaluationItems();

