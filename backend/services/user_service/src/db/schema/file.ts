import { pgTable, uuid, varchar, text, boolean, timestamp, integer, jsonb, decimal, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, companies } from './auth';

// File uploads table
export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(), // Size in bytes
  category: varchar('category', { length: 50 }).notNull(), // profile, document, avatar, attachment
  description: text('description'),
  isPublic: boolean('is_public').notNull().default(false),
  tags: jsonb('tags').default('[]'), // Array of tag strings
  downloadCount: integer('download_count').notNull().default(0),
  viewCount: integer('view_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  metadata: jsonb('metadata').default('{}'), // Additional file metadata
}, (table) => ({
  userFileUnique: unique('user_file_unique').on(table.userId, table.fileName),
}));

// File shares table (for sharing files with specific users)
export const fileShares = pgTable('file_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileId: uuid('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  sharedWithUserId: uuid('shared_with_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sharedByUserId: uuid('shared_by_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permissions: varchar('permissions', { length: 20 }).notNull().default('view'), // view, download, edit
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  sharedAt: timestamp('shared_at', { withTimezone: true }).defaultNow().notNull(),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
}, (table) => ({
  fileUserUnique: unique('file_user_unique').on(table.fileId, table.sharedWithUserId),
}));

// File access logs table (for tracking file access)
export const fileAccessLogs = pgTable('file_access_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileId: uuid('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 50 }).notNull(), // view, download, edit, share
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  accessedAt: timestamp('accessed_at', { withTimezone: true }).defaultNow().notNull(),
});

// File versions table (for version control)
export const fileVersions = pgTable('file_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileId: uuid('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  changeDescription: text('change_description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  fileVersionUnique: unique('file_version_unique').on(table.fileId, table.version),
}));

// File analytics table (for storing aggregated analytics)
export const fileAnalytics = pgTable('file_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileId: uuid('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  views: integer('views').notNull().default(0),
  downloads: integer('downloads').notNull().default(0),
  shares: integer('shares').notNull().default(0),
  uniqueViewers: integer('unique_viewers').notNull().default(0),
  averageViewTime: decimal('average_view_time', { precision: 10, scale: 2 }), // In seconds
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  fileUserDateUnique: unique('file_user_date_unique').on(table.fileId, table.userId, table.date),
}));

// Relations
export const filesRelations = relations(files, ({ one, many }) => ({
  user: one(users, {
    fields: [files.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [files.companyId],
    references: [companies.id],
  }),
  fileShares: many(fileShares),
  fileAccessLogs: many(fileAccessLogs),
  fileVersions: many(fileVersions),
  fileAnalytics: many(fileAnalytics),
}));

export const fileSharesRelations = relations(fileShares, ({ one }) => ({
  file: one(files, {
    fields: [fileShares.fileId],
    references: [files.id],
  }),
  sharedWithUser: one(users, {
    fields: [fileShares.sharedWithUserId],
    references: [users.id],
  }),
  sharedByUser: one(users, {
    fields: [fileShares.sharedByUserId],
    references: [users.id],
  }),
}));

export const fileAccessLogsRelations = relations(fileAccessLogs, ({ one }) => ({
  file: one(files, {
    fields: [fileAccessLogs.fileId],
    references: [files.id],
  }),
  user: one(users, {
    fields: [fileAccessLogs.userId],
    references: [users.id],
  }),
}));

export const fileVersionsRelations = relations(fileVersions, ({ one }) => ({
  file: one(files, {
    fields: [fileVersions.fileId],
    references: [files.id],
  }),
  uploadedBy: one(users, {
    fields: [fileVersions.uploadedBy],
    references: [users.id],
  }),
}));

export const fileAnalyticsRelations = relations(fileAnalytics, ({ one }) => ({
  file: one(files, {
    fields: [fileAnalytics.fileId],
    references: [files.id],
  }),
  user: one(users, {
    fields: [fileAnalytics.userId],
    references: [users.id],
  }),
}));
