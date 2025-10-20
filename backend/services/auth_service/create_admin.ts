import { db } from './src/config/database';
import { users, companies } from './src/db/schema';
import { hashPassword } from './src/utils/bcrypt';
import { logger } from './src/utils/logger';
import { eq } from 'drizzle-orm';

async function createPlatformAdmin() {
  try {
    logger.info('Creating platform admin...');

    // Check if platform admin already exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@platform.com'))
      .limit(1);

    if (existingAdmin) {
      logger.info('Platform admin already exists');
      console.log('✅ Platform admin already exists');
      console.log('📧 Email: admin@platform.com');
      console.log('🔑 Password: AdminPass123!');
      return;
    }

    // Create platform company first
    const [platformCompany] = await db
      .insert(companies)
      .values({
        name: 'Germy Platform',
        domain: 'platform.germy.com',
        industry: 'Technology',
        companySize: '1-10',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info('Platform company created', { id: platformCompany.id });

    // Create platform admin with proper companyId
    const hashedPassword = await hashPassword('AdminPass123!');
    const [platformAdmin] = await db
      .insert(users)
      .values({
        companyId: platformCompany.id, // Use proper UUID
        email: 'admin@platform.com',
        passwordHash: hashedPassword,
        firstName: 'Platform',
        lastName: 'Admin',
        role: 'platform_admin',
        approvalStatus: 'approved',
        mobileAppAccess: false,
        dashboardAccess: false,
        platformPanelAccess: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info('Platform admin created successfully', {
      id: platformAdmin.id,
      email: platformAdmin.email,
      companyId: platformAdmin.companyId,
    });

    console.log('✅ Platform admin created successfully');
    console.log('📧 Email: admin@platform.com');
    console.log('🔑 Password: AdminPass123!');
    console.log('🆔 User ID:', platformAdmin.id);
    console.log('🏢 Company ID:', platformAdmin.companyId);

  } catch (error) {
    logger.error('Failed to create platform admin:', error);
    console.error('❌ Failed to create platform admin:', error);
  }
}


createPlatformAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
