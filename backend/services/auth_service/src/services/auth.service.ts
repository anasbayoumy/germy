import { eq, and, gt } from 'drizzle-orm';
import { db } from '../config/database';
import { users, companies, auditLogs, platformAdmins } from '../db/schema';
import { logger } from '../utils/logger';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateToken, verifyToken } from './jwt.service';
import { v4 as uuidv4 } from 'uuid';
import { 
  RegisterData, 
  PlatformAdminRegisterData, 
  CompanySuperAdminRegisterData, 
  CompanyAdminRegisterData, 
  EmployeeRegisterData 
} from '../types/auth.types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  data?: {
    user: any;
    company?: any;
    token?: string;
  };
}

export class AuthService {

  // Platform Super Admin Login
  async loginPlatformAdmin(credentials: LoginCredentials, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      const platformAdmin = await db
        .select()
        .from(platformAdmins)
        .where(eq(platformAdmins.email, credentials.email))
        .limit(1);

      if (platformAdmin.length === 0) {
        return {
          success: false,
          message: 'Invalid credentials',
        };
      }

      const admin = platformAdmin[0];

      // Check if admin is active
      if (!admin.isActive) {
        return {
          success: false,
          message: 'Account is deactivated',
        };
      }

      // Verify password
      const isValidPassword = await comparePassword(credentials.password, admin.passwordHash);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Invalid credentials',
        };
      }

      // Update last login
      await db
        .update(platformAdmins)
        .set({ lastLogin: new Date() })
        .where(eq(platformAdmins.id, admin.id));

      // Generate JWT token
      const token = generateToken({
        userId: admin.id,
        companyId: 'platform', // Special identifier for platform admins
        role: 'platform_super_admin',
      });

      // Log the login
      await this.logAuditEvent({
        userId: admin.id,
        companyId: 'platform',
        action: 'platform_admin_login',
        resourceType: 'platform_admin',
        resourceId: admin.id,
        ipAddress,
        userAgent,
      });

      logger.info(`Platform admin logged in: ${admin.email}`);

      return {
        success: true,
        message: 'Platform admin login successful',
        data: {
          user: {
            id: admin.id,
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName,
            role: 'platform_super_admin',
            companyName: 'Platform',
          },
          token,
        },
      };
    } catch (error) {
      logger.error('Platform admin login error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Company User Login (for specific roles)
  async loginCompanyUser(credentials: LoginCredentials, targetRole: string, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      // Find user with company info and specific role
      const user = await db
        .select({
          id: users.id,
          email: users.email,
          passwordHash: users.passwordHash,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          companyId: users.companyId,
          isActive: users.isActive,
          isVerified: users.isVerified,
          companyName: companies.name,
          companyActive: companies.isActive,
        })
        .from(users)
        .innerJoin(companies, eq(users.companyId, companies.id))
        .where(
          and(
            eq(users.email, credentials.email),
            eq(users.role, targetRole)
          )
        )
        .limit(1);

      if (user.length === 0) {
        return {
          success: false,
          message: 'Invalid credentials or insufficient permissions',
        };
      }

      const userData = user[0];

      // Check if user is active
      if (!userData.isActive) {
        return {
          success: false,
          message: 'Account is deactivated',
        };
      }

      // Check if company is active
      if (!userData.companyActive) {
        return {
          success: false,
          message: 'Company account is deactivated',
        };
      }

      // Verify password
      if (!userData.passwordHash) {
        return {
          success: false,
          message: 'Invalid credentials',
        };
      }

      const isValidPassword = await comparePassword(credentials.password, userData.passwordHash);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Invalid credentials',
        };
      }

      // Update last login
      await db
        .update(users)
        .set({ lastLogin: new Date() })
        .where(eq(users.id, userData.id));

      // Generate JWT token
      const token = generateToken({
        userId: userData.id,
        companyId: userData.companyId,
        role: userData.role,
      });

      // Log the login
      await this.logAuditEvent({
        userId: userData.id,
        companyId: userData.companyId,
        action: `${targetRole}_login`,
        resourceType: 'user',
        resourceId: userData.id,
        ipAddress,
        userAgent,
      });

      logger.info(`${targetRole} logged in: ${userData.email} from company ${userData.companyName}`);

      return {
        success: true,
        message: `${targetRole} login successful`,
        data: {
          user: {
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            companyName: userData.companyName,
          },
          token,
        },
      };
    } catch (error) {
      logger.error(`${targetRole} login error:`, error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Legacy login method (for backward compatibility)
  async login(credentials: LoginCredentials, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      // Find user with company info
      const user = await db
        .select({
          id: users.id,
          email: users.email,
          passwordHash: users.passwordHash,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          companyId: users.companyId,
          isActive: users.isActive,
          isVerified: users.isVerified,
          companyName: companies.name,
          companyActive: companies.isActive,
        })
        .from(users)
        .innerJoin(companies, eq(users.companyId, companies.id))
        .where(eq(users.email, credentials.email))
        .limit(1);

      if (user.length === 0) {
        return {
          success: false,
          message: 'Invalid credentials',
        };
      }

      const userData = user[0];

      // Check if user is active
      if (!userData.isActive) {
        return {
          success: false,
          message: 'Account is deactivated',
        };
      }

      // Check if company is active
      if (!userData.companyActive) {
        return {
          success: false,
          message: 'Company account is deactivated',
        };
      }

      // Verify password
      if (!userData.passwordHash) {
        return {
          success: false,
          message: 'Invalid credentials',
        };
      }

      const isValidPassword = await comparePassword(credentials.password, userData.passwordHash);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Invalid credentials',
        };
      }

      // Update last login
      await db
        .update(users)
        .set({ lastLogin: new Date() })
        .where(eq(users.id, userData.id));

      // Generate JWT token
      const token = generateToken({
        userId: userData.id,
        companyId: userData.companyId,
        role: userData.role,
      });

      // Log the login
      await this.logAuditEvent({
        userId: userData.id,
        companyId: userData.companyId,
        action: 'login',
        resourceType: 'user',
        resourceId: userData.id,
        ipAddress,
        userAgent,
      });

      logger.info(`User logged in: ${userData.email} from company ${userData.companyName}`);

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            companyName: userData.companyName,
          },
          token,
        },
      };
    } catch (error) {
      logger.error('Login error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Platform Admin Registration (only existing platform admins can create new ones)
  async registerPlatformAdmin(data: PlatformAdminRegisterData, createdBy: string, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      // Check if platform admin email already exists
      const existingAdmin = await db
        .select()
        .from(platformAdmins)
        .where(eq(platformAdmins.email, data.email))
        .limit(1);

      if (existingAdmin.length > 0) {
        return {
          success: false,
          message: 'Platform admin with this email already exists',
        };
      }

      // Create platform admin
      const hashedPassword = await hashPassword(data.password);
      const [platformAdmin] = await db
        .insert(platformAdmins)
        .values({
          email: data.email,
          passwordHash: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'platform_super_admin',
        })
        .returning();

      // Log the registration
      await this.logAuditEvent({
        userId: createdBy,
        companyId: 'platform',
        action: 'create_platform_admin',
        resourceType: 'platform_admin',
        resourceId: platformAdmin.id,
        ipAddress,
        userAgent,
      });

      logger.info(`Platform admin created: ${platformAdmin.email} by ${createdBy}`);

      return {
        success: true,
        message: 'Platform admin registered successfully',
        data: {
          user: {
            id: platformAdmin.id,
            email: platformAdmin.email,
            firstName: platformAdmin.firstName,
            lastName: platformAdmin.lastName,
            role: 'platform_super_admin',
            companyName: 'Platform',
          },
        },
      };
    } catch (error) {
      logger.error('Platform admin registration error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Company Super Admin Registration (creates company + super admin)
  async registerCompanySuperAdmin(data: CompanySuperAdminRegisterData, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      // Check if company domain already exists
      const existingCompany = await db
        .select()
        .from(companies)
        .where(eq(companies.domain, data.companyDomain))
        .limit(1);

      if (existingCompany.length > 0) {
        return {
          success: false,
          message: 'Company domain already exists',
        };
      }

      // Check if user email already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

      if (existingUser.length > 0) {
        return {
          success: false,
          message: 'User with this email already exists',
        };
      }

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Create company
        const [company] = await tx
          .insert(companies)
          .values({
            name: data.companyName,
            domain: data.companyDomain,
            industry: data.industry,
            companySize: data.companySize,
            timezone: 'UTC',
          })
          .returning();

        // Create company super admin user
        const hashedPassword = await hashPassword(data.password);
        const [user] = await tx
          .insert(users)
          .values({
            companyId: company.id,
            email: data.email,
            passwordHash: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            role: 'company_super_admin',
            isVerified: true,
          })
          .returning();

        return { company, user };
      });

      // Generate JWT token
      const token = generateToken({
        userId: result.user.id,
        companyId: result.company.id,
        role: 'company_super_admin',
      });

      // Log the registration
      await this.logAuditEvent({
        userId: result.user.id,
        companyId: result.company.id,
        action: 'company_super_admin_registration',
        resourceType: 'user',
        resourceId: result.user.id,
        ipAddress,
        userAgent,
      });

      logger.info(`Company super admin registered: ${result.user.email} for company ${result.company.name}`);

      return {
        success: true,
        message: 'Company registered successfully',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: 'company_super_admin',
            companyName: result.company.name,
          },
          company: {
            id: result.company.id,
            name: result.company.name,
            domain: result.company.domain,
          },
          token,
        },
      };
    } catch (error) {
      logger.error('Company super admin registration error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Company Admin Registration (creates admin in existing company)
  async registerCompanyAdmin(data: CompanyAdminRegisterData, companyId: string, createdBy: string, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      // Check if user email already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

      if (existingUser.length > 0) {
        return {
          success: false,
          message: 'User with this email already exists',
        };
      }

      // Verify company exists and is active
      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1);

      if (company.length === 0) {
        return {
          success: false,
          message: 'Company not found',
        };
      }

      if (!company[0].isActive) {
        return {
          success: false,
          message: 'Company is deactivated',
        };
      }

      // Create company admin user
      const hashedPassword = await hashPassword(data.password);
      const [user] = await db
        .insert(users)
        .values({
          companyId: companyId,
          email: data.email,
          passwordHash: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: 'company_admin',
          isVerified: true,
        })
        .returning();

      // Log the registration
      await this.logAuditEvent({
        userId: createdBy,
        companyId: companyId,
        action: 'create_company_admin',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress,
        userAgent,
      });

      logger.info(`Company admin created: ${user.email} in company ${company[0].name} by ${createdBy}`);

      return {
        success: true,
        message: 'Company admin registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: 'company_admin',
            companyName: company[0].name,
          },
        },
      };
    } catch (error) {
      logger.error('Company admin registration error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Employee Registration (creates employee in existing company)
  async registerEmployee(data: EmployeeRegisterData, companyId: string, createdBy: string, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      // Check if user email already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

      if (existingUser.length > 0) {
        return {
          success: false,
          message: 'User with this email already exists',
        };
      }

      // Verify company exists and is active
      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1);

      if (company.length === 0) {
        return {
          success: false,
          message: 'Company not found',
        };
      }

      if (!company[0].isActive) {
        return {
          success: false,
          message: 'Company is deactivated',
        };
      }

      // Create employee user
      const hashedPassword = await hashPassword(data.password);
      const [user] = await db
        .insert(users)
        .values({
          companyId: companyId,
          email: data.email,
          passwordHash: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: 'employee',
          isVerified: true,
        })
        .returning();

      // Log the registration
      await this.logAuditEvent({
        userId: createdBy,
        companyId: companyId,
        action: 'create_employee',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress,
        userAgent,
      });

      logger.info(`Employee created: ${user.email} in company ${company[0].name} by ${createdBy}`);

      return {
        success: true,
        message: 'Employee registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: 'employee',
            companyName: company[0].name,
          },
        },
      };
    } catch (error) {
      logger.error('Employee registration error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Legacy register method (for backward compatibility)
  async register(data: RegisterData, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      // Check if company domain already exists
      const existingCompany = await db
        .select()
        .from(companies)
        .where(eq(companies.domain, data.companyDomain))
        .limit(1);

      if (existingCompany.length > 0) {
        return {
          success: false,
          message: 'Company domain already exists',
        };
      }

      // Check if user email already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

      if (existingUser.length > 0) {
        return {
          success: false,
          message: 'User with this email already exists',
        };
      }

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Create company
        const [company] = await tx
          .insert(companies)
          .values({
            name: data.companyName,
            domain: data.companyDomain,
            industry: data.industry,
            companySize: data.companySize,
            timezone: 'UTC',
          })
          .returning();

        // Create company super admin user
        const hashedPassword = await hashPassword(data.password);
        const [user] = await tx
          .insert(users)
          .values({
            companyId: company.id,
            email: data.email,
            passwordHash: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            role: 'company_super_admin',
            isVerified: true,
          })
          .returning();

        return { company, user };
      });

      // Generate JWT token
      const token = generateToken({
        userId: result.user.id,
        companyId: result.company.id,
        role: result.user.role,
      });

      // Log the registration
      await this.logAuditEvent({
        userId: result.user.id,
        companyId: result.company.id,
        action: 'register',
        resourceType: 'company',
        resourceId: result.company.id,
        ipAddress,
        userAgent,
      });

      logger.info(`New company registered: ${result.company.name} by ${result.user.email}`);

      return {
        success: true,
        message: 'Company registered successfully',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role,
          },
          company: {
            id: result.company.id,
            name: result.company.name,
            domain: result.company.domain,
          },
          token,
        },
      };
    } catch (error) {
      logger.error('Registration error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async forgotPassword(email: string): Promise<AuthResult> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (user.length === 0) {
        // Don't reveal if email exists or not
        return {
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        };
      }

      // Generate reset token
      const resetToken = uuidv4();
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      await db
        .update(users)
        .set({
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        })
        .where(eq(users.id, user[0].id));

//=======================================================================================================
//=======================================================================================================
//=======================================================================================================
      // TODO: Send email with reset link
//=======================================================================================================
//=======================================================================================================
//=======================================================================================================

      logger.info(`Password reset requested for: ${email}`);

      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      };
    } catch (error) {
      logger.error('Forgot password error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }
//=======================================================================================================
//=======================================================================================================   
//=======================================================================================================
//=======================================================================================================
  async resetPassword(token: string, password: string): Promise<AuthResult> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.passwordResetToken, token),
            // Check for expiration (passwordResetExpires must be in the future)
            gt(users.passwordResetExpires, new Date()),
            // Check for user active
            eq(users.isActive, true),
          )
        )
        .limit(1);

      if (user.length === 0) {
        return {
          success: false,
          message: 'Invalid or expired reset token',
        };
      }

      const hashedPassword = await hashPassword(password);

      await db
        .update(users)
        .set({
          passwordHash: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
        })
        .where(eq(users.id, user[0].id));

      logger.info(`Password reset completed for: ${user[0].email}`);

      return {
        success: true,
        message: 'Password reset successful',
      };
    } catch (error) {
      logger.error('Reset password error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async verifyToken(token: string): Promise<{ valid: boolean; payload?: any }> {
    try {
      const payload = verifyToken(token);
      return { valid: true, payload };
    } catch (error) {
      return { valid: false };
    }
  }

  private async logAuditEvent(data: {
    userId?: string;
    companyId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await db.insert(auditLogs).values({
        userId: data.userId,
        companyId: data.companyId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });
    } catch (error) {
      logger.error('Failed to log audit event:', error);
    }
  }
}