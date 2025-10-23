import { z } from 'zod';

export const uploadSchemas = {
  // File upload schemas
  uploadFile: z.object({
    body: z.object({
      category: z.string().min(1).max(50).default('documents'),
      description: z.string().max(500).optional(),
      isPublic: z.boolean().default(false),
      tags: z.array(z.string().max(50)).max(10).optional(),
    }),
  }),

  uploadMultipleFiles: z.object({
    body: z.object({
      category: z.string().min(1).max(50).default('documents'),
      description: z.string().max(500).optional(),
      isPublic: z.boolean().default(false),
      tags: z.array(z.string().max(50)).max(10).optional(),
    }),
  }),

  // File management schemas
  getFilesQuery: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    category: z.string().optional(),
    userId: z.string().uuid('Invalid user ID format').optional(),
    isPublic: z.string().transform(val => val === 'true').optional(),
    tags: z.string().optional(), // Comma-separated tags
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),

  fileIdParams: z.object({
    id: z.string().uuid('Invalid file ID format'),
  }),

  updateFile: z.object({
    body: z.object({
      description: z.string().max(500).optional(),
      isPublic: z.boolean().optional(),
      tags: z.array(z.string().max(50)).max(10).optional(),
    }),
    params: z.object({
      id: z.string().uuid('Invalid file ID format'),
    }),
  }),

  // File sharing schemas
  shareFile: z.object({
    body: z.object({
      userIds: z.array(z.string().uuid('Invalid user ID format')).min(1, 'At least one user ID is required').max(50, 'Maximum 50 users allowed'),
      permissions: z.enum(['view', 'download', 'edit']).default('view'),
      expiresAt: z.string().datetime().optional(),
    }),
    params: z.object({
      id: z.string().uuid('Invalid file ID format'),
    }),
  }),

  getFileShares: z.object({
    params: z.object({
      id: z.string().uuid('Invalid file ID format'),
    }),
    query: z.object({
      page: z.string().transform(Number).default('1'),
      limit: z.string().transform(Number).default('20'),
    }),
  }),

  revokeFileShare: z.object({
    params: z.object({
      id: z.string().uuid('Invalid file ID format'),
      shareId: z.string().uuid('Invalid share ID format'),
    }),
  }),

  // File analytics schemas
  getFileAnalytics: z.object({
    params: z.object({
      id: z.string().uuid('Invalid file ID format'),
    }),
    query: z.object({
      period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
    }),
  }),

  getUserFileAnalytics: z.object({
    params: z.object({
      userId: z.string().uuid('Invalid user ID format'),
    }),
    query: z.object({
      period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
      category: z.string().optional(),
    }),
  }),

  // File export schemas
  exportFiles: z.object({
    query: z.object({
      format: z.enum(['csv', 'json']).default('csv'),
      category: z.string().optional(),
      userId: z.string().uuid('Invalid user ID format').optional(),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
    }),
  }),

  // File cleanup schemas
  cleanupFiles: z.object({
    body: z.object({
      olderThan: z.string().datetime(),
      category: z.string().optional(),
      dryRun: z.boolean().default(true),
    }),
  }),
};
