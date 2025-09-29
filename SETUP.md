# 🚗 Parking Pulse System Setup Guide

## Overview
Simplified gRPC-based parking monitoring system with MongoDB historical data storage, basic alerts, and real-time dashboard for monitoring Blue Gate Pi and Pink Gate Pi devices.

## 🏗️ Architecture

```
┌─────────────────┐    gRPC (50051)  ┌─────────────────┐    MongoDB    ┌─────────────────┐
│   Blue Gate Pi  │────────────────► │  Central Server │ ────────────► │    Historical   │
└─────────────────┘                  │                 │               │      Data       │
                                     │   (Express.js)  │               └─────────────────┘
┌─────────────────┐    gRPC (50051)  │                 │    
│   Pink Gate Pi  │────────────────► │   + Alerts      │    Web UI     ┌─────────────────┐
└─────────────────┘                  │   + Dashboard   │ ────────────► │   Live Monitor  │
                                     └─────────────────┘               └─────────────────┘
```

## 🚀 Quick Start

### 1. Start Central Service

#### Production Mode (Docker - Recommended)
```bash
cd parking-pulse-central-svc

# Install dependencies
npm install

# Start MongoDB + Central Service
docker-compose up -d

# Check status
docker-compose ps

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f central-service
```

#### Development Mode (Local)
```bash
cd parking-pulse-central-svc

# Install dependencies
npm install

# Start MongoDB only (in Docker)
docker-compose up -d mongodb

# Start central service locally
node server.js

# Stop central service: Ctrl+C

# Stop MongoDB
docker-compose stop mongodb
```

### 2. Deploy Edge Services on Raspberry Pis

**For Blue Gate Pi:**
```bash
# Copy files to Pi
scp -r parking-pulse-pi-status-edge-svc/ pi@blue-gate-pi:~/parking-pulse-edge/

# SSH to Blue Gate Pi
ssh pi@blue-gate-pi

# Run deployment script
cd ~/parking-pulse-edge
./deploy.sh blue-gate-pi 192.168.1.112:50051

# Start service
sudo systemctl start parking-pulse
```

**For Pink Gate Pi:**
```bash
# Copy files to Pi
scp -r parking-pulse-pi-status-edge-svc/ pi@pink-gate-pi:~/parking-pulse-edge/

# SSH to Pink Gate Pi
ssh pi@pink-gate-pi

# Run deployment script
cd ~/parking-pulse-edge
./deploy.sh pink-gate-pi 192.168.1.112:50051

# Start service
sudo systemctl start parking-pulse
```

## 📊 Features

### ✅ Simplified Central Service
- **gRPC Server**: Efficient binary protocol on port 50051
- **MongoDB Integration**: Historical data storage with 7-day retention
- **Real-time Monitoring**: In-memory cache for instant status updates
- **Basic Alerts**: Temperature and camera failure detection
- **Simple Dashboard**: Live status display on port 3000
- **Health Check**: `/health` endpoint for monitoring
- **Docker Support**: Easy deployment with docker-compose

### ✅ Lightweight Edge Service
- **Environment Configuration**: Simple setup for each Pi
- **Hardware Monitoring**: CPU temperature and camera status
- **gRPC Communication**: Efficient binary data transmission
- **Systemd Integration**: Auto-start and restart capabilities
- **Mock Data Support**: Works on non-Pi systems for testing
- **Error Resilience**: Continues operation despite hardware failures

### ✅ Basic Alert System
- **Temperature Alerts**: Triggers when > 70°C
- **Camera Alerts**: Detects camera disconnection
- **Offline Detection**: 2-minute timeout detection
- **Simple Logging**: Console-based alert notifications

## 🔧 Configuration

### Central Service Environment Variables
```bash
# MongoDB (Docker handles this automatically)
MONGODB_URI=mongodb://admin:parkingpulse123@mongodb:27017/parking_pulse?authSource=admin

# Server (optional - defaults provided)
PORT=3000
NODE_ENV=production
```

### Edge Service Environment Variables
```bash
# Required
PI_ID=blue-gate-pi              # or pink-gate-pi
SERVER_URL=192.168.1.112:50051

# Optional
INTERVAL=30000                  # 30 seconds (default)
```

## 📡 API Endpoints

### HTTP Endpoints
- `GET /` - Simple dashboard with Pi status table
- `GET /health` - Service health check with MongoDB status

### gRPC Services
- `ReportStatus` - Receive status updates from Pis
- `GetStatus` - Query current Pi statuses  
- `StreamStatus` - Real-time status streaming

## 🐳 Server Management Commands

### Production (Docker)
```bash
# Start all services (MongoDB + Central Service)
docker-compose up -d

# Check service status
docker-compose ps

# View real-time logs
docker-compose logs -f central-service
docker-compose logs -f mongodb

# Restart specific service
docker-compose restart central-service
docker-compose restart mongodb

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Rebuild after code changes
docker-compose build central-service
docker-compose up -d central-service
```

### Development (Local + Docker MongoDB)
```bash
# Start MongoDB only
docker-compose up -d mongodb

# Start central service locally (in new terminal)
node server.js

# Stop central service
# Press Ctrl+C in the terminal running node server.js

# Stop MongoDB
docker-compose stop mongodb

# Alternative: Start with auto-restart (nodemon)
npm install -g nodemon
nodemon server.js
```

### Manual Development (No Docker)
```bash
# Requires local MongoDB installation
# Install MongoDB locally first

# Start MongoDB service (varies by OS)
# macOS: brew services start mongodb-community
# Ubuntu: sudo systemctl start mongod

# Set MongoDB URI for local connection
export MONGODB_URI="mongodb://localhost:27017/parking_pulse"

# Start central service
node server.js

# Stop: Ctrl+C
```

## 📈 Monitoring & Maintenance

### Service Management
```bash
# Central Service
docker-compose ps
docker-compose logs central-service

# Edge Services (on Pi)
sudo systemctl status parking-pulse
sudo journalctl -u parking-pulse -f
```

### Database Management
```bash
# Connect to MongoDB
docker exec -it parking-pulse-mongodb mongosh -u admin -p parkingpulse123

# View collections
use parking_pulse
show collections
db.pistatuses.find().limit(5)

# Check database size
db.stats()
```

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Check if MongoDB is running
   docker-compose ps mongodb
   
   # Restart MongoDB
   docker-compose restart mongodb
   ```

2. **Pi Not Reporting**
   ```bash
   # Check Pi service status
   sudo systemctl status parking-pulse
   
   # Check network connectivity
   ping 192.168.1.112
   
   # Test gRPC connection
   telnet 192.168.1.112 50051
   ```

3. **Health Check Failed**
   ```bash
   # Test health endpoint
   curl http://localhost:3000/health
   
   # Expected response
   {
     "status": "healthy",
     "mongodb": "connected",
     "uptime": 123.45,
     "activePis": 2
   }
   
   # Check service logs
   docker-compose logs central-service
   ```

4. **High Temperature Alerts**
   - Check Pi cooling (fans, heat sinks)
   - Verify temperature sensor: `vcgencmd measure_temp`
   - Temperature threshold is hardcoded at 70°C

5. **Camera Issues**
   - Enable camera: `sudo raspi-config`
   - Check camera connection: `vcgencmd get_camera`
   - Test camera: `rpicam-still -o test.jpg`

### Performance Optimization

1. **Database Indexing**
   - Automatic indexes on piId and timestamp fields
   - TTL index for 7-day data retention

2. **Memory Usage**
   - In-memory Map for real-time Pi status
   - MongoDB for historical data storage
   - Minimal memory footprint (~50MB)

3. **Network Optimization**
   - gRPC binary protocol (efficient)
   - 30-second reporting interval
   - Small payload size (~100 bytes per report)

## 🔐 Security Considerations

### Current Implementation
- No authentication (suitable for private networks)
- gRPC communication over TCP
- Basic input validation

### Production Recommendations
- Add API key authentication
- Implement rate limiting
- Use TLS for gRPC communication
- Network segmentation for Pi devices
- Regular security updates

## 📊 Data Retention

- **Real-time Data**: In-memory Map (lost on restart)
- **Historical Data**: 7 days in MongoDB (automatic cleanup)
- **Logs**: Docker container logs with automatic rotation

## 🎯 Next Steps

1. **Authentication**: Add API key or JWT authentication
2. **Email Notifications**: SMTP alerts for critical issues
3. **Historical Analytics**: Temperature trends and uptime reports
4. **Camera Streaming**: Live video feeds from Pi cameras
5. **Multi-location**: Scale to multiple parking facilities

## 📞 Support

For issues:
1. Check logs first
2. Verify network connectivity
3. Test individual components
4. Review configuration files
5. Check system resources (CPU, memory, disk)

### Health Check Commands
```bash
# Central service health
curl http://localhost:3000/health

# Check gRPC connectivity
telnet localhost 50051

# MongoDB health
docker exec parking-pulse-mongodb mongosh --eval "db.adminCommand('ping')"

# Pi service health (on Pi)
sudo systemctl status parking-pulse
```
