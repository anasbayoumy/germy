import { z } from 'zod';

export const departmentSchemas = {
  // Query schemas
  getDepartmentsQuery: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    search: z.string().optional(),
  }),

  // Params schemas
  departmentIdParams: z.object({
    id: z.string().uuid('Invalid department ID format'),
  }),

  removeDepartmentUserParams: z.object({
    id: z.string().uuid('Invalid department ID format'),
    userId: z.string().uuid('Invalid user ID format'),
  }),

  // Body schemas
  createDepartment: z.object({
    body: z.object({
      name: z.string().min(1, 'Department name is required').max(255),
      description: z.string().max(1000).optional(),
      parentId: z.string().uuid('Invalid parent department ID format').optional(),
      managerId: z.string().uuid('Invalid manager ID format').optional(),
      color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
    }),
  }),

  updateDepartment: z.object({
    body: z.object({
      name: z.string().min(1, 'Department name is required').max(255).optional(),
      description: z.string().max(1000).optional(),
      parentId: z.string().uuid('Invalid parent department ID format').optional(),
      managerId: z.string().uuid('Invalid manager ID format').optional(),
      color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
      isActive: z.boolean().optional(),
    }),
    params: z.object({
      id: z.string().uuid('Invalid department ID format'),
    }),
  }),

  addDepartmentUser: z.object({
    body: z.object({
      userId: z.string().uuid('Invalid user ID format'),
      role: z.enum(['member', 'lead', 'manager', 'head']).default('member'),
    }),
    params: z.object({
      id: z.string().uuid('Invalid department ID format'),
    }),
  }),

  // Enhanced department schemas
  getDepartmentUsersQuery: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    role: z.enum(['member', 'lead', 'manager', 'head']).optional(),
    isActive: z.string().transform(val => val === 'true').optional(),
  }),

  updateDepartmentUser: z.object({
    body: z.object({
      role: z.enum(['member', 'lead', 'manager', 'head']).optional(),
      isActive: z.boolean().optional(),
    }),
    params: z.object({
      id: z.string().uuid('Invalid department ID format'),
      userId: z.string().uuid('Invalid user ID format'),
    }),
  }),

  bulkAddDepartmentUsers: z.object({
    body: z.object({
      userIds: z.array(z.string().uuid('Invalid user ID format')).min(1, 'At least one user ID is required').max(50, 'Maximum 50 users allowed'),
      role: z.enum(['member', 'lead', 'manager', 'head']).default('member'),
    }),
    params: z.object({
      id: z.string().uuid('Invalid department ID format'),
    }),
  }),

  bulkRemoveDepartmentUsers: z.object({
    body: z.object({
      userIds: z.array(z.string().uuid('Invalid user ID format')).min(1, 'At least one user ID is required').max(50, 'Maximum 50 users allowed'),
    }),
    params: z.object({
      id: z.string().uuid('Invalid department ID format'),
    }),
  }),

  getDepartmentHierarchy: z.object({
    params: z.object({
      id: z.string().uuid('Invalid department ID format'),
    }),
    query: z.object({
      includeInactive: z.string().transform(val => val === 'true').default('false'),
      maxDepth: z.string().transform(Number).default('5'),
    }),
  }),

  getDepartmentAnalytics: z.object({
    params: z.object({
      id: z.string().uuid('Invalid department ID format'),
    }),
    query: z.object({
      period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
      includeSubDepartments: z.string().transform(val => val === 'true').default('true'),
    }),
  }),

  exportDepartmentUsers: z.object({
    params: z.object({
      id: z.string().uuid('Invalid department ID format'),
    }),
    query: z.object({
      format: z.enum(['csv', 'json']).default('csv'),
      includeInactive: z.string().transform(val => val === 'true').default('false'),
      includeSubDepartments: z.string().transform(val => val === 'true').default('false'),
    }),
  }),
};