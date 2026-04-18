import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { AdminToUserNotification, UserToAdminNotification } from '../models/adminNotificationModel.js';
import Notification from '../models/notificationModel.js';

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
    console.log('💡 Please make sure MongoDB is running and connection string is correct');
    process.exit(1);
  }
};

// Migrate AdminToUserNotification to Notification
const migrateAdminToUserNotifications = async () => {
  try {
    console.log('🔄 Migrating AdminToUserNotification to Notification...');
    
    const adminNotifications = await AdminToUserNotification.find();
    console.log(`📊 Found ${adminNotifications.length} AdminToUserNotification records`);
    
    for (const adminNotification of adminNotifications) {
      const notificationData = {
        type: 'admin_notification',
        title: adminNotification.title,
        message: adminNotification.message,
        priority: adminNotification.priority,
        recipients: adminNotification.recipients,
        recipientShopId: adminNotification.recipientShopId,
        sentBy: adminNotification.sentBy,
        sentAt: adminNotification.sentAt,
        deliveredTo: adminNotification.deliveredTo,
        isRead: adminNotification.isRead,
        createdAt: adminNotification.createdAt,
        updatedAt: adminNotification.updatedAt
      };
      
      const notification = new Notification(notificationData);
      await notification.save();
      console.log(`✅ Migrated AdminToUserNotification: ${adminNotification._id}`);
    }
    
    console.log('✅ AdminToUserNotification migration completed');
  } catch (error) {
    console.error('❌ Error migrating AdminToUserNotification:', error);
  }
};

// Migrate UserToAdminNotification to Notification
const migrateUserToAdminNotifications = async () => {
  try {
    console.log('🔄 Migrating UserToAdminNotification to Notification...');
    
    const userNotifications = await UserToAdminNotification.find();
    console.log(`📊 Found ${userNotifications.length} UserToAdminNotification records`);
    
    for (const userNotification of userNotifications) {
      const notificationData = {
        userId: userNotification.userId,
        shopId: userNotification.shopId,
        type: userNotification.type,
        title: userNotification.title,
        message: userNotification.message,
        status: userNotification.status,
        isRead: userNotification.isRead,
        details: userNotification.details,
        createdAt: userNotification.createdAt,
        updatedAt: userNotification.updatedAt
      };
      
      const notification = new Notification(notificationData);
      await notification.save();
      console.log(`✅ Migrated UserToAdminNotification: ${userNotification._id}`);
    }
    
    console.log('✅ UserToAdminNotification migration completed');
  } catch (error) {
    console.error('❌ Error migrating UserToAdminNotification:', error);
  }
};

// Main migration function
const migrateNotifications = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting notification migration...');
    
    // Migrate AdminToUserNotification
    await migrateAdminToUserNotifications();
    
    // Migrate UserToAdminNotification
    await migrateUserToAdminNotifications();
    
    console.log('🎉 Migration completed successfully!');
    
    // ตรวจสอบผลลัพธ์
    const totalNotifications = await Notification.countDocuments();
    console.log(`📊 Total notifications in database: ${totalNotifications}`);
    
    const adminNotifications = await Notification.countDocuments({ type: 'admin_notification' });
    console.log(`📊 Admin notifications: ${adminNotifications}`);
    
    const userNotifications = await Notification.countDocuments({ 
      type: { $in: ['bill', 'leave', 'repair'] } 
    });
    console.log(`📊 User notifications: ${userNotifications}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run migration
migrateNotifications();
