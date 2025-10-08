import request from 'supertest';
import { app } from '../../src/index';

describe('Health Check API Tests', () => {
  describe('GET /health', () => {
    test('should return service status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('service', 'auth-service');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
    });

    test('should return correct content type', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    test('should return valid JSON', async () => {
      const response = await request(app)
        .get('/health');

      expect(() => JSON.parse(response.text)).not.toThrow();
    });

    test('should include all required fields', async () => {
      const response = await request(app)
        .get('/health');

      const body = response.body;
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('service');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('uptime');
      expect(body).toHaveProperty('version');

      expect(typeof body.status).toBe('string');
      expect(typeof body.service).toBe('string');
      expect(typeof body.timestamp).toBe('string');
      expect(typeof body.uptime).toBe('number');
      expect(typeof body.version).toBe('string');
    });

    test('should have correct service name', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.body.service).toBe('auth-service');
    });

    test('should have OK status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.body.status).toBe('OK');
    });

    test('should have valid timestamp', async () => {
      const response = await request(app)
        .get('/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    test('should have positive uptime', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.body.uptime).toBeGreaterThan(0);
    });

    test('should have version string', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.body.version).toBeDefined();
      expect(typeof response.body.version).toBe('string');
      expect(response.body.version.length).toBeGreaterThan(0);
    });

    test('should handle multiple requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('OK');
        expect(response.body.service).toBe('auth-service');
      });
    });

    test('should handle concurrent requests', async () => {
      const startTime = Date.now();
      
      const requests = Array.from({ length: 50 }, () =>
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('OK');
      });

      // Should handle 50 concurrent requests in reasonable time
      expect(endTime - startTime).toBeLessThan(5000);
    });

    test('should not require authentication', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
    });

    test('should work with different HTTP methods', async () => {
      // GET should work
      const getResponse = await request(app)
        .get('/health')
        .expect(200);

      expect(getResponse.body.status).toBe('OK');

      // POST should also work (if implemented)
      const postResponse = await request(app)
        .post('/health');

      // Either 200 (if POST is implemented) or 404/405 (if not)
      expect([200, 404, 405]).toContain(postResponse.status);
    });

    test('should handle query parameters gracefully', async () => {
      const response = await request(app)
        .get('/health?debug=true&format=json')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.service).toBe('auth-service');
    });

    test('should handle headers gracefully', async () => {
      const response = await request(app)
        .get('/health')
        .set('User-Agent', 'Test-Agent/1.0')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.service).toBe('auth-service');
    });
  });
});
