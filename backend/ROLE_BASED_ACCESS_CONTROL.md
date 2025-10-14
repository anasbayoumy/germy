# 🎯 **GERMY ATTENDANCE PLATFORM - ROLE-BASED ACCESS CONTROL**

## **📋 4-ROLE HIERARCHY OVERVIEW**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLATFORM ADMIN (Level 4)                    │
│  🌐 Platform Panel - Approve Company Super Admins             │
│  💰 Platform Management - Subscription Plans, Billing         │
│  📊 Platform Analytics - All Companies Overview               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                COMPANY SUPER ADMIN (Level 3)                   │
│  💻 Dashboard Only - No Mobile App Access                     │
│  👥 User/Admin Management - Approve/Decline Users & Admins    │
│  💳 Billing & Subscription - Company Payment Management       │
│  📈 Company Analytics - All Users & Admins Data               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN (Level 2)                           │
│  📱 Mobile App - Take Attendance (Same as User)               │
│  💻 Dashboard - User Management & Analytics                   │
│  ✅ User Approval - Approve New User Signups                  │
│  👥 User CRUD - Add/Edit/Delete/Remove Users                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       USER (Level 1)                           │
│  📱 Mobile App Only - Clock In/Out Daily                      │
│  👤 Face Encoding - Initial Setup + 45-Day Refresh            │
│  📊 Personal Analytics - Own Data Only                        │
│  ⏳ Pending Approval - Wait for Admin Approval                │
└─────────────────────────────────────────────────────────────────┘
```

---

## **👤 ROLE 1: USER (Level 1)**

### **📱 Access: Mobile App Only**
- **No Dashboard Access**
- **No Platform Panel Access**
- **No Web Interface Access**

### **🔐 Permissions:**
```typescript
interface UserPermissions {
  // Mobile App Access
  mobileApp: {
    clockIn: boolean;        // ✅ Clock in daily
    clockOut: boolean;       // ✅ Clock out daily
    viewOwnAttendance: boolean; // ✅ View own attendance history
    viewOwnAnalytics: boolean;  // ✅ View own analytics
    updateProfile: boolean;     // ✅ Update own profile
    faceEncoding: boolean;      // ✅ Create/update face encoding
  };
  
  // Dashboard Access
  dashboard: {
    access: boolean;         // ❌ No dashboard access
  };
  
  // Platform Panel Access
  platformPanel: {
    access: boolean;         // ❌ No platform panel access
  };
  
  // User Management
  userManagement: {
    viewUsers: boolean;      // ❌ Cannot view other users
    createUsers: boolean;    // ❌ Cannot create users
    editUsers: boolean;      // ❌ Cannot edit other users
    deleteUsers: boolean;    // ❌ Cannot delete users
    approveUsers: boolean;   // ❌ Cannot approve users
  };
  
  // Company Management
  companyManagement: {
    viewCompany: boolean;    // ❌ Cannot view company data
    editCompany: boolean;    // ❌ Cannot edit company
    billing: boolean;        // ❌ Cannot access billing
  };
}
```

### **🎯 Key Features:**
1. **Daily Clock In/Out** - Take attendance using mobile app
2. **Face Encoding** - Initial setup + refresh every 45 days
3. **Personal Analytics** - View own attendance data and insights
4. **Profile Management** - Update personal information
5. **Approval Status** - Wait for admin approval after signup

### **📱 Mobile App Features:**
- Clock in/out with face verification
- View attendance history
- View personal analytics
- Update profile information
- Face encoding setup and refresh
- Work mode selection (remote/hybrid/onsite)

---

## **👨‍💼 ROLE 2: ADMIN (Level 2)**

### **📱 Access: Mobile App + Dashboard**
- **Mobile App Access** (Same as User)
- **Dashboard Access** (Web Interface)
- **No Platform Panel Access**

### **🔐 Permissions:**
```typescript
interface AdminPermissions {
  // Mobile App Access (Same as User)
  mobileApp: {
    clockIn: boolean;        // ✅ Clock in daily
    clockOut: boolean;       // ✅ Clock out daily
    viewOwnAttendance: boolean; // ✅ View own attendance history
    viewOwnAnalytics: boolean;  // ✅ View own analytics
    updateProfile: boolean;     // ✅ Update own profile
    faceEncoding: boolean;      // ✅ Create/update face encoding
  };
  
  // Dashboard Access
  dashboard: {
    access: boolean;         // ✅ Full dashboard access
    viewAllUsers: boolean;   // ✅ View all users in company
    viewAllAnalytics: boolean; // ✅ View all user analytics
    viewReports: boolean;    // ✅ View all reports
    exportData: boolean;     // ✅ Export attendance data
  };
  
  // User Management
  userManagement: {
    viewUsers: boolean;      // ✅ View all users
    createUsers: boolean;    // ✅ Create new users
    editUsers: boolean;      // ✅ Edit user profiles
    deleteUsers: boolean;    // ✅ Delete users
    approveUsers: boolean;   // ✅ Approve new user signups
    manageUserRoles: boolean; // ❌ Cannot change user roles
  };
  
  // Company Management
  companyManagement: {
    viewCompany: boolean;    // ✅ View company information
    editCompany: boolean;    // ❌ Cannot edit company settings
    billing: boolean;        // ❌ Cannot access billing
  };
}
```

### **🎯 Key Features:**
1. **All User Features** - Everything a User can do
2. **User Management** - Add/Edit/Delete/Approve users
3. **Company Analytics** - View all users' data and insights
4. **Reports Generation** - Create and export reports
5. **User Approval** - Approve new user signups

### **💻 Dashboard Features:**
- User management (CRUD operations)
- Attendance analytics for all users
- Reports generation and export
- User approval workflow
- Company overview dashboard

---

## **👑 ROLE 3: COMPANY SUPER ADMIN (Level 3)**

### **💻 Access: Dashboard Only**
- **No Mobile App Access** (Doesn't take attendance)
- **Full Dashboard Access**
- **No Platform Panel Access**

### **🔐 Permissions:**
```typescript
interface CompanySuperAdminPermissions {
  // Mobile App Access
  mobileApp: {
    access: boolean;         // ❌ No mobile app access
  };
  
  // Dashboard Access
  dashboard: {
    access: boolean;         // ✅ Full dashboard access
    viewAllUsers: boolean;   // ✅ View all users and admins
    viewAllAnalytics: boolean; // ✅ View all analytics
    viewReports: boolean;    // ✅ View all reports
    exportData: boolean;     // ✅ Export all data
    manageAdmins: boolean;   // ✅ Manage admin users
  };
  
  // User Management
  userManagement: {
    viewUsers: boolean;      // ✅ View all users and admins
    createUsers: boolean;    // ✅ Create users and admins
    editUsers: boolean;      // ✅ Edit all user profiles
    deleteUsers: boolean;    // ✅ Delete users and admins
    approveUsers: boolean;   // ✅ Approve users and admins
    manageUserRoles: boolean; // ✅ Change user roles (user/admin)
  };
  
  // Company Management
  companyManagement: {
    viewCompany: boolean;    // ✅ View company information
    editCompany: boolean;    // ✅ Edit company settings
    billing: boolean;        // ✅ Access billing and subscription
    manageSubscription: boolean; // ✅ Manage subscription plans
  };
}
```

### **🎯 Key Features:**
1. **Company Management** - Full control over company settings
2. **User & Admin Management** - Manage all users and admins
3. **Billing & Subscription** - Handle payments and subscriptions
4. **Company Analytics** - View comprehensive company insights
5. **Admin Approval** - Approve new admin requests

### **💻 Dashboard Features:**
- Complete company management
- User and admin management
- Billing and subscription management
- Comprehensive analytics and reports
- Admin approval workflow

---

## **🌐 ROLE 4: PLATFORM ADMIN (Level 4)**

### **🌐 Access: Platform Panel Only**
- **No Mobile App Access**
- **No Company Dashboard Access**
- **Platform Panel Access Only**

### **🔐 Permissions:**
```typescript
interface PlatformAdminPermissions {
  // Mobile App Access
  mobileApp: {
    access: boolean;         // ❌ No mobile app access
  };
  
  // Dashboard Access
  dashboard: {
    access: boolean;         // ❌ No company dashboard access
  };
  
  // Platform Panel Access
  platformPanel: {
    access: boolean;         // ✅ Full platform panel access
    viewAllCompanies: boolean; // ✅ View all companies
    manageCompanies: boolean;  // ✅ Create/edit/delete companies
    approveCompanies: boolean; // ✅ Approve company super admins
    manageSubscriptionPlans: boolean; // ✅ Manage subscription plans
    platformAnalytics: boolean; // ✅ View platform-wide analytics
  };
  
  // User Management
  userManagement: {
    viewAllUsers: boolean;   // ✅ View all users across all companies
    managePlatformAdmins: boolean; // ✅ Manage other platform admins
  };
  
  // Company Management
  companyManagement: {
    viewAllCompanies: boolean; // ✅ View all companies
    createCompanies: boolean;  // ✅ Create new companies
    editCompanies: boolean;    // ✅ Edit company information
    deleteCompanies: boolean;  // ✅ Delete companies
    approveCompanies: boolean; // ✅ Approve company super admins
  };
}
```

### **🎯 Key Features:**
1. **Platform Management** - Manage entire platform
2. **Company Approval** - Approve company super admins
3. **Subscription Plans** - Manage pricing and plans
4. **Platform Analytics** - View platform-wide insights
5. **Company Management** - Create/edit/delete companies

### **🌐 Platform Panel Features:**
- Company management and approval
- Subscription plan management
- Platform-wide analytics
- Company super admin approval
- Platform configuration

---

## **🔄 APPROVAL WORKFLOW**

### **User Signup Flow:**
```
1. User signs up via Mobile App
   ↓
2. User fills credentials and creates face encoding
   ↓
3. User status: "pending" approval
   ↓
4. Admin receives notification
   ↓
5. Admin approves/rejects user
   ↓
6. User receives notification of approval status
```

### **Admin Promotion Flow:**
```
1. Company Super Admin creates admin user
   ↓
2. Admin user receives credentials
   ↓
3. Admin user creates face encoding
   ↓
4. Admin status: "pending" approval
   ↓
5. Company Super Admin approves admin
   ↓
6. Admin gains dashboard access
```

### **Company Super Admin Approval Flow:**
```
1. Company Super Admin signs up
   ↓
2. Platform Admin receives notification
   ↓
3. Platform Admin approves/rejects
   ↓
4. Company Super Admin gains dashboard access
```

---

## **📱 MOBILE APP ACCESS CONTROL**

### **User & Admin (Mobile App Access):**
- Clock in/out with face verification
- View attendance history
- View personal analytics
- Update profile
- Face encoding management
- Work mode selection

### **Company Super Admin & Platform Admin:**
- **No Mobile App Access**
- **Web Interface Only**

---

## **💻 DASHBOARD ACCESS CONTROL**

### **Admin & Company Super Admin (Dashboard Access):**
- User management
- Analytics and reports
- Company settings (Super Admin only)
- Billing management (Super Admin only)

### **User & Platform Admin:**
- **No Dashboard Access**
- **Mobile App or Platform Panel Only**

---

## **🌐 PLATFORM PANEL ACCESS CONTROL**

### **Platform Admin Only:**
- Company management
- Subscription plan management
- Platform analytics
- Company approval workflow

### **All Other Roles:**
- **No Platform Panel Access**

---

## **🔐 SECURITY IMPLEMENTATION**

### **Role-Based Middleware:**
```typescript
// Check if user has mobile app access
const requireMobileAppAccess = (req, res, next) => {
  if (!req.user.mobile_app_access) {
    return res.status(403).json({ error: 'Mobile app access required' });
  }
  next();
};

// Check if user has dashboard access
const requireDashboardAccess = (req, res, next) => {
  if (!req.user.dashboard_access) {
    return res.status(403).json({ error: 'Dashboard access required' });
  }
  next();
};

// Check if user has platform panel access
const requirePlatformPanelAccess = (req, res, next) => {
  if (!req.user.platform_panel_access) {
    return res.status(403).json({ error: 'Platform panel access required' });
  }
  next();
};
```

### **API Endpoint Protection:**
```typescript
// Mobile app endpoints (User & Admin only)
app.use('/api/mobile', requireMobileAppAccess, mobileRoutes);

// Dashboard endpoints (Admin & Super Admin only)
app.use('/api/dashboard', requireDashboardAccess, dashboardRoutes);

// Platform panel endpoints (Platform Admin only)
app.use('/api/platform', requirePlatformPanelAccess, platformRoutes);
```

---

## **📊 ROLE SUMMARY TABLE**

| Feature | User | Admin | Super Admin | Platform Admin |
|---------|------|-------|-------------|----------------|
| **Mobile App** | ✅ | ✅ | ❌ | ❌ |
| **Dashboard** | ❌ | ✅ | ✅ | ❌ |
| **Platform Panel** | ❌ | ❌ | ❌ | ✅ |
| **Take Attendance** | ✅ | ✅ | ❌ | ❌ |
| **View Own Data** | ✅ | ✅ | ❌ | ❌ |
| **View All Users** | ❌ | ✅ | ✅ | ✅ |
| **Manage Users** | ❌ | ✅ | ✅ | ✅ |
| **Approve Users** | ❌ | ✅ | ✅ | ❌ |
| **Company Settings** | ❌ | ❌ | ✅ | ❌ |
| **Billing** | ❌ | ❌ | ✅ | ❌ |
| **Platform Management** | ❌ | ❌ | ❌ | ✅ |

---

## **🚀 IMPLEMENTATION PRIORITY**

### **Phase 1: Core Roles (Week 1-2)**
1. ✅ User role with mobile app access
2. ✅ Admin role with dashboard access
3. ✅ Basic approval workflow

### **Phase 2: Advanced Roles (Week 3-4)**
1. ✅ Company Super Admin role
2. ✅ Platform Admin role
3. ✅ Complete approval workflow

### **Phase 3: Enhanced Features (Week 5-6)**
1. ✅ Face encoding with 45-day refresh
2. ✅ Advanced analytics
3. ✅ Billing integration

---

**This role-based access control system ensures clear separation of responsibilities and secure access to different parts of the platform based on user roles.** 🎯🔐
