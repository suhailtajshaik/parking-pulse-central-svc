const express = require('express');
const cors = require('cors');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage (use a database in production)
const piStatuses = new Map();
const OFFLINE_TIMEOUT = 120000; // 2 minutes

// Receive status updates from Pis
app.post('/pi-status', (req, res) => {
  const data = req.body;
  
  // Store the status with current timestamp
  piStatuses.set(data.piId, {
    ...data,
    lastSeen: Date.now()
  });
  
  console.log(`Received update from ${data.piId}:`, {
    temp: data.temperature,
    camera: data.camera?.connected,
    status: data.status
  });
  
  res.json({ success: true });
});

// Get all Pi statuses
app.get('/pi-status', (req, res) => {
  const now = Date.now();
  const statuses = {};
  
  for (const [piId, status] of piStatuses.entries()) {
    // Check if Pi is offline based on last heartbeat
    const isOffline = (now - status.lastSeen) > OFFLINE_TIMEOUT;
    
    statuses[piId] = {
      ...status,
      status: isOffline ? 'offline' : status.status,
      isOnline: !isOffline,
      lastSeenAgo: Math.floor((now - status.lastSeen) / 1000) + 's'
    };
  }
  
  res.json(statuses);
});

// Get specific Pi status
app.get('/pi-status/:piId', (req, res) => {
  const status = piStatuses.get(req.params.piId);
  if (!status) {
    return res.status(404).json({ error: 'Pi not found' });
  }
  
  const now = Date.now();
  const isOffline = (now - status.lastSeen) > OFFLINE_TIMEOUT;
  
  res.json({
    ...status,
    status: isOffline ? 'offline' : status.status,
    isOnline: !isOffline,
    lastSeenAgo: Math.floor((now - status.lastSeen) / 1000) + 's'
  });
});

// Dashboard endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Pi Monitor</title></head>
    <body>
      <h1>Raspberry Pi Monitor</h1>
      <div id="status"></div>
      <script>
        async function updateStatus() {
          try {
            const response = await fetch('/pi-status');
            const data = await response.json();
            
            let html = '<table border="1"><tr><th>Pi ID</th><th>Status</th><th>Temperature</th><th>Camera</th><th>Last Seen</th></tr>';
            
            for (const [piId, status] of Object.entries(data)) {
              html += \`<tr>
                <td>\${piId}</td>
                <td style="color: \${status.isOnline ? 'green' : 'red'}">\${status.status}</td>
                <td>\${status.temperature ? status.temperature + '°C' : 'N/A'}</td>
                <td style="color: \${status.camera?.connected ? 'green' : 'red'}">\${status.camera?.connected ? 'Connected' : 'Disconnected'}</td>
                <td>\${status.lastSeenAgo}</td>
              </tr>\`;
            }
            
            html += '</table>';
            document.getElementById('status').innerHTML = html;
          } catch (error) {
            document.getElementById('status').innerHTML = 'Error loading status';
          }
        }
        
        updateStatus();
        setInterval(updateStatus, 5000);
      </script>
    </body>
    </html>
  `);
});

// Function to get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost'; // fallback
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const localIP = getLocalIP();
  console.log(`Pi monitoring server running on port ${PORT}`);
  console.log(`Access the server at: http://${localIP}:${PORT}`);
});
