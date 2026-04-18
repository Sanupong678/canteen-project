import mongoose from 'mongoose';

const paymentSettingsSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      default: '6720407581',
      trim: true
    },
    bankName: {
      type: String,
      default: 'ธนาคารกรุงเทพ',
      trim: true
    },
    qrTitle: {
      type: String,
      default: '',
      trim: true
    },
    qrImagePath: {
      type: String,
      default: ''
    },
    qrItems: [
      {
        title: {
          type: String,
          required: true,
          trim: true
        },
        imagePath: {
          type: String,
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

export default mongoose.model('PaymentSettings', paymentSettingsSchema);
