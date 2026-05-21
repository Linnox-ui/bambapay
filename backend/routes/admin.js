const express = require('express');
const { query, body, validationResult } = require('express-validator');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Deposit = require('../models/Deposit');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/dashboard', async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers,
      totalTransactions,
      totalVolume,
      totalDeposits,
      pendingKyc,
      recentTransactions,
      dailyStats
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Transaction.countDocuments(),
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Deposit.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      User.countDocuments({ kycStatus: 'submitted' }),
      Transaction.find()
        .populate('sender', 'firstName lastName phone')
        .populate('receiver', 'firstName lastName phone')
        .sort({ createdAt: -1 })
        .limit(10),
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            volume: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        newUsers,
        totalTransactions,
        totalVolume: totalVolume[0]?.total || 0,
        totalDeposits: totalDeposits[0]?.total || 0,
        pendingKyc,
        activeUsers: await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } })
      },
      recentTransactions: recentTransactions.map(t => ({
        id: t.transactionId,
        type: t.type,
        amount: t.amount,
        status: t.status,
        sender: t.sender ? `${t.sender.firstName} ${t.sender.lastName}` : 'System',
        receiver: t.receiver ? `${t.receiver.firstName} ${t.receiver.lastName}` : 'System',
        createdAt: t.createdAt
      })),
      dailyStats
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Admin
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('status').optional().isIn(['all', 'active', 'inactive', 'pending_kyc'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status || 'all';

    let query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (status === 'pending_kyc') query.kycStatus = 'submitted';

    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('-password -pin')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      },
      users: users.map(u => ({
        id: u._id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        phone: u.phone,
        balance: u.balance,
        currency: u.currency,
        isVerified: u.isVerified,
        isActive: u.isActive,
        kycStatus: u.kycStatus,
        isAdmin: u.isAdmin,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user details
// @access  Admin
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -pin');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const transactions = await Transaction.find({
      $or: [{ sender: user._id }, { receiver: user._id }]
    })
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        currency: user.currency,
        isVerified: user.isVerified,
        isActive: user.isActive,
        kycStatus: user.kycStatus,
        isAdmin: user.isAdmin,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      transactions: transactions.map(t => ({
        id: t.transactionId,
        type: t.type,
        amount: t.amount,
        status: t.status,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Admin
router.put('/users/:id/status', [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password -pin');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/transactions
// @desc    Get all transactions
// @access  Admin
router.get('/transactions', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['all', 'pending', 'completed', 'failed']),
  query('type').optional().isIn(['all', 'send', 'receive', 'deposit', 'withdraw'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status || 'all';
    const type = req.query.type || 'all';

    let query = {};
    if (status !== 'all') query.status = status;
    if (type !== 'all') query.type = type;

    const skip = (page - 1) * limit;

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(query)
        .populate('sender', 'firstName lastName phone email')
        .populate('receiver', 'firstName lastName phone email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
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
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/analytics
// @desc    Get analytics data
// @access  Admin
router.get('/analytics', async (req, res, next) => {
  try {
    const now = new Date();
    const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      userGrowth,
      transactionVolume,
      topUsers,
      statusDistribution
    ] = await Promise.all([
      // User growth over last 30 days
      User.aggregate([
        {
          $match: { createdAt: { $gte: last30Days } }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Transaction volume over last 30 days
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: last30Days },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            volume: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Top users by transaction volume
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: last7Days },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$sender',
            totalVolume: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { totalVolume: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        }
      ]),

      // Transaction status distribution
      Transaction.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      analytics: {
        userGrowth,
        transactionVolume,
        topUsers: topUsers.map(u => ({
          userId: u._id,
          name: u.user[0] ? `${u.user[0].firstName} ${u.user[0].lastName}` : 'Unknown',
          totalVolume: u.totalVolume,
          transactionCount: u.count
        })),
        statusDistribution
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
