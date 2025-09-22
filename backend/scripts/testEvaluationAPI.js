import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Evaluation from '../models/Evaluation.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

async function testEvaluationAPI() {
  try {
    console.log('🔍 ทดสอบ Evaluation API...');
    
    // เชื่อมต่อ database
    await connectDB();
    console.log('✅ เชื่อมต่อ database สำเร็จ');
    
    // ดึงข้อมูล evaluation แรก
    const evaluation = await Evaluation.findOne();
    
    if (!evaluation) {
      console.log('❌ ไม่พบข้อมูล evaluation');
      return;
    }
    
    console.log(`📊 พบ evaluation: ${evaluation._id}`);
    console.log(`🏪 ร้านค้า: ${evaluation.shopName || 'ไม่ระบุ'}`);
    
    // เรียงลำดับ items ตาม order (เหมือนใน API)
    const sortedItems = (evaluation.items || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    console.log('\n📋 Items ที่เรียงลำดับแล้ว:');
    sortedItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`);
      console.log(`   Order: ${item.order || 'undefined'}`);
      console.log(`   Max Score: ${item.maxScore}`);
      console.log('---');
    });
    
    // สร้างข้อมูล response เหมือน API
    const transformedEvaluation = {
      _id: evaluation._id,
      shopId: evaluation.shopId,
      customId: evaluation.shopId?.customId,
      shopName: evaluation.shopId?.name,
      canteenName: `โรงอาหาร ${evaluation.shopId?.canteenId}`,
      type: evaluation.shopId?.type,
      revenue: evaluation.revenue || 0,
      items: sortedItems,
      totalScore: evaluation.totalScore || 0,
      finalStatus: evaluation.finalStatus || 'รอดำเนินการ',
      evaluationMonth: evaluation.evaluationMonth,
      evaluationYear: evaluation.evaluationYear,
      evaluationRound: evaluation.evaluationRound,
      evaluatedAt: evaluation.evaluatedAt,
      updatedAt: evaluation.updatedAt
    };
    
    console.log('\n📤 ข้อมูลที่ API จะส่งกลับ:');
    console.log(JSON.stringify(transformedEvaluation, null, 2));
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    // ปิดการเชื่อมต่อ database
    await mongoose.disconnect();
    console.log('🔌 ปิดการเชื่อมต่อ database');
  }
}

testEvaluationAPI();
