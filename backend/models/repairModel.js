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
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'รอดำเนินการ', 'กำลังดำเนินการ', 'ซ่อมแล้ว']
  },
  // เก็บ Base64 (สำหรับ backward compatibility)
  images: {
    type: [String],
    default: []
  },
  // เก็บ path ของรูปภาพ (ใหม่)
  imagePaths: {
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
}, {
  timestamps: true
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