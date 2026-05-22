const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

class WebhookController {
  /**
   * Process Safaricom Daraja STK Push callback
   * Safaricom sends: req.body.Body.stkCallback
   */
  static async handleMpesaCallback(req, res) {
    // Always acknowledge receipt immediately to prevent Safaricom retries
    // We process asynchronously, but Safaricom needs the 200 fast
    res.status(200).send('Webhook received');

    let session = null;

    try {
      // Extract Safaricom's nested payload structure
      const stkCallback = req.body?.Body?.stkCallback;
      
      if (!stkCallback) {
        console.error('[Webhook] Invalid payload structure. Missing req.body.Body.stkCallback');
        console.error('[Webhook] Received body:', JSON.stringify(req.body));
        return;
      }

      const {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
        CallbackMetadata
      } = stkCallback;

      if (!CheckoutRequestID) {
        console.error('[Webhook] Missing CheckoutRequestID in callback');
        return;
      }

      console.log(`[Webhook] Processing M-Pesa callback for CheckoutRequestID: ${CheckoutRequestID}`);
      console.log(`[Webhook] ResultCode: ${ResultCode}, ResultDesc: ${ResultDesc}`);

      // Extract receipt number from CallbackMetadata if successful
      let receiptNumber = null;
      let transactionAmount = null;
      let phoneNumber = null;

      if (ResultCode === 0 && CallbackMetadata?.Item) {
        const metadataItems = CallbackMetadata.Item;
        
        // Safaricom CallbackMetadata is an array of { Name, Value } objects
        for (const item of metadataItems) {
          switch (item.Name) {
            case 'MpesaReceiptNumber':
              receiptNumber = item.Value;
              break;
            case 'Amount':
              transactionAmount = parseFloat(item.Value);
              break;
            case 'PhoneNumber':
              phoneNumber = item.Value;
              break;
            default:
              break;
          }
        }
      }

      // Start MongoDB session for atomic operations
      session = await mongoose.startSession();
      session.startTransaction();

      // IDEMPOTENCY CHECK: Find transaction by CheckoutRequestID
      const transaction = await Transaction.findOne({
        providerTransactionId: CheckoutRequestID,
        provider: 'MPESA'
      }).session(session);

      if (!transaction) {
        console.error(`[Webhook] Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`);
        await session.abortTransaction();
        return;
      }

      // CRITICAL: If already processed, halt immediately to prevent double-crediting
      if (transaction.status === 'SUCCESS' || transaction.status === 'FAILED') {
        console.log(`[Webhook] Transaction ${transaction._id} already processed with status: ${transaction.status}. Skipping.`);
        await session.abortTransaction();
        return;
      }

      // Verify transaction is still in PENDING state
      if (transaction.status !== 'PENDING') {
        console.warn(`[Webhook] Transaction ${transaction._id} is in unexpected state: ${transaction.status}. Aborting.`);
        await session.abortTransaction();
        return;
      }

      const isSuccess = ResultCode === 0;

      if (isSuccess) {
        // SUCCESS PATH
        console.log(`[Webhook] Processing SUCCESS for transaction ${transaction._id}`);
        console.log(`[Webhook] Receipt: ${receiptNumber}, Amount: ${transactionAmount}`);

        // Update transaction to SUCCESS
        transaction.status = 'SUCCESS';
        transaction.providerTransactionId = receiptNumber || CheckoutRequestID;
        transaction.metadata = {
          ...transaction.metadata,
          mpesaReceiptNumber: receiptNumber,
          callbackPhoneNumber: phoneNumber,
          callbackAmount: transactionAmount,
          merchantRequestId: MerchantRequestID,
          resultDesc: ResultDesc,
          processedAt: new Date(),
          rawCallback: req.body
        };

        await transaction.save({ session });

        // Atomically increment user balance
        // The receiver is the user whose balance should increase (deposit scenario)
        const updatedUser = await User.findByIdAndUpdate(
          transaction.receiver,
          { $inc: { balance: transaction.amount } },
          { session, new: true }
        );

        if (!updatedUser) {
          throw new Error(`User not found for receiver ID: ${transaction.receiver}`);
        }

        console.log(`[Webhook] Credited ${transaction.amount} to user ${updatedUser._id}. New balance: ${updatedUser.balance}`);

      } else {
        // FAILURE PATH
        console.log(`[Webhook] Processing FAILURE for transaction ${transaction._id}: ${ResultDesc}`);

        transaction.status = 'FAILED';
        transaction.metadata = {
          ...transaction.metadata,
          failureReason: ResultDesc,
          resultCode: ResultCode,
          merchantRequestId: MerchantRequestID,
          processedAt: new Date(),
          rawCallback: req.body
        };

        await transaction.save({ session });
        // DO NOT touch user balance on failure
      }

      // Commit the atomic transaction
      await session.commitTransaction();
      console.log(`[Webhook] Transaction ${transaction._id} committed successfully. Final status: ${transaction.status}`);

    } catch (error) {
      console.error('[Webhook] Error processing M-Pesa callback:', error);
      
      // Abort transaction on any error to maintain atomicity
      if (session && session.inTransaction()) {
        try {
          await session.abortTransaction();
          console.log('[Webhook] Transaction aborted successfully');
        } catch (abortError) {
          console.error('[Webhook] Failed to abort transaction:', abortError);
        }
      }

      // Log the error for monitoring/alerts but do NOT throw
      // (we already sent 200 to Safaricom)
      // In production, you'd push this to a dead-letter queue or retry mechanism
      console.error('[Webhook] Critical: Transaction processing failed. Manual reconciliation may be required.');
      console.error('[Webhook] Error details:', error.message);
      console.error('[Webhook] Stack:', error.stack);

    } finally {
      // Always end the session
      if (session) {
        await session.endSession();
      }
    }
  }

  /**
 * Process Safaricom B2C (Business-to-Customer) withdrawal callback
 * Safaricom sends: req.body.Result
 */
static async handleB2CCallback(req, res) {
  // Acknowledge immediately
  res.status(200).send('B2C Webhook received');

  let session = null;

  try {
    const result = req.body?.Result;

    if (!result) {
      console.error('[B2C Webhook] Invalid payload. Missing req.body.Result');
      console.error('[B2C Webhook] Body:', JSON.stringify(req.body));
      return;
    }

    const {
      ConversationID,
      OriginatorConversationID,
      ResultCode,
      ResultDesc,
      TransactionID,
      ResultParameters
    } = result;

    if (!ConversationID) {
      console.error('[B2C Webhook] Missing ConversationID');
      return;
    }

    console.log(`[B2C Webhook] Processing for ConversationID: ${ConversationID}`);
    console.log(`[B2C Webhook] ResultCode: ${ResultCode}, ResultDesc: ${ResultDesc}`);

    // Extract metadata from ResultParameters
    let transactionAmount = null;
    let transactionReceipt = null;
    let receiverParty = null;

    if (ResultParameters?.ResultParameter) {
      for (const param of ResultParameters.ResultParameter) {
        switch (param.Key) {
          case 'TransactionAmount':
            transactionAmount = parseFloat(param.Value);
            break;
          case 'TransactionReceipt':
            transactionReceipt = param.Value;
            break;
          case 'ReceiverPartyPublicName':
            receiverParty = param.Value;
            break;
          default:
            break;
        }
      }
    }

    session = await mongoose.startSession();
    session.startTransaction();

    // Find withdrawal transaction by ConversationID (stored as providerTransactionId)
    const transaction = await Transaction.findOne({
      providerTransactionId: ConversationID,
      provider: 'MPESA',
      type: 'WITHDRAWAL'
    }).session(session);

    if (!transaction) {
      console.error(`[B2C Webhook] Withdrawal not found for ConversationID: ${ConversationID}`);
      await session.abortTransaction();
      return;
    }

    // Idempotency check
    if (transaction.status === 'SUCCESS' || transaction.status === 'FAILED') {
      console.log(`[B2C Webhook] Transaction ${transaction._id} already ${transaction.status}. Skipping.`);
      await session.abortTransaction();
      return;
    }

    if (transaction.status !== 'PENDING') {
      console.warn(`[B2C Webhook] Transaction ${transaction._id} in unexpected state: ${transaction.status}`);
      await session.abortTransaction();
      return;
    }

    const isSuccess = ResultCode === 0;

    if (isSuccess) {
      console.log(`[B2C Webhook] SUCCESS for withdrawal ${transaction._id}`);

      transaction.status = 'SUCCESS';
      transaction.providerTransactionId = transactionReceipt || TransactionID || ConversationID;
      transaction.metadata = {
        ...transaction.metadata,
        mpesaReceiptNumber: transactionReceipt,
        transactionId: TransactionID,
        originatorConversationId: OriginatorConversationID,
        receiverPartyPublicName: receiverParty,
        resultDesc: ResultDesc,
        callbackAmount: transactionAmount,
        processedAt: new Date(),
        rawCallback: req.body
      };

      await transaction.save({ session });

      // NOTE: For withdrawals, the balance was likely ALREADY debited when
      // the withdrawal was initiated (pessimistic approach). If you used
      // optimistic (debit on callback), debit here instead.
      // If already debited, just confirm — no balance change needed.

      console.log(`[B2C Webhook] Withdrawal ${transaction._id} confirmed as SUCCESS`);

    } else {
      console.log(`[B2C Webhook] FAILURE for withdrawal ${transaction._id}: ${ResultDesc}`);

      transaction.status = 'FAILED';
      transaction.metadata = {
        ...transaction.metadata,
        failureReason: ResultDesc,
        resultCode: ResultCode,
        originatorConversationId: OriginatorConversationID,
        processedAt: new Date(),
        rawCallback: req.body
      };

      await transaction.save({ session });

      // CRITICAL: If you debited balance optimistically on initiation,
      // you MUST refund the user here:
      const updatedUser = await User.findByIdAndUpdate(
        transaction.sender,  // sender = the user withdrawing
        { $inc: { balance: transaction.amount } },
        { session, new: true }
      );

      console.log(`[B2C Webhook] Refunded ${transaction.amount} to user ${updatedUser._id}. New balance: ${updatedUser.balance}`);
    }

    await session.commitTransaction();
    console.log(`[B2C Webhook] Transaction ${transaction._id} committed. Status: ${transaction.status}`);

  } catch (error) {
    console.error('[B2C Webhook] Error:', error);

    if (session && session.inTransaction()) {
      try { await session.abortTransaction(); } catch (e) {}
    }

    console.error('[B2C Webhook] Critical: Manual reconciliation may be required.');
  } finally {
    if (session) await session.endSession();
  }
}

  /**
   * Health check endpoint for webhook monitoring
   */
  static async healthCheck(req, res) {
    res.status(200).json({
      status: 'healthy',
      service: 'mpesa-webhook',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = WebhookController;