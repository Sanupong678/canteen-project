import mongoose from 'mongoose';

const evaluationItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
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