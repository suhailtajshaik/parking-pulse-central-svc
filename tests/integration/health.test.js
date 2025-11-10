const request = require('supertest');
const app = require('../../src/app');

describe('Health Endpoints', () => {
  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /health/live', () => {
    it('should return 200 and liveness status', async () => {
      const res = await request(app)
        .get('/health/live')
        .expect(200);

      expect(res.body.status).toBe('alive');
      expect(res.body.uptime).toBeDefined();
      expect(typeof res.body.uptime).toBe('number');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health information', async () => {
      const res = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(res.body.status).toBe('healthy');
      expect(res.body.uptime).toBeDefined();
      expect(res.body.memory).toBeDefined();
      expect(res.body.database).toBeDefined();
    });
  });
});

describe('API Information', () => {
  describe('GET /api/v1', () => {
    it('should return API information', async () => {
      const res = await request(app)
        .get('/api/v1')
        .expect(200);

      expect(res.body.name).toBe('Parking Pulse Central API');
      expect(res.body.version).toBeDefined();
      expect(res.body.endpoints).toBeDefined();
    });
  });

  describe('GET /', () => {
    it('should redirect to /api/v1', async () => {
      await request(app)
        .get('/')
        .expect(302);
    });
  });
});

describe('404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app)
        .get('/unknown-route')
        .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });
});
