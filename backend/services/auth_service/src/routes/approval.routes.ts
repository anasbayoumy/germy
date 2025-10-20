import express from 'express';
import { ApprovalController } from '../controllers/approval.controller';
import { authenticateToken, requirePlatformAdmin, requireCompanySuperAdmin, requireCompanyAdmin, requireAdminOrSuperAdmin, requireSuperAdminOrHigher } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { approvalSchemas } from '../schemas/approval.schemas';

const router = express.Router();
const approvalController = new ApprovalController();

// Apply authentication to all routes
router.use(authenticateToken);

// Create approval request (admin, super admin, platform admin)
router.post(
  '/requests',
  requireAdminOrSuperAdmin,
  validateRequest(approvalSchemas.createApprovalRequest),
  approvalController.createApprovalRequest.bind(approvalController)
);

// Get pending approvals (admin, super admin, platform admin)
router.get(
  '/pending',
  requireAdminOrSuperAdmin,
  validateRequest(approvalSchemas.getPendingApprovalsQuery),
  approvalController.getPendingApprovals.bind(approvalController)
);

// Approve user (admin, super admin, platform admin)
router.post(
  '/requests/:requestId/approve',
  requireAdminOrSuperAdmin,
  validateRequest(approvalSchemas.approveUser),
  approvalController.approveUser.bind(approvalController)
);

// Reject user (admin, super admin, platform admin)
router.post(
  '/requests/:requestId/reject',
  requireAdminOrSuperAdmin,
  validateRequest(approvalSchemas.rejectUser),
  approvalController.rejectUser.bind(approvalController)
);

// Get approval history (admin, super admin, platform admin)
router.get(
  '/history/:userId',
  requireAdminOrSuperAdmin,
  validateRequest(approvalSchemas.getApprovalHistoryQuery),
  approvalController.getApprovalHistory.bind(approvalController)
);

export default router;
