import { Response } from 'express';
import { FileService } from '../services/file.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class FileController {
  private readonly fileService = new FileService();

  async uploadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId } = req.user!;
      const { category, description, isPublic, tags } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file provided',
        });
        return;
      }

      const result = await this.fileService.uploadFile(
        userId,
        companyId,
        file,
        category,
        description,
        isPublic === 'true',
        tags ? tags.split(',').map((tag: string) => tag.trim()) : undefined
      );

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Upload file controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async uploadMultipleFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId } = req.user!;
      const { category, description, isPublic, tags } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No files provided',
        });
        return;
      }

      const results = [];
      for (const file of files) {
        const result = await this.fileService.uploadFile(
          userId,
          companyId,
          file,
          category,
          description,
          isPublic === 'true',
          tags ? tags.split(',').map((tag: string) => tag.trim()) : undefined
        );
        results.push(result);
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      res.status(201).json({
        success: true,
        message: `${successCount} files uploaded successfully, ${failureCount} failed`,
        data: { results },
      });
    } catch (error) {
      logger.error('Upload multiple files controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId } = req.user!;
      const { page = 1, limit = 20, category, isPublic, tags, dateFrom, dateTo } = req.query;

      const result = await this.fileService.getFiles(userId, companyId, {
        page: Number(page),
        limit: Number(limit),
        category: category as string,
        isPublic: isPublic === 'true',
        tags: tags as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Get files controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getFileById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId } = req.user!;
      const { id } = req.params;

      const result = await this.fileService.getFileById(id, userId, companyId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      logger.error('Get file by ID controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async updateFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId } = req.user!;
      const { id } = req.params;
      const updateData = req.body;

      const result = await this.fileService.updateFile(id, userId, companyId, updateData);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Update file controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async deleteFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId } = req.user!;
      const { id } = req.params;

      const result = await this.fileService.deleteFile(id, userId, companyId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Delete file controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async shareFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId } = req.user!;
      const { id } = req.params;
      const { userIds, permissions, expiresAt } = req.body;

      const result = await this.fileService.shareFile(
        id,
        userId,
        companyId,
        {
          userIds,
          permissions,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        }
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Share file controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getFileShares(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId } = req.user!;
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const result = await this.fileService.getFileShares(
        id,
        userId,
        companyId,
        Number(page),
        Number(limit)
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Get file shares controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async revokeFileShare(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId } = req.user!;
      const { id, shareId } = req.params;

      const result = await this.fileService.revokeFileShare(id, shareId, userId, companyId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Revoke file share controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getFileAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId } = req.user!;
      const { id } = req.params;
      const { period = '30d' } = req.query;

      const result = await this.fileService.getFileAnalytics(id, userId, companyId, period as string);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Get file analytics controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getUserFileAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId } = req.user!;
      const { userId: targetUserId } = req.params;
      const { period = '30d' } = req.query;

      const result = await this.fileService.getFileAnalytics(
        targetUserId,
        userId,
        companyId,
        period as string
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Get user file analytics controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async exportFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId } = req.user!;
      const { format = 'csv', category, dateFrom, dateTo } = req.query;

      const result = await this.fileService.exportFiles(
        userId,
        companyId,
        format as string,
        category as string,
        dateFrom as string,
        dateTo as string
      );

      if (result.success && result.data) {
        if (format === 'csv') {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
          res.status(200).send(result.data.content);
        } else {
          res.status(200).json(result);
        }
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Export files controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async cleanupFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role } = req.user!;
      const { olderThan, category, dryRun = true } = req.body;

      // Only platform admins can cleanup files
      if (role !== 'platform_admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const result = await this.fileService.cleanupFiles(
        new Date(olderThan),
        category,
        dryRun
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Cleanup files controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}
