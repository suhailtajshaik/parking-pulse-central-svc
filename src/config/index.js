require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/parking_pulse',
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE, 10) || 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // Security
  security: {
    apiKeys: process.env.API_KEYS ? process.env.API_KEYS.split(',') : [],
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000, // 1 minute
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // Alert thresholds
  alerts: {
    temperatureThresholdC: parseFloat(process.env.ALERT_TEMP_THRESHOLD_C) || 70,
    temperatureCriticalC: parseFloat(process.env.ALERT_TEMP_CRITICAL_C) || 80,
    deduplicationWindowMs: parseInt(process.env.ALERT_DEDUP_WINDOW_MS, 10) || 300000, // 5 minutes
  },

  // Device monitoring
  device: {
    offlineTimeoutMs: parseInt(process.env.DEVICE_OFFLINE_TIMEOUT_MS, 10) || 120000, // 2 minutes
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};

// Validate required configuration
const validateConfig = () => {
  const errors = [];

  if (config.env === 'production') {
    if (!process.env.MONGODB_URI) {
      errors.push('MONGODB_URI is required in production');
    }
    if (!process.env.API_KEYS || process.env.API_KEYS.length === 0) {
      errors.push('API_KEYS is required in production');
    }
    if (config.security.corsOrigins.includes('*')) {
      errors.push('CORS_ORIGINS should not include wildcard (*) in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
};

// Run validation
validateConfig();

module.exports = config;
