import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class UserController {
  private readonly userService = new UserService();

  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, search, role, isActive } = req.query;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.getUsers(
        {
          page: Number(page),
          limit: Number(limit),
          search: search as string,
          role: role as string,
          isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        },
        userId,
        userRole,
        companyId
      );

      res.json({
        success: true,
        data: result,
      });
      return;
    } catch (error) {
      logger.error('Get users controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, role: userRole, companyId } = req.user!;

      const user = await this.userService.getUserById(id, userId, userRole, companyId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { user },
      });
      return;
    } catch (error) {
      logger.error('Get user by ID controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const { userId, role: userRole, companyId } = req.user!;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await this.userService.updateUser(
        id,
        updateData,
        userId,
        userRole,
        companyId,
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Update user controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async deactivateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, role: userRole, companyId } = req.user!;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await this.userService.deactivateUser(
        id,
        userId,
        userRole,
        companyId,
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Deactivate user controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async getUserPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, role: userRole, companyId } = req.user!;

      const preferences = await this.userService.getUserPreferences(id, userId, userRole, companyId);

      if (!preferences) {
        res.status(404).json({
          success: false,
          message: 'User preferences not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { preferences },
      });
      return;
    } catch (error) {
      logger.error('Get user preferences controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async updateUserPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const preferencesData = req.body;
      const { userId, role: userRole, companyId } = req.user!;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await this.userService.updateUserPreferences(
        id,
        preferencesData,
        userId,
        userRole,
        companyId,
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Update user preferences controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async getUserActivities(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.getUserActivities(
        id,
        Number(page),
        Number(limit),
        userId,
        userRole,
        companyId
      );

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'User not found or insufficient permissions',
        });
        return;
      }

      res.json({
        success: true,
        data: result,
      });
      return;
    } catch (error) {
      logger.error('Get user activities controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { q, limit = 10 } = req.query;
      const { userId, role: userRole, companyId } = req.user!;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
        return;
      }

      const result = await this.userService.getUsers(
        {
          page: 1,
          limit: Number(limit),
          search: q,
        },
        userId,
        userRole,
        companyId
      );

      res.json({
        success: true,
        data: result,
      });
      return;
    } catch (error) {
      logger.error('Search users controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async getUserSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, role: userRole, companyId } = req.user!;

      const settings = await this.userService.getUserSettings(id, userId, userRole, companyId);

      if (!settings) {
        res.status(404).json({
          success: false,
          message: 'User settings not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { settings },
      });
      return;
    } catch (error) {
      logger.error('Get user settings controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async updateUserSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const settingsData = req.body;
      const { userId, role: userRole, companyId } = req.user!;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await this.userService.updateUserSettings(
        id,
        settingsData,
        userId,
        userRole,
        companyId,
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Update user settings controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async getUserStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.getUserStatistics(id, userId, userRole, companyId);

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'User not found or insufficient permissions',
        });
        return;
      }

      res.json({
        success: true,
        data: result,
      });
      return;
    } catch (error) {
      logger.error('Get user statistics controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async getUserActivitySummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { days = 30 } = req.query;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.getUserActivitySummary(
        id,
        Number(days),
        userId,
        userRole,
        companyId
      );

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'User not found or insufficient permissions',
        });
        return;
      }

      res.json({
        success: true,
        data: result,
      });
      return;
    } catch (error) {
      logger.error('Get user activity summary controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async getCompanyUserAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const { userId, role: userRole, companyId: requestingUserCompanyId } = req.user!;

      const result = await this.userService.getCompanyUserAnalytics(
        companyId,
        userId,
        userRole,
        requestingUserCompanyId
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Get company user analytics controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async bulkUpdateUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userIds, updateData } = req.body;
      const { userId, role: userRole, companyId } = req.user!;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      if (!Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'User IDs array is required',
        });
        return;
      }

      const result = await this.userService.bulkUpdateUsers(
        userIds,
        updateData,
        userId,
        userRole,
        companyId,
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Bulk update users controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async exportUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const { userId, role: userRole, companyId: requestingUserCompanyId } = req.user!;

      const result = await this.userService.exportUsers(
        companyId,
        userId,
        userRole,
        requestingUserCompanyId
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Export users controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async importUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { usersData } = req.body;
      const { userId, role: userRole, companyId } = req.user!;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      if (!Array.isArray(usersData) || usersData.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Users data array is required',
        });
        return;
      }

      const result = await this.userService.importUsers(
        usersData,
        userId,
        userRole,
        companyId,
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Import users controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }
}