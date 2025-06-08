import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  employeeName: String,
  date: String,
  reason: String,
  status: String
});

export default mongoose.model('Leave', leaveSchema); 