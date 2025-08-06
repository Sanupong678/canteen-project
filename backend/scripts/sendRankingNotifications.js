import mongoose from 'mongoose';
import Ranking from '../models/rankingModel.js';
import Shop from '../models/shopModel.js';
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

// ฟังก์ชันสร้าง notification สำหรับร้านที่มีข้อมูล ranking
const createNotificationForRankingShop = async (ranking) => {
  try {
    // สร้างข้อมูล evaluation จำลองสำหรับ notification
    const evaluationData = {
      _id: ranking._id,
      shopId: ranking.shopId || ranking._id, // ใช้ ranking._id ถ้าไม่มี shopId
      shopName: ranking.shopName,
      canteenName: ranking.canteenName,
      totalScore: ranking.evaluationStatus === 'ผ่าน' ? 100 : 50, // คะแนนตามสถานะ
      finalStatus: ranking.evaluationStatus,
      evaluationMonth: new Date().getMonth() + 1,
      evaluationYear: new Date().getFullYear(),
      evaluatedAt: ranking.evaluationDate || new Date(),
      revenue: ranking.revenue,
      isActive: true
    };

    // สร้าง notification
    const evaluatorName = ranking.evaluatorName || 'Admin';
    const notification = await createRankingEvaluationNotification(evaluationData, evaluatorName);
    
    console.log(`✅ Notification created for shop: ${ranking.shopName}`);
    console.log(`   - Status: ${ranking.evaluationStatus}`);
    console.log(`   - Revenue: ${ranking.revenue}`);
    console.log(`   - Canteen: ${ranking.canteenName}`);
    
    return notification;
  } catch (error) {
    console.error(`❌ Error creating notification for shop ${ranking.shopName}:`, error);
    return null;
  }
};

// ฟังก์ชันหลัก
const sendRankingNotifications = async () => {
  try {
    console.log('🚀 Starting to send ranking notifications...');
    
    // ดึงข้อมูล ranking ทั้งหมด
    const rankings = await Ranking.find({}).populate('canteenId');
    console.log(`📊 Found ${rankings.length} ranking records`);
    
    if (rankings.length === 0) {
      console.log('❌ No ranking data found');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // สร้าง notification สำหรับแต่ละร้าน
    for (const ranking of rankings) {
      try {
        // ตรวจสอบว่ามี notification อยู่แล้วหรือไม่
        const existingNotification = await Notification.findOne({
          shopId: ranking._id,
          type: 'ranking_evaluation',
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)) // วันนี้
          }
        });
        
        if (existingNotification) {
          console.log(`⚠️  Notification already exists for shop: ${ranking.shopName}`);
          continue;
        }
        
        const notification = await createNotificationForRankingShop(ranking);
        if (notification) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // รอสักครู่เพื่อไม่ให้ server ทำงานหนักเกินไป
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing ranking for shop ${ranking.shopName}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n📈 Summary:');
    console.log(`✅ Successfully created notifications: ${successCount}`);
    console.log(`❌ Failed to create notifications: ${errorCount}`);
    console.log(`📊 Total rankings processed: ${rankings.length}`);
    
  } catch (error) {
    console.error('❌ Error in sendRankingNotifications:', error);
  }
};

// ฟังก์ชันสำหรับส่ง notification เฉพาะร้านที่ยังไม่มี notification
const sendNotificationsForNewRankings = async () => {
  try {
    console.log('🚀 Checking for new rankings without notifications...');
    
    // ดึงข้อมูล ranking ทั้งหมด
    const rankings = await Ranking.find({}).populate('canteenId');
    console.log(`📊 Found ${rankings.length} ranking records`);
    
    if (rankings.length === 0) {
      console.log('❌ No ranking data found');
      return;
    }
    
    let newNotificationCount = 0;
    
    for (const ranking of rankings) {
      try {
        // ตรวจสอบว่ามี notification อยู่แล้วหรือไม่
        const existingNotification = await Notification.findOne({
          shopId: ranking._id,
          type: 'ranking_evaluation'
        });
        
        if (!existingNotification) {
          console.log(`📝 Creating new notification for shop: ${ranking.shopName}`);
          const notification = await createNotificationForRankingShop(ranking);
          if (notification) {
            newNotificationCount++;
          }
        } else {
          console.log(`✅ Notification already exists for shop: ${ranking.shopName}`);
        }
        
        // รอสักครู่
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing ranking for shop ${ranking.shopName}:`, error);
      }
    }
    
    console.log(`\n📈 New notifications created: ${newNotificationCount}`);
    
  } catch (error) {
    console.error('❌ Error in sendNotificationsForNewRankings:', error);
  }
};

// ฟังก์ชันสำหรับแสดงสถิติ
const showStatistics = async () => {
  try {
    console.log('📊 Ranking Notification Statistics');
    console.log('================================');
    
    const totalRankings = await Ranking.countDocuments();
    const totalNotifications = await Notification.countDocuments({ type: 'ranking_evaluation' });
    const todayNotifications = await Notification.countDocuments({
      type: 'ranking_evaluation',
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });
    
    console.log(`📈 Total rankings: ${totalRankings}`);
    console.log(`📧 Total ranking notifications: ${totalNotifications}`);
    console.log(`📅 Today's notifications: ${todayNotifications}`);
    
    // แสดงรายการร้านที่มี ranking
    const rankings = await Ranking.find({}).select('shopName canteenName evaluationStatus revenue');
    console.log('\n🏪 Shops with ranking data:');
    rankings.forEach((ranking, index) => {
      console.log(`${index + 1}. ${ranking.shopName} (${ranking.canteenName})`);
      console.log(`   Status: ${ranking.evaluationStatus}, Revenue: ${ranking.revenue}`);
    });
    
  } catch (error) {
    console.error('❌ Error showing statistics:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'send-all':
      await sendRankingNotifications();
      break;
    case 'send-new':
      await sendNotificationsForNewRankings();
      break;
    case 'stats':
      await showStatistics();
      break;
    default:
      console.log('Usage:');
      console.log('  node sendRankingNotifications.js send-all  - Send notifications to all ranking shops');
      console.log('  node sendRankingNotifications.js send-new  - Send notifications only to shops without notifications');
      console.log('  node sendRankingNotifications.js stats     - Show statistics');
      break;
  }
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
};

// Run the script
main().catch(console.error); 