import mongoose from 'mongoose';
import Notification from './models/notificationModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function testUserShopId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // ตรวจสอบ notification ทั้งหมด
    console.log('\n=== 1. ตรวจสอบ Notifications ทั้งหมด ===');
    const notifications = await Notification.find({ type: 'ranking_evaluation' });
    console.log('Ranking evaluation notifications:', notifications.length);
    
    notifications.forEach((notification, index) => {
      console.log(`\nNotification ${index + 1}:`);
      console.log('  - ShopId:', notification.shopId);
      console.log('  - Title:', notification.title);
      console.log('  - Message:', notification.message);
      console.log('  - CreatedAt:', notification.createdAt);
    });

    console.log('\n=== 2. ShopId ที่มี Notification ===');
    const shopIds = notifications.map(n => n.shopId.toString());
    console.log('ShopIds with notifications:', shopIds);

    console.log('\n=== 3. วิธีทดสอบ ===');
    console.log('1. Login ด้วย user ที่มี shopId ตรงกับ:', shopIds);
    console.log('2. เปิดหน้า dashboard');
    console.log('3. ดู notification bell');
    console.log('4. ตรวจสอบ console logs');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testUserShopId(); 