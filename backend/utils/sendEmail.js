const { Resend } = require('resend');

// Initialize with the API key from Render
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, text) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Resend's default testing address
      to: to, // Must be the email you used to sign up for Resend
      subject: subject,
      text: text
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`[Email] OTP successfully sent to ${to} via HTTP API`);
    return data;
  } catch (error) {
    console.error('[Email Error]:', error.message);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

module.exports = sendEmail;