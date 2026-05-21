const express = require('express');
const { query, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/transactions
// @desc    Get user's transaction history
// @access  Private
router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['send', 'receive', 'deposit', 'withdraw', 'all']).withMessage('Invalid type'),
  query('status').optional().isIn(['pending', 'completed', 'failed', 'all']).withMessage('Invalid status')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type || 'all';
    const status = req.query.status || 'all';

    const query = {
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ]
    };

    if (type !== 'all') {
      query.type = type;
    }

    if (status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(query)
        .populate('sender', 'firstName lastName phone')
        .populate('receiver', 'firstName lastName phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(query)
    ]);

    // Calculate summary statistics
    const summary = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id }
          ],
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const summaryMap = { sent: 0, received: 0, deposited: 0 };
    summary.forEach(item => {
      if (item._id === 'send') summaryMap.sent = item.total;
      if (item._id === 'receive') summaryMap.received = item.total;
      if (item._id === 'deposit') summaryMap.deposited = item.total;
    });

    res.json({
      success: true,
      summary: summaryMap,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      },
      transactions: transactions.map(t => ({
        id: t.transactionId,
        type: t.type,
        amount: t.amount,
        fee: t.fee,
        currency: t.currency,
        status: t.status,
        description: t.description,
        sender: t.sender ? {
          name: `${t.sender.firstName} ${t.sender.lastName}`,
          phone: t.sender.phone
        } : null,
        receiver: t.receiver ? {
          name: `${t.receiver.firstName} ${t.receiver.lastName}`,
          phone: t.receiver.phone
        } : null,
        isIncoming: t.receiver && t.receiver._id.toString() === req.user.id,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction details
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      transactionId: req.params.id,
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ]
    })
    .populate('sender', 'firstName lastName phone email')
    .populate('receiver', 'firstName lastName phone email');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({
      success: true,
      transaction: {
        id: transaction.transactionId,
        type: transaction.type,
        amount: transaction.amount,
        fee: transaction.fee,
        currency: transaction.currency,
        status: transaction.status,
        description: transaction.description,
        reference: transaction.reference,
        sender: transaction.sender ? {
          name: `${transaction.sender.firstName} ${transaction.sender.lastName}`,
          phone: transaction.sender.phone,
          email: transaction.sender.email
        } : null,
        receiver: transaction.receiver ? {
          name: `${transaction.receiver.firstName} ${transaction.receiver.lastName}`,
          phone: transaction.receiver.phone,
          email: transaction.receiver.email
        } : null,
        metadata: transaction.metadata,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/transactions/stats/summary
// @desc    Get transaction statistics
// @access  Private
router.get('/stats/summary', protect, async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const stats = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id }
          ],
          createdAt: { $gte: thirtyDaysAgo },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
