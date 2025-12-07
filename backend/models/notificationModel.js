import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // เปลี่ยนเป็น false เพื่อรองรับ admin notifications
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false // เปลี่ยนเป็น false เพื่อรองรับ admin notifications
  },
  type: {
    type: String,
    enum: ['bill', 'leave', 'repair', 'ranking_evaluation', 'admin_notification', 'monthly_ranking'],
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
    required: false // เปลี่ยนเป็น false เพื่อรองรับ admin notifications
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // เปลี่ยนเป็น false เพื่อรองรับ admin notifications
  },
  billType: {
    type: String,
    required: false
  },
  // เพิ่มฟิลด์สำหรับ ranking evaluation notifications
  rankingEvaluationData: {
    revenue: Number,
    score: Number,
    rank: Number,
    canteenName: String,
    evaluationMonth: Number,
    evaluationYear: Number,
    evaluatedBy: String,
    evaluatedAt: Date
  },
  // เพิ่มฟิลด์สำหรับ admin notifications
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: false
  },
  recipients: {
    type: String,
    required: false
  },
  recipientShopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  recipientCanteenId: {
    type: Number,
    required: false
  },
  sentBy: {
    type: String,
    required: false
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
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
  // เพิ่มฟิลด์สำหรับ user-to-admin notifications
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  // เพิ่มฟิลด์สำหรับ monthly ranking notifications
  monthlyRankingData: {
    month: Number,
    year: Number,
    monthName: String,
    revenue: Number,
    score: Number,
    rank: Number,
    finalStatus: String,
    totalShopsInCanteen: Number,
    revenueUpdatedAt: Date,
    evaluatedAt: Date
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
notificationSchema.index({ userId: 1 });
notificationSchema.index({ shopId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ shopId: 1, isRead: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 