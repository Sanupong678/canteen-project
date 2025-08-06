import mongoose from 'mongoose';

const evaluationControlSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  isEvaluationEnabled: {
    type: Boolean,
    default: true
  },
  reason: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index เพื่อป้องกันการสร้างซ้ำ
evaluationControlSchema.index({ month: 1, year: 1 }, { unique: true });

const EvaluationControl = mongoose.model('EvaluationControl', evaluationControlSchema);

export default EvaluationControl; 