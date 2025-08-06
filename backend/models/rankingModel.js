import mongoose from 'mongoose';

const rankingSchema = new mongoose.Schema({
  shopName: {
    type: String,
    required: true,
    trim: true
  },
  canteenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canteen',
    required: true
  },
  canteenName: {
    type: String,
    required: true,
    trim: true
  },
  revenue: {
    type: Number,
    required: true,
    default: 0
  },
  evaluationStatus: {
    type: String,
    enum: ['ผ่าน', 'ไม่ผ่าน'],
    default: 'ไม่ผ่าน'
  },
  overallStatus: {
    type: String,
    enum: ['เสร็จสิ้น', 'รอดำเนินการ'],
    default: 'รอดำเนินการ'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  evaluationDate: {
    type: Date,
    default: null
  },
  evaluatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  evaluatorName: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Index for better query performance
rankingSchema.index({ canteenId: 1, shopName: 1 });
rankingSchema.index({ evaluationStatus: 1 });
rankingSchema.index({ overallStatus: 1 });
rankingSchema.index({ revenue: -1 });

export default mongoose.model('Ranking', rankingSchema); 