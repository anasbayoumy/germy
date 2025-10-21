# 🧪 Auth Service - Comprehensive Test Scenarios

## 📋 Overview
This document provides step-by-step instructions for testing all Auth Service endpoints using the Postman collection.

## 🚀 Quick Start Guide

### Step 1: Import Collection and Environment
1. **Import Collection**: Import `Auth_Service_Complete_Collection.postman_collection.json`
2. **Import Environment**: Import `Auth_Service_Environment.postman_environment.json`
3. **Select Environment**: Choose "Auth Service Environment" in Postman

### Step 2: Start Services
```bash
cd backend
docker-compose up -d
```

### Step 3: Run Test Scenarios

## 🔐 Authentication Test Scenarios

### Scenario 1: Platform Admin Authentication
**Purpose**: Test platform admin login and token generation

**Steps**:
1. Run `Platform Admin Login` request
2. Verify response contains valid token
3. Check that `platformToken` variable is set
4. Verify token contains platform admin role

**Expected Results**:
- ✅ Status: 200 OK
- ✅ Response contains `success: true`
- ✅ Token is generated and saved to environment
- ✅ User role is `platform_admin`

### Scenario 2: Company Super Admin Authentication
**Purpose**: Test company super admin login

**Steps**:
1. Run `Company Super Admin Login` request
2. Verify token generation
3. Check company ID is captured

**Expected Results**:
- ✅ Status: 200 OK
- ✅ Token saved to `superAdminToken` variable
- ✅ Company ID saved to `testCompanyId` variable

### Scenario 3: Multi-Role Authentication
**Purpose**: Test authentication for all user roles

**Steps**:
1. Run all login requests in sequence
2. Verify each token is unique
3. Check role-based access

**Expected Results**:
- ✅ All tokens generated successfully
- ✅ Each token has correct role
- ✅ Environment variables populated

## 👤 User Registration Test Scenarios

### Scenario 4: Company Registration Flow
**Purpose**: Test complete company registration process

**Steps**:
1. Run `Register Company (Super Admin)` request
2. Verify company creation
3. Check super admin user creation
4. Test login with new credentials

**Expected Results**:
- ✅ Company created successfully
- ✅ Super admin user created
- ✅ User can login with new credentials
- ✅ Company ID returned

### Scenario 5: Admin Registration by Super Admin
**Purpose**: Test admin creation by super admin

**Steps**:
1. Ensure super admin is logged in
2. Run `Register Admin (by Super Admin)` request
3. Verify admin user creation
4. Test admin login

**Expected Results**:
- ✅ Admin user created with `company_admin` role
- ✅ Admin can login successfully
- ✅ Proper permissions assigned

### Scenario 6: User Registration by Admin
**Purpose**: Test user creation by admin

**Steps**:
1. Ensure admin is logged in
2. Run `Register User (by Admin)` request
3. Verify user creation
4. Test user login

**Expected Results**:
- ✅ User created with `user` role
- ✅ User can login successfully
- ✅ Mobile app access granted

### Scenario 7: Domain-Based Registration
**Purpose**: Test domain-based user and admin registration

**Steps**:
1. Run `Register User with Domain` request
2. Run `Register Admin with Domain` request
3. Verify approval requests are created
4. Check domain validation

**Expected Results**:
- ✅ Users created with pending approval
- ✅ Approval requests generated
- ✅ Domain validation working
- ✅ Email validation for work addresses

## 🔑 Password Management Test Scenarios

### Scenario 8: Password Reset Flow
**Purpose**: Test complete password reset process

**Steps**:
1. Run `Request Password Reset` request
2. Check email notification (if configured)
3. Use reset token in `Reset Password` request
4. Test login with new password

**Expected Results**:
- ✅ Reset request processed
- ✅ Reset token generated
- ✅ Password successfully changed
- ✅ Login works with new password

### Scenario 9: Password Change
**Purpose**: Test authenticated password change

**Steps**:
1. Login as any user
2. Run `Change Password` request
3. Test login with new password
4. Verify old password no longer works

**Expected Results**:
- ✅ Password changed successfully
- ✅ New password works for login
- ✅ Old password rejected

## 👥 User Management Test Scenarios

### Scenario 10: Profile Management
**Purpose**: Test user profile operations

**Steps**:
1. Login as user
2. Run `Get User Profile` request
3. Run `Update User Profile` request
4. Verify profile changes

**Expected Results**:
- ✅ Profile retrieved successfully
- ✅ Profile updated correctly
- ✅ Changes reflected in database

### Scenario 11: User Activation/Deactivation
**Purpose**: Test user account management

**Steps**:
1. Login as admin
2. Run `Deactivate User` request
3. Verify user cannot login
4. Run `Reactivate User` request
5. Verify user can login again

**Expected Results**:
- ✅ User deactivated successfully
- ✅ Deactivated user cannot login
- ✅ User reactivated successfully
- ✅ Reactivated user can login

## 🏢 Platform Management Test Scenarios

### Scenario 12: Platform Administration
**Purpose**: Test platform-level operations

**Steps**:
1. Login as platform admin
2. Run `Get Platform Status` request
3. Run `Get All Companies` request
4. Run `Get Company Details` request
5. Run `Update Company Settings` request

**Expected Results**:
- ✅ Platform status retrieved
- ✅ All companies listed
- ✅ Company details accessible
- ✅ Settings updated successfully

### Scenario 13: Company Management
**Purpose**: Test company-level operations

**Steps**:
1. Run `Get Company Subscriptions` request
2. Run `Get Audit Logs` request
3. Verify data integrity

**Expected Results**:
- ✅ Subscriptions retrieved
- ✅ Audit logs accessible
- ✅ Data properly formatted

## ✅ Approval Management Test Scenarios

### Scenario 14: Approval Workflow
**Purpose**: Test complete approval process

**Steps**:
1. Create users with domain registration
2. Run `Get All Approval Requests` request
3. Run `Get Pending Approvals` request
4. Run `Search Approval Requests` request
5. Run `Approve User Request` request
6. Run `Get Approval History` request

**Expected Results**:
- ✅ Approval requests listed
- ✅ Pending requests filtered
- ✅ Search functionality working
- ✅ Approval processed successfully
- ✅ History tracked

### Scenario 15: Approval Rejection
**Purpose**: Test approval rejection process

**Steps**:
1. Create pending approval request
2. Run `Reject User Request` request
3. Verify user status
4. Check rejection reason

**Expected Results**:
- ✅ Request rejected successfully
- ✅ User status updated
- ✅ Rejection reason recorded

## 📸 Face Encoding Test Scenarios

### Scenario 16: Face Encoding Management
**Purpose**: Test facial recognition features

**Steps**:
1. Login as user
2. Run `Create Face Encoding` request (with photo file)
3. Run `Get Face Encoding Status` request
4. Run `Update Face Encoding` request
5. Run `Delete Face Encoding` request

**Expected Results**:
- ✅ Face encoding created
- ✅ Status retrieved correctly
- ✅ Encoding updated successfully
- ✅ Encoding deleted

**Note**: Requires actual photo files for testing

## 🔒 Token Management Test Scenarios

### Scenario 17: Token Operations
**Purpose**: Test token management features

**Steps**:
1. Run `Verify Token` request
2. Run `Get Token Info` request
3. Run `Refresh Token` request
4. Run `Logout` request

**Expected Results**:
- ✅ Token verified successfully
- ✅ Token info retrieved
- ✅ Token refreshed
- ✅ Logout successful

## 🏥 Health & Status Test Scenarios

### Scenario 18: Service Health
**Purpose**: Test service health and status

**Steps**:
1. Run `Health Check` request
2. Run `Service Status` request
3. Verify service metrics

**Expected Results**:
- ✅ Health check passes
- ✅ Service status active
- ✅ Metrics available

## 🚨 Error Handling Test Scenarios

### Scenario 19: Authentication Errors
**Purpose**: Test authentication error handling

**Steps**:
1. Try login with invalid credentials
2. Try accessing protected endpoints without token
3. Try using expired token
4. Try accessing with wrong role

**Expected Results**:
- ✅ Invalid credentials rejected
- ✅ Unauthorized access blocked
- ✅ Expired tokens rejected
- ✅ Role-based access enforced

### Scenario 20: Validation Errors
**Purpose**: Test input validation

**Steps**:
1. Try registration with invalid email
2. Try registration with weak password
3. Try registration with missing fields
4. Try registration with invalid domain

**Expected Results**:
- ✅ Invalid inputs rejected
- ✅ Proper error messages
- ✅ Validation rules enforced

## 📊 Performance Test Scenarios

### Scenario 21: Load Testing
**Purpose**: Test service performance

**Steps**:
1. Run multiple concurrent login requests
2. Run multiple concurrent registration requests
3. Monitor response times
4. Check for rate limiting

**Expected Results**:
- ✅ Concurrent requests handled
- ✅ Response times acceptable
- ✅ Rate limiting working
- ✅ No service degradation

## 🔧 Maintenance Test Scenarios

### Scenario 22: Database Operations
**Purpose**: Test database integrity

**Steps**:
1. Create multiple users
2. Update user information
3. Delete test data
4. Verify data consistency

**Expected Results**:
- ✅ Data created correctly
- ✅ Updates persisted
- ✅ Deletions successful
- ✅ Data integrity maintained

## 📝 Test Reporting

### Success Criteria
- ✅ All endpoints respond correctly
- ✅ Authentication works for all roles
- ✅ Authorization enforced properly
- ✅ Data validation working
- ✅ Error handling appropriate
- ✅ Performance acceptable

### Common Issues and Solutions

#### Issue: Token Not Generated
**Solution**: Check if user exists and credentials are correct

#### Issue: Permission Denied
**Solution**: Verify user role and endpoint permissions

#### Issue: Validation Errors
**Solution**: Check request body format and required fields

#### Issue: Service Unavailable
**Solution**: Verify Docker containers are running

## 🎯 Best Practices

1. **Run tests in sequence** - Some tests depend on previous results
2. **Use environment variables** - Tokens and IDs are automatically managed
3. **Check response codes** - Verify expected status codes
4. **Validate data** - Ensure response data is correct
5. **Clean up test data** - Remove test data after testing
6. **Monitor logs** - Check service logs for errors

## 📚 Additional Resources

- **API Documentation**: Check individual endpoint documentation
- **Database Schema**: Review database structure
- **Service Logs**: Monitor Docker container logs
- **Error Codes**: Reference error code documentation

---

**Happy Testing! 🚀**
