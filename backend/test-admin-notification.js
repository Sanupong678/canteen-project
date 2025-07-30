import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AdminNotification from './models/adminNotificationModel.js';
import Shop from './models/Shop.js';

dotenv.config();

const createTestAdminNotification = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a shop for testing
    const shop = await Shop.findOne();
    if (!shop) {
      console.log('❌ No shop found, creating test shop...');
      const testShop = new Shop({
        name: 'ร้านทดสอบ',
        canteenId: 1,
        description: 'ร้านทดสอบสำหรับ notification'
      });
      await testShop.save();
      console.log('✅ Test shop created');
    }

    // Create test admin notification
    const testNotification = new AdminNotification({
      userId: new mongoose.Types.ObjectId(),
      shopId: shop ? shop._id : new mongoose.Types.ObjectId(),
      type: 'bill',
      title: 'บิลค่าบริการใหม่ (ทดสอบ)',
      message: 'testuser จาก ร้านทดสอบ (โรงอาหารC5) อัปโหลดบิลค่าไฟ เดือน 12/2024',
      status: 'pending',
      details: {
        userName: 'testuser',
        userDisplayName: 'ผู้ใช้ทดสอบ',
        shopName: 'ร้านทดสอบ',
        canteenName: 'โรงอาหารC5',
        billType: 'electricity',
        amount: 1500,
        month: 12,
        year: 2024,
        dueDate: new Date('2024-12-31'),
        images: ['test-image.jpg'],
        imagePaths: ['/uploads/test-image.jpg']
      }
    });

    await testNotification.save();
    console.log('✅ Test admin notification created');
    console.log('📋 Notification ID:', testNotification._id);

    // Get all admin notifications
    const notifications = await AdminNotification.find().sort({ createdAt: -1 });
    console.log('📊 Total admin notifications:', notifications.length);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createTestAdminNotification(); 