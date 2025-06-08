import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const sendNotificationEmail = async (shop, notification) => {
  const subject = `การแจ้งเตือน: ${notification.title}`;
  const html = `
    <h2>${notification.title}</h2>
    <p>${notification.message}</p>
    <p>ความสำคัญ: ${notification.priority}</p>
    <p>จาก: ระบบจัดการร้านค้า</p>
  `;

  return sendEmail({
    to: shop.email,
    subject,
    text: notification.message,
    html
  });
};

export const sendPaymentReminderEmail = async (shop, month) => {
  const subject = 'แจ้งเตือนการชำระเงินค่าเช่า';
  const html = `
    <h2>แจ้งเตือนการชำระเงินค่าเช่า</h2>
    <p>เรียน ${shop.name}</p>
    <p>กรุณาชำระเงินค่าเช่าสำหรับเดือน ${month} ภายในวันที่ 5 ของเดือน</p>
    <p>หากมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบ</p>
  `;

  return sendEmail({
    to: shop.email,
    subject,
    text: `กรุณาชำระเงินค่าเช่าสำหรับเดือน ${month} ภายในวันที่ 5 ของเดือน`,
    html
  });
}; 