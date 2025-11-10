const ERROR_CODES = {
  // Validation errors (400)
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input data',
    statusCode: 400,
  },
  MISSING_REQUIRED_FIELD: {
    code: 'MISSING_REQUIRED_FIELD',
    message: 'Required field is missing',
    statusCode: 400,
  },
  INVALID_DATA_TYPE: {
    code: 'INVALID_DATA_TYPE',
    message: 'Invalid data type',
    statusCode: 400,
  },

  // Authentication errors (401)
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
    statusCode: 401,
  },
  INVALID_API_KEY: {
    code: 'INVALID_API_KEY',
    message: 'Invalid or missing API key',
    statusCode: 401,
  },

  // Authorization errors (403)
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Access forbidden',
    statusCode: 403,
  },

  // Not found errors (404)
  DEVICE_NOT_FOUND: {
    code: 'DEVICE_NOT_FOUND',
    message: 'Device not found',
    statusCode: 404,
  },
  RESOURCE_NOT_FOUND: {
    code: 'RESOURCE_NOT_FOUND',
    message: 'Resource not found',
    statusCode: 404,
  },

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests',
    statusCode: 429,
  },

  // Server errors (500)
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    statusCode: 500,
  },
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Database operation failed',
    statusCode: 500,
  },
};

class AppError extends Error {
  constructor(errorCode, customMessage = null, metadata = {}) {
    const error = ERROR_CODES[errorCode] || ERROR_CODES.INTERNAL_SERVER_ERROR;
    super(customMessage || error.message);

    this.code = error.code;
    this.statusCode = error.statusCode;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
        ...(Object.keys(this.metadata).length > 0 && { metadata: this.metadata }),
      },
    };
  }
}

module.exports = {
  ERROR_CODES,
  AppError,
};
