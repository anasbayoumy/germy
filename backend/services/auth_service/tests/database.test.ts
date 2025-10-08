import { TestHelpers } from './utils/testHelpers';
import { db } from '../src/config/database';
import { companies, users, platformAdmins, subscriptionPlans, companySubscriptions } from '../src/db/schema';
import { eq, count, sql } from 'drizzle-orm';

describe('Database Tests', () => {
  beforeAll(async () => {
    await TestHelpers.cleanupDatabase();
  });

  afterAll(async () => {
    await TestHelpers.cleanupDatabase();
  });

  describe('Database Connection', () => {
    test('should connect to database successfully', async () => {
      try {
        const result = await db.execute(sql`SELECT 1 as test`);
        expect(result).toBeDefined();
      } catch (error) {
        fail('Database connection failed: ' + error);
      }
    });

    test('should have all required tables', async () => {
      const tables = [
        'platform_admins',
        'subscription_plans', 
        'companies',
        'company_subscriptions',
        'users',
        'audit_logs',
        'notifications'
      ];

      for (const table of tables) {
        try {
          await db.execute(sql`SELECT 1 FROM ${sql.identifier(table)} LIMIT 1`);
        } catch (error) {
          fail(`Table ${table} does not exist or is not accessible`);
        }
      }
    });
  });

  describe('Companies Table', () => {
    test('should create company successfully', async () => {
      const companyData = {
        name: 'Test Company DB',
        domain: 'testcompanydb.com',
        industry: 'Technology',
        companySize: '10-50',
        timezone: 'UTC'
      };

      const [company] = await db.insert(companies).values(companyData).returning();
      
      expect(company).toBeDefined();
      expect(company.name).toBe(companyData.name);
      expect(company.domain).toBe(companyData.domain);
      expect(company.industry).toBe(companyData.industry);
      expect(company.companySize).toBe(companyData.companySize);
      expect(company.timezone).toBe(companyData.timezone);
      expect(company.isActive).toBe(true);
      expect(company.id).toBeDefined();
      expect(company.createdAt).toBeDefined();
      expect(company.updatedAt).toBeDefined();
    });

    test('should enforce unique domain constraint', async () => {
      const companyData = {
        name: 'Duplicate Domain Company',
        domain: 'testcompanydb.com', // Same domain as previous test
        industry: 'Technology',
        companySize: '10-50',
        timezone: 'UTC'
      };

      try {
        await db.insert(companies).values(companyData);
        fail('Should have thrown an error for duplicate domain');
      } catch (error) {
        expect(error).toBeDefined();
        // Should be a unique constraint violation
      }
    });

    test('should update company successfully', async () => {
      const [company] = await db.select().from(companies).where(eq(companies.domain, 'testcompanydb.com')).limit(1);
      
      const updateData = {
        name: 'Updated Test Company',
        industry: 'Healthcare'
      };

      const [updatedCompany] = await db
        .update(companies)
        .set(updateData)
        .where(eq(companies.id, company.id))
        .returning();

      expect(updatedCompany.name).toBe(updateData.name);
      expect(updatedCompany.industry).toBe(updateData.industry);
      expect(updatedCompany.updatedAt.getTime()).toBeGreaterThan(company.updatedAt.getTime());
    });

    test('should query companies with pagination', async () => {
      const result = await db
        .select()
        .from(companies)
        .limit(10)
        .offset(0);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Users Table', () => {
    let testCompany: any;

    beforeAll(async () => {
      testCompany = await TestHelpers.createTestCompany({
        name: 'User Test Company',
        domain: 'usertestcompany.com'
      });
    });

    test('should create user successfully', async () => {
      const userData = {
        email: 'dbtest@usertestcompany.com',
        passwordHash: '$2a$10$test.hash.for.database.testing',
        firstName: 'DB',
        lastName: 'Test',
        role: 'employee',
        companyId: testCompany.id,
        isActive: true
      };

      const [user] = await db.insert(users).values(userData).returning();
      
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.role).toBe(userData.role);
      expect(user.companyId).toBe(userData.companyId);
      expect(user.isActive).toBe(userData.isActive);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    test('should enforce unique email constraint', async () => {
      const userData = {
        email: 'dbtest@usertestcompany.com', // Same email as previous test
        passwordHash: '$2a$10$test.hash.for.database.testing',
        firstName: 'Duplicate',
        lastName: 'User',
        role: 'employee',
        companyId: testCompany.id,
        isActive: true
      };

      try {
        await db.insert(users).values(userData);
        fail('Should have thrown an error for duplicate email');
      } catch (error) {
        expect(error).toBeDefined();
        // Should be a unique constraint violation
      }
    });

    test('should query users by company', async () => {
      const companyUsers = await db
        .select()
        .from(users)
        .where(eq(users.companyId, testCompany.id));

      expect(Array.isArray(companyUsers)).toBe(true);
      expect(companyUsers.length).toBeGreaterThan(0);
      expect(companyUsers.every(user => user.companyId === testCompany.id)).toBe(true);
    });
  });

  describe('Platform Admins Table', () => {
    test('should create platform admin successfully', async () => {
      const adminData = {
        email: 'dbtest@platform.com',
        passwordHash: '$2a$10$test.hash.for.database.testing',
        firstName: 'Platform',
        lastName: 'Admin',
        isActive: true
      };

      const [admin] = await db.insert(platformAdmins).values(adminData).returning();
      
      expect(admin).toBeDefined();
      expect(admin.email).toBe(adminData.email);
      expect(admin.firstName).toBe(adminData.firstName);
      expect(admin.lastName).toBe(adminData.lastName);
      expect(admin.isActive).toBe(adminData.isActive);
      expect(admin.id).toBeDefined();
      expect(admin.createdAt).toBeDefined();
      expect(admin.updatedAt).toBeDefined();
    });
  });

  describe('Subscription Plans Table', () => {
    test('should have default subscription plans', async () => {
      const plans = await db.select().from(subscriptionPlans);
      
      expect(Array.isArray(plans)).toBe(true);
      expect(plans.length).toBeGreaterThan(0);
      
      // Check for common plan types
      const planNames = plans.map(plan => plan.name);
      expect(planNames).toContain('Basic');
      expect(planNames).toContain('Professional');
      expect(planNames).toContain('Enterprise');
    });
  });

  describe('Company Subscriptions Table', () => {
    let testCompany: any;
    let testPlan: any;

    beforeAll(async () => {
      testCompany = await TestHelpers.createTestCompany({
        name: 'Subscription Test Company',
        domain: 'subscriptiontestcompany.com'
      });
      
      const plans = await db.select().from(subscriptionPlans).limit(1);
      testPlan = plans[0];
    });

    test('should create company subscription successfully', async () => {
      const subscriptionData = {
        companyId: testCompany.id,
        planId: testPlan.id,
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };

      const [subscription] = await db.insert(companySubscriptions).values(subscriptionData).returning();
      
      expect(subscription).toBeDefined();
      expect(subscription.companyId).toBe(subscriptionData.companyId);
      expect(subscription.planId).toBe(subscriptionData.planId);
      expect(subscription.status).toBe(subscriptionData.status);
      expect(subscription.billingCycle).toBe(subscriptionData.billingCycle);
      expect(subscription.id).toBeDefined();
      expect(subscription.createdAt).toBeDefined();
      expect(subscription.updatedAt).toBeDefined();
    });
  });

  describe('Database Relationships', () => {
    test('should maintain referential integrity', async () => {
      // Try to create a user with non-existent company ID
      const userData = {
        email: 'integritytest@nonexistent.com',
        passwordHash: '$2a$10$test.hash.for.database.testing',
        firstName: 'Integrity',
        lastName: 'Test',
        role: 'employee',
        companyId: 'non-existent-company-id',
        isActive: true
      };

      try {
        await db.insert(users).values(userData);
        fail('Should have thrown an error for non-existent company ID');
      } catch (error) {
        expect(error).toBeDefined();
        // Should be a foreign key constraint violation
      }
    });

    test('should cascade deletes properly', async () => {
      // Create a company and user
      const company = await TestHelpers.createTestCompany({
        name: 'Cascade Test Company',
        domain: 'cascadetestcompany.com'
      });
      
      const user = await TestHelpers.createTestUser({
        companyId: company.id,
        email: 'cascadetest@cascadetestcompany.com'
      });

      // Delete the company
      await db.delete(companies).where(eq(companies.id, company.id));

      // Check if user still exists (should be deleted or have null companyId)
      const remainingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      // Depending on your schema setup, user might be deleted or companyId set to null
      expect(remainingUser.length).toBe(0); // Assuming CASCADE DELETE
    });
  });

  describe('Database Performance', () => {
    test('should handle multiple concurrent operations', async () => {
      const operations = Array(10).fill(null).map(async (_, index) => {
        const company = await TestHelpers.createTestCompany({
          name: `Concurrent Company ${index}`,
          domain: `concurrent${index}.com`
        });
        return company;
      });

      const results = await Promise.all(operations);
      expect(results).toHaveLength(10);
      expect(results.every(company => company.id)).toBe(true);
    });

    test('should perform efficient queries with indexes', async () => {
      const startTime = Date.now();
      
      // Query that should use indexes
      const companiesResult = await db
        .select()
        .from(companies)
        .where(eq(companies.isActive, true))
        .limit(100);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(companiesResult).toBeDefined();
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
