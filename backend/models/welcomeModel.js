import mongoose from 'mongoose';

const welcomeSchema = new mongoose.Schema({
  bannerImage: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'welcomepages'
});

// Ensure only one active banner at a time
welcomeSchema.pre('save', async function(next) {
  if (this.isActive && this.isNew) {
    // Deactivate all other banners
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { isActive: false }
    );
  }
  next();
});

const Welcome = mongoose.models.Welcome || mongoose.model('Welcome', welcomeSchema);

export default Welcome;
