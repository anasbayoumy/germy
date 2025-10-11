import { logger } from '../utils/logger';
import { uploadProfilePicture, deleteProfilePicture, getProfilePicturePath } from '../utils/fileUpload';
import { db } from '../config/database';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env';

export class FileUploadService {
  async uploadUserProfilePicture(
    file: Express.Multer.File,
    userId: string,
    requestingUserId: string,
    requestingUserRole: string
  ) {
    try {
      // Check permissions
      if (requestingUserRole !== 'platform_super_admin' && userId !== requestingUserId) {
        return {
          success: false,
          message: 'Users can only upload their own profile pictures',
        };
      }

      // Check if user exists
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Upload file
      const uploadResult = await uploadProfilePicture(file, userId);

      if (!uploadResult.success) {
        return uploadResult;
      }

      // Update user record with new profile photo URL
      await db
        .update(users)
        .set({
          profilePhotoUrl: uploadResult.data?.url,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      logger.info(`Profile picture updated for user ${userId} by ${requestingUserId}`);

      return {
        success: true,
        message: 'Profile picture uploaded and updated successfully',
        data: uploadResult.data,
      };
    } catch (error) {
      logger.error('Upload user profile picture service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async deleteUserProfilePicture(
    userId: string,
    requestingUserId: string,
    requestingUserRole: string
  ) {
    try {
      // Check permissions
      if (requestingUserRole !== 'platform_super_admin' && userId !== requestingUserId) {
        return {
          success: false,
          message: 'Users can only delete their own profile pictures',
        };
      }

      // Check if user exists
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Delete file
      const deleteResult = await deleteProfilePicture(userId);

      if (!deleteResult.success) {
        return deleteResult;
      }

      // Update user record to remove profile photo URL
      await db
        .update(users)
        .set({
          profilePhotoUrl: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      logger.info(`Profile picture deleted for user ${userId} by ${requestingUserId}`);

      return {
        success: true,
        message: 'Profile picture deleted successfully',
      };
    } catch (error) {
      logger.error('Delete user profile picture service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async getUserProfilePicture(userId: string) {
    try {
      const filePath = await getProfilePicturePath(userId);
      
      if (!filePath) {
        return {
          success: false,
          message: 'Profile picture not found',
        };
      }

      return {
        success: true,
        message: 'Profile picture found',
        data: { filePath },
      };
    } catch (error) {
      logger.error('Get user profile picture service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async getFileMetadata(userId: string, filename: string) {
    try {
      const userDir = path.join(env.UPLOAD_PATH || './uploads', 'profiles', userId);
      const filePath = path.join(userDir, filename);
      
      try {
        const stats = await fs.stat(filePath);
        return {
          success: true,
          message: 'File metadata retrieved',
          data: {
            filename,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            type: path.extname(filename),
          },
        };
      } catch {
        return {
          success: false,
          message: 'File not found',
        };
      }
    } catch (error) {
      logger.error('Get file metadata service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async listUserFiles(userId: string) {
    try {
      const userDir = path.join(env.UPLOAD_PATH || './uploads', 'profiles', userId);
      
      try {
        await fs.access(userDir);
      } catch {
        return {
          success: true,
          message: 'No files found',
          data: { files: [] },
        };
      }

      const files = await fs.readdir(userDir);
      const fileList = [];

      for (const file of files) {
        const filePath = path.join(userDir, file);
        const stats = await fs.stat(filePath);
        fileList.push({
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          type: path.extname(file),
          url: `/api/files/profiles/${userId}/${file}`,
        });
      }

      return {
        success: true,
        message: 'Files listed successfully',
        data: { files: fileList },
      };
    } catch (error) {
      logger.error('List user files service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async bulkDeleteUserFiles(userId: string, filenames: string[], requestingUserId: string, requestingUserRole: string) {
    try {
      // Check permissions
      if (requestingUserRole !== 'platform_super_admin' && userId !== requestingUserId) {
        return {
          success: false,
          message: 'Users can only delete their own files',
        };
      }

      const userDir = path.join(env.UPLOAD_PATH || './uploads', 'profiles', userId);
      const results = [];

      for (const filename of filenames) {
        try {
          const filePath = path.join(userDir, filename);
          await fs.unlink(filePath);
          results.push({ filename, success: true });
        } catch (error) {
          results.push({ filename, success: false, error: 'File not found or could not be deleted' });
        }
      }

      logger.info(`Bulk delete files for user ${userId} by ${requestingUserId}: ${filenames.length} files processed`);

      return {
        success: true,
        message: 'Bulk delete operation completed',
        data: { results },
      };
    } catch (error) {
      logger.error('Bulk delete user files service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }
}