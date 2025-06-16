import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  shopName: {
    type: String,
    required: true
  },
  canteenId: {
    type: Number,
    required: true
  },
  billType: {
    type: String,
    enum: ['water', 'electricity'],
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  payment_date: {
    type: Date,
    default: null
  },
  image: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['รอดำเนินการ', 'สมบูรณ์', 'ไม่สมบูรณ์', null],
    default: 'รอดำเนินการ'
  },
  notificationDates: [{
    date: Date,
    notified: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: ['ก่อนหมดสัญญา 1 เดือน', 'ก่อนหมดสัญญา 1 สัปดาห์', 'วันหมดสัญญา']
    }
  }],
  contractEndDate: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    default: null
  },
}, {
  timestamps: true
});

// Function to calculate notification dates
billSchema.methods.calculateNotificationDates = function(contractEndDate) {
  const oneMonth = new Date(contractEndDate);
  oneMonth.setMonth(oneMonth.getMonth() - 1);

  const oneWeek = new Date(contractEndDate);
  oneWeek.setDate(oneWeek.getDate() - 7);

  this.notificationDates = [
    {
      date: oneMonth,
      type: 'ก่อนหมดสัญญา 1 เดือน'
    },
    {
      date: oneWeek,
      type: 'ก่อนหมดสัญญา 1 สัปดาห์'
    },
    {
      date: contractEndDate,
      type: 'วันหมดสัญญา'
    }
  ];
};

const Bill = mongoose.model('Bill', billSchema);

export default Bill; 