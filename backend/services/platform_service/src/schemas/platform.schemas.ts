import { z } from 'zod';

export const setConfigSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  description: z.string().optional()
});

export const setFlagSchema = z.object({
  name: z.string().min(1),
  enabled: z.boolean().default(false),
  audience: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  metadata: z.record(z.any()).optional()
});

export const createApiKeySchema = z.object({
  name: z.string().min(1),
  tenantId: z.string().uuid().optional(),
  scopes: z.array(z.string()).optional()
});

export const registerServiceSchema = z.object({
  name: z.string().min(1),
  baseUrl: z.string().url(),
  metadata: z.record(z.any()).optional()
});

export const maintenanceSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  active: z.boolean().default(true)
});

export const webhookSchema = z.object({
  name: z.string().min(1),
  targetUrl: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
  active: z.boolean().default(true)
});


