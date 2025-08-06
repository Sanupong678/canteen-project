import mongoose from 'mongoose';

const moneyHistorySchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  shopName: {
    type: String,
    required: true,
    trim: true
  },
  canteenId: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  totals: {
    type: Number,
    required: true,
    default: 0
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index เพื่อป้องกันข้อมูลซ้ำในเดือนเดียวกัน
moneyHistorySchema.index({ shopId: 1, month: 1, year: 1 }, { unique: true });

// Index สำหรับการค้นหา
moneyHistorySchema.index({ shopId: 1 });
moneyHistorySchema.index({ canteenId: 1 });
moneyHistorySchema.index({ month: 1, year: 1 });

const MoneyHistory = mongoose.model('MoneyHistory', moneyHistorySchema);

export default MoneyHistory; 