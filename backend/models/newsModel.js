import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  imageFilename: {
    type: String,
    required: true
  },
  author: {
    type: String,
    default: 'Admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// สร้าง index เพื่อให้ค้นหาเร็วขึ้น
newsSchema.index({ createdAt: -1 });
newsSchema.index({ isActive: 1 });

export default mongoose.model('News', newsSchema, 'news');
