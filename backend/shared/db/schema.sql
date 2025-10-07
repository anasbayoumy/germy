-- =====================================================
-- GERMY ATTENDANCE PLATFORM - COMPLETE DATABASE SCHEMA
-- Multi-tenant SaaS Architecture
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. PLATFORM MANAGEMENT TABLES
-- =====================================================

-- Subscription Plans (Platform Super Admin manages these)
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2) NOT NULL,
    max_employees INTEGER NOT NULL,
    max_admins INTEGER NOT NULL DEFAULT 5,
    features JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform Super Admins (You and your team)
CREATE TABLE platform_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'platform_super_admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. COMPANY MANAGEMENT TABLES
-- =====================================================

-- Companies (Your customers)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    industry VARCHAR(100),
    company_size VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    phone VARCHAR(50),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    is_active BOOLEAN NOT NULL DEFAULT true,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company Subscriptions
CREATE TABLE company_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'trial', -- trial, active, cancelled, past_due
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- monthly, yearly
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company Settings
CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    work_hours_start TIME NOT NULL DEFAULT '09:00:00',
    work_hours_end TIME NOT NULL DEFAULT '17:00:00',
    work_days JSONB NOT NULL DEFAULT '[1,2,3,4,5]', -- Monday=1, Sunday=7
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    allow_remote_work BOOLEAN NOT NULL DEFAULT false,
    require_photo_verification BOOLEAN NOT NULL DEFAULT true,
    require_location_verification BOOLEAN NOT NULL DEFAULT true,
    geofence_radius_meters INTEGER NOT NULL DEFAULT 100,
    late_tolerance_minutes INTEGER NOT NULL DEFAULT 15,
    auto_approve_attendance BOOLEAN NOT NULL DEFAULT false,
    notification_settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id)
);

-- =====================================================
-- 3. USER MANAGEMENT TABLES
-- =====================================================

-- Users (All user types: company_super_admin, company_admin, employee)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    employee_id VARCHAR(100), -- Company's internal employee ID
    role VARCHAR(50) NOT NULL, -- company_super_admin, company_admin, employee
    position VARCHAR(100),
    department VARCHAR(100),
    hire_date DATE,
    salary DECIMAL(12,2),
    profile_photo_url VARCHAR(500),
    face_encoding_data TEXT, -- Encrypted facial recognition data
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    email_verification_token VARCHAR(255),
    email_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, email),
    UNIQUE(company_id, employee_id)
);

-- Teams/Departments
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- User-Team relationships (Many-to-Many)
CREATE TABLE user_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role_in_team VARCHAR(50) NOT NULL DEFAULT 'member', -- member, lead, manager
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, team_id)
);

-- =====================================================
-- 4. LOCATION & GEOFENCE TABLES
-- =====================================================

-- Geofence Settings (Company's attendance locations)
CREATE TABLE geofence_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- e.g., "Main Office", "Branch Office"
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 100,
    master_photo_url VARCHAR(500), -- Reference photo of the location
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ATTENDANCE TABLES
-- =====================================================

-- Attendance Records
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    geofence_id UUID REFERENCES geofence_settings(id),
    clock_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out_time TIMESTAMP WITH TIME ZONE,
    clock_in_photo_url VARCHAR(500),
    clock_out_photo_url VARCHAR(500),
    clock_in_latitude DECIMAL(10, 8),
    clock_in_longitude DECIMAL(11, 8),
    clock_out_latitude DECIMAL(10, 8),
    clock_out_longitude DECIMAL(11, 8),
    clock_in_ip_address INET,
    clock_out_ip_address INET,
    work_type VARCHAR(50) NOT NULL DEFAULT 'on_site', -- on_site, remote, hybrid
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, flagged
    total_hours DECIMAL(5,2),
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    is_late BOOLEAN NOT NULL DEFAULT false,
    late_minutes INTEGER DEFAULT 0,
    notes TEXT,
    flagged_reasons JSONB DEFAULT '[]', -- Array of reasons why it was flagged
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance Flags (For suspicious activities)
CREATE TABLE attendance_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
    flag_type VARCHAR(100) NOT NULL, -- location_mismatch, photo_verification_failed, ip_suspicious, etc.
    severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    description TEXT NOT NULL,
    evidence JSONB, -- Additional data supporting the flag
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. NOTIFICATION TABLES
-- =====================================================

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- attendance_flagged, late_clock_in, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional notification data
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. AUDIT & LOGGING TABLES
-- =====================================================

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Logs
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL, -- debug, info, warn, error
    service VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. BILLING TABLES
-- =====================================================

-- Billing Records
CREATE TABLE billing_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES company_subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
    stripe_invoice_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. INTEGRATION TABLES
-- =====================================================

-- External Integrations
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- slack, teams, bamboo_hr, workday, etc.
    name VARCHAR(255) NOT NULL,
    config JSONB NOT NULL, -- Encrypted configuration data
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_employee_id ON users(employee_id);

-- Attendance indexes
CREATE INDEX idx_attendance_user_id ON attendance_records(user_id);
CREATE INDEX idx_attendance_company_id ON attendance_records(company_id);
CREATE INDEX idx_attendance_clock_in_time ON attendance_records(clock_in_time);
CREATE INDEX idx_attendance_status ON attendance_records(status);
CREATE INDEX idx_attendance_work_type ON attendance_records(work_type);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_company_id ON notifications(company_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Audit log indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- 11. TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_admins_updated_at BEFORE UPDATE ON platform_admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_subscriptions_updated_at BEFORE UPDATE ON company_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON company_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_geofence_settings_updated_at BEFORE UPDATE ON geofence_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on company-specific tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Example RLS policy for users table
CREATE POLICY users_company_isolation ON users
    FOR ALL TO authenticated
    USING (company_id = current_setting('app.current_company_id')::uuid);

-- =====================================================
-- 13. INITIAL DATA SEEDING
-- =====================================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, max_employees, features) VALUES
('Starter', 'Perfect for small teams', 29.99, 299.99, 10, '["basic_attendance", "basic_reports"]'),
('Professional', 'Ideal for growing companies', 79.99, 799.99, 50, '["advanced_attendance", "analytics", "integrations"]'),
('Enterprise', 'For large organizations', 199.99, 1999.99, 500, '["all_features", "custom_integrations", "priority_support"]');

-- Insert platform admin (you)
INSERT INTO platform_admins (email, password_hash, first_name, last_name) VALUES
('admin@germy.com', crypt('admin123', gen_salt('bf')), 'Platform', 'Admin');

-- =====================================================
-- 14. VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active users view
CREATE VIEW active_users AS
SELECT u.*, c.name as company_name, c.timezone as company_timezone
FROM users u
JOIN companies c ON u.company_id = c.id
WHERE u.is_active = true AND c.is_active = true;

-- Today's attendance view
CREATE VIEW today_attendance AS
SELECT 
    ar.*,
    u.first_name,
    u.last_name,
    u.employee_id,
    c.name as company_name,
    gs.name as location_name
FROM attendance_records ar
JOIN users u ON ar.user_id = u.id
JOIN companies c ON ar.company_id = c.id
LEFT JOIN geofence_settings gs ON ar.geofence_id = gs.id
WHERE DATE(ar.clock_in_time) = CURRENT_DATE;

-- Company dashboard stats view
CREATE VIEW company_dashboard_stats AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    COUNT(DISTINCT u.id) as total_employees,
    COUNT(DISTINCT CASE WHEN u.is_active THEN u.id END) as active_employees,
    COUNT(DISTINCT ar.id) as total_attendance_records,
    COUNT(DISTINCT CASE WHEN DATE(ar.clock_in_time) = CURRENT_DATE THEN ar.id END) as today_attendance,
    COUNT(DISTINCT CASE WHEN ar.status = 'flagged' THEN ar.id END) as flagged_attendance
FROM companies c
LEFT JOIN users u ON c.id = u.company_id
LEFT JOIN attendance_records ar ON c.id = ar.company_id
GROUP BY c.id, c.name;