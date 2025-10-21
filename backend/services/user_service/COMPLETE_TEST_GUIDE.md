# 🧪 Germy User Service - Complete Test Guide

## **📋 Overview**
This guide provides comprehensive testing instructions for the Germy User Service using the Postman collection. The service handles user management, preferences, settings, analytics, and bulk operations.

## **🚀 Quick Start**

### **1. Prerequisites**
- Docker containers running (auth-service, user-service, database)
- Postman installed
- Valid admin credentials

### **2. Import Files**
1. **Collection**: `User_Service_Complete_Collection.postman_collection.json`
2. **Environment**: `User_Service_Environment.postman_environment.json`

### **3. Setup Environment**
1. Import both files into Postman
2. Select the "Germy User Service Environment"
3. Update environment variables if needed:
   - `baseUrl`: `http://localhost:3003`
   - `adminEmail`: Your admin email
   - `adminPassword`: Your admin password

## **🔐 Authentication Setup**

### **Step 1: Get Auth Token**
1. Run the **"Get Auth Token (Login)"** request in the **"🔐 Authentication Setup"** folder
2. This will automatically set the `authToken` variable
3. The token will be used for all subsequent requests

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "admin@testcorp.com",
      "role": "company_super_admin"
    }
  }
}
```

## **👥 User Management Testing**

### **1. Get All Users**
- **Request**: `GET /api/users`
- **Purpose**: Retrieve paginated list of users
- **Parameters**: `page`, `limit`, `search`, `role`, `isActive`

**Test Cases:**
- ✅ **Basic Request**: `GET /api/users?page=1&limit=20`
- ✅ **Role Filter**: `GET /api/users?role=user&page=1&limit=10`
- ✅ **Search Filter**: `GET /api/users?search=john&page=1&limit=10`
- ✅ **Active Filter**: `GET /api/users?isActive=true&page=1&limit=10`

### **2. Search Users**
- **Request**: `GET /api/users/search`
- **Purpose**: Search users by name or email
- **Parameters**: `q` (required), `limit`

**Test Cases:**
- ✅ **Search by Name**: `GET /api/users/search?q=john&limit=10`
- ✅ **Search by Email**: `GET /api/users/search?q=admin@testcorp.com&limit=10`

### **3. Get User by ID**
- **Request**: `GET /api/users/{id}`
- **Purpose**: Get specific user details
- **Auto-sets**: `userId` variable for subsequent requests

### **4. Update User**
- **Request**: `PUT /api/users/{id}` or `PATCH /api/users/{id}`
- **Purpose**: Update user information

**Test Cases:**
- ✅ **Full Update (PUT)**: Update all user fields
- ✅ **Partial Update (PATCH)**: Update specific fields only
- ✅ **Validation Testing**: Test with invalid data

### **5. Deactivate User**
- **Request**: `PATCH /api/users/{id}/deactivate`
- **Purpose**: Deactivate a user account

## **⚙️ User Preferences Testing**

### **1. Get User Preferences**
- **Request**: `GET /api/users/{id}/preferences`
- **Purpose**: Retrieve user's personal preferences

### **2. Update User Preferences**
- **Request**: `PUT /api/users/{id}/preferences`
- **Purpose**: Update user preferences

**Test Data:**
```json
{
  "theme": "dark",
  "language": "en",
  "timezone": "America/New_York",
  "dateFormat": "MM/DD/YYYY",
  "timeFormat": "12h",
  "notifications": {
    "email": true,
    "push": false,
    "sms": true
  },
  "privacy": {
    "profileVisible": true,
    "activityVisible": false
  }
}
```

## **📊 User Activities Testing**

### **1. Get User Activities**
- **Request**: `GET /api/users/{id}/activities`
- **Purpose**: Retrieve user's activity history
- **Parameters**: `page`, `limit`

## **🔧 User Settings Testing**

### **1. Get User Settings**
- **Request**: `GET /api/users/{id}/settings`
- **Purpose**: Retrieve user's work settings

### **2. Update User Settings**
- **Request**: `PUT /api/users/{id}/settings`
- **Purpose**: Update work-related settings

**Test Data:**
```json
{
  "workHoursStart": "09:00",
  "workHoursEnd": "17:00",
  "workDays": [1, 2, 3, 4, 5],
  "breakDuration": 60,
  "overtimeEnabled": true,
  "remoteWorkEnabled": true,
  "attendanceReminders": {
    "clockIn": true,
    "clockOut": true,
    "breakStart": false
  }
}
```

## **📈 User Analytics Testing**

### **1. Get User Statistics**
- **Request**: `GET /api/users/{id}/statistics`
- **Purpose**: Get user's statistical data

### **2. Get User Activity Summary**
- **Request**: `GET /api/users/{id}/activity-summary`
- **Purpose**: Get activity summary for specified days
- **Parameters**: `days` (default: 30)

### **3. Get Company User Analytics**
- **Request**: `GET /api/users/analytics/company/{companyId}`
- **Purpose**: Get company-wide user analytics

## **📦 Bulk Operations Testing**

### **1. Bulk Update Users**
- **Request**: `PUT /api/users/bulk/update`
- **Purpose**: Update multiple users at once

**Test Data:**
```json
{
  "userIds": ["user-id-1", "user-id-2"],
  "updateData": {
    "department": "Updated Department",
    "position": "Updated Position",
    "isActive": true
  }
}
```

### **2. Export Users**
- **Request**: `GET /api/users/export/company/{companyId}`
- **Purpose**: Export company users data

### **3. Import Users**
- **Request**: `POST /api/users/import`
- **Purpose**: Import multiple users

**Test Data:**
```json
{
  "usersData": [
    {
      "email": "newuser1@testcorp.com",
      "firstName": "New",
      "lastName": "User1",
      "phone": "+1234567890",
      "position": "Developer",
      "department": "Engineering",
      "hireDate": "2024-01-15T00:00:00.000Z",
      "salary": 60000,
      "role": "user",
      "isActive": true
    }
  ]
}
```

## **🔍 Error Testing**

### **1. Invalid User ID**
- **Request**: `GET /api/users/invalid-uuid`
- **Expected**: 400 Bad Request

### **2. Invalid Data**
- **Request**: `PUT /api/users/{id}` with invalid data
- **Expected**: 400 Bad Request with validation errors

### **3. Unauthorized Access**
- **Request**: Any endpoint with invalid token
- **Expected**: 401 Unauthorized

## **🏥 Health Check**

### **1. Service Health**
- **Request**: `GET /health`
- **Purpose**: Check service status
- **Expected**: 200 OK with service information

## **📊 Test Scenarios**

### **Scenario 1: Complete User Lifecycle**
1. **Get All Users** → Verify user list
2. **Get User by ID** → Verify user details
3. **Update User** → Verify changes
4. **Update Preferences** → Verify preferences
5. **Update Settings** → Verify settings
6. **Get Statistics** → Verify analytics

### **Scenario 2: Bulk Operations**
1. **Import Users** → Add multiple users
2. **Bulk Update** → Update multiple users
3. **Export Users** → Download user data
4. **Get All Users** → Verify changes

### **Scenario 3: Error Handling**
1. **Invalid ID** → Test validation
2. **Invalid Data** → Test input validation
3. **Unauthorized** → Test authentication
4. **Missing Fields** → Test required fields

## **✅ Expected Results**

### **Success Responses**
- **200 OK**: Successful GET requests
- **201 Created**: Successful POST requests
- **200 OK**: Successful PUT/PATCH requests

### **Error Responses**
- **400 Bad Request**: Invalid data or validation errors
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server errors

## **🔧 Troubleshooting**

### **Common Issues**

#### **1. Authentication Errors**
- **Problem**: 401 Unauthorized
- **Solution**: Run "Get Auth Token" request first
- **Check**: Token is set in environment variables

#### **2. Validation Errors**
- **Problem**: 400 Bad Request with validation errors
- **Solution**: Check request body format and required fields
- **Check**: Phone number format, email format, date format

#### **3. Permission Errors**
- **Problem**: 403 Forbidden
- **Solution**: Ensure user has proper role and permissions
- **Check**: User role and company access

#### **4. Not Found Errors**
- **Problem**: 404 Not Found
- **Solution**: Verify user ID exists and is accessible
- **Check**: User ID format and existence

## **📈 Performance Testing**

### **Load Testing**
- **Concurrent Requests**: Test with multiple simultaneous requests
- **Large Datasets**: Test with large user lists (pagination)
- **Bulk Operations**: Test bulk update/import with large datasets

### **Response Time Expectations**
- **Simple Queries**: < 500ms
- **Complex Analytics**: < 2000ms
- **Bulk Operations**: < 5000ms

## **🎯 Success Criteria**

### **Functional Testing**
- ✅ All endpoints respond correctly
- ✅ Authentication works properly
- ✅ Data validation functions correctly
- ✅ Error handling works as expected
- ✅ Bulk operations complete successfully

### **Performance Testing**
- ✅ Response times within acceptable limits
- ✅ Concurrent requests handled properly
- ✅ Large datasets processed efficiently

### **Security Testing**
- ✅ Authentication required for all endpoints
- ✅ Role-based access control works
- ✅ Data validation prevents injection
- ✅ Error messages don't leak sensitive information

## **🚀 Production Readiness**

The User Service is ready for production when:
- ✅ All test scenarios pass
- ✅ Performance meets requirements
- ✅ Security measures are in place
- ✅ Error handling is comprehensive
- ✅ Documentation is complete

**The User Service testing is complete and production-ready! 🎉**
