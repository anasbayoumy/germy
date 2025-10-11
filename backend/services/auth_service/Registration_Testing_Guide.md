# 🚀 **User Registration Testing Guide**

## **📁 Files Created:**
1. `User_Registration_Collection.postman_collection.json` - Complete registration collection
2. `Registration_Environment.postman_environment.json` - Environment variables
3. `Registration_Testing_Guide.md` - This testing guide

## **📥 Import Instructions:**

### **Step 1: Import Collection**
1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `User_Registration_Collection.postman_collection.json`
4. Click **Import**

### **Step 2: Import Environment**
1. Click **Environment** dropdown → **Import**
2. Select `Registration_Environment.postman_environment.json`
3. Click **Import**
4. Select the imported environment

---

## **👥 User Roles & Registration Flow**

### **Role Hierarchy:**
```
Platform Admin (Highest)
    ↓
Company Super Admin
    ↓
Company Admin
    ↓
Employee (Lowest)
```

### **Registration Dependencies:**
- **Platform Admin**: Can register other Platform Admins (after first one is created manually)
- **Company Super Admin**: Can register Company Admins (creates company + super admin)
- **Company Admin**: Can register Employees (within their company)
- **Employee**: Cannot register anyone

---

## **🔧 Testing Scenarios**

### **1. Platform Admin Registration**

#### **First Platform Admin (Manual Setup)**
```bash
POST /api/auth/platform/register
{
  "firstName": "Platform",
  "lastName": "Admin",
  "email": "platform.admin@system.com",
  "password": "PlatformAdmin123!",
  "phone": "+1234567890"
}
```
**Note**: First platform admin needs to be created manually in database or through direct API call.

#### **Additional Platform Admins**
```bash
POST /api/auth/platform/register
Authorization: Bearer <platform_admin_token>
{
  "firstName": "Secondary",
  "lastName": "Platform Admin",
  "email": "secondary.platform@system.com",
  "password": "SecondaryAdmin123!",
  "phone": "+1234567891"
}
```

### **2. Company Super Admin Registration**

#### **Create Company + Super Admin**
```bash
POST /api/auth/super_admin/register
{
  "companyName": "TechCorp Solutions",
  "companyDomain": "techcorp.com",
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@techcorp.com",
  "password": "SuperAdmin123!",
  "phone": "+1234567892",
  "industry": "Technology",
  "companySize": "50-200"
}
```

**Response includes:**
- User object (super admin)
- Company object (newly created)
- Company ID (saved to environment variable)

### **3. Company Admin Registration**

#### **Register Company Admin**
```bash
POST /api/auth/admin/register
Authorization: Bearer <company_super_admin_token>
{
  "firstName": "Michael",
  "lastName": "Brown",
  "email": "michael.brown@techcorp.com",
  "password": "CompanyAdmin123!",
  "phone": "+1234567894"
}
```

### **4. Employee Registration**

#### **Register Employee**
```bash
POST /api/auth/user/register
Authorization: Bearer <company_admin_token>
{
  "firstName": "David",
  "lastName": "Wilson",
  "email": "david.wilson@techcorp.com",
  "password": "Employee123!",
  "phone": "+1234567896"
}
```

---

## **📋 Complete Test Data**

### **Platform Admins**
| **Name** | **Email** | **Password** | **Phone** |
|----------|-----------|--------------|-----------|
| Platform Admin | platform.admin@system.com | PlatformAdmin123! | +1234567890 |
| Secondary Platform Admin | secondary.platform@system.com | SecondaryAdmin123! | +1234567891 |

### **Companies & Super Admins**
| **Company** | **Domain** | **Super Admin** | **Email** | **Password** | **Industry** | **Size** |
|-------------|------------|-----------------|-----------|--------------|--------------|----------|
| TechCorp Solutions | techcorp.com | John Smith | john.smith@techcorp.com | SuperAdmin123! | Technology | 50-200 |
| InnovateLabs Inc | innovatelabs.com | Sarah Johnson | sarah.johnson@innovatelabs.com | InnovateAdmin123! | Software Development | 10-50 |
| LegacyCorp Ltd | legacycorp.com | Frank Miller | frank.miller@legacycorp.com | LegacyUser123! | Consulting | 5-20 |

### **Company Admins**
| **Name** | **Email** | **Password** | **Phone** | **Company** |
|----------|-----------|--------------|-----------|-------------|
| Michael Brown | michael.brown@techcorp.com | CompanyAdmin123! | +1234567894 | TechCorp |
| Emily Davis | emily.davis@techcorp.com | EmilyAdmin123! | +1234567895 | TechCorp |

### **Employees**
| **Name** | **Email** | **Password** | **Phone** | **Role** | **Company** |
|----------|-----------|--------------|-----------|----------|-------------|
| David Wilson | david.wilson@techcorp.com | Employee123! | +1234567896 | Employee | TechCorp |
| Alice Johnson | alice.johnson@techcorp.com | FrontendDev123! | +1234567897 | Frontend Developer | TechCorp |
| Bob Anderson | bob.anderson@techcorp.com | BackendDev123! | +1234567898 | Backend Developer | TechCorp |
| Carol Martinez | carol.martinez@techcorp.com | Designer123! | +1234567899 | UI/UX Designer | TechCorp |
| Daniel Taylor | daniel.taylor@techcorp.com | QAEngineer123! | +1234567800 | QA Engineer | TechCorp |
| Eva Garcia | eva.garcia@techcorp.com | ProjectMgr123! | +1234567801 | Project Manager | TechCorp |

---

## **🎯 Testing Workflow**

### **Phase 1: Setup Platform Admin**
1. **Register First Platform Admin** (Manual)
2. **Login Platform Admin** → Save token
3. **Register Additional Platform Admin** (using token)

### **Phase 2: Create Companies**
1. **Register Company + Super Admin** (TechCorp)
2. **Login Company Super Admin** → Save token
3. **Register Another Company** (InnovateLabs)

### **Phase 3: Create Company Admins**
1. **Register Company Admin** (using super admin token)
2. **Login Company Admin** → Save token
3. **Register Another Company Admin**

### **Phase 4: Create Employees**
1. **Register Employee** (using company admin token)
2. **Login Employee** → Save token
3. **Register Multiple Employees** (different roles)

### **Phase 5: Test All Logins**
1. **Login Platform Admin**
2. **Login Company Super Admin**
3. **Login Company Admin**
4. **Login Employee**
5. **Test Legacy Login**

### **Phase 6: Test Token Management**
1. **Verify Token**
2. **Refresh Token**
3. **Get Current User**
4. **Logout**

---

## **🔍 Expected Responses**

### **Successful Registration (201)**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "employee",
    "isActive": true,
    "isVerified": false,
    "companyId": "uuid"
  },
  "company": {
    "id": "uuid",
    "name": "Company Name",
    "domain": "company.com"
  },
  "message": "User registered successfully"
}
```

### **Successful Login (200)**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "employee",
    "companyId": "uuid"
  },
  "expiresIn": "24h"
}
```

### **Error Response (400/401/403)**
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

---

## **⚠️ Common Issues & Solutions**

### **1. Authentication Errors**
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Insufficient permissions for role
- **Solution**: Ensure correct token is set in Authorization header

### **2. Validation Errors**
- **400 Bad Request**: Invalid email format, weak password, missing fields
- **Solution**: Check request body against schema requirements

### **3. Duplicate Email**
- **409 Conflict**: Email already exists
- **Solution**: Use unique email addresses for each test

### **4. Company Domain Conflicts**
- **409 Conflict**: Company domain already exists
- **Solution**: Use unique company domains

---

## **🚀 Quick Start Commands**

### **Run Collection in Order:**
1. Import collection and environment
2. Set environment variables
3. Run "1. Platform Admin Registration" folder
4. Run "2. Company Super Admin Registration" folder
5. Run "3. Company Admin Registration" folder
6. Run "4. Employee Registration" folder
7. Run "6. Login All Roles" folder
8. Run "8. Token Management" folder

### **Collection Runner:**
1. Click **Collection Runner**
2. Select "User Registration - All Roles Collection"
3. Choose environment
4. Click **Start Test**

---

## **📊 Test Coverage**

✅ **Platform Admin Registration** (2 scenarios)
✅ **Company Super Admin Registration** (3 scenarios)
✅ **Company Admin Registration** (3 scenarios)
✅ **Employee Registration** (6 scenarios)
✅ **Legacy Registration** (1 scenario)
✅ **All Role Logins** (5 scenarios)
✅ **Password Management** (2 scenarios)
✅ **Token Management** (4 scenarios)

**Total: 26 test scenarios covering all registration flows!**

This collection provides comprehensive testing for all user registration scenarios in your authentication system. 🎉

