import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { db } from '../config/database';
import { users, companies } from '../db/schema';
import { eq } from 'drizzle-orm';
import { generateToken } from '../services/jwt.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  private readonly authService = new AuthService();

  // Platform Super Admin Login
  async loginPlatformAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await this.authService.loginPlatformAdmin(
        { email, password },
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(401).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Platform admin login controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Company Super Admin Login
  async loginSuperAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await this.authService.loginCompanyUser(
        { email, password },
        'company_super_admin',
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(401).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Super admin login controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Company Admin Login
  async loginAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await this.authService.loginCompanyUser(
        { email, password },
        'company_admin',
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(401).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Admin login controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Employee Login
  async loginUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await this.authService.loginCompanyUser(
        { email, password },
        'employee',
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(401).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('User login controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Legacy login method (for backward compatibility)
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await this.authService.login(
        { email, password },
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(401).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Login controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Platform Admin Registration (requires platform admin authentication)
  async registerPlatformAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, phone } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');
      const createdBy = req.user?.userId || '';

      const result = await this.authService.registerPlatformAdmin(
        { email, password, firstName, lastName, phone },
        createdBy,
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      logger.error('Platform admin registration controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Company Super Admin Registration (public - creates company + super admin)
  async registerCompanySuperAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { companyName, companyDomain, firstName, lastName, email, password, phone, industry, companySize } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await this.authService.registerCompanySuperAdmin(
        { companyName, companyDomain, firstName, lastName, email, password, phone, industry, companySize },
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      logger.error('Company super admin registration controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Company Admin Registration (requires super admin authentication)
  async registerCompanyAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, phone } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');
      const companyId = req.user?.companyId || '';
      const createdBy = req.user?.userId || '';

      const result = await this.authService.registerCompanyAdmin(
        { email, password, firstName, lastName, phone },
        companyId,
        createdBy,
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      logger.error('Company admin registration controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Employee Registration (requires admin authentication)
  async registerEmployee(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, phone } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');
      const companyId = req.user?.companyId || '';
      const createdBy = req.user?.userId || '';

      const result = await this.authService.registerEmployee(
        { email, password, firstName, lastName, phone },
        companyId,
        createdBy,
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      logger.error('Employee registration controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Legacy register method (for backward compatibility)
  async register(req: Request, res: Response): Promise<void> {
    try {
      const {
        companyName,
        companyDomain,
        firstName,
        lastName,
        email,
        password,
        phone,
        industry,
        companySize,
      } = req.body;

      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await this.authService.register(
        {
          companyName,
          companyDomain,
          firstName,
          lastName,
          email,
          password,
          phone,
          industry,
          companySize,
        },
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      logger.error('Register controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }


  async refreshToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId, role } = req.user!;

      // Generate new token
      const token = generateToken({ userId, companyId, role });

      res.json({
        success: true,
        data: { token },
      });
    } catch (error) {
      logger.error('Token refresh controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.user!;

      // Get user details from database
      const user = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          companyId: users.companyId,
          companyName: companies.name,
        })
        .from(users)
        .innerJoin(companies, eq(users.companyId, companies.id))
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { user: user[0] },
      });
    } catch (error) {
      logger.error('Get current user controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await this.authService.forgotPassword(email, ipAddress, userAgent);

      res.json(result);
    } catch (error) {
      logger.error('Forgot password controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      const result = await this.authService.resetPassword(token, password);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Reset password controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      const result = await this.authService.verifyToken(token);

      res.json({
        success: result.valid,
        data: result.payload,
      });
    } catch (error) {
      logger.error('Verify token controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      if (!token || !req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const result = await this.authService.logout(
        token,
        req.user.userId,
        req.user.companyId,
        ipAddress,
        userAgent
      );

      res.json(result);
    } catch (error) {
      logger.error('Logout controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}