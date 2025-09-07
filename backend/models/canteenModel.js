import mongoose from 'mongoose';

const canteenSchema = new mongoose.Schema({
  canteenId: {
    type: Number,
    required: false,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Canteen name is required'],
    trim: true
  },
  type: {
    type: String,
    default: 'canteen'
  },
  contractStartDate: String,
  contractEndDate: String,
  image: {
    type: String,
    default: '/images/default-canteen.png'
  },
  path: {
    type: String,
    required: [true, 'Canteen path is required']
  }
}, {
  timestamps: true
});

export default mongoose.model('Canteen', canteenSchema); 