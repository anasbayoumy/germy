import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { db } from '../config/database';
import { users, companies } from '../db/schema';
import { eq } from 'drizzle-orm';
import { generateToken } from '../services/jwt.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  private authService = new AuthService();

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

  async logout(req: Request, res: Response): Promise<void> {
    try {
//=======================================================================================================
//=======================================================================================================
//=======================================================================================================
      // In a more sophisticated setup, you might want to blacklist the token
      // For now, we'll just return success
//=======================================================================================================
//=======================================================================================================
//=======================================================================================================
      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Logout controller error:', error);
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

      const result = await this.authService.forgotPassword(email);

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
}