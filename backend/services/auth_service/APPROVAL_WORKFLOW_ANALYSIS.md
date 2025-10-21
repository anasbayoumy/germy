# 🔄 Approval Workflow Analysis

## 📋 Who Sees Which Approval Requests?

### **🎯 Answer to Your Questions:**

#### **1. User Registration → Who Sees the Request?**
- **✅ Company Admin** - Can see and approve user requests
- **✅ Company Super Admin** - Can see and approve user requests  
- **✅ Platform Admin** - Can see and approve all requests
- **❌ Other Companies** - Cannot see requests from other companies

#### **2. Admin Registration → Who Sees the Request?**
- **✅ Company Super Admin** - Can see and approve admin requests
- **✅ Platform Admin** - Can see and approve all requests
- **❌ Company Admin** - Cannot approve admin requests (insufficient permissions)
- **❌ Other Companies** - Cannot see requests from other companies

## 🏢 Company-Scoped Access Control

### **Database Logic:**
```typescript
// In approval.service.ts - getPendingApprovalRequests()
const whereConditions = [];

// Company-scoped access
if (user.role === 'company_admin' || user.role === 'company_super_admin') {
  whereConditions.push(eq(userApprovalRequests.companyId, user.companyId!));
}
```

### **What This Means:**
- **Company Admin** sees only requests from their company
- **Company Super Admin** sees only requests from their company
- **Platform Admin** sees all requests from all companies

## 📊 Detailed Approval Matrix

| **Request Type** | **Requested Role** | **Company Admin** | **Company Super Admin** | **Platform Admin** |
|------------------|-------------------|-------------------|------------------------|-------------------|
| User Registration | `user` | ✅ Can Approve | ✅ Can Approve | ✅ Can Approve |
| Admin Registration | `company_admin` | ❌ Cannot Approve | ✅ Can Approve | ✅ Can Approve |
| Super Admin Registration | `company_super_admin` | ❌ Cannot Approve | ❌ Cannot Approve | ✅ Can Approve |

## 🔍 Code Analysis

### **User Registration Approval Request:**
```typescript
// In registerUserWithDomain()
await db.insert(userApprovalRequests).values({
  userId: user.id,
  companyId: company[0].id,
  requestedRole: 'user',           // 👈 Regular user
  requestType: 'new_signup',
  status: 'pending',
});
```

### **Admin Registration Approval Request:**
```typescript
// In registerAdminWithDomain()
await db.insert(userApprovalRequests).values({
  userId: user.id,
  companyId: company[0].id,
  requestedRole: 'company_admin', // 👈 Admin role
  requestType: 'new_signup',
  status: 'pending',
});
```

## 🎯 Real-World Scenarios

### **Scenario 1: User Registration**
```
1. John Doe registers as user at "acme.com"
2. Approval request created with:
   - requestedRole: "user"
   - companyId: "acme-company-id"
   - status: "pending"

3. Who can see this request?
   ✅ Acme Company Admin (if exists)
   ✅ Acme Company Super Admin
   ✅ Platform Admin
   ❌ Other company admins
```

### **Scenario 2: Admin Registration**
```
1. Jane Smith registers as admin at "acme.com"
2. Approval request created with:
   - requestedRole: "company_admin"
   - companyId: "acme-company-id"
   - status: "pending"

3. Who can see this request?
   ❌ Acme Company Admin (insufficient permissions)
   ✅ Acme Company Super Admin
   ✅ Platform Admin
   ❌ Other company admins
```

## 🔐 Permission Hierarchy

### **Role Permissions:**
```
Platform Admin
├── Can approve: All requests from all companies
└── Can see: All requests from all companies

Company Super Admin
├── Can approve: Users + Admins from their company
└── Can see: All requests from their company

Company Admin
├── Can approve: Users from their company only
└── Can see: All requests from their company

Regular User
├── Can approve: Nothing
└── Can see: Nothing
```

## 🧪 Test Scenarios

### **Test 1: User Registration Flow**
```bash
# 1. User registers
POST /api/auth/user/register
{
  "companyDomain": "acme.com",
  "email": "user@acme.com",
  "password": "password123"
}

# 2. Company Admin checks pending requests
GET /api/approvals/pending
Authorization: Bearer <company_admin_token>

# Expected: User request appears in list
```

### **Test 2: Admin Registration Flow**
```bash
# 1. Admin registers
POST /api/auth/admin/register
{
  "companyDomain": "acme.com",
  "email": "admin@acme.com",
  "password": "password123"
}

# 2. Company Admin checks pending requests
GET /api/approvals/pending
Authorization: Bearer <company_admin_token>

# Expected: Admin request appears in list

# 3. Company Super Admin checks pending requests
GET /api/approvals/pending
Authorization: Bearer <company_super_admin_token>

# Expected: Admin request appears in list
```

### **Test 3: Cross-Company Isolation**
```bash
# 1. User registers at Company A
POST /api/auth/user/register
{
  "companyDomain": "company-a.com",
  "email": "user@company-a.com",
  "password": "password123"
}

# 2. Company B Admin checks pending requests
GET /api/approvals/pending
Authorization: Bearer <company_b_admin_token>

# Expected: No requests from Company A appear
```

## 📋 Database Queries

### **Check Approval Requests:**
```sql
-- See all pending requests for a company
SELECT 
  uar.id,
  uar.requested_role,
  uar.status,
  u.first_name,
  u.last_name,
  u.email,
  c.name as company_name
FROM user_approval_requests uar
JOIN users u ON uar.user_id = u.id
JOIN companies c ON uar.company_id = c.id
WHERE uar.company_id = 'your-company-id'
AND uar.status = 'pending';
```

### **Check Company-Scoped Access:**
```sql
-- See what a specific admin can see
SELECT 
  uar.*,
  u.email,
  c.name as company_name
FROM user_approval_requests uar
JOIN users u ON uar.user_id = u.id
JOIN companies c ON uar.company_id = c.id
WHERE uar.company_id = (
  SELECT company_id FROM users WHERE id = 'admin-user-id'
);
```

## 🎯 Summary

### **✅ User Registration:**
- **Company Admin** ✅ Can see and approve
- **Company Super Admin** ✅ Can see and approve
- **Platform Admin** ✅ Can see and approve

### **✅ Admin Registration:**
- **Company Admin** ❌ Cannot approve (insufficient permissions)
- **Company Super Admin** ✅ Can see and approve
- **Platform Admin** ✅ Can see and approve

### **🔒 Security Features:**
- **Company-scoped access** - Admins only see their company's requests
- **Role-based permissions** - Different roles can approve different request types
- **Cross-company isolation** - No access to other companies' requests
- **Audit trail** - All approvals are logged

This system ensures that:
1. **Users** can be approved by any admin in their company
2. **Admins** can only be approved by super admins or platform admins
3. **Companies** are isolated from each other's approval requests
4. **Platform admins** have oversight of all requests
