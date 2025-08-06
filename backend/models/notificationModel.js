import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
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
    enum: ['bill', 'leave', 'repair', 'ranking_evaluation'],
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
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
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
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 