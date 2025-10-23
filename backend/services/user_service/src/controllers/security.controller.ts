import { Response } from 'express';
import { SecurityService } from '../services/security.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class SecurityController {
  private readonly securityService = new SecurityService();

  async getSecuritySettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role } = req.user!;
      
      // Only platform admins and company super admins can view security settings
      if (!['platform_admin', 'company_super_admin'].includes(role)) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const settings = await this.securityService.getSecuritySettings();

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      logger.error('Get security settings controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async updateSecuritySettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role } = req.user!;
      
      // Only platform admins can update security settings
      if (role !== 'platform_admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const settings = req.body;

      await this.securityService.updateSecuritySettings(settings);

      res.json({
        success: true,
        message: 'Security settings updated successfully',
      });
    } catch (error) {
      logger.error('Update security settings controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async validatePasswordStrength(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { password } = req.body;

      const result = await this.securityService.validatePasswordStrength(password);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Validate password strength controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getUserDevices(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.user!;
      const { targetUserId } = req.params;

      // Users can only view their own devices, admins can view any user's devices
      const { role } = req.user!;
      const canView = userId === targetUserId || 
                      ['platform_admin', 'company_super_admin', 'company_admin'].includes(role);

      if (!canView) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const devices = await this.securityService.getUserDevices(targetUserId);

      res.json({
        success: true,
        data: devices,
      });
    } catch (error) {
      logger.error('Get user devices controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async revokeDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, role } = req.user!;
      const { deviceId, targetUserId } = req.params;

      // Users can only revoke their own devices, admins can revoke any user's devices
      const canRevoke = userId === targetUserId || 
                        ['platform_admin', 'company_super_admin', 'company_admin'].includes(role);

      if (!canRevoke) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const success = await this.securityService.revokeDevice(deviceId, targetUserId);

      if (success) {
        res.json({
          success: true,
          message: 'Device revoked successfully',
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Device not found',
        });
      }
    } catch (error) {
      logger.error('Revoke device controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getSecurityEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId, role } = req.user!;
      const {
        severity,
        dateFrom,
        dateTo,
        page = 1,
        limit = 50,
      } = req.query;

      // Only admins can view security events
      if (!['platform_admin', 'company_super_admin', 'company_admin'].includes(role)) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const filters = {
        userId: role === 'platform_admin' ? undefined : userId,
        companyId: role === 'platform_admin' ? undefined : companyId,
        severity: severity as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        page: Number(page),
        limit: Number(limit),
      };

      const result = await this.securityService.getSecurityEvents(filters);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'message' in result ? result.message : 'Failed to get security events',
        });
      }
    } catch (error) {
      logger.error('Get security events controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async generateSecurityReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { companyId, role } = req.user!;
      const { dateFrom, dateTo } = req.query;

      // Only admins can generate security reports
      if (!['platform_admin', 'company_super_admin', 'company_admin'].includes(role)) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const dateRange = {
        from: new Date(dateFrom as string),
        to: new Date(dateTo as string),
      };

      const result = await this.securityService.generateSecurityReport(companyId, dateRange);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'message' in result ? result.message : 'Failed to generate security report',
        });
      }
    } catch (error) {
      logger.error('Generate security report controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}
