const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        statusCode: 429,
      },
    });
  },
});

// Stricter rate limiter for device status endpoint
const deviceStatusLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10, // Each device should report every 10 seconds, so max 6-7 per minute normally
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many status updates, please slow down',
      statusCode: 429,
    },
  },
  keyGenerator: (req) => {
    // Rate limit per device ID
    return req.body?.piId || req.ip;
  },
  handler: (req, res) => {
    logger.warn('Device status rate limit exceeded', {
      piId: req.body?.piId,
      ip: req.ip,
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many status updates, please slow down',
        statusCode: 429,
      },
    });
  },
});

module.exports = {
  apiLimiter,
  deviceStatusLimiter,
};
