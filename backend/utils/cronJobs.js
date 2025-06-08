import cron from 'node-cron';
import Payment from '../models/Payment.js';
import Shop from '../models/Shop.js';
import { sendPaymentReminderEmail } from '../config/emailConfig.js';

// Run at 9:00 AM on the 1st day of every month
export const setupPaymentReminders = () => {
  cron.schedule('0 9 1 * *', async () => {
    try {
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Get all shops
      const shops = await Shop.find({});
      
      for (const shop of shops) {
        // Check if payment exists for current month
        const payment = await Payment.findOne({
          customId: shop.customId,
          month: currentMonth
        });

        if (!payment) {
          console.log(`Sending payment reminder for shop ${shop.name} - ${currentMonth}`);
          try {
            await sendPaymentReminderEmail(shop, currentMonth);
            console.log(`Payment reminder email sent to ${shop.name}`);
          } catch (emailError) {
            console.error(`Error sending email to ${shop.name}:`, emailError);
          }
        }
      }
    } catch (error) {
      console.error('Error in payment reminder cron job:', error);
    }
  });
}; 