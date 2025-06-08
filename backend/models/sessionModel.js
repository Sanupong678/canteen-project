import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  token: String,
  deviceInfo: {
    userAgent: String,
    ipAddress: String
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'logged_out'],
    default: 'active'
  },
  logoutTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
sessionSchema.index({ token: 1 });
sessionSchema.index({ userId: 1 });
sessionSchema.index({ expiresAt: 1 });

const Session = mongoose.model('Session', sessionSchema);

export default Session; 