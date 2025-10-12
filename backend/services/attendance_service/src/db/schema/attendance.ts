import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, jsonb, integer, inet } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, companies } from './auth';

// Enhanced attendance records table
export const attendanceRecords = pgTable('attendance_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Core attendance data
  clockInTime: timestamp('clock_in_time', { withTimezone: true }).notNull(),
  clockOutTime: timestamp('clock_out_time', { withTimezone: true }),
  workMode: varchar('work_mode', { length: 20 }).notNull().default('remote'), // remote, hybrid, onsite
  
  // AI verification results
  faceSimilarity: decimal('face_similarity', { precision: 5, scale: 2 }),
  livenessScore: decimal('liveness_score', { precision: 5, scale: 2 }),
  activityScore: decimal('activity_score', { precision: 5, scale: 2 }),
  productivityScore: decimal('productivity_score', { precision: 5, scale: 2 }),
  overallRiskScore: decimal('overall_risk_score', { precision: 5, scale: 2 }),
  
  // Location data
  clockInLocation: jsonb('clock_in_location'),
  clockOutLocation: jsonb('clock_out_location'),
  geofenceCompliance: boolean('geofence_compliance'),
  
  // Activity data
  productiveTime: integer('productive_time'), // minutes
  breakTime: integer('break_time'), // minutes
  distractionTime: integer('distraction_time'), // minutes
  workApplications: jsonb('work_applications'),
  activityProof: jsonb('activity_proof'),
  
  // Device and security
  deviceFingerprint: varchar('device_fingerprint', { length: 255 }),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  
  // Status and flags
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, approved, rejected, flagged
  requiresReview: boolean('requires_review').default(false),
  fraudFlags: jsonb('fraud_flags'),
  
  // Metadata
  aiProcessingTime: integer('ai_processing_time'), // milliseconds
  verificationMetadata: jsonb('verification_metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const attendanceRecordsRelations = relations(attendanceRecords, ({ one, many }) => ({
  user: one(users, {
    fields: [attendanceRecords.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [attendanceRecords.companyId],
    references: [companies.id],
  }),
  fraudResults: many(fraudDetectionResults),
}));
