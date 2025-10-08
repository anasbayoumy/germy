import request from 'supertest';
import { TestHelpers } from './utils/testHelpers';
import { app } from '../src/index';

describe('API Endpoints Tests', () => {
  let testCompany: any;
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    await TestHelpers.cleanupDatabase();
    
    // Create test company
    testCompany = await TestHelpers.createTestCompany();
    
    // Create test user
    testUser = await TestHelpers.createTestUser({
      companyId: testCompany.id,
      email: 'testuser@testcompany.com'
    });
  });

  afterAll(async () => {
    await TestHelpers.cleanupDatabase();
  });

  describe('Health Check', () => {
    test('GET /health should return service status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'auth-service');
    });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/login', () => {
      test('should return 400 for missing required fields', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
      });

      test('should return 400 for invalid email format', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'invalid-email',
            password: 'password123',
            companyDomain: 'testcompany.com'
          })
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });

      test('should return 401 for invalid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@testcompany.com',
            password: 'wrongpassword',
            companyDomain: 'testcompany.com'
          })
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('POST /api/auth/register', () => {
      test('should return 400 for missing required fields', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
      });

      test('should return 400 for invalid email format', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'invalid-email',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            companyDomain: 'testcompany.com'
          })
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });

      test('should return 400 for weak password', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'newuser@testcompany.com',
            password: '123', // Too weak
            firstName: 'Test',
            lastName: 'User',
            companyDomain: 'testcompany.com'
          })
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });
    });

    describe('POST /api/auth/forgot-password', () => {
      test('should return 400 for missing email', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });

      test('should return 400 for invalid email format', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({
            email: 'invalid-email',
            companyDomain: 'testcompany.com'
          })
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });
    });

    describe('POST /api/auth/reset-password', () => {
      test('should return 400 for missing required fields', async () => {
        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });

      test('should return 400 for invalid token format', async () => {
        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({
            token: 'invalid-token',
            password: 'newPassword123'
          })
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });
    });
  });

  describe('Platform Administration Endpoints', () => {
    let platformAdminToken: string;

    beforeAll(async () => {
      // Create platform admin and get token
      const platformAdmin = await TestHelpers.createTestPlatformAdmin();
      // Note: In real scenario, you'd login to get the token
      platformAdminToken = 'mock-platform-admin-token';
    });

    describe('GET /api/platform/companies', () => {
      test('should return 401 without authentication', async () => {
        const response = await request(app)
          .get('/api/platform/companies')
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Access token required');
      });

      test('should return 403 with invalid token', async () => {
        const response = await request(app)
          .get('/api/platform/companies')
          .set('Authorization', 'Bearer invalid-token')
          .expect(403);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Invalid or expired token');
      });
    });

    describe('POST /api/platform/companies', () => {
      test('should return 401 without authentication', async () => {
        const response = await request(app)
          .post('/api/platform/companies')
          .send({
            name: 'New Company',
            domain: 'newcompany.com',
            industry: 'Technology',
            companySize: '10-50'
          })
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
      });

      test('should return 400 for missing required fields', async () => {
        const response = await request(app)
          .post('/api/platform/companies')
          .set('Authorization', `Bearer ${platformAdminToken}`)
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });
    });
  });

  describe('Protected Routes', () => {
    describe('GET /api/auth/me', () => {
      test('should return 401 without authentication', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Access token required');
      });

      test('should return 403 with invalid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid-token')
          .expect(403);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Invalid or expired token');
      });
    });

    describe('POST /api/auth/logout', () => {
      test('should return 401 without authentication', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
      });
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

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
