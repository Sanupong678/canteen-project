import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  revenue: {
    type: Number,
    default: 0
  },
  items: [{
    id: mongoose.Schema.Types.ObjectId,
    title: String,
    description: String,
    maxScore: Number,
    status: {
      type: String,
      enum: ['ผ่าน', 'ไม่ผ่าน', ''],
      default: ''
    },
    suggestion: {
      type: String,
      default: ''
    },
    driveLink: {
      type: String,
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
    enum: ['ผ่าน', 'ไม่ผ่าน', 'คัดออก'],
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
  evaluationRound: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  resetId: {
    type: Number,
    required: true,
    default: 1,
    min: 1
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
  },
  evaluationSent: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index เพื่อป้องกันการประเมินซ้ำในเดือนเดียวกันและรอบเดียวกัน
evaluationSchema.index({ shopId: 1, evaluationMonth: 1, evaluationYear: 1, evaluationRound: 1, resetId: 1 }, { unique: true });

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

export default Evaluation; 