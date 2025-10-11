import { z } from 'zod';

export const userSchemas = {
  // Query schemas
  getUsersQuery: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    search: z.string().optional(),
    role: z.enum(['platform_super_admin', 'company_super_admin', 'company_admin', 'employee']).optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),

  searchUsersQuery: z.object({
    q: z.string().min(1, 'Search query is required'),
    limit: z.string().transform(Number).default('10'),
  }),

  getUserActivitiesQuery: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
  }),

  getUserActivitySummaryQuery: z.object({
    days: z.string().transform(Number).default('30'),
  }),

  // Params schemas
  userIdParams: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),

  companyIdParams: z.object({
    companyId: z.string().uuid('Invalid company ID format'),
  }),

  // Body schemas
  updateUser: z.object({
    body: z.object({
      firstName: z.string().min(1, 'First name is required').max(100).optional(),
      lastName: z.string().min(1, 'Last name is required').max(100).optional(),
      phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format').optional(),
      position: z.string().max(100).optional(),
      department: z.string().max(100).optional(),
      hireDate: z.string().datetime().optional(),
      salary: z.number().positive().optional(),
      profilePhotoUrl: z.string().url().optional(),
      isActive: z.boolean().optional(),
    }),
    params: z.object({
      id: z.string().uuid('Invalid user ID format'),
    }),
  }),

  updateUserPreferences: z.object({
    body: z.object({
      theme: z.enum(['light', 'dark', 'auto']).optional(),
      language: z.string().length(2).optional(),
      timezone: z.string().max(50).optional(),
      dateFormat: z.string().max(20).optional(),
      timeFormat: z.enum(['12h', '24h']).optional(),
      notifications: z.record(z.any()).optional(),
      privacy: z.record(z.any()).optional(),
    }),
    params: z.object({
      id: z.string().uuid('Invalid user ID format'),
    }),
  }),

  updateUserSettings: z.object({
    body: z.object({
      workHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
      workHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
      workDays: z.array(z.number().min(1).max(7)).optional(),
      breakDuration: z.number().min(0).max(480).optional(), // 0-8 hours in minutes
      overtimeEnabled: z.boolean().optional(),
      remoteWorkEnabled: z.boolean().optional(),
      attendanceReminders: z.record(z.any()).optional(),
    }),
    params: z.object({
      id: z.string().uuid('Invalid user ID format'),
    }),
  }),

  bulkUpdateUsers: z.object({
    body: z.object({
      userIds: z.array(z.string().uuid('Invalid user ID format')).min(1, 'At least one user ID is required'),
      updateData: z.object({
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
        phone: z.string().max(20).optional(),
        position: z.string().max(100).optional(),
        department: z.string().max(100).optional(),
        hireDate: z.string().datetime().optional(),
        salary: z.number().min(0).optional(),
        isActive: z.boolean().optional(),
      }),
    }),
  }),

  importUsers: z.object({
    body: z.object({
      usersData: z.array(z.object({
        email: z.string().email('Invalid email format'),
        firstName: z.string().min(1, 'First name is required').max(100),
        lastName: z.string().min(1, 'Last name is required').max(100),
        phone: z.string().max(20).optional(),
        position: z.string().max(100).optional(),
        department: z.string().max(100).optional(),
        hireDate: z.string().datetime().optional(),
        salary: z.number().min(0).optional(),
        role: z.enum(['employee', 'company_admin', 'company_super_admin']).default('employee'),
        isActive: z.boolean().default(true),
      })).min(1, 'At least one user is required'),
    }),
  }),
};