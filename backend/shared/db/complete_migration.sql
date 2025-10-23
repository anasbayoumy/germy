-- =====================================================
-- COMPLETE DATABASE MIGRATION FOR USER SERVICE
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. UPDATE EXISTING TABLES
-- =====================================================

-- Add missing columns to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS left_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add missing columns to user_teams table
ALTER TABLE user_teams ADD COLUMN IF NOT EXISTS left_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_teams ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- =====================================================
-- 2. CREATE NEW TABLES
-- =====================================================

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES departments(id),
    manager_id UUID REFERENCES users(id),
    color VARCHAR(7) DEFAULT '#10B981',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- User-Department relationships
CREATE TABLE IF NOT EXISTS user_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- member, lead, manager, head
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(user_id, department_id)
);

-- File uploads table
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    category VARCHAR(100) DEFAULT 'uncategorized',
    description TEXT,
    tags JSONB DEFAULT '[]',
    is_public BOOLEAN NOT NULL DEFAULT false,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- File sharing table
CREATE TABLE IF NOT EXISTS file_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    shared_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    shared_with_department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    access_level VARCHAR(50) NOT NULL DEFAULT 'view', -- view, edit, download
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(file_id, shared_with_user_id, shared_with_team_id, shared_with_department_id)
);

-- File access logs
CREATE TABLE IF NOT EXISTS file_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- view, download, edit, delete, share
    ip_address VARCHAR(45),
    user_agent TEXT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- File versions (optional, for advanced versioning)
CREATE TABLE IF NOT EXISTS file_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    UNIQUE(file_id, version_number)
);

-- File analytics (optional)
CREATE TABLE IF NOT EXISTS file_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    total_views INTEGER NOT NULL DEFAULT 0,
    total_downloads INTEGER NOT NULL DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    last_downloaded_at TIMESTAMP WITH TIME ZONE,
    average_view_duration INTEGER, -- in seconds
    unique_viewers INTEGER NOT NULL DEFAULT 0,
    unique_downloaders INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(file_id)
);

-- Saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    query TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id UUID,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Custom reports table
CREATE TABLE IF NOT EXISTS custom_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    filters JSONB DEFAULT '{}',
    date_range JSONB NOT NULL,
    format VARCHAR(10) NOT NULL DEFAULT 'json',
    schedule JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_generated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report history table
CREATE TABLE IF NOT EXISTS report_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed
    file_path VARCHAR(500),
    file_size INTEGER,
    download_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Department indexes
CREATE INDEX IF NOT EXISTS idx_departments_company_id ON departments(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON departments(manager_id);

-- User department indexes
CREATE INDEX IF NOT EXISTS idx_user_departments_user_id ON user_departments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_departments_department_id ON user_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_user_departments_is_active ON user_departments(is_active);

-- File management indexes
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_company_id ON files(company_id);
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_is_public ON files(is_public);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON files(uploaded_at);

CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with_user_id ON file_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with_team_id ON file_shares(shared_with_team_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with_department_id ON file_shares(shared_with_department_id);

CREATE INDEX IF NOT EXISTS idx_file_access_logs_file_id ON file_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_user_id ON file_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_accessed_at ON file_access_logs(accessed_at);

-- User service enhancement indexes
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_company_id ON saved_searches(company_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_is_public ON saved_searches(is_public);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_company_id ON user_permissions(company_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);
CREATE INDEX IF NOT EXISTS idx_user_permissions_is_active ON user_permissions(is_active);

CREATE INDEX IF NOT EXISTS idx_custom_reports_user_id ON custom_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_reports_company_id ON custom_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_reports_type ON custom_reports(type);
CREATE INDEX IF NOT EXISTS idx_custom_reports_is_active ON custom_reports(is_active);

CREATE INDEX IF NOT EXISTS idx_report_history_report_id ON report_history(report_id);
CREATE INDEX IF NOT EXISTS idx_report_history_user_id ON report_history(user_id);
CREATE INDEX IF NOT EXISTS idx_report_history_company_id ON report_history(company_id);
CREATE INDEX IF NOT EXISTS idx_report_history_status ON report_history(status);

-- =====================================================
-- 4. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_searches_updated_at BEFORE UPDATE ON saved_searches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_reports_updated_at BEFORE UPDATE ON custom_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_file_analytics_updated_at BEFORE UPDATE ON file_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- Example RLS policy for departments table
CREATE POLICY departments_company_isolation ON departments
    FOR ALL TO authenticated
    USING (company_id = current_setting('app.current_company_id')::uuid);

-- Example RLS policy for user_departments table
CREATE POLICY user_departments_company_isolation ON user_departments
    FOR ALL TO authenticated
    USING (company_id = current_setting('app.current_company_id')::uuid);

-- Example RLS policy for files table
CREATE POLICY files_company_isolation ON files
    FOR ALL TO authenticated
    USING (company_id = current_setting('app.current_company_id')::uuid);

-- Example RLS policy for file_shares table
CREATE POLICY file_shares_company_isolation ON file_shares
    FOR ALL TO authenticated
    USING (company_id = current_setting('app.current_company_id')::uuid);

-- Example RLS policy for saved_searches table
CREATE POLICY saved_searches_company_isolation ON saved_searches
    FOR ALL TO authenticated
    USING (company_id = current_setting('app.current_company_id')::uuid);

-- Example RLS policy for user_permissions table
CREATE POLICY user_permissions_company_isolation ON user_permissions
    FOR ALL TO authenticated
    USING (company_id = current_setting('app.current_company_id')::uuid);

-- Example RLS policy for custom_reports table
CREATE POLICY custom_reports_company_isolation ON custom_reports
    FOR ALL TO authenticated
    USING (company_id = current_setting('app.current_company_id')::uuid);

-- Example RLS policy for report_history table
CREATE POLICY report_history_company_isolation ON report_history
    FOR ALL TO authenticated
    USING (company_id = current_setting('app.current_company_id')::uuid);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log completion
INSERT INTO system_logs (level, service, message, data) VALUES 
('info', 'migration', 'User Service database migration completed successfully', 
 '{"tables_added": ["departments", "user_departments", "files", "file_shares", "file_access_logs", "file_versions", "file_analytics", "saved_searches", "user_permissions", "custom_reports", "report_history"], "indexes_created": 20, "triggers_created": 5}');
