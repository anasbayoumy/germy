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

-- Note: Platform Admins are now stored in the users table with role='platform_admin'
-- This table is kept for backward compatibility but will be deprecated

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
    
    -- Stripe Payment Integration Fields
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    stripe_price_id VARCHAR(255),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'trial', -- trial, active, past_due, canceled, incomplete
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    
    -- Trial and Billing Fields
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Grace Period for Failed Payments
    grace_period_ends TIMESTAMP WITH TIME ZONE,
    
    -- Payment Method Information
    payment_method_type VARCHAR(50), -- card, bank_account, etc.
    payment_method_last4 VARCHAR(4),
    payment_method_brand VARCHAR(50), -- visa, mastercard, etc.
    
    -- Billing Information
    billing_email VARCHAR(255),
    billing_address JSONB,
    
    -- Metadata for Payment Service Integration
    payment_metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company Trial History (Track trial usage per domain)
CREATE TABLE company_trial_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_domain VARCHAR(255) NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    trial_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_ended_at TIMESTAMP WITH TIME ZONE,
    trial_status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, expired, converted
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_domain)
);

-- Company Employee Count Tracking
CREATE TABLE company_employee_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    total_employees INTEGER NOT NULL DEFAULT 0,
    active_employees INTEGER NOT NULL DEFAULT 0,
    admins_count INTEGER NOT NULL DEFAULT 0,
    super_admins_count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id)
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

-- Users (4-role hierarchy: platform_admin, company_super_admin, admin, user)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL for platform_admins
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    employee_id VARCHAR(100), -- Company's internal employee ID
    role VARCHAR(50) NOT NULL, -- platform_admin, company_super_admin, admin, user
    position VARCHAR(100),
    department VARCHAR(100),
    hire_date DATE,
    salary DECIMAL(12,2),
    profile_photo_url VARCHAR(500),
    
    -- Face encoding data (for users and admins only)
    face_encoding_data TEXT, -- Encrypted facial recognition data
    face_encoding_created_at TIMESTAMP WITH TIME ZONE, -- When face was encoded
    face_encoding_expires_at TIMESTAMP WITH TIME ZONE, -- 45 days from creation
    face_encoding_quality_score DECIMAL(5,2), -- 0-100 quality score
    
    -- Work mode (for users and admins only)
    work_mode VARCHAR(20) DEFAULT 'onsite', -- remote, hybrid, onsite
    hybrid_remote_days INTEGER DEFAULT 0, -- Number of remote days per week for hybrid workers
    preferred_remote_days JSONB DEFAULT '[]', -- Array of preferred remote days [1,2,3,4,5] (Mon-Fri)
    home_address TEXT, -- For remote work verification
    home_latitude DECIMAL(10, 8), -- Home location for geofencing
    home_longitude DECIMAL(11, 8),
    home_geofence_radius INTEGER DEFAULT 100, -- Radius in meters for home location
    
    -- Approval system
    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    approved_by UUID REFERENCES users(id), -- Who approved this user
    approved_at TIMESTAMP WITH TIME ZONE, -- When approved
    rejection_reason TEXT, -- Reason for rejection
    
    -- Access control
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    email_verification_token VARCHAR(255),
    email_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Mobile app access (users and admins only)
    mobile_app_access BOOLEAN NOT NULL DEFAULT false,
    mobile_app_last_used TIMESTAMP WITH TIME ZONE,
    
    -- Dashboard access (admins and super admins only)
    dashboard_access BOOLEAN NOT NULL DEFAULT false,
    dashboard_last_used TIMESTAMP WITH TIME ZONE,
    
    -- Platform panel access (platform admins only)
    platform_panel_access BOOLEAN NOT NULL DEFAULT false,
    platform_panel_last_used TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, email),
    UNIQUE(company_id, employee_id)
);

-- User Preferences
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light', -- light, dark, auto
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    time_format VARCHAR(10) DEFAULT '12h', -- 12h, 24h
    notifications JSONB DEFAULT '{}', -- Email, push, SMS preferences
    privacy JSONB DEFAULT '{}', -- Profile visibility settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- User Settings (Company-specific)
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    work_hours_start VARCHAR(5) DEFAULT '09:00',
    work_hours_end VARCHAR(5) DEFAULT '17:00',
    work_days JSONB DEFAULT '[1,2,3,4,5]', -- Monday=1, Sunday=7
    break_duration INTEGER DEFAULT 60, -- minutes
    overtime_enabled BOOLEAN DEFAULT true,
    remote_work_enabled BOOLEAN DEFAULT false,
    attendance_reminders JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, company_id)
);

-- User Activities (Audit Log)
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- profile_updated, team_joined, etc.
    resource_type VARCHAR(100) NOT NULL, -- user, team, department
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Teams
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES users(id),
    color VARCHAR(7) DEFAULT '#3B82F6',
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
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(user_id, team_id)
);

-- Departments
CREATE TABLE departments (
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
CREATE TABLE user_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- member, lead, manager, head
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(user_id, department_id)
);

-- =====================================================
-- 4. FILE MANAGEMENT TABLES
-- =====================================================

-- File uploads table
CREATE TABLE files (
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
CREATE TABLE file_shares (
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
CREATE TABLE file_access_logs (
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
CREATE TABLE file_versions (
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
CREATE TABLE file_analytics (
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

-- =====================================================
-- 5. USER APPROVAL & WORKFLOW TABLES
-- =====================================================

-- User Approval Requests
CREATE TABLE user_approval_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    requested_role VARCHAR(50) NOT NULL, -- user, admin, company_super_admin
    request_type VARCHAR(50) NOT NULL, -- new_signup, role_change, reactivation
    request_data JSONB, -- Additional request information
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    reviewed_by UUID REFERENCES users(id), -- Who reviewed the request
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Face Encoding History (Track 45-day refresh cycle)
CREATE TABLE face_encoding_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    encoding_data TEXT NOT NULL, -- Encrypted face encoding
    quality_score DECIMAL(5,2) NOT NULL, -- 0-100
    encoding_version VARCHAR(20) NOT NULL DEFAULT 'v1',
    is_active BOOLEAN DEFAULT true, -- Current active encoding
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 45 days from creation
    replaced_by UUID REFERENCES face_encoding_history(id) -- Next encoding
);

-- =====================================================
-- 5. WORK MODE & SCHEDULING TABLES
-- =====================================================

-- Work Mode Schedules (For hybrid workers)
CREATE TABLE work_mode_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    work_mode VARCHAR(20) NOT NULL, -- remote, hybrid, onsite
    location_type VARCHAR(50), -- office, home, client_site, travel
    expected_location JSONB, -- Expected location data
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, schedule_date)
);

-- Work Mode Templates (For recurring schedules)
CREATE TABLE work_mode_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    schedule_pattern JSONB NOT NULL, -- Weekly pattern: {"monday": "onsite", "tuesday": "remote", ...}
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. LOCATION & GEOFENCE TABLES
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
    work_mode_schedule_id UUID REFERENCES work_mode_schedules(id),
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
    
    -- AI Verification Results
    face_similarity_score DECIMAL(5,2), -- 0-100
    liveness_score DECIMAL(5,2), -- 0-100
    activity_score DECIMAL(5,2), -- 0-100
    productivity_score DECIMAL(5,2), -- 0-100
    overall_risk_score DECIMAL(5,2), -- 0-100
    ai_processing_time INTEGER, -- milliseconds
    verification_metadata JSONB, -- Detailed AI verification data
    
    -- Device and Security
    device_fingerprint VARCHAR(255),
    user_agent TEXT,
    device_info JSONB,
    
    -- Activity Data
    productive_time INTEGER, -- minutes
    break_time INTEGER, -- minutes
    distraction_time INTEGER, -- minutes
    work_applications JSONB,
    activity_proof JSONB,
    
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
-- 6. AI SERVICE TABLES
-- =====================================================

-- Note: Face encodings are now stored in face_encoding_history table
-- This table is kept for backward compatibility but will be deprecated

-- AI Verification Results
CREATE TABLE ai_verification_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL, -- face_comparison, liveness, activity, location
    ai_service VARCHAR(50) NOT NULL, -- arcface, gemini, custom_ml
    input_data JSONB, -- Input data sent to AI service
    output_data JSONB, -- AI service response
    confidence_score DECIMAL(5,2), -- 0-100
    processing_time INTEGER, -- milliseconds
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fraud Detection Results
CREATE TABLE fraud_detection_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
    overall_risk_score DECIMAL(5,2) NOT NULL, -- 0-100
    risk_level VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    
    -- Detection results
    face_comparison_result JSONB,
    liveness_detection_result JSONB,
    activity_verification_result JSONB,
    location_verification_result JSONB,
    device_analysis_result JSONB,
    behavioral_analysis_result JSONB,
    
    -- Flags and alerts
    flags JSONB,
    risk_factors JSONB,
    evidence JSONB,
    
    -- Review status
    requires_manual_review BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Service Logs
CREATE TABLE ai_service_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(50) NOT NULL, -- arcface, gemini, fraud_detection, ml_analytics
    request_id VARCHAR(255),
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    request_data JSONB,
    response_data JSONB,
    processing_time INTEGER, -- milliseconds
    status VARCHAR(20) NOT NULL, -- success, error, timeout
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. NOTIFICATION TABLES
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

-- Blacklisted Tokens (for logout security)
CREATE TABLE blacklisted_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL DEFAULT 'logout', -- logout, security, admin_revoke
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. USER SERVICE ENHANCEMENT TABLES
-- =====================================================

-- Saved searches table
CREATE TABLE saved_searches (
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
CREATE TABLE user_permissions (
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
CREATE TABLE custom_reports (
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
CREATE TABLE report_history (
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
-- 8. AUDIT & LOGGING TABLES
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
CREATE INDEX idx_users_work_mode ON users(work_mode);
CREATE INDEX idx_users_approval_status ON users(approval_status);
CREATE INDEX idx_users_mobile_app_access ON users(mobile_app_access);
CREATE INDEX idx_users_dashboard_access ON users(dashboard_access);
CREATE INDEX idx_users_platform_panel_access ON users(platform_panel_access);
CREATE INDEX idx_users_face_encoding_expires_at ON users(face_encoding_expires_at);

-- User approval request indexes
CREATE INDEX idx_user_approval_requests_user_id ON user_approval_requests(user_id);
CREATE INDEX idx_user_approval_requests_company_id ON user_approval_requests(company_id);
CREATE INDEX idx_user_approval_requests_status ON user_approval_requests(status);
CREATE INDEX idx_user_approval_requests_requested_role ON user_approval_requests(requested_role);
CREATE INDEX idx_user_approval_requests_created_at ON user_approval_requests(created_at);

-- Face encoding history indexes
CREATE INDEX idx_face_encoding_history_user_id ON face_encoding_history(user_id);
CREATE INDEX idx_face_encoding_history_company_id ON face_encoding_history(company_id);
CREATE INDEX idx_face_encoding_history_is_active ON face_encoding_history(is_active);
CREATE INDEX idx_face_encoding_history_expires_at ON face_encoding_history(expires_at);
CREATE INDEX idx_face_encoding_history_created_at ON face_encoding_history(created_at);

-- Work mode schedule indexes
CREATE INDEX idx_work_mode_schedules_user_id ON work_mode_schedules(user_id);
CREATE INDEX idx_work_mode_schedules_company_id ON work_mode_schedules(company_id);
CREATE INDEX idx_work_mode_schedules_date ON work_mode_schedules(schedule_date);
CREATE INDEX idx_work_mode_schedules_work_mode ON work_mode_schedules(work_mode);

-- Attendance indexes
CREATE INDEX idx_attendance_user_id ON attendance_records(user_id);
CREATE INDEX idx_attendance_company_id ON attendance_records(company_id);
CREATE INDEX idx_attendance_clock_in_time ON attendance_records(clock_in_time);
CREATE INDEX idx_attendance_status ON attendance_records(status);
CREATE INDEX idx_attendance_work_type ON attendance_records(work_type);
CREATE INDEX idx_attendance_risk_score ON attendance_records(overall_risk_score);

-- AI service indexes (face_encodings table deprecated, using face_encoding_history)

CREATE INDEX idx_ai_verification_attendance_id ON ai_verification_results(attendance_id);
CREATE INDEX idx_ai_verification_type ON ai_verification_results(verification_type);
CREATE INDEX idx_ai_verification_service ON ai_verification_results(ai_service);

CREATE INDEX idx_fraud_detection_attendance_id ON fraud_detection_results(attendance_id);
CREATE INDEX idx_fraud_detection_risk_level ON fraud_detection_results(risk_level);
CREATE INDEX idx_fraud_detection_requires_review ON fraud_detection_results(requires_manual_review);

CREATE INDEX idx_ai_service_logs_service ON ai_service_logs(service_name);
CREATE INDEX idx_ai_service_logs_user_id ON ai_service_logs(user_id);
CREATE INDEX idx_ai_service_logs_company_id ON ai_service_logs(company_id);
CREATE INDEX idx_ai_service_logs_created_at ON ai_service_logs(created_at);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_company_id ON notifications(company_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Audit log indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Department indexes
CREATE INDEX idx_departments_company_id ON departments(company_id);
CREATE INDEX idx_departments_parent_id ON departments(parent_id);
CREATE INDEX idx_departments_manager_id ON departments(manager_id);

-- User department indexes
CREATE INDEX idx_user_departments_user_id ON user_departments(user_id);
CREATE INDEX idx_user_departments_department_id ON user_departments(department_id);
CREATE INDEX idx_user_departments_is_active ON user_departments(is_active);

-- File management indexes
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_company_id ON files(company_id);
CREATE INDEX idx_files_category ON files(category);
CREATE INDEX idx_files_is_public ON files(is_public);
CREATE INDEX idx_files_uploaded_at ON files(uploaded_at);

CREATE INDEX idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX idx_file_shares_shared_with_user_id ON file_shares(shared_with_user_id);
CREATE INDEX idx_file_shares_shared_with_team_id ON file_shares(shared_with_team_id);
CREATE INDEX idx_file_shares_shared_with_department_id ON file_shares(shared_with_department_id);

CREATE INDEX idx_file_access_logs_file_id ON file_access_logs(file_id);
CREATE INDEX idx_file_access_logs_user_id ON file_access_logs(user_id);
CREATE INDEX idx_file_access_logs_accessed_at ON file_access_logs(accessed_at);

-- User service enhancement indexes
CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX idx_saved_searches_company_id ON saved_searches(company_id);
CREATE INDEX idx_saved_searches_is_public ON saved_searches(is_public);

CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_company_id ON user_permissions(company_id);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission);
CREATE INDEX idx_user_permissions_is_active ON user_permissions(is_active);

CREATE INDEX idx_custom_reports_user_id ON custom_reports(user_id);
CREATE INDEX idx_custom_reports_company_id ON custom_reports(company_id);
CREATE INDEX idx_custom_reports_type ON custom_reports(type);
CREATE INDEX idx_custom_reports_is_active ON custom_reports(is_active);

CREATE INDEX idx_report_history_report_id ON report_history(report_id);
CREATE INDEX idx_report_history_user_id ON report_history(user_id);
CREATE INDEX idx_report_history_company_id ON report_history(company_id);
CREATE INDEX idx_report_history_status ON report_history(status);

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
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_subscriptions_updated_at BEFORE UPDATE ON company_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON company_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_approval_requests_updated_at BEFORE UPDATE ON user_approval_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_mode_schedules_updated_at BEFORE UPDATE ON work_mode_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_mode_templates_updated_at BEFORE UPDATE ON work_mode_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_geofence_settings_updated_at BEFORE UPDATE ON geofence_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_searches_updated_at BEFORE UPDATE ON saved_searches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_reports_updated_at BEFORE UPDATE ON custom_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_file_analytics_updated_at BEFORE UPDATE ON file_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on company-specific tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_encoding_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_mode_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_mode_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Example RLS policy for users table (commented out - requires authenticated role)
-- CREATE POLICY users_company_isolation ON users
--     FOR ALL TO authenticated
--     USING (company_id = current_setting('app.current_company_id')::uuid);

-- =====================================================
-- 13. INITIAL DATA SEEDING
-- =====================================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, max_employees, features) VALUES
('Basic', 'Perfect for small teams up to 10 employees', 29.99, 299.99, 10, '["basic_attendance", "basic_reports", "mobile_app"]'),
('Professional', 'Ideal for growing companies up to 25 employees', 55.99, 559.99, 25, '["advanced_attendance", "analytics", "integrations", "custom_reports"]'),
('Business', 'For established companies up to 50 employees', 79.99, 799.99, 50, '["all_features", "advanced_analytics", "api_access", "priority_support"]'),
('Enterprise', 'Custom solutions for large organizations', 0, 0, 999999, '["all_features", "custom_integrations", "dedicated_support", "custom_pricing"]');

-- Insert platform admin (you) - now in users table
INSERT INTO users (email, password_hash, first_name, last_name, role, platform_panel_access, approval_status, is_active, is_verified) VALUES
('admin@germy.com', crypt('admin123', gen_salt('bf')), 'Platform', 'Admin', 'platform_admin', true, 'approved', true, true);

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

-- Pending approvals view
CREATE VIEW pending_approvals AS
SELECT 
    uar.*,
    u.first_name,
    u.last_name,
    u.email,
    u.role as current_role,
    c.name as company_name,
    reviewer.first_name as reviewer_first_name,
    reviewer.last_name as reviewer_last_name
FROM user_approval_requests uar
JOIN users u ON uar.user_id = u.id
JOIN companies c ON uar.company_id = c.id
LEFT JOIN users reviewer ON uar.reviewed_by = reviewer.id
WHERE uar.status = 'pending';

-- Face encoding expiration view
CREATE VIEW face_encoding_expirations AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.face_encoding_expires_at,
    u.face_encoding_quality_score,
    c.name as company_name,
    CASE 
        WHEN u.face_encoding_expires_at < NOW() THEN 'expired'
        WHEN u.face_encoding_expires_at < NOW() + INTERVAL '7 days' THEN 'expiring_soon'
        ELSE 'valid'
    END as status
FROM users u
JOIN companies c ON u.company_id = c.id
WHERE u.face_encoding_expires_at IS NOT NULL
AND u.role IN ('user', 'admin');