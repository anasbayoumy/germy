import { pgTable, uuid, timestamp, text, json, integer, boolean, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Attendance Records Table
export const attendanceRecords = pgTable('attendance_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  companyId: uuid('company_id').notNull(),
  clockInTime: timestamp('clock_in_time', { withTimezone: true }).notNull(),
  clockOutTime: timestamp('clock_out_time', { withTimezone: true }),
  workMode: text('work_mode', { enum: ['onsite', 'remote', 'hybrid'] }).notNull(),
  
  // Face verification scores
  faceSimilarityScore: decimal('face_similarity_score', { precision: 5, scale: 2 }),
  faceSimilarityScoreClockOut: decimal('face_similarity_score_clock_out', { precision: 5, scale: 2 }),
  
  // Liveness detection scores
  livenessScore: decimal('liveness_score', { precision: 5, scale: 2 }),
  livenessScoreClockOut: decimal('liveness_score_clock_out', { precision: 5, scale: 2 }),
  
  // Activity and productivity scores
  activityScore: decimal('activity_score', { precision: 5, scale: 2 }),
  productivityScore: decimal('productivity_score', { precision: 5, scale: 2 }),
  
  // Risk assessment
  overallRiskScore: decimal('overall_risk_score', { precision: 5, scale: 2 }).default('0'),
  
  // AI processing metadata
  aiProcessingTime: integer('ai_processing_time').default(0), // in milliseconds
  verificationMetadata: json('verification_metadata'),
  verificationMetadataClockOut: json('verification_metadata_clock_out'),
  fraudDetectionResults: json('fraud_detection_results'),
  
  // Device and location information
  deviceFingerprint: text('device_fingerprint'),
  userAgent: text('user_agent'),
  deviceInfo: text('device_info'),
  location: json('location'),
  
  // Time tracking
  productiveTime: integer('productive_time').default(0), // in minutes
  breakTime: integer('break_time').default(0), // in minutes
  distractionTime: integer('distraction_time').default(0), // in minutes
  
  // Activity proof
  workApplications: json('work_applications'),
  activityProof: json('activity_proof'),
  
  // Photos
  photoUrl: text('photo_url'),
  clockOutPhotoUrl: text('clock_out_photo_url'),
  
  // Status and approval
  status: text('status', { enum: ['active', 'completed', 'flagged', 'approved', 'rejected'] }).default('active'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// AI Verification Results Table
export const aiVerificationResults = pgTable('ai_verification_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  attendanceId: uuid('attendance_id').notNull().references(() => attendanceRecords.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  companyId: uuid('company_id').notNull(),
  
  // Verification type
  verificationType: text('verification_type', { enum: ['face', 'liveness', 'activity', 'location'] }).notNull(),
  
  // Results
  success: boolean('success').notNull(),
  confidence: decimal('confidence', { precision: 5, scale: 2 }),
  score: decimal('score', { precision: 5, scale: 2 }),
  
  // Metadata
  metadata: json('metadata'),
  processingTime: integer('processing_time'), // in milliseconds
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Fraud Detection Results Table
export const fraudDetectionResults = pgTable('fraud_detection_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  attendanceId: uuid('attendance_id').notNull().references(() => attendanceRecords.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  companyId: uuid('company_id').notNull(),
  
  // Risk assessment
  riskScore: decimal('risk_score', { precision: 5, scale: 2 }).notNull(),
  riskLevel: text('risk_level', { enum: ['low', 'medium', 'high', 'critical'] }).notNull(),
  isFraudulent: boolean('is_fraudulent').notNull().default(false),
  
  // Detection results
  detectionResults: json('detection_results').notNull(),
  flags: json('flags'),
  evidence: json('evidence'),
  
  // Processing metadata
  processingTime: integer('processing_time'), // in milliseconds
  modelVersion: text('model_version'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Define relations
export const attendanceRecordsRelations = relations(attendanceRecords, ({ many }) => ({
  aiVerificationResults: many(aiVerificationResults),
  fraudDetectionResults: many(fraudDetectionResults),
}));

export const aiVerificationResultsRelations = relations(aiVerificationResults, ({ one }) => ({
  attendanceRecord: one(attendanceRecords, {
    fields: [aiVerificationResults.attendanceId],
    references: [attendanceRecords.id],
  }),
}));

export const fraudDetectionResultsRelations = relations(fraudDetectionResults, ({ one }) => ({
  attendanceRecord: one(attendanceRecords, {
    fields: [fraudDetectionResults.attendanceId],
    references: [attendanceRecords.id],
  }),
}));