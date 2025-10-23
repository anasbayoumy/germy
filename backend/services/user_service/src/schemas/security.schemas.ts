import { z } from 'zod';

export const securitySchemas = {
  updateSecuritySettings: z.object({
    body: z.object({
      maxLoginAttempts: z.number().min(1).max(20).optional(),
      lockoutDuration: z.number().min(1).max(1440).optional(), // 1 minute to 24 hours
      passwordMinLength: z.number().min(6).max(50).optional(),
      passwordRequireUppercase: z.boolean().optional(),
      passwordRequireLowercase: z.boolean().optional(),
      passwordRequireNumbers: z.boolean().optional(),
      passwordRequireSymbols: z.boolean().optional(),
      sessionTimeout: z.number().min(15).max(1440).optional(), // 15 minutes to 24 hours
      requireMFA: z.boolean().optional(),
      allowedIPs: z.array(z.string().ip()).optional(),
      blockedIPs: z.array(z.string().ip()).optional(),
    }),
  }),

  validatePassword: z.object({
    body: z.object({
      password: z.string().min(1, 'Password is required'),
    }),
  }),

  userIdParams: z.object({
    targetUserId: z.string().uuid('Invalid user ID format'),
  }),

  revokeDeviceParams: z.object({
    deviceId: z.string().uuid('Invalid device ID format'),
    targetUserId: z.string().uuid('Invalid user ID format'),
  }),

  getSecurityEventsQuery: z.object({
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('50'),
  }),

  generateSecurityReportQuery: z.object({
    dateFrom: z.string().datetime('Invalid date format'),
    dateTo: z.string().datetime('Invalid date format'),
  }),
};
