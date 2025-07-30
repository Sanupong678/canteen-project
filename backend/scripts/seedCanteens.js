import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Canteen from '../models/canteenModel.js';

dotenv.config();

const canteensData = [
  {
    name: 'โรงอาหาร C5',
    image: '/images/c5.png',
    path: '/admin/canteen/c5',
    type: 'canteen'
  },
  {
    name: 'โรงอาหาร D1',
    image: '/images/d1.png',
    path: '/admin/canteen/d1',
    type: 'canteen'
  },
  {
    name: 'โรงอาหาร Dormity',
    image: '/images/dorm.png',
    path: '/admin/canteen/dormity',
    type: 'canteen'
  },
  {
    name: 'โรงอาหาร Epark',
    image: '/images/epark.png',
    path: '/admin/canteen/epark',
    type: 'canteen'
  },
  {
    name: 'โรงอาหาร E1',
    image: '/images/e1.png',
    path: '/admin/canteen/e1',
    type: 'canteen'
  },
  {
    name: 'โรงอาหาร E2',
    image: '/images/e2.png',
    path: '/admin/canteen/e2',
    type: 'canteen'
  },
  {
    name: 'โรงอาหาร Msquare',
    image: '/images/msquare.png',
    path: '/admin/canteen/msquare',
    type: 'canteen'
  },
  {
    name: 'โรงอาหาร RuemRim',
    image: '/images/ruem.png',
    path: '/admin/canteen/ruemrim',
    type: 'canteen'
  },
  {
    name: 'โรงอาหาร S2',
    image: '/images/s2.png',
    path: '/admin/canteen/s2',
    type: 'canteen'
  }
];

const seedCanteens = async () => {
  try {
    // เชื่อมต่อฐานข้อมูล
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // ลบข้อมูลโรงอาหารเดิมทั้งหมด
    await Canteen.deleteMany({});
    console.log('🗑️  Deleted existing canteens');

    // เพิ่มข้อมูลโรงอาหารใหม่
    const canteens = await Canteen.insertMany(canteensData);
    console.log(`✅ Added ${canteens.length} canteens to database`);

    // แสดงข้อมูลที่เพิ่ม
    canteens.forEach(canteen => {
      console.log(`- ${canteen.name} (${canteen._id})`);
    });

    console.log('🎉 Canteen seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding canteens:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// รัน script
seedCanteens(); 