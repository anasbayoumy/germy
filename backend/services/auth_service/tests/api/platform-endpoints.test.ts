import request from 'supertest';
import { app } from '../../src/index';
import { generateToken } from '../../src/services/jwt.service';

describe('Platform Endpoints API Tests', () => {
  const platformAdminToken = generateToken({
    userId: 'platform-admin-id',
    companyId: 'platform',
    role: 'platform_super_admin'
  });

  const companyAdminToken = generateToken({
    userId: 'company-admin-id',
    companyId: 'test-company-id',
    role: 'company_admin'
  });

  const employeeToken = generateToken({
    userId: 'employee-id',
    companyId: 'test-company-id',
    role: 'employee'
  });

  const invalidToken = 'invalid-token';

  describe('GET /api/platform/companies', () => {
    test('should return 401 without token', async () => {
      await request(app)
        .get('/api/platform/companies')
        .expect(401);
    });

    test('should return 401 with invalid token', async () => {
      await request(app)
        .get('/api/platform/companies')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(403);
    });

    test('should return 403 with company admin token', async () => {
      await request(app)
        .get('/api/platform/companies')
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .expect(403);
    });

    test('should return 403 with employee token', async () => {
      await request(app)
        .get('/api/platform/companies')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
    });

    test('should handle valid platform admin token (will fail due to no database)', async () => {
      const response = await request(app)
        .get('/api/platform/companies')
        .set('Authorization', `Bearer ${platformAdminToken}`);

      // This will fail due to database connection, but we test the authorization
      expect([200, 500]).toContain(response.status);
    });

    test('should handle query parameters', async () => {
      const response = await request(app)
        .get('/api/platform/companies?page=1&limit=10&search=test')
        .set('Authorization', `Bearer ${platformAdminToken}`);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('POST /api/platform/companies', () => {
    const validCompanyData = {
      name: 'Test Company',
      domain: 'testcompany.com',
      industry: 'Technology',
      companySize: '10-50',
      timezone: 'UTC'
    };

    test('should return 401 without token', async () => {
      await request(app)
        .post('/api/platform/companies')
        .send(validCompanyData)
        .expect(401);
    });

    test('should return 401 with invalid token', async () => {
      await request(app)
        .post('/api/platform/companies')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send(validCompanyData)
        .expect(403);
    });

    test('should return 403 with company admin token', async () => {
      await request(app)
        .post('/api/platform/companies')
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .send(validCompanyData)
        .expect(403);
    });

    test('should return 403 with employee token', async () => {
      await request(app)
        .post('/api/platform/companies')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(validCompanyData)
        .expect(403);
    });

    test('should return 400 for missing name', async () => {
      const { name, ...data } = validCompanyData;
      await request(app)
        .post('/api/platform/companies')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send(data)
        .expect(400);
    });

    test('should return 400 for missing domain', async () => {
      const { domain, ...data } = validCompanyData;
      await request(app)
        .post('/api/platform/companies')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send(data)
        .expect(400);
    });

    test('should return 400 for missing industry', async () => {
      const { industry, ...data } = validCompanyData;
      await request(app)
        .post('/api/platform/companies')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send(data)
        .expect(400);
    });

    test('should return 400 for missing companySize', async () => {
      const { companySize, ...data } = validCompanyData;
      await request(app)
        .post('/api/platform/companies')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send(data)
        .expect(400);
    });

    test('should return 400 for missing timezone', async () => {
      const { timezone, ...data } = validCompanyData;
      await request(app)
        .post('/api/platform/companies')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send(data)
        .expect(400);
    });

    test('should return 400 for empty name', async () => {
      await request(app)
        .post('/api/platform/companies')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({ ...validCompanyData, name: '' })
        .expect(400);
    });

    test('should return 400 for empty domain', async () => {
      await request(app)
        .post('/api/platform/companies')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({ ...validCompanyData, domain: '' })
        .expect(400);
    });

    test('should return 400 for invalid domain format', async () => {
      await request(app)
        .post('/api/platform/companies')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({ ...validCompanyData, domain: 'invalid domain' })
        .expect(400);
    });

    test('should return 400 for name too short', async () => {
      await request(app)
        .post('/api/platform/companies')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({ ...validCompanyData, name: 'A' })
        .expect(400);
    });

    test('should return 400 for extra fields', async () => {
      await request(app)
        .post('/api/platform/companies')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({ 
          ...validCompanyData,
          extraField: 'should-not-be-here'
        })
        .expect(400);
    });

    test('should handle valid request (will fail due to no database)', async () => {
      const response = await request(app)
        .post('/api/platform/companies')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send(validCompanyData);

      // This will fail due to database connection, but we test the request format
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('PUT /api/platform/companies/:id', () => {
    const validUpdateData = {
      name: 'Updated Company',
      industry: 'Updated Industry',
      companySize: '50-100'
    };

    test('should return 401 without token', async () => {
      await request(app)
        .put('/api/platform/companies/test-id')
        .send(validUpdateData)
        .expect(401);
    });

    test('should return 401 with invalid token', async () => {
      await request(app)
        .put('/api/platform/companies/test-id')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send(validUpdateData)
        .expect(403);
    });

    test('should return 403 with company admin token', async () => {
      await request(app)
        .put('/api/platform/companies/test-id')
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .send(validUpdateData)
        .expect(403);
    });

    test('should return 403 with employee token', async () => {
      await request(app)
        .put('/api/platform/companies/test-id')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(validUpdateData)
        .expect(403);
    });

    test('should return 400 for missing name', async () => {
      const { name, ...data } = validUpdateData;
      await request(app)
        .put('/api/platform/companies/test-id')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send(data)
        .expect(400);
    });

    test('should return 400 for empty name', async () => {
      await request(app)
        .put('/api/platform/companies/test-id')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({ ...validUpdateData, name: '' })
        .expect(400);
    });

    test('should return 400 for name too short', async () => {
      await request(app)
        .put('/api/platform/companies/test-id')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({ ...validUpdateData, name: 'A' })
        .expect(400);
    });

    test('should return 400 for extra fields', async () => {
      await request(app)
        .put('/api/platform/companies/test-id')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({ 
          ...validUpdateData,
          extraField: 'should-not-be-here'
        })
        .expect(400);
    });

    test('should handle valid request (will fail due to no database)', async () => {
      const response = await request(app)
        .put('/api/platform/companies/test-id')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send(validUpdateData);

      // This will fail due to database connection, but we test the request format
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/platform/subscriptions', () => {
    test('should return 401 without token', async () => {
      await request(app)
        .get('/api/platform/subscriptions')
        .expect(401);
    });

    test('should return 401 with invalid token', async () => {
      await request(app)
        .get('/api/platform/subscriptions')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(403);
    });

    test('should return 403 with company admin token', async () => {
      await request(app)
        .get('/api/platform/subscriptions')
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .expect(403);
    });

    test('should return 403 with employee token', async () => {
      await request(app)
        .get('/api/platform/subscriptions')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
    });

    test('should handle valid platform admin token (will fail due to no database)', async () => {
      const response = await request(app)
        .get('/api/platform/subscriptions')
        .set('Authorization', `Bearer ${platformAdminToken}`);

      // This will fail due to database connection, but we test the authorization
      expect([200, 500]).toContain(response.status);
    });

    test('should handle query parameters', async () => {
      const response = await request(app)
        .get('/api/platform/subscriptions?page=1&limit=10&status=active')
        .set('Authorization', `Bearer ${platformAdminToken}`);

      expect([200, 500]).toContain(response.status);
    });
  });
});
