const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const MpesaService = require('../services/MpesaService');
const User = require('../models/User');

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

    /**
   * Get the logged-in user's wallet balance
   * GET /api/wallet/balance
   */
    static async getBalance(req, res) {
      try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('balance currency');
  
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
  
        return res.status(200).json({
          success: true,
          data: {
            balance: user.balance,
            currency: user.currency || 'KES'
          }
        });
  
      } catch (error) {
        console.error('[WalletController] Failed to fetch balance:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch wallet balance.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
    /**
   * Initiate an M-Pesa B2C Withdrawal
   * POST /api/wallet/withdraw
   */
    static async initiateWithdrawal(req, res) {
      const receiver = phoneNumber;
      let session = null;
  
      try {
        const { amount, phoneNumber } = req.body;
        const userId = req.user.id;
  
        // 1. Validate inputs
        if (!amount || !phoneNumber) {
          return res.status(400).json({
            success: false,
            message: 'Amount and phoneNumber are required'
          });
        }
  
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount < 10) {
          return res.status(400).json({
            success: false,
            message: 'Minimum withdrawal amount is 10 KES'
          });
        }
  
        // 2. Check user has sufficient balance (pessimistic check before debit)
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.balance < parsedAmount) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient funds'
          });
        }
  
        // 3. Start MongoDB session for atomic operations
        session = await mongoose.startSession();
        session.startTransaction();
  
        // 4. Pessimistic debit: remove funds immediately
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $inc: { balance: -parsedAmount } },
          { session, new: true }
        );
  
        // 5. Generate transaction ID
        const transactionId = `WTH-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
        // 6. Call Safaricom B2C API
        const b2cResponse = await MpesaService.initiateB2C(phoneNumber, parsedAmount, transactionId);
        console.log('[WalletController] B2C Initiated:', b2cResponse);
  
        // 🐛 BUG FIX #1: Save the ConversationID so the webhook can find this transaction
        const conversationId = b2cResponse.ConversationID || b2cResponse.conversationId || b2cResponse.OriginatorConversationID;
  
        if (!conversationId) {
          // Safaricom didn't return a tracking ID — abort and refund
          throw new Error('Safaricom did not return a ConversationID');
        }
  
        // 7. Create pending transaction record WITH providerTransactionId
        const transaction = new Transaction({
          transactionId,
          sender: userId,
          receiver: receiver,
          amount: parsedAmount,
          currency: 'KES',
          type: 'withdrawal',
          status: 'PENDING',
          provider: 'MPESA',
          providerTransactionId: conversationId, // ← 🐛 BUG FIX #1: This was missing!
          description: 'M-Pesa B2C Withdrawal',
          metadata: {
            phoneNumber: phoneNumber,
            initiatorName: b2cResponse.OriginatorConversationID || null,
            initiatedAt: new Date(),
            mpesaRawResponse: b2cResponse
          }
        });
  
        await transaction.save({ session });
  
        // 8. Commit the atomic transaction
        await session.commitTransaction();
  
        // 9. Return success to frontend
        return res.status(200).json({
          success: true,
          message: 'Withdrawal initiated successfully',
          data: {
            transactionId: transaction.transactionId,
            conversationId,
            amount: parsedAmount,
            currency: 'KES',
            status: 'PENDING',
            newBalance: updatedUser.balance
          }
        });
  
      } catch (error) {
        console.error('[WalletController] Withdrawal initiation failed:', error);
  
        // Abort transaction on any error to refund the user
        if (session && session.inTransaction()) {
          try {
            await session.abortTransaction();
            console.log('[WalletController] Transaction aborted — no funds debited');
          } catch (abortErr) {
            console.error('[WalletController] Failed to abort transaction:', abortErr);
          }
        }
  
        // If we already debited but B2C failed, we need to refund
        // (The abort above handles this if the error happened before commit)
  
        return res.status(500).json({
          success: false,
          message: error.message || 'Failed to initiate withdrawal. Please try again.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      } finally {
        if (session) await session.endSession();
      }
    }
}

module.exports = WalletController;