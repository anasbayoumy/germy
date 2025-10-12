import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { attendanceRecords, users } from './attendance';

// Fraud detection results
export const fraudDetectionResults = pgTable('fraud_detection_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  attendanceId: uuid('attendance_id').notNull().references(() => attendanceRecords.id, { onDelete: 'cascade' }),
  
  // Risk assessment
  overallRiskScore: decimal('overall_risk_score', { precision: 5, scale: 2 }).notNull(),
  riskLevel: varchar('risk_level', { length: 20 }).notNull(), // LOW, MEDIUM, HIGH, CRITICAL
  
  // Detection results
  faceComparisonResult: jsonb('face_comparison_result'),
  livenessDetectionResult: jsonb('liveness_detection_result'),
  activityVerificationResult: jsonb('activity_verification_result'),
  locationVerificationResult: jsonb('location_verification_result'),
  deviceAnalysisResult: jsonb('device_analysis_result'),
  behavioralAnalysisResult: jsonb('behavioral_analysis_result'),
  
  // Flags and alerts
  flags: jsonb('flags'),
  riskFactors: jsonb('risk_factors'),
  evidence: jsonb('evidence'),
  
  // Review status
  requiresManualReview: boolean('requires_manual_review').default(false),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewNotes: text('review_notes'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const fraudDetectionResultsRelations = relations(fraudDetectionResults, ({ one }) => ({
  attendance: one(attendanceRecords, {
    fields: [fraudDetectionResults.attendanceId],
    references: [attendanceRecords.id],
  }),
  reviewer: one(users, {
    fields: [fraudDetectionResults.reviewedBy],
    references: [users.id],
  }),
}));
