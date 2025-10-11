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
};