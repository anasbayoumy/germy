import { z } from 'zod';

export const auditSchemas = {
  getAuditTrailQuery: z.object({
    action: z.string().optional(),
    resourceType: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('50'),
  }),

  getSecurityEventsQuery: z.object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('50'),
  }),

  exportAuditLogQuery: z.object({
    format: z.enum(['json', 'csv']).default('json'),
    dateFrom: z.string().datetime('Invalid date format'),
    dateTo: z.string().datetime('Invalid date format'),
    action: z.string().optional(),
    resourceType: z.string().optional(),
  }),

  cleanupOldLogs: z.object({
    body: z.object({
      olderThanDays: z.number().min(1).max(3650).default(365), // 1 day to 10 years
    }),
  }),
};
