const express = require('express');
const router = express.Router();

const deviceRoutes = require('./device.routes');
const healthRoutes = require('./health.routes');

// API v1 routes
router.use('/api/v1/devices', deviceRoutes);

// Health check routes
router.use('/health', healthRoutes);

// API root - provide API information
router.get('/api/v1', (req, res) => {
  res.json({
    name: 'Parking Pulse Central API',
    version: '1.0.0',
    description: 'Central monitoring service for Parking Pulse IoT devices',
    endpoints: {
      devices: {
        'POST /api/v1/devices/status': 'Submit device status',
        'GET /api/v1/devices': 'List all devices',
        'GET /api/v1/devices/:piId': 'Get device status',
        'GET /api/v1/devices/:piId/history': 'Get device history',
      },
      alerts: {
        'GET /api/v1/devices/alerts/all': 'Get all alerts',
        'GET /api/v1/devices/alerts/:piId': 'Get device alerts',
        'PATCH /api/v1/devices/alerts/:alertId': 'Resolve alert',
      },
      health: {
        'GET /health': 'Basic health check',
        'GET /health/ready': 'Readiness probe',
        'GET /health/live': 'Liveness probe',
        'GET /health/detailed': 'Detailed health information',
      },
    },
  });
});

// Root redirect
router.get('/', (req, res) => {
  res.redirect('/api/v1');
});

module.exports = router;
