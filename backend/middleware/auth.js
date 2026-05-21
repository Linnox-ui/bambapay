const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { pinRateLimiter } = require('./security');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password -pin');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      if (!req.user.isActive) {
        return res.status(401).json({ success: false, message: 'Account has been deactivated' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } catch (error) {
    next(error);
  }
};

const adminOnly = async (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Not authorized as admin' });
  }
};

const verifyPin = async (req, res, next) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ success: false, message: 'Transaction PIN is required' });
    }

    // Rate limit PIN attempts per user (5 attempts per 15 minutes)
    const limiterMiddleware = pinRateLimiter.middleware({
      windowMs: 15 * 60 * 1000,
      max: 5,
      keyGenerator: (req) => `pin:${req.user.id}`,
      message: 'Too many PIN attempts. Please wait 15 minutes.'
    });

    // Execute rate limiter
    let rateLimitPassed = false;
    limiterMiddleware(req, res, () => {
      rateLimitPassed = true;
    });

    if (!rateLimitPassed) {
      return; // Response already sent by rate limiter
    }

    const user = await User.findById(req.user.id).select('+pin');
    const isValid = await user.comparePin(pin);

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid transaction PIN' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect, adminOnly, verifyPin };
