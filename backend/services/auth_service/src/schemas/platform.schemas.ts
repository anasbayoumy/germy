import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  domain: z.string().min(2, 'Company domain must be at least 2 characters'),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  timezone: z.string().default('UTC'),
});

export const updateCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').optional(),
  domain: z.string().min(2, 'Company domain must be at least 2 characters').optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
