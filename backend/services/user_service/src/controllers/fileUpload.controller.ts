import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { FileUploadService } from '../services/fileUpload.service';

export class FileUploadController {
  private readonly fileUploadService = new FileUploadService();

  async uploadProfilePicture(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { userId: requestingUserId, role: userRole } = req.user!;

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      const result = await this.fileUploadService.uploadUserProfilePicture(
        req.file,
        userId,
        requestingUserId,
        userRole
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Upload profile picture controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async deleteProfilePicture(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { userId: requestingUserId, role: userRole } = req.user!;

      const result = await this.fileUploadService.deleteUserProfilePicture(
        userId,
        requestingUserId,
        userRole
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Delete profile picture controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async getProfilePicture(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { userId: requestingUserId, role: userRole, companyId } = req.user!;

      const result = await this.fileUploadService.getUserProfilePicture(userId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Get profile picture controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async getFileMetadata(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, filename } = req.params;
      const { userId: requestingUserId, role: userRole } = req.user!;

      // Check permissions
      if (userRole !== 'platform_super_admin' && userId !== requestingUserId) {
        res.status(403).json({
          success: false,
          message: 'Users can only access their own file metadata',
        });
        return;
      }

      const result = await this.fileUploadService.getFileMetadata(userId, filename);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Get file metadata controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async listUserFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { userId: requestingUserId, role: userRole } = req.user!;

      // Check permissions
      if (userRole !== 'platform_super_admin' && userId !== requestingUserId) {
        res.status(403).json({
          success: false,
          message: 'Users can only list their own files',
        });
        return;
      }

      const result = await this.fileUploadService.listUserFiles(userId);

      res.json(result);
      return;
    } catch (error) {
      logger.error('List user files controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async bulkDeleteFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { filenames } = req.body;
      const { userId: requestingUserId, role: userRole } = req.user!;

      if (!Array.isArray(filenames) || filenames.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Filenames array is required',
        });
        return;
      }

      const result = await this.fileUploadService.bulkDeleteUserFiles(
        userId,
        filenames,
        requestingUserId,
        userRole
      );

      res.json(result);
      return;
    } catch (error) {
      logger.error('Bulk delete files controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async serveFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, filename } = req.params;
      const { userId: requestingUserId, role: userRole } = req.user!;

      // Check permissions
      if (userRole !== 'platform_super_admin' && userId !== requestingUserId) {
        res.status(403).json({
          success: false,
          message: 'Users can only access their own files',
        });
        return;
      }

      const result = await this.fileUploadService.getFileMetadata(userId, filename);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      // In a real implementation, you would serve the file here
      // For now, return the file info
      res.json({
        success: true,
        message: 'File serving endpoint - implement file streaming logic',
        data: result.data,
      });
      return;
    } catch (error) {
      logger.error('Serve file controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }
}