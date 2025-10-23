import { z } from 'zod';

export const userSchemas = {
  // Query schemas
  getUsersQuery: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    search: z.string().optional(),
    role: z.enum(['platform_admin', 'company_super_admin', 'company_admin', 'user']).optional(),
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
      phone: z.string().regex(/^[\+]?[0-9][\d]{0,15}$/, 'Invalid phone number format').optional(),
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
        role: z.enum(['user', 'company_admin', 'company_super_admin']).default('user'),
        isActive: z.boolean().default(true),
      })).min(1, 'At least one user is required'),
    }),
  }),

  // New schemas for missing endpoints
  createUser: z.object({
    body: z.object({
      email: z.string().email('Invalid email format'),
      firstName: z.string().min(1, 'First name is required').max(100),
      lastName: z.string().min(1, 'Last name is required').max(100),
      phone: z.string().max(20).optional(),
      position: z.string().max(100).optional(),
      department: z.string().max(100).optional(),
      hireDate: z.string().datetime().optional(),
      salary: z.number().min(0).optional(),
      role: z.enum(['user', 'company_admin', 'company_super_admin']).default('user'),
      isActive: z.boolean().default(true),
      companyId: z.string().uuid('Invalid company ID format'),
    }),
  }),

  bulkCreateUsers: z.object({
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
        role: z.enum(['user', 'company_admin', 'company_super_admin']).default('user'),
        isActive: z.boolean().default(true),
        companyId: z.string().uuid('Invalid company ID format'),
      })).min(1, 'At least one user is required').max(50, 'Maximum 50 users allowed'),
    }),
  }),

  bulkDeleteUsers: z.object({
    body: z.object({
      userIds: z.array(z.string().uuid('Invalid user ID format')).min(1, 'At least one user ID is required').max(100, 'Maximum 100 users allowed'),
    }),
  }),

  bulkActivateUsers: z.object({
    body: z.object({
      userIds: z.array(z.string().uuid('Invalid user ID format')).min(1, 'At least one user ID is required').max(100, 'Maximum 100 users allowed'),
    }),
  }),

  bulkDeactivateUsers: z.object({
    body: z.object({
      userIds: z.array(z.string().uuid('Invalid user ID format')).min(1, 'At least one user ID is required').max(100, 'Maximum 100 users allowed'),
    }),
  }),

  createUserActivity: z.object({
    body: z.object({
      action: z.string().min(1, 'Action is required').max(100),
      resourceType: z.string().min(1, 'Resource type is required').max(100),
      resourceId: z.string().uuid('Invalid resource ID format').optional(),
      description: z.string().max(500).optional(),
      metadata: z.record(z.any()).optional(),
    }),
    params: z.object({
      id: z.string().uuid('Invalid user ID format'),
    }),
  }),

  updateUserActivity: z.object({
    body: z.object({
      action: z.string().min(1, 'Action is required').max(100).optional(),
      resourceType: z.string().min(1, 'Resource type is required').max(100).optional(),
      resourceId: z.string().uuid('Invalid resource ID format').optional(),
      description: z.string().max(500).optional(),
      metadata: z.record(z.any()).optional(),
    }),
    params: z.object({
      id: z.string().uuid('Invalid user ID format'),
      activityId: z.string().uuid('Invalid activity ID format'),
    }),
  }),

  activityIdParams: z.object({
    id: z.string().uuid('Invalid user ID format'),
    activityId: z.string().uuid('Invalid activity ID format'),
  }),

  advancedSearch: z.object({
    body: z.object({
      query: z.string().min(1, 'Search query is required'),
      filters: z.object({
        roles: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        companyId: z.string().uuid().optional(),
        dateRange: z.object({
          start: z.string().datetime().optional(),
          end: z.string().datetime().optional(),
        }).optional(),
        departments: z.array(z.string()).optional(),
        positions: z.array(z.string()).optional(),
      }).optional(),
      sortBy: z.enum(['firstName', 'lastName', 'email', 'createdAt', 'lastLogin']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }),
  }),

  saveSearch: z.object({
    body: z.object({
      name: z.string().min(1, 'Search name is required').max(100),
      description: z.string().max(500).optional(),
      query: z.string().min(1, 'Search query is required'),
      filters: z.record(z.any()).optional(),
      isPublic: z.boolean().default(false),
    }),
  }),

  updateSearch: z.object({
    body: z.object({
      name: z.string().min(1, 'Search name is required').max(100).optional(),
      description: z.string().max(500).optional(),
      query: z.string().min(1, 'Search query is required').optional(),
      filters: z.record(z.any()).optional(),
      isPublic: z.boolean().optional(),
    }),
    params: z.object({
      searchId: z.string().uuid('Invalid search ID format'),
    }),
  }),

  searchIdParams: z.object({
    searchId: z.string().uuid('Invalid search ID format'),
  }),

  userPermissions: z.object({
    body: z.object({
      permissions: z.array(z.string()).min(1, 'At least one permission is required'),
    }),
    params: z.object({
      id: z.string().uuid('Invalid user ID format'),
    }),
  }),

  userRoles: z.object({
    body: z.object({
      roles: z.array(z.string()).min(1, 'At least one role is required'),
    }),
    params: z.object({
      id: z.string().uuid('Invalid user ID format'),
    }),
  }),

  customReport: z.object({
    body: z.object({
      name: z.string().min(1, 'Report name is required').max(100),
      description: z.string().max(500).optional(),
      type: z.enum(['user_activity', 'user_statistics', 'company_analytics', 'custom']),
      filters: z.record(z.any()).optional(),
      dateRange: z.object({
        start: z.string().datetime(),
        end: z.string().datetime(),
      }),
      format: z.enum(['json', 'csv', 'pdf']).default('json'),
      schedule: z.object({
        enabled: z.boolean().default(false),
        frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
        time: z.string().optional(),
      }).optional(),
    }),
  }),

  reportIdParams: z.object({
    reportId: z.string().uuid('Invalid report ID format'),
  }),

  exportByRole: z.object({
    params: z.object({
      role: z.enum(['user', 'company_admin', 'company_super_admin', 'platform_admin']),
    }),
    query: z.object({
      format: z.enum(['csv', 'json']).default('csv'),
      includeInactive: z.boolean().default(false),
    }),
  }),
};