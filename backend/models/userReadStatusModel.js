import mongoose from 'mongoose';

const userReadStatusSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  shopId: {
    type: String,
    required: true
  },
  // เก็บ ID ของบิลที่อ่านแล้ว
  readBills: [{
    type: String,
    default: []
  }],
  // เก็บ ID ของการลาที่อ่านแล้ว
  readLeaves: [{
    type: String,
    default: []
  }],
  // เก็บ ID ของการแจ้งซ่อมที่อ่านแล้ว
  readRepairs: [{
    type: String,
    default: []
  }],
  // เก็บเวลาที่อ่านล่าสุด
  lastReadAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// สร้าง index เพื่อให้ค้นหาเร็วขึ้น
userReadStatusSchema.index({ userId: 1 });
userReadStatusSchema.index({ shopId: 1 });

export default mongoose.model('UserReadStatus', userReadStatusSchema, 'user_read_status'); 