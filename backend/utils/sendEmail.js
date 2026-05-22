const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587, // Changed from 465
      secure: false, // Must be false for 587
      requireTLS: true, // Forces secure upgrade
      family: 4, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"BambaPay" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[Email] Failed to send email:', error.message);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

module.exports = sendEmail;