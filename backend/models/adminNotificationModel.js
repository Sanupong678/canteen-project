import mongoose from 'mongoose';

// Schema สำหรับ admin ส่งการแจ้งเตือนไปยัง user
const adminToUserNotificationSchema = new mongoose.Schema({
  recipients: {
    type: String,
    enum: ['all', 'active', 'expired'],
    required: true
  },
  recipientShopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  sentBy: {
    type: String,
    required: false
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  // เก็บข้อมูลร้านค้าที่ได้รับ notification
  deliveredTo: [{
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  // เพิ่ม field สำหรับเก็บสถานะการอ่าน
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Schema สำหรับ user ส่งการแจ้งเตือนมาให้ admin
const userToAdminNotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  type: {
    type: String,
    enum: ['bill', 'leave', 'repair'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  }
}, {
  timestamps: true
});

// Indexes
adminToUserNotificationSchema.index({ recipients: 1, sentAt: -1 });
adminToUserNotificationSchema.index({ recipientShopId: 1, sentAt: -1 });

userToAdminNotificationSchema.index({ userId: 1, createdAt: -1 });
userToAdminNotificationSchema.index({ shopId: 1, createdAt: -1 });
userToAdminNotificationSchema.index({ isRead: 1, createdAt: -1 });

const AdminToUserNotification = mongoose.model('AdminToUserNotification', adminToUserNotificationSchema);
const UserToAdminNotification = mongoose.model('UserToAdminNotification', userToAdminNotificationSchema);

export { AdminToUserNotification, UserToAdminNotification };
export default UserToAdminNotification; // ใช้เป็น default สำหรับ user-to-admin 