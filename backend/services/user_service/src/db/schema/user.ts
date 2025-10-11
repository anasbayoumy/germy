import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, jsonb, unique, integer } from 'drizzle-orm/pg-core';
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