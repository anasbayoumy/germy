import { Response } from 'express';
import { AuditService } from '../services/audit.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuditController {
  private readonly auditService = new AuditService();

  async getAuditTrail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId } = req.user!;
      const {
        action,
        resourceType,
        dateFrom,
        dateTo,
        page = 1,
        limit = 50,
      } = req.query;

      const filters = {
        userId: userId as string,
        companyId: companyId as string,
        action: action as string,
        resourceType: resourceType as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        page: Number(page),
        limit: Number(limit),
      };

      const result = await this.auditService.getAuditTrail(filters);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      logger.error('Get audit trail controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getSecurityEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId } = req.user!;
      const {
        dateFrom,
        dateTo,
        page = 1,
        limit = 50,
      } = req.query;

      const filters = {
        userId: userId as string,
        companyId: companyId as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        page: Number(page),
        limit: Number(limit),
      };

      const result = await this.auditService.getSecurityEvents(filters);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
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

  async exportAuditLog(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId } = req.user!;
      const { format = 'json', dateFrom, dateTo, action, resourceType } = req.query;

      const dateRange = {
        from: new Date(dateFrom as string),
        to: new Date(dateTo as string),
      };

      const filters = {
        userId: userId as string,
        companyId: companyId as string,
        action: action as string,
        resourceType: resourceType as string,
      };

      const result = await this.auditService.exportAuditLog(
        format as string,
        dateRange,
        filters
      );

      if (result.success && result.data) {
        if (format === 'csv') {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
          res.send(result.data.content);
        } else {
          res.json({
            success: true,
            data: result.data,
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      logger.error('Export audit log controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async cleanupOldLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role } = req.user!;
      
      // Only platform admins can cleanup audit logs
      if (role !== 'platform_admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const { olderThanDays = 365 } = req.body;

      const result = await this.auditService.cleanupOldLogs(olderThanDays);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: {
            deletedCount: result.deletedCount,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      logger.error('Cleanup old logs controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}
