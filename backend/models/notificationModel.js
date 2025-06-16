import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['contract', 'bill', 'system'],
    default: 'system'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedShop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  },
  relatedBill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill'
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 