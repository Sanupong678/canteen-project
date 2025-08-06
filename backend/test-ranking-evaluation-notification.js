import mongoose from 'mongoose';
import Evaluation from './models/Evaluation.js';
import { createRankingEvaluationNotification } from './controllers/notificationController.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/canteen-project', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create sample evaluation data
const createSampleEvaluation = async () => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // สร้าง sample evaluation
    const sampleEvaluation = new Evaluation({
      shopId: new mongoose.Types.ObjectId(),
      shopName: 'ร้านทดสอบ',
      canteenName: 'โรงอาหาร C5',
      revenue: 75000,
      items: [
        {
          id: new mongoose.Types.ObjectId(),
          title: 'ความสะอาด',
          status: 'ผ่าน'
        },
        {
          id: new mongoose.Types.ObjectId(),
          title: 'คุณภาพอาหาร',
          status: 'ผ่าน'
        }
      ],
      totalScore: 85,
      finalStatus: 'ผ่าน',
      evaluationMonth: currentMonth,
      evaluationYear: currentYear,
      evaluatedAt: new Date(),
      isActive: true
    });
    
    await sampleEvaluation.save();
    console.log('✅ Sample evaluation created:', sampleEvaluation._id);
    return sampleEvaluation;
  } catch (error) {
    console.error('❌ Error creating sample evaluation:', error);
    throw error;
  }
};

// Test ranking evaluation notification
const testRankingEvaluationNotification = async () => {
  try {
    console.log('🧪 Testing ranking evaluation notification system...');
    
    // ลบข้อมูลทดสอบเก่า
    await Evaluation.deleteMany({ shopName: 'ร้านทดสอบ' });
    console.log('🧹 Cleaned up old test data');
    
    // สร้างข้อมูลทดสอบใหม่
    console.log('📝 Creating fresh test data...');
    const evaluation = await createSampleEvaluation();
    
    console.log('📊 Created evaluation:', {
      shopId: evaluation.shopId,
      shopName: evaluation.shopName,
      currentScore: evaluation.totalScore,
      revenue: evaluation.revenue,
      canteenName: evaluation.canteenName
    });
    
    // ทดสอบการสร้าง ranking evaluation notification
    const evaluatorName = 'Admin ทดสอบ';
    const notification = await createRankingEvaluationNotification(evaluation, evaluatorName);
    
    console.log('✅ Ranking evaluation notification test completed');
    console.log('📋 Notification details:', {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      rankingEvaluationData: notification.rankingEvaluationData
    });
    
  } catch (error) {
    console.error('❌ Error testing ranking evaluation notification:', error);
  }
};

// Run test
const runTest = async () => {
  await connectDB();
  await testRankingEvaluationNotification();
  
  console.log('🏁 Test completed');
  process.exit(0);
};

runTest(); 