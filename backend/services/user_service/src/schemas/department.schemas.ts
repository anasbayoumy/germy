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
};