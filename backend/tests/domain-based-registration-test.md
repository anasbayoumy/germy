# Domain-Based Registration Test Scenarios

## 🎯 Updated Registration Flow

### **New Endpoint Structure:**
- `POST /api/auth/admin/register` → Domain-based admin registration
- `POST /api/auth/user/register` → Domain-based user registration
- `POST /api/auth/super_admin/register` → Company creation + super admin
- `POST /api/auth/platform/register` → Platform admin (requires auth)

## 🧪 Test Scenarios

### **Scenario 1: Company Super Admin Registration (First)**
```bash
POST /api/auth/super_admin/register
Content-Type: application/json

{
  "companyName": "Acme Corporation",
  "companyDomain": "acme.com",
  "firstName": "John",
  "lastName": "Admin",
  "email": "admin@acme.com",
  "password": "password123",
  "phone": "+1234567890",
  "industry": "Technology",
  "companySize": "50-200"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Company registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@acme.com",
      "firstName": "John",
      "lastName": "Admin",
      "role": "company_super_admin"
    },
    "company": {
      "id": "uuid",
      "name": "Acme Corporation",
      "domain": "acme.com"
    },
    "token": "jwt-token"
  }
}
```

### **Scenario 2: User Registration (Domain Validation)**
```bash
POST /api/auth/user/register
Content-Type: application/json

{
  "companyDomain": "acme.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@acme.com",
  "password": "password123",
  "phone": "+1234567891",
  "position": "Developer",
  "department": "Engineering"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registration pending approval",
  "data": {
    "user": {
      "id": "uuid",
      "email": "jane@acme.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "user",
      "approvalStatus": "pending"
    },
    "approvalRequest": {
      "status": "pending",
      "message": "Your registration is pending approval from your company admin"
    }
  }
}
```

### **Scenario 3: Admin Registration (Domain Validation)**
```bash
POST /api/auth/admin/register
Content-Type: application/json

{
  "companyDomain": "acme.com",
  "firstName": "Bob",
  "lastName": "Manager",
  "email": "bob@acme.com",
  "password": "password123",
  "phone": "+1234567892",
  "position": "Team Lead",
  "department": "Engineering"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin registration pending approval",
  "data": {
    "user": {
      "id": "uuid",
      "email": "bob@acme.com",
      "firstName": "Bob",
      "lastName": "Manager",
      "role": "company_admin",
      "approvalStatus": "pending"
    },
    "approvalRequest": {
      "status": "pending",
      "message": "Your admin registration is pending approval from your company super admin"
    }
  }
}
```

### **Scenario 4: Non-Existent Company Domain (Error Case)**
```bash
POST /api/auth/user/register
Content-Type: application/json

{
  "companyDomain": "nonexistent.com",
  "firstName": "Test",
  "lastName": "User",
  "email": "test@nonexistent.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Company not found with this domain"
}
```

### **Scenario 5: Duplicate Email (Error Case)**
```bash
POST /api/auth/user/register
Content-Type: application/json

{
  "companyDomain": "acme.com",
  "firstName": "Duplicate",
  "lastName": "User",
  "email": "jane@acme.com",  // Same email as Scenario 2
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

## 🔄 Complete Workflow Test

### **Step 1: Create Company**
```bash
# Register company super admin
curl -X POST http://localhost:3001/api/auth/super_admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Corp",
    "companyDomain": "testcorp.com",
    "firstName": "Super",
    "lastName": "Admin",
    "email": "super@testcorp.com",
    "password": "password123",
    "industry": "Technology",
    "companySize": "10-50"
  }'
```

### **Step 2: Register User (Should Work)**
```bash
# Register user with existing domain
curl -X POST http://localhost:3001/api/auth/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyDomain": "testcorp.com",
    "firstName": "Regular",
    "lastName": "User",
    "email": "user@testcorp.com",
    "password": "password123"
  }'
```

### **Step 3: Register User with Non-Existent Domain (Should Fail)**
```bash
# Try to register with non-existent domain
curl -X POST http://localhost:3001/api/auth/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyDomain": "fake.com",
    "firstName": "Fake",
    "lastName": "User",
    "email": "fake@fake.com",
    "password": "password123"
  }'
```

## 📋 Validation Rules

### **Domain-Based Registration Requirements:**
1. ✅ **Company must exist** in database
2. ✅ **Email must be unique** across all users
3. ✅ **Domain validation** prevents unauthorized registrations
4. ✅ **Approval workflow** for all domain-based registrations
5. ✅ **Company-scoped** approval requests

### **Security Features:**
- 🔒 **No authentication required** for domain-based registration
- 🔒 **Domain validation** prevents unauthorized company access
- 🔒 **Approval workflow** ensures company control
- 🔒 **Company-scoped** requests prevent cross-company access

## 🎯 Business Logic

### **Registration Flow:**
1. **Super Admin** creates company → Immediate access
2. **Users/Admins** register with domain → Pending approval
3. **Company Admins** approve their company's requests
4. **Domain validation** ensures only registered companies can have users

### **Approval Workflow:**
- Users register → Pending approval → Admin approves → Access granted
- Admins register → Pending approval → Super Admin approves → Access granted
- All requests are company-scoped (admins only see their company's requests)
