const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('./index');

let isConnected = false;

const connectDatabase = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    isConnected = true;
    logger.info('MongoDB connected successfully', {
      database: mongoose.connection.name,
      host: mongoose.connection.host,
    });

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

const getConnectionStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
  };
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getConnectionStatus,
};
