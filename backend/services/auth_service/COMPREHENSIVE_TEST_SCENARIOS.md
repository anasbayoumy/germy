# 🧪 **Comprehensive Test Scenarios - Auth Service**

## 📋 **Overview**

This document provides comprehensive test scenarios for all backend endpoints in the Auth Service. Each scenario includes test cases, expected results, and edge cases to ensure complete coverage.

## 🏗️ **Test Architecture**

### **Test Categories**
1. **Authentication Endpoints** - Login/Logout functionality
2. **Registration Endpoints** - User registration with role-based access
3. **Password Management** - Forgot/Reset password functionality
4. **Token Management** - JWT token verification and refresh
5. **Platform Management** - Company and subscription management
6. **Security & Middleware** - Authentication and authorization
7. **Error Handling** - Validation and error responses

---

## 🔐 **Authentication Endpoints**

### **1. Platform Admin Login** - `POST /api/auth/platform/login`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| PA-LOGIN-001 | Valid platform admin login | `{email: "admin@platform.com", password: "ValidPass123"}` | Success with platform admin token | 200 |
| PA-LOGIN-002 | Invalid email | `{email: "invalid@email.com", password: "ValidPass123"}` | "Invalid credentials" | 401 |
| PA-LOGIN-003 | Invalid password | `{email: "admin@platform.com", password: "WrongPass123"}` | "Invalid credentials" | 401 |
| PA-LOGIN-004 | Missing email | `{password: "ValidPass123"}` | Validation error | 400 |
| PA-LOGIN-005 | Missing password | `{email: "admin@platform.com"}` | Validation error | 400 |
| PA-LOGIN-006 | Empty request body | `{}` | Validation error | 400 |
| PA-LOGIN-007 | Invalid email format | `{email: "invalid-email", password: "ValidPass123"}` | Validation error | 400 |
| PA-LOGIN-008 | Inactive platform admin | `{email: "inactive@platform.com", password: "ValidPass123"}` | "Account is deactivated" | 401 |

#### **Edge Cases:**
- SQL injection attempts in email field
- XSS attempts in password field
- Very long email/password strings
- Special characters in credentials
- Unicode characters in credentials

### **2. Company Super Admin Login** - `POST /api/auth/super_admin/login`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| CSA-LOGIN-001 | Valid super admin login | `{email: "ceo@company.com", password: "ValidPass123"}` | Success with super admin token | 200 |
| CSA-LOGIN-002 | Wrong role login | `{email: "admin@company.com", password: "ValidPass123"}` | "Invalid credentials or insufficient permissions" | 401 |
| CSA-LOGIN-003 | Inactive company | `{email: "ceo@inactive.com", password: "ValidPass123"}` | "Company account is deactivated" | 401 |
| CSA-LOGIN-004 | Inactive user | `{email: "inactive@company.com", password: "ValidPass123"}` | "Account is deactivated" | 401 |

### **3. Company Admin Login** - `POST /api/auth/admin/login`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| CA-LOGIN-001 | Valid admin login | `{email: "admin@company.com", password: "ValidPass123"}` | Success with admin token | 200 |
| CA-LOGIN-002 | Employee trying admin login | `{email: "employee@company.com", password: "ValidPass123"}` | "Invalid credentials or insufficient permissions" | 401 |

### **4. Employee Login** - `POST /api/auth/user/login`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| EMP-LOGIN-001 | Valid employee login | `{email: "employee@company.com", password: "ValidPass123"}` | Success with employee token | 200 |
| EMP-LOGIN-002 | Admin trying employee login | `{email: "admin@company.com", password: "ValidPass123"}` | "Invalid credentials or insufficient permissions" | 401 |

### **5. Legacy Login** - `POST /api/auth/login`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| LEG-LOGIN-001 | Valid any role login | `{email: "user@company.com", password: "ValidPass123"}` | Success with appropriate token | 200 |

---

## 📝 **Registration Endpoints**

### **1. Platform Admin Registration** - `POST /api/auth/platform/register`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| PA-REG-001 | Valid platform admin registration | `{firstName: "John", lastName: "Doe", email: "newadmin@platform.com", password: "ValidPass123"}` | Success, admin created | 201 |
| PA-REG-002 | Duplicate email | `{firstName: "Jane", lastName: "Doe", email: "existing@platform.com", password: "ValidPass123"}` | "Platform admin with this email already exists" | 400 |
| PA-REG-003 | Missing authentication | No token | "Access token required" | 401 |
| PA-REG-004 | Wrong role authentication | Company admin token | "Insufficient permissions" | 403 |
| PA-REG-005 | Invalid email format | `{email: "invalid-email", ...}` | Validation error | 400 |
| PA-REG-006 | Weak password | `{password: "123", ...}` | Validation error | 400 |
| PA-REG-007 | Missing required fields | `{email: "test@test.com"}` | Validation error | 400 |

### **2. Company Super Admin Registration** - `POST /api/auth/super_admin/register`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| CSA-REG-001 | Valid company registration | `{companyName: "New Corp", companyDomain: "newcorp.com", firstName: "John", lastName: "Doe", email: "ceo@newcorp.com", password: "ValidPass123"}` | Success, company and super admin created | 201 |
| CSA-REG-002 | Duplicate company domain | `{companyDomain: "existing.com", ...}` | "Company domain already exists" | 400 |
| CSA-REG-003 | Duplicate user email | `{email: "existing@email.com", ...}` | "User with this email already exists" | 400 |
| CSA-REG-004 | Missing company name | `{companyDomain: "test.com", ...}` | Validation error | 400 |
| CSA-REG-005 | Missing company domain | `{companyName: "Test Corp", ...}` | Validation error | 400 |

### **3. Company Admin Registration** - `POST /api/auth/admin/register`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| CA-REG-001 | Valid admin registration | `{firstName: "Jane", lastName: "Smith", email: "admin@company.com", password: "ValidPass123"}` | Success, admin created | 201 |
| CA-REG-002 | Missing super admin token | No token | "Access token required" | 401 |
| CA-REG-003 | Wrong role token | Employee token | "Insufficient permissions" | 403 |
| CA-REG-004 | Duplicate email | `{email: "existing@company.com", ...}` | "User with this email already exists" | 400 |

### **4. Employee Registration** - `POST /api/auth/user/register`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| EMP-REG-001 | Valid employee registration | `{firstName: "Bob", lastName: "Johnson", email: "employee@company.com", password: "ValidPass123"}` | Success, employee created | 201 |
| EMP-REG-002 | Missing admin token | No token | "Access token required" | 401 |
| EMP-REG-003 | Wrong role token | Employee token | "Insufficient permissions" | 403 |
| EMP-REG-004 | Duplicate email | `{email: "existing@company.com", ...}` | "User with this email already exists" | 400 |

---

## 🔑 **Password Management**

### **1. Forgot Password** - `POST /api/auth/forgot-password`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| FP-001 | Valid email | `{email: "user@company.com"}` | Success message (regardless of email existence) | 200 |
| FP-002 | Invalid email format | `{email: "invalid-email"}` | Validation error | 400 |
| FP-003 | Missing email | `{}` | Validation error | 400 |
| FP-004 | Non-existent email | `{email: "nonexistent@email.com"}` | Success message (security) | 200 |

### **2. Reset Password** - `POST /api/auth/reset-password`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| RP-001 | Valid reset token | `{token: "valid-token", password: "NewPass123"}` | Success | 200 |
| RP-002 | Invalid token | `{token: "invalid-token", password: "NewPass123"}` | "Invalid or expired reset token" | 400 |
| RP-003 | Expired token | `{token: "expired-token", password: "NewPass123"}` | "Invalid or expired reset token" | 400 |
| RP-004 | Missing token | `{password: "NewPass123"}` | Validation error | 400 |
| RP-005 | Missing password | `{token: "valid-token"}` | Validation error | 400 |
| RP-006 | Weak password | `{token: "valid-token", password: "123"}` | Validation error | 400 |

---

## 🎫 **Token Management**

### **1. Token Verification** - `POST /api/auth/verify-token`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| TV-001 | Valid token | `{token: "valid-jwt-token"}` | Success with payload | 200 |
| TV-002 | Invalid token | `{token: "invalid-token"}` | Success: false | 200 |
| TV-003 | Expired token | `{token: "expired-jwt-token"}` | Success: false | 200 |
| TV-004 | Missing token | `{}` | Validation error | 400 |
| TV-005 | Malformed token | `{token: "malformed.token"}` | Success: false | 200 |

### **2. Token Refresh** - `POST /api/auth/refresh`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| TR-001 | Valid token refresh | Valid JWT token in header | New token generated | 200 |
| TR-002 | Missing token | No Authorization header | "Access token required" | 401 |
| TR-003 | Invalid token | Invalid JWT token | "Invalid or expired token" | 403 |
| TR-004 | Expired token | Expired JWT token | "Invalid or expired token" | 403 |

### **3. Get Current User** - `GET /api/auth/me`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| CU-001 | Valid user request | Valid JWT token | User details returned | 200 |
| CU-002 | Missing token | No Authorization header | "Access token required" | 401 |
| CU-003 | Invalid token | Invalid JWT token | "Invalid or expired token" | 403 |
| CU-004 | Non-existent user | Valid token for deleted user | "User not found" | 404 |

### **4. Logout** - `POST /api/auth/logout`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| LO-001 | Valid logout | Valid JWT token | Success message | 200 |
| LO-002 | Missing token | No Authorization header | "Access token required" | 401 |
| LO-003 | Invalid token | Invalid JWT token | "Invalid or expired token" | 403 |

---

## 🏢 **Platform Management**

### **1. Get Companies** - `GET /api/platform/companies`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| PC-001 | Valid request | Valid platform admin token | Companies list with pagination | 200 |
| PC-002 | With search | `?search=tech` | Filtered companies | 200 |
| PC-003 | With pagination | `?page=2&limit=5` | Paginated results | 200 |
| PC-004 | Missing token | No Authorization header | "Access token required" | 401 |
| PC-005 | Wrong role | Company admin token | "Insufficient permissions" | 403 |
| PC-006 | Invalid pagination | `?page=0&limit=0` | Default pagination applied | 200 |

### **2. Create Company** - `POST /api/platform/companies`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| CC-001 | Valid company creation | `{name: "New Corp", domain: "newcorp.com"}` | Company created | 201 |
| CC-002 | Duplicate domain | `{domain: "existing.com"}` | "Company domain already exists" | 400 |
| CC-003 | Missing required fields | `{name: "Test Corp"}` | Validation error | 400 |
| CC-004 | Wrong role | Company admin token | "Insufficient permissions" | 403 |

### **3. Update Company** - `PUT /api/platform/companies/:id`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| UC-001 | Valid update | `{name: "Updated Corp"}` | Company updated | 200 |
| UC-002 | Non-existent company | Invalid company ID | "Company not found" | 400 |
| UC-003 | Missing token | No Authorization header | "Access token required" | 401 |
| UC-004 | Wrong role | Company admin token | "Insufficient permissions" | 403 |

### **4. Get Subscriptions** - `GET /api/platform/subscriptions`

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| PS-001 | Valid request | Valid platform admin token | Subscriptions list | 200 |
| PS-002 | With status filter | `?status=active` | Filtered subscriptions | 200 |
| PS-003 | With pagination | `?page=1&limit=10` | Paginated results | 200 |
| PS-004 | Missing token | No Authorization header | "Access token required" | 401 |
| PS-005 | Wrong role | Company admin token | "Insufficient permissions" | 403 |

---

## 🛡️ **Security & Middleware Tests**

### **1. Authentication Middleware**

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| AUTH-001 | Valid Bearer token | `Authorization: Bearer valid-token` | Request proceeds | 200 |
| AUTH-002 | Missing Authorization header | No header | "Access token required" | 401 |
| AUTH-003 | Invalid token format | `Authorization: InvalidFormat` | "Invalid or expired token" | 403 |
| AUTH-004 | Expired token | `Authorization: Bearer expired-token` | "Invalid or expired token" | 403 |
| AUTH-005 | Malformed JWT | `Authorization: Bearer malformed.jwt` | "Invalid or expired token" | 403 |

### **2. Role-Based Authorization**

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| RBAC-001 | Platform admin access | Platform admin token | Access granted | 200 |
| RBAC-002 | Company admin access | Company admin token | Access granted | 200 |
| RBAC-003 | Employee access | Employee token | Access granted | 200 |
| RBAC-004 | Wrong role access | Employee token for admin endpoint | "Insufficient permissions" | 403 |
| RBAC-005 | No token | No Authorization header | "Access token required" | 401 |

### **3. Rate Limiting**

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| RL-001 | Normal request rate | Single request | Request processed | 200 |
| RL-002 | High request rate | 100+ requests in 15 minutes | "Too many requests" | 429 |
| RL-003 | Rate limit reset | Wait 15 minutes | Request processed | 200 |

### **4. CORS Headers**

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| CORS-001 | Valid origin | Origin: `http://localhost:5173` | CORS headers present | 200 |
| CORS-002 | Invalid origin | Origin: `http://malicious.com` | CORS headers absent | 200 |
| CORS-003 | No origin | No Origin header | Request processed | 200 |

---

## ⚠️ **Error Handling Tests**

### **1. Validation Errors**

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| VAL-001 | Invalid email format | `{email: "invalid"}` | Validation error with field details | 400 |
| VAL-002 | Password too short | `{password: "123"}` | Validation error with field details | 400 |
| VAL-003 | Missing required field | `{email: "test@test.com"}` | Validation error with field details | 400 |
| VAL-004 | Invalid data type | `{age: "not-a-number"}` | Validation error with field details | 400 |

### **2. Database Errors**

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| DB-001 | Connection timeout | Database unavailable | "Internal server error" | 500 |
| DB-002 | Constraint violation | Duplicate unique field | Appropriate error message | 400 |
| DB-003 | Transaction rollback | Invalid data in transaction | "Internal server error" | 500 |

### **3. Server Errors**

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| SRV-001 | Unhandled exception | Unexpected error | "Internal server error" | 500 |
| SRV-002 | Memory limit exceeded | Large request payload | "Internal server error" | 500 |
| SRV-003 | Service unavailable | External service down | "Internal server error" | 500 |

---

## 🔍 **Edge Cases & Security Tests**

### **1. SQL Injection Tests**

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| SQL-001 | Email field injection | `{email: "admin@test.com'; DROP TABLE users; --"}` | Request rejected/escaped | 400/200 |
| SQL-002 | Password field injection | `{password: "'; SELECT * FROM users; --"}` | Request rejected/escaped | 400/200 |

### **2. XSS Tests**

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| XSS-001 | Script in email | `{email: "<script>alert('xss')</script>@test.com"}` | Request rejected/escaped | 400/200 |
| XSS-002 | Script in name | `{firstName: "<script>alert('xss')</script>"}` | Request rejected/escaped | 400/200 |

### **3. Input Length Tests**

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| LEN-001 | Very long email | `{email: "a".repeat(1000) + "@test.com"}` | Request rejected | 400 |
| LEN-002 | Very long password | `{password: "a".repeat(10000)}` | Request rejected | 400 |
| LEN-003 | Very long name | `{firstName: "a".repeat(1000)}` | Request rejected | 400 |

### **4. Unicode & Special Characters**

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| UNI-001 | Unicode email | `{email: "测试@测试.com"}` | Request processed | 200 |
| UNI-002 | Emoji in name | `{firstName: "John 😀"}` | Request processed | 200 |
| UNI-003 | Special characters | `{password: "P@ssw0rd!#$%"}` | Request processed | 200 |

---

## 📊 **Performance Tests**

### **1. Load Testing**

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| PERF-001 | 100 concurrent logins | 100 simultaneous login requests | All processed within 5 seconds | 200 |
| PERF-002 | 1000 concurrent registrations | 1000 simultaneous registration requests | All processed within 30 seconds | 201 |
| PERF-003 | Large dataset query | Query with 10,000 companies | Response within 10 seconds | 200 |

### **2. Memory Usage**

#### **Test Cases:**

| Test ID | Description | Input | Expected Result | Status Code |
|---------|-------------|-------|-----------------|-------------|
| MEM-001 | Large request payload | 10MB JSON payload | Request rejected or processed | 400/200 |
| MEM-002 | Memory leak test | 1000 requests with large responses | Memory usage stable | 200 |

---

## 🧪 **Integration Tests**

### **1. End-to-End Workflows**

#### **Test Cases:**

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| E2E-001 | Complete registration flow | 1. Register company 2. Login as super admin 3. Create admin 4. Login as admin 5. Create employee | All steps successful |
| E2E-002 | Password reset flow | 1. Request password reset 2. Use reset token 3. Login with new password | Password successfully reset |
| E2E-003 | Platform admin workflow | 1. Login as platform admin 2. View companies 3. Create company 4. View subscriptions | All operations successful |

### **2. Cross-Service Integration**

#### **Test Cases:**

| Test ID | Description | Input | Expected Result |
|---------|-------------|-------|-----------------|
| INT-001 | User service integration | Valid user data | User created in both services |
| INT-002 | Database consistency | Transaction across tables | Data consistent across all tables |
| INT-003 | External service calls | API calls to external services | Proper error handling and fallbacks |

---

## 📈 **Test Execution Plan**

### **Phase 1: Unit Tests**
- Individual endpoint testing
- Validation testing
- Error handling testing

### **Phase 2: Integration Tests**
- Cross-endpoint workflows
- Database integration
- Service integration

### **Phase 3: Security Tests**
- Authentication/Authorization
- Input validation
- Security vulnerabilities

### **Phase 4: Performance Tests**
- Load testing
- Stress testing
- Memory usage testing

### **Phase 5: End-to-End Tests**
- Complete user workflows
- Cross-service integration
- Real-world scenarios

---

## 🎯 **Success Criteria**

### **Test Coverage Requirements**
- **Unit Tests**: 95% code coverage
- **Integration Tests**: 90% endpoint coverage
- **Security Tests**: 100% security scenario coverage
- **Performance Tests**: All performance benchmarks met

### **Quality Gates**
- All critical tests must pass
- No high-severity security vulnerabilities
- Performance benchmarks met
- Error handling comprehensive

---

## 📝 **Test Data Management**

### **Test Database Setup**
```sql
-- Clean test database
TRUNCATE TABLE audit_logs, notifications, company_subscriptions, users, companies, platform_admins RESTART IDENTITY CASCADE;

-- Insert test platform admin
INSERT INTO platform_admins (email, password_hash, first_name, last_name, role, is_active) 
VALUES ('admin@platform.com', '$2b$14$hashedpassword', 'Platform', 'Admin', 'platform_super_admin', true);

-- Insert test company
INSERT INTO companies (name, domain, industry, company_size, is_active) 
VALUES ('Test Company', 'test.com', 'Technology', '10-50', true);

-- Insert test users
INSERT INTO users (company_id, email, password_hash, first_name, last_name, role, is_active, is_verified) 
VALUES 
  ('company-id', 'ceo@test.com', '$2b$14$hashedpassword', 'CEO', 'Test', 'company_super_admin', true, true),
  ('company-id', 'admin@test.com', '$2b$14$hashedpassword', 'Admin', 'Test', 'company_admin', true, true),
  ('company-id', 'employee@test.com', '$2b$14$hashedpassword', 'Employee', 'Test', 'employee', true, true);
```

### **Test Environment Variables**
```env
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/attendance_test
JWT_SECRET=test-jwt-secret-key-that-is-at-least-32-characters-long-for-testing
JWT_EXPIRES_IN=1h
FRONTEND_URL=http://localhost:5173
BCRYPT_ROUNDS=4
```

---

## 🚀 **Running Tests**

### **Individual Test Categories**
```bash
# Unit tests
npm run test:unit

# API tests
npm run test:api

# Security tests
npm run test:security

# Performance tests
npm run test:performance

# All tests
npm run test:all
```

### **Test Reports**
- Coverage reports generated in `coverage/` directory
- Test results in JUnit format for CI/CD
- Performance benchmarks in `performance/` directory

---

## 📋 **Test Checklist**

### **Pre-Test Setup**
- [ ] Test database created and seeded
- [ ] Test environment variables configured
- [ ] Test data prepared
- [ ] Dependencies installed

### **Test Execution**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All security tests pass
- [ ] All performance tests pass
- [ ] All end-to-end tests pass

### **Post-Test Cleanup**
- [ ] Test database cleaned
- [ ] Test files removed
- [ ] Test reports generated
- [ ] Results documented

---

## 🔧 **Troubleshooting**

### **Common Issues**
1. **Database Connection**: Ensure PostgreSQL is running and accessible
2. **Port Conflicts**: Check if port 3001 is available
3. **Environment Variables**: Verify all required variables are set
4. **Dependencies**: Ensure all npm packages are installed
5. **Test Data**: Verify test data is properly seeded

### **Debug Commands**
```bash
# Check database connection
npm run db:test

# Run tests with verbose output
npm run test:verbose

# Run specific test file
npm test -- --testPathPattern=auth-endpoints.test.ts

# Debug mode
npm run test:debug
```

---

This comprehensive test scenario document provides complete coverage for all backend endpoints and functionality. Each test case includes specific inputs, expected outputs, and edge cases to ensure robust testing of the Auth Service.

