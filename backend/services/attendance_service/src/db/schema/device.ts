import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, jsonb, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, companies } from './auth';

// Device fingerprints for security
export const deviceFingerprints = pgTable('device_fingerprints', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Device identification
  fingerprintHash: varchar('fingerprint_hash', { length: 255 }).notNull(),
  deviceInfo: jsonb('device_info'),
  browserInfo: jsonb('browser_info'),
  osInfo: jsonb('os_info'),
  
  // Security data
  isTrusted: boolean('is_trusted').default(false),
  riskScore: decimal('risk_score', { precision: 5, scale: 2 }).default('0'),
  securityFlags: jsonb('security_flags'),
  
  // Usage tracking
  firstSeen: timestamp('first_seen', { withTimezone: true }).defaultNow().notNull(),
  lastSeen: timestamp('last_seen', { withTimezone: true }).defaultNow().notNull(),
  usageCount: integer('usage_count').default(1),
  
  // Location tracking
  commonLocations: jsonb('common_locations'),
  locationConsistencyScore: decimal('location_consistency_score', { precision: 5, scale: 2 }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const deviceFingerprintsRelations = relations(deviceFingerprints, ({ one }) => ({
  user: one(users, {
    fields: [deviceFingerprints.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [deviceFingerprints.companyId],
    references: [companies.id],
  }),
}));
