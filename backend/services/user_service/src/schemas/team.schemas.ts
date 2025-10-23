import { z } from 'zod';

export const teamSchemas = {
  // Query schemas
  getTeamsQuery: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    search: z.string().optional(),
  }),

  // Params schemas
  teamIdParams: z.object({
    id: z.string().uuid('Invalid team ID format'),
  }),

  removeTeamMemberParams: z.object({
    id: z.string().uuid('Invalid team ID format'),
    userId: z.string().uuid('Invalid user ID format'),
  }),

  // Body schemas
  createTeam: z.object({
    body: z.object({
      name: z.string().min(1, 'Team name is required').max(255),
      description: z.string().max(1000).optional(),
      managerId: z.string().uuid('Invalid manager ID format').optional(),
      color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
    }),
  }),

  updateTeam: z.object({
    body: z.object({
      name: z.string().min(1, 'Team name is required').max(255).optional(),
      description: z.string().max(1000).optional(),
      managerId: z.string().uuid('Invalid manager ID format').optional(),
      color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
      isActive: z.boolean().optional(),
    }),
    params: z.object({
      id: z.string().uuid('Invalid team ID format'),
    }),
  }),

  addTeamMember: z.object({
    body: z.object({
      userId: z.string().uuid('Invalid user ID format'),
      roleInTeam: z.enum(['member', 'lead', 'manager']).default('member'),
    }),
    params: z.object({
      id: z.string().uuid('Invalid team ID format'),
    }),
  }),

  // Enhanced team schemas
  getTeamMembersQuery: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    role: z.enum(['member', 'lead', 'manager']).optional(),
    isActive: z.string().transform(val => val === 'true').optional(),
  }),

  updateTeamMember: z.object({
    body: z.object({
      roleInTeam: z.enum(['member', 'lead', 'manager']).optional(),
      isActive: z.boolean().optional(),
    }),
    params: z.object({
      id: z.string().uuid('Invalid team ID format'),
      userId: z.string().uuid('Invalid user ID format'),
    }),
  }),

  bulkAddTeamMembers: z.object({
    body: z.object({
      userIds: z.array(z.string().uuid('Invalid user ID format')).min(1, 'At least one user ID is required').max(50, 'Maximum 50 users allowed'),
      roleInTeam: z.enum(['member', 'lead', 'manager']).default('member'),
    }),
    params: z.object({
      id: z.string().uuid('Invalid team ID format'),
    }),
  }),

  bulkRemoveTeamMembers: z.object({
    body: z.object({
      userIds: z.array(z.string().uuid('Invalid user ID format')).min(1, 'At least one user ID is required').max(50, 'Maximum 50 users allowed'),
    }),
    params: z.object({
      id: z.string().uuid('Invalid team ID format'),
    }),
  }),

  getTeamAnalytics: z.object({
    params: z.object({
      id: z.string().uuid('Invalid team ID format'),
    }),
    query: z.object({
      period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
      includeInactive: z.string().transform(val => val === 'true').default('false'),
    }),
  }),

  exportTeamMembers: z.object({
    params: z.object({
      id: z.string().uuid('Invalid team ID format'),
    }),
    query: z.object({
      format: z.enum(['csv', 'json']).default('csv'),
      includeInactive: z.string().transform(val => val === 'true').default('false'),
    }),
  }),
};