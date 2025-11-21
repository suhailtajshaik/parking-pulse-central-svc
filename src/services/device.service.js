const PiStatus = require('../models/PiStatus');
const Alert = require('../models/Alert');
const config = require('../config');
const logger = require('../utils/logger');
const { AppError } = require('../utils/error-codes');

class DeviceService {
  /**
   * Process and store device status update
   */
  async processDeviceStatus(statusData) {
    try {
      const now = Date.now();

      // Log received data
      logger.info('Received device status', {
        piId: statusData.piId,
        temperatureC: statusData.temperatureC,
        temperatureF: statusData.temperatureF,
        cameraOk: statusData.cameraOk,
      });

      // Save to MongoDB
      const piStatus = await new PiStatus({
        piId: statusData.piId,
        temperatureC: statusData.temperatureC,
        temperatureF: statusData.temperatureF,
        cameraOk: statusData.cameraOk,
        systemOnline: statusData.systemOnline !== undefined ? statusData.systemOnline : true,
        lastSeen: new Date(now),
        uptime: statusData.uptime,
        deviceTimestamp: statusData.timestamp,
      }).save();

      // Check for alerts with deduplication
      const alerts = await this.checkAlerts(statusData);

      return {
        status: piStatus,
        alerts,
      };
    } catch (error) {
      logger.error('Error processing device status:', error);
      throw new AppError('DATABASE_ERROR', 'Failed to process device status');
    }
  }

  /**
   * Check for alert conditions with deduplication
   */
  async checkAlerts(statusData) {
    const alerts = [];

    try {
      // Temperature alert
      if (statusData.temperatureC > config.alerts.temperatureThresholdC) {
        const severity = statusData.temperatureC > config.alerts.temperatureCriticalC ? 'critical' : 'high';

        // Check if similar alert exists recently (deduplication)
        const existingAlert = await Alert.findRecentSimilar(
          statusData.piId,
          'temperature',
          config.alerts.deduplicationWindowMs
        );

        if (!existingAlert) {
          const alert = await new Alert({
            piId: statusData.piId,
            type: 'temperature',
            message: `High temperature detected: ${statusData.temperatureC}°C`,
            severity,
            metadata: {
              temperatureC: statusData.temperatureC,
              temperatureF: statusData.temperatureF,
            },
          }).save();

          alerts.push({
            message: alert.message,
            severity: alert.severity,
          });

          logger.warn('Temperature alert created', {
            piId: statusData.piId,
            temperature: statusData.temperatureC,
            severity,
          });
        } else {
          logger.debug('Temperature alert deduplicated', {
            piId: statusData.piId,
            existingAlertId: existingAlert._id,
          });
        }
      }

      // Camera failure alert
      if (!statusData.cameraOk) {
        const existingAlert = await Alert.findRecentSimilar(
          statusData.piId,
          'camera',
          config.alerts.deduplicationWindowMs
        );

        if (!existingAlert) {
          const alert = await new Alert({
            piId: statusData.piId,
            type: 'camera',
            message: 'Camera is not responding',
            severity: 'high',
          }).save();

          alerts.push({
            message: alert.message,
            severity: alert.severity,
          });

          logger.warn('Camera alert created', {
            piId: statusData.piId,
          });
        } else {
          logger.debug('Camera alert deduplicated', {
            piId: statusData.piId,
            existingAlertId: existingAlert._id,
          });
        }
      }

      return alerts;
    } catch (error) {
      logger.error('Error checking alerts:', error);
      // Don't throw error - alerts are not critical for device status update
      return [];
    }
  }

  /**
   * Get all devices with latest status
   */
  async getAllDevices(options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      // Get unique device IDs with their latest status
      const devices = await PiStatus.aggregate([
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: '$piId',
            latestStatus: { $first: '$$ROOT' }
          }
        },
        {
          $skip: offset
        },
        {
          $limit: limit
        },
        {
          $replaceRoot: { newRoot: '$latestStatus' }
        }
      ]);

      const now = Date.now();
      const deviceStatuses = devices.map(device => ({
        piId: device.piId,
        temperatureC: device.temperatureC,
        temperatureF: device.temperatureF,
        cameraOk: device.cameraOk,
        systemOnline: device.systemOnline,
        isOnline: (now - device.lastSeen.getTime()) <= config.device.offlineTimeoutMs,
        lastSeen: device.lastSeen,
        uptime: device.uptime,
        deviceTimestamp: device.deviceTimestamp,
      }));

      return deviceStatuses;
    } catch (error) {
      logger.error('Error getting all devices:', error);
      throw new AppError('DATABASE_ERROR', 'Failed to retrieve devices');
    }
  }

  /**
   * Get specific device status
   */
  async getDeviceStatus(piId) {
    try {
      const device = await PiStatus.findOne({ piId })
        .sort({ createdAt: -1 })
        .lean();

      if (!device) {
        throw new AppError('DEVICE_NOT_FOUND', `Device ${piId} not found`);
      }

      const now = Date.now();
      return {
        piId: device.piId,
        temperatureC: device.temperatureC,
        temperatureF: device.temperatureF,
        cameraOk: device.cameraOk,
        systemOnline: device.systemOnline,
        isOnline: (now - device.lastSeen.getTime()) <= config.device.offlineTimeoutMs,
        lastSeen: device.lastSeen,
        uptime: device.uptime,
        deviceTimestamp: device.deviceTimestamp,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error getting device status:', error);
      throw new AppError('DATABASE_ERROR', 'Failed to retrieve device status');
    }
  }

  /**
   * Get device status history
   */
  async getDeviceHistory(piId, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      const history = await PiStatus.find({ piId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      if (history.length === 0) {
        throw new AppError('DEVICE_NOT_FOUND', `No history found for device ${piId}`);
      }

      return history;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error getting device history:', error);
      throw new AppError('DATABASE_ERROR', 'Failed to retrieve device history');
    }
  }

  /**
   * Get alerts for a device
   */
  async getDeviceAlerts(piId, resolved = false) {
    try {
      const alerts = await Alert.find({ piId, resolved })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      return alerts;
    } catch (error) {
      logger.error('Error getting device alerts:', error);
      throw new AppError('DATABASE_ERROR', 'Failed to retrieve alerts');
    }
  }

  /**
   * Get all alerts
   */
  async getAllAlerts(resolved = false, limit = 100) {
    try {
      const alerts = await Alert.find({ resolved })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return alerts;
    } catch (error) {
      logger.error('Error getting all alerts:', error);
      throw new AppError('DATABASE_ERROR', 'Failed to retrieve alerts');
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId) {
    try {
      const alert = await Alert.findById(alertId);

      if (!alert) {
        throw new AppError('RESOURCE_NOT_FOUND', 'Alert not found');
      }

      await alert.resolveAlert();
      logger.info('Alert resolved', { alertId });

      return alert;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error resolving alert:', error);
      throw new AppError('DATABASE_ERROR', 'Failed to resolve alert');
    }
  }
}

module.exports = new DeviceService();
