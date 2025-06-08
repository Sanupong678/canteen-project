import mongoose from 'mongoose';

const canteenSchema = new mongoose.Schema({
  name: String,
  type: String,
  contractStartDate: String,
  contractEndDate: String,
  image: String
});

export default mongoose.model('Canteen', canteenSchema); 