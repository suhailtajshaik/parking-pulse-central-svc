const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Parking Pulse Central API',
      version: '1.0.0',
      description: 'Central monitoring service for Parking Pulse IoT devices running on Raspberry Pi 5',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server'
      },
      {
        url: 'http://localhost:8080/api/v1',
        description: 'Development API v1'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for authentication'
        }
      },
      schemas: {
        PiStatus: {
          type: 'object',
          required: ['piId'],
          properties: {
            piId: {
              type: 'string',
              description: 'Unique identifier for the Raspberry Pi device',
              example: 'pi-001'
            },
            temperatureC: {
              type: 'number',
              description: 'Device temperature in Celsius',
              example: 45.5
            },
            temperatureF: {
              type: 'number',
              description: 'Device temperature in Fahrenheit',
              example: 113.9
            },
            cameraOk: {
              type: 'boolean',
              description: 'Camera operational status',
              example: true
            },
            systemOnline: {
              type: 'boolean',
              description: 'System online status',
              example: true
            },
            deviceTimestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp from the device',
              example: '2024-01-10T12:00:00Z'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Record creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Record last update timestamp'
            }
          }
        },
        Alert: {
          type: 'object',
          required: ['piId', 'type', 'severity', 'message'],
          properties: {
            piId: {
              type: 'string',
              description: 'Device identifier',
              example: 'pi-001'
            },
            type: {
              type: 'string',
              enum: ['temperature', 'camera', 'system', 'offline'],
              description: 'Alert type',
              example: 'temperature'
            },
            severity: {
              type: 'string',
              enum: ['info', 'warning', 'critical'],
              description: 'Alert severity level',
              example: 'warning'
            },
            message: {
              type: 'string',
              description: 'Alert message',
              example: 'Temperature threshold exceeded'
            },
            metadata: {
              type: 'object',
              description: 'Additional alert metadata'
            },
            resolved: {
              type: 'boolean',
              description: 'Alert resolution status',
              example: false
            },
            resolvedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Alert resolution timestamp'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Alert creation timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR'
                },
                message: {
                  type: 'string',
                  example: 'Validation failed'
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object'
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        ApiKeyAuth: []
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Device Status',
        description: 'Device status management endpoints'
      },
      {
        name: 'Alerts',
        description: 'Alert management endpoints'
      },
      {
        name: 'Metrics',
        description: 'Prometheus metrics endpoint'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi
};
