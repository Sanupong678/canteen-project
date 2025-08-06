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

// ฟังก์ชันสร้างข้อมูล ranking จำลอง
const createRankingData = async () => {
  try {
    console.log('🚀 Creating ranking data for existing shops...');
    
    // ดึงข้อมูลร้านค้าทั้งหมด
    const shops = await Shop.find({});
    console.log(`📊 Found ${shops.length} shops`);
    
    if (shops.length === 0) {
      console.log('❌ No shops found');
      return 0;
    }
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const shop of shops) {
      try {
        // ตรวจสอบว่ามีข้อมูล ranking อยู่แล้วหรือไม่
        const existingRanking = await Ranking.findOne({ shopName: shop.name });
        
        if (existingRanking) {
          console.log(`⚠️  Ranking data already exists for shop: ${shop.name}`);
          skippedCount++;
          continue;
        }
        
        // สร้างข้อมูล ranking จำลอง
        const revenue = Math.floor(Math.random() * 100000) + 10000; // รายได้ 10,000 - 110,000
        const evaluationStatus = Math.random() > 0.3 ? 'ผ่าน' : 'ไม่ผ่าน'; // 70% ผ่าน, 30% ไม่ผ่าน
        
        const rankingData = {
          shopName: shop.name,
          canteenId: new mongoose.Types.ObjectId(), // สร้าง ObjectId จำลอง
          canteenName: `โรงอาหาร ${shop.canteenId}`,
          revenue: revenue,
          evaluationStatus: evaluationStatus,
          overallStatus: evaluationStatus === 'ผ่าน' ? 'เสร็จสิ้น' : 'รอดำเนินการ',
          notes: `ข้อมูลจำลองสำหรับ ${shop.name}`,
          evaluationDate: new Date(),
          evaluatorName: 'Admin'
        };
        
        const ranking = new Ranking(rankingData);
        await ranking.save();
        
        console.log(`✅ Created ranking data for shop: ${shop.name}`);
        console.log(`   - Revenue: ${revenue.toLocaleString()}`);
        console.log(`   - Status: ${evaluationStatus}`);
        
        createdCount++;
        
        // รอสักครู่
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error creating ranking for shop ${shop.name}:`, error);
      }
    }
    
    console.log(`\n📈 Ranking Data Summary:`);
    console.log(`✅ Created ranking data: ${createdCount}`);
    console.log(`⚠️  Skipped (already exists): ${skippedCount}`);
    
    return createdCount;
    
  } catch (error) {
    console.error('❌ Error in createRankingData:', error);
    return 0;
  }
};

// ฟังก์ชันสร้าง notification สำหรับร้านที่มีข้อมูล ranking
const createNotificationForRankingShop = async (ranking) => {
  try {
    // สร้างข้อมูล evaluation จำลองสำหรับ notification
    const evaluationData = {
      _id: ranking._id,
      shopId: ranking._id, // ใช้ ranking._id เป็น shopId
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

// ฟังก์ชันส่ง notification ให้ทุกร้านที่มีข้อมูล ranking
const sendRankingNotifications = async () => {
  try {
    console.log('🚀 Sending ranking notifications...');
    
    // ดึงข้อมูล ranking ทั้งหมด
    const rankings = await Ranking.find({});
    console.log(`📊 Found ${rankings.length} ranking records`);
    
    if (rankings.length === 0) {
      console.log('❌ No ranking data found');
      return 0;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // สร้าง notification สำหรับแต่ละร้าน
    for (const ranking of rankings) {
      try {
        // ตรวจสอบว่ามี notification อยู่แล้วหรือไม่
        const existingNotification = await Notification.findOne({
          shopId: ranking._id,
          type: 'ranking_evaluation'
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
    
    console.log(`\n📈 Notification Summary:`);
    console.log(`✅ Successfully created notifications: ${successCount}`);
    console.log(`❌ Failed to create notifications: ${errorCount}`);
    console.log(`📊 Total rankings processed: ${rankings.length}`);
    
    return successCount;
    
  } catch (error) {
    console.error('❌ Error in sendRankingNotifications:', error);
    return 0;
  }
};

// ฟังก์ชันแสดงสถิติ
const showStatistics = async () => {
  try {
    console.log('📊 Complete Statistics');
    console.log('=====================');
    
    const totalShops = await Shop.countDocuments();
    const totalRankings = await Ranking.countDocuments();
    const totalNotifications = await Notification.countDocuments({ type: 'ranking_evaluation' });
    const todayNotifications = await Notification.countDocuments({
      type: 'ranking_evaluation',
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });
    
    console.log(`🏪 Total shops: ${totalShops}`);
    console.log(`📈 Total rankings: ${totalRankings}`);
    console.log(`📧 Total ranking notifications: ${totalNotifications}`);
    console.log(`📅 Today's notifications: ${todayNotifications}`);
    
    // แสดงรายการร้านที่มี ranking
    const rankings = await Ranking.find({})
      .select('shopName canteenName evaluationStatus revenue')
      .sort({ revenue: -1 });
    
    console.log('\n🏪 Shops with ranking data:');
    rankings.forEach((ranking, index) => {
      console.log(`${index + 1}. ${ranking.shopName} (${ranking.canteenName})`);
      console.log(`   Revenue: ${ranking.revenue.toLocaleString()}`);
      console.log(`   Status: ${ranking.evaluationStatus}`);
    });
    
  } catch (error) {
    console.error('❌ Error showing statistics:', error);
  }
};

// ฟังก์ชันหลักที่จะรันทั้งการสร้างข้อมูล ranking และส่ง notification
const setupRankingNotifications = async () => {
  try {
    console.log('🎯 Setting up ranking notifications for all shops...');
    console.log('==================================================');
    
    // ขั้นตอนที่ 1: สร้างข้อมูล ranking
    console.log('\n📊 Step 1: Creating ranking data...');
    const rankingCount = await createRankingData();
    
    // ขั้นตอนที่ 2: ส่ง notification
    console.log('\n📧 Step 2: Sending notifications...');
    const notificationCount = await sendRankingNotifications();
    
    // แสดงสรุปผล
    console.log('\n🎉 Setup Complete!');
    console.log('==================');
    console.log(`✅ Ranking data created: ${rankingCount}`);
    console.log(`📧 Notifications sent: ${notificationCount}`);
    
    if (rankingCount > 0 || notificationCount > 0) {
      console.log('\n🎯 All shops with ranking data now have notifications!');
    } else {
      console.log('\n⚠️  No new data was created. All shops may already have ranking data and notifications.');
    }
    
  } catch (error) {
    console.error('❌ Error in setupRankingNotifications:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      await setupRankingNotifications();
      break;
    case 'create-ranking':
      await createRankingData();
      break;
    case 'send-notifications':
      await sendRankingNotifications();
      break;
    case 'stats':
      await showStatistics();
      break;
    default:
      console.log('Usage:');
      console.log('  node setupRankingNotifications.js setup              - Create ranking data and send notifications');
      console.log('  node setupRankingNotifications.js create-ranking     - Create ranking data only');
      console.log('  node setupRankingNotifications.js send-notifications - Send notifications only');
      console.log('  node setupRankingNotifications.js stats              - Show statistics');
      break;
  }
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
};

// Run the script
main().catch(console.error); 