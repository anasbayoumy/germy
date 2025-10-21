# 🚀 Complete Auth Service Test Guide

## 📋 Overview

This guide provides step-by-step instructions for testing the **domain-based registration system** with automated Postman collections.

## 🎯 What We're Testing

### **Domain-Based Registration Flow:**
1. **Company Super Admin** registers first → Creates company in database
2. **Users/Admins** register with domain → Must use existing company domain
3. **Domain validation** ensures only registered companies can have users
4. **Approval workflow** for all domain-based registrations
5. **Company-scoped** approval requests

## 🛠️ Prerequisites

### **1. Start All Services**
```bash
cd backend
docker-compose up --build -d
```

### **2. Verify Services Are Running**
```bash
docker-compose ps
```

**Expected Output:**
```
NAME                           STATUS
backend-auth-service-1         Up
backend-user-service-1         Up
backend-attendance-service-1   Up
backend-ai-service-1           Up
backend-platform-service-1     Up
backend-db-1                   Up
```

## 📥 Step 1: Import Postman Collection

### **1.1 Import Collection**
1. Open **Postman**
2. Click **Import**
3. Select `Auth_Service_Updated_Collection.postman_collection.json`
4. Click **Import**

### **1.2 Import Environment**
1. Click **Import** again
2. Select `Auth_Service_Environment.postman_environment.json`
3. Click **Import**

### **1.3 Set Environment Variables**
1. Click **Environments** tab
2. Select **Auth Service Environment**
3. Verify variables:
   - `baseUrl`: `http://localhost:3001`
   - `testCompanyDomain`: `testcorp.com`

## 🧪 Step 2: Run Automated Tests

### **2.1 Run Complete Workflow**
1. In Postman, select **Auth Service - Updated API Collection**
2. Click **Run** button (▶️)
3. Select **"Run Complete Workflow"** folder
4. Click **Run Auth Service Tests**

### **2.2 Manual Step-by-Step Testing**

#### **Step 2.2.1: Company Setup**
```bash
# 1. Create Platform Admin (if not exists)
POST /api/auth/register
{
  "firstName": "Platform",
  "lastName": "Admin", 
  "email": "admin@platform.com",
  "password": "platform123"
}

# 2. Create Test Company
POST /api/auth/super_admin/register
{
  "companyName": "Test Corporation",
  "companyDomain": "testcorp.com",
  "firstName": "Super",
  "lastName": "Admin",
  "email": "super@testcorp.com",
  "password": "password123",
  "industry": "Technology",
  "companySize": "50-200"
}
```

#### **Step 2.2.2: Domain-Based Registration**
```bash
# 3. Register User (Domain-Based)
POST /api/auth/user/register
{
  "companyDomain": "testcorp.com",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@testcorp.com",
  "password": "password123",
  "position": "Developer",
  "department": "Engineering"
}

# 4. Register Admin (Domain-Based)
POST /api/auth/admin/register
{
  "companyDomain": "testcorp.com",
  "firstName": "Jane",
  "lastName": "Manager",
  "email": "jane@testcorp.com",
  "password": "password123",
  "position": "Team Lead",
  "department": "Engineering"
}
```

#### **Step 2.2.3: Test Error Cases**
```bash
# 5. Test Non-Existent Domain (Should Fail)
POST /api/auth/user/register
{
  "companyDomain": "nonexistent.com",
  "firstName": "Test",
  "lastName": "User",
  "email": "test@nonexistent.com",
  "password": "password123"
}

# Expected Response:
{
  "success": false,
  "message": "Company not found with this domain"
}
```

#### **Step 2.2.4: Approval Workflow**
```bash
# 6. Get Pending Approvals
GET /api/approvals/pending
Authorization: Bearer <super_admin_token>

# 7. Approve User
POST /api/approvals/requests/{userId}/approve
Authorization: Bearer <super_admin_token>
{
  "notes": "Approved for testing"
}
```

#### **Step 2.2.5: Login Tests**
```bash
# 8. Login Super Admin
POST /api/auth/super_admin/login
{
  "email": "super@testcorp.com",
  "password": "password123"
}

# 9. Login User (After Approval)
POST /api/auth/user/login
{
  "email": "john@testcorp.com",
  "password": "password123"
}
```

## 🔍 Step 3: Verify Results

### **3.1 Check Database**
```sql
-- Check companies table
SELECT * FROM companies WHERE domain = 'testcorp.com';

-- Check users table
SELECT email, role, approval_status FROM users WHERE company_id = (
  SELECT id FROM companies WHERE domain = 'testcorp.com'
);

-- Check approval requests
SELECT * FROM user_approval_requests WHERE company_id = (
  SELECT id FROM companies WHERE domain = 'testcorp.com'
);
```

### **3.2 Expected Results**

#### **Companies Table:**
```sql
id | name              | domain      | created_at
---|-------------------|-------------|------------
xxx| Test Corporation  | testcorp.com| 2024-01-01
```

#### **Users Table:**
```sql
email                | role                | approval_status
---------------------|---------------------|----------------
super@testcorp.com   | company_super_admin | approved
john@testcorp.com    | user               | approved
jane@testcorp.com    | company_admin      | pending
```

#### **Approval Requests Table:**
```sql
user_id | requested_role | status  | request_type
--------|----------------|---------|-------------
xxx     | user          | approved| new_signup
yyy     | company_admin | pending | new_signup
```

## 🚨 Troubleshooting

### **Common Issues:**

#### **1. "Company not found with this domain"**
- **Cause**: Company doesn't exist in database
- **Solution**: Run super admin registration first

#### **2. "User with this email already exists"**
- **Cause**: Email already registered
- **Solution**: Use different email or check existing users

#### **3. "Connection refused"**
- **Cause**: Services not running
- **Solution**: `docker-compose up --build -d`

#### **4. "Invalid token"**
- **Cause**: Token expired or invalid
- **Solution**: Re-login to get fresh token

### **Debug Commands:**
```bash
# Check service logs
docker logs backend-auth-service-1

# Check database connection
docker exec -it backend-db-1 psql -U postgres -d germy

# Restart services
docker-compose restart auth-service
```

## 📊 Test Results Summary

### **✅ Success Criteria:**
1. **Company Creation**: Super admin can create company
2. **Domain Validation**: Non-existent domains are rejected
3. **User Registration**: Users can register with valid domain
4. **Approval Workflow**: Pending approvals are created
5. **Login**: Approved users can login
6. **Company Scoping**: Admins only see their company's requests

### **📈 Performance Metrics:**
- **Registration Time**: < 2 seconds
- **Domain Validation**: < 500ms
- **Approval Process**: < 1 second
- **Login Time**: < 1 second

## 🎯 Business Logic Verification

### **Domain-Based Security:**
- ✅ Only registered companies can have users
- ✅ Domain validation prevents unauthorized access
- ✅ Company-scoped approval requests
- ✅ No authentication required for registration

### **Approval Workflow:**
- ✅ Users require approval before access
- ✅ Admins can approve their company's users
- ✅ Super admins can approve admins
- ✅ Platform admins can approve all

## 🚀 Next Steps

### **Production Deployment:**
1. **Environment Variables**: Set production values
2. **Database**: Use production PostgreSQL
3. **Security**: Enable rate limiting
4. **Monitoring**: Set up logging and alerts

### **Additional Testing:**
1. **Load Testing**: Test with multiple concurrent registrations
2. **Security Testing**: Test for SQL injection, XSS
3. **Integration Testing**: Test with other services
4. **End-to-End Testing**: Test complete user journey

## 📞 Support

### **If Tests Fail:**
1. Check service logs: `docker logs backend-auth-service-1`
2. Verify database connection
3. Check environment variables
4. Restart services: `docker-compose restart`

### **Common Solutions:**
- **Port conflicts**: Change ports in docker-compose.yaml
- **Database issues**: Reset database volume
- **Token issues**: Clear browser cache and re-login
- **Network issues**: Check firewall settings

---

## 🎉 Congratulations!

You've successfully tested the **domain-based registration system**! The implementation ensures:

- **Company-first registration** model
- **Domain validation** security
- **Approval workflow** for all users
- **Company-scoped** access control
- **No authentication required** for public registration

This system is perfect for **SaaS platforms** where companies must be registered first before their employees can join!
