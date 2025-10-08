import request from 'supertest';
import { TestHelpers } from './utils/testHelpers';
import { app } from '../src/index';
import { generateToken } from '../src/services/jwt.service';

describe('Middleware Tests', () => {
  let testCompany: any;
  let testUser: any;
  let validToken: string;
  let expiredToken: string;

  beforeAll(async () => {
    await TestHelpers.cleanupDatabase();
    
    // Create test company
    testCompany = await TestHelpers.createTestCompany();
    
    // Create test user
    testUser = await TestHelpers.createTestUser({
      companyId: testCompany.id,
      email: 'testuser@testcompany.com'
    });

    // Generate valid token
    validToken = generateToken({
      userId: testUser.id,
      companyId: testCompany.id,
      role: 'employee'
    });

    // Generate expired token (mock)
    expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJjb21wYW55SWQiOiJ0ZXN0LWNvbXBhbnktaWQiLCJyb2xlIjoiZW1wbG95ZWUiLCJpYXQiOjE2MzQwNzY4MDAsImV4cCI6MTYzNDA4MDQwMH0.invalid';
  });

  afterAll(async () => {
    await TestHelpers.cleanupDatabase();
  });

  describe('Authentication Middleware', () => {
    test('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    test('should reject request with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    test('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid or expired token');
    });

    test('should reject request with expired token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid or expired token');
    });
  });

  describe('Role-Based Access Control', () => {
    let employeeToken: string;
    let adminToken: string;
    let platformAdminToken: string;

    beforeAll(() => {
      // Generate tokens for different roles
      employeeToken = generateToken({
        userId: 'employee-id',
        companyId: testCompany.id,
        role: 'employee'
      });

      adminToken = generateToken({
        userId: 'admin-id',
        companyId: testCompany.id,
        role: 'company_admin'
      });

      platformAdminToken = generateToken({
        userId: 'platform-admin-id',
        companyId: testCompany.id,
        role: 'platform_super_admin'
      });
    });

    test('should allow platform admin to access platform endpoints', async () => {
      const response = await request(app)
        .get('/api/platform/companies')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('should reject employee access to platform endpoints', async () => {
      const response = await request(app)
        .get('/api/platform/companies')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    test('should reject company admin access to platform endpoints', async () => {
      const response = await request(app)
        .get('/api/platform/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });
  });

  describe('Validation Middleware', () => {
    test('should validate required fields for login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password and companyDomain
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email-format',
          password: 'password123',
          companyDomain: 'testcompany.com'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      
      const emailError = response.body.errors.find((error: any) => 
        error.field.includes('email')
      );
      expect(emailError).toBeDefined();
    });

    test('should validate password strength for registration', async () => {
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
      expect(response.body).toHaveProperty('errors');
      
      const passwordError = response.body.errors.find((error: any) => 
        error.field.includes('password')
      );
      expect(passwordError).toBeDefined();
    });

    test('should validate company domain format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
          companyDomain: 'invalid-domain-format'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Rate Limiting', () => {
    test('should apply rate limiting to login endpoint', async () => {
      // Make multiple rapid requests
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
            companyDomain: 'testcompany.com'
          })
      );

      const responses = await Promise.all(promises);
      
      // At least one should be rate limited (429)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('CORS Middleware', () => {
    test('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for helmet security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });
});
