const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { authenticateApiKey } = require('../middleware/auth');
const { deviceStatusLimiter, apiLimiter } = require('../middleware/rate-limiter');
const {
  validateDeviceStatus,
  validateDeviceId,
  validateDeviceQuery,
  handleValidationErrors,
} = require('../validators/device-status.validator');

/**
 * @swagger
 * /api/v1/devices/status:
 *   post:
 *     summary: Submit device status update
 *     description: Endpoint for Raspberry Pi devices to submit their current status
 *     tags: [Device Status]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PiStatus'
 *     responses:
 *       201:
 *         description: Status update received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PiStatus'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing API key
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
  '/status',
  deviceStatusLimiter,
  authenticateApiKey,
  validateDeviceStatus,
  handleValidationErrors,
  deviceController.submitDeviceStatus
);

/**
 * @route   GET /api/v1/devices
 * @desc    Get all devices with latest status
 * @access  Private (requires API key)
 */
router.get(
  '/',
  apiLimiter,
  authenticateApiKey,
  validateDeviceQuery,
  handleValidationErrors,
  deviceController.getAllDevices
);

/**
 * @route   GET /api/v1/devices/:piId
 * @desc    Get specific device status
 * @access  Private (requires API key)
 */
router.get(
  '/:piId',
  apiLimiter,
  authenticateApiKey,
  validateDeviceId,
  handleValidationErrors,
  deviceController.getDeviceStatus
);

/**
 * @route   GET /api/v1/devices/:piId/history
 * @desc    Get device status history
 * @access  Private (requires API key)
 */
router.get(
  '/:piId/history',
  apiLimiter,
  authenticateApiKey,
  validateDeviceId,
  validateDeviceQuery,
  handleValidationErrors,
  deviceController.getDeviceHistory
);

/**
 * @route   GET /api/v1/alerts
 * @desc    Get all alerts
 * @access  Private (requires API key)
 */
router.get(
  '/alerts/all',
  apiLimiter,
  authenticateApiKey,
  deviceController.getAllAlerts
);

/**
 * @route   GET /api/v1/alerts/:piId
 * @desc    Get alerts for specific device
 * @access  Private (requires API key)
 */
router.get(
  '/alerts/:piId',
  apiLimiter,
  authenticateApiKey,
  validateDeviceId,
  handleValidationErrors,
  deviceController.getDeviceAlerts
);

/**
 * @route   PATCH /api/v1/alerts/:alertId
 * @desc    Resolve an alert
 * @access  Private (requires API key)
 */
router.patch(
  '/alerts/:alertId',
  apiLimiter,
  authenticateApiKey,
  deviceController.resolveAlert
);

module.exports = router;
