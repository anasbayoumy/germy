import { Request, Response } from 'express';
import { ApprovalService } from '../services/approval.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class ApprovalController {
  private readonly approvalService = new ApprovalService();

  // Create approval request
  async createApprovalRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, requestedRole, requestType, requestData } = req.body;
      const { userId: requesterId, companyId, role: requesterRole } = req.user!;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await this.approvalService.createApprovalRequest(
        {
          userId,
          requestedRole,
          requestType,
          requestData,
        },
        requesterId,
        companyId,
        requesterRole,
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      logger.error('Create approval request controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get pending approvals
  async getPendingApprovals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, companyId } = req.query;
      const { userId, role, companyId: userCompanyId } = req.user!;

      const result = await this.approvalService.getPendingApprovals(
        {
          page: Number(page),
          limit: Number(limit),
          companyId: companyId as string,
        },
        userId,
        role,
        userCompanyId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get pending approvals controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Approve user
  async approveUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      const { notes } = req.body;
      const { userId: approverId, role: approverRole, companyId } = req.user!;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await this.approvalService.approveUser(
        requestId,
        approverId,
        approverRole,
        companyId,
        notes,
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Approve user controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Reject user
  async rejectUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      const { reason } = req.body;
      const { userId: rejectorId, role: rejectorRole, companyId } = req.user!;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await this.approvalService.rejectUser(
        requestId,
        rejectorId,
        rejectorRole,
        companyId,
        reason,
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Reject user controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get approval history
  async getApprovalHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const { userId: requesterId, role, companyId } = req.user!;

      const result = await this.approvalService.getApprovalHistory(
        userId,
        {
          page: Number(page),
          limit: Number(limit),
        },
        requesterId,
        role,
        companyId
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Get approval history controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}
