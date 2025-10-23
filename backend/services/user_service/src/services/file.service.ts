import { eq, and, desc, count, sql, gte, lte } from 'drizzle-orm';
import { db } from '../config/database';
import { files, fileShares, fileAccessLogs } from '../db/schema';
import { users } from '../db/schema/auth';
import { logger } from '../utils/logger';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { v4 as uuidv4 } from 'uuid';

export interface CreateFileData {
  originalName: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  category: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateFileData {
  description?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface ShareFileData {
  userIds: string[];
  permissions: string;
  expiresAt?: Date;
}

export class FileService {
  private readonly uploadDir = process.env.UPLOAD_DIR || './uploads';
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];

  async uploadFile(
    userId: string,
    companyId: string,
    file: Express.Multer.File,
    category: string,
    description?: string,
    isPublic: boolean = false,
    tags?: string[]
  ) {
    try {
      // Validate file
      if (!file) {
        return {
          success: false,
          message: 'No file provided',
        };
      }

      if (file.size > this.maxFileSize) {
        return {
          success: false,
          message: 'File size exceeds maximum limit of 10MB',
        };
      }

      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        return {
          success: false,
          message: 'File type not allowed',
        };
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const uniqueFileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(this.uploadDir, category, uniqueFileName);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Move file to upload directory
      fs.renameSync(file.path, filePath);

      // Save file record to database
      const [savedFile] = await db
        .insert(files)
        .values({
          userId,
          companyId,
          originalName: file.originalname,
          fileName: uniqueFileName,
          filePath,
          mimeType: file.mimetype,
          fileSize: file.size,
          category,
          description,
          isPublic,
          tags: tags || [],
        })
        .returning();

      logger.info(`File uploaded: ${savedFile.id} by user ${userId}`);

      return {
        success: true,
        message: 'File uploaded successfully',
        data: { file: savedFile },
      };
    } catch (error) {
      logger.error('Upload file service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async getFiles(
    userId: string,
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      category?: string;
      isPublic?: boolean;
      tags?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ) {
    try {
      const { page = 1, limit = 20, category, isPublic, tags, dateFrom, dateTo } = options;
      const offset = (page - 1) * limit;
      const conditions = [eq(files.companyId, companyId)];

      // Filter by user (unless platform admin)
      const user = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user[0]?.role !== 'platform_admin') {
        conditions.push(eq(files.userId, userId));
      }

      if (category) {
        conditions.push(eq(files.category, category));
      }

      if (isPublic !== undefined) {
        conditions.push(eq(files.isPublic, isPublic));
      }

      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        conditions.push(sql`${files.tags} ?| ${tagArray}`);
      }

      if (dateFrom) {
        conditions.push(gte(files.uploadedAt, new Date(dateFrom)));
      }

      if (dateTo) {
        conditions.push(lte(files.uploadedAt, new Date(dateTo)));
      }

      const filesList = await db
        .select({
          id: files.id,
          originalName: files.originalName,
          fileName: files.fileName,
          mimeType: files.mimeType,
          fileSize: files.fileSize,
          category: files.category,
          description: files.description,
          isPublic: files.isPublic,
          tags: files.tags,
          downloadCount: files.downloadCount,
          viewCount: files.viewCount,
          uploadedAt: files.uploadedAt,
          lastAccessedAt: files.lastAccessedAt,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(files)
        .innerJoin(users, eq(files.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(files.uploadedAt))
        .limit(limit)
        .offset(offset);

      const totalCount = await db
        .select({ count: count() })
        .from(files)
        .where(and(...conditions));

      return {
        success: true,
        data: {
          files: filesList,
          pagination: {
            page,
            limit,
            total: totalCount[0].count,
            pages: Math.ceil(totalCount[0].count / limit),
          },
        },
      };
    } catch (error) {
      logger.error('Get files service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async getFileById(fileId: string, userId: string, companyId: string) {
    try {
      const [file] = await db
        .select({
          id: files.id,
          originalName: files.originalName,
          fileName: files.fileName,
          filePath: files.filePath,
          mimeType: files.mimeType,
          fileSize: files.fileSize,
          category: files.category,
          description: files.description,
          isPublic: files.isPublic,
          tags: files.tags,
          downloadCount: files.downloadCount,
          viewCount: files.viewCount,
          uploadedAt: files.uploadedAt,
          lastAccessedAt: files.lastAccessedAt,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(files)
        .innerJoin(users, eq(files.userId, users.id))
        .where(and(eq(files.id, fileId), eq(files.companyId, companyId)))
        .limit(1);

      if (!file) {
        return {
          success: false,
          message: 'File not found',
        };
      }

      // Check access permissions
      const user = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user[0]?.role !== 'platform_admin' && file.user.id !== userId && !file.isPublic) {
        return {
          success: false,
          message: 'Access denied',
        };
      }

      return {
        success: true,
        data: { file },
      };
    } catch (error) {
      logger.error('Get file by ID service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async updateFile(fileId: string, userId: string, companyId: string, updateData: UpdateFileData) {
    try {
      // Check if file exists and user has permission
      const [file] = await db
        .select()
        .from(files)
        .where(and(eq(files.id, fileId), eq(files.companyId, companyId)))
        .limit(1);

      if (!file) {
        return {
          success: false,
          message: 'File not found',
        };
      }

      // Check permissions
      const user = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user[0]?.role !== 'platform_admin' && file.userId !== userId) {
        return {
          success: false,
          message: 'Access denied',
        };
      }

      const [updatedFile] = await db
        .update(files)
        .set(updateData)
        .where(eq(files.id, fileId))
        .returning();

      logger.info(`File updated: ${fileId} by user ${userId}`);

      return {
        success: true,
        message: 'File updated successfully',
        data: { file: updatedFile },
      };
    } catch (error) {
      logger.error('Update file service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async deleteFile(fileId: string, userId: string, companyId: string) {
    try {
      // Check if file exists and user has permission
      const [file] = await db
        .select()
        .from(files)
        .where(and(eq(files.id, fileId), eq(files.companyId, companyId)))
        .limit(1);

      if (!file) {
        return {
          success: false,
          message: 'File not found',
        };
      }

      // Check permissions
      const user = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user[0]?.role !== 'platform_admin' && file.userId !== userId) {
        return {
          success: false,
          message: 'Access denied',
        };
      }

      // Delete physical file
      try {
        if (fs.existsSync(file.filePath)) {
          fs.unlinkSync(file.filePath);
        }
      } catch (fileError) {
        logger.warn(`Failed to delete physical file: ${file.filePath}`, fileError);
      }

      // Delete from database
      await db.delete(files).where(eq(files.id, fileId));

      logger.info(`File deleted: ${fileId} by user ${userId}`);

      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      logger.error('Delete file service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async shareFile(fileId: string, userId: string, companyId: string, shareData: ShareFileData) {
    try {
      // Check if file exists and user has permission
      const [file] = await db
        .select()
        .from(files)
        .where(and(eq(files.id, fileId), eq(files.companyId, companyId)))
        .limit(1);

      if (!file) {
        return {
          success: false,
          message: 'File not found',
        };
      }

      // Check permissions
      const user = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user[0]?.role !== 'platform_admin' && file.userId !== userId) {
        return {
          success: false,
          message: 'Access denied',
        };
      }

      // Create file shares
      const shares = shareData.userIds.map(sharedWithUserId => ({
        fileId,
        sharedWithUserId,
        sharedByUserId: userId,
        permissions: shareData.permissions,
        expiresAt: shareData.expiresAt,
      }));

      const createdShares = await db
        .insert(fileShares)
        .values(shares)
        .returning();

      logger.info(`File shared: ${fileId} with ${shareData.userIds.length} users by ${userId}`);

      return {
        success: true,
        message: 'File shared successfully',
        data: { shares: createdShares },
      };
    } catch (error) {
      logger.error('Share file service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async getFileShares(fileId: string, userId: string, companyId: string, page: number = 1, limit: number = 20) {
    try {
      const offset = (page - 1) * limit;

      // Check if file exists and user has permission
      const [file] = await db
        .select()
        .from(files)
        .where(and(eq(files.id, fileId), eq(files.companyId, companyId)))
        .limit(1);

      if (!file) {
        return {
          success: false,
          message: 'File not found',
        };
      }

      // Check permissions
      const user = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user[0]?.role !== 'platform_admin' && file.userId !== userId) {
        return {
          success: false,
          message: 'Access denied',
        };
      }

      const shares = await db
        .select({
          id: fileShares.id,
          sharedWithUserId: fileShares.sharedWithUserId,
          permissions: fileShares.permissions,
          expiresAt: fileShares.expiresAt,
          isActive: fileShares.isActive,
          sharedAt: fileShares.sharedAt,
          lastAccessedAt: fileShares.lastAccessedAt,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(fileShares)
        .innerJoin(users, eq(fileShares.sharedWithUserId, users.id))
        .where(eq(fileShares.fileId, fileId))
        .orderBy(desc(fileShares.sharedAt))
        .limit(limit)
        .offset(offset);

      const totalCount = await db
        .select({ count: count() })
        .from(fileShares)
        .where(eq(fileShares.fileId, fileId));

      return {
        success: true,
        data: {
          shares,
          pagination: {
            page,
            limit,
            total: totalCount[0].count,
            pages: Math.ceil(totalCount[0].count / limit),
          },
        },
      };
    } catch (error) {
      logger.error('Get file shares service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async revokeFileShare(fileId: string, shareId: string, userId: string, companyId: string) {
    try {
      // Check if file exists and user has permission
      const [file] = await db
        .select()
        .from(files)
        .where(and(eq(files.id, fileId), eq(files.companyId, companyId)))
        .limit(1);

      if (!file) {
        return {
          success: false,
          message: 'File not found',
        };
      }

      // Check permissions
      const user = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user[0]?.role !== 'platform_admin' && file.userId !== userId) {
        return {
          success: false,
          message: 'Access denied',
        };
      }

      // Revoke share
      await db
        .update(fileShares)
        .set({ isActive: false })
        .where(and(eq(fileShares.id, shareId), eq(fileShares.fileId, fileId)));

      logger.info(`File share revoked: ${shareId} for file ${fileId} by user ${userId}`);

      return {
        success: true,
        message: 'File share revoked successfully',
      };
    } catch (error) {
      logger.error('Revoke file share service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async getFileAnalytics(fileId: string, userId: string, companyId: string, period: string = '30d') {
    try {
      // Check if file exists and user has permission
      const [file] = await db
        .select()
        .from(files)
        .where(and(eq(files.id, fileId), eq(files.companyId, companyId)))
        .limit(1);

      if (!file) {
        return {
          success: false,
          message: 'File not found',
        };
      }

      // Check permissions
      const user = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user[0]?.role !== 'platform_admin' && file.userId !== userId) {
        return {
          success: false,
          message: 'Access denied',
        };
      }

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get file analytics
      const [analytics] = await db
        .select({
          totalViews: count(fileAccessLogs.id),
          totalDownloads: sql<number>`COUNT(CASE WHEN ${fileAccessLogs.action} = 'download' THEN 1 END)`,
          totalShares: sql<number>`COUNT(CASE WHEN ${fileAccessLogs.action} = 'share' THEN 1 END)`,
          uniqueViewers: sql<number>`COUNT(DISTINCT ${fileAccessLogs.userId})`,
        })
        .from(fileAccessLogs)
        .where(and(
          eq(fileAccessLogs.fileId, fileId),
          gte(fileAccessLogs.accessedAt, startDate)
        ));

      // Get recent activity
      const recentActivity = await db
        .select({
          date: sql<string>`DATE(${fileAccessLogs.accessedAt})`,
          views: sql<number>`COUNT(CASE WHEN ${fileAccessLogs.action} = 'view' THEN 1 END)`,
          downloads: sql<number>`COUNT(CASE WHEN ${fileAccessLogs.action} = 'download' THEN 1 END)`,
          shares: sql<number>`COUNT(CASE WHEN ${fileAccessLogs.action} = 'share' THEN 1 END)`,
        })
        .from(fileAccessLogs)
        .where(and(
          eq(fileAccessLogs.fileId, fileId),
          gte(fileAccessLogs.accessedAt, startDate)
        ))
        .groupBy(sql`DATE(${fileAccessLogs.accessedAt})`)
        .orderBy(sql`DATE(${fileAccessLogs.accessedAt})`);

      return {
        success: true,
        data: {
          fileId,
          period,
          analytics,
          recentActivity,
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      logger.error('Get file analytics service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async exportFiles(
    userId: string,
    companyId: string,
    format: string = 'csv',
    category?: string,
    dateFrom?: string,
    dateTo?: string
  ) {
    try {
      const conditions = [eq(files.companyId, companyId)];

      // Filter by user (unless platform admin)
      const user = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user[0]?.role !== 'platform_admin') {
        conditions.push(eq(files.userId, userId));
      }

      if (category) {
        conditions.push(eq(files.category, category));
      }

      if (dateFrom) {
        conditions.push(gte(files.uploadedAt, new Date(dateFrom)));
      }

      if (dateTo) {
        conditions.push(lte(files.uploadedAt, new Date(dateTo)));
      }

      const filesList = await db
        .select({
          id: files.id,
          originalName: files.originalName,
          fileName: files.fileName,
          mimeType: files.mimeType,
          fileSize: files.fileSize,
          category: files.category,
          description: files.description,
          isPublic: files.isPublic,
          downloadCount: files.downloadCount,
          viewCount: files.viewCount,
          uploadedAt: files.uploadedAt,
          user: {
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(files)
        .innerJoin(users, eq(files.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(files.uploadedAt));

      if (format === 'csv') {
        const csvData = [
          'File ID,Original Name,File Name,MIME Type,File Size,Category,Description,Is Public,Download Count,View Count,Uploaded At,Uploaded By',
          ...filesList.map(f => 
            `${f.id},${f.originalName},${f.fileName},${f.mimeType},${f.fileSize},${f.category},${f.description || ''},${f.isPublic},${f.downloadCount},${f.viewCount},${f.uploadedAt},${f.user.firstName} ${f.user.lastName}`
          ).join('\n')
        ].join('\n');

        return {
          success: true,
          data: {
            format: 'csv',
            content: csvData,
            filename: `files-export-${new Date().toISOString().split('T')[0]}.csv`,
          },
        };
      } else {
        return {
          success: true,
          data: {
            format: 'json',
            files: filesList,
            exportedAt: new Date(),
            totalCount: filesList.length,
          },
        };
      }
    } catch (error) {
      logger.error('Export files service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async cleanupFiles(olderThan: Date, category?: string, dryRun: boolean = true) {
    try {
      const conditions = [lte(files.uploadedAt, olderThan)];

      if (category) {
        conditions.push(eq(files.category, category));
      }

      const filesToDelete = await db
        .select()
        .from(files)
        .where(and(...conditions));

      if (dryRun) {
        return {
          success: true,
          data: {
            dryRun: true,
            filesToDelete: filesToDelete.length,
            files: filesToDelete.map(f => ({
              id: f.id,
              fileName: f.fileName,
              filePath: f.filePath,
              uploadedAt: f.uploadedAt,
            })),
          },
        };
      }

      // Actually delete files
      let deletedCount = 0;
      for (const file of filesToDelete) {
        try {
          // Delete physical file
          if (fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
          }

          // Delete from database
          await db.delete(files).where(eq(files.id, file.id));
          deletedCount++;
        } catch (fileError) {
          logger.warn(`Failed to delete file ${file.id}:`, fileError);
        }
      }

      logger.info(`File cleanup completed: ${deletedCount} files deleted`);

      return {
        success: true,
        data: {
          dryRun: false,
          deletedCount,
          totalFound: filesToDelete.length,
        },
      };
    } catch (error) {
      logger.error('Cleanup files service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }
}
