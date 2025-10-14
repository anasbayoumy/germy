# 📡 **GERMY ATTENDANCE PLATFORM - API ENDPOINTS STRUCTURE**

## **📋 API ARCHITECTURE OVERVIEW**

```
┌─────────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS STRUCTURE                     │
├─────────────────────────────────────────────────────────────────┤
│  📱 Mobile App APIs    - User & Admin (Clock In/Out)          │
│  💻 Dashboard APIs     - Admin & Super Admin (Management)     │
│  🌐 Platform APIs      - Platform Admin (Platform Management) │
│  🤖 AI Service APIs    - All Roles (Face Recognition, etc.)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## **📱 MOBILE APP APIs (User & Admin Access)**

### **Base URL:** `/api/mobile`

### **🔐 Authentication Required:** Mobile App Access

### **👤 User Endpoints:**
```typescript
// User Profile Management
GET    /api/mobile/profile                    // Get user profile
PUT    /api/mobile/profile                    // Update user profile
POST   /api/mobile/profile/photo              // Upload profile photo

// Face Encoding Management
POST   /api/mobile/face-encoding              // Create initial face encoding
PUT    /api/mobile/face-encoding              // Update face encoding (45-day refresh)
GET    /api/mobile/face-encoding/status       // Check encoding status
POST   /api/mobile/face-encoding/refresh      // Force refresh encoding

// Attendance Management
POST   /api/mobile/attendance/clock-in        // Clock in with face verification
POST   /api/mobile/attendance/clock-out       // Clock out with face verification
GET    /api/mobile/attendance/status          // Get current attendance status
GET    /api/mobile/attendance/history         // Get attendance history
GET    /api/mobile/attendance/today           // Get today's attendance

// Personal Analytics
GET    /api/mobile/analytics/personal         // Get personal analytics
GET    /api/mobile/analytics/productivity     // Get productivity insights
GET    /api/mobile/analytics/trends           // Get attendance trends

// Work Mode Management
GET    /api/mobile/work-mode                  // Get current work mode
PUT    /api/mobile/work-mode                  // Update work mode
GET    /api/mobile/work-mode/schedule         // Get work schedule
PUT    /api/mobile/work-mode/schedule         // Update work schedule

// Notifications
GET    /api/mobile/notifications              // Get notifications
PUT    /api/mobile/notifications/:id/read     // Mark notification as read
```

### **👨‍💼 Admin Endpoints (Additional to User):**
```typescript
// User Management (Admin only)
GET    /api/mobile/admin/users                // Get all users in company
GET    /api/mobile/admin/users/:id            // Get specific user
POST   /api/mobile/admin/users                // Create new user
PUT    /api/mobile/admin/users/:id            // Update user
DELETE /api/mobile/admin/users/:id            // Delete user

// User Approval (Admin only)
GET    /api/mobile/admin/approvals            // Get pending approvals
POST   /api/mobile/admin/approvals/:id/approve // Approve user
POST   /api/mobile/admin/approvals/:id/reject  // Reject user

// Company Analytics (Admin only)
GET    /api/mobile/admin/analytics/company    // Get company analytics
GET    /api/mobile/admin/analytics/users      // Get all users analytics
GET    /api/mobile/admin/reports              // Get reports
POST   /api/mobile/admin/reports/generate     // Generate report
```

---

## **💻 DASHBOARD APIs (Admin & Super Admin Access)**

### **Base URL:** `/api/dashboard`

### **🔐 Authentication Required:** Dashboard Access

### **👨‍💼 Admin Endpoints:**
```typescript
// User Management
GET    /api/dashboard/users                   // Get all users
GET    /api/dashboard/users/:id               // Get user details
POST   /api/dashboard/users                   // Create user
PUT    /api/dashboard/users/:id               // Update user
DELETE /api/dashboard/users/:id               // Delete user
POST   /api/dashboard/users/:id/activate      // Activate user
POST   /api/dashboard/users/:id/deactivate    // Deactivate user

// User Approval Workflow
GET    /api/dashboard/approvals               // Get pending approvals
GET    /api/dashboard/approvals/:id           // Get approval details
POST   /api/dashboard/approvals/:id/approve   // Approve user
POST   /api/dashboard/approvals/:id/reject    // Reject user
PUT    /api/dashboard/approvals/:id           // Update approval

// Attendance Management
GET    /api/dashboard/attendance              // Get all attendance records
GET    /api/dashboard/attendance/:id          // Get attendance details
PUT    /api/dashboard/attendance/:id/approve  // Approve attendance
PUT    /api/dashboard/attendance/:id/reject   // Reject attendance
GET    /api/dashboard/attendance/flagged      // Get flagged attendance

// Analytics & Reports
GET    /api/dashboard/analytics/overview      // Get overview analytics
GET    /api/dashboard/analytics/users         // Get user analytics
GET    /api/dashboard/analytics/attendance    // Get attendance analytics
GET    /api/dashboard/analytics/productivity  // Get productivity analytics
GET    /api/dashboard/reports                 // Get available reports
POST   /api/dashboard/reports/generate        // Generate custom report
GET    /api/dashboard/reports/:id/download    // Download report

// Company Settings (Limited)
GET    /api/dashboard/company                 // Get company info
PUT    /api/dashboard/company/profile         // Update company profile
```

### **👑 Super Admin Endpoints (Additional to Admin):**
```typescript
// Admin Management
GET    /api/dashboard/admins                  // Get all admins
POST   /api/dashboard/admins                  // Create admin
PUT    /api/dashboard/admins/:id              // Update admin
DELETE /api/dashboard/admins/:id              // Delete admin
POST   /api/dashboard/admins/:id/approve      // Approve admin

// Company Management
PUT    /api/dashboard/company                 // Update company settings
PUT    /api/dashboard/company/work-policies   // Update work policies
PUT    /api/dashboard/company/geofence        // Update geofence settings
GET    /api/dashboard/company/locations       // Get company locations
POST   /api/dashboard/company/locations       // Add location
PUT    /api/dashboard/company/locations/:id   // Update location
DELETE /api/dashboard/company/locations/:id   // Delete location

// Billing & Subscription
GET    /api/dashboard/billing                 // Get billing information
GET    /api/dashboard/billing/invoices        // Get invoices
GET    /api/dashboard/billing/payment-methods // Get payment methods
POST   /api/dashboard/billing/payment-methods // Add payment method
PUT    /api/dashboard/billing/payment-methods/:id // Update payment method
DELETE /api/dashboard/billing/payment-methods/:id // Delete payment method
GET    /api/dashboard/subscription            // Get subscription details
PUT    /api/dashboard/subscription            // Update subscription
POST   /api/dashboard/subscription/cancel     // Cancel subscription

// Advanced Analytics
GET    /api/dashboard/analytics/company-wide  // Get company-wide analytics
GET    /api/dashboard/analytics/departments   // Get department analytics
GET    /api/dashboard/analytics/teams         // Get team analytics
GET    /api/dashboard/analytics/trends        // Get trend analysis
GET    /api/dashboard/analytics/forecasting   // Get forecasting data

// Audit & Compliance
GET    /api/dashboard/audit-logs              // Get audit logs
GET    /api/dashboard/compliance              // Get compliance reports
POST   /api/dashboard/compliance/export       // Export compliance data
```

---

## **🌐 PLATFORM APIs (Platform Admin Access)**

### **Base URL:** `/api/platform`

### **🔐 Authentication Required:** Platform Panel Access

### **🌐 Platform Admin Endpoints:**
```typescript
// Company Management
GET    /api/platform/companies                // Get all companies
GET    /api/platform/companies/:id            // Get company details
POST   /api/platform/companies                // Create company
PUT    /api/platform/companies/:id            // Update company
DELETE /api/platform/companies/:id            // Delete company
POST   /api/platform/companies/:id/activate   // Activate company
POST   /api/platform/companies/:id/deactivate // Deactivate company

// Company Super Admin Approval
GET    /api/platform/approvals                // Get pending company approvals
GET    /api/platform/approvals/:id            // Get approval details
POST   /api/platform/approvals/:id/approve    // Approve company super admin
POST   /api/platform/approvals/:id/reject     // Reject company super admin

// Subscription Plan Management
GET    /api/platform/subscription-plans       // Get all subscription plans
GET    /api/platform/subscription-plans/:id   // Get plan details
POST   /api/platform/subscription-plans       // Create subscription plan
PUT    /api/platform/subscription-plans/:id   // Update subscription plan
DELETE /api/platform/subscription-plans/:id   // Delete subscription plan
POST   /api/platform/subscription-plans/:id/activate   // Activate plan
POST   /api/platform/subscription-plans/:id/deactivate // Deactivate plan

// Platform Analytics
GET    /api/platform/analytics/overview       // Get platform overview
GET    /api/platform/analytics/companies      // Get company analytics
GET    /api/platform/analytics/users          // Get user analytics
GET    /api/platform/analytics/revenue        // Get revenue analytics
GET    /api/platform/analytics/usage          // Get usage analytics
GET    /api/platform/analytics/trends         // Get platform trends

// Platform Configuration
GET    /api/platform/config                   // Get platform configuration
PUT    /api/platform/config                   // Update platform configuration
GET    /api/platform/features                 // Get feature flags
PUT    /api/platform/features                 // Update feature flags
GET    /api/platform/maintenance              // Get maintenance settings
PUT    /api/platform/maintenance              // Update maintenance settings

// Platform Admin Management
GET    /api/platform/admins                   // Get all platform admins
POST   /api/platform/admins                   // Create platform admin
PUT    /api/platform/admins/:id               // Update platform admin
DELETE /api/platform/admins/:id               // Delete platform admin
POST   /api/platform/admins/:id/activate      // Activate platform admin
POST   /api/platform/admins/:id/deactivate    // Deactivate platform admin

// System Monitoring
GET    /api/platform/system/health            // Get system health
GET    /api/platform/system/metrics           // Get system metrics
GET    /api/platform/system/logs              // Get system logs
GET    /api/platform/system/errors            // Get error logs
GET    /api/platform/system/performance       // Get performance metrics
```

---

## **🤖 AI SERVICE APIs (All Roles)**

### **Base URL:** `/api/ai`

### **🔐 Authentication Required:** Based on Role

### **🎭 ArcFace Endpoints:**
```typescript
// Face Encoding (User & Admin)
POST   /api/ai/arcface/encode                 // Encode face for user
PUT    /api/ai/arcface/encode/:userId         // Update face encoding
GET    /api/ai/arcface/encode/:userId/status  // Get encoding status
POST   /api/ai/arcface/encode/:userId/refresh // Refresh encoding

// Face Comparison (All Roles)
POST   /api/ai/arcface/compare                // Compare faces
POST   /api/ai/arcface/verify                 // Verify face for attendance
GET    /api/ai/arcface/quality/:userId        // Get face quality score
```

### **🚨 Fraud Detection Endpoints:**
```typescript
// Fraud Analysis (Admin & Super Admin)
POST   /api/ai/fraud/analyze                  // Analyze attendance for fraud
GET    /api/ai/fraud/alerts                   // Get fraud alerts
GET    /api/ai/fraud/patterns                 // Get fraud patterns
POST   /api/ai/fraud/review                   // Review fraud detection
PUT    /api/ai/fraud/review/:id               // Update fraud review
```

### **💬 Chat Bot Endpoints:**
```typescript
// Chat Support (All Roles)
POST   /api/ai/chat/message                   // Send message to chat bot
GET    /api/ai/chat/history                   // Get chat history
PUT    /api/ai/chat/context                   // Update chat context
GET    /api/ai/chat/suggestions               // Get chat suggestions
```

### **🧠 ML Analytics Endpoints:**
```typescript
// Analytics (Admin & Super Admin)
GET    /api/ai/ml/productivity                // Get productivity analysis
GET    /api/ai/ml/predictions                 // Get predictions
GET    /api/ai/ml/insights                    // Get ML insights
POST   /api/ai/ml/analyze                     // Run custom analysis
```

---

## **🔐 AUTHENTICATION APIs (All Roles)**

### **Base URL:** `/api/auth`

### **🔑 Authentication Endpoints:**
```typescript
// User Authentication
POST   /api/auth/login                        // Login user
POST   /api/auth/logout                       // Logout user
POST   /api/auth/refresh                      // Refresh token
POST   /api/auth/forgot-password              // Forgot password
POST   /api/auth/reset-password               // Reset password

// User Registration
POST   /api/auth/register                     // Register new user
POST   /api/auth/verify-email                 // Verify email
POST   /api/auth/resend-verification          // Resend verification

// Role-based Access
GET    /api/auth/permissions                  // Get user permissions
GET    /api/auth/roles                        // Get available roles
PUT    /api/auth/change-role                  // Change user role (Super Admin only)
```

---

## **📊 NOTIFICATION APIs (All Roles)**

### **Base URL:** `/api/notifications`

### **🔔 Notification Endpoints:**
```typescript
// Notifications (All Roles)
GET    /api/notifications                     // Get notifications
GET    /api/notifications/:id                 // Get notification details
PUT    /api/notifications/:id/read            // Mark as read
PUT    /api/notifications/:id/unread          // Mark as unread
DELETE /api/notifications/:id                 // Delete notification
POST   /api/notifications/mark-all-read       // Mark all as read

// Notification Settings
GET    /api/notifications/settings            // Get notification settings
PUT    /api/notifications/settings            // Update notification settings
```

---

## **📱 MOBILE APP SPECIFIC ENDPOINTS**

### **📱 Mobile App Features:**
```typescript
// Camera & Face Recognition
POST   /api/mobile/camera/capture             // Capture photo
POST   /api/mobile/camera/verify              // Verify photo quality
GET    /api/mobile/camera/permissions         // Check camera permissions

// Location Services
POST   /api/mobile/location/verify            // Verify location
GET    /api/mobile/location/geofence          // Get geofence settings
POST   /api/mobile/location/update            // Update location

// Offline Support
GET    /api/mobile/offline/data               // Get offline data
POST   /api/mobile/offline/sync               // Sync offline data
GET    /api/mobile/offline/status             // Get offline status

// Push Notifications
POST   /api/mobile/notifications/register     // Register for push notifications
PUT    /api/mobile/notifications/token        // Update push token
DELETE /api/mobile/notifications/unregister   // Unregister from push notifications
```

---

## **🔒 SECURITY & MIDDLEWARE**

### **Role-Based Access Control:**
```typescript
// Middleware for different access levels
const requireMobileAppAccess = (req, res, next) => {
  if (!req.user.mobile_app_access) {
    return res.status(403).json({ error: 'Mobile app access required' });
  }
  next();
};

const requireDashboardAccess = (req, res, next) => {
  if (!req.user.dashboard_access) {
    return res.status(403).json({ error: 'Dashboard access required' });
  }
  next();
};

const requirePlatformPanelAccess = (req, res, next) => {
  if (!req.user.platform_panel_access) {
    return res.status(403).json({ error: 'Platform panel access required' });
  }
  next();
};

// Role-specific middleware
const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};
```

### **API Rate Limiting:**
```typescript
// Different rate limits for different roles
const mobileAppLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many mobile app requests'
});

const dashboardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: 'Too many dashboard requests'
});

const platformLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window
  message: 'Too many platform requests'
});
```

---

## **📈 API USAGE STATISTICS**

### **Expected API Usage by Role:**
- **User**: 50-100 requests/day (mobile app usage)
- **Admin**: 200-500 requests/day (mobile + dashboard)
- **Super Admin**: 100-300 requests/day (dashboard only)
- **Platform Admin**: 50-200 requests/day (platform panel)

### **API Performance Targets:**
- **Response Time**: < 500ms for 95% of requests
- **Availability**: 99.9% uptime
- **Error Rate**: < 0.1%
- **Concurrent Users**: 10,000+ simultaneous users

---

**This API structure ensures clear separation of concerns and secure access control based on user roles while providing comprehensive functionality for each role level.** 🚀🔐
