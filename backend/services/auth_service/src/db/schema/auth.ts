import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, inet, jsonb, unique, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies } from './platform';

// Users (All user types: platform_admin, company_super_admin, admin, user)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }), // Nullable for platform admins
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  employeeId: varchar('employee_id', { length: 100 }), // Company's internal employee ID
  role: varchar('role', { length: 50 }).notNull(), // platform_admin, company_super_admin, company_admin, user
  position: varchar('position', { length: 100 }),
  department: varchar('department', { length: 100 }),
  hireDate: timestamp('hire_date', { withTimezone: true }),
  salary: decimal('salary', { precision: 12, scale: 2 }),
  profilePhotoUrl: varchar('profile_photo_url', { length: 500 }),
  
  // Face encoding data (for users and admins only)
  faceEncodingData: text('face_encoding_data'), // Encrypted facial recognition data
  faceEncodingCreatedAt: timestamp('face_encoding_created_at', { withTimezone: true }),
  faceEncodingExpiresAt: timestamp('face_encoding_expires_at', { withTimezone: true }),
  faceEncodingQualityScore: decimal('face_encoding_quality_score', { precision: 5, scale: 2 }),
  
  // Work mode (for users and admins only)
  workMode: varchar('work_mode', { length: 20 }).default('onsite'), // remote, hybrid, onsite
  hybridRemoteDays: integer('hybrid_remote_days').default(0), // Number of remote days per week
  preferredRemoteDays: jsonb('preferred_remote_days').default('[]'), // Array of preferred remote days
  homeAddress: text('home_address'), // For remote work verification
  homeLatitude: decimal('home_latitude', { precision: 10, scale: 8 }),
  homeLongitude: decimal('home_longitude', { precision: 11, scale: 8 }),
  homeGeofenceRadius: integer('home_geofence_radius').default(100), // Radius in meters
  
  // Approval system
  approvalStatus: varchar('approval_status', { length: 20 }).notNull().default('pending'), // pending, approved, rejected
  approvedBy: uuid('approved_by'), // References users.id but can't self-reference in schema
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  
  // Access control
  mobileAppAccess: boolean('mobile_app_access').notNull().default(false), // users and admins only
  mobileAppLastUsed: timestamp('mobile_app_last_used', { withTimezone: true }),
  dashboardAccess: boolean('dashboard_access').notNull().default(false), // admins and super admins only
  dashboardLastUsed: timestamp('dashboard_last_used', { withTimezone: true }),
  platformPanelAccess: boolean('platform_panel_access').notNull().default(false), // platform admins only
  platformPanelLastUsed: timestamp('platform_panel_last_used', { withTimezone: true }),
  
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
  // Composite unique constraints - CORRECTED SYNTAX
  companyEmailUnique: unique('company_email_unique').on(table.companyId, table.email),
  companyEmployeeIdUnique: unique('company_employee_id_unique').on(table.companyId, table.employeeId),
}));

// Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'), // References users.id but can't self-reference in schema
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
  userId: uuid('user_id'), // References users.id but can't self-reference in schema
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

// Blacklisted Tokens (for logout security)
export const blacklistedTokens = pgTable('blacklisted_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: text('token').notNull(),
  userId: uuid('user_id').notNull(),
  companyId: uuid('company_id').notNull(),
  reason: varchar('reason', { length: 50 }).notNull().default('logout'), // logout, security, admin_revoke
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tokenUnique: unique('blacklisted_token_unique').on(table.token),
}));

// User Approval Requests
export const userApprovalRequests = pgTable('user_approval_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // References users.id but can't self-reference in schema
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  requestedRole: varchar('requested_role', { length: 50 }).notNull(), // user, company_admin, company_super_admin
  requestType: varchar('request_type', { length: 50 }).notNull(), // new_signup, role_change, reactivation
  requestData: jsonb('request_data'), // Additional request information
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, approved, rejected
  reviewedBy: uuid('reviewed_by'), // References users.id but can't self-reference in schema
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewNotes: text('review_notes'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations - REMOVED companiesRelations (it's already in platform.ts)
export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
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

export const userApprovalRequestsRelations = relations(userApprovalRequests, ({ one }) => ({
  user: one(users, {
    fields: [userApprovalRequests.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [userApprovalRequests.companyId],
    references: [companies.id],
  }),
  reviewer: one(users, {
    fields: [userApprovalRequests.reviewedBy],
    references: [users.id],
  }),
}));

// Company Trial History (Track trial usage per domain)
export const companyTrialHistory = pgTable('company_trial_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyDomain: varchar('company_domain', { length: 255 }).notNull(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  trialStartedAt: timestamp('trial_started_at', { withTimezone: true }).notNull(),
  trialEndedAt: timestamp('trial_ended_at', { withTimezone: true }),
  trialStatus: varchar('trial_status', { length: 20 }).notNull().default('active'), // active, expired, converted
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  domainUnique: unique().on(table.companyDomain),
}));

// Company Employee Count Tracking
export const companyEmployeeCounts = pgTable('company_employee_counts', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  totalEmployees: integer('total_employees').notNull().default(0),
  activeEmployees: integer('active_employees').notNull().default(0),
  adminsCount: integer('admins_count').notNull().default(0),
  superAdminsCount: integer('super_admins_count').notNull().default(0),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  companyUnique: unique().on(table.companyId),
}));
