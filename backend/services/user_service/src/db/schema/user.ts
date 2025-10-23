import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, unique, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies, users } from './auth'; // Import from auth service schemas

// User Preferences
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  theme: varchar('theme', { length: 20 }).default('light'), // light, dark, auto
  language: varchar('language', { length: 10 }).default('en'),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  dateFormat: varchar('date_format', { length: 20 }).default('MM/DD/YYYY'),
  timeFormat: varchar('time_format', { length: 10 }).default('12h'), // 12h, 24h
  notifications: jsonb('notifications').default('{}'), // Email, push, SMS preferences
  privacy: jsonb('privacy').default('{}'), // Profile visibility settings
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userPreferencesUnique: unique('user_preferences_unique').on(table.userId),
}));

// User Settings (Company-specific)
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  workHoursStart: varchar('work_hours_start', { length: 5 }).default('09:00'),
  workHoursEnd: varchar('work_hours_end', { length: 5 }).default('17:00'),
  workDays: jsonb('work_days').default('[1,2,3,4,5]'), // Monday=1, Sunday=7
  breakDuration: integer('break_duration').default(60), // minutes
  overtimeEnabled: boolean('overtime_enabled').default(true),
  remoteWorkEnabled: boolean('remote_work_enabled').default(false),
  attendanceReminders: jsonb('attendance_reminders').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userSettingsUnique: unique('user_settings_unique').on(table.userId, table.companyId),
}));

// User Activities (Audit Log)
export const userActivities = pgTable('user_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(), // profile_updated, team_joined, etc.
  resourceType: varchar('resource_type', { length: 100 }).notNull(), // user, team, department
  resourceId: uuid('resource_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [userSettings.companyId],
    references: [companies.id],
  }),
}));

// Saved Searches
export const savedSearches = pgTable('saved_searches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  query: text('query').notNull(),
  filters: jsonb('filters').default('{}'),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// User Permissions
export const userPermissions = pgTable('user_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  permission: varchar('permission', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }),
  resourceId: uuid('resource_id'),
  grantedBy: uuid('granted_by').references(() => users.id),
  grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
});

// Custom Reports
export const customReports = pgTable('custom_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(),
  filters: jsonb('filters').default('{}'),
  dateRange: jsonb('date_range').notNull(),
  format: varchar('format', { length: 10 }).notNull().default('json'),
  schedule: jsonb('schedule').default('{}'),
  isActive: boolean('is_active').notNull().default(true),
  lastGenerated: timestamp('last_generated', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Report History
export const reportHistory = pgTable('report_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').notNull().references(() => customReports.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, completed, failed
  filePath: varchar('file_path', { length: 500 }),
  fileSize: integer('file_size'),
  downloadCount: integer('download_count').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
  user: one(users, {
    fields: [userActivities.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [userActivities.companyId],
    references: [companies.id],
  }),
}));

export const savedSearchesRelations = relations(savedSearches, ({ one }) => ({
  user: one(users, {
    fields: [savedSearches.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [savedSearches.companyId],
    references: [companies.id],
  }),
}));

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [userPermissions.companyId],
    references: [companies.id],
  }),
  grantedBy: one(users, {
    fields: [userPermissions.grantedBy],
    references: [users.id],
  }),
}));

export const customReportsRelations = relations(customReports, ({ one }) => ({
  user: one(users, {
    fields: [customReports.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [customReports.companyId],
    references: [companies.id],
  }),
}));

export const reportHistoryRelations = relations(reportHistory, ({ one }) => ({
  report: one(customReports, {
    fields: [reportHistory.reportId],
    references: [customReports.id],
  }),
  user: one(users, {
    fields: [reportHistory.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [reportHistory.companyId],
    references: [companies.id],
  }),
}));