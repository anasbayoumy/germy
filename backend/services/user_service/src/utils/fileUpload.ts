import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';
import { env } from '../config/env';

export interface UploadResult {
  success: boolean;
  message: string;
  data?: {
    filename: string;
    path: string;
    url: string;
  };
}

export async function uploadProfilePicture(
  file: Express.Multer.File,
  userId: string
): Promise<UploadResult> {
  try {
    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      return {
        success: false,
        message: 'Only image files are allowed',
      };
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        message: 'File size must be less than 5MB',
      };
    }

    // Create user-specific directory
    const userDir = path.join(env.UPLOAD_PATH || './uploads', 'profiles', userId);
    await fs.mkdir(userDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `profile-${Date.now()}${ext}`;
    const filePath = path.join(userDir, filename);

    // Move file to destination
    await fs.rename(file.path, filePath);

    // Generate URL
    const url = `/api/files/profiles/${userId}/${filename}`;

    logger.info(`Profile picture uploaded for user ${userId}: ${filename}`);

    return {
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        filename,
        path: filePath,
        url,
      },
    };
  } catch (error) {
    logger.error('Profile picture upload error:', error);
    return {
      success: false,
      message: 'Failed to upload profile picture',
    };
  }
}

export async function deleteProfilePicture(userId: string): Promise<UploadResult> {
  try {
    const userDir = path.join(env.UPLOAD_PATH || './uploads', 'profiles', userId);
    
    // Check if directory exists
    try {
      await fs.access(userDir);
    } catch {
      return {
        success: false,
        message: 'No profile picture found',
      };
    }

    // Read directory and delete all files
    const files = await fs.readdir(userDir);
    for (const file of files) {
      await fs.unlink(path.join(userDir, file));
    }

    // Remove directory
    await fs.rmdir(userDir);

    logger.info(`Profile picture deleted for user ${userId}`);

    return {
      success: true,
      message: 'Profile picture deleted successfully',
    };
  } catch (error) {
    logger.error('Profile picture deletion error:', error);
    return {
      success: false,
      message: 'Failed to delete profile picture',
    };
  }
}

export async function getProfilePicturePath(userId: string): Promise<string | null> {
  try {
    const userDir = path.join(env.UPLOAD_PATH || './uploads', 'profiles', userId);
    
    try {
      await fs.access(userDir);
    } catch {
      return null;
    }

    const files = await fs.readdir(userDir);
    if (files.length === 0) {
      return null;
    }

    // Return the most recent file
    const sortedFiles = files.sort((a, b) => {
      const aTime = parseInt(a.split('-')[1]) || 0;
      const bTime = parseInt(b.split('-')[1]) || 0;
      return bTime - aTime;
    });

    return path.join(userDir, sortedFiles[0]);
  } catch (error) {
    logger.error('Get profile picture path error:', error);
    return null;
  }
}