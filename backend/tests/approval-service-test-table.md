# Approval Service HTTP Test Table

## Overview
This document provides comprehensive test cases for the Approval Service endpoints, covering all approval workflows, edge cases, and error scenarios.

## Base Configuration
- **Service URL**: `http://localhost:3001`
- **Authentication**: Bearer Token required for all endpoints
- **Content-Type**: `application/json`

---

## Test Cases

### 1. Get Pending Approval Requests
**Endpoint**: `GET /api/approvals/pending`

| Test ID | Description | Headers | Expected Status | Expected Response | Notes |
|---------|-------------|---------|-----------------|-------------------|-------|
| A001 | Get pending requests as platform admin | `Authorization: Bearer {platform_admin_token}` | 200 | `{"success": true, "data": {"approvalRequests": [...]}}` | Should return all pending requests |
| A002 | Get pending requests as company super admin | `Authorization: Bearer {super_admin_token}` | 200 | `{"success": true, "data": {"approvalRequests": [...]}}` | Should return company-specific requests |
| A003 | Get pending requests as admin | `Authorization: Bearer {admin_token}` | 200 | `{"success": true, "data": {"approvalRequests": [...]}}` | Should return company-specific requests |
| A004 | Get pending requests as user | `Authorization: Bearer {user_token}` | 403 | `{"success": false, "message": "Insufficient permissions"}` | Users cannot view approval requests |
| A005 | Get pending requests without token | None | 401 | `{"success": false, "message": "Access token required"}` | Authentication required |
| A006 | Get pending requests with invalid token | `Authorization: Bearer invalid_token` | 401 | `{"success": false, "message": "Invalid token"}` | Invalid token rejection |

### 2. Get Approval Request by ID
**Endpoint**: `GET /api/approvals/{requestId}`

| Test ID | Description | Headers | Path Params | Expected Status | Expected Response | Notes |
|---------|-------------|---------|-------------|-----------------|-------------------|-------|
| A007 | Get specific request as platform admin | `Authorization: Bearer {platform_admin_token}` | `requestId: valid_uuid` | 200 | `{"success": true, "data": {"approvalRequest": {...}}}` | Should return request details |
| A008 | Get specific request as company super admin | `Authorization: Bearer {super_admin_token}` | `requestId: valid_uuid` | 200 | `{"success": true, "data": {"approvalRequest": {...}}}` | Should return company request |
| A009 | Get specific request as admin | `Authorization: Bearer {admin_token}` | `requestId: valid_uuid` | 200 | `{"success": true, "data": {"approvalRequest": {...}}}` | Should return company request |
| A010 | Get specific request as user | `Authorization: Bearer {user_token}` | `requestId: valid_uuid` | 403 | `{"success": false, "message": "Insufficient permissions"}` | Users cannot view requests |
| A011 | Get non-existent request | `Authorization: Bearer {platform_admin_token}` | `requestId: non_existent_uuid` | 404 | `{"success": false, "message": "Approval request not found"}` | Request doesn't exist |
| A012 | Get request with invalid UUID | `Authorization: Bearer {platform_admin_token}` | `requestId: invalid_format` | 400 | `{"success": false, "message": "Invalid request ID format"}` | Invalid UUID format |

### 3. Approve Request
**Endpoint**: `POST /api/approvals/{requestId}/approve`

| Test ID | Description | Headers | Path Params | Body | Expected Status | Expected Response | Notes |
|---------|-------------|---------|-------------|------|-----------------|-------------------|-------|
| A013 | Approve request as platform admin | `Authorization: Bearer {platform_admin_token}` | `requestId: valid_uuid` | `{"notes": "Approved by platform admin"}` | 200 | `{"success": true, "message": "Request approved successfully"}` | Platform admin can approve any request |
| A014 | Approve request as company super admin | `Authorization: Bearer {super_admin_token}` | `requestId: valid_uuid` | `{"notes": "Approved by super admin"}` | 200 | `{"success": true, "message": "Request approved successfully"}` | Super admin can approve company requests |
| A015 | Approve request as admin | `Authorization: Bearer {admin_token}` | `requestId: valid_uuid` | `{"notes": "Approved by admin"}` | 200 | `{"success": true, "message": "Request approved successfully"}` | Admin can approve company requests |
| A016 | Approve request as user | `Authorization: Bearer {user_token}` | `requestId: valid_uuid` | `{"notes": "Self approval"}` | 403 | `{"success": false, "message": "Insufficient permissions"}` | Users cannot approve requests |
| A017 | Approve already approved request | `Authorization: Bearer {platform_admin_token}` | `requestId: approved_uuid` | `{"notes": "Re-approval"}` | 400 | `{"success": false, "message": "Request already processed"}` | Cannot approve already processed request |
| A018 | Approve non-existent request | `Authorization: Bearer {platform_admin_token}` | `requestId: non_existent_uuid` | `{"notes": "Approval"}` | 404 | `{"success": false, "message": "Approval request not found"}` | Request doesn't exist |
| A019 | Approve request without notes | `Authorization: Bearer {platform_admin_token}` | `requestId: valid_uuid` | `{}` | 200 | `{"success": true, "message": "Request approved successfully"}` | Notes are optional |
| A020 | Approve request with empty notes | `Authorization: Bearer {platform_admin_token}` | `requestId: valid_uuid` | `{"notes": ""}` | 200 | `{"success": true, "message": "Request approved successfully"}` | Empty notes are allowed |

### 4. Reject Request
**Endpoint**: `POST /api/approvals/{requestId}/reject`

| Test ID | Description | Headers | Path Params | Body | Expected Status | Expected Response | Notes |
|---------|-------------|---------|-------------|------|-----------------|-------------------|-------|
| A021 | Reject request as platform admin | `Authorization: Bearer {platform_admin_token}` | `requestId: valid_uuid` | `{"notes": "Rejected by platform admin"}` | 200 | `{"success": true, "message": "Request rejected successfully"}` | Platform admin can reject any request |
| A022 | Reject request as company super admin | `Authorization: Bearer {super_admin_token}` | `requestId: valid_uuid` | `{"notes": "Rejected by super admin"}` | 200 | `{"success": true, "message": "Request rejected successfully"}` | Super admin can reject company requests |
| A023 | Reject request as admin | `Authorization: Bearer {admin_token}` | `requestId: valid_uuid` | `{"notes": "Rejected by admin"}` | 200 | `{"success": true, "message": "Request rejected successfully"}` | Admin can reject company requests |
| A024 | Reject request as user | `Authorization: Bearer {user_token}` | `requestId: valid_uuid` | `{"notes": "Self rejection"}` | 403 | `{"success": false, "message": "Insufficient permissions"}` | Users cannot reject requests |
| A025 | Reject already processed request | `Authorization: Bearer {platform_admin_token}` | `requestId: processed_uuid` | `{"notes": "Rejection"}` | 400 | `{"success": false, "message": "Request already processed"}` | Cannot reject already processed request |
| A026 | Reject non-existent request | `Authorization: Bearer {platform_admin_token}` | `requestId: non_existent_uuid` | `{"notes": "Rejection"}` | 404 | `{"success": false, "message": "Approval request not found"}` | Request doesn't exist |
| A027 | Reject request without notes | `Authorization: Bearer {platform_admin_token}` | `requestId: valid_uuid` | `{}` | 200 | `{"success": true, "message": "Request rejected successfully"}` | Notes are optional |
| A028 | Reject request with empty notes | `Authorization: Bearer {platform_admin_token}` | `requestId: valid_uuid` | `{"notes": ""}` | 200 | `{"success": true, "message": "Request rejected successfully"}` | Empty notes are allowed |

### 5. Get Approval History
**Endpoint**: `GET /api/approvals/history/{userId}`

| Test ID | Description | Headers | Path Params | Query Params | Expected Status | Expected Response | Notes |
|---------|-------------|---------|-------------|--------------|-----------------|-------------------|-------|
| A029 | Get user approval history as platform admin | `Authorization: Bearer {platform_admin_token}` | `userId: valid_uuid` | None | 200 | `{"success": true, "data": {"approvalHistory": [...]}}` | Platform admin can view any user's history |
| A030 | Get user approval history as company super admin | `Authorization: Bearer {super_admin_token}` | `userId: valid_uuid` | None | 200 | `{"success": true, "data": {"approvalHistory": [...]}}` | Super admin can view company user's history |
| A031 | Get user approval history as admin | `Authorization: Bearer {admin_token}` | `userId: valid_uuid` | None | 200 | `{"success": true, "data": {"approvalHistory": [...]}}` | Admin can view company user's history |
| A032 | Get own approval history as user | `Authorization: Bearer {user_token}` | `userId: same_user_id` | None | 200 | `{"success": true, "data": {"approvalHistory": [...]}}` | Users can view their own history |
| A033 | Get other user's history as user | `Authorization: Bearer {user_token}` | `userId: other_user_id` | None | 403 | `{"success": false, "message": "Insufficient permissions"}` | Users cannot view other users' history |
| A034 | Get history with pagination | `Authorization: Bearer {platform_admin_token}` | `userId: valid_uuid` | `page=1&limit=10` | 200 | `{"success": true, "data": {"approvalHistory": [...], "pagination": {...}}}` | Pagination should work |
| A035 | Get history with invalid pagination | `Authorization: Bearer {platform_admin_token}` | `userId: valid_uuid` | `page=0&limit=-1` | 400 | `{"success": false, "message": "Invalid pagination parameters"}` | Invalid pagination should be rejected |
| A036 | Get history for non-existent user | `Authorization: Bearer {platform_admin_token}` | `userId: non_existent_uuid` | None | 404 | `{"success": false, "message": "User not found"}` | User doesn't exist |

### 6. Get All Approval Requests
**Endpoint**: `GET /api/approvals/requests`

| Test ID | Description | Headers | Query Params | Expected Status | Expected Response | Notes |
|---------|-------------|---------|--------------|-----------------|-------------------|-------|
| A037 | Get all requests as platform admin | `Authorization: Bearer {platform_admin_token}` | None | 200 | `{"success": true, "data": {"approvalRequests": [...]}}` | Platform admin can view all requests |
| A038 | Get all requests as company super admin | `Authorization: Bearer {super_admin_token}` | None | 200 | `{"success": true, "data": {"approvalRequests": [...]}}` | Super admin can view company requests |
| A039 | Get all requests as admin | `Authorization: Bearer {admin_token}` | None | 200 | `{"success": true, "data": {"approvalRequests": [...]}}` | Admin can view company requests |
| A040 | Get all requests as user | `Authorization: Bearer {user_token}` | None | 403 | `{"success": false, "message": "Insufficient permissions"}` | Users cannot view all requests |
| A041 | Get requests with status filter | `Authorization: Bearer {platform_admin_token}` | `status=pending` | 200 | `{"success": true, "data": {"approvalRequests": [...]}}` | Status filtering should work |
| A042 | Get requests with date range | `Authorization: Bearer {platform_admin_token}` | `startDate=2024-01-01&endDate=2024-12-31` | 200 | `{"success": true, "data": {"approvalRequests": [...]}}` | Date range filtering should work |
| A043 | Get requests with pagination | `Authorization: Bearer {platform_admin_token}` | `page=1&limit=20` | 200 | `{"success": true, "data": {"approvalRequests": [...], "pagination": {...}}}` | Pagination should work |

### 7. Error Handling Tests

| Test ID | Description | Endpoint | Headers | Expected Status | Expected Response | Notes |
|---------|-------------|----------|---------|-----------------|-------------------|-------|
| A044 | Invalid JSON body | `POST /api/approvals/{id}/approve` | `Authorization: Bearer {token}` | 400 | `{"success": false, "message": "Invalid JSON format"}` | Malformed JSON should be rejected |
| A045 | Missing required fields | `POST /api/approvals/{id}/approve` | `Authorization: Bearer {token}` | 400 | `{"success": false, "message": "Validation failed"}` | Required fields validation |
| A046 | Invalid field types | `POST /api/approvals/{id}/approve` | `Authorization: Bearer {token}` | 400 | `{"success": false, "message": "Validation failed"}` | Type validation should work |
| A047 | Rate limiting | `GET /api/approvals/pending` | `Authorization: Bearer {token}` | 429 | `{"success": false, "message": "Too many requests"}` | Rate limiting should work |
| A048 | Server error simulation | `GET /api/approvals/pending` | `Authorization: Bearer {token}` | 500 | `{"success": false, "message": "Internal server error"}` | Server error handling |

### 8. Edge Cases

| Test ID | Description | Endpoint | Headers | Expected Status | Expected Response | Notes |
|---------|-------------|----------|---------|-----------------|-------------------|-------|
| A049 | Very long notes | `POST /api/approvals/{id}/approve` | `Authorization: Bearer {token}` | 400 | `{"success": false, "message": "Notes too long"}` | Notes length validation |
| A050 | Special characters in notes | `POST /api/approvals/{id}/approve` | `Authorization: Bearer {token}` | 200 | `{"success": true, "message": "Request approved successfully"}` | Special characters should be allowed |
| A051 | Unicode characters in notes | `POST /api/approvals/{id}/approve` | `Authorization: Bearer {token}` | 200 | `{"success": true, "message": "Request approved successfully"}` | Unicode should be supported |
| A052 | Empty request body | `POST /api/approvals/{id}/approve` | `Authorization: Bearer {token}` | 200 | `{"success": true, "message": "Request approved successfully"}` | Empty body should be allowed |
| A053 | Large request ID | `GET /api/approvals/{id}` | `Authorization: Bearer {token}` | 400 | `{"success": false, "message": "Invalid request ID format"}` | Large IDs should be rejected |

---

## Test Data Setup

### Required Tokens
- Platform Admin Token
- Company Super Admin Token  
- Admin Token
- User Token

### Required Test Data
- Valid UUIDs for requests and users
- Test approval requests in various states
- Test users with different roles
- Test companies with different configurations

### Test Environment
- All services running on localhost
- Database with test data
- Proper authentication setup
- Rate limiting configured

---

## Execution Notes

1. **Authentication**: All tests require valid Bearer tokens
2. **Data Cleanup**: Clean up test data after execution
3. **Order**: Some tests depend on previous test results
4. **Timing**: Allow time for database operations to complete
5. **Logging**: Monitor service logs during test execution

---

## Expected Results Summary

- **Total Tests**: 53
- **Success Cases**: 35
- **Error Cases**: 18
- **Authentication Tests**: 12
- **Authorization Tests**: 15
- **Validation Tests**: 10
- **Edge Case Tests**: 16
