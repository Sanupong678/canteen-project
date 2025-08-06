import mongoose from 'mongoose';
import Ranking from '../models/rankingModel.js';
import Shop from '../models/shopModel.js';
import Canteen from '../models/canteenModel.js';
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
      return;
    }
    
    // ดึงข้อมูลโรงอาหาร
    const canteens = await Canteen.find({});
    const canteenMap = {};
    canteens.forEach(canteen => {
      canteenMap[canteen.canteenId] = canteen;
    });
    
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
        const canteen = canteenMap[shop.canteenId];
        const revenue = Math.floor(Math.random() * 100000) + 10000; // รายได้ 10,000 - 110,000
        const evaluationStatus = Math.random() > 0.3 ? 'ผ่าน' : 'ไม่ผ่าน'; // 70% ผ่าน, 30% ไม่ผ่าน
        
        const rankingData = {
          shopName: shop.name,
          canteenId: canteen ? canteen._id : null,
          canteenName: canteen ? canteen.name : `โรงอาหาร ${shop.canteenId}`,
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
        console.log(`   - Canteen: ${rankingData.canteenName}`);
        
        createdCount++;
        
        // รอสักครู่
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error creating ranking for shop ${shop.name}:`, error);
      }
    }
    
    console.log('\n📈 Summary:');
    console.log(`✅ Created ranking data: ${createdCount}`);
    console.log(`⚠️  Skipped (already exists): ${skippedCount}`);
    console.log(`📊 Total shops processed: ${shops.length}`);
    
  } catch (error) {
    console.error('❌ Error in createRankingData:', error);
  }
};

// ฟังก์ชันลบข้อมูล ranking ทั้งหมด
const clearRankingData = async () => {
  try {
    console.log('🗑️  Clearing all ranking data...');
    
    const result = await Ranking.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} ranking records`);
    
  } catch (error) {
    console.error('❌ Error clearing ranking data:', error);
  }
};

// ฟังก์ชันแสดงสถิติ
const showRankingStats = async () => {
  try {
    console.log('📊 Ranking Data Statistics');
    console.log('==========================');
    
    const totalRankings = await Ranking.countDocuments();
    const passedRankings = await Ranking.countDocuments({ evaluationStatus: 'ผ่าน' });
    const failedRankings = await Ranking.countDocuments({ evaluationStatus: 'ไม่ผ่าน' });
    const completedRankings = await Ranking.countDocuments({ overallStatus: 'เสร็จสิ้น' });
    const pendingRankings = await Ranking.countDocuments({ overallStatus: 'รอดำเนินการ' });
    
    console.log(`📈 Total rankings: ${totalRankings}`);
    console.log(`✅ Passed evaluations: ${passedRankings}`);
    console.log(`❌ Failed evaluations: ${failedRankings}`);
    console.log(`🎯 Completed overall: ${completedRankings}`);
    console.log(`⏳ Pending overall: ${pendingRankings}`);
    
    // แสดงรายการร้านที่มี ranking
    const rankings = await Ranking.find({})
      .select('shopName canteenName evaluationStatus revenue overallStatus')
      .sort({ revenue: -1 });
    
    console.log('\n🏪 Shops with ranking data (sorted by revenue):');
    rankings.forEach((ranking, index) => {
      console.log(`${index + 1}. ${ranking.shopName} (${ranking.canteenName})`);
      console.log(`   Revenue: ${ranking.revenue.toLocaleString()}`);
      console.log(`   Evaluation: ${ranking.evaluationStatus}`);
      console.log(`   Overall: ${ranking.overallStatus}`);
    });
    
  } catch (error) {
    console.error('❌ Error showing ranking stats:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      await createRankingData();
      break;
    case 'clear':
      await clearRankingData();
      break;
    case 'stats':
      await showRankingStats();
      break;
    default:
      console.log('Usage:');
      console.log('  node createRankingData.js create  - Create ranking data for all shops');
      console.log('  node createRankingData.js clear   - Clear all ranking data');
      console.log('  node createRankingData.js stats   - Show ranking statistics');
      break;
  }
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
};

// Run the script
main().catch(console.error); 