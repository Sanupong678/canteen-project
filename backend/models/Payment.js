import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  customId: {
    type: String,
    required: true,
    ref: 'Shop'
  },
  month: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
      },
      message: props => `${props.value} is not a valid month format (YYYY-MM)!`
    }
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  slip_image_url: {
    type: String,
    required: true
  },
  payment_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending'
  },
  admin_comment: {
    type: String,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at timestamp before saving
paymentSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Create compound index for customId and month
paymentSchema.index({ customId: 1, month: 1 }, { unique: true });

export default mongoose.model('Payment', paymentSchema); 