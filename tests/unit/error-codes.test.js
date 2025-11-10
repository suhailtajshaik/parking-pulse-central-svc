const { AppError, ERROR_CODES } = require('../../src/utils/error-codes');

describe('AppError', () => {
  it('should create error with correct properties', () => {
    const error = new AppError('VALIDATION_ERROR');

    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Invalid input data');
  });

  it('should allow custom message', () => {
    const error = new AppError('VALIDATION_ERROR', 'Custom message');

    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Custom message');
  });

  it('should include metadata', () => {
    const metadata = { field: 'email' };
    const error = new AppError('VALIDATION_ERROR', null, metadata);

    expect(error.metadata).toEqual(metadata);
  });

  it('should convert to JSON correctly', () => {
    const error = new AppError('DEVICE_NOT_FOUND', 'Device xyz not found');
    const json = error.toJSON();

    expect(json.success).toBe(false);
    expect(json.error.code).toBe('DEVICE_NOT_FOUND');
    expect(json.error.message).toBe('Device xyz not found');
    expect(json.error.statusCode).toBe(404);
    expect(json.error.timestamp).toBeDefined();
  });

  it('should default to INTERNAL_SERVER_ERROR for unknown code', () => {
    const error = new AppError('UNKNOWN_CODE');

    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(error.statusCode).toBe(500);
  });
});

describe('ERROR_CODES', () => {
  it('should have all required error codes', () => {
    expect(ERROR_CODES.VALIDATION_ERROR).toBeDefined();
    expect(ERROR_CODES.UNAUTHORIZED).toBeDefined();
    expect(ERROR_CODES.DEVICE_NOT_FOUND).toBeDefined();
    expect(ERROR_CODES.RATE_LIMIT_EXCEEDED).toBeDefined();
    expect(ERROR_CODES.INTERNAL_SERVER_ERROR).toBeDefined();
  });

  it('should have correct status codes', () => {
    expect(ERROR_CODES.VALIDATION_ERROR.statusCode).toBe(400);
    expect(ERROR_CODES.UNAUTHORIZED.statusCode).toBe(401);
    expect(ERROR_CODES.DEVICE_NOT_FOUND.statusCode).toBe(404);
    expect(ERROR_CODES.RATE_LIMIT_EXCEEDED.statusCode).toBe(429);
    expect(ERROR_CODES.INTERNAL_SERVER_ERROR.statusCode).toBe(500);
  });
});
