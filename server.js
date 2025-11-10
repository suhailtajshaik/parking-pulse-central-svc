const mongoose = require('mongoose');
const express = require('express');
const { PiStatus, Alert } = require('./models/simple');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:parkingpulse123@localhost:27017/parking_pulse?authSource=admin')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// In-memory store for real-time data
const liveStatus = new Map();
const TEMP_THRESHOLD = 70;
const OFFLINE_TIMEOUT = 120000; // 2 minutes

// Helper function to process device status
function processDeviceStatus(data) {
  console.log(`📊 Received status from ${data.piId}:`);
  console.log(`   Temperature: ${data.temperatureC}°C (${data.temperatureF}°F)`);
  console.log(`   Camera: ${data.cameraOk ? 'OK' : 'Failed'}`);
  console.log(`   Uptime: ${data.uptime}s`);
  console.log(`   Timestamp: ${new Date(data.timestamp).toISOString()}`);
}

// Helper function to check for alerts
async function checkAlerts(data) {
  const alerts = [];

  // High temperature alert
  if (data.temperatureC > TEMP_THRESHOLD) {
    const alert = await new Alert({
      piId: data.piId,
      type: 'temperature',
      message: `High temp: ${data.temperatureC}°C`,
      severity: data.temperatureC > 80 ? 'critical' : 'high'
    }).save();

    alerts.push({
      message: alert.message,
      severity: alert.severity
    });
  }

  // Camera failure alert
  if (!data.cameraOk) {
    const alert = await new Alert({
      piId: data.piId,
      type: 'camera',
      message: 'Camera is not responding',
      severity: 'high'
    }).save();

    alerts.push({
      message: alert.message,
      severity: alert.severity
    });
  }

  return alerts;
}

// Express HTTP Server
const app = express();

// Middleware
app.use(express.json());

// CORS headers (if needed for web dashboard)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Health check endpoint (used by Pi devices on startup)
app.head('/', (req, res) => {
  res.sendStatus(200);
});

// Main endpoint to receive device status from Raspberry Pi
app.post('/pi-status', async (req, res) => {
  const data = req.body;

  // Validate required fields
  if (!data.piId) {
    return res.status(400).json({
      success: false,
      message: 'Missing piId'
    });
  }

  try {
    const now = Date.now();

    // Process the data
    processDeviceStatus(data);

    // Update live status
    liveStatus.set(data.piId, {
      piId: data.piId,
      temperatureC: data.temperatureC,
      temperatureF: data.temperatureF,
      cameraOk: data.cameraOk,
      systemOnline: data.systemOnline,
      isOnline: true,
      lastSeen: now,
      uptime: data.uptime,
      deviceTimestamp: data.timestamp
    });

    // Save to MongoDB
    await new PiStatus({
      piId: data.piId,
      temperatureC: data.temperatureC,
      temperatureF: data.temperatureF,
      cameraOk: data.cameraOk,
      systemOnline: data.systemOnline,
      lastSeen: new Date(now),
      uptime: data.uptime,
      deviceTimestamp: data.timestamp
    }).save();

    // Check for alerts
    const alerts = await checkAlerts(data);

    // Send response
    res.json({
      success: true,
      message: 'Status received',
      alerts: alerts.length > 0 ? alerts : undefined
    });

  } catch (error) {
    console.error('Error processing device status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get status endpoint (for dashboard and API consumers)
app.get('/status', async (req, res) => {
  const { piId } = req.query;
  const now = Date.now();

  try {
    const statuses = [];
    const targets = piId ? [piId] : Array.from(liveStatus.keys());

    for (const id of targets) {
      const status = liveStatus.get(id);
      if (status) {
        const isOnline = (now - status.lastSeen) <= OFFLINE_TIMEOUT;
        statuses.push({
          piId: id,
          temperatureC: status.temperatureC,
          temperatureF: status.temperatureF,
          cameraOk: status.cameraOk,
          systemOnline: status.systemOnline,
          isOnline: isOnline,
          lastSeen: status.lastSeen,
          uptime: status.uptime,
          deviceTimestamp: status.deviceTimestamp
        });
      }
    }

    res.json({ statuses });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    activePis: liveStatus.size
  };
  res.json(health);
});

// Dashboard endpoint
app.get('/', (req, res) => {
  const now = Date.now();
  let html = `
    <html>
    <head>
      <title>Parking Pulse</title>
      <meta http-equiv="refresh" content="5">
    </head>
    <body style="font-family: Arial; margin: 20px;">
      <h1>🚗 Parking Pulse Monitor</h1>
      <p>Server Type: <strong>HTTP/REST</strong> | Active Devices: <strong>${liveStatus.size}</strong></p>
      <table border="1" style="border-collapse: collapse;">
        <tr>
          <th>Pi ID</th>
          <th>Status</th>
          <th>Temperature</th>
          <th>Camera</th>
          <th>Uptime</th>
          <th>Last Seen</th>
        </tr>
  `;

  for (const [id, status] of liveStatus.entries()) {
    const isOnline = (now - status.lastSeen) <= OFFLINE_TIMEOUT;
    const lastSeenAgo = Math.floor((now - status.lastSeen) / 1000);

    const tempC = status.temperatureC ? status.temperatureC.toFixed(2) : 'N/A';
    const tempF = status.temperatureF ? status.temperatureF.toFixed(2) : 'N/A';
    const tempDisplay = status.temperatureC ? `${tempC}°C (${tempF}°F)` : 'N/A';

    const uptimeHours = status.uptime ? Math.floor(status.uptime / 3600) : 0;
    const uptimeMinutes = status.uptime ? Math.floor((status.uptime % 3600) / 60) : 0;
    const uptimeDisplay = `${uptimeHours}h ${uptimeMinutes}m`;

    html += `
      <tr>
        <td>${status.piId || id}</td>
        <td style="color: ${isOnline ? 'green' : 'red'}">${isOnline ? '✅ ONLINE' : '❌ OFFLINE'}</td>
        <td style="color: ${status.temperatureC > TEMP_THRESHOLD ? 'red' : 'green'}">${tempDisplay}</td>
        <td style="color: ${status.cameraOk ? 'green' : 'red'}">${status.cameraOk ? '✅' : '❌'}</td>
        <td>${uptimeDisplay}</td>
        <td>${lastSeenAgo}s ago</td>
      </tr>
    `;
  }

  html += `
      </table>
      <p><small>Auto-refresh every 5 seconds</small></p>
    </body>
    </html>
  `;
  res.send(html);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 HTTP Server running on port ${PORT}`);
  console.log(`📡 Receiving data at: POST http://0.0.0.0:${PORT}/pi-status`);
  console.log(`🌐 Dashboard: http://0.0.0.0:${PORT}/`);
  console.log(`❤️  Health check: http://0.0.0.0:${PORT}/health`);
});
