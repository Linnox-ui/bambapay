const Transaction = require('../models/Transaction');
const MpesaService = require('../services/MpesaService');

class WalletController {
  /**
   * Initiate an M-Pesa deposit via STK Push
   * POST /api/wallet/deposit
   */
  static async initiateDeposit(req, res) {
    try {
      const { amount, phoneNumber } = req.body;
      const userId = req.user.id;

      // Validate inputs
      if (!amount || !phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Amount and phoneNumber are required'
        });
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number'
        });
      }

      // Generate a unique transaction ID and account reference
      const transactionId = `BMP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const accountReference = `BMP${userId.toString().slice(-6)}`;

      // Initiate STK Push with Safaricom
      const mpesaResponse = await MpesaService.initiateSTKPush(
        phoneNumber,
        parsedAmount,
        accountReference
      );

      const { checkoutRequestId, merchantRequestId } = mpesaResponse;

      // Create pending transaction record
      const transaction = new Transaction({
        transactionId,
        sender: userId,      // User initiating the deposit
        receiver: userId,    // Same user receives the funds
        amount: parsedAmount,
        currency: 'KES',
        type: 'deposit',
        status: 'PENDING',
        provider: 'MPESA',
        providerTransactionId: checkoutRequestId,
        reference: accountReference,
        description: 'M-Pesa deposit via STK Push',
        metadata: {
          merchantRequestId,
          accountReference,
          phoneNumber: phoneNumber,
          initiatedAt: new Date(),
          mpesaRawResponse: mpesaResponse.rawResponse
        }
      });

      await transaction.save();

      return res.status(200).json({
        success: true,
        message: 'STK Push initiated successfully. Please check your phone to complete the M-Pesa payment.',
        data: {
          transactionId: transaction.transactionId,
          checkoutRequestId,
          amount: parsedAmount,
          currency: 'KES',
          status: 'PENDING'
        }
      });

    } catch (error) {
      console.error('[WalletController] Deposit initiation failed:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to initiate deposit. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = WalletController;