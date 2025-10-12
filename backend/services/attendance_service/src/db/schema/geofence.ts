import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies } from './auth';

// Geofence settings (Company's attendance locations)
export const geofenceSettings = pgTable('geofence_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(), // e.g., "Main Office", "Branch Office"
  description: text('description'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  radiusMeters: integer('radius_meters').notNull().default(350),
  bufferZoneMeters: integer('buffer_zone_meters').default(50),
  allowedDeviationMeters: integer('allowed_deviation_meters').default(10),
  masterPhotoUrl: varchar('master_photo_url', { length: 500 }), // Reference photo of the location
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const geofenceSettingsRelations = relations(geofenceSettings, ({ one }) => ({
  company: one(companies, {
    fields: [geofenceSettings.companyId],
    references: [companies.id],
  }),
}));
