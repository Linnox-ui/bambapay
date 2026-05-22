const axios = require('axios');

const sendEmail = async (to, subject, text) => {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { email: process.env.EMAIL_USER, name: 'BambaPay' },
        to: [{ email: to }],
        subject: subject,
        textContent: text
      },
      {
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        }
      }
    );

    console.log(`[Email] OTP successfully sent to ${to} via HTTP API`);
    return response.data;
  } catch (error) {
    console.error('[Email Error]:', error.response ? error.response.data : error.message);
    throw new Error('Email delivery failed');
  }
};

module.exports = sendEmail;