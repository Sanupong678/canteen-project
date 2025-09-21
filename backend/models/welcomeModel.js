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

// Use the same connection as the main app but with different database name
const getWelcomeModel = () => {
  const isTest = process.env.NODE_ENV === 'test';
  const dbName = isTest ? 'welcomepage_test' : 'welcomepage';
  
  // Use mongoose.connection if available, otherwise create new connection
  if (mongoose.connection.readyState === 1) {
    // Use existing connection with different database
    const welcomeConnection = mongoose.connection.useDb(dbName);
    return welcomeConnection.model('Welcome', welcomeSchema);
  } else {
    // Fallback: use default connection (will be created when mongoose.connect is called)
    return mongoose.model('Welcome', welcomeSchema);
  }
};

const Welcome = getWelcomeModel();

export default Welcome;
