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
 * @route   POST /api/v1/devices/status
 * @desc    Receive device status update from Raspberry Pi
 * @access  Private (requires API key)
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
