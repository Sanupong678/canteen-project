import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: 'pending',
    enum: ['pending', 'approved', 'rejected']
  },
  startDate: {
    type: Date,
    required: [true, 'กรุณาระบุวันที่เริ่มลา']
  },
  endDate: {
    type: Date,
    required: [true, 'กรุณาระบุวันที่สิ้นสุดการลา']
  },
  issue: {
    type: String,
    required: [true, 'กรุณาระบุเหตุผลการลา']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ก่อนบันทึก ให้ตรวจสอบว่ามีข้อมูลที่จำเป็นครบถ้วน
leaveSchema.pre('save', function(next) {
  if (!this.userId) {
    next(new Error('กรุณาระบุ userId'));
  }
  if (!this.shopId) {
    next(new Error('กรุณาระบุ shopId'));
  }
  if (!this.startDate) {
    next(new Error('กรุณาระบุวันที่เริ่มลา'));
  }
  if (!this.endDate) {
    next(new Error('กรุณาระบุวันที่สิ้นสุดการลา'));
  }
  if (!this.issue) {
    next(new Error('กรุณาระบุเหตุผลการลา'));
  }
  if (this.endDate < this.startDate) {
    next(new Error('วันที่สิ้นสุดการลาต้องไม่น้อยกว่าวันที่เริ่มลา'));
  }
  next();
});

export default mongoose.model('Leave', leaveSchema, 'leaves'); 