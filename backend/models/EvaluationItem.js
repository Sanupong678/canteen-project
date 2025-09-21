import mongoose from 'mongoose';

const evaluationItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true,
    maxlength: [1000, 'คำอธิบายต้องไม่เกิน 1000 ตัวอักษร'],
    default: ''
  },
  maxScore: {
    type: Number,
    required: true,
    min: [1, 'คะแนนเต็มต้องมากกว่า 0'],
    max: [100, 'คะแนนเต็มต้องไม่เกิน 100']
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const EvaluationItem = mongoose.model('EvaluationItem', evaluationItemSchema);

export default EvaluationItem; 