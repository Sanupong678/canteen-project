import mongoose from 'mongoose';

const resetControlSchema = new mongoose.Schema({
  currentResetId: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  },
  resetBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resetReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Ensure only one reset control document exists
resetControlSchema.index({}, { unique: true });

const ResetControl = mongoose.model('ResetControl', resetControlSchema);

export default ResetControl;

