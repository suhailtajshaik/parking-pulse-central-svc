const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { connectDatabase, disconnectDatabase } = require('./config/database');

let server;

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Create logs directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Start Express server
    server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${config.port}`, {
        environment: config.env,
        port: config.port,
      });
      logger.info(`📡 API endpoint: http://0.0.0.0:${config.port}/api/v1`);
      logger.info(`❤️  Health check: http://0.0.0.0:${config.port}/health`);
    });

    // Handle server errors
    server.on('error', (error) => {
      logger.error('Server error:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  if (server) {
    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Close database connection
        await disconnectDatabase();

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after timeout
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000); // 30 seconds timeout
  } else {
    process.exit(0);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();
