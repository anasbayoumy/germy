import { pgTable, uuid, text, timestamp, decimal, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';

// Face Encoding History
export const faceEncodingHistory = pgTable('face_encoding_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  encodingData: text('encoding_data').notNull(),
  qualityScore: decimal('quality_score', { precision: 5, scale: 2 }),
  processingTime: integer('processing_time'), // in milliseconds
  imageSize: integer('image_size'), // in bytes
  imageDimensions: text('image_dimensions'), // "width x height"
  algorithm: text('algorithm').notNull().default('arcface'),
  version: text('version').notNull().default('1.0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});

// Relations
export const faceEncodingHistoryRelations = relations(faceEncodingHistory, ({ one }) => ({
  user: one(users, {
    fields: [faceEncodingHistory.userId],
    references: [users.id],
  }),
}));

