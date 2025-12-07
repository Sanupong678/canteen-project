import mongoose from 'mongoose';
import Bill from './billModel.js';

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'กรุณาระบุชื่อร้านค้า'],
    trim: true
  },
  customId: {
    type: String,
    required: [true, 'กรุณาระบุรหัสร้านค้า'],
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: [true, 'กรุณาระบุประเภทร้านค้า'],
    enum: ['food', 'drink', 'dessert', 'other'] // รวมจาก Shop.js (ใช้งานจริง)
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: [true, 'กรุณาระบุที่ตั้งร้านค้า'],
    trim: true
  },
  contractStartDate: {
    type: Date,
    required: [true, 'กรุณาระบุวันที่เริ่มสัญญา']
  },
  contractEndDate: {
    type: Date,
    required: [true, 'กรุณาระบุวันที่สิ้นสุดสัญญา']
  },
  image: {
    type: String,
    default: '', // จาก Shop.js
    trim: true
  },
  canteenId: {
    type: Number,
    required: [true, 'กรุณาระบุรหัสโรงอาหาร']
  },
  // Credentials structure จาก Shop.js (ใช้งานจริง)
  credentials: {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    password_hash: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'expired'],
      default: 'active'
    },
    // เพิ่ม userId ใน credentials สำหรับ populate (จาก shopModel.js แต่ไม่ required)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: Date,
    updatedAt: Date
  },
  // userId เป็น field แยก (จาก Shop.js - ใช้งานจริง)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Evaluation fields จาก shopModel.js
  score: {
    type: Number,
    default: 100
  },
  evaluationStatus: {
    type: String,
    enum: ['ผ่าน', 'ไม่ผ่าน'],
    default: 'ผ่าน'
  },
  evaluationCompleted: {
    type: Boolean,
    default: false
  },
  evaluationDate: {
    type: Date
  }
}, {
  timestamps: true // สร้าง createdAt และ updatedAt อัตโนมัติ
});

// Add indexes for better query performance
shopSchema.index({ canteenId: 1 });
shopSchema.index({ customId: 1 }); // unique index already exists, but adding for reference
shopSchema.index({ userId: 1 }); // unique index already exists, but adding for reference
shopSchema.index({ 'credentials.username': 1 }); // unique index already exists, but adding for reference
shopSchema.index({ contractEndDate: 1 });
shopSchema.index({ type: 1 });
shopSchema.index({ createdAt: -1 });

// Pre-save middleware: Validate contract dates (จาก shopModel.js)
shopSchema.pre('save', function(next) {
  if (this.contractStartDate >= this.contractEndDate) {
    next(new Error('วันที่สิ้นสุดสัญญาต้องมากกว่าวันที่เริ่มสัญญา'));
    return;
  }
  
  // อัปเดต updatedAt ใน credentials และ root level (จาก Shop.js)
  if (this.isModified('credentials')) {
    this.credentials.updatedAt = new Date();
    if (!this.credentials.createdAt && this.isNew) {
      this.credentials.createdAt = new Date();
    }
  }
  
  // อัปเดต updatedAt field (จาก Shop.js)
  this.updatedAt = new Date();
  next();
});

// Note: Bill creation is handled in shopController.js (createShop function)
// This ensures bills are created explicitly when shops are created through the API

const Shop = mongoose.model('Shop', shopSchema);

export default Shop;
