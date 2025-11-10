const morgan = require('morgan');
const logger = require('../utils/logger');

// Define custom token for request ID (if you add request ID generation later)
morgan.token('id', (req) => req.id || '-');

// Create custom morgan format
const morganFormat = ':method :url :status :res[content-length] - :response-time ms - :remote-addr';

// Create morgan middleware with winston stream
const requestLogger = morgan(morganFormat, {
  stream: logger.stream,
  skip: (req, res) => {
    // Skip logging health checks in production to reduce noise
    if (process.env.NODE_ENV === 'production') {
      return req.path === '/health' || req.path === '/health/live';
    }
    return false;
  },
});

module.exports = requestLogger;
