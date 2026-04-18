import mongoose from 'mongoose';
import Canteen from '../models/canteenModel.js';

// กำหนดการเชื่อมต่อ MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

async function checkCanteenImages() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is required');
    }
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    console.log('🔍 Checking canteen images in database...\n');

    const canteens = await Canteen.find().sort({ name: 1 });
    
    if (canteens.length === 0) {
      console.log('❌ No canteens found in database');
      return;
    }

    console.log(`📊 Found ${canteens.length} canteens:\n`);
    
    canteens.forEach((canteen, index) => {
      console.log(`${index + 1}. ${canteen.name}`);
      console.log(`   📍 Path: ${canteen.path}`);
      console.log(`   🖼️ Image: ${canteen.image}`);
      
      // ตรวจสอบว่า path มาจากโฟลเดอร์ไหน
      if (canteen.image.startsWith('/uploads/canteen/')) {
        console.log(`   📁 Source: uploads/canteen folder`);
      } else if (canteen.image.startsWith('/images/')) {
        console.log(`   📁 Source: images folder`);
      } else {
        console.log(`   📁 Source: unknown`);
      }
      console.log('');
    });

    // สรุปสถิติ
    const uploadsCount = canteens.filter(c => c.image.startsWith('/uploads/canteen/')).length;
    const imagesCount = canteens.filter(c => c.image.startsWith('/images/')).length;
    const otherCount = canteens.length - uploadsCount - imagesCount;

    console.log('📈 Summary:');
    console.log(`   - uploads/canteen: ${uploadsCount} canteens`);
    console.log(`   - images: ${imagesCount} canteens`);
    console.log(`   - other: ${otherCount} canteens`);

  } catch (error) {
    console.error('❌ Error checking canteen images:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// รัน script
checkCanteenImages(); 