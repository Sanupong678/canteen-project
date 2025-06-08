import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  customId: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['food', 'drink', 'dessert', 'other']
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  contractStartDate: {
    type: Date,
    required: true
  },
  contractEndDate: {
    type: Date,
    required: true
  },
  image: {
    type: String,
    default: '',
    trim: true
  },
  canteenId: {
    type: Number,
    required: true
  },
  credentials: {
    username: {
      type: String,
      required: true,
      unique: true
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
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updatedAt timestamp before saving
shopSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Shop = mongoose.model('Shop', shopSchema);

export default Shop; 