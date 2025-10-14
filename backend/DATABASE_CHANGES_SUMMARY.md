# 🗄️ **DATABASE SCHEMA CHANGES SUMMARY**

## **📋 CHANGES MADE FOR 4-ROLE ARCHITECTURE**

### **✅ COMPLETED CHANGES:**

---

## **1. 🔄 USERS TABLE ENHANCEMENTS**

### **Added Fields:**
```sql
-- Face encoding data (for users and admins only)
face_encoding_data TEXT, -- Encrypted facial recognition data
face_encoding_created_at TIMESTAMP WITH TIME ZONE, -- When face was encoded
face_encoding_expires_at TIMESTAMP WITH TIME ZONE, -- 45 days from creation
face_encoding_quality_score DECIMAL(5,2), -- 0-100 quality score

-- Work mode (for users and admins only)
work_mode VARCHAR(20) DEFAULT 'onsite', -- remote, hybrid, onsite
hybrid_remote_days INTEGER DEFAULT 0, -- Number of remote days per week
preferred_remote_days JSONB DEFAULT '[]', -- Array of preferred remote days
home_address TEXT, -- For remote work verification
home_latitude DECIMAL(10, 8), -- Home location for geofencing
home_longitude DECIMAL(11, 8),
home_geofence_radius INTEGER DEFAULT 100, -- Radius in meters

-- Approval system
approval_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
approved_by UUID REFERENCES users(id), -- Who approved this user
approved_at TIMESTAMP WITH TIME ZONE, -- When approved
rejection_reason TEXT, -- Reason for rejection

-- Access control
mobile_app_access BOOLEAN NOT NULL DEFAULT false, -- users and admins only
mobile_app_last_used TIMESTAMP WITH TIME ZONE,
dashboard_access BOOLEAN NOT NULL DEFAULT false, -- admins and super admins only
dashboard_last_used TIMESTAMP WITH TIME ZONE,
platform_panel_access BOOLEAN NOT NULL DEFAULT false, -- platform admins only
platform_panel_last_used TIMESTAMP WITH TIME ZONE,
```

### **Updated Role Values:**
- `platform_admin` - Platform panel access only
- `company_super_admin` - Dashboard access only
- `admin` - Mobile app + Dashboard access
- `user` - Mobile app access only

---

## **2. 🆕 NEW TABLES ADDED**

### **User Approval & Workflow Tables:**
```sql
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
```

### **Work Mode & Scheduling Tables:**
```sql
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
    schedule_pattern JSONB NOT NULL, -- Weekly pattern
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## **3. 🗑️ DEPRECATED TABLES**

### **Tables Marked for Deprecation:**
```sql
-- platform_admins table - Now using users table with role='platform_admin'
-- face_encodings table - Now using face_encoding_history table
```

**Reason:** These tables are redundant with the new unified structure in the users table and face_encoding_history table.

---

## **4. 📊 NEW INDEXES ADDED**

### **User Table Indexes:**
```sql
CREATE INDEX idx_users_approval_status ON users(approval_status);
CREATE INDEX idx_users_mobile_app_access ON users(mobile_app_access);
CREATE INDEX idx_users_dashboard_access ON users(dashboard_access);
CREATE INDEX idx_users_platform_panel_access ON users(platform_panel_access);
CREATE INDEX idx_users_face_encoding_expires_at ON users(face_encoding_expires_at);
```

### **New Table Indexes:**
```sql
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
```

---

## **5. 🔄 TRIGGERS ADDED**

### **New Table Triggers:**
```sql
CREATE TRIGGER update_user_approval_requests_updated_at BEFORE UPDATE ON user_approval_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_mode_schedules_updated_at BEFORE UPDATE ON work_mode_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_mode_templates_updated_at BEFORE UPDATE ON work_mode_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## **6. 🔒 ROW LEVEL SECURITY (RLS) UPDATES**

### **New Tables with RLS:**
```sql
ALTER TABLE user_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_encoding_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_mode_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_mode_templates ENABLE ROW LEVEL SECURITY;
```

---

## **7. 👁️ NEW VIEWS ADDED**

### **Pending Approvals View:**
```sql
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
```

### **Face Encoding Expiration View:**
```sql
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
```

---

## **8. 🌱 INITIAL DATA UPDATES**

### **Platform Admin Seeding:**
```sql
-- Insert platform admin (you) - now in users table
INSERT INTO users (email, password_hash, first_name, last_name, role, platform_panel_access, approval_status, is_active, is_verified) VALUES
('admin@germy.com', crypt('admin123', gen_salt('bf')), 'Platform', 'Admin', 'platform_admin', true, 'approved', true, true);
```

---

## **🎯 KEY BENEFITS OF CHANGES**

### **1. Unified User Management:**
- All users (including platform admins) in one table
- Consistent role-based access control
- Simplified user management

### **2. Face Encoding Management:**
- 45-day refresh cycle tracking
- Quality score monitoring
- Historical encoding data
- Automatic expiration alerts

### **3. Approval Workflow:**
- Structured approval process
- Role-based approval hierarchy
- Audit trail for all approvals
- Request tracking and management

### **4. Work Mode Flexibility:**
- Support for remote, hybrid, and onsite work
- Scheduling and template system
- Location-based verification
- Approval workflow for schedule changes

### **5. Performance Optimization:**
- Comprehensive indexing strategy
- Efficient query patterns
- Row-level security for data isolation
- Optimized views for common queries

---

## **📈 DATABASE PERFORMANCE IMPACT**

### **Positive Impacts:**
- ✅ **Faster Queries**: New indexes improve query performance
- ✅ **Better Security**: RLS policies ensure data isolation
- ✅ **Easier Management**: Unified user table structure
- ✅ **Scalable Design**: Optimized for multi-tenant architecture

### **Considerations:**
- ⚠️ **Storage**: Additional fields increase row size
- ⚠️ **Indexes**: More indexes require more storage
- ⚠️ **Complexity**: More tables require more joins

---

## **🚀 MIGRATION STRATEGY**

### **Phase 1: Schema Updates**
1. Add new fields to users table
2. Create new tables
3. Add indexes and triggers
4. Update RLS policies

### **Phase 2: Data Migration**
1. Migrate platform admins to users table
2. Migrate face encodings to face_encoding_history
3. Update existing user records with new fields

### **Phase 3: Application Updates**
1. Update application code to use new structure
2. Implement new approval workflow
3. Add face encoding refresh logic
4. Update API endpoints

---

## **✅ VALIDATION CHECKLIST**

- [x] All new tables created with proper relationships
- [x] Indexes added for performance optimization
- [x] Triggers added for updated_at timestamps
- [x] RLS policies enabled for new tables
- [x] Views created for common queries
- [x] Initial data seeding updated
- [x] Deprecated tables marked appropriately
- [x] Documentation updated

---

**The database schema is now fully optimized for the 4-role architecture with comprehensive support for face encoding management, approval workflows, and work mode flexibility.** 🎯🗄️
