# Parking Pulse Central Service

A Node.js/Express.js central monitoring server that collects and displays real-time status data from multiple Raspberry Pi edge devices. Features a built-in web dashboard for monitoring Pi health, temperature, and camera status.

## Overview

This central service acts as a data aggregation hub for distributed Raspberry Pi monitoring systems. It receives periodic status updates from edge devices and provides both API endpoints and a web interface for monitoring system health.

## Features

- 📊 **Real-time Dashboard**: Web-based interface with auto-refreshing status
- 🔌 **REST API**: RESTful endpoints for Pi status management
- 🕐 **Offline Detection**: Automatic detection of unresponsive devices
- 💾 **In-Memory Storage**: Fast data access with Map-based storage
- 🌐 **CORS Support**: Cross-origin resource sharing enabled
- 📱 **Responsive UI**: Clean, table-based status display
- 🔄 **Auto-refresh**: Dashboard updates every 5 seconds

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager
- Network connectivity to receive Pi status updates

## Installation

1. **Clone or download the project**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   node server.js
   ```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)

### Timeout Settings

```javascript
const OFFLINE_TIMEOUT = 30000; // 30 seconds (configurable in server.js)
```

## Usage

### Starting the Server

```bash
node server.js
```

Output:
```
Pi monitoring server running on port 3000
Access the server at: http://192.168.1.112:3000
```

### Accessing the Dashboard

Open your web browser and navigate to:
- `http://localhost:3000` (local access)
- `http://[server-ip]:3000` (network access)

## API Endpoints

### POST /pi-status
Receive status updates from Pi devices.

**Request Body:**
```json
{
  "piId": "pi-kitchen",
  "timestamp": "2025-09-28T10:30:00.000Z",
  "temperature": 45.2,
  "temperatureF": 113.36,
  "camera": {
    "connected": true,
    "detected": true,
    "functional": true
  },
  "status": "online",
  "uptime": 86400
}
```

**Response:**
```json
{
  "success": true
}
```

### GET /pi-status
Get status of all registered Pi devices.

**Response:**
```json
{
  "pi-kitchen": {
    "piId": "pi-kitchen",
    "timestamp": "2025-09-28T10:30:00.000Z",
    "temperature": 45.2,
    "temperatureF": 113.36,
    "camera": {
      "connected": true,
      "detected": true,
      "functional": true
    },
    "status": "online",
    "uptime": 86400,
    "lastSeen": 1727518200000,
    "isOnline": true,
    "lastSeenAgo": "30s"
  }
}
```

### GET /pi-status/:piId
Get status of a specific Pi device.

**Parameters:**
- `piId`: Unique identifier of the Pi device

**Response:**
```json
{
  "piId": "pi-kitchen",
  "status": "online",
  "isOnline": true,
  "lastSeenAgo": "45s",
  "temperature": 45.2,
  "camera": {
    "connected": true
  }
}
```

**Error Response (404):**
```json
{
  "error": "Pi not found"
}
```

### GET /
Access the web dashboard (HTML interface).

## Dashboard Features

The built-in web dashboard provides:

- **Real-time Status Table**: Shows all Pi devices with current status
- **Color-coded Indicators**: 
  - Green: Online/Connected
  - Red: Offline/Disconnected
- **Automatic Updates**: Refreshes every 5 seconds
- **Status Information**:
  - Pi ID
  - Online/Offline status
  - CPU temperature
  - Camera connectivity
  - Last seen timestamp

## Data Storage

The service uses in-memory storage with JavaScript Map for fast access:

```javascript
const piStatuses = new Map();
```

**Note**: Data is lost when the server restarts. For production use, consider implementing persistent storage (database).

## Offline Detection

Devices are marked as offline if they haven't sent updates within the configured timeout period:

- **Default Timeout**: 30 seconds (30,000ms)
- **Status Check**: Performed on each API request
- **Automatic Recovery**: Devices automatically come back online when they resume sending updates

**Note**: The 30-second timeout matches the default heartbeat interval from Pi devices, providing quick offline detection while allowing for minor network delays.

## Network Configuration

The server automatically detects and displays the local IP address for easy access from other devices on the network.

### Firewall Configuration

Ensure port 3000 (or your configured port) is open:

```bash
# Ubuntu/Debian
sudo ufw allow 3000

# CentOS/RHEL
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

## Monitoring Multiple Pi Devices

The service can handle multiple Pi devices simultaneously. Each device should:

1. Have a unique `piId`
2. Send regular status updates to `/pi-status`
3. Include all required fields in the status payload

## Performance Considerations

- **Memory Usage**: Scales with number of Pi devices
- **CPU Usage**: Minimal during normal operation
- **Concurrent Connections**: Express.js handles multiple simultaneous requests
- **Data Retention**: Only latest status per device is stored

## Security Considerations

- **CORS Enabled**: Allows cross-origin requests
- **No Authentication**: Consider adding authentication for production
- **Input Validation**: Basic JSON parsing (consider adding validation middleware)
- **Rate Limiting**: Not implemented (consider adding for production)

## Production Deployment

### Recommended Enhancements

1. **Database Integration**: Replace in-memory storage
2. **Authentication**: Add API key or JWT authentication
3. **Logging**: Implement structured logging
4. **Process Management**: Use PM2 or similar
5. **Reverse Proxy**: Use Nginx for SSL termination
6. **Monitoring**: Add health check endpoints

### PM2 Deployment

```bash
npm install -g pm2
pm2 start server.js --name "parking-pulse-central"
pm2 startup
pm2 save
```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. **Pi Devices Not Appearing**
   - Verify Pi devices are sending to correct URL
   - Check network connectivity
   - Verify server is running and accessible

3. **Dashboard Not Loading**
   - Check browser console for errors
   - Verify server is running
   - Check firewall settings

### Logs

Monitor server logs for status updates:
```bash
node server.js
# Output:
# Pi monitoring server running on port 3000
# Access the server at: http://192.168.1.112:3000
# Received update from pi-kitchen: { temp: 45.2, camera: true, status: 'online' }
```

## Dependencies

- **express**: Web framework for Node.js
- **cors**: Cross-Origin Resource Sharing middleware
- **os**: Node.js built-in module for system information

## API Client Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Send status update
await axios.post('http://server:3000/pi-status', {
  piId: 'my-pi',
  status: 'online',
  temperature: 42.5
});

// Get all statuses
const response = await axios.get('http://server:3000/pi-status');
console.log(response.data);
```

### Python
```python
import requests

# Send status update
requests.post('http://server:3000/pi-status', json={
    'piId': 'my-pi',
    'status': 'online',
    'temperature': 42.5
})

# Get all statuses
response = requests.get('http://server:3000/pi-status')
print(response.json())
```

### curl
```bash
# Send status update
curl -X POST http://server:3000/pi-status \
  -H "Content-Type: application/json" \
  -d '{"piId":"my-pi","status":"online","temperature":42.5}'

# Get all statuses
curl http://server:3000/pi-status
```

## License

ISC License

## Support

For technical support:
- Check server logs for error messages
- Verify network connectivity between Pi devices and central server
- Ensure all required dependencies are installed
- Review firewall and port configuration
