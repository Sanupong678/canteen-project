import mongoose from 'mongoose';

const backgroundSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Banner'
  },
  description: {
    type: String,
    default: ''
  },
  imageFilename: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// สร้าง index เพื่อให้ค้นหาเร็วขึ้น
backgroundSchema.index({ createdAt: -1 });
backgroundSchema.index({ isActive: 1 });

export default mongoose.model('Background', backgroundSchema, 'backgrounds'); 