import mongoose from 'mongoose';
import Canteen from '../models/canteenModel.js';

// กำหนดการเชื่อมต่อ MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canteen-project';

// ข้อมูล canteen และรูปภาพที่ตรงกัน
const canteenImageMapping = [
  {
    name: 'โรงอาหาร C5',
    path: '/admin/canteen/c5',
    oldImage: '/images/c5.png',
    newImage: '/uploads/canteen/canteen-c5.png'
  },
  {
    name: 'โรงอาหาร D1',
    path: '/admin/canteen/d1',
    oldImage: '/images/d1.png',
    newImage: '/uploads/canteen/canteen-d1.png'
  },
  {
    name: 'โรงอาหาร Dormity',
    path: '/admin/canteen/dormity',
    oldImage: '/images/dorm.png',
    newImage: '/uploads/canteen/canteen-dorm.png'
  },
  {
    name: 'โรงอาหาร Epark',
    path: '/admin/canteen/epark',
    oldImage: '/images/epark.png',
    newImage: '/uploads/canteen/canteen-epark.png'
  },
  {
    name: 'โรงอาหาร E1',
    path: '/admin/canteen/e1',
    oldImage: '/images/e1.png',
    newImage: '/uploads/canteen/canteen-e1.png'
  },
  {
    name: 'โรงอาหาร E2',
    path: '/admin/canteen/e2',
    oldImage: '/images/e2.png',
    newImage: '/uploads/canteen/canteen-e2.png'
  },
  {
    name: 'โรงอาหาร Msquare',
    path: '/admin/canteen/msquare',
    oldImage: '/images/msquare.png',
    newImage: '/uploads/canteen/canteen-msquare.png'
  },
  {
    name: 'โรงอาหาร RuemRim',
    path: '/admin/canteen/ruemrim',
    oldImage: '/images/ruem.png',
    newImage: '/uploads/canteen/canteen-ruem.png'
  },
  {
    name: 'โรงอาหาร S2',
    path: '/admin/canteen/s2',
    oldImage: '/images/s2.png',
    newImage: '/uploads/canteen/canteen-s2.png'
  }
];

async function updateCanteenImages() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    console.log('🔄 Starting canteen image updates...');

    for (const mapping of canteenImageMapping) {
      console.log(`\n🏢 Processing: ${mapping.name}`);
      
      // ค้นหา canteen ที่มีชื่อและ path ตรงกัน
      const canteen = await Canteen.findOne({
        name: mapping.name,
        path: mapping.path
      });

      if (canteen) {
        console.log(`  📍 Found canteen with ID: ${canteen._id}`);
        console.log(`  🖼️ Old image: ${canteen.image}`);
        
        // อัปเดตรูปภาพ
        canteen.image = mapping.newImage;
        await canteen.save();
        
        console.log(`  ✅ Updated to: ${mapping.newImage}`);
      } else {
        console.log(`  ⚠️ Canteen not found: ${mapping.name}`);
        
        // สร้าง canteen ใหม่ถ้าไม่มี
        const newCanteen = new Canteen({
          name: mapping.name,
          path: mapping.path,
          image: mapping.newImage,
          type: 'canteen'
        });
        
        await newCanteen.save();
        console.log(`  ✅ Created new canteen: ${mapping.name}`);
      }
    }

    console.log('\n🎉 All canteen images updated successfully!');
    
    // แสดงผลลัพธ์
    const allCanteens = await Canteen.find();
    console.log('\n📊 Current canteens in database:');
    allCanteens.forEach(canteen => {
      console.log(`  - ${canteen.name}: ${canteen.image}`);
    });

  } catch (error) {
    console.error('❌ Error updating canteen images:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// รัน script
updateCanteenImages(); 