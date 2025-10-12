import request from 'supertest';
import { app } from '../../src/index';
import { db } from '../../src/config/database';
import { users, companies, platformAdmins, auditLogs, notifications, companySubscriptions } from '../../src/db/schema';
import { hashPassword } from '../../src/utils/bcrypt';
import { generateToken } from '../../src/services/jwt.service';
import { sql } from 'drizzle-orm';

describe('🧪 Comprehensive Test Suite - Auth Service', () => {
  let platformAdminToken: string;
  let superAdminToken: string;
  let adminToken: string;
  let employeeToken: string;
  let testCompanyId: string;
  let testSuperAdminId: string;
  let testAdminId: string;
  let testEmployeeId: string;

  beforeAll(async () => {
    // Clean database
    await db.execute(sql`TRUNCATE TABLE audit_logs, notifications, company_subscriptions, users, companies, platform_admins RESTART IDENTITY CASCADE`);
    
    // Create test platform admin
    const [platformAdmin] = await db
      .insert(platformAdmins)
      .values({
        email: 'admin@platform.com',
        passwordHash: await hashPassword('PlatformPass123'),
        firstName: 'Platform',
        lastName: 'Admin',
        role: 'platform_super_admin',
        isActive: true,
      })
      .returning();

    platformAdminToken = generateToken({
      userId: platformAdmin.id,
      companyId: 'platform',
      role: 'platform_super_admin',
    });

    // Create test company
    const [company] = await db
      .insert(companies)
      .values({
        name: 'Test Company',
        domain: 'test.com',
        industry: 'Technology',
        companySize: '10-50',
        isActive: true,
      })
      .returning();

    testCompanyId = company.id;

    // Create test super admin
    const [superAdmin] = await db
      .insert(users)
      .values({
        companyId: testCompanyId,
        email: 'ceo@test.com',
        passwordHash: await hashPassword('SuperPass123'),
        firstName: 'CEO',
        lastName: 'Test',
        role: 'company_super_admin',
        isActive: true,
        isVerified: true,
      })
      .returning();

    testSuperAdminId = superAdmin.id;
    superAdminToken = generateToken({
      userId: superAdmin.id,
      companyId: testCompanyId,
      role: 'company_super_admin',
    });

    // Create test admin
    const [admin] = await db
      .insert(users)
      .values({
        companyId: testCompanyId,
        email: 'admin@test.com',
        passwordHash: await hashPassword('AdminPass123'),
        firstName: 'Admin',
        lastName: 'Test',
        role: 'company_admin',
        isActive: true,
        isVerified: true,
      })
      .returning();

    testAdminId = admin.id;
    adminToken = generateToken({
      userId: admin.id,
      companyId: testCompanyId,
      role: 'company_admin',
    });

    // Create test employee
    const [employee] = await db
      .insert(users)
      .values({
        companyId: testCompanyId,
        email: 'employee@test.com',
        passwordHash: await hashPassword('EmployeePass123'),
        firstName: 'Employee',
        lastName: 'Test',
        role: 'employee',
        isActive: true,
        isVerified: true,
      })
      .returning();

    testEmployeeId = employee.id;
    employeeToken = generateToken({
      userId: employee.id,
      companyId: testCompanyId,
      role: 'employee',
    });
  });

  afterAll(async () => {
    // Clean up
    await db.execute(sql`TRUNCATE TABLE audit_logs, notifications, company_subscriptions, users, companies, platform_admins RESTART IDENTITY CASCADE`);
  });

  describe('🔐 Authentication Endpoints', () => {
    describe('Platform Admin Login', () => {
      it('PA-LOGIN-001: Valid platform admin login', async () => {
        const response = await request(app)
          .post('/api/auth/platform/login')
          .send({
            email: 'admin@platform.com',
            password: 'PlatformPass123',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.role).toBe('platform_super_admin');
        expect(response.body.data.token).toBeDefined();
      });

      it('PA-LOGIN-002: Invalid email', async () => {
        const response = await request(app)
          .post('/api/auth/platform/login')
          .send({
            email: 'invalid@email.com',
            password: 'PlatformPass123',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid credentials');
      });

      it('PA-LOGIN-003: Invalid password', async () => {
        const response = await request(app)
          .post('/api/auth/platform/login')
          .send({
            email: 'admin@platform.com',
            password: 'WrongPass123',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid credentials');
      });

      it('PA-LOGIN-004: Missing email', async () => {
        const response = await request(app)
          .post('/api/auth/platform/login')
          .send({
            password: 'PlatformPass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('PA-LOGIN-005: Missing password', async () => {
        const response = await request(app)
          .post('/api/auth/platform/login')
          .send({
            email: 'admin@platform.com',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('PA-LOGIN-006: Empty request body', async () => {
        const response = await request(app)
          .post('/api/auth/platform/login')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('PA-LOGIN-007: Invalid email format', async () => {
        const response = await request(app)
          .post('/api/auth/platform/login')
          .send({
            email: 'invalid-email',
            password: 'PlatformPass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });
    });

    describe('Company Super Admin Login', () => {
      it('CSA-LOGIN-001: Valid super admin login', async () => {
        const response = await request(app)
          .post('/api/auth/super_admin/login')
          .send({
            email: 'ceo@test.com',
            password: 'SuperPass123',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.role).toBe('company_super_admin');
        expect(response.body.data.token).toBeDefined();
      });

      it('CSA-LOGIN-002: Wrong role login', async () => {
        const response = await request(app)
          .post('/api/auth/super_admin/login')
          .send({
            email: 'admin@test.com',
            password: 'AdminPass123',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid credentials or insufficient permissions');
      });
    });

    describe('Company Admin Login', () => {
      it('CA-LOGIN-001: Valid admin login', async () => {
        const response = await request(app)
          .post('/api/auth/admin/login')
          .send({
            email: 'admin@test.com',
            password: 'AdminPass123',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.role).toBe('company_admin');
        expect(response.body.data.token).toBeDefined();
      });

      it('CA-LOGIN-002: Employee trying admin login', async () => {
        const response = await request(app)
          .post('/api/auth/admin/login')
          .send({
            email: 'employee@test.com',
            password: 'EmployeePass123',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid credentials or insufficient permissions');
      });
    });

    describe('Employee Login', () => {
      it('EMP-LOGIN-001: Valid employee login', async () => {
        const response = await request(app)
          .post('/api/auth/user/login')
          .send({
            email: 'employee@test.com',
            password: 'EmployeePass123',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.role).toBe('employee');
        expect(response.body.data.token).toBeDefined();
      });

      it('EMP-LOGIN-002: Admin trying employee login', async () => {
        const response = await request(app)
          .post('/api/auth/user/login')
          .send({
            email: 'admin@test.com',
            password: 'AdminPass123',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid credentials or insufficient permissions');
      });
    });
  });

  describe('📝 Registration Endpoints', () => {
    describe('Platform Admin Registration', () => {
      it('PA-REG-001: Valid platform admin registration', async () => {
        const response = await request(app)
          .post('/api/auth/platform/register')
          .set('Authorization', `Bearer ${platformAdminToken}`)
          .send({
            firstName: 'New',
            lastName: 'Admin',
            email: 'newadmin@platform.com',
            password: 'NewPass123',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Platform admin registered successfully');
      });

      it('PA-REG-002: Duplicate email', async () => {
        const response = await request(app)
          .post('/api/auth/platform/register')
          .set('Authorization', `Bearer ${platformAdminToken}`)
          .send({
            firstName: 'Duplicate',
            lastName: 'Admin',
            email: 'admin@platform.com',
            password: 'NewPass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Platform admin with this email already exists');
      });

      it('PA-REG-003: Missing authentication', async () => {
        const response = await request(app)
          .post('/api/auth/platform/register')
          .send({
            firstName: 'New',
            lastName: 'Admin',
            email: 'newadmin@platform.com',
            password: 'NewPass123',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Access token required');
      });

      it('PA-REG-004: Wrong role authentication', async () => {
        const response = await request(app)
          .post('/api/auth/platform/register')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            firstName: 'New',
            lastName: 'Admin',
            email: 'newadmin@platform.com',
            password: 'NewPass123',
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Insufficient permissions');
      });

      it('PA-REG-005: Invalid email format', async () => {
        const response = await request(app)
          .post('/api/auth/platform/register')
          .set('Authorization', `Bearer ${platformAdminToken}`)
          .send({
            firstName: 'New',
            lastName: 'Admin',
            email: 'invalid-email',
            password: 'NewPass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('PA-REG-006: Weak password', async () => {
        const response = await request(app)
          .post('/api/auth/platform/register')
          .set('Authorization', `Bearer ${platformAdminToken}`)
          .send({
            firstName: 'New',
            lastName: 'Admin',
            email: 'newadmin@platform.com',
            password: '123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('PA-REG-007: Missing required fields', async () => {
        const response = await request(app)
          .post('/api/auth/platform/register')
          .set('Authorization', `Bearer ${platformAdminToken}`)
          .send({
            email: 'newadmin@platform.com',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });
    });

    describe('Company Super Admin Registration', () => {
      it('CSA-REG-001: Valid company registration', async () => {
        const response = await request(app)
          .post('/api/auth/super_admin/register')
          .send({
            companyName: 'New Corp',
            companyDomain: 'newcorp.com',
            firstName: 'John',
            lastName: 'Doe',
            email: 'ceo@newcorp.com',
            password: 'NewPass123',
            industry: 'Technology',
            companySize: '10-50',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Company registered successfully');
        expect(response.body.data.user.role).toBe('company_super_admin');
        expect(response.body.data.company.name).toBe('New Corp');
        expect(response.body.data.token).toBeDefined();
      });

      it('CSA-REG-002: Duplicate company domain', async () => {
        const response = await request(app)
          .post('/api/auth/super_admin/register')
          .send({
            companyName: 'Duplicate Corp',
            companyDomain: 'test.com',
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'ceo@duplicate.com',
            password: 'NewPass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Company domain already exists');
      });

      it('CSA-REG-003: Duplicate user email', async () => {
        const response = await request(app)
          .post('/api/auth/super_admin/register')
          .send({
            companyName: 'Another Corp',
            companyDomain: 'another.com',
            firstName: 'Bob',
            lastName: 'Smith',
            email: 'ceo@test.com',
            password: 'NewPass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('User with this email already exists');
      });

      it('CSA-REG-004: Missing company name', async () => {
        const response = await request(app)
          .post('/api/auth/super_admin/register')
          .send({
            companyDomain: 'test.com',
            firstName: 'John',
            lastName: 'Doe',
            email: 'ceo@test.com',
            password: 'NewPass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('CSA-REG-005: Missing company domain', async () => {
        const response = await request(app)
          .post('/api/auth/super_admin/register')
          .send({
            companyName: 'Test Corp',
            firstName: 'John',
            lastName: 'Doe',
            email: 'ceo@test.com',
            password: 'NewPass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });
    });

    describe('Company Admin Registration', () => {
      it('CA-REG-001: Valid admin registration', async () => {
        const response = await request(app)
          .post('/api/auth/admin/register')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'newadmin@test.com',
            password: 'NewPass123',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Company admin registered successfully');
      });

      it('CA-REG-002: Missing super admin token', async () => {
        const response = await request(app)
          .post('/api/auth/admin/register')
          .send({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'newadmin@test.com',
            password: 'NewPass123',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Access token required');
      });

      it('CA-REG-003: Wrong role token', async () => {
        const response = await request(app)
          .post('/api/auth/admin/register')
          .set('Authorization', `Bearer ${employeeToken}`)
          .send({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'newadmin@test.com',
            password: 'NewPass123',
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Insufficient permissions');
      });

      it('CA-REG-004: Duplicate email', async () => {
        const response = await request(app)
          .post('/api/auth/admin/register')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'admin@test.com',
            password: 'NewPass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('User with this email already exists');
      });
    });

    describe('Employee Registration', () => {
      it('EMP-REG-001: Valid employee registration', async () => {
        const response = await request(app)
          .post('/api/auth/user/register')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            firstName: 'Bob',
            lastName: 'Johnson',
            email: 'newemployee@test.com',
            password: 'NewPass123',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Employee registered successfully');
      });

      it('EMP-REG-002: Missing admin token', async () => {
        const response = await request(app)
          .post('/api/auth/user/register')
          .send({
            firstName: 'Bob',
            lastName: 'Johnson',
            email: 'newemployee@test.com',
            password: 'NewPass123',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Access token required');
      });

      it('EMP-REG-003: Wrong role token', async () => {
        const response = await request(app)
          .post('/api/auth/user/register')
          .set('Authorization', `Bearer ${employeeToken}`)
          .send({
            firstName: 'Bob',
            lastName: 'Johnson',
            email: 'newemployee@test.com',
            password: 'NewPass123',
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Insufficient permissions');
      });

      it('EMP-REG-004: Duplicate email', async () => {
        const response = await request(app)
          .post('/api/auth/user/register')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            firstName: 'Bob',
            lastName: 'Johnson',
            email: 'employee@test.com',
            password: 'NewPass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('User with this email already exists');
      });
    });
  });

  describe('🔑 Password Management', () => {
    describe('Forgot Password', () => {
      it('FP-001: Valid email', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({
            email: 'employee@test.com',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('If the email exists, a password reset link has been sent');
      });

      it('FP-002: Invalid email format', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({
            email: 'invalid-email',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('FP-003: Missing email', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('FP-004: Non-existent email', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({
            email: 'nonexistent@email.com',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('If the email exists, a password reset link has been sent');
      });
    });

    describe('Reset Password', () => {
      let resetToken: string;

      beforeAll(async () => {
        // Generate a reset token for testing
        const user = await db
          .select()
          .from(users)
          .where(sql`email = 'employee@test.com'`)
          .limit(1);

        if (user.length > 0) {
          resetToken = 'test-reset-token';
          await db
            .update(users)
            .set({
              passwordResetToken: resetToken,
              passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour from now
            })
            .where(sql`id = ${user[0].id}`);
        }
      });

      it('RP-001: Valid reset token', async () => {
        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({
            token: resetToken,
            password: 'NewPass123',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Password reset successful');
      });

      it('RP-002: Invalid token', async () => {
        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({
            token: 'invalid-token',
            password: 'NewPass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid or expired reset token');
      });

      it('RP-003: Missing token', async () => {
        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({
            password: 'NewPass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('RP-004: Missing password', async () => {
        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({
            token: resetToken,
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('RP-005: Weak password', async () => {
        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({
            token: resetToken,
            password: '123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });
    });
  });

  describe('🎫 Token Management', () => {
    describe('Token Verification', () => {
      it('TV-001: Valid token', async () => {
        const response = await request(app)
          .post('/api/auth/verify-token')
          .send({
            token: platformAdminToken,
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      });

      it('TV-002: Invalid token', async () => {
        const response = await request(app)
          .post('/api/auth/verify-token')
          .send({
            token: 'invalid-token',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(false);
      });

      it('TV-003: Missing token', async () => {
        const response = await request(app)
          .post('/api/auth/verify-token')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('TV-004: Malformed token', async () => {
        const response = await request(app)
          .post('/api/auth/verify-token')
          .send({
            token: 'malformed.token',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Token Refresh', () => {
      it('TR-001: Valid token refresh', async () => {
        const response = await request(app)
          .post('/api/auth/refresh')
          .set('Authorization', `Bearer ${platformAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.token).toBeDefined();
      });

      it('TR-002: Missing token', async () => {
        const response = await request(app)
          .post('/api/auth/refresh');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Access token required');
      });

      it('TR-003: Invalid token', async () => {
        const response = await request(app)
          .post('/api/auth/refresh')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid or expired token');
      });
    });

    describe('Get Current User', () => {
      it('CU-001: Valid user request', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${platformAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.email).toBe('admin@platform.com');
      });

      it('CU-002: Missing token', async () => {
        const response = await request(app)
          .get('/api/auth/me');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Access token required');
      });

      it('CU-003: Invalid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid or expired token');
      });
    });

    describe('Logout', () => {
      it('LO-001: Valid logout', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${platformAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Logout successful');
      });

      it('LO-002: Missing token', async () => {
        const response = await request(app)
          .post('/api/auth/logout');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Access token required');
      });

      it('LO-003: Invalid token', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid or expired token');
      });
    });
  });

  describe('🏢 Platform Management', () => {
    describe('Get Companies', () => {
      it('PC-001: Valid request', async () => {
        const response = await request(app)
          .get('/api/platform/companies')
          .set('Authorization', `Bearer ${platformAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.companies).toBeDefined();
        expect(response.body.data.pagination).toBeDefined();
      });

      it('PC-002: With search', async () => {
        const response = await request(app)
          .get('/api/platform/companies?search=test')
          .set('Authorization', `Bearer ${platformAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.companies).toBeDefined();
      });

      it('PC-003: With pagination', async () => {
        const response = await request(app)
          .get('/api/platform/companies?page=1&limit=5')
          .set('Authorization', `Bearer ${platformAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.companies).toBeDefined();
        expect(response.body.data.pagination.page).toBe(1);
        expect(response.body.data.pagination.limit).toBe(5);
      });

      it('PC-004: Missing token', async () => {
        const response = await request(app)
          .get('/api/platform/companies');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Access token required');
      });

      it('PC-005: Wrong role', async () => {
        const response = await request(app)
          .get('/api/platform/companies')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Insufficient permissions');
      });
    });

    describe('Create Company', () => {
      it('CC-001: Valid company creation', async () => {
        const response = await request(app)
          .post('/api/platform/companies')
          .set('Authorization', `Bearer ${platformAdminToken}`)
          .send({
            name: 'New Platform Company',
            domain: 'newplatform.com',
            industry: 'Technology',
            companySize: '50-100',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Company created successfully');
      });

      it('CC-002: Duplicate domain', async () => {
        const response = await request(app)
          .post('/api/platform/companies')
          .set('Authorization', `Bearer ${platformAdminToken}`)
          .send({
            name: 'Duplicate Company',
            domain: 'test.com',
            industry: 'Technology',
            companySize: '10-50',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Company domain already exists');
      });

      it('CC-003: Missing required fields', async () => {
        const response = await request(app)
          .post('/api/platform/companies')
          .set('Authorization', `Bearer ${platformAdminToken}`)
          .send({
            name: 'Test Company',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('CC-004: Wrong role', async () => {
        const response = await request(app)
          .post('/api/platform/companies')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Test Company',
            domain: 'test.com',
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Insufficient permissions');
      });
    });

    describe('Get Subscriptions', () => {
      it('PS-001: Valid request', async () => {
        const response = await request(app)
          .get('/api/platform/subscriptions')
          .set('Authorization', `Bearer ${platformAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.subscriptions).toBeDefined();
        expect(response.body.data.pagination).toBeDefined();
      });

      it('PS-002: With status filter', async () => {
        const response = await request(app)
          .get('/api/platform/subscriptions?status=active')
          .set('Authorization', `Bearer ${platformAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.subscriptions).toBeDefined();
      });

      it('PS-003: With pagination', async () => {
        const response = await request(app)
          .get('/api/platform/subscriptions?page=1&limit=10')
          .set('Authorization', `Bearer ${platformAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.subscriptions).toBeDefined();
        expect(response.body.data.pagination.page).toBe(1);
        expect(response.body.data.pagination.limit).toBe(10);
      });

      it('PS-004: Missing token', async () => {
        const response = await request(app)
          .get('/api/platform/subscriptions');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Access token required');
      });

      it('PS-005: Wrong role', async () => {
        const response = await request(app)
          .get('/api/platform/subscriptions')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Insufficient permissions');
      });
    });
  });

  describe('🛡️ Security & Middleware Tests', () => {
    describe('Authentication Middleware', () => {
      it('AUTH-001: Valid Bearer token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${platformAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('AUTH-002: Missing Authorization header', async () => {
        const response = await request(app)
          .get('/api/auth/me');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Access token required');
      });

      it('AUTH-003: Invalid token format', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'InvalidFormat');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid or expired token');
      });

      it('AUTH-004: Malformed JWT', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer malformed.jwt');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid or expired token');
      });
    });

    describe('Role-Based Authorization', () => {
      it('RBAC-001: Platform admin access', async () => {
        const response = await request(app)
          .get('/api/platform/companies')
          .set('Authorization', `Bearer ${platformAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('RBAC-002: Company admin access', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('RBAC-003: Employee access', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('RBAC-004: Wrong role access', async () => {
        const response = await request(app)
          .get('/api/platform/companies')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Insufficient permissions');
      });

      it('RBAC-005: No token', async () => {
        const response = await request(app)
          .get('/api/platform/companies');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Access token required');
      });
    });
  });

  describe('⚠️ Error Handling Tests', () => {
    describe('Validation Errors', () => {
      it('VAL-001: Invalid email format', async () => {
        const response = await request(app)
          .post('/api/auth/platform/login')
          .send({
            email: 'invalid',
            password: 'ValidPass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
        expect(response.body.errors).toBeDefined();
      });

      it('VAL-002: Password too short', async () => {
        const response = await request(app)
          .post('/api/auth/platform/register')
          .set('Authorization', `Bearer ${platformAdminToken}`)
          .send({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@test.com',
            password: '123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
        expect(response.body.errors).toBeDefined();
      });

      it('VAL-003: Missing required field', async () => {
        const response = await request(app)
          .post('/api/auth/platform/register')
          .set('Authorization', `Bearer ${platformAdminToken}`)
          .send({
            email: 'test@test.com',
            password: 'ValidPass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
        expect(response.body.errors).toBeDefined();
      });
    });
  });

  describe('🔍 Edge Cases & Security Tests', () => {
    describe('SQL Injection Tests', () => {
      it('SQL-001: Email field injection', async () => {
        const response = await request(app)
          .post('/api/auth/platform/login')
          .send({
            email: "admin@test.com'; DROP TABLE users; --",
            password: 'ValidPass123',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid credentials');
      });

      it('SQL-002: Password field injection', async () => {
        const response = await request(app)
          .post('/api/auth/platform/login')
          .send({
            email: 'admin@platform.com',
            password: "'; SELECT * FROM users; --",
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid credentials');
      });
    });

    describe('XSS Tests', () => {
      it('XSS-001: Script in email', async () => {
        const response = await request(app)
          .post('/api/auth/platform/login')
          .send({
            email: "<script>alert('xss')</script>@test.com",
            password: 'ValidPass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('XSS-002: Script in name', async () => {
        const response = await request(app)
          .post('/api/auth/platform/register')
          .set('Authorization', `Bearer ${platformAdminToken}`)
          .send({
            firstName: "<script>alert('xss')</script>",
            lastName: 'Test',
            email: 'test@test.com',
            password: 'ValidPass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });
    });

    describe('Input Length Tests', () => {
      it('LEN-001: Very long email', async () => {
        const response = await request(app)
          .post('/api/auth/platform/login')
          .send({
            email: 'a'.repeat(1000) + '@test.com',
            password: 'ValidPass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('LEN-002: Very long password', async () => {
        const response = await request(app)
          .post('/api/auth/platform/login')
          .send({
            email: 'admin@platform.com',
            password: 'a'.repeat(10000),
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });
    });
  });

  describe('📊 Performance Tests', () => {
    describe('Load Testing', () => {
      it('PERF-001: Multiple concurrent logins', async () => {
        const promises = Array.from({ length: 10 }, () =>
          request(app)
            .post('/api/auth/platform/login')
            .send({
              email: 'admin@platform.com',
              password: 'PlatformPass123',
            })
        );

        const responses = await Promise.all(promises);
        
        responses.forEach(response => {
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        });
      }, 10000);

      it('PERF-002: Multiple concurrent registrations', async () => {
        const promises = Array.from({ length: 5 }, (_, i) =>
          request(app)
            .post('/api/auth/super_admin/register')
            .send({
              companyName: `Test Company ${i}`,
              companyDomain: `test${i}.com`,
              firstName: 'Test',
              lastName: 'User',
              email: `test${i}@test.com`,
              password: 'ValidPass123',
            })
        );

        const responses = await Promise.all(promises);
        
        responses.forEach(response => {
          expect(response.status).toBe(201);
          expect(response.body.success).toBe(true);
        });
      }, 15000);
    });
  });

  describe('🧪 Integration Tests', () => {
    describe('End-to-End Workflows', () => {
      it('E2E-001: Complete registration flow', async () => {
        // Step 1: Register company
        const companyResponse = await request(app)
          .post('/api/auth/super_admin/register')
          .send({
            companyName: 'E2E Test Company',
            companyDomain: 'e2etest.com',
            firstName: 'E2E',
            lastName: 'CEO',
            email: 'ceo@e2etest.com',
            password: 'E2EPass123',
          });

        expect(companyResponse.status).toBe(201);
        expect(companyResponse.body.success).toBe(true);
        const companyToken = companyResponse.body.data.token;

        // Step 2: Login as super admin
        const loginResponse = await request(app)
          .post('/api/auth/super_admin/login')
          .send({
            email: 'ceo@e2etest.com',
            password: 'E2EPass123',
          });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.success).toBe(true);

        // Step 3: Create admin
        const adminResponse = await request(app)
          .post('/api/auth/admin/register')
          .set('Authorization', `Bearer ${companyToken}`)
          .send({
            firstName: 'E2E',
            lastName: 'Admin',
            email: 'admin@e2etest.com',
            password: 'E2EPass123',
          });

        expect(adminResponse.status).toBe(201);
        expect(adminResponse.body.success).toBe(true);

        // Step 4: Login as admin
        const adminLoginResponse = await request(app)
          .post('/api/auth/admin/login')
          .send({
            email: 'admin@e2etest.com',
            password: 'E2EPass123',
          });

        expect(adminLoginResponse.status).toBe(200);
        expect(adminLoginResponse.body.success).toBe(true);
        const adminToken = adminLoginResponse.body.data.token;

        // Step 5: Create employee
        const employeeResponse = await request(app)
          .post('/api/auth/user/register')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            firstName: 'E2E',
            lastName: 'Employee',
            email: 'employee@e2etest.com',
            password: 'E2EPass123',
          });

        expect(employeeResponse.status).toBe(201);
        expect(employeeResponse.body.success).toBe(true);
      }, 20000);
    });
  });
});

