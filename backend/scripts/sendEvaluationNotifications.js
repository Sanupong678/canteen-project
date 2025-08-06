import mongoose from 'mongoose';
import Evaluation from '../models/Evaluation.js';
import Notification from '../models/notificationModel.js';
import { createRankingEvaluationNotification } from '../controllers/notificationController.js';
import dotenv from 'dotenv';

dotenv.config();

// เชื่อมต่อ MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// ฟังก์ชันสร้าง notification สำหรับร้านที่มีข้อมูล evaluation
const createNotificationForEvaluation = async (evaluation) => {
  try {
    // สร้าง notification
    const evaluatorName = evaluation.evaluatorName || 'Admin';
    const notification = await createRankingEvaluationNotification(evaluation, evaluatorName);
    
    console.log(`✅ Notification created for shop: ${evaluation.shopName}`);
    console.log(`   - Score: ${evaluation.totalScore}/100`);
    console.log(`   - Status: ${evaluation.finalStatus}`);
    console.log(`   - Month/Year: ${evaluation.evaluationMonth}/${evaluation.evaluationYear}`);
    console.log(`   - Canteen: ${evaluation.canteenName}`);
    
    return notification;
  } catch (error) {
    console.error(`❌ Error creating notification for shop ${evaluation.shopName}:`, error);
    return null;
  }
};

// ฟังก์ชันส่ง notification ให้ทุกร้านที่มีข้อมูล evaluation
const sendEvaluationNotifications = async () => {
  try {
    console.log('🚀 Sending evaluation notifications...');
    
    // ดึงข้อมูล evaluation ทั้งหมดที่ active
    const evaluations = await Evaluation.find({ isActive: true });
    console.log(`📊 Found ${evaluations.length} evaluation records`);
    
    if (evaluations.length === 0) {
      console.log('❌ No evaluation data found');
      return 0;
    }
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // สร้าง notification สำหรับแต่ละร้าน
    for (const evaluation of evaluations) {
      try {
        // ตรวจสอบว่ามี notification อยู่แล้วหรือไม่
        const existingNotification = await Notification.findOne({
          shopId: evaluation.shopId,
          type: 'ranking_evaluation',
          'rankingEvaluationData.evaluationMonth': evaluation.evaluationMonth,
          'rankingEvaluationData.evaluationYear': evaluation.evaluationYear
        });
        
        if (existingNotification) {
          console.log(`⚠️  Notification already exists for shop: ${evaluation.shopName} (${evaluation.evaluationMonth}/${evaluation.evaluationYear})`);
          skippedCount++;
          continue;
        }
        
        const notification = await createNotificationForEvaluation(evaluation);
        if (notification) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // รอสักครู่เพื่อไม่ให้ server ทำงานหนักเกินไป
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing evaluation for shop ${evaluation.shopName}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\n📈 Notification Summary:`);
    console.log(`✅ Successfully created notifications: ${successCount}`);
    console.log(`⚠️  Skipped (already exists): ${skippedCount}`);
    console.log(`❌ Failed to create notifications: ${errorCount}`);
    console.log(`📊 Total evaluations processed: ${evaluations.length}`);
    
    return successCount;
    
  } catch (error) {
    console.error('❌ Error in sendEvaluationNotifications:', error);
    return 0;
  }
};

// ฟังก์ชันแสดงสถิติ
const showStatistics = async () => {
  try {
    console.log('📊 Evaluation Notification Statistics');
    console.log('===================================');
    
    const totalEvaluations = await Evaluation.countDocuments({ isActive: true });
    const totalNotifications = await Notification.countDocuments({ type: 'ranking_evaluation' });
    const todayNotifications = await Notification.countDocuments({
      type: 'ranking_evaluation',
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });
    
    console.log(`📈 Total evaluations: ${totalEvaluations}`);
    console.log(`📧 Total ranking notifications: ${totalNotifications}`);
    console.log(`📅 Today's notifications: ${todayNotifications}`);
    
    // แสดงรายการร้านที่มี evaluation
    const evaluations = await Evaluation.find({ isActive: true })
      .select('shopName canteenName totalScore finalStatus evaluationMonth evaluationYear')
      .sort({ evaluationMonth: -1, evaluationYear: -1 });
    
    console.log('\n🏪 Shops with evaluation data:');
    evaluations.forEach((evaluation, index) => {
      console.log(`${index + 1}. ${evaluation.shopName} (${evaluation.canteenName})`);
      console.log(`   Score: ${evaluation.totalScore}/100`);
      console.log(`   Status: ${evaluation.finalStatus}`);
      console.log(`   Period: ${evaluation.evaluationMonth}/${evaluation.evaluationYear}`);
    });
    
  } catch (error) {
    console.error('❌ Error showing statistics:', error);
  }
};

// ฟังก์ชันแสดงรายละเอียดข้อมูล evaluation
const showEvaluationDetails = async () => {
  try {
    console.log('📋 Evaluation Data Details');
    console.log('==========================');
    
    const evaluations = await Evaluation.find({ isActive: true })
      .sort({ evaluationMonth: -1, evaluationYear: -1 });
    
    console.log(`📊 Found ${evaluations.length} evaluation records:`);
    
    evaluations.forEach((evaluation, index) => {
      console.log(`\n${index + 1}. Shop: ${evaluation.shopName}`);
      console.log(`   ID: ${evaluation._id}`);
      console.log(`   Shop ID: ${evaluation.shopId}`);
      console.log(`   Canteen: ${evaluation.canteenName}`);
      console.log(`   Revenue: ${evaluation.revenue || 0}`);
      console.log(`   Score: ${evaluation.totalScore}/100`);
      console.log(`   Status: ${evaluation.finalStatus}`);
      console.log(`   Period: ${evaluation.evaluationMonth}/${evaluation.evaluationYear}`);
      console.log(`   Evaluated At: ${evaluation.evaluatedAt}`);
      console.log(`   Items Count: ${evaluation.items?.length || 0}`);
      
      if (evaluation.items && evaluation.items.length > 0) {
        console.log(`   Items:`);
        evaluation.items.forEach((item, itemIndex) => {
          console.log(`     ${itemIndex + 1}. ${item.title} - ${item.status}`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error showing evaluation details:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'send':
      await sendEvaluationNotifications();
      break;
    case 'stats':
      await showStatistics();
      break;
    case 'details':
      await showEvaluationDetails();
      break;
    default:
      console.log('Usage:');
      console.log('  node sendEvaluationNotifications.js send     - Send notifications for existing evaluations');
      console.log('  node sendEvaluationNotifications.js stats    - Show statistics');
      console.log('  node sendEvaluationNotifications.js details  - Show detailed evaluation data');
      break;
  }
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
};

// Run the script
main().catch(console.error); 