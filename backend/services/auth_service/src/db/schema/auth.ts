import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, inet } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies } from './platform';

// Users (All user types: company_super_admin, company_admin, employee)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  employeeId: varchar('employee_id', { length: 100 }), // Company's internal employee ID
  role: varchar('role', { length: 50 }).notNull(), // company_super_admin, company_admin, employee
  position: varchar('position', { length: 100 }),
  department: varchar('department', { length: 100 }),
  hireDate: timestamp('hire_date', { withTimezone: true }),
  salary: decimal('salary', { precision: 12, scale: 2 }),
  profilePhotoUrl: varchar('profile_photo_url', { length: 500 }),
  faceEncodingData: text('face_encoding_data'), // Encrypted facial recognition data
  isActive: boolean('is_active').notNull().default(true),
  isVerified: boolean('is_verified').notNull().default(false),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpires: timestamp('password_reset_expires', { withTimezone: true }),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Composite unique constraints
  companyEmailUnique: unique('company_email_unique').on(table.companyId, table.email),
  companyEmployeeIdUnique: unique('company_employee_id_unique').on(table.companyId, table.employeeId),
}));

// Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  companyId: uuid('company_id').references(() => companies.id),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }).notNull(),
  resourceId: uuid('resource_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 100 }).notNull(), // attendance_flagged, late_clock_in, etc.
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  data: jsonb('data'), // Additional notification data
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at', { withTimezone: true }),
  priority: varchar('priority', { length: 20 }).notNull().default('normal'), // low, normal, high, urgent
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [auditLogs.companyId],
    references: [companies.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [notifications.companyId],
    references: [companies.id],
  }),
}));