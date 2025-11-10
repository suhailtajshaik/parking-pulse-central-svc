# 🚗 Parking Pulse System - Complete Setup Guide

## Overview
Production-ready HTTP/REST-based parking monitoring system with MongoDB storage, comprehensive alerting, Prometheus monitoring, and interactive API documentation. Designed for monitoring Blue Gate Pi and Pink Gate Pi devices with enterprise-grade security and observability.

## 🏗️ Architecture

```
┌─────────────────┐                  ┌─────────────────────────────────────┐
│   Blue Gate Pi  │  HTTP/REST       │       Central Server                │
│                 │──────────────────►│                                     │
│ • Camera        │  :3000/api/v1    │  ┌──────────────────────────────┐   │
│ • Temp Sensor   │                  │  │     Express.js App           │   │
└─────────────────┘                  │  │  • MVC Architecture          │   │
                                     │  │  • API Key Auth              │   │
┌─────────────────┐                  │  │  • Rate Limiting             │   │
│   Pink Gate Pi  │  HTTP/REST       │  │  • Input Validation          │   │
│                 │──────────────────►│  └──────────────────────────────┘   │
│ • Camera        │  :3000/api/v1    │              │                      │
│ • Temp Sensor   │                  │              ▼                      │
└─────────────────┘                  │  ┌──────────────────────────────┐   │
                                     │  │      MongoDB Database         │   │
                                     │  │  • Historical Data (7 days)  │   │
                                     │  │  • Alerts & Status           │   │
                                     │  └──────────────────────────────┘   │
                                     └─────────────────────────────────────┘
                                                      │
                                                      ▼
                                     ┌─────────────────────────────────────┐
                                     │         Public Endpoints            │
                                     │  • /api-docs (Swagger UI)           │
                                     │  • /metrics (Prometheus)            │
                                     │  • /health (Health Checks)          │
                                     └─────────────────────────────────────┘
```

## 📋 Prerequisites

### Required Software
- **Node.js**: v18.x or higher (LTS recommended)
- **npm**: v9.x or higher
- **Docker**: v20.x or higher
- **Docker Compose**: v2.x or higher
- **MongoDB**: v7.0 (via Docker)

### Optional Tools
- **Git**: For version control
- **curl**: For API testing
- **Postman**: For API exploration
- **Prometheus**: For metrics collection
- **Grafana**: For metrics visualization

## 🚀 Quick Start

### Step 1: Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd parking-pulse-central-svc

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Step 2: Configure Environment

Edit `.env` file with your settings:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb://admin:parkingpulse123@mongodb:27017/parking_pulse?authSource=admin
MONGODB_POOL_SIZE=10

# Security - IMPORTANT: Change these in production!
API_KEYS=secure-key-1,secure-key-2,secure-key-3
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000           # 1 minute window
RATE_LIMIT_MAX_REQUESTS=100          # 100 requests per window

# Alert Thresholds
ALERT_TEMP_THRESHOLD_C=70            # Warning threshold
ALERT_TEMP_CRITICAL_C=80             # Critical threshold
ALERT_DEDUP_WINDOW_MS=300000         # 5 minutes dedup window
DEVICE_OFFLINE_TIMEOUT_MS=120000     # 2 minutes offline detection

# Logging
LOG_LEVEL=info                       # debug | info | warn | error
LOG_FORMAT=json                      # json | simple
```

### Step 3: Start Services

#### Production Mode (Docker - Recommended)

```bash
# Start all services (MongoDB + Central Service)
docker-compose up -d

# Verify services are running
docker-compose ps

# Expected output:
# NAME                    STATUS         PORTS
# parking-pulse-mongodb   Up (healthy)   27017/tcp
# parking-pulse-central   Up (healthy)   0.0.0.0:3000->3000/tcp

# View logs
docker-compose logs -f central-service

# Test the service
curl http://localhost:3000/health
```

#### Development Mode (Local)

```bash
# Start MongoDB only
docker-compose up -d mongodb

# Wait for MongoDB to be healthy
docker-compose ps mongodb

# Start the application in development mode
npm run dev

# Or start with node directly
node src/server.js
```

### Step 4: Verify Installation

```bash
# 1. Test health endpoint
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}

# 2. Test API documentation
open http://localhost:3000/api-docs

# 3. Test metrics endpoint
curl http://localhost:3000/metrics
# Expected: Prometheus metrics output

# 4. Test API with authentication
curl -H "X-API-Key: your-api-key" \
     http://localhost:3000/api/v1/devices
```

## 📡 API Endpoints Reference

### Public Endpoints (No Authentication)

#### Health Checks
```bash
# Basic health check
GET /health

# Kubernetes liveness probe
GET /health/live

# Kubernetes readiness probe
GET /health/ready

# Detailed health information
GET /health/detailed
```

#### Documentation & Monitoring
```bash
# Interactive API documentation (Swagger UI)
GET /api-docs

# Prometheus metrics
GET /metrics
```

### Protected Endpoints (Require API Key)

All protected endpoints require the `X-API-Key` header:

#### Device Status
```bash
# Submit device status update
POST /api/v1/devices/status
Content-Type: application/json
X-API-Key: your-api-key

{
  "piId": "blue-gate-pi",
  "temperatureC": 45.5,
  "temperatureF": 113.9,
  "cameraOk": true,
  "systemOnline": true,
  "deviceTimestamp": "2024-01-10T12:00:00Z"
}

# Get all devices (with pagination)
GET /api/v1/devices?page=1&limit=20&sortBy=updatedAt&sortOrder=desc
X-API-Key: your-api-key

# Get specific device status
GET /api/v1/devices/blue-gate-pi
X-API-Key: your-api-key

# Get device history
GET /api/v1/devices/blue-gate-pi/history?page=1&limit=50
X-API-Key: your-api-key
```

#### Alerts
```bash
# Get all alerts
GET /api/v1/devices/alerts/all?resolved=false
X-API-Key: your-api-key

# Get device-specific alerts
GET /api/v1/devices/alerts/blue-gate-pi
X-API-Key: your-api-key

# Resolve an alert
PATCH /api/v1/devices/alerts/:alertId
X-API-Key: your-api-key
```

## 🔧 Configuration Details

### Environment Variables Explained

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Environment mode | `development` | `production`, `development`, `test` |
| `PORT` | Server port | `3000` | `3000`, `8080` |
| `MONGODB_URI` | MongoDB connection string | - | `mongodb://user:pass@host:27017/db` |
| `MONGODB_POOL_SIZE` | Connection pool size | `10` | `5`, `10`, `20` |
| `API_KEYS` | Comma-separated API keys | - | `key1,key2,key3` |
| `CORS_ORIGINS` | Allowed CORS origins | `*` | `http://localhost:3000,https://domain.com` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `60000` | `60000` (1 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | `50`, `100`, `200` |
| `ALERT_TEMP_THRESHOLD_C` | Warning temp (°C) | `70` | `65`, `70`, `75` |
| `ALERT_TEMP_CRITICAL_C` | Critical temp (°C) | `80` | `75`, `80`, `85` |
| `ALERT_DEDUP_WINDOW_MS` | Alert dedup window (ms) | `300000` | `300000` (5 min) |
| `DEVICE_OFFLINE_TIMEOUT_MS` | Offline detection (ms) | `120000` | `120000` (2 min) |
| `LOG_LEVEL` | Logging level | `info` | `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | Log format | `json` | `json`, `simple` |

### Security Configuration

#### API Keys
1. Generate secure API keys:
```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

2. Add to `.env`:
```bash
API_KEYS=key1,key2,key3
```

3. Distribute keys to authorized clients

#### CORS Configuration
```bash
# Allow specific origins
CORS_ORIGINS=http://localhost:3000,https://yourapp.com

# Development: allow all (not recommended for production)
CORS_ORIGINS=*
```

## 🐳 Docker Deployment

### Docker Compose Configuration

The `docker-compose.yml` includes:

#### MongoDB Service
- Image: `mongo:7.0`
- Port: `27017`
- Health check: Automatic with mongosh
- Volumes: Persistent data storage
- Auto-restart: Unless stopped

#### Central Service
- Multi-stage build for optimal image size
- Non-root user for security
- Health checks for orchestration
- Environment variables from docker-compose
- Depends on MongoDB health
- Auto-restart: Unless stopped

### Docker Commands Reference

```bash
# Start services
docker-compose up -d

# Start with rebuild
docker-compose up -d --build

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f central-service
docker-compose logs -f mongodb

# Check service status and health
docker-compose ps

# Restart specific service
docker-compose restart central-service

# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (⚠️ deletes data)
docker-compose down -v

# View resource usage
docker stats parking-pulse-central parking-pulse-mongodb

# Execute command in container
docker exec -it parking-pulse-central sh
docker exec -it parking-pulse-mongodb mongosh -u admin -p parkingpulse123
```

### Dockerfile Breakdown

```dockerfile
# Stage 1: Builder
FROM node:18-alpine AS builder
- Installs all dependencies including devDependencies
- Prepares application for production

# Stage 2: Production
FROM node:18-alpine AS production
- Installs only production dependencies
- Creates non-root user (nodejs:1001)
- Uses dumb-init for signal handling
- Adds health check
- Final image is optimized and secure
```

## 🗄️ Database Management

### MongoDB Access

```bash
# Connect to MongoDB shell
docker exec -it parking-pulse-mongodb mongosh -u admin -p parkingpulse123

# Switch to application database
use parking_pulse

# View collections
show collections
# Output: pistatuses, alerts
```

### Common Database Queries

```javascript
// Get recent device statuses
db.pistatuses.find().sort({createdAt: -1}).limit(10)

// Get active alerts
db.alerts.find({resolved: false})

// Get temperature alerts for specific device
db.alerts.find({
  piId: "blue-gate-pi",
  type: "temperature",
  resolved: false
})

// Count devices by status
db.pistatuses.aggregate([
  {$group: {_id: "$piId", count: {$sum: 1}}}
])

// Get average temperature by device
db.pistatuses.aggregate([
  {$group: {
    _id: "$piId",
    avgTemp: {$avg: "$temperatureC"}
  }}
])

// Find high temperature readings
db.pistatuses.find({
  temperatureC: {$gt: 70}
}).sort({temperatureC: -1})

// Get database statistics
db.stats()

// Check indexes
db.pistatuses.getIndexes()
db.alerts.getIndexes()
```

### Database Backup & Restore

```bash
# Backup database
docker exec parking-pulse-mongodb mongodump \
  -u admin -p parkingpulse123 \
  --authenticationDatabase admin \
  --db parking_pulse \
  --out /dump

# Copy backup to host
docker cp parking-pulse-mongodb:/dump ./backup

# Restore database
docker exec parking-pulse-mongodb mongorestore \
  -u admin -p parkingpulse123 \
  --authenticationDatabase admin \
  --db parking_pulse \
  /dump/parking_pulse
```

## 📊 Monitoring Setup

### Prometheus Integration

1. **Add Prometheus configuration** (`prometheus.yml`):
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'parking-pulse-central'
    static_configs:
      - targets: ['central-service:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

2. **Add Prometheus to docker-compose.yml**:
```yaml
prometheus:
  image: prom/prometheus:latest
  container_name: prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus_data:/prometheus
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
  ports:
    - "9090:9090"
  networks:
    - parking-network
```

3. **Access Prometheus**:
   - UI: http://localhost:9090
   - Targets: http://localhost:9090/targets
   - Graph: http://localhost:9090/graph

### Available Metrics

**HTTP Metrics:**
- `http_requests_total{method, route, status_code}` - Counter
- `http_request_duration_seconds{method, route, status_code}` - Histogram

**Application Metrics:**
- `parking_pulse_active_devices` - Gauge
- `parking_pulse_status_updates_total{pi_id}` - Counter
- `parking_pulse_alerts_total{type, severity}` - Counter
- `parking_pulse_device_temperature_celsius{pi_id}` - Gauge

**Database Metrics:**
- `database_operation_duration_seconds{operation, collection}` - Histogram

**Node.js Metrics:**
- `nodejs_heap_size_total_bytes` - Gauge
- `nodejs_heap_size_used_bytes` - Gauge
- `process_cpu_user_seconds_total` - Counter
- And many more...

### Grafana Dashboard

1. **Add Grafana to docker-compose.yml**:
```yaml
grafana:
  image: grafana/grafana:latest
  container_name: grafana
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
  volumes:
    - grafana_data:/var/lib/grafana
  networks:
    - parking-network
```

2. **Configure Grafana**:
   - Access: http://localhost:3001
   - Login: admin/admin
   - Add Prometheus data source: http://prometheus:9090
   - Import dashboards or create custom ones

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/unit/error-codes.test.js

# Run integration tests only
npm test -- tests/integration/
```

### Manual API Testing

#### Using curl

```bash
# Test health
curl http://localhost:3000/health

# Submit device status
curl -X POST http://localhost:3000/api/v1/devices/status \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-api-key-1" \
  -d '{
    "piId": "test-pi",
    "temperatureC": 55.5,
    "temperatureF": 131.9,
    "cameraOk": true,
    "systemOnline": true,
    "deviceTimestamp": "2024-01-10T12:00:00Z"
  }'

# Get all devices
curl -H "X-API-Key: dev-api-key-1" \
  http://localhost:3000/api/v1/devices

# Get specific device
curl -H "X-API-Key: dev-api-key-1" \
  http://localhost:3000/api/v1/devices/test-pi

# Get alerts
curl -H "X-API-Key: dev-api-key-1" \
  http://localhost:3000/api/v1/devices/alerts/all
```

#### Using Postman

1. Import API from Swagger:
   - Open http://localhost:3000/api-docs
   - Download OpenAPI spec
   - Import into Postman

2. Set up environment:
   - Add variable: `baseUrl` = `http://localhost:3000`
   - Add variable: `apiKey` = `your-api-key`

3. Use `{{baseUrl}}` and `{{apiKey}}` in requests

## 🚨 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

**Symptoms:**
- Health check shows database disconnected
- Errors in logs: "MongoServerError: Authentication failed"

**Solutions:**
```bash
# Check MongoDB container
docker-compose ps mongodb

# View MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb

# Verify credentials in .env match docker-compose.yml

# Test connection
docker exec parking-pulse-mongodb mongosh \
  -u admin -p parkingpulse123 --eval "db.adminCommand('ping')"
```

#### 2. Authentication Failed (401)

**Symptoms:**
- API returns 401 Unauthorized
- "Invalid or missing API key" error

**Solutions:**
```bash
# Verify API key in request
curl -H "X-API-Key: your-key" http://localhost:3000/api/v1/devices

# Check configured keys
docker-compose exec central-service printenv API_KEYS

# Verify key format (no spaces, comma-separated)
API_KEYS=key1,key2,key3  # Correct
API_KEYS=key1, key2      # Wrong (space after comma)
```

#### 3. Rate Limit Exceeded (429)

**Symptoms:**
- API returns 429 Too Many Requests
- "Rate limit exceeded" message

**Solutions:**
```bash
# Wait for rate limit window to reset (default: 1 minute)

# Increase rate limits in docker-compose.yml:
environment:
  - RATE_LIMIT_MAX_REQUESTS=200
  - RATE_LIMIT_WINDOW_MS=60000

# Restart service
docker-compose restart central-service
```

#### 4. Container Health Check Failing

**Symptoms:**
- Container shows as unhealthy
- `docker-compose ps` shows "unhealthy" status

**Solutions:**
```bash
# Check health check logs
docker inspect parking-pulse-central | grep -A 10 Health

# Test health endpoint manually
curl http://localhost:3000/health/live

# Check if MongoDB is ready
curl http://localhost:3000/health/ready

# View application logs
docker-compose logs central-service

# Increase health check intervals in docker-compose.yml
healthcheck:
  interval: 60s
  timeout: 10s
  start_period: 60s
```

#### 5. High Memory Usage

**Symptoms:**
- Container using excessive memory
- System slow or unresponsive

**Solutions:**
```bash
# Check memory usage
docker stats parking-pulse-central

# View memory metrics
curl http://localhost:3000/metrics | grep nodejs_heap

# Add memory limits to docker-compose.yml
services:
  central-service:
    mem_limit: 512m
    mem_reservation: 256m

# Restart with limits
docker-compose up -d
```

#### 6. Logs Not Showing

**Symptoms:**
- Empty or missing logs
- Can't debug issues

**Solutions:**
```bash
# Check log configuration
docker-compose exec central-service printenv LOG_LEVEL

# Set debug level
environment:
  - LOG_LEVEL=debug

# View logs with timestamps
docker-compose logs -f --timestamps central-service

# Check log file permissions (if using file logging)
docker-compose exec central-service ls -la /app/logs
```

## 📈 Performance Tuning

### Application Tuning

```bash
# Increase MongoDB connection pool
environment:
  - MONGODB_POOL_SIZE=20

# Adjust rate limits for higher traffic
environment:
  - RATE_LIMIT_MAX_REQUESTS=500
  - RATE_LIMIT_WINDOW_MS=60000
```

### Docker Resource Limits

```yaml
services:
  central-service:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '1'
          memory: 512M

  mongodb:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### MongoDB Optimization

```javascript
// In MongoDB shell
use parking_pulse

// Analyze query performance
db.pistatuses.find({piId: "test-pi"}).explain("executionStats")

// Check index usage
db.pistatuses.aggregate([{$indexStats: {}}])

// Compact collections (if needed)
db.runCommand({compact: 'pistatuses'})
```

## 🔐 Production Security Checklist

- [ ] Change default MongoDB credentials
- [ ] Generate strong API keys (32+ characters)
- [ ] Enable HTTPS/TLS (use reverse proxy)
- [ ] Configure proper CORS origins
- [ ] Set up firewall rules
- [ ] Enable Docker security features
- [ ] Use secrets management system
- [ ] Set up log aggregation
- [ ] Configure backup automation
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Implement monitoring alerts
- [ ] Set up intrusion detection
- [ ] Configure rate limiting appropriately
- [ ] Use container image scanning
- [ ] Implement least privilege access

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Check service health
- Monitor error logs
- Review alert counts

**Weekly:**
- Review metrics and performance
- Check disk space usage
- Verify backup integrity

**Monthly:**
- Security updates
- Dependency updates
- Performance analysis
- Capacity planning

### Useful Commands

```bash
# Service health
curl http://localhost:3000/health/detailed

# Quick status check
docker-compose ps && curl -s http://localhost:3000/health | jq

# View recent logs
docker-compose logs --tail=100 central-service

# Database size
docker exec parking-pulse-mongodb mongosh -u admin -p parkingpulse123 \
  --eval "db.stats()" parking_pulse

# Export metrics
curl -s http://localhost:3000/metrics > metrics-$(date +%Y%m%d).txt
```

## 📚 Additional Resources

- **API Documentation**: http://localhost:3000/api-docs
- **Prometheus Metrics**: http://localhost:3000/metrics
- **Health Checks**: http://localhost:3000/health
- **MongoDB Docs**: https://docs.mongodb.com
- **Express.js Docs**: https://expressjs.com
- **Docker Docs**: https://docs.docker.com
- **Prometheus Docs**: https://prometheus.io/docs

---

**Need Help?**
1. Check the troubleshooting section
2. Review application logs
3. Test endpoints with Swagger UI
4. Check database connectivity
5. Verify configuration files
