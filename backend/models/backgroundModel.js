import mongoose from 'mongoose';

const backgroundSchema = new mongoose.Schema({
  url: String
});

export default mongoose.model('Background', backgroundSchema); 