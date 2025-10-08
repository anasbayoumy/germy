import request from 'supertest';
import { app } from '../../src/index';

describe('Middleware and Security Tests', () => {
  describe('CORS Headers', () => {
    test('should include CORS headers', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-methods']).toBe('GET,HEAD,PUT,PATCH,POST,DELETE');
      expect(response.headers['access-control-allow-headers']).toBe('Origin, X-Requested-With, Content-Type, Accept, Authorization');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    test('should handle preflight OPTIONS request', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });
  });

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['x-dns-prefetch-control']).toBe('off');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['strict-transport-security']).toBe('max-age=15552000; includeSubDomains');
      expect(response.headers['x-download-options']).toBe('noopen');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('0');
    });
  });

  describe('Rate Limiting', () => {
    test('should apply rate limiting to login endpoint', async () => {
      // Send many requests to trigger rate limit
      const requests = Array.from({ length: 101 }, () =>
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@test.com', password: 'password123' })
      );

      await Promise.all(requests);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('message', 'Too many requests from this IP, please try again later.');
    });

    test('should apply rate limiting to register endpoint', async () => {
      // Send many requests to trigger rate limit
      const requests = Array.from({ length: 101 }, () =>
        request(app)
          .post('/api/auth/register')
          .send({
            companyName: 'Test', companyDomain: 'test.com', firstName: 'F', lastName: 'L',
            email: 'test@test.com', password: 'Password123!', industry: 'Tech', companySize: '1-10'
          })
      );

      await Promise.all(requests);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          companyName: 'Test', companyDomain: 'test.com', firstName: 'F', lastName: 'L',
          email: 'test@test.com', password: 'Password123!', industry: 'Tech', companySize: '1-10'
        });

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('message', 'Too many requests from this IP, please try again later.');
    });

    test('should apply rate limiting to forgot-password endpoint', async () => {
      // Send many requests to trigger rate limit
      const requests = Array.from({ length: 101 }, () =>
        request(app)
          .post('/api/auth/forgot-password')
          .send({ email: 'test@test.com' })
      );

      await Promise.all(requests);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@test.com' });

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('message', 'Too many requests from this IP, please try again later.');
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Route not found');
    });

    test('should return 404 for non-existent auth routes', async () => {
      const response = await request(app)
        .get('/api/auth/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Route not found');
    });

    test('should return 404 for non-existent platform routes', async () => {
      const response = await request(app)
        .get('/api/platform/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Route not found');
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid JSON payload');
    });

    test('should handle empty JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle invalid content type', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'text/plain')
        .send('email=test@test.com&password=password123')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle oversized payload', async () => {
      const largePayload = {
        email: 'test@test.com',
        password: 'a'.repeat(10000) // Very large password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(largePayload)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Request Validation', () => {
    test('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('{"email": "test@test.com", "password": "password123"}')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle wrong Content-Type header', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/xml')
        .send('<email>test@test.com</email>')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle multiple Content-Type headers', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json, text/plain')
        .send('{"email": "test@test.com", "password": "password123"}')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Authentication Middleware', () => {
    test('should handle missing Authorization header', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    test('should handle empty Authorization header', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', '')
        .expect(401);
    });

    test('should handle malformed Authorization header', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });

    test('should handle Authorization header without Bearer', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'some-token')
        .expect(401);
    });

    test('should handle Authorization header with empty Bearer', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer ')
        .expect(401);
    });

    test('should handle Authorization header with spaces', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer  ')
        .expect(401);
    });

    test('should handle case-sensitive Bearer', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'bearer some-token')
        .expect(401);
    });

    test('should handle multiple Bearer prefixes', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer Bearer some-token')
        .expect(401);
    });

    test('should handle invalid JWT token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(403);
    });

    test('should handle expired JWT token', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJjb21wYW55SWQiOiJ0ZXN0LWNvbXBhbnktaWQiLCJyb2xlIjoiZW1wbG95ZWUiLCJpYXQiOjE2MzQwNzY4MDAsImV4cCI6MTYzNDA4MDQwMH0.invalid';
      
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(403);
    });
  });

  describe('Role-Based Access Control', () => {
    const platformAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJwbGF0Zm9ybS1hZG1pbi1pZCIsImNvbXBhbnlJZCI6InBsYXRmb3JtIiwicm9sZSI6InBsYXRmb3JtX3N1cGVyX2FkbWluIiwiaWF0IjoxNjM0MDc2ODAwLCJleHAiOjE2MzQwODA0MDB9.invalid';
    
    const companyAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjb21wYW55LWFkbWluLWlkIiwiY29tcGFueUlkIjoidGVzdC1jb21wYW55LWlkIiwicm9sZSI6ImNvbXBhbnlfYWRtaW4iLCJpYXQiOjE2MzQwNzY4MDAsImV4cCI6MTYzNDA4MDQwMH0.invalid';
    
    const employeeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlbXBsb3llZS1pZCIsImNvbXBhbnlJZCI6InRlc3QtY29tcGFueS1pZCIsInJvbGUiOiJlbXBsb3llZSIsImlhdCI6MTYzNDA3NjgwMCwiZXhwIjoxNjM0MDgwNDAwfQ.invalid';

    test('should reject company admin access to platform endpoints', async () => {
      await request(app)
        .get('/api/platform/companies')
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .expect(403);
    });

    test('should reject employee access to platform endpoints', async () => {
      await request(app)
        .get('/api/platform/companies')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
    });

    test('should reject company admin access to platform company creation', async () => {
      await request(app)
        .post('/api/platform/companies')
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .send({
          name: 'Test Company',
          domain: 'testcompany.com',
          industry: 'Technology',
          companySize: '10-50',
          timezone: 'UTC'
        })
        .expect(403);
    });

    test('should reject employee access to platform company creation', async () => {
      await request(app)
        .post('/api/platform/companies')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Test Company',
          domain: 'testcompany.com',
          industry: 'Technology',
          companySize: '10-50',
          timezone: 'UTC'
        })
        .expect(403);
    });
  });
});
