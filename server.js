const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const express = require('express');
const { PiStatus, Alert } = require('./models/simple');

// Load gRPC proto
const packageDefinition = protoLoader.loadSync('./proto/parking.proto');
const parking = grpc.loadPackageDefinition(packageDefinition).parking;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:parkingpulse123@localhost:27017/parking_pulse?authSource=admin')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// In-memory store for real-time data
const liveStatus = new Map();
const TEMP_THRESHOLD = 70;
const OFFLINE_TIMEOUT = 120000; // 2 minutes

// gRPC Service Implementation
const parkingService = {
  async reportStatus(call, callback) {
    const { piId, temperature, cameraOk, uptime } = call.request;
    const now = Date.now();
    
    console.log('📡 Received gRPC request:', call.request);
    
    // Validate required fields
    if (!piId) {
      console.error('❌ Missing piId in request');
      callback(new Error('piId is required'));
      return;
    }
    
    try {
      // Update live status
      liveStatus.set(piId, {
        piId: piId,
        temperature,
        cameraOk: cameraOk,
        isOnline: true,
        lastSeen: now,
        uptime
      });

      // Save to MongoDB
      await new PiStatus({
        piId: piId,
        temperature,
        cameraOk: cameraOk,
        lastSeen: new Date(now),
        uptime
      }).save();

      // Check alerts
      const alerts = [];
      
      // Temperature alert
      if (temperature > TEMP_THRESHOLD) {
        const alert = await new Alert({
          piId: piId,
          type: 'temperature',
          message: `High temp: ${temperature}°C`,
          severity: temperature > 80 ? 'critical' : 'high'
        }).save();
        alerts.push({
          type: alert.type,
          message: alert.message,
          severity: alert.severity,
          timestamp: alert.createdAt.getTime()
        });
      }

      // Camera alert
      if (!cameraOk) {
        const alert = await new Alert({
          piId: piId,
          type: 'camera',
          message: 'Camera disconnected',
          severity: 'high'
        }).save();
        alerts.push({
          type: alert.type,
          message: alert.message,
          severity: alert.severity,
          timestamp: alert.createdAt.getTime()
        });
      }

      console.log(`📡 ${piId}: ${temperature}°C, Camera: ${cameraOk ? '✅' : '❌'}`);
      
      callback(null, {
        success: true,
        message: 'Status received',
        alerts
      });
    } catch (error) {
      console.error('Error:', error);
      callback(error);
    }
  },

  async getStatus(call, callback) {
    const { pi_id } = call.request;
    const now = Date.now();
    
    try {
      const statuses = [];
      const targets = pi_id ? [pi_id] : Array.from(liveStatus.keys());
      
      for (const id of targets) {
        const status = liveStatus.get(id);
        if (status) {
          const isOnline = (now - status.lastSeen) <= OFFLINE_TIMEOUT;
          statuses.push({
            pi_id: id,
            temperature: status.temperature,
            camera_ok: status.cameraOk,
            is_online: isOnline,
            last_seen: status.lastSeen,
            uptime: status.uptime
          });
        }
      }
      
      callback(null, { statuses });
    } catch (error) {
      callback(error);
    }
  },

  streamStatus(call) {
    const { pi_id } = call.request;
    
    const sendUpdate = () => {
      const now = Date.now();
      const targets = pi_id ? [pi_id] : Array.from(liveStatus.keys());
      
      for (const id of targets) {
        const status = liveStatus.get(id);
        if (status) {
          const isOnline = (now - status.lastSeen) <= OFFLINE_TIMEOUT;
          call.write({
            pi_id: id,
            temperature: status.temperature,
            camera_ok: status.cameraOk,
            is_online: isOnline,
            last_seen: status.lastSeen,
            alerts: [] // Simplified - no real-time alerts in stream
          });
        }
      }
    };
    
    // Send initial update
    sendUpdate();
    
    // Send updates every 5 seconds
    const interval = setInterval(sendUpdate, 5000);
    
    call.on('cancelled', () => {
      clearInterval(interval);
    });
  }
};

// Start gRPC Server
const server = new grpc.Server();
server.addService(parking.ParkingService.service, parkingService);
server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error('❌ gRPC server error:', err);
    return;
  }
  console.log(`🚀 gRPC server running on port ${port}`);
  server.start();
});

// Simple HTTP dashboard
const app = express();

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

app.get('/', (req, res) => {
  const now = Date.now();
  let html = `
    <html>
    <head><title>Parking Pulse</title></head>
    <body style="font-family: Arial; margin: 20px;">
      <h1>🚗 Parking Pulse Monitor</h1>
      <table border="1" style="border-collapse: collapse;">
        <tr><th>Pi ID</th><th>Status</th><th>Temperature</th><th>Camera</th><th>Last Seen</th></tr>
  `;
  
  for (const [id, status] of liveStatus.entries()) {
    const isOnline = (now - status.lastSeen) <= OFFLINE_TIMEOUT;
    const lastSeenAgo = Math.floor((now - status.lastSeen) / 1000);
    
    // Format temperature with 2 decimal places and Fahrenheit conversion
    const tempC = status.temperature ? status.temperature.toFixed(2) : 'N/A';
    const tempF = status.temperature ? ((status.temperature * 9/5) + 32).toFixed(2) : 'N/A';
    const tempDisplay = status.temperature ? `${tempC}°C (${tempF}°F)` : 'N/A';
    
    html += `
      <tr>
        <td>${status.piId || id}</td>
        <td style="color: ${isOnline ? 'green' : 'red'}">${isOnline ? 'ONLINE' : 'OFFLINE'}</td>
        <td style="color: ${status.temperature > TEMP_THRESHOLD ? 'red' : 'green'}">${tempDisplay}</td>
        <td style="color: ${status.cameraOk ? 'green' : 'red'}">${status.cameraOk ? '✅' : '❌'}</td>
        <td>${lastSeenAgo}s ago</td>
      </tr>
    `;
  }
  
  html += `
      </table>
      <p><small>Auto-refresh: <script>setTimeout(() => location.reload(), 5000);</script></small></p>
    </body>
    </html>
  `;
  res.send(html);
});

app.listen(3000, () => {
  console.log('🌐 HTTP dashboard: http://localhost:3000');
});