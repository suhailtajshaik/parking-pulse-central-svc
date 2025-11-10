const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const config = require('./config');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/request-logger');
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');
const routes = require('./routes');

const app = express();

// Trust proxy (if behind reverse proxy like nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.security.corsOrigins,
  credentials: true,
}));

// Body parser middleware
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Compression middleware
app.use(compression());

// HTTP request logging
app.use(requestLogger);

// Routes
app.use('/', routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;
