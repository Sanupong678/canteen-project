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
    enum: ['food', 'beverage', 'other']
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
    type: String
  },
  canteenId: {
    type: Number,
    required: [true, 'กรุณาระบุรหัสโรงอาหาร']
  },
  credentials: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: Date,
    updatedAt: Date
  },
  // Evaluation fields
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
  timestamps: true
});

// Middleware to validate contract dates
shopSchema.pre('save', function(next) {
  if (this.contractStartDate >= this.contractEndDate) {
    next(new Error('วันที่สิ้นสุดสัญญาต้องมากกว่าวันที่เริ่มสัญญา'));
  }
  next();
});

// Hook เพื่อสร้าง Bill อัตโนมัติหลังจากสร้าง Shop
shopSchema.post('save', async function(doc) {
  try {
    // สร้าง Bill สำหรับค่าน้ำ
    const waterBill = new Bill({
      shopId: doc._id,
      shopName: doc.name,
      canteenId: doc.canteenId,
      contractEndDate: doc.contractEndDate,
      status: 'รอดำเนินการ',
      billType: 'water'
    });
    await waterBill.save();

    // สร้าง Bill สำหรับค่าไฟ
    const electricityBill = new Bill({
      shopId: doc._id,
      shopName: doc.name,
      canteenId: doc.canteenId,
      contractEndDate: doc.contractEndDate,
      status: 'รอดำเนินการ',
      billType: 'electricity'
    });
    await electricityBill.save();
  } catch (error) {
    console.error('Error creating bills:', error);
  }
});

const Shop = mongoose.model('Shop', shopSchema);

export default Shop; 