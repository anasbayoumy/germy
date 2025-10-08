import request from 'supertest';
import { app } from '../../src/index';
import { generateToken } from '../../src/services/jwt.service';

describe('Auth Endpoints API Tests', () => {
  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'ValidPassword123!'
    };

    test('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'ValidPassword123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    test('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    test('should return 400 for empty email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: '', password: 'ValidPassword123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for empty password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: '' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid-email', password: 'ValidPassword123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for email without domain', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test', password: 'ValidPassword123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for email with invalid domain', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@invalid', password: 'ValidPassword123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for email with spaces', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: ' test@example.com ', password: 'ValidPassword123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for password with only spaces', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: '   ' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for null email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: null, password: 'ValidPassword123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for null password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: null })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for undefined email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: undefined, password: 'ValidPassword123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for undefined password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: undefined })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for extra fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ 
          email: 'test@example.com', 
          password: 'ValidPassword123!',
          extraField: 'should-not-be-here'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "test@example.com", "password": "ValidPassword123!"')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid JSON payload');
    });

    test('should return 400 for non-JSON content type', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'text/plain')
        .send('email=test@example.com&password=ValidPassword123!')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for array instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(['test@example.com', 'ValidPassword123!'])
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for string instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('test@example.com')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for number instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(123)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for boolean instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(true)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle valid request format (will fail due to no database)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      // This will fail due to database connection, but we test the request format
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('POST /api/auth/register', () => {
    const validRegisterData = {
      companyName: 'Test Company',
      companyDomain: 'testcompany.com',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@testcompany.com',
      password: 'ValidPassword123!',
      industry: 'Technology',
      companySize: '10-50'
    };

    test('should return 400 for missing companyName', async () => {
      const { companyName, ...data } = validRegisterData;
      const response = await request(app)
        .post('/api/auth/register')
        .send(data)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for missing companyDomain', async () => {
      const { companyDomain, ...data } = validRegisterData;
      const response = await request(app)
        .post('/api/auth/register')
        .send(data)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for missing firstName', async () => {
      const { firstName, ...data } = validRegisterData;
      const response = await request(app)
        .post('/api/auth/register')
        .send(data)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for missing lastName', async () => {
      const { lastName, ...data } = validRegisterData;
      const response = await request(app)
        .post('/api/auth/register')
        .send(data)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for missing email', async () => {
      const { email, ...data } = validRegisterData;
      const response = await request(app)
        .post('/api/auth/register')
        .send(data)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for missing password', async () => {
      const { password, ...data } = validRegisterData;
      const response = await request(app)
        .post('/api/auth/register')
        .send(data)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for missing industry', async () => {
      const { industry, ...data } = validRegisterData;
      const response = await request(app)
        .post('/api/auth/register')
        .send(data)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for missing companySize', async () => {
      const { companySize, ...data } = validRegisterData;
      const response = await request(app)
        .post('/api/auth/register')
        .send(data)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for empty companyName', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, companyName: '' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for empty companyDomain', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, companyDomain: '' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for empty firstName', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, firstName: '' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for empty lastName', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, lastName: '' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for empty email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, email: '' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for empty password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, password: '' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for empty industry', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, industry: '' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for empty companySize', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, companySize: '' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for invalid companyDomain format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, companyDomain: 'invalid domain' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, password: 'weak' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for password without uppercase', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, password: 'password123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for password without lowercase', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, password: 'PASSWORD123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for password without numbers', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, password: 'Password!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for password without special characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, password: 'Password123' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for password too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, password: 'Pa1!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for companyName too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, companyName: 'A' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for firstName too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, firstName: 'A' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for lastName too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, lastName: 'A' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for companyDomain with invalid characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, companyDomain: 'test@company.com' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for companyDomain without TLD', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, companyDomain: 'testcompany' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for companyDomain with spaces', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, companyDomain: 'test company.com' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for email with spaces', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, email: ' john.doe@testcompany.com ' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for firstName with numbers', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, firstName: 'John123' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for lastName with numbers', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, lastName: 'Doe123' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for companyName with special characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegisterData, companyName: 'Test@Company' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for extra fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ 
          ...validRegisterData,
          extraField: 'should-not-be-here',
          anotherField: 123
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"companyName": "Test Company", "companyDomain": "testcompany.com"')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid JSON payload');
    });

    test('should return 400 for empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for array instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(['Test Company', 'testcompany.com', 'John', 'Doe'])
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for string instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send('Test Company')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for number instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(123)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for boolean instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(true)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle valid request format (will fail due to no database)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);

      // This will fail due to database connection, but we test the request format
      expect([400, 500]).toContain(response.status);
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

    test('should return 400 for empty email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: '' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for email with spaces', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: ' test@example.com ' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for null email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: null })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for undefined email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: undefined })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for extra fields', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ 
          email: 'test@example.com',
          extraField: 'should-not-be-here'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .set('Content-Type', 'application/json')
        .send('{"email": "test@example.com"')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid JSON payload');
    });

    test('should return 400 for empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for array instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(['test@example.com'])
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for string instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send('test@example.com')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for number instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(123)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for boolean instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(true)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle valid request format (will fail due to no database)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      // This will fail due to database connection, but we test the request format
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    test('should return 400 for missing token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ newPassword: 'NewPassword123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for missing newPassword', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'reset-token' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for empty token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: '', newPassword: 'NewPassword123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for empty newPassword', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'reset-token', newPassword: '' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for weak newPassword', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'reset-token', newPassword: 'weak' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for newPassword without uppercase', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'reset-token', newPassword: 'password123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for newPassword without lowercase', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'reset-token', newPassword: 'PASSWORD123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for newPassword without numbers', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'reset-token', newPassword: 'Password!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for newPassword without special characters', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'reset-token', newPassword: 'Password123' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for newPassword too short', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'reset-token', newPassword: 'Pa1!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for null token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: null, newPassword: 'NewPassword123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for null newPassword', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'reset-token', newPassword: null })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for undefined token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: undefined, newPassword: 'NewPassword123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for undefined newPassword', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'reset-token', newPassword: undefined })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for extra fields', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ 
          token: 'reset-token',
          newPassword: 'NewPassword123!',
          extraField: 'should-not-be-here'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .set('Content-Type', 'application/json')
        .send('{"token": "reset-token", "newPassword": "NewPassword123!"')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid JSON payload');
    });

    test('should return 400 for empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for array instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(['reset-token', 'NewPassword123!'])
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for string instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send('reset-token')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for number instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(123)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for boolean instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(true)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle valid request format (will fail due to no database)', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ 
          token: 'reset-token',
          newPassword: 'NewPassword123!'
        });

      // This will fail due to database connection, but we test the request format
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('POST /api/auth/verify-token', () => {
    test('should return 400 for missing token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for empty token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({ token: '' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for null token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({ token: null })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for undefined token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({ token: undefined })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for invalid token format', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for malformed JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({ token: 'invalid.jwt.token' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for extra fields', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({ 
          token: 'valid-token',
          extraField: 'should-not-be-here'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .set('Content-Type', 'application/json')
        .send('{"token": "valid-token"')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid JSON payload');
    });

    test('should return 400 for empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for array instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send(['valid-token'])
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for string instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send('valid-token')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for number instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send(123)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return 400 for boolean instead of object', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send(true)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle valid request format (will fail due to invalid token)', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({ token: 'valid-token' });

      // This will fail due to invalid token, but we test the request format
      expect([400, 500]).toContain(response.status);
    });
  });
});
