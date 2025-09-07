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
  dueDate: {
    type: Date,
    required: false,
    default: function() {
      // ใช้ contractEndDate เป็น default หรือสร้างวันที่ในอนาคต
      return this.contractEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 วันจากวันนี้
    }
  },
  payment_date: {
    type: Date,
    default: null
  },
  image: {
    type: String,
    default: null
  },
  imagePath: {
    type: String,
    default: null
  },

  imageUploadDate: {
    type: Date,
    default: null
  },
  imageExpiryDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['รอดำเนินการ', 'รอตรวจสอบ', 'เสร็จสิ้น', 'เลยกำหนด'],
    default: 'รอดำเนินการ'
  },
  admin_comment: {
    type: String,
    default: null
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