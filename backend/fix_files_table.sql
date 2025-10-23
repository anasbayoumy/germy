-- Fix files table to match Drizzle schema
-- Add missing columns to files table

-- Add download_count column
ALTER TABLE files ADD COLUMN IF NOT EXISTS download_count INTEGER NOT NULL DEFAULT 0;

-- Add view_count column  
ALTER TABLE files ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- Add is_active column
ALTER TABLE files ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add last_accessed_at column
ALTER TABLE files ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP WITH TIME ZONE;

-- Add expires_at column
ALTER TABLE files ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Update category column to be NOT NULL with default
ALTER TABLE files ALTER COLUMN category SET NOT NULL;
ALTER TABLE files ALTER COLUMN category SET DEFAULT 'documents';

-- Update file_path column length
ALTER TABLE files ALTER COLUMN file_path TYPE VARCHAR(500);

-- Add unique constraint
ALTER TABLE files ADD CONSTRAINT user_file_unique UNIQUE (user_id, file_name);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_files_download_count ON files(download_count);
CREATE INDEX IF NOT EXISTS idx_files_view_count ON files(view_count);
CREATE INDEX IF NOT EXISTS idx_files_is_active ON files(is_active);
CREATE INDEX IF NOT EXISTS idx_files_last_accessed_at ON files(last_accessed_at);
CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at);
