import mongoose from 'mongoose';

const repairSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  category: {
    type: String,
    required: [true, 'กรุณาระบุหมวดหมู่']
  },
  issue: {
    type: String,
    required: [true, 'กรุณาระบุรายละเอียดปัญหา']
  },
  status: {
    type: String,
    required: true,
    default: 'pending',
    enum: ['pending', 'in_progress', 'completed', 'cancelled']
  },
  images: {
    type: [String],
    default: []
  },
  report_date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ก่อนบันทึก ให้ตรวจสอบว่ามีข้อมูลที่จำเป็นครบถ้วน
repairSchema.pre('save', function(next) {
  if (!this.userId) {
    next(new Error('กรุณาระบุ userId'));
  }
  if (!this.shopId) {
    next(new Error('กรุณาระบุ shopId'));
  }
  if (!this.category) {
    next(new Error('กรุณาระบุหมวดหมู่'));
  }
  if (!this.issue) {
    next(new Error('กรุณาระบุรายละเอียดปัญหา'));
  }
  next();
});

export default mongoose.model('Repair', repairSchema, 'repairs'); 