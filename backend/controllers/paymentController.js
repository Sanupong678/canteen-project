import Payment from '../models/Payment.js';
import Shop from '../models/Shop.js';

// Upload payment slip
export const uploadPayment = async (req, res) => {
  try {
    const { customId, month, amount } = req.body;
    const slip_image_url = req.file.path; // Assuming you're using multer for file upload

    const payment = new Payment({
      customId,
      month,
      amount,
      slip_image_url,
      payment_date: new Date()
    });

    await payment.save();
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get payment status for a specific month
export const getPaymentStatus = async (req, res) => {
  try {
    const { customId, month } = req.query;
    const payment = await Payment.findOne({ customId, month });
    
    if (!payment) {
      return res.status(200).json({ 
        success: true, 
        data: { 
          status: 'unpaid',
          message: 'No payment record found for this month'
        }
      });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Admin verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_comment } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    payment.status = status;
    payment.admin_comment = admin_comment;
    await payment.save();

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all payments (admin)
export const getAllPayments = async (req, res) => {
  try {
    const { month, status } = req.query;
    const query = {};
    
    if (month) query.month = month;
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .sort({ created_at: -1 });
    
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}; 