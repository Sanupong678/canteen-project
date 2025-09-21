import mongoose from 'mongoose'

const evaluationTopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'กรุณากรอกชื่อหัวข้อ'],
    trim: true,
    maxlength: [200, 'ชื่อหัวข้อต้องไม่เกิน 200 ตัวอักษร']
  },
  description: {
    type: String,
    required: [true, 'กรุณากรอกคำอธิบาย'],
    trim: true,
    maxlength: [1000, 'คำอธิบายต้องไม่เกิน 1000 ตัวอักษร']
  },
  maxScore: {
    type: Number,
    required: [true, 'กรุณากรอกคะแนนเต็ม'],
    min: [1, 'คะแนนเต็มต้องมากกว่า 0'],
    max: [100, 'คะแนนเต็มต้องไม่เกิน 100']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
})

// Index for better performance
evaluationTopicSchema.index({ title: 1 })
evaluationTopicSchema.index({ isActive: 1 })
evaluationTopicSchema.index({ createdAt: -1 })

export default mongoose.model('EvaluationTopic', evaluationTopicSchema)
