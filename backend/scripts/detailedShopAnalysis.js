import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Shop from '../models/shopModel.js';

// Load environment variables
dotenv.config();

// เชื่อมต่อ database
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is required');
    }
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      family: 4
    };

    await mongoose.connect(mongoUri, options);
    console.log('✅ Connected to MongoDB:', mongoose.connection.host);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// วิเคราะห์ข้อมูล Shop collection แบบละเอียด
const detailedShopAnalysis = async () => {
  try {
    console.log('🔍 Detailed Shop Collection Analysis...\n');
    
    // ดึงข้อมูลทั้งหมด
    const allShops = await Shop.find().lean();
    console.log(`📊 Total shops: ${allShops.length}\n`);
    
    // แสดงข้อมูลแต่ละร้านแบบละเอียด
    allShops.forEach((shop, index) => {
      console.log(`🏪 Shop ${index + 1}: ${shop.name}`);
      console.log('='.repeat(50));
      console.log(`ID: ${shop._id}`);
      console.log(`Custom ID: ${shop.customId}`);
      console.log(`Type: ${shop.type}`);
      console.log(`Description: ${shop.description || 'N/A'}`);
      console.log(`Location: ${shop.location}`);
      console.log(`Contract Start: ${shop.contractStartDate ? shop.contractStartDate.toISOString().split('T')[0] : 'N/A'}`);
      console.log(`Contract End: ${shop.contractEndDate ? shop.contractEndDate.toISOString().split('T')[0] : 'N/A'}`);
      console.log(`Image: ${shop.image || 'N/A'}`);
      console.log(`Canteen ID: ${shop.canteenId}`);
      console.log(`User ID: ${shop.userId}`);
      console.log(`Score: ${shop.score}`);
      console.log(`Evaluation Status: ${shop.evaluationStatus}`);
      console.log(`Evaluation Completed: ${shop.evaluationCompleted}`);
      console.log(`Evaluation Date: ${shop.evaluationDate ? shop.evaluationDate.toISOString().split('T')[0] : 'N/A'}`);
      console.log(`Created At: ${shop.createdAt ? shop.createdAt.toISOString().split('T')[0] : 'N/A'}`);
      console.log(`Updated At: ${shop.updatedAt ? shop.updatedAt.toISOString().split('T')[0] : 'N/A'}`);
      
      // ข้อมูล credentials
      if (shop.credentials) {
        console.log('\n🔐 Credentials:');
        console.log(`  Username: ${shop.credentials.username}`);
        console.log(`  Password: ${shop.credentials.password ? 'Set' : 'Not set'}`);
        console.log(`  Password Hash: ${shop.credentials.password_hash ? 'Set' : 'Not set'}`);
        console.log(`  Status: ${shop.credentials.status}`);
      } else {
        console.log('\n🔐 Credentials: Not found');
      }
      
      console.log('\n');
    });
    
    // สรุปสถิติ
    console.log('📈 Summary Statistics:');
    console.log('='.repeat(50));
    
    // สถิติตาม type
    const typeStats = {};
    allShops.forEach(shop => {
      typeStats[shop.type] = (typeStats[shop.type] || 0) + 1;
    });
    console.log('\n📊 By Type:');
    Object.entries(typeStats).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} shops`);
    });
    
    // สถิติตาม canteen
    const canteenStats = {};
    allShops.forEach(shop => {
      canteenStats[shop.canteenId] = (canteenStats[shop.canteenId] || 0) + 1;
    });
    console.log('\n🏢 By Canteen ID:');
    Object.entries(canteenStats).forEach(([canteenId, count]) => {
      console.log(`  Canteen ${canteenId}: ${count} shops`);
    });
    
    // สถิติตาม evaluation status
    const evaluationStats = {};
    allShops.forEach(shop => {
      evaluationStats[shop.evaluationStatus] = (evaluationStats[shop.evaluationStatus] || 0) + 1;
    });
    console.log('\n📋 By Evaluation Status:');
    Object.entries(evaluationStats).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} shops`);
    });
    
    // สถิติตาม credentials status
    const credentialsStats = {};
    allShops.forEach(shop => {
      if (shop.credentials && shop.credentials.status) {
        credentialsStats[shop.credentials.status] = (credentialsStats[shop.credentials.status] || 0) + 1;
      }
    });
    console.log('\n🔐 By Credentials Status:');
    Object.entries(credentialsStats).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} shops`);
    });
    
    // ตรวจสอบข้อมูลที่ขาดหายไป
    console.log('\n⚠️  Missing Data Analysis:');
    console.log('='.repeat(50));
    
    const missingData = {
      description: allShops.filter(shop => !shop.description || shop.description.trim() === '').length,
      image: allShops.filter(shop => !shop.image || shop.image.trim() === '').length,
      evaluationDate: allShops.filter(shop => !shop.evaluationDate).length,
      contractStartDate: allShops.filter(shop => !shop.contractStartDate).length,
      contractEndDate: allShops.filter(shop => !shop.contractEndDate).length
    };
    
    Object.entries(missingData).forEach(([field, count]) => {
      const percentage = ((count / allShops.length) * 100).toFixed(1);
      console.log(`  ${field}: ${count}/${allShops.length} (${percentage}%)`);
    });
    
    // ตรวจสอบข้อมูลที่อาจมีปัญหา
    console.log('\n🔍 Data Quality Issues:');
    console.log('='.repeat(50));
    
    // ตรวจสอบ contract dates
    const invalidContracts = allShops.filter(shop => {
      if (!shop.contractStartDate || !shop.contractEndDate) return false;
      return shop.contractStartDate >= shop.contractEndDate;
    });
    console.log(`Invalid contract dates (start >= end): ${invalidContracts.length}`);
    
    // ตรวจสอบ expired contracts
    const now = new Date();
    const expiredContracts = allShops.filter(shop => {
      if (!shop.contractEndDate) return false;
      return shop.contractEndDate < now;
    });
    console.log(`Expired contracts: ${expiredContracts.length}`);
    
    // ตรวจสอบ scores
    const invalidScores = allShops.filter(shop => {
      return shop.score < 0 || shop.score > 100;
    });
    console.log(`Invalid scores (not 0-100): ${invalidScores.length}`);
    
    console.log('\n✅ Detailed analysis completed!');
    
  } catch (error) {
    console.error('❌ Error in detailed analysis:', error);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await detailedShopAnalysis();
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run script
main();


