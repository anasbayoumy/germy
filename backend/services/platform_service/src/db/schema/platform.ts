import { pgTable, uuid, text, timestamp, boolean, json } from 'drizzle-orm/pg-core';

export const platformConfigs = pgTable('platform_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull(),
  value: json('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  enabled: boolean('enabled').notNull().default(false),
  audience: text('audience').default('all'),
  metadata: json('metadata'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const platformAuditLogs = pgTable('platform_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id').notNull(),
  action: text('action').notNull(),
  target: text('target').notNull(),
  details: json('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// Advanced schemas
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  status: text('status', { enum: ['pending', 'active', 'suspended'] }).default('pending'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const platformAdmins = pgTable('platform_admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  email: text('email').notNull(),
  role: text('role', { enum: ['platform_admin', 'platform_super_admin'] }).default('platform_admin'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull(),
  tenantId: uuid('tenant_id'),
  scopes: json('scopes'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true })
});

export const serviceRegistry = pgTable('service_registry', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  baseUrl: text('base_url').notNull(),
  health: text('health', { enum: ['unknown', 'healthy', 'degraded', 'down'] }).default('unknown'),
  metadata: json('metadata'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const maintenanceWindows = pgTable('maintenance_windows', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  active: boolean('active').default(true)
});

export const webhooks = pgTable('webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  targetUrl: text('target_url').notNull(),
  events: json('events').notNull(),
  secret: text('secret'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});


