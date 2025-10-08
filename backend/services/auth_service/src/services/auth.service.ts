import { eq, and, gt } from 'drizzle-orm';
import { db } from '../config/database';
import { users, companies, auditLogs } from '../db/schema';
import { logger } from '../utils/logger';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateToken, verifyToken } from './jwt.service';
import { v4 as uuidv4 } from 'uuid';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  companyName: string;
  companyDomain: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  industry: string;
  companySize: string;
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