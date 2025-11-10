const deviceService = require('../services/device.service');
const logger = require('../utils/logger');

class DeviceController {
  /**
   * POST /api/v1/devices/status
   * Receive device status update from Raspberry Pi
   */
  async submitDeviceStatus(req, res, next) {
    try {
      const result = await deviceService.processDeviceStatus(req.body);

      res.status(200).json({
        success: true,
        message: 'Status received',
        data: {
          piId: result.status.piId,
          lastSeen: result.status.lastSeen,
        },
        alerts: result.alerts.length > 0 ? result.alerts : undefined,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/devices
   * Get all devices with their latest status
   */
  async getAllDevices(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const devices = await deviceService.getAllDevices({
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: {
          devices,
          count: devices.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/devices/:piId
   * Get specific device status
   */
  async getDeviceStatus(req, res, next) {
    try {
      const { piId } = req.params;
      const device = await deviceService.getDeviceStatus(piId);

      res.status(200).json({
        success: true,
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/devices/:piId/history
   * Get device status history
   */
  async getDeviceHistory(req, res, next) {
    try {
      const { piId } = req.params;
      const { limit, offset } = req.query;

      const history = await deviceService.getDeviceHistory(piId, {
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: {
          piId,
          history,
          count: history.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/alerts
   * Get all alerts
   */
  async getAllAlerts(req, res, next) {
    try {
      const resolved = req.query.resolved === 'true';
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;

      const alerts = await deviceService.getAllAlerts(resolved, limit);

      res.status(200).json({
        success: true,
        data: {
          alerts,
          count: alerts.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/alerts/:piId
   * Get alerts for specific device
   */
  async getDeviceAlerts(req, res, next) {
    try {
      const { piId } = req.params;
      const resolved = req.query.resolved === 'true';

      const alerts = await deviceService.getDeviceAlerts(piId, resolved);

      res.status(200).json({
        success: true,
        data: {
          piId,
          alerts,
          count: alerts.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/alerts/:alertId
   * Resolve an alert
   */
  async resolveAlert(req, res, next) {
    try {
      const { alertId } = req.params;
      const alert = await deviceService.resolveAlert(alertId);

      res.status(200).json({
        success: true,
        message: 'Alert resolved',
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DeviceController();
