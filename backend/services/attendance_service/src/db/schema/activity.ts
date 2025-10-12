import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, jsonb, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, companies } from './auth';

// Activity monitoring data
export const activityMonitoring = pgTable('activity_monitoring', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Session data
  sessionStart: timestamp('session_start', { withTimezone: true }).notNull(),
  sessionEnd: timestamp('session_end', { withTimezone: true }),
  sessionDuration: integer('session_duration'), // minutes
  
  // Activity metrics
  productiveTime: integer('productive_time'), // minutes
  breakTime: integer('break_time'), // minutes
  idleTime: integer('idle_time'), // minutes
  distractionTime: integer('distraction_time'), // minutes
  
  // Application usage
  workApplications: jsonb('work_applications'),
  nonWorkApplications: jsonb('non_work_applications'),
  applicationSwitches: integer('application_switches'),
  
  // Input activity
  keystrokes: integer('keystrokes'),
  mouseClicks: integer('mouse_clicks'),
  mouseMovement: integer('mouse_movement'),
  engagementScore: decimal('engagement_score', { precision: 5, scale: 2 }),
  
  // Screen activity
  screenshotsTaken: integer('screenshots_taken'),
  screenActivityScore: decimal('screen_activity_score', { precision: 5, scale: 2 }),
  focusTime: integer('focus_time'), // minutes
  
  // Presence detection
  presenceScore: decimal('presence_score', { precision: 5, scale: 2 }),
  attentionLevel: decimal('attention_level', { precision: 5, scale: 2 }),
  distractionEvents: jsonb('distraction_events'),
  
  // Metadata
  deviceFingerprint: varchar('device_fingerprint', { length: 255 }),
  locationData: jsonb('location_data'),
  networkData: jsonb('network_data'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const activityMonitoringRelations = relations(activityMonitoring, ({ one }) => ({
  user: one(users, {
    fields: [activityMonitoring.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [activityMonitoring.companyId],
    references: [companies.id],
  }),
}));
