import { db } from '../config/database';
import { platformAdmins } from '../db/schema';
import { hashPassword } from '../utils/bcrypt';
import { logger } from '../utils/logger';
import { eq } from 'drizzle-orm';

/**
 * Database seeding script for initial platform admin
 * Run this script to create the first platform admin user
 */
export async function seedPlatformAdmin() {
  try {
    logger.info('Starting database seeding...');

    // Check if platform admin already exists
    const [existingAdmin] = await db
      .select()
      .from(platformAdmins)
      .where(eq(platformAdmins.email, 'admin@platform.com'))
      .limit(1);

    if (existingAdmin) {
      logger.info('Platform admin already exists, skipping seed');
      return {
        success: true,
        message: 'Platform admin already exists',
        admin: {
          id: existingAdmin.id,
          email: existingAdmin.email,
          firstName: existingAdmin.firstName,
          lastName: existingAdmin.lastName,
        },
      };
    }

    // Create initial platform admin
    const hashedPassword = await hashPassword('AdminPass123!');
    const [platformAdmin] = await db
      .insert(platformAdmins)
      .values({
        email: 'admin@platform.com',
        passwordHash: hashedPassword,
        firstName: 'Platform',
        lastName: 'Admin',
        role: 'platform_admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info('Platform admin seeded successfully', {
      id: platformAdmin.id,
      email: platformAdmin.email,
    });

    return {
      success: true,
      message: 'Platform admin created successfully',
      admin: {
        id: platformAdmin.id,
        email: platformAdmin.email,
        firstName: platformAdmin.firstName,
        lastName: platformAdmin.lastName,
        role: platformAdmin.role,
      },
      credentials: {
        email: 'admin@platform.com',
        password: 'AdminPass123!',
        note: 'Please change this password after first login',
      },
    };
  } catch (error) {
    logger.error('Database seeding failed:', error);
    return {
      success: false,
      message: 'Failed to seed platform admin',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Seed additional test data for development
 */
export async function seedTestData() {
  try {
    logger.info('Seeding test data...');

    // Add more test platform admins if needed
    const testAdmins = [
      {
        email: 'test1@platform.com',
        firstName: 'Test',
        lastName: 'Admin 1',
        password: 'TestPass123!',
      },
      {
        email: 'test2@platform.com',
        firstName: 'Test',
        lastName: 'Admin 2',
        password: 'TestPass123!',
      },
    ];

    for (const admin of testAdmins) {
      const [existing] = await db
        .select()
        .from(platformAdmins)
        .where(eq(platformAdmins.email, admin.email))
        .limit(1);

      if (!existing) {
        const hashedPassword = await hashPassword(admin.password);
        await db.insert(platformAdmins).values({
          email: admin.email,
          passwordHash: hashedPassword,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: 'platform_admin',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        logger.info(`Test admin created: ${admin.email}`);
      }
    }

    logger.info('Test data seeding completed');
    return { success: true, message: 'Test data seeded successfully' };
  } catch (error) {
    logger.error('Test data seeding failed:', error);
    return { success: false, message: 'Failed to seed test data', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Main seeding function
 */
export async function runSeeding() {
  try {
    logger.info('=== Starting Database Seeding ===');

    // Seed platform admin
    const platformResult = await seedPlatformAdmin();
    if (!platformResult.success) {
      throw new Error(platformResult.message);
    }

    // Seed test data in development
    if (process.env.NODE_ENV === 'development') {
      await seedTestData();
    }

    logger.info('=== Database Seeding Completed Successfully ===');
    return {
      success: true,
      message: 'Database seeding completed',
      results: {
        platformAdmin: platformResult,
      },
    };
  } catch (error) {
    logger.error('Seeding process failed:', error);
    return {
      success: false,
      message: 'Seeding process failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  runSeeding()
    .then((result) => {
      if (result.success) {
        console.log('✅ Seeding completed successfully');
        console.log('📧 Platform Admin Email: admin@platform.com');
        console.log('🔑 Platform Admin Password: AdminPass123!');
        console.log('⚠️  Please change the password after first login');
        process.exit(0);
      } else {
        console.error('❌ Seeding failed:', result.message);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Seeding error:', error);
      process.exit(1);
    });
}

