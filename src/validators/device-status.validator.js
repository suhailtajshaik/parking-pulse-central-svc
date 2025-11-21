const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('../utils/error-codes');

/**
 * Validation rules for device status submission
 */
const validateDeviceStatus = [
  body('piId')
    .notEmpty()
    .withMessage('piId is required')
    .isString()
    .withMessage('piId must be a string')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('piId must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('piId must contain only alphanumeric characters, hyphens, and underscores'),

  body('temperatureC')
    .optional()
    .isFloat({ min: -50, max: 150 })
    .withMessage('temperatureC must be a number between -50 and 150'),

  body('temperatureF')
    .optional()
    .isFloat({ min: -58, max: 302 })
    .withMessage('temperatureF must be a number between -58 and 302'),

  body('cameraOk')
    .notEmpty()
    .withMessage('cameraOk is required')
    .isBoolean()
    .withMessage('cameraOk must be a boolean'),

  body('systemOnline')
    .optional()
    .isBoolean()
    .withMessage('systemOnline must be a boolean'),

  body('uptime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('uptime must be a positive integer'),

  body('timestamp')
    .optional()
    .isInt({ min: 1000000000000, max: 9999999999999 })
    .withMessage('timestamp must be a valid Unix timestamp in milliseconds')
    .custom((value) => {
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      if (value > now + fiveMinutes) {
        throw new Error('timestamp cannot be more than 5 minutes in the future');
      }
      if (value < now - 24 * 60 * 60 * 1000) {
        throw new Error('timestamp cannot be more than 24 hours in the past');
      }
      return true;
    }),

  // Custom validator to check temperature consistency
  body().custom((body) => {
    if (body.temperatureC && body.temperatureF) {
      const calculatedF = (body.temperatureC * 9/5) + 32;
      if (Math.abs(calculatedF - body.temperatureF) > 2) {
        throw new Error('Temperature values (C and F) are inconsistent');
      }
    }
    return true;
  }),
];

/**
 * Validation rules for device ID parameter
 */
const validateDeviceId = [
  param('piId')
    .notEmpty()
    .withMessage('piId is required')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('piId must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('piId must contain only alphanumeric characters, hyphens, and underscores'),
];

/**
 * Validation rules for query parameters
 */
const validateDeviceQuery = [
  query('piId')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('piId must be between 3 and 50 characters'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset must be a positive integer'),
];

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return next(
      new AppError(
        'VALIDATION_ERROR',
        'Request validation failed',
        { errors: errorDetails }
      )
    );
  }

  next();
};

module.exports = {
  validateDeviceStatus,
  validateDeviceId,
  validateDeviceQuery,
  handleValidationErrors,
};
