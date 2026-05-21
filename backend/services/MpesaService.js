const axios = require('axios');

class MpesaService {
  constructor() {
    this.baseUrl = process.env.MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
    
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.passkey = process.env.MPESA_PASSKEY;
    this.shortcode = process.env.MPESA_SHORTCODE;
    this.initiatorPassword = process.env.MPESA_INITIATOR_PASSWORD;
    this.callbackUrl = process.env.MPESA_CALLBACK_URL;
    
    // Token cache
    this.tokenCache = {
      accessToken: null,
      expiresAt: null
    };
  }

  /**
   * Generate Base64 encoded credentials for OAuth
   */
  _getBasicAuthCredentials() {
    const credentials = `${this.consumerKey}:${this.consumerSecret}`;
    return Buffer.from(credentials).toString('base64');
  }

  /**
   * Check if cached token is still valid (with 5-minute buffer)
   */
  _isTokenValid() {
    if (!this.tokenCache.accessToken || !this.tokenCache.expiresAt) {
      return false;
    }
    // 5-minute buffer before expiry
    return Date.now() < (this.tokenCache.expiresAt - 5 * 60 * 1000);
  }

  /**
   * Fetch OAuth access token from Safaricom
   * Implements caching to avoid unnecessary requests
   */
  async getOAuthToken() {
    // Return cached token if still valid
    if (this._isTokenValid()) {
      return this.tokenCache.accessToken;
    }

    try {
      const auth = this._getBasicAuthCredentials();
      
      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`
          },
          timeout: 10000 // 10 second timeout
        }
      );

      const { access_token, expires_in } = response.data;
      
      if (!access_token) {
        throw new Error('Invalid response from M-Pesa OAuth endpoint: missing access_token');
      }

      // Cache the token
      this.tokenCache = {
        accessToken: access_token,
        expiresAt: Date.now() + (expires_in * 1000)
      };

      return access_token;
    } catch (error) {
      const errorMessage = error.response?.data?.errorMessage || error.message;
      throw new Error(`M-Pesa OAuth token request failed: ${errorMessage}`);
    }
  }

  /**
   * Generate timestamp in YYYYMMDDHHmmss format
   */
  _generateTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Generate base64 encoded password (Shortcode + Passkey + Timestamp)
   */
  _generatePassword(timestamp) {
    const passwordString = `${this.shortcode}${this.passkey}${timestamp}`;
    return Buffer.from(passwordString).toString('base64');
  }

  /**
   * Format phone number to 2547XXXXXXXX format
   */
  _formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle various formats
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    // Validate length (254 + 9 digits = 12 characters)
    if (cleaned.length !== 12) {
      throw new Error(`Invalid phone number format: ${phoneNumber}. Expected 2547XXXXXXXX`);
    }
    
    return cleaned;
  }

  /**
   * Initiate STK Push (M-Pesa Express)
   * @param {string} phoneNumber - Customer phone number
   * @param {number} amount - Amount to charge
   * @param {string} accountReference - Reference for the transaction
   * @returns {Object} Safaricom response with CheckoutRequestID and ResponseCode
   */
  async initiateSTKPush(phoneNumber, amount, accountReference) {
    // Validate inputs
    if (!phoneNumber || !amount || !accountReference) {
      throw new Error('Missing required parameters: phoneNumber, amount, and accountReference are required');
    }

    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    if (accountReference.length > 12) {
      throw new Error('Account reference must not exceed 12 characters');
    }

    const formattedPhone = this._formatPhoneNumber(phoneNumber);
    const timestamp = this._generateTimestamp();
    const password = this._generatePassword(timestamp);
    const accessToken = await this.getOAuthToken();

    const payload = {
      BusinessShortCode: this.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount), // M-Pesa requires whole numbers
      PartyA: formattedPhone,
      PartyB: this.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: this.callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: 'BambaPay Deposit'
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout for STK push
        }
      );

      const { CheckoutRequestID, ResponseCode, ResponseDescription, MerchantRequestID } = response.data;

      // ResponseCode "0" indicates success
      if (ResponseCode !== '0') {
        throw new Error(`M-Pesa STK Push failed: ${ResponseDescription} (Code: ${ResponseCode})`);
      }

      return {
        success: true,
        checkoutRequestId: CheckoutRequestID,
        merchantRequestId: MerchantRequestID,
        responseCode: ResponseCode,
        responseDescription: ResponseDescription,
        rawResponse: response.data
      };
    } catch (error) {
      if (error.response) {
        const { data, status } = error.response;
        throw new Error(`M-Pesa STK Push HTTP ${status}: ${data.errorMessage || JSON.stringify(data)}`);
      }
      throw new Error(`M-Pesa STK Push request failed: ${error.message}`);
    }
  }

  /**
   * Query STK Push transaction status
   * @param {string} checkoutRequestId - The CheckoutRequestID from initiateSTKPush
   */
  async querySTKPushStatus(checkoutRequestId) {
    if (!checkoutRequestId) {
      throw new Error('checkoutRequestId is required');
    }

    const timestamp = this._generateTimestamp();
    const password = this._generatePassword(timestamp);
    const accessToken = await this.getOAuthToken();

    const payload = {
      BusinessShortCode: this.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      return {
        success: response.data.ResultCode === '0',
        resultCode: response.data.ResultCode,
        resultDesc: response.data.ResultDesc,
        rawResponse: response.data
      };
    } catch (error) {
      if (error.response) {
        const { data, status } = error.response;
        throw new Error(`M-Pesa STK Query HTTP ${status}: ${data.errorMessage || JSON.stringify(data)}`);
      }
      throw new Error(`M-Pesa STK Query failed: ${error.message}`);
    }
  }

  /**
   * Clear token cache (useful for testing or forced refresh)
   */
  clearTokenCache() {
    this.tokenCache = {
      accessToken: null,
      expiresAt: null
    };
  }
}

// Export singleton instance
module.exports = new MpesaService();