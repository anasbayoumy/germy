// Shared auth schemas that are referenced by user service
// These should match the schemas in the auth service

import { pgTable, uuid, varchar, text, boolean, timestamp, unique, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Companies table (shared across services)
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  domain: varchar('domain', { length: 255 }),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  logoUrl: varchar('logo_url', { length: 500 }),
  isActive: boolean('is_active').notNull().default(true),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('trial'),
  subscriptionPlan: varchar('subscription_plan', { length: 50 }).default('basic'),
  subscriptionExpiresAt: timestamp('subscription_expires_at', { withTimezone: true }),
  maxUsers: integer('max_users').default(10),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  companyDomainUnique: unique('company_domain_unique').on(table.domain),
}));

// Users table (shared across services)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  employeeId: varchar('employee_id', { length: 100 }),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  position: varchar('position', { length: 100 }),
  department: varchar('department', { length: 100 }),
  hireDate: timestamp('hire_date', { withTimezone: true }),
  salary: varchar('salary', { length: 20 }), // Using varchar to match DECIMAL in DB
  profilePhotoUrl: varchar('profile_photo_url', { length: 500 }),
  
  // Face encoding data
  faceEncodingData: text('face_encoding_data'),
  faceEncodingCreatedAt: timestamp('face_encoding_created_at', { withTimezone: true }),
  faceEncodingExpiresAt: timestamp('face_encoding_expires_at', { withTimezone: true }),
  faceEncodingQualityScore: varchar('face_encoding_quality_score', { length: 10 }),
  
  // Work mode
  workMode: varchar('work_mode', { length: 20 }).default('onsite'),
  hybridRemoteDays: integer('hybrid_remote_days').default(0),
  preferredRemoteDays: text('preferred_remote_days'),
  homeAddress: text('home_address'),
  homeLatitude: varchar('home_latitude', { length: 20 }),
  homeLongitude: varchar('home_longitude', { length: 20 }),
  homeGeofenceRadius: integer('home_geofence_radius').default(100),
  
  // Approval system
  approvalStatus: varchar('approval_status', { length: 20 }).notNull().default('pending'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  
  // Access control
  isActive: boolean('is_active').notNull().default(true),
  isVerified: boolean('is_verified').notNull().default(false),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpires: timestamp('password_reset_expires', { withTimezone: true }),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  
  // Mobile app access
  mobileAppAccess: boolean('mobile_app_access').notNull().default(false),
  mobileAppLastUsed: timestamp('mobile_app_last_used', { withTimezone: true }),
  
  // Dashboard access
  dashboardAccess: boolean('dashboard_access').notNull().default(false),
  dashboardLastUsed: timestamp('dashboard_last_used', { withTimezone: true }),
  
  // Platform panel access
  platformPanelAccess: boolean('platform_panel_access').notNull().default(false),
  platformPanelLastUsed: timestamp('platform_panel_last_used', { withTimezone: true }),
  
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
}));
