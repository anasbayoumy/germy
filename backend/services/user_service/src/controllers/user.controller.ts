import { Response } from 'express';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class UserController {
  private readonly userService = new UserService();

  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, search, role, isActive } = req.query;
      const { userId, role: userRole, companyId } = req.user!;

      // Validate and sanitize pagination parameters
      const validatedPage = Math.max(1, Math.min(Number(page) || 1, 100));
      const validatedLimit = Math.max(1, Math.min(Number(limit) || 20, 100));

      const result = await this.userService.getUsers(
        {
          page: validatedPage,
          limit: validatedLimit,
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

  // ===== NEW MISSING CONTROLLER METHODS =====

  // User CRUD Operations
  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userData = req.body;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.createUser(
        userData,
        userId,
        userRole,
        companyId,
        req.ip,
        req.get('User-Agent')
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: result.data,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Create user controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.deleteUser(
        id,
        userId,
        userRole,
        companyId,
        req.ip,
        req.get('User-Agent')
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Delete user controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async activateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.activateUser(
        id,
        userId,
        userRole,
        companyId,
        req.ip,
        req.get('User-Agent')
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.data,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Activate user controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  // Bulk Operations
  async bulkCreateUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { usersData } = req.body;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.bulkCreateUsers(
        usersData,
        userId,
        userRole,
        companyId,
        req.ip,
        req.get('User-Agent')
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: result.data,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Bulk create users controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async bulkDeleteUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userIds } = req.body;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.bulkDeleteUsers(
        userIds,
        userId,
        userRole,
        companyId,
        req.ip,
        req.get('User-Agent')
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.data,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Bulk delete users controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async bulkActivateUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userIds } = req.body;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.bulkActivateUsers(
        userIds,
        userId,
        userRole,
        companyId,
        req.ip,
        req.get('User-Agent')
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.data,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Bulk activate users controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async bulkDeactivateUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userIds } = req.body;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.bulkDeactivateUsers(
        userIds,
        userId,
        userRole,
        companyId,
        req.ip,
        req.get('User-Agent')
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.data,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Bulk deactivate users controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  // Activity Management
  async createUserActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const activityData = req.body;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.createUserActivity(
        id,
        activityData,
        userId,
        userRole,
        companyId,
        req.ip,
        req.get('User-Agent')
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: result.data,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Create user activity controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async updateUserActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id, activityId } = req.params;
      const activityData = req.body;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.updateUserActivity(
        id,
        activityId,
        activityData,
        userId,
        userRole,
        companyId,
        req.ip,
        req.get('User-Agent')
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.data,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Update user activity controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async deleteUserActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id, activityId } = req.params;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.deleteUserActivity(
        id,
        activityId,
        userId,
        userRole,
        companyId,
        req.ip,
        req.get('User-Agent')
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Delete user activity controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async getUserActivityById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id, activityId } = req.params;
      const { userId, role: userRole, companyId } = req.user!;

      const activity = await this.userService.getUserActivityById(
        id,
        activityId,
        userId,
        userRole,
        companyId
      );

      if (activity) {
        res.json({
          success: true,
          data: { activity },
        });
        return;
      }

      res.status(404).json({
        success: false,
        message: 'Activity not found',
      });
      return;
    } catch (error) {
      logger.error('Get user activity by ID controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  // Advanced Search
  async advancedSearch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const searchData = req.body;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.advancedSearch(
        searchData,
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
      logger.error('Advanced search controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  // Saved Searches
  async saveSearch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const searchData = req.body;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.saveSearch(
        searchData,
        userId,
        userRole,
        companyId
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: result.data,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Save search controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async getSavedSearches(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.getSavedSearches(
        userId,
        userRole,
        companyId
      );

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Get saved searches controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async updateSavedSearch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { searchId } = req.params;
      const searchData = req.body;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.updateSavedSearch(
        searchId,
        searchData,
        userId,
        userRole,
        companyId
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.data,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Update saved search controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async deleteSavedSearch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { searchId } = req.params;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.deleteSavedSearch(
        searchId,
        userId,
        userRole,
        companyId
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Delete saved search controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  // Permission Management
  async getUserPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, role: userRole, companyId } = req.user!;

      const permissions = await this.userService.getUserPermissions(
        id,
        userId,
        userRole,
        companyId
      );

      res.json({
        success: true,
        data: { permissions },
      });
      return;
    } catch (error) {
      logger.error('Get user permissions controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async grantUserPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.grantUserPermissions(
        id,
        permissions,
        userId,
        userRole,
        companyId
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.data,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Grant user permissions controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async revokeUserPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.revokeUserPermissions(
        id,
        permissions,
        userId,
        userRole,
        companyId
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Revoke user permissions controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  // Custom Reports
  async createCustomReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const reportData = req.body;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.createCustomReport(
        reportData,
        userId,
        userRole,
        companyId
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: result.data,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Create custom report controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async getCustomReports(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.getCustomReports(
        userId,
        userRole,
        companyId
      );

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Get custom reports controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async generateReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.generateReport(
        reportId,
        userId,
        userRole,
        companyId
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.data,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Generate report controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  // Export by Role
  async exportUsersByRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role } = req.params;
      const { format, includeInactive } = req.query;
      const { userId, role: userRole, companyId } = req.user!;

      const result = await this.userService.exportUsersByRole(
        role,
        format as string || 'csv',
        includeInactive === 'true',
        userId,
        userRole,
        companyId
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.data,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    } catch (error) {
      logger.error('Export users by role controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }
}