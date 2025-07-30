import mongoose from 'mongoose';

const adminNotificationSchema = new mongoose.Schema({
  // ข้อมูลผู้ส่ง
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Shop'
  },
  
  // ข้อมูลการแจ้งเตือน
  type: {
    type: String,
    required: true,
    enum: ['bill', 'leave', 'repair']
  },
  
  // ข้อมูลรายละเอียด
  title: {
    type: String,
    required: true
  },
  
  message: {
    type: String,
    required: true
  },
  
  // ข้อมูลเพิ่มเติม
  details: {
    // ข้อมูล user
    userName: String,
    userDisplayName: String,
    shopName: String,
    canteenName: String,
    
    // ข้อมูลเฉพาะประเภท
    billType: String,
    amount: Number,
    month: Number,
    year: Number,
    dueDate: Date,
    
    // ข้อมูลการลา
    startDate: Date,
    endDate: Date,
    issue: String,
    
    // ข้อมูลการแจ้งซ่อม
    category: String,
    repairIssue: String,
    reportDate: Date,
    
    // ข้อมูลรูปภาพ
    images: [String],
    imagePaths: [String]
  },
  
  // สถานะ
  status: {
    type: String,
    required: true,
    default: 'pending'
  },
  
  // สถานะการอ่าน
  isRead: {
    type: Boolean,
    default: false
  },
  
  // เวลาที่สร้าง
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // เวลาที่อัปเดต
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// สร้าง index เพื่อให้ค้นหาเร็วขึ้น
adminNotificationSchema.index({ type: 1, createdAt: -1 });
adminNotificationSchema.index({ isRead: 1 });
adminNotificationSchema.index({ shopId: 1 });

export default mongoose.model('AdminNotification', adminNotificationSchema, 'admin_notifications'); 