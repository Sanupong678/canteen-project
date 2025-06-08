import mongoose from 'mongoose';

const repairSchema = new mongoose.Schema({
  customId: {
    type: String,
    required: true
  },
  canteen: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  issue: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: 'รอดำเนินการ'
  },
  images: [String],
  report_date: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Repair', repairSchema); 