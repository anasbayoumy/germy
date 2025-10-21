import { eq, and, lt, gte } from 'drizzle-orm';
import { db } from '../config/database';
import { users, faceEncodingHistory } from '../db/schema';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface FaceEncodingResult {
  success: boolean;
  message: string;
  data?: any;
}

export class FaceEncodingService {

  // Create face encoding
  async createFaceEncoding(
    userId: string,
    encodingData: string,
    qualityScore: number,
    requesterId: string,
    requesterRole: string,
    requesterCompanyId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<FaceEncodingResult> {
    try {
      // Validate requester permissions
      if (!['user', 'company_admin', 'company_super_admin', 'platform_admin'].includes(requesterRole)) {
        return {
          success: false,
          message: 'Insufficient permissions to create face encodings',
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

      const userData = user[0];

      // Check if user is approved
      if (userData.approvalStatus !== 'approved') {
        return {
          success: false,
          message: 'User must be approved before creating face encoding',
        };
      }

      // Check company permissions (users can only create their own, admins can create for their company)
      if (requesterRole === 'user' && requesterId !== userId) {
        return {
          success: false,
          message: 'Users can only create their own face encodings',
        };
      }

      if (requesterRole !== 'platform_admin' && userData.companyId !== requesterCompanyId) {
        return {
          success: false,
          message: 'Cannot create face encoding for user in different company',
        };
      }

      // Validate quality score
      if (qualityScore < 0 || qualityScore > 100) {
        return {
          success: false,
          message: 'Quality score must be between 0 and 100',
        };
      }

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Deactivate existing face encodings for this user
        await tx
          .update(faceEncodingHistory)
          .set({ isActive: false })
          .where(
            and(
              eq(faceEncodingHistory.userId, userId),
              eq(faceEncodingHistory.isActive, true)
            )
          );

        // Create new face encoding
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 45); // 45 days from now

        const [faceEncoding] = await tx
          .insert(faceEncodingHistory)
          .values({
            userId: userId,
            companyId: userData.companyId,
            encodingData: encodingData,
            qualityScore: qualityScore,
            encodingVersion: 'v1',
            isActive: true,
            expiresAt: expiresAt,
          })
          .returning();

        // Update user table with face encoding info
        await tx
          .update(users)
          .set({
            faceEncodingData: encodingData,
            faceEncodingCreatedAt: new Date(),
            faceEncodingExpiresAt: expiresAt,
            faceEncodingQualityScore: qualityScore,
          })
          .where(eq(users.id, userId));

        return { faceEncoding };
      });

      logger.info(`Face encoding created for user ${userId} by ${requesterId}`);

      return {
        success: true,
        message: 'Face encoding created successfully',
        data: { faceEncoding: result.faceEncoding },
      };
    } catch (error) {
      logger.error('Create face encoding error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Get face encoding
  async getFaceEncoding(
    userId: string,
    requesterId: string,
    requesterRole: string,
    requesterCompanyId: string
  ): Promise<FaceEncodingResult> {
    try {
      // Validate requester permissions
      if (!['user', 'company_admin', 'company_super_admin', 'platform_admin'].includes(requesterRole)) {
        return {
          success: false,
          message: 'Insufficient permissions to view face encodings',
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

      const userData = user[0];

      // Check company permissions
      if (requesterRole === 'user' && requesterId !== userId) {
        return {
          success: false,
          message: 'Users can only view their own face encodings',
        };
      }

      if (requesterRole !== 'platform_admin' && userData.companyId !== requesterCompanyId) {
        return {
          success: false,
          message: 'Cannot view face encoding for user in different company',
        };
      }

      // Get active face encoding
      const faceEncoding = await db
        .select()
        .from(faceEncodingHistory)
        .where(
          and(
            eq(faceEncodingHistory.userId, userId),
            eq(faceEncodingHistory.isActive, true)
          )
        )
        .limit(1);

      if (faceEncoding.length === 0) {
        return {
          success: false,
          message: 'No active face encoding found for user',
        };
      }

      return {
        success: true,
        data: { faceEncoding: faceEncoding[0] },
      };
    } catch (error) {
      logger.error('Get face encoding error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Update face encoding
  async updateFaceEncoding(
    userId: string,
    encodingData: string,
    qualityScore: number,
    requesterId: string,
    requesterRole: string,
    requesterCompanyId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<FaceEncodingResult> {
    try {
      // Validate requester permissions
      if (!['user', 'company_admin', 'company_super_admin', 'platform_admin'].includes(requesterRole)) {
        return {
          success: false,
          message: 'Insufficient permissions to update face encodings',
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

      const userData = user[0];

      // Check company permissions
      if (requesterRole === 'user' && requesterId !== userId) {
        return {
          success: false,
          message: 'Users can only update their own face encodings',
        };
      }

      if (requesterRole !== 'platform_admin' && userData.companyId !== requesterCompanyId) {
        return {
          success: false,
          message: 'Cannot update face encoding for user in different company',
        };
      }

      // Validate quality score
      if (qualityScore < 0 || qualityScore > 100) {
        return {
          success: false,
          message: 'Quality score must be between 0 and 100',
        };
      }

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Deactivate existing face encodings for this user
        await tx
          .update(faceEncodingHistory)
          .set({ isActive: false })
          .where(
            and(
              eq(faceEncodingHistory.userId, userId),
              eq(faceEncodingHistory.isActive, true)
            )
          );

        // Create new face encoding
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 45); // 45 days from now

        const [faceEncoding] = await tx
          .insert(faceEncodingHistory)
          .values({
            userId: userId,
            companyId: userData.companyId,
            encodingData: encodingData,
            qualityScore: qualityScore,
            encodingVersion: 'v1',
            isActive: true,
            expiresAt: expiresAt,
          })
          .returning();

        // Update user table with face encoding info
        await tx
          .update(users)
          .set({
            faceEncodingData: encodingData,
            faceEncodingCreatedAt: new Date(),
            faceEncodingExpiresAt: expiresAt,
            faceEncodingQualityScore: qualityScore,
          })
          .where(eq(users.id, userId));

        return { faceEncoding };
      });

      logger.info(`Face encoding updated for user ${userId} by ${requesterId}`);

      return {
        success: true,
        message: 'Face encoding updated successfully',
        data: { faceEncoding: result.faceEncoding },
      };
    } catch (error) {
      logger.error('Update face encoding error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Delete face encoding
  async deleteFaceEncoding(
    userId: string,
    requesterId: string,
    requesterRole: string,
    requesterCompanyId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<FaceEncodingResult> {
    try {
      // Validate requester permissions
      if (!['company_admin', 'company_super_admin', 'platform_admin'].includes(requesterRole)) {
        return {
          success: false,
          message: 'Insufficient permissions to delete face encodings',
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

      const userData = user[0];

      // Check company permissions
      if (requesterRole !== 'platform_admin' && userData.companyId !== requesterCompanyId) {
        return {
          success: false,
          message: 'Cannot delete face encoding for user in different company',
        };
      }

      // Start transaction
      await db.transaction(async (tx) => {
        // Deactivate all face encodings for this user
        await tx
          .update(faceEncodingHistory)
          .set({ isActive: false })
          .where(eq(faceEncodingHistory.userId, userId));

        // Clear face encoding data from user table
        await tx
          .update(users)
          .set({
            faceEncodingData: null,
            faceEncodingCreatedAt: null,
            faceEncodingExpiresAt: null,
            faceEncodingQualityScore: null,
          })
          .where(eq(users.id, userId));
      });

      logger.info(`Face encoding deleted for user ${userId} by ${requesterId}`);

      return {
        success: true,
        message: 'Face encoding deleted successfully',
      };
    } catch (error) {
      logger.error('Delete face encoding error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Get face encoding status
  async getFaceEncodingStatus(
    userId: string,
    requesterId: string,
    requesterRole: string,
    requesterCompanyId: string
  ): Promise<FaceEncodingResult> {
    try {
      // Validate requester permissions
      if (!['user', 'company_admin', 'company_super_admin', 'platform_admin'].includes(requesterRole)) {
        return {
          success: false,
          message: 'Insufficient permissions to view face encoding status',
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

      const userData = user[0];

      // Check company permissions
      if (requesterRole === 'user' && requesterId !== userId) {
        return {
          success: false,
          message: 'Users can only view their own face encoding status',
        };
      }

      if (requesterRole !== 'platform_admin' && userData.companyId !== requesterCompanyId) {
        return {
          success: false,
          message: 'Cannot view face encoding status for user in different company',
        };
      }

      const now = new Date();
      const expiresAt = userData.faceEncodingExpiresAt;

      let status = 'none';
      let daysUntilExpiration = null;

      if (expiresAt) {
        if (expiresAt < now) {
          status = 'expired';
        } else {
          const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          daysUntilExpiration = daysLeft;
          
          if (daysLeft <= 7) {
            status = 'expiring_soon';
          } else {
            status = 'valid';
          }
        }
      }

      return {
        success: true,
        data: {
          status,
          daysUntilExpiration,
          qualityScore: userData.faceEncodingQualityScore,
          createdAt: userData.faceEncodingCreatedAt,
          expiresAt: userData.faceEncodingExpiresAt,
        },
      };
    } catch (error) {
      logger.error('Get face encoding status error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Get users with expiring face encodings
  async getExpiringFaceEncodings(
    days: number,
    requesterId: string,
    requesterRole: string,
    requesterCompanyId: string
  ): Promise<FaceEncodingResult> {
    try {
      // Validate requester permissions
      if (!['company_admin', 'company_super_admin', 'platform_admin'].includes(requesterRole)) {
        return {
          success: false,
          message: 'Insufficient permissions to view expiring face encodings',
        };
      }

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + days);

      let whereCondition = and(
        eq(users.faceEncodingExpiresAt, null), // Has face encoding
        lt(users.faceEncodingExpiresAt, expirationDate) // Expires within specified days
      );

      // Filter by company if not platform admin
      if (requesterRole !== 'platform_admin') {
        whereCondition = and(
          whereCondition,
          eq(users.companyId, requesterCompanyId)
        );
      }

      const expiringUsers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          faceEncodingExpiresAt: users.faceEncodingExpiresAt,
          faceEncodingQualityScore: users.faceEncodingQualityScore,
        })
        .from(users)
        .where(whereCondition)
        .orderBy(users.faceEncodingExpiresAt);

      return {
        success: true,
        data: { expiringUsers },
      };
    } catch (error) {
      logger.error('Get expiring face encodings error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }
}
