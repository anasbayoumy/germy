import { z } from 'zod';

// Create approval request schema
export const createApprovalRequestSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    requestedRole: z.enum(['user', 'company_admin', 'company_super_admin', 'platform_admin'], {
      errorMap: () => ({ message: 'Invalid requested role' }),
    }),
    requestType: z.enum(['new_signup', 'role_change', 'reactivation'], {
      errorMap: () => ({ message: 'Invalid request type' }),
    }),
    requestData: z.object({}).optional(),
  }),
});

// Get pending approvals query schema
export const getPendingApprovalsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 20),
    companyId: z.string().uuid('Invalid company ID').optional(),
  }),
});

// Approve user schema
export const approveUserSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
  }),
});

// Reject user schema
export const rejectUserSchema = z.object({
  body: z.object({
    reason: z.string().min(1, 'Rejection reason is required'),
  }),
});

// Get approval history query schema
export const getApprovalHistoryQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 20),
  }),
});

// Request ID params schema
export const requestIdParamsSchema = z.object({
  params: z.object({
    requestId: z.string().uuid('Invalid request ID'),
  }),
});

// User ID params schema
export const userIdParamsSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
});

export const approvalSchemas = {
  createApprovalRequest: createApprovalRequestSchema,
  getPendingApprovalsQuery: getPendingApprovalsQuerySchema,
  approveUser: approveUserSchema,
  rejectUser: rejectUserSchema,
  getApprovalHistoryQuery: getApprovalHistoryQuerySchema,
  requestIdParams: requestIdParamsSchema,
  userIdParams: userIdParamsSchema,
};
