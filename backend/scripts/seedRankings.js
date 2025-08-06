import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ranking from '../models/rankingModel.js';
import Canteen from '../models/canteenModel.js';

dotenv.config();

const sampleRankings = [
  {
    shopName: 'ร้านก๋วยเตี๋ยวแม่ปู',
    canteenName: 'โรงอาหารกลาง',
    revenue: 15000,
    evaluationStatus: 'ผ่าน',
    overallStatus: 'เสร็จสิ้น',
    notes: 'ร้านอาหารที่สะอาดและมีคุณภาพ อาหารอร่อย'
  },
  {
    shopName: 'ร้านข้าวแกงป้าแอ๋ว',
    canteenName: 'โรงอาหารกลาง',
    revenue: 12000,
    evaluationStatus: 'ผ่าน',
    overallStatus: 'เสร็จสิ้น',
    notes: 'อาหารอร่อย ราคาเหมาะสม'
  },
  {
    shopName: 'ร้านส้มตำป้าส้ม',
    canteenName: 'โรงอาหารกลาง',
    revenue: 8000,
    evaluationStatus: 'ไม่ผ่าน',
    overallStatus: 'รอดำเนินการ',
    notes: 'ต้องปรับปรุงความสะอาด'
  },
  {
    shopName: 'ร้านชานมไข่มุก',
    canteenName: 'โรงอาหารกลาง',
    revenue: 20000,
    evaluationStatus: 'ผ่าน',
    overallStatus: 'เสร็จสิ้น',
    notes: 'ยอดขายดีมาก'
  },
  {
    shopName: 'ร้านข้าวมันไก่',
    canteenName: 'โรงอาหารกลาง',
    revenue: 18000,
    evaluationStatus: 'ผ่าน',
    overallStatus: 'เสร็จสิ้น',
    notes: 'อาหารมีคุณภาพ'
  },
  {
    shopName: 'ร้านข้าวผัดกุ้ง',
    canteenName: 'โรงอาหารคณะวิศวกรรมศาสตร์',
    revenue: 16000,
    evaluationStatus: 'ผ่าน',
    overallStatus: 'เสร็จสิ้น',
    notes: 'ข้าวผัดอร่อย ใส่กุ้งเยอะ'
  },
  {
    shopName: 'ร้านก๋วยเตี๋ยวต้มยำ',
    canteenName: 'โรงอาหารคณะวิศวกรรมศาสตร์',
    revenue: 14000,
    evaluationStatus: 'ผ่าน',
    overallStatus: 'เสร็จสิ้น',
    notes: 'น้ำซุปเข้มข้น รสชาติดี'
  },
  {
    shopName: 'ร้านข้าวแกงไก่',
    canteenName: 'โรงอาหารคณะวิทยาศาสตร์',
    revenue: 11000,
    evaluationStatus: 'ไม่ผ่าน',
    overallStatus: 'รอดำเนินการ',
    notes: 'ต้องปรับปรุงความสะอาดของร้าน'
  },
  {
    shopName: 'ร้านข้าวมันไก่ป้าเล็ก',
    canteenName: 'โรงอาหารคณะวิทยาศาสตร์',
    revenue: 13000,
    evaluationStatus: 'ผ่าน',
    overallStatus: 'เสร็จสิ้น',
    notes: 'ไก่สด น้ำจิ้มอร่อย'
  },
  {
    shopName: 'ร้านก๋วยเตี๋ยวเรือ',
    canteenName: 'โรงอาหารคณะวิทยาศาสตร์',
    revenue: 9000,
    evaluationStatus: 'ผ่าน',
    overallStatus: 'เสร็จสิ้น',
    notes: 'ราคาไม่แพง อาหารอร่อย'
  }
];

async function seedRankings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing rankings
    await Ranking.deleteMany({});
    console.log('Cleared existing rankings');

    // Get or create canteens
    const canteens = {};
    for (const ranking of sampleRankings) {
      if (!canteens[ranking.canteenName]) {
        let canteen = await Canteen.findOne({ name: ranking.canteenName });
        if (!canteen) {
          canteen = new Canteen({ name: ranking.canteenName });
          await canteen.save();
          console.log(`Created canteen: ${ranking.canteenName}`);
        }
        canteens[ranking.canteenName] = canteen;
      }
    }

    // Create rankings
    for (const rankingData of sampleRankings) {
      const canteen = canteens[rankingData.canteenName];
      
      const ranking = new Ranking({
        shopName: rankingData.shopName,
        canteenId: canteen._id,
        canteenName: canteen.name,
        revenue: rankingData.revenue,
        evaluationStatus: rankingData.evaluationStatus,
        overallStatus: rankingData.overallStatus,
        notes: rankingData.notes
      });

      await ranking.save();
      console.log(`Created ranking: ${rankingData.shopName}`);
    }

    console.log('✅ Successfully seeded rankings');
    
    // Display summary
    const totalRankings = await Ranking.countDocuments();
    const totalRevenue = await Ranking.aggregate([
      { $group: { _id: null, total: { $sum: '$revenue' } } }
    ]);
    
    console.log(`📊 Summary:`);
    console.log(`- Total rankings: ${totalRankings}`);
    console.log(`- Total revenue: ${totalRevenue[0]?.total || 0} THB`);

  } catch (error) {
    console.error('❌ Error seeding rankings:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedRankings(); 