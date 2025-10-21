# 🚫 Rejection Workflow Test Plan

## **Overview**
This document outlines the complete rejection workflow implementation for the Germy platform, including login blocking, registration prevention, and admin manual registration.

## **✅ Implemented Features**

### **1. Login Blocking for Rejected Users**
- **Location**: `backend/services/auth_service/src/services/auth.service.ts`
- **Methods**: `loginCompanyUser()`, `login()`
- **Behavior**: 
  - Rejected users get clear message: *"Your registration was rejected. Please contact your company admin or super admin to manually register your account."*
  - Pending users get: *"Account is pending approval"*

### **2. Registration Prevention for Rejected Users**
- **Location**: `backend/services/auth_service/src/services/auth.service.ts`
- **Methods**: `registerUserWithDomain()`, `registerAdminWithDomain()`
- **Behavior**:
  - Rejected users cannot re-register
  - Get message: *"Your previous registration was rejected. Please contact your company admin or super admin to manually register your account."*
  - Only admin/super admin can manually register them

### **3. Admin Manual Registration**
- **Location**: `backend/services/auth_service/src/services/auth.service.ts`
- **Method**: `manualRegisterUser()`
- **Endpoint**: `POST /api/auth/manual-register`
- **Behavior**:
  - Only admins/super admins can use this endpoint
  - Can register rejected users directly
  - Sets `approvalStatus: 'approved'` immediately
  - Updates existing rejected users or creates new ones

## **🧪 Test Scenarios**

### **Scenario 1: User Registration → Rejection → Login Attempt**
1. **Register User**: `POST /api/auth/register-with-domain`
2. **Admin Rejects**: `POST /api/approvals/requests/{id}/reject`
3. **User Tries Login**: `POST /api/auth/login`
   - **Expected**: *"Your registration was rejected. Please contact your company admin or super admin to manually register your account."*

### **Scenario 2: Rejected User Tries Re-registration**
1. **Rejected User Tries Register Again**: `POST /api/auth/register-with-domain`
   - **Expected**: *"Your previous registration was rejected. Please contact your company admin or super admin to manually register your account."*

### **Scenario 3: Admin Manual Registration**
1. **Admin Manually Registers Rejected User**: `POST /api/auth/manual-register`
   - **Body**: `{ "companyDomain": "testcorp.com", "firstName": "John", "lastName": "Doe", "email": "john@testcorp.com", "password": "password123", "role": "user" }`
   - **Expected**: User is approved and can login

## **🔧 Technical Implementation**

### **Login Logic Update**
```typescript
// Check if user is approved
if (userData.approvalStatus !== 'approved') {
  if (userData.approvalStatus === 'rejected') {
    return {
      success: false,
      message: 'Your registration was rejected. Please contact your company admin or super admin to manually register your account.',
    };
  }
  return {
    success: false,
    message: 'Account is pending approval',
  };
}
```

### **Registration Logic Update**
```typescript
// Check if user was previously rejected
if (user.approvalStatus === 'rejected') {
  return {
    success: false,
    message: 'Your previous registration was rejected. Please contact your company admin or super admin to manually register your account.',
  };
}
```

### **Manual Registration Logic**
```typescript
// Update existing rejected user
await db.update(users).set({
  firstName: data.firstName,
  lastName: data.lastName,
  passwordHash: hashedPassword,
  role: data.role,
  approvalStatus: 'approved',
  isVerified: true,
  approvedBy: adminId,
  approvedAt: new Date(),
}).where(eq(users.id, user.id));
```

## **📋 Test Commands**

### **1. Test Rejection Workflow**
```bash
# 1. Register a new user
curl -X POST "http://localhost:3001/api/auth/register-with-domain" \
  -H "Content-Type: application/json" \
  -d '{
    "companyDomain": "testcorp.com",
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john@testcorp.com",
    "password": "password123"
  }'

# 2. Admin rejects the user
curl -X POST "http://localhost:3001/api/approvals/requests/{requestId}/reject" \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{"reason": "User does not meet requirements"}'

# 3. User tries to login (should fail)
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@testcorp.com",
    "password": "password123"
  }'

# 4. User tries to register again (should fail)
curl -X POST "http://localhost:3001/api/auth/register-with-domain" \
  -H "Content-Type: application/json" \
  -d '{
    "companyDomain": "testcorp.com",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@testcorp.com", 
    "password": "password123"
  }'

# 5. Admin manually registers the user
curl -X POST "http://localhost:3001/api/auth/manual-register" \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "companyDomain": "testcorp.com",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@testcorp.com",
    "password": "password123",
    "role": "user"
  }'

# 6. User can now login successfully
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@testcorp.com",
    "password": "password123"
  }'
```

## **🎯 Expected Results**

### **Login Attempts**
- **Pending User**: *"Account is pending approval"*
- **Rejected User**: *"Your registration was rejected. Please contact your company admin or super admin to manually register your account."*
- **Approved User**: ✅ **Login successful**

### **Registration Attempts**
- **New User**: ✅ **Registration successful** (pending approval)
- **Existing User**: *"User with this email already exists"*
- **Rejected User**: *"Your previous registration was rejected. Please contact your company admin or super admin to manually register your account."*

### **Manual Registration**
- **Admin Success**: ✅ **User approved and can login**
- **Non-Admin**: *"Insufficient permissions to manually register users"*
- **Non-Rejected User**: *"User with this email already exists and is not rejected"*

## **🔒 Security Features**

1. **Role-Based Access**: Only admins/super admins can manually register
2. **Company Scoping**: Admins can only register users for their company
3. **Status Validation**: Prevents duplicate processing of requests
4. **Audit Logging**: All actions are logged for compliance
5. **Clear Messaging**: Users get clear instructions on what to do

## **✅ Implementation Status**

- ✅ **Login blocking for rejected users**
- ✅ **Registration prevention for rejected users** 
- ✅ **Admin manual registration endpoint**
- ✅ **Proper error messages and user guidance**
- ✅ **Role-based access control**
- ✅ **Audit logging for compliance**
- ✅ **Company scoping for security**

## **🎉 Success Criteria**

The rejection workflow is **fully implemented** and provides:

1. **Complete User Journey Control**: From registration → rejection → blocked access → admin intervention → approval
2. **Security**: Prevents rejected users from bypassing the approval system
3. **User Experience**: Clear messaging and guidance for rejected users
4. **Admin Control**: Full control over user registration and approval
5. **Audit Trail**: Complete logging of all actions for compliance

**The rejection workflow is now production-ready! 🚀**
