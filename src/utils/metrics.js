const client = require('prom-client');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'parking-pulse-central-svc'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeDevicesGauge = new client.Gauge({
  name: 'parking_pulse_active_devices',
  help: 'Number of currently active parking pulse devices'
});

const deviceStatusUpdates = new client.Counter({
  name: 'parking_pulse_status_updates_total',
  help: 'Total number of device status updates received',
  labelNames: ['pi_id']
});

const alertsGenerated = new client.Counter({
  name: 'parking_pulse_alerts_total',
  help: 'Total number of alerts generated',
  labelNames: ['type', 'severity']
});

const temperatureGauge = new client.Gauge({
  name: 'parking_pulse_device_temperature_celsius',
  help: 'Current temperature of parking pulse devices in Celsius',
  labelNames: ['pi_id']
});

const databaseOperations = new client.Histogram({
  name: 'database_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
});

// Register all custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeDevicesGauge);
register.registerMetric(deviceStatusUpdates);
register.registerMetric(alertsGenerated);
register.registerMetric(temperatureGauge);
register.registerMetric(databaseOperations);

// Middleware to track HTTP metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
  });

  next();
};

module.exports = {
  register,
  metrics: {
    httpRequestDuration,
    httpRequestTotal,
    activeDevicesGauge,
    deviceStatusUpdates,
    alertsGenerated,
    temperatureGauge,
    databaseOperations
  },
  metricsMiddleware
};
