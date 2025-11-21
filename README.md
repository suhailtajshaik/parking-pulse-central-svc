# 🚗 Parking Pulse Central Service

A production-ready, enterprise-grade parking monitoring system using HTTP/REST for efficient communication between Raspberry Pi devices and a central server. Built with security, scalability, and observability in mind.

## 📊 System Overview

```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐    MongoDB    ┌─────────────────┐
│   Blue Gate Pi  │ ──────────────► │  Central Server │ ────────────► │   Historical    │
└─────────────────┘                 │                 │               │     Data        │
                                    │  (Express.js)   │               └─────────────────┘
┌─────────────────┐    HTTP/REST    │                 │
│   Pink Gate Pi  │ ──────────────► │  + Production   │    HTTP (3000) ┌─────────────────┐
└─────────────────┘                 │  + Monitoring   │ ─────────────► │  Prometheus &   │
                                    └─────────────────┘                │  Swagger UI     │
                                                                       └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- Docker and Docker Compose
- MongoDB 7.0+

### 1. Start Central Service

#### Production Mode (Docker - Recommended)
```bash
cd parking-pulse-central-svc

# Install dependencies
npm install

# Start all services (MongoDB + Central Service)
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs
docker-compose logs -f central-service

# Access services
# - API: http://localhost:3000/api/v1
# - Health: http://localhost:3000/health
# - API Docs: http://localhost:3000/api-docs
# - Metrics: http://localhost:3000/metrics
```

#### Development Mode (Local Development)
```bash
cd parking-pulse-central-svc

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB only (in Docker)
docker-compose up -d mongodb

# Start central service locally (in new terminal)
npm run dev

# Access services at http://localhost:3000
```

### 2. Stop Services

#### Production (Docker)
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Restart services
docker-compose restart
```

#### Development (Local)
```bash
# Stop central service: Press Ctrl+C in terminal

# Stop MongoDB
docker-compose stop mongodb
```

## 📁 Architecture & File Structure

### Production-Ready MVC Architecture
```
parking-pulse-central-svc/
├── src/
│   ├── app.js                      # Express app configuration
│   ├── server.js                   # Server startup & graceful shutdown
│   ├── config/
│   │   ├── index.js                # Environment-based configuration
│   │   ├── database.js             # MongoDB connection & pooling
│   │   └── swagger.js              # OpenAPI/Swagger configuration
│   ├── controllers/
│   │   └── device.controller.js    # Request handlers
│   ├── services/
│   │   └── device.service.js       # Business logic layer
│   ├── models/
│   │   ├── PiStatus.js             # Device status schema
│   │   └── Alert.js                # Alert schema with deduplication
│   ├── routes/
│   │   ├── index.js                # Route aggregation
│   │   ├── device.routes.js        # Device endpoints
│   │   └── health.routes.js        # Health check endpoints
│   ├── middleware/
│   │   ├── auth.js                 # API key authentication
│   │   ├── rate-limiter.js         # Rate limiting
│   │   ├── error-handler.js        # Global error handling
│   │   └── request-logger.js       # HTTP request logging
│   ├── validators/
│   │   └── device-status.validator.js  # Input validation
│   └── utils/
│       ├── logger.js               # Winston structured logging
│       ├── error-codes.js          # Standardized error codes
│       └── metrics.js              # Prometheus metrics
├── tests/
│   ├── unit/                       # Unit tests
│   └── integration/                # Integration tests
├── docker-compose.yml              # Production Docker setup
├── Dockerfile                      # Multi-stage production build
├── package.json
└── README.md
```

## 🔧 Key Features

### ✅ Production-Ready Architecture
- **RESTful API**: Standard HTTP/REST with versioning (`/api/v1`)
- **MVC Pattern**: Clean separation of concerns
- **Security Hardened**: API keys, rate limiting, helmet.js, input validation
- **Type Safety**: Express-validator for request validation
- **Error Handling**: Centralized with standardized error codes
- **Graceful Shutdown**: Proper cleanup of resources

### ✅ Observability & Monitoring
- **Prometheus Metrics**: `/metrics` endpoint with comprehensive metrics
  - HTTP request duration and counts
  - Active device count
  - Alert counters by type/severity
  - Device temperature gauges
  - Database operation metrics
- **Structured Logging**: Winston with JSON output
- **Health Checks**: Kubernetes-ready liveness and readiness probes
- **API Documentation**: Interactive Swagger UI at `/api-docs`

### ✅ Core Functionality
- **Device Monitoring**: Temperature, camera status, system health
- **Alert System**: Smart deduplication with configurable thresholds
  - Temperature alerts (warning: 70°C, critical: 80°C)
  - Camera failure detection
  - Offline device detection (2-minute timeout)
- **Historical Storage**: MongoDB with TTL indexes (7-day retention)
- **Real-time Status**: Efficient caching and retrieval

### ✅ Security Features
- **API Key Authentication**: Secure endpoint access
- **Rate Limiting**: Per-endpoint protection
- **Helmet.js**: Security headers (CSP, XSS, etc.)
- **CORS**: Configurable origin whitelist
- **NoSQL Injection Protection**: Input sanitization
- **Payload Size Limits**: 10KB request limit

### ✅ Docker & Deployment
- **Multi-stage Build**: Optimized production images
- **Non-root User**: Security best practice
- **Health Checks**: Built into Dockerfile and docker-compose
- **Signal Handling**: dumb-init for proper process management
- **Volume Management**: Persistent data storage
- **Resource Limits**: Configurable in docker-compose

### ✅ Testing & Quality
- **Unit Tests**: Jest-based with 50%+ coverage target
- **Integration Tests**: API endpoint testing with Supertest
- **Code Quality**: ESLint configuration
- **CI/CD Ready**: Test automation support

## 📡 API Endpoints

### Authentication
All API endpoints (except health checks, metrics, and API docs) require an API key header:
```
X-API-Key: your-api-key-here
```

### Device Status Endpoints

#### Submit Device Status
```http
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
```

#### Get All Devices
```http
GET /api/v1/devices?page=1&limit=20&sortBy=updatedAt&sortOrder=desc
X-API-Key: your-api-key
```

#### Get Specific Device
```http
GET /api/v1/devices/blue-gate-pi
X-API-Key: your-api-key
```

#### Get Device History
```http
GET /api/v1/devices/blue-gate-pi/history?page=1&limit=50
X-API-Key: your-api-key
```

### Alert Endpoints

#### Get All Alerts
```http
GET /api/v1/devices/alerts/all?resolved=false
X-API-Key: your-api-key
```

#### Get Device Alerts
```http
GET /api/v1/devices/alerts/blue-gate-pi
X-API-Key: your-api-key
```

#### Resolve Alert
```http
PATCH /api/v1/devices/alerts/:alertId
X-API-Key: your-api-key
```

### Health Endpoints (Public - No Auth)

#### Basic Health Check
```http
GET /health
```

#### Liveness Probe
```http
GET /health/live
```

#### Readiness Probe
```http
GET /health/ready
```

#### Detailed Health
```http
GET /health/detailed
```

### Monitoring Endpoints (Public)

#### Prometheus Metrics
```http
GET /metrics
```

#### API Documentation
```http
GET /api-docs
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb://admin:parkingpulse123@mongodb:27017/parking_pulse?authSource=admin
MONGODB_POOL_SIZE=10

# Security Configuration
API_KEYS=your-secure-api-key-1,your-secure-api-key-2
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000      # 1 minute
RATE_LIMIT_MAX_REQUESTS=100     # 100 requests per window

# Alert Configuration
ALERT_TEMP_THRESHOLD_C=70       # Warning threshold
ALERT_TEMP_CRITICAL_C=80        # Critical threshold
ALERT_DEDUP_WINDOW_MS=300000    # 5 minutes
DEVICE_OFFLINE_TIMEOUT_MS=120000 # 2 minutes

# Logging Configuration
LOG_LEVEL=info                  # debug, info, warn, error
LOG_FORMAT=json                 # json or simple
```

## 🐳 Docker Commands

### Production Deployment

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f central-service
docker-compose logs -f mongodb

# Check service status
docker-compose ps

# Restart services
docker-compose restart central-service

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose build central-service
docker-compose up -d central-service

# Clean rebuild (no cache)
docker-compose build --no-cache central-service
```

### Database Management

```bash
# Connect to MongoDB shell
docker exec -it parking-pulse-mongodb mongosh -u admin -p parkingpulse123

# View collections
use parking_pulse
show collections

# Query recent statuses
db.pistatuses.find().sort({createdAt: -1}).limit(10)

# Query active alerts
db.alerts.find({resolved: false})

# Check database size
db.stats()
```

## 📊 Monitoring with Prometheus

### Metrics Available

The `/metrics` endpoint exposes the following metrics:

**HTTP Metrics:**
- `http_requests_total` - Total HTTP requests by method, route, status
- `http_request_duration_seconds` - Request duration histogram

**Application Metrics:**
- `parking_pulse_active_devices` - Number of active devices
- `parking_pulse_status_updates_total` - Total status updates by device
- `parking_pulse_alerts_total` - Total alerts by type and severity
- `parking_pulse_device_temperature_celsius` - Current device temperatures

**Database Metrics:**
- `database_operation_duration_seconds` - Database operation latency

**Node.js Default Metrics:**
- Process CPU usage, memory usage, event loop lag, etc.

### Prometheus Configuration

Add to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'parking-pulse-central'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (development)
npm run test:watch

# Run specific test file
npm test -- tests/unit/error-codes.test.js
```

### Test Coverage

Current test coverage:
- Unit tests for error handling and utilities
- Integration tests for health endpoints
- Target: 50%+ coverage across statements, branches, functions, and lines

## 🚨 Alert System

### Alert Types

1. **Temperature Alerts**
   - **Warning**: `temperatureC > 70°C`
   - **Critical**: `temperatureC > 80°C`
   - Auto-resolved when temperature drops below threshold

2. **Camera Alerts**
   - Triggered when `cameraOk: false`
   - Manual or auto-resolution

3. **System Alerts**
   - Triggered when `systemOnline: false`
   - Indicates device malfunction

4. **Offline Alerts**
   - Auto-triggered after 2 minutes without status update
   - Auto-resolved when device reconnects

### Alert Deduplication

- Prevents duplicate alerts within a configurable time window (default: 5 minutes)
- Only creates new alerts if no similar unresolved alert exists
- Reduces alert fatigue and noise

## 🔐 Security Best Practices

### Current Implementation

✅ **Implemented:**
- API key authentication for all device/alert endpoints
- Rate limiting (configurable per endpoint)
- Helmet.js security headers (CSP, XSS, HSTS, etc.)
- CORS with origin whitelist
- NoSQL injection protection
- Input validation with express-validator
- Request payload size limits
- Non-root Docker container user
- Secure MongoDB credentials

### Recommended for Production

🔄 **Additional Recommendations:**
- Use HTTPS/TLS in production (reverse proxy like nginx)
- Rotate API keys regularly
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Implement request signing for critical operations
- Add WAF (Web Application Firewall)
- Enable audit logging for compliance
- Regular security scanning and updates

## 📈 Performance Optimization

### Database Optimization
- Compound indexes on `piId` and `createdAt`
- TTL index for automatic 7-day data retention
- Connection pooling (configurable pool size)
- Efficient queries with pagination

### Application Optimization
- Compression middleware for response payloads
- In-memory caching for latest device status
- Efficient alert deduplication logic
- Graceful shutdown to prevent data loss

### Docker Optimization
- Multi-stage builds for smaller images
- Layer caching for faster rebuilds
- Health checks for orchestration
- Resource limits in docker-compose

## 🚨 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
```bash
# Check if MongoDB is running
docker-compose ps mongodb

# View MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb

# Test connection
docker exec parking-pulse-mongodb mongosh --eval "db.adminCommand('ping')"
```

#### 2. Authentication Failed
```bash
# Verify API key in request header
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/v1/devices

# Check configured API keys
# Ensure API_KEYS in .env or docker-compose.yml matches
```

#### 3. Rate Limit Exceeded
```bash
# Response: 429 Too Many Requests
# Wait for the rate limit window to reset
# Or increase limits in configuration
```

#### 4. Health Check Failed
```bash
# Test health endpoints
curl http://localhost:3000/health
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready

# Check detailed health
curl http://localhost:3000/health/detailed

# View service logs
docker-compose logs central-service
```

#### 5. High Memory Usage
```bash
# Check container stats
docker stats parking-pulse-central

# View detailed metrics
curl http://localhost:3000/metrics | grep process_

# Restart service if needed
docker-compose restart central-service
```

## 📚 API Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:3000/api-docs

Features:
- Complete API schema definitions
- Try-it-out functionality
- Request/response examples
- Authentication testing
- Model schemas for all entities

## 🎯 Migration from gRPC

This system was migrated from gRPC to HTTP/REST for:
- **Simplicity**: Standard HTTP tools and debugging
- **Compatibility**: Works with any HTTP client
- **Tooling**: Better API documentation and testing tools
- **Accessibility**: Easier integration with web applications

**Breaking Changes:**
- gRPC port 50051 removed
- All communication now via HTTP/REST on port 3000
- API key authentication required (previously optional)
- Response format changed to JSON

## 🔄 Recent Updates

### v2.0.0 - Production-Ready Release
- ✅ Migrated from gRPC to HTTP/REST
- ✅ Implemented MVC architecture
- ✅ Added comprehensive security features
- ✅ Integrated Prometheus metrics
- ✅ Added Swagger API documentation
- ✅ Multi-stage Docker builds
- ✅ Comprehensive testing suite
- ✅ Production-ready error handling and logging

## 🎯 Roadmap & Future Enhancements

### Planned Features
- [ ] WebSocket support for real-time updates
- [ ] Email/SMS alert notifications
- [ ] Historical analytics dashboard
- [ ] Camera snapshot storage and viewing
- [ ] Multi-tenancy support
- [ ] Advanced alerting rules engine
- [ ] Grafana dashboard templates
- [ ] Kubernetes deployment manifests

## 📞 Support & Contribution

### Getting Help
1. Check this README and SETUP.md
2. Review API documentation at `/api-docs`
3. Check application logs
4. Review test cases for examples
5. Create an issue with detailed information

### Development Workflow
```bash
# Fork and clone the repository
git clone <your-fork>

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
npm test

# Commit with descriptive message
git commit -m "Add: your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

## 📄 License

ISC

---

**Status**: ✅ **Production-Ready**
**Architecture**: HTTP/REST API with MVC pattern
**Deployment**: Docker with multi-stage builds
**Monitoring**: Prometheus metrics + Swagger docs
**Security**: API keys, rate limiting, helmet.js, input validation
