import request from 'supertest';
import { db } from '../../src/config/database';
import { companies, users, platformAdmins } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

export class TestHelpers {
  static async cleanupDatabase() {
    try {
      // Clean up in reverse order of dependencies
      await db.delete(users);
      await db.delete(companies);
      await db.delete(platformAdmins);
    } catch (error) {
      console.error('Error cleaning up database:', error);
    }
  }

  static async createTestCompany(companyData: any = {}) {
    const defaultData = {
      name: 'Test Company',
      domain: 'testcompany.com',
      industry: 'Technology',
      companySize: '10-50',
      timezone: 'UTC',
      ...companyData
    };

    const [company] = await db.insert(companies).values(defaultData).returning();
    return company;
  }

  static async createTestUser(userData: any = {}) {
    const defaultData = {
      email: 'test@testcompany.com',
      passwordHash: '$2a$10$test.hash.for.testing',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee',
      companyId: 'test-company-id',
      isActive: true,
      ...userData
    };

    const [user] = await db.insert(users).values(defaultData).returning();
    return user;
  }

  static async createTestPlatformAdmin(adminData: any = {}) {
    const defaultData = {
      email: 'admin@platform.com',
      passwordHash: '$2a$10$test.hash.for.testing',
      firstName: 'Platform',
      lastName: 'Admin',
      isActive: true,
      ...adminData
    };

    const [admin] = await db.insert(platformAdmins).values(defaultData).returning();
    return admin;
  }

  static async makeRequest(method: 'get' | 'post' | 'put' | 'delete', endpoint: string, data?: any, token?: string) {
    // This will be implemented when we have the app instance
    throw new Error('makeRequest not implemented - app instance needed');
  }
}
