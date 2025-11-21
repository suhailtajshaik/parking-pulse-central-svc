const { AppError } = require('../utils/error-codes');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate requests using API key
 * API key should be provided in X-API-Key header
 */
const authenticateApiKey = (req, res, next) => {
  // Skip authentication in development if no API keys configured
  if (config.env === 'development' && config.security.apiKeys.length === 0) {
    logger.debug('Skipping API key authentication in development mode');
    return next();
  }

  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    logger.warn('Missing API key in request', {
      ip: req.ip,
      path: req.path,
    });
    return next(new AppError('INVALID_API_KEY', 'API key is required'));
  }

  if (!config.security.apiKeys.includes(apiKey)) {
    logger.warn('Invalid API key attempt', {
      ip: req.ip,
      path: req.path,
      apiKey: apiKey.substring(0, 8) + '...',
    });
    return next(new AppError('INVALID_API_KEY', 'Invalid API key'));
  }

  logger.debug('API key authenticated successfully');
  next();
};

/**
 * Optional authentication - doesn't fail if no API key, but validates if present
 */
const optionalAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (apiKey && !config.security.apiKeys.includes(apiKey)) {
    return next(new AppError('INVALID_API_KEY', 'Invalid API key'));
  }

  next();
};

module.exports = {
  authenticateApiKey,
  optionalAuth,
};
