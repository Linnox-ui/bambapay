const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class MpesaService {
  constructor() {
    this.baseUrl = process.env.MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
    
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.passkey = process.env.MPESA_PASSKEY;
    this.shortcode = process.env.MPESA_SHORTCODE;
    this.callbackUrl = process.env.MPESA_CALLBACK_URL;
    
    this.tokenCache = {
      accessToken: null,
      expiresAt: null
    };
  }

  _getBasicAuthCredentials() {
    return Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
  }

  _isTokenValid() {
    if (!this.tokenCache.accessToken || !this.tokenCache.expiresAt) return false;
    return Date.now() < (this.tokenCache.expiresAt - 5 * 60 * 1000);
  }

  async getOAuthToken() {
    if (this._isTokenValid()) return this.tokenCache.accessToken;

    try {
      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: { Authorization: `Basic ${this._getBasicAuthCredentials()}` },
          timeout: 10000
        }
      );
      this.tokenCache = {
        accessToken: response.data.access_token,
        expiresAt: Date.now() + (response.data.expires_in * 1000)
      };
      return response.data.access_token;
    } catch (error) {
      throw new Error(`OAuth failed: ${error.response?.data?.errorMessage || error.message}`);
    }
  }

  _generateTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  }

  _generatePassword(timestamp) {
    return Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
  }

  _formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '254' + cleaned.substring(1);
    else if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
    else if (!cleaned.startsWith('254')) cleaned = '254' + cleaned;
    
    if (cleaned.length !== 12) throw new Error(`Invalid phone format: ${phoneNumber}`);
    return cleaned;
  }

  async initiateSTKPush(phoneNumber, amount, accountReference) {
    const formattedPhone = this._formatPhoneNumber(phoneNumber);
    const timestamp = this._generateTimestamp();
    const accessToken = await this.getOAuthToken();

    const payload = {
      BusinessShortCode: this.shortcode,
      Password: this._generatePassword(timestamp),
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: this.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: this.callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: 'BambaPay Deposit'
    };

    try {
      const response = await axios.post(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, payload, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
      });
      if (response.data.ResponseCode !== '0') throw new Error(response.data.ResponseDescription);
      return { success: true, ...response.data, rawResponse: response.data };
    } catch (error) {
      throw new Error(`STK Push failed: ${error.message}`);
    }
  }

  // --- NEW B2C LOGIC INTEGRATED HERE ---

  getSecurityCredential() {
    const certPath = path.resolve(__dirname, '../certs/sandbox.cer');
    
    // Fail-safe check to prevent fatal filesystem crashes
    if (!fs.existsSync(certPath)) {
      throw new Error(`CRITICAL MISSING ASSET: Safaricom certificate not found at ${certPath}`);
    }

    const cert = fs.readFileSync(certPath, 'utf8');
    const password = process.env.MPESA_INITIATOR_PASSWORD || 'Safaricom999!';

    const encrypted = crypto.publicEncrypt(
      { key: cert, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(password)
    );
    return encrypted.toString('base64');
  }

  async initiateB2C(phoneNumber, amount, transactionId) {
    const token = await this.getOAuthToken();
    const securityCredential = this.getSecurityCredential();
    const formattedPhone = this._formatPhoneNumber(phoneNumber);

    const payload = {
      InitiatorName: process.env.MPESA_INITIATOR_NAME || 'testapi',
      SecurityCredential: securityCredential,
      CommandID: 'BusinessPayment',
      Amount: Math.ceil(amount),
      PartyA: process.env.MPESA_B2C_SHORTCODE || '600497',
      PartyB: formattedPhone,
      Remarks: 'BambaPay Withdrawal',
      QueueTimeOutURL: `${process.env.BACKEND_URL}/api/webhooks/b2c/timeout`,
      ResultURL: `${process.env.BACKEND_URL}/api/webhooks/b2c/result`,
      Occasion: transactionId
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`B2C request failed: ${error.response?.data?.errorMessage || error.message}`);
    }
  }
}

module.exports = new MpesaService();