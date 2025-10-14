import { eq, and, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { users, userApprovalRequests } from '../db/schema';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface ApprovalRequestData {
  userId: string;
  requestedRole: string;
  requestType: string;
  requestData?: any;
}

export interface ApprovalResult {
  success: boolean;
  message: string;
  data?: any;
}

export class ApprovalService {

  // Create approval request
  async createApprovalRequest(
    data: ApprovalRequestData,
    requesterId: string,
    companyId: string,
    requesterRole: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ApprovalResult> {
    try {
      // Validate requester permissions
      if (!['admin', 'company_super_admin', 'platform_admin'].includes(requesterRole)) {
        return {
          success: false,
          message: 'Insufficient permissions to create approval requests',
        };
      }

      // Check if user exists
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, data.userId))
        .limit(1);

      if (user.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const userData = user[0];

      // Check if user is in the same company (for non-platform admins)
      if (requesterRole !== 'platform_admin' && userData.companyId !== companyId) {
        return {
          success: false,
          message: 'Cannot create approval request for user in different company',
        };
      }

      // Check if there's already a pending request
      const existingRequest = await db
        .select()
        .from(userApprovalRequests)
        .where(
          and(
            eq(userApprovalRequests.userId, data.userId),
            eq(userApprovalRequests.status, 'pending')
          )
        )
        .limit(1);

      if (existingRequest.length > 0) {
        return {
          success: false,
          message: 'User already has a pending approval request',
        };
      }

      // Create approval request
      const [approvalRequest] = await db
        .insert(userApprovalRequests)
        .values({
          userId: data.userId,
          companyId: userData.companyId,
          requestedRole: data.requestedRole,
          requestType: data.requestType,
          requestData: data.requestData,
          status: 'pending',
        })
        .returning();

      logger.info(`Approval request created for user ${data.userId} by ${requesterId}`);

      return {
        success: true,
        message: 'Approval request created successfully',
        data: { approvalRequest },
      };
    } catch (error) {
      logger.error('Create approval request error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Get pending approvals
  async getPendingApprovals(
    filters: { page: number; limit: number; companyId?: string },
    requesterId: string,
    requesterRole: string,
    requesterCompanyId: string
  ): Promise<ApprovalResult> {
    try {
      // Validate requester permissions
      if (!['admin', 'company_super_admin', 'platform_admin'].includes(requesterRole)) {
        return {
          success: false,
          message: 'Insufficient permissions to view approval requests',
        };
      }

      let whereConditions = [eq(userApprovalRequests.status, 'pending')];

      // Filter by company if not platform admin
      if (requesterRole !== 'platform_admin') {
        whereConditions.push(eq(userApprovalRequests.companyId, requesterCompanyId));
      } else if (filters.companyId) {
        whereConditions.push(eq(userApprovalRequests.companyId, filters.companyId));
      }

      const whereCondition = whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0];

      const offset = (filters.page - 1) * filters.limit;

      const [approvalRequests, totalCount] = await Promise.all([
        db
          .select({
            id: userApprovalRequests.id,
            userId: userApprovalRequests.userId,
            companyId: userApprovalRequests.companyId,
            requestedRole: userApprovalRequests.requestedRole,
            requestType: userApprovalRequests.requestType,
            requestData: userApprovalRequests.requestData,
            status: userApprovalRequests.status,
            createdAt: userApprovalRequests.createdAt,
            user: {
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email,
              currentRole: users.role,
            },
          })
          .from(userApprovalRequests)
          .innerJoin(users, eq(userApprovalRequests.userId, users.id))
          .where(whereCondition)
          .orderBy(desc(userApprovalRequests.createdAt))
          .limit(filters.limit)
          .offset(offset),
        db
          .select({ count: userApprovalRequests.id })
          .from(userApprovalRequests)
          .where(whereCondition)
      ]);

      return {
        success: true,
        message: 'Approval requests retrieved successfully',
        data: {
          approvalRequests,
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total: totalCount.length,
            totalPages: Math.ceil(totalCount.length / filters.limit),
          },
        },
      };
    } catch (error) {
      logger.error('Get pending approvals error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Approve user
  async approveUser(
    requestId: string,
    approverId: string,
    approverRole: string,
    approverCompanyId: string,
    notes?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ApprovalResult> {
    try {
      // Validate approver permissions
      if (!['admin', 'company_super_admin', 'platform_admin'].includes(approverRole)) {
        return {
          success: false,
          message: 'Insufficient permissions to approve users',
        };
      }

      // Get approval request
      const approvalRequest = await db
        .select()
        .from(userApprovalRequests)
        .where(eq(userApprovalRequests.id, requestId))
        .limit(1);

      if (approvalRequest.length === 0) {
        return {
          success: false,
          message: 'Approval request not found',
        };
      }

      const request = approvalRequest[0];

      // Check if request is still pending
      if (request.status !== 'pending') {
        return {
          success: false,
          message: 'Approval request is no longer pending',
        };
      }

      // Check company permissions
      if (approverRole !== 'platform_admin' && request.companyId !== approverCompanyId) {
        return {
          success: false,
          message: 'Cannot approve user from different company',
        };
      }

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Update approval request
        await tx
          .update(userApprovalRequests)
          .set({
            status: 'approved',
            reviewedBy: approverId,
            reviewedAt: new Date(),
            reviewNotes: notes,
          })
          .where(eq(userApprovalRequests.id, requestId));

        // Update user
        const updateData: any = {
          approvalStatus: 'approved',
          approvedBy: approverId,
          approvedAt: new Date(),
        };

        // Set role-based access permissions
        switch (request.requestedRole) {
          case 'user':
            updateData.mobileAppAccess = true;
            break;
          case 'admin':
            updateData.mobileAppAccess = true;
            updateData.dashboardAccess = true;
            break;
          case 'company_super_admin':
            updateData.dashboardAccess = true;
            break;
          case 'platform_admin':
            updateData.platformPanelAccess = true;
            break;
        }

        await tx
          .update(users)
          .set(updateData)
          .where(eq(users.id, request.userId));

        return { success: true };
      });

      logger.info(`User ${request.userId} approved by ${approverId}`);

      return {
        success: true,
        message: 'User approved successfully',
      };
    } catch (error) {
      logger.error('Approve user error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Reject user
  async rejectUser(
    requestId: string,
    rejectorId: string,
    rejectorRole: string,
    rejectorCompanyId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ApprovalResult> {
    try {
      // Validate rejector permissions
      if (!['admin', 'company_super_admin', 'platform_admin'].includes(rejectorRole)) {
        return {
          success: false,
          message: 'Insufficient permissions to reject users',
        };
      }

      // Get approval request
      const approvalRequest = await db
        .select()
        .from(userApprovalRequests)
        .where(eq(userApprovalRequests.id, requestId))
        .limit(1);

      if (approvalRequest.length === 0) {
        return {
          success: false,
          message: 'Approval request not found',
        };
      }

      const request = approvalRequest[0];

      // Check if request is still pending
      if (request.status !== 'pending') {
        return {
          success: false,
          message: 'Approval request is no longer pending',
        };
      }

      // Check company permissions
      if (rejectorRole !== 'platform_admin' && request.companyId !== rejectorCompanyId) {
        return {
          success: false,
          message: 'Cannot reject user from different company',
        };
      }

      // Start transaction
      await db.transaction(async (tx) => {
        // Update approval request
        await tx
          .update(userApprovalRequests)
          .set({
            status: 'rejected',
            reviewedBy: rejectorId,
            reviewedAt: new Date(),
            rejectionReason: reason,
          })
          .where(eq(userApprovalRequests.id, requestId));

        // Update user
        await tx
          .update(users)
          .set({
            approvalStatus: 'rejected',
            rejectionReason: reason,
          })
          .where(eq(users.id, request.userId));
      });

      logger.info(`User ${request.userId} rejected by ${rejectorId}: ${reason}`);

      return {
        success: true,
        message: 'User rejected successfully',
      };
    } catch (error) {
      logger.error('Reject user error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Get approval history
  async getApprovalHistory(
    userId: string,
    filters: { page: number; limit: number },
    requesterId: string,
    requesterRole: string,
    requesterCompanyId: string
  ): Promise<ApprovalResult> {
    try {
      // Validate requester permissions
      if (!['admin', 'company_super_admin', 'platform_admin'].includes(requesterRole)) {
        return {
          success: false,
          message: 'Insufficient permissions to view approval history',
        };
      }

      // Check if requester can access this user's data
      if (requesterRole !== 'platform_admin') {
        const user = await db
          .select({ companyId: users.companyId })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (user.length === 0 || user[0].companyId !== requesterCompanyId) {
          return {
            success: false,
            message: 'Cannot access approval history for user in different company',
          };
        }
      }

      const offset = (filters.page - 1) * filters.limit;

      const [approvalHistory, totalCount] = await Promise.all([
        db
          .select()
          .from(userApprovalRequests)
          .where(eq(userApprovalRequests.userId, userId))
          .orderBy(desc(userApprovalRequests.createdAt))
          .limit(filters.limit)
          .offset(offset),
        db
          .select({ count: userApprovalRequests.id })
          .from(userApprovalRequests)
          .where(eq(userApprovalRequests.userId, userId))
      ]);

      return {
        success: true,
        message: 'Approval history retrieved successfully',
        data: {
          approvalHistory,
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total: totalCount.length,
            totalPages: Math.ceil(totalCount.length / filters.limit),
          },
        },
      };
    } catch (error) {
      logger.error('Get approval history error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }
}
