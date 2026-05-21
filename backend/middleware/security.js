const sanitize = require('mongo-sanitize');

/**
 * Sanitizes request body, query, and params to prevent NoSQL injection
 * Wraps any nested operators in $eq to neutralize injection attempts
 */
const sanitizeInputs = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitize(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitize(req.params);
  }
  next();
};

/**
 * Per-user rate limiter using in-memory store
 * Falls back to IP if user not authenticated
 */
class PerUserRateLimiter {
  constructor() {
    this.requests = new Map(); // userId/ip -> { count, resetTime }
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Clean every minute
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  middleware(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 5, // max requests per window
      keyGenerator = (req) => req.user?.id || req.ip,
      message = 'Too many attempts. Please try again later.'
    } = options;

    return (req, res, next) => {
      const key = keyGenerator(req);
      const now = Date.now();

      if (!this.requests.has(key)) {
        this.requests.set(key, { count: 1, resetTime: now + windowMs });
        return next();
      }

      const data = this.requests.get(key);

      if (now > data.resetTime) {
        // Reset window
        this.requests.set(key, { count: 1, resetTime: now + windowMs });
        return next();
      }

      if (data.count >= max) {
        const retryAfter = Math.ceil((data.resetTime - now) / 1000);
        res.set('Retry-After', retryAfter);
        return res.status(429).json({
          success: false,
          message,
          retryAfter
        });
      }

      data.count += 1;
      next();
    };
  }
}

const pinRateLimiter = new PerUserRateLimiter();

module.exports = {
  sanitizeInputs,
  pinRateLimiter
};
