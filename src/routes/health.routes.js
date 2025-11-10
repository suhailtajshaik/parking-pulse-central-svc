const express = require('express');
const router = express.Router();
const { getConnectionStatus } = require('../config/database');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Simple health check endpoint for load balancers and monitoring
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /health/ready
 * @desc    Readiness probe (for Kubernetes)
 * @access  Public
 */
router.get('/ready', (req, res) => {
  const dbStatus = getConnectionStatus();

  if (dbStatus.isConnected) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        mongodb: 'connected',
      },
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      checks: {
        mongodb: dbStatus.readyStateText,
      },
    });
  }
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe
 *     description: Kubernetes liveness probe endpoint to check if the service is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: alive
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Process uptime in seconds
 *                   example: 123.456
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @route   GET /health/detailed
 * @desc    Detailed health information
 * @access  Public
 */
router.get('/detailed', (req, res) => {
  const dbStatus = getConnectionStatus();

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
    },
    database: {
      status: dbStatus.readyStateText,
      connected: dbStatus.isConnected,
    },
  });
});

module.exports = router;
