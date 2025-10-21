# 🧪 Germy User Service - Complete Test Table

## **📋 Overview**
This document provides a comprehensive test table for all User Service endpoints, including success scenarios, error cases, and edge cases.

## **🔐 Authentication & Setup**

| Test ID | Endpoint | Method | Description | Expected Status | Expected Response |
|---------|----------|--------|-------------|-----------------|-------------------|
| AUTH-001 | `/api/auth/login` | POST | Get authentication token | 200 | `{"success": true, "data": {"token": "...", "user": {...}}}` |
| AUTH-002 | `/api/auth/login` | POST | Invalid credentials | 400 | `{"success": false, "message": "Invalid credentials"}` |
| AUTH-003 | `/api/auth/login` | POST | Missing email | 400 | `{"success": false, "message": "Validation failed"}` |

## **👥 User Management**

### **Get Users**

| Test ID | Endpoint | Method | Query Params | Expected Status | Expected Response |
|---------|----------|--------|--------------|-----------------|-------------------|
| USER-001 | `/api/users` | GET | `page=1&limit=20` | 200 | `{"success": true, "data": {"users": [...], "pagination": {...}}}` |
| USER-002 | `/api/users` | GET | `role=user&page=1&limit=10` | 200 | Users filtered by role |
| USER-003 | `/api/users` | GET | `search=john&page=1&limit=10` | 200 | Users matching search term |
| USER-004 | `/api/users` | GET | `isActive=true&page=1&limit=10` | 200 | Only active users |
| USER-005 | `/api/users` | GET | `page=1&limit=1000` | 200 | Large dataset handling |
| USER-006 | `/api/users` | GET | No auth token | 401 | `{"success": false, "message": "Authentication required"}` |
| USER-007 | `/api/users` | GET | Invalid page number | 400 | `{"success": false, "message": "Invalid page number"}` |

### **Search Users**

| Test ID | Endpoint | Method | Query Params | Expected Status | Expected Response |
|---------|----------|--------|--------------|-----------------|-------------------|
| SEARCH-001 | `/api/users/search` | GET | `q=john&limit=10` | 200 | `{"success": true, "data": {"users": [...]}}` |
| SEARCH-002 | `/api/users/search` | GET | `q=admin@testcorp.com&limit=10` | 200 | Users matching email |
| SEARCH-003 | `/api/users/search` | GET | `q=&limit=10` | 400 | `{"success": false, "message": "Search query is required"}` |
| SEARCH-004 | `/api/users/search` | GET | `q=nonexistent&limit=10` | 200 | Empty results array |

### **Get User by ID**

| Test ID | Endpoint | Method | Path Params | Expected Status | Expected Response |
|---------|----------|--------|-------------|-----------------|-------------------|
| GET-001 | `/api/users/{id}` | GET | Valid UUID | 200 | `{"success": true, "data": {"user": {...}}}` |
| GET-002 | `/api/users/{id}` | GET | Invalid UUID | 400 | `{"success": false, "message": "Invalid user ID format"}` |
| GET-003 | `/api/users/{id}` | GET | Non-existent UUID | 404 | `{"success": false, "message": "User not found"}` |
| GET-004 | `/api/users/{id}` | GET | No auth token | 401 | `{"success": false, "message": "Authentication required"}` |
| GET-005 | `/api/users/{id}` | GET | Wrong company user | 403 | `{"success": false, "message": "Access denied"}` |

### **Update User**

| Test ID | Endpoint | Method | Path Params | Body | Expected Status | Expected Response |
|---------|----------|--------|-------------|------|-----------------|-------------------|
| UPDATE-001 | `/api/users/{id}` | PUT | Valid UUID | Full user data | 200 | `{"success": true, "data": {"user": {...}}}` |
| UPDATE-002 | `/api/users/{id}` | PATCH | Valid UUID | Partial data | 200 | `{"success": true, "data": {"user": {...}}}` |
| UPDATE-003 | `/api/users/{id}` | PUT | Valid UUID | Invalid phone | 400 | `{"success": false, "message": "Invalid phone number format"}` |
| UPDATE-004 | `/api/users/{id}` | PUT | Valid UUID | Invalid email | 400 | `{"success": false, "message": "Invalid email format"}` |
| UPDATE-005 | `/api/users/{id}` | PUT | Valid UUID | Negative salary | 400 | `{"success": false, "message": "Salary must be positive"}` |
| UPDATE-006 | `/api/users/{id}` | PUT | Valid UUID | Empty firstName | 400 | `{"success": false, "message": "First name is required"}` |
| UPDATE-007 | `/api/users/{id}` | PUT | Invalid UUID | Valid data | 400 | `{"success": false, "message": "Invalid user ID format"}` |
| UPDATE-008 | `/api/users/{id}` | PUT | Non-existent UUID | Valid data | 404 | `{"success": false, "message": "User not found"}` |

### **Deactivate User**

| Test ID | Endpoint | Method | Path Params | Expected Status | Expected Response |
|---------|----------|--------|-------------|-----------------|-------------------|
| DEACT-001 | `/api/users/{id}/deactivate` | PATCH | Valid UUID | 200 | `{"success": true, "message": "User deactivated successfully"}` |
| DEACT-002 | `/api/users/{id}/deactivate` | PATCH | Invalid UUID | 400 | `{"success": false, "message": "Invalid user ID format"}` |
| DEACT-003 | `/api/users/{id}/deactivate` | PATCH | Non-existent UUID | 404 | `{"success": false, "message": "User not found"}` |
| DEACT-004 | `/api/users/{id}/deactivate` | PATCH | Already deactivated | 200 | `{"success": true, "message": "User already deactivated"}` |

## **⚙️ User Preferences**

### **Get User Preferences**

| Test ID | Endpoint | Method | Path Params | Expected Status | Expected Response |
|---------|----------|--------|-------------|-----------------|-------------------|
| PREF-001 | `/api/users/{id}/preferences` | GET | Valid UUID | 200 | `{"success": true, "data": {"preferences": {...}}}` |
| PREF-002 | `/api/users/{id}/preferences` | GET | Invalid UUID | 400 | `{"success": false, "message": "Invalid user ID format"}` |
| PREF-003 | `/api/users/{id}/preferences` | GET | Non-existent UUID | 404 | `{"success": false, "message": "User not found"}` |

### **Update User Preferences**

| Test ID | Endpoint | Method | Path Params | Body | Expected Status | Expected Response |
|---------|----------|--------|-------------|------|-----------------|-------------------|
| PREF-004 | `/api/users/{id}/preferences` | PUT | Valid UUID | Valid preferences | 200 | `{"success": true, "data": {"preferences": {...}}}` |
| PREF-005 | `/api/users/{id}/preferences` | PUT | Valid UUID | Invalid theme | 400 | `{"success": false, "message": "Invalid theme value"}` |
| PREF-006 | `/api/users/{id}/preferences` | PUT | Valid UUID | Invalid language | 400 | `{"success": false, "message": "Invalid language code"}` |
| PREF-007 | `/api/users/{id}/preferences` | PUT | Valid UUID | Invalid timeFormat | 400 | `{"success": false, "message": "Invalid time format"}` |
| PREF-008 | `/api/users/{id}/preferences` | PUT | Invalid UUID | Valid data | 400 | `{"success": false, "message": "Invalid user ID format"}` |

## **📊 User Activities**

### **Get User Activities**

| Test ID | Endpoint | Method | Path Params | Query Params | Expected Status | Expected Response |
|---------|----------|--------|-------------|--------------|-----------------|-------------------|
| ACT-001 | `/api/users/{id}/activities` | GET | Valid UUID | `page=1&limit=20` | 200 | `{"success": true, "data": {"activities": [...], "pagination": {...}}}` |
| ACT-002 | `/api/users/{id}/activities` | GET | Valid UUID | `page=1&limit=100` | 200 | Large dataset handling |
| ACT-003 | `/api/users/{id}/activities` | GET | Invalid UUID | `page=1&limit=20` | 400 | `{"success": false, "message": "Invalid user ID format"}` |
| ACT-004 | `/api/users/{id}/activities` | GET | Non-existent UUID | `page=1&limit=20` | 404 | `{"success": false, "message": "User not found"}` |
| ACT-005 | `/api/users/{id}/activities` | GET | Valid UUID | Invalid page | 400 | `{"success": false, "message": "Invalid page number"}` |

## **🔧 User Settings**

### **Get User Settings**

| Test ID | Endpoint | Method | Path Params | Expected Status | Expected Response |
|---------|----------|--------|-------------|-----------------|-------------------|
| SET-001 | `/api/users/{id}/settings` | GET | Valid UUID | 200 | `{"success": true, "data": {"settings": {...}}}` |
| SET-002 | `/api/users/{id}/settings` | GET | Invalid UUID | 400 | `{"success": false, "message": "Invalid user ID format"}` |
| SET-003 | `/api/users/{id}/settings` | GET | Non-existent UUID | 404 | `{"success": false, "message": "User not found"}` |

### **Update User Settings**

| Test ID | Endpoint | Method | Path Params | Body | Expected Status | Expected Response |
|---------|----------|--------|-------------|------|-----------------|-------------------|
| SET-004 | `/api/users/{id}/settings` | PUT | Valid UUID | Valid settings | 200 | `{"success": true, "data": {"settings": {...}}}` |
| SET-005 | `/api/users/{id}/settings` | PUT | Valid UUID | Invalid time format | 400 | `{"success": false, "message": "Invalid time format (HH:MM)"}` |
| SET-006 | `/api/users/{id}/settings` | PUT | Valid UUID | Invalid work days | 400 | `{"success": false, "message": "Invalid work days"}` |
| SET-007 | `/api/users/{id}/settings` | PUT | Valid UUID | Invalid break duration | 400 | `{"success": false, "message": "Break duration must be between 0 and 480 minutes"}` |
| SET-008 | `/api/users/{id}/settings` | PUT | Invalid UUID | Valid data | 400 | `{"success": false, "message": "Invalid user ID format"}` |

## **📈 User Analytics**

### **Get User Statistics**

| Test ID | Endpoint | Method | Path Params | Expected Status | Expected Response |
|---------|----------|--------|-------------|-----------------|-------------------|
| STAT-001 | `/api/users/{id}/statistics` | GET | Valid UUID | 200 | `{"success": true, "data": {"statistics": {...}}}` |
| STAT-002 | `/api/users/{id}/statistics` | GET | Invalid UUID | 400 | `{"success": false, "message": "Invalid user ID format"}` |
| STAT-003 | `/api/users/{id}/statistics` | GET | Non-existent UUID | 404 | `{"success": false, "message": "User not found"}` |

### **Get User Activity Summary**

| Test ID | Endpoint | Method | Path Params | Query Params | Expected Status | Expected Response |
|---------|----------|--------|-------------|--------------|-----------------|-------------------|
| SUM-001 | `/api/users/{id}/activity-summary` | GET | Valid UUID | `days=30` | 200 | `{"success": true, "data": {"summary": {...}}}` |
| SUM-002 | `/api/users/{id}/activity-summary` | GET | Valid UUID | `days=7` | 200 | 7-day summary |
| SUM-003 | `/api/users/{id}/activity-summary` | GET | Valid UUID | `days=365` | 200 | 1-year summary |
| SUM-004 | `/api/users/{id}/activity-summary` | GET | Valid UUID | `days=0` | 400 | `{"success": false, "message": "Days must be positive"}` |
| SUM-005 | `/api/users/{id}/activity-summary` | GET | Invalid UUID | `days=30` | 400 | `{"success": false, "message": "Invalid user ID format"}` |

### **Get Company User Analytics**

| Test ID | Endpoint | Method | Path Params | Expected Status | Expected Response |
|---------|----------|--------|-------------|-----------------|-------------------|
| COMP-001 | `/api/users/analytics/company/{companyId}` | GET | Valid company UUID | 200 | `{"success": true, "data": {"analytics": {...}}}` |
| COMP-002 | `/api/users/analytics/company/{companyId}` | GET | Invalid company UUID | 400 | `{"success": false, "message": "Invalid company ID format"}` |
| COMP-003 | `/api/users/analytics/company/{companyId}` | GET | Non-existent company UUID | 404 | `{"success": false, "message": "Company not found"}` |
| COMP-004 | `/api/users/analytics/company/{companyId}` | GET | Valid company UUID (no access) | 403 | `{"success": false, "message": "Access denied"}` |

## **📦 Bulk Operations**

### **Bulk Update Users**

| Test ID | Endpoint | Method | Body | Expected Status | Expected Response |
|---------|----------|--------|------|-----------------|-------------------|
| BULK-001 | `/api/users/bulk/update` | PUT | Valid user IDs and data | 200 | `{"success": true, "data": {"updated": 2, "failed": 0}}` |
| BULK-002 | `/api/users/bulk/update` | PUT | Invalid user IDs | 400 | `{"success": false, "message": "Invalid user ID format"}` |
| BULK-003 | `/api/users/bulk/update` | PUT | Empty user IDs array | 400 | `{"success": false, "message": "At least one user ID is required"}` |
| BULK-004 | `/api/users/bulk/update` | PUT | Non-existent user IDs | 200 | `{"success": true, "data": {"updated": 0, "failed": 2}}` |
| BULK-005 | `/api/users/bulk/update` | PUT | Invalid update data | 400 | `{"success": false, "message": "Invalid update data"}` |

### **Export Users**

| Test ID | Endpoint | Method | Path Params | Expected Status | Expected Response |
|---------|----------|--------|-------------|-----------------|-------------------|
| EXP-001 | `/api/users/export/company/{companyId}` | GET | Valid company UUID | 200 | CSV/JSON file download |
| EXP-002 | `/api/users/export/company/{companyId}` | GET | Invalid company UUID | 400 | `{"success": false, "message": "Invalid company ID format"}` |
| EXP-003 | `/api/users/export/company/{companyId}` | GET | Non-existent company UUID | 404 | `{"success": false, "message": "Company not found"}` |
| EXP-004 | `/api/users/export/company/{companyId}` | GET | Valid company UUID (no access) | 403 | `{"success": false, "message": "Access denied"}` |

### **Import Users**

| Test ID | Endpoint | Method | Body | Expected Status | Expected Response |
|---------|----------|--------|------|-----------------|-------------------|
| IMP-001 | `/api/users/import` | POST | Valid users data | 200 | `{"success": true, "data": {"imported": 2, "failed": 0}}` |
| IMP-002 | `/api/users/import` | POST | Invalid email format | 400 | `{"success": false, "message": "Invalid email format"}` |
| IMP-003 | `/api/users/import` | POST | Missing required fields | 400 | `{"success": false, "message": "First name is required"}` |
| IMP-004 | `/api/users/import` | POST | Invalid role | 400 | `{"success": false, "message": "Invalid role"}` |
| IMP-005 | `/api/users/import` | POST | Empty users array | 400 | `{"success": false, "message": "At least one user is required"}` |
| IMP-006 | `/api/users/import` | POST | Duplicate email | 200 | `{"success": true, "data": {"imported": 1, "failed": 1}}` |

## **🔍 Error Testing**

### **Authentication Errors**

| Test ID | Scenario | Expected Status | Expected Response |
|---------|----------|-----------------|-------------------|
| ERR-001 | No authentication token | 401 | `{"success": false, "message": "Authentication required"}` |
| ERR-002 | Invalid authentication token | 401 | `{"success": false, "message": "Invalid token"}` |
| ERR-003 | Expired authentication token | 401 | `{"success": false, "message": "Token expired"}` |
| ERR-004 | Malformed authentication token | 401 | `{"success": false, "message": "Invalid token format"}` |

### **Authorization Errors**

| Test ID | Scenario | Expected Status | Expected Response |
|---------|----------|-----------------|-------------------|
| ERR-005 | Access user from different company | 403 | `{"success": false, "message": "Access denied"}` |
| ERR-006 | Regular user accessing admin endpoints | 403 | `{"success": false, "message": "Insufficient permissions"}` |
| ERR-007 | Deactivated user accessing endpoints | 403 | `{"success": false, "message": "Account deactivated"}` |

### **Validation Errors**

| Test ID | Scenario | Expected Status | Expected Response |
|---------|----------|-----------------|-------------------|
| ERR-008 | Invalid UUID format | 400 | `{"success": false, "message": "Invalid user ID format"}` |
| ERR-009 | Invalid email format | 400 | `{"success": false, "message": "Invalid email format"}` |
| ERR-010 | Invalid phone format | 400 | `{"success": false, "message": "Invalid phone number format"}` |
| ERR-011 | Invalid date format | 400 | `{"success": false, "message": "Invalid date format"}` |
| ERR-012 | Negative salary | 400 | `{"success": false, "message": "Salary must be positive"}` |
| ERR-013 | Empty required fields | 400 | `{"success": false, "message": "First name is required"}` |

### **Not Found Errors**

| Test ID | Scenario | Expected Status | Expected Response |
|---------|----------|-----------------|-------------------|
| ERR-014 | Non-existent user ID | 404 | `{"success": false, "message": "User not found"}` |
| ERR-015 | Non-existent company ID | 404 | `{"success": false, "message": "Company not found"}` |
| ERR-016 | Non-existent preferences | 404 | `{"success": false, "message": "Preferences not found"}` |
| ERR-017 | Non-existent settings | 404 | `{"success": false, "message": "Settings not found"}` |

## **🏥 Health Check**

| Test ID | Endpoint | Method | Expected Status | Expected Response |
|---------|----------|--------|-----------------|-------------------|
| HEALTH-001 | `/health` | GET | 200 | `{"status": "healthy", "service": "user-service", "timestamp": "..."}` |
| HEALTH-002 | `/health` | GET | 200 | Database connection status |
| HEALTH-003 | `/health` | GET | 200 | Service uptime information |

## **📊 Performance Testing**

| Test ID | Scenario | Expected Response Time | Expected Status |
|---------|----------|------------------------|-----------------|
| PERF-001 | Get 20 users | < 500ms | 200 |
| PERF-002 | Get 100 users | < 1000ms | 200 |
| PERF-003 | Search users | < 500ms | 200 |
| PERF-004 | Get user statistics | < 1000ms | 200 |
| PERF-005 | Bulk update 10 users | < 2000ms | 200 |
| PERF-006 | Import 50 users | < 5000ms | 200 |
| PERF-007 | Export company users | < 3000ms | 200 |

## **🎯 Success Criteria**

### **Functional Requirements**
- ✅ All endpoints respond with correct status codes
- ✅ Authentication and authorization work properly
- ✅ Data validation prevents invalid inputs
- ✅ Error handling provides clear messages
- ✅ Bulk operations complete successfully
- ✅ Analytics provide accurate data

### **Performance Requirements**
- ✅ Response times meet specified limits
- ✅ Concurrent requests handled properly
- ✅ Large datasets processed efficiently
- ✅ Memory usage remains stable

### **Security Requirements**
- ✅ Authentication required for all endpoints
- ✅ Role-based access control enforced
- ✅ Data validation prevents injection
- ✅ Error messages don't leak sensitive information
- ✅ Input sanitization prevents XSS

### **Reliability Requirements**
- ✅ Service handles errors gracefully
- ✅ Database connections managed properly
- ✅ Transactions rollback on failures
- ✅ Logging provides adequate debugging info

## **🚀 Production Readiness Checklist**

- ✅ All test cases pass
- ✅ Performance meets requirements
- ✅ Security measures implemented
- ✅ Error handling comprehensive
- ✅ Documentation complete
- ✅ Monitoring and logging in place
- ✅ Backup and recovery procedures
- ✅ Load testing completed

**The User Service is ready for production! 🎉**