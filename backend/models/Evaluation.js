import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  shopName: {
    type: String,
    required: true
  },
  canteenName: {
    type: String,
    required: true
  },
  revenue: {
    type: Number,
    default: 0
  },
  items: [{
    id: mongoose.Schema.Types.ObjectId,
    title: String,
    status: {
      type: String,
      enum: ['ผ่าน', 'ไม่ผ่าน', ''],
      default: ''
    }
  }],
  totalScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  finalStatus: {
    type: String,
    enum: ['ผ่าน', 'ไม่ผ่าน'],
    required: true
  },
  evaluationMonth: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  evaluationYear: {
    type: Number,
    required: true
  },
  evaluatedAt: {
    type: Date,
    default: Date.now
  },
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index เพื่อป้องกันการประเมินซ้ำในเดือนเดียวกัน
evaluationSchema.index({ shopId: 1, evaluationMonth: 1, evaluationYear: 1 }, { unique: true });

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

export default Evaluation; 