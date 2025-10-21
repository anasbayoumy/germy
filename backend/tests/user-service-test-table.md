# 🧪 User Service Comprehensive Test Table

## 📋 Overview
This document provides a comprehensive test table for all User Service endpoints, including success cases, error cases, and edge cases for thorough testing.

## 🔑 Test Tokens Required
- **Platform Admin Token**: `admin@platform.com` / `AdminPass123!`
- **Super Admin Token**: `admin@newtestcompany2.com` / `SecurePass123!@#`
- **Admin Token**: `admin2@newtestcompany2.com` / `SecurePass123!@#`
- **User Token**: (Create a regular user first)

---

## 👥 User Management Endpoints

### 1. GET /api/users - List Users

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| List users (Platform Admin) | GET | `/api/users` | `Authorization: Bearer {platformAdminToken}` | - | 200 | `{success: true, data: {users: [...], pagination: {...}}}` | Should return all users |
| List users with pagination | GET | `/api/users?page=1&limit=10` | `Authorization: Bearer {platformAdminToken}` | - | 200 | `{success: true, data: {users: [...], pagination: {page: 1, limit: 10}}}` | Pagination test |
| List users with search | GET | `/api/users?search=john` | `Authorization: Bearer {platformAdminToken}` | - | 200 | `{success: true, data: {users: [...], pagination: {...}}}` | Search functionality |
| List users by role | GET | `/api/users?role=admin` | `Authorization: Bearer {platformAdminToken}` | - | 200 | `{success: true, data: {users: [...], pagination: {...}}}` | Filter by role |
| List active users only | GET | `/api/users?isActive=true` | `Authorization: Bearer {platformAdminToken}` | - | 200 | `{success: true, data: {users: [...], pagination: {...}}}` | Filter by status |
| **Error Cases** |
| No authentication | GET | `/api/users` | - | - | 401 | `{success: false, message: "Access token required"}` | Missing token |
| Invalid token | GET | `/api/users` | `Authorization: Bearer invalid_token` | - | 403 | `{success: false, message: "Invalid or expired token"}` | Invalid JWT |
| Invalid pagination | GET | `/api/users?page=0&limit=-1` | `Authorization: Bearer {platformAdminToken}` | - | 400 | `{success: false, message: "Validation failed"}` | Invalid params |

### 2. GET /api/users/search - Search Users

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Search by name | GET | `/api/users/search?q=john&limit=10` | `Authorization: Bearer {platformAdminToken}` | - | 200 | `{success: true, data: {users: [...], total: number}}` | Name search |
| Search by email | GET | `/api/users/search?q=admin@company.com&limit=10` | `Authorization: Bearer {platformAdminToken}` | - | 200 | `{success: true, data: {users: [...], total: number}}` | Email search |
| Search with no results | GET | `/api/users/search?q=nonexistent&limit=10` | `Authorization: Bearer {platformAdminToken}` | - | 200 | `{success: true, data: {users: [], total: 0}}` | No matches |
| **Error Cases** |
| Missing search query | GET | `/api/users/search?limit=10` | `Authorization: Bearer {platformAdminToken}` | - | 400 | `{success: false, message: "Search query is required"}` | Required field |
| Empty search query | GET | `/api/users/search?q=&limit=10` | `Authorization: Bearer {platformAdminToken}` | - | 400 | `{success: false, message: "Search query is required"}` | Empty string |

### 3. GET /api/users/:id - Get User by ID

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Get user (own profile) | GET | `/api/users/{userId}` | `Authorization: Bearer {userToken}` | - | 200 | `{success: true, data: {user: {...}}}` | User can view own profile |
| Get user (admin view) | GET | `/api/users/{userId}` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {user: {...}}}` | Admin can view any user |
| Get user (super admin view) | GET | `/api/users/{userId}` | `Authorization: Bearer {superAdminToken}` | - | 200 | `{success: true, data: {user: {...}}}` | Super admin can view any user |
| **Error Cases** |
| Invalid user ID format | GET | `/api/users/invalid-id` | `Authorization: Bearer {adminToken}` | - | 400 | `{success: false, message: "Invalid user ID format"}` | Invalid UUID |
| User not found | GET | `/api/users/00000000-0000-0000-0000-000000000000` | `Authorization: Bearer {adminToken}` | - | 404 | `{success: false, message: "User not found"}` | Non-existent user |
| Unauthorized access | GET | `/api/users/{otherUserId}` | `Authorization: Bearer {userToken}` | - | 403 | `{success: false, message: "Access denied"}` | User cannot view other profiles |

### 4. PUT /api/users/:id - Update User

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Update own profile | PUT | `/api/users/{userId}` | `Authorization: Bearer {userToken}` | `{"firstName": "John", "lastName": "Doe", "phone": "+1234567890"}` | 200 | `{success: true, data: {user: {...}}}` | User can update own profile |
| Update user (admin) | PUT | `/api/users/{userId}` | `Authorization: Bearer {adminToken}` | `{"position": "Senior Developer", "department": "Engineering"}` | 200 | `{success: true, data: {user: {...}}}` | Admin can update any user |
| Update user (super admin) | PUT | `/api/users/{userId}` | `Authorization: Bearer {superAdminToken}` | `{"salary": 75000, "isActive": true}` | 200 | `{success: true, data: {user: {...}}}` | Super admin can update any user |
| **Error Cases** |
| Invalid user ID | PUT | `/api/users/invalid-id` | `Authorization: Bearer {adminToken}` | `{"firstName": "John"}` | 400 | `{success: false, message: "Invalid user ID format"}` | Invalid UUID |
| Invalid phone format | PUT | `/api/users/{userId}` | `Authorization: Bearer {userToken}` | `{"phone": "invalid-phone"}` | 400 | `{success: false, message: "Invalid phone number format"}` | Validation error |
| Unauthorized update | PUT | `/api/users/{otherUserId}` | `Authorization: Bearer {userToken}` | `{"firstName": "John"}` | 403 | `{success: false, message: "Access denied"}` | User cannot update others |
| User not found | PUT | `/api/users/00000000-0000-0000-0000-000000000000` | `Authorization: Bearer {adminToken}` | `{"firstName": "John"}` | 404 | `{success: false, message: "User not found"}` | Non-existent user |

### 5. PATCH /api/users/:id/deactivate - Deactivate User

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Deactivate user (admin) | PATCH | `/api/users/{userId}` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {user: {...}}}` | Admin can deactivate user |
| Deactivate user (super admin) | PATCH | `/api/users/{userId}` | `Authorization: Bearer {superAdminToken}` | - | 200 | `{success: true, data: {user: {...}}}` | Super admin can deactivate user |
| **Error Cases** |
| Deactivate own account | PATCH | `/api/users/{userId}` | `Authorization: Bearer {userToken}` | - | 403 | `{success: false, message: "Cannot deactivate own account"}` | User cannot deactivate self |
| Unauthorized deactivation | PATCH | `/api/users/{otherUserId}` | `Authorization: Bearer {userToken}` | - | 403 | `{success: false, message: "Access denied"}` | User cannot deactivate others |
| User not found | PATCH | `/api/users/00000000-0000-0000-0000-000000000000` | `Authorization: Bearer {adminToken}` | - | 404 | `{success: false, message: "User not found"}` | Non-existent user |

---

## ⚙️ User Preferences & Settings

### 6. GET /api/users/:id/preferences - Get User Preferences

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Get own preferences | GET | `/api/users/{userId}/preferences` | `Authorization: Bearer {userToken}` | - | 200 | `{success: true, data: {preferences: {...}}}` | User can view own preferences |
| Get user preferences (admin) | GET | `/api/users/{userId}/preferences` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {preferences: {...}}}` | Admin can view any preferences |
| **Error Cases** |
| Unauthorized access | GET | `/api/users/{otherUserId}/preferences` | `Authorization: Bearer {userToken}` | - | 403 | `{success: false, message: "Access denied"}` | User cannot view others' preferences |

### 7. PUT /api/users/:id/preferences - Update User Preferences

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Update own preferences | PUT | `/api/users/{userId}/preferences` | `Authorization: Bearer {userToken}` | `{"theme": "dark", "language": "en", "timezone": "UTC"}` | 200 | `{success: true, data: {preferences: {...}}}` | User can update own preferences |
| Update user preferences (admin) | PUT | `/api/users/{userId}/preferences` | `Authorization: Bearer {adminToken}` | `{"theme": "light", "timeFormat": "24h"}` | 200 | `{success: true, data: {preferences: {...}}}` | Admin can update any preferences |
| **Error Cases** |
| Invalid theme | PUT | `/api/users/{userId}/preferences` | `Authorization: Bearer {userToken}` | `{"theme": "invalid"}` | 400 | `{success: false, message: "Invalid theme value"}` | Validation error |
| Invalid language code | PUT | `/api/users/{userId}/preferences` | `Authorization: Bearer {userToken}` | `{"language": "invalid"}` | 400 | `{success: false, message: "Invalid language code"}` | Validation error |
| Unauthorized update | PUT | `/api/users/{otherUserId}/preferences` | `Authorization: Bearer {userToken}` | `{"theme": "dark"}` | 403 | `{success: false, message: "Access denied"}` | User cannot update others' preferences |

### 8. GET /api/users/:id/settings - Get User Settings

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Get own settings | GET | `/api/users/{userId}/settings` | `Authorization: Bearer {userToken}` | - | 200 | `{success: true, data: {settings: {...}}}` | User can view own settings |
| Get user settings (admin) | GET | `/api/users/{userId}/settings` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {settings: {...}}}` | Admin can view any settings |

### 9. PUT /api/users/:id/settings - Update User Settings

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Update own settings | PUT | `/api/users/{userId}/settings` | `Authorization: Bearer {userToken}` | `{"workHoursStart": "09:00", "workHoursEnd": "17:00", "workDays": [1,2,3,4,5]}` | 200 | `{success: true, data: {settings: {...}}}` | User can update own settings |
| Update user settings (admin) | PUT | `/api/users/{userId}/settings` | `Authorization: Bearer {adminToken}` | `{"overtimeEnabled": true, "remoteWorkEnabled": true}` | 200 | `{success: true, data: {settings: {...}}}` | Admin can update any settings |
| **Error Cases** |
| Invalid time format | PUT | `/api/users/{userId}/settings` | `Authorization: Bearer {userToken}` | `{"workHoursStart": "25:00"}` | 400 | `{success: false, message: "Invalid time format"}` | Validation error |
| Invalid work days | PUT | `/api/users/{userId}/settings` | `Authorization: Bearer {userToken}` | `{"workDays": [0,8]}` | 400 | `{success: false, message: "Invalid work days"}` | Validation error |

---

## 📊 User Analytics & Activities

### 10. GET /api/users/:id/activities - Get User Activities

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Get own activities | GET | `/api/users/{userId}/activities` | `Authorization: Bearer {userToken}` | - | 200 | `{success: true, data: {activities: [...], pagination: {...}}}` | User can view own activities |
| Get user activities (admin) | GET | `/api/users/{userId}/activities` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {activities: [...], pagination: {...}}}` | Admin can view any activities |
| Get activities with pagination | GET | `/api/users/{userId}/activities?page=1&limit=10` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {activities: [...], pagination: {...}}}` | Pagination test |

### 11. GET /api/users/:id/statistics - Get User Statistics

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Get own statistics | GET | `/api/users/{userId}/statistics` | `Authorization: Bearer {userToken}` | - | 200 | `{success: true, data: {statistics: {...}}}` | User can view own statistics |
| Get user statistics (admin) | GET | `/api/users/{userId}/statistics` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {statistics: {...}}}` | Admin can view any statistics |

### 12. GET /api/users/:id/activity-summary - Get User Activity Summary

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Get activity summary (7 days) | GET | `/api/users/{userId}/activity-summary?days=7` | `Authorization: Bearer {userToken}` | - | 200 | `{success: true, data: {summary: {...}}}` | 7-day summary |
| Get activity summary (30 days) | GET | `/api/users/{userId}/activity-summary?days=30` | `Authorization: Bearer {userToken}` | - | 200 | `{success: true, data: {summary: {...}}}` | 30-day summary |

---

## 🏢 Company Analytics

### 13. GET /api/users/analytics/company/:companyId - Get Company User Analytics

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Get company analytics (admin) | GET | `/api/users/analytics/company/{companyId}` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {analytics: {...}}}` | Admin can view company analytics |
| Get company analytics (super admin) | GET | `/api/users/analytics/company/{companyId}` | `Authorization: Bearer {superAdminToken}` | - | 200 | `{success: true, data: {analytics: {...}}}` | Super admin can view company analytics |
| **Error Cases** |
| Unauthorized access | GET | `/api/users/analytics/company/{companyId}` | `Authorization: Bearer {userToken}` | - | 403 | `{success: false, message: "Access denied"}` | User cannot view company analytics |
| Invalid company ID | GET | `/api/users/analytics/company/invalid-id` | `Authorization: Bearer {adminToken}` | - | 400 | `{success: false, message: "Invalid company ID format"}` | Invalid UUID |

---

## 🔄 Bulk Operations

### 14. PUT /api/users/bulk/update - Bulk Update Users

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Bulk update users (admin) | PUT | `/api/users/bulk/update` | `Authorization: Bearer {adminToken}` | `{"userIds": ["uuid1", "uuid2"], "updateData": {"department": "Engineering"}}` | 200 | `{success: true, data: {updated: 2, failed: 0}}` | Admin can bulk update |
| Bulk update users (super admin) | PUT | `/api/users/bulk/update` | `Authorization: Bearer {superAdminToken}` | `{"userIds": ["uuid1"], "updateData": {"isActive": false}}` | 200 | `{success: true, data: {updated: 1, failed: 0}}` | Super admin can bulk update |
| **Error Cases** |
| Unauthorized bulk update | PUT | `/api/users/bulk/update` | `Authorization: Bearer {userToken}` | `{"userIds": ["uuid1"], "updateData": {"department": "Engineering"}}` | 403 | `{success: false, message: "Access denied"}` | User cannot bulk update |
| Empty user IDs | PUT | `/api/users/bulk/update` | `Authorization: Bearer {adminToken}` | `{"userIds": [], "updateData": {"department": "Engineering"}}` | 400 | `{success: false, message: "At least one user ID is required"}` | Validation error |
| Invalid user ID | PUT | `/api/users/bulk/update` | `Authorization: Bearer {adminToken}` | `{"userIds": ["invalid-id"], "updateData": {"department": "Engineering"}}` | 400 | `{success: false, message: "Invalid user ID format"}` | Validation error |

### 15. GET /api/users/export/company/:companyId - Export Users

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Export users (admin) | GET | `/api/users/export/company/{companyId}` | `Authorization: Bearer {adminToken}` | - | 200 | `Content-Type: application/csv` | CSV export |
| Export users (super admin) | GET | `/api/users/export/company/{companyId}` | `Authorization: Bearer {superAdminToken}` | - | 200 | `Content-Type: application/csv` | CSV export |

### 16. POST /api/users/import - Import Users

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Import users (admin) | POST | `/api/users/import` | `Authorization: Bearer {adminToken}` | `{"users": [{"firstName": "John", "lastName": "Doe", "email": "john@company.com"}]}` | 200 | `{success: true, data: {imported: 1, failed: 0}}` | Admin can import users |
| **Error Cases** |
| Unauthorized import | POST | `/api/users/import` | `Authorization: Bearer {userToken}` | `{"users": [{"firstName": "John"}]}` | 403 | `{success: false, message: "Access denied"}` | User cannot import |

---

## 👥 Team Management Endpoints

### 17. GET /api/teams - List Teams

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| List teams (admin) | GET | `/api/teams` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {teams: [...], pagination: {...}}}` | Admin can list teams |
| List teams with search | GET | `/api/teams?search=development` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {teams: [...], pagination: {...}}}` | Search functionality |
| **Error Cases** |
| Unauthorized access | GET | `/api/teams` | `Authorization: Bearer {userToken}` | - | 403 | `{success: false, message: "Access denied"}` | User cannot list teams |

### 18. POST /api/teams - Create Team

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Create team (admin) | POST | `/api/teams` | `Authorization: Bearer {adminToken}` | `{"name": "Development Team", "description": "Software development team", "managerId": "uuid"}` | 201 | `{success: true, data: {team: {...}}}` | Admin can create team |
| Create team (super admin) | POST | `/api/teams` | `Authorization: Bearer {superAdminToken}` | `{"name": "Marketing Team", "color": "#FF5733"}` | 201 | `{success: true, data: {team: {...}}}` | Super admin can create team |
| **Error Cases** |
| Unauthorized creation | POST | `/api/teams` | `Authorization: Bearer {userToken}` | `{"name": "Team"}` | 403 | `{success: false, message: "Access denied"}` | User cannot create team |
| Missing team name | POST | `/api/teams` | `Authorization: Bearer {adminToken}` | `{"description": "Team description"}` | 400 | `{success: false, message: "Team name is required"}` | Validation error |
| Invalid manager ID | POST | `/api/teams` | `Authorization: Bearer {adminToken}` | `{"name": "Team", "managerId": "invalid-id"}` | 400 | `{success: false, message: "Invalid manager ID format"}` | Validation error |

### 19. GET /api/teams/:id - Get Team by ID

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Get team (admin) | GET | `/api/teams/{teamId}` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {team: {...}}}` | Admin can view team |
| Get team (super admin) | GET | `/api/teams/{teamId}` | `Authorization: Bearer {superAdminToken}` | - | 200 | `{success: true, data: {team: {...}}}` | Super admin can view team |
| **Error Cases** |
| Invalid team ID | GET | `/api/teams/invalid-id` | `Authorization: Bearer {adminToken}` | - | 400 | `{success: false, message: "Invalid team ID format"}` | Invalid UUID |
| Team not found | GET | `/api/teams/00000000-0000-0000-0000-000000000000` | `Authorization: Bearer {adminToken}` | - | 404 | `{success: false, message: "Team not found"}` | Non-existent team |

### 20. PUT /api/teams/:id - Update Team

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Update team (admin) | PUT | `/api/teams/{teamId}` | `Authorization: Bearer {adminToken}` | `{"name": "Updated Team", "description": "Updated description"}` | 200 | `{success: true, data: {team: {...}}}` | Admin can update team |
| Update team (super admin) | PUT | `/api/teams/{teamId}` | `Authorization: Bearer {superAdminToken}` | `{"color": "#00FF00", "isActive": false}` | 200 | `{success: true, data: {team: {...}}}` | Super admin can update team |
| **Error Cases** |
| Unauthorized update | PUT | `/api/teams/{teamId}` | `Authorization: Bearer {userToken}` | `{"name": "Updated Team"}` | 403 | `{success: false, message: "Access denied"}` | User cannot update team |
| Invalid color format | PUT | `/api/teams/{teamId}` | `Authorization: Bearer {adminToken}` | `{"color": "invalid-color"}` | 400 | `{success: false, message: "Invalid color format"}` | Validation error |

### 21. DELETE /api/teams/:id - Delete Team

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Delete team (admin) | DELETE | `/api/teams/{teamId}` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, message: "Team deleted successfully"}` | Admin can delete team |
| Delete team (super admin) | DELETE | `/api/teams/{teamId}` | `Authorization: Bearer {superAdminToken}` | - | 200 | `{success: true, message: "Team deleted successfully"}` | Super admin can delete team |
| **Error Cases** |
| Unauthorized deletion | DELETE | `/api/teams/{teamId}` | `Authorization: Bearer {userToken}` | - | 403 | `{success: false, message: "Access denied"}` | User cannot delete team |
| Team not found | DELETE | `/api/teams/00000000-0000-0000-0000-000000000000` | `Authorization: Bearer {adminToken}` | - | 404 | `{success: false, message: "Team not found"}` | Non-existent team |

### 22. GET /api/teams/:id/members - Get Team Members

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Get team members (admin) | GET | `/api/teams/{teamId}/members` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {members: [...], total: number}}` | Admin can view team members |
| Get team members (super admin) | GET | `/api/teams/{teamId}/members` | `Authorization: Bearer {superAdminToken}` | - | 200 | `{success: true, data: {members: [...], total: number}}` | Super admin can view team members |

### 23. POST /api/teams/:id/members - Add Team Member

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Add team member (admin) | POST | `/api/teams/{teamId}/members` | `Authorization: Bearer {adminToken}` | `{"userId": "uuid", "roleInTeam": "member"}` | 200 | `{success: true, data: {member: {...}}}` | Admin can add team member |
| Add team member (super admin) | POST | `/api/teams/{teamId}/members` | `Authorization: Bearer {superAdminToken}` | `{"userId": "uuid", "roleInTeam": "lead"}` | 200 | `{success: true, data: {member: {...}}}` | Super admin can add team member |
| **Error Cases** |
| Unauthorized addition | POST | `/api/teams/{teamId}/members` | `Authorization: Bearer {userToken}` | `{"userId": "uuid"}` | 403 | `{success: false, message: "Access denied"}` | User cannot add team member |
| Invalid user ID | POST | `/api/teams/{teamId}/members` | `Authorization: Bearer {adminToken}` | `{"userId": "invalid-id"}` | 400 | `{success: false, message: "Invalid user ID format"}` | Validation error |
| Invalid role | POST | `/api/teams/{teamId}/members` | `Authorization: Bearer {adminToken}` | `{"userId": "uuid", "roleInTeam": "invalid-role"}` | 400 | `{success: false, message: "Invalid role in team"}` | Validation error |

### 24. DELETE /api/teams/:id/members/:userId - Remove Team Member

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Remove team member (admin) | DELETE | `/api/teams/{teamId}/members/{userId}` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, message: "Team member removed successfully"}` | Admin can remove team member |
| Remove team member (super admin) | DELETE | `/api/teams/{teamId}/members/{userId}` | `Authorization: Bearer {superAdminToken}` | - | 200 | `{success: true, message: "Team member removed successfully"}` | Super admin can remove team member |
| **Error Cases** |
| Unauthorized removal | DELETE | `/api/teams/{teamId}/members/{userId}` | `Authorization: Bearer {userToken}` | - | 403 | `{success: false, message: "Access denied"}` | User cannot remove team member |
| Invalid user ID | DELETE | `/api/teams/{teamId}/members/invalid-id` | `Authorization: Bearer {adminToken}` | - | 400 | `{success: false, message: "Invalid user ID format"}` | Validation error |

---

## 🏢 Department Management Endpoints

### 25. GET /api/departments - List Departments

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| List departments (admin) | GET | `/api/departments` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {departments: [...], pagination: {...}}}` | Admin can list departments |
| List departments with search | GET | `/api/departments?search=engineering` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {departments: [...], pagination: {...}}}` | Search functionality |
| **Error Cases** |
| Unauthorized access | GET | `/api/departments` | `Authorization: Bearer {userToken}` | - | 403 | `{success: false, message: "Access denied"}` | User cannot list departments |

### 26. GET /api/departments/hierarchy - Get Department Hierarchy

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Get hierarchy (admin) | GET | `/api/departments/hierarchy` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {hierarchy: {...}}}` | Admin can view hierarchy |
| Get hierarchy (super admin) | GET | `/api/departments/hierarchy` | `Authorization: Bearer {superAdminToken}` | - | 200 | `{success: true, data: {hierarchy: {...}}}` | Super admin can view hierarchy |

### 27. POST /api/departments - Create Department

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Create department (admin) | POST | `/api/departments` | `Authorization: Bearer {adminToken}` | `{"name": "Engineering", "description": "Software engineering department", "parentId": "uuid"}` | 201 | `{success: true, data: {department: {...}}}` | Admin can create department |
| Create department (super admin) | POST | `/api/departments` | `Authorization: Bearer {superAdminToken}` | `{"name": "Marketing", "description": "Marketing department"}` | 201 | `{success: true, data: {department: {...}}}` | Super admin can create department |
| **Error Cases** |
| Unauthorized creation | POST | `/api/departments` | `Authorization: Bearer {userToken}` | `{"name": "Department"}` | 403 | `{success: false, message: "Access denied"}` | User cannot create department |
| Missing department name | POST | `/api/departments` | `Authorization: Bearer {adminToken}` | `{"description": "Department description"}` | 400 | `{success: false, message: "Department name is required"}` | Validation error |

### 28. GET /api/departments/:id - Get Department by ID

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Get department (admin) | GET | `/api/departments/{departmentId}` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {department: {...}}}` | Admin can view department |
| Get department (super admin) | GET | `/api/departments/{departmentId}` | `Authorization: Bearer {superAdminToken}` | - | 200 | `{success: true, data: {department: {...}}}` | Super admin can view department |
| **Error Cases** |
| Invalid department ID | GET | `/api/departments/invalid-id` | `Authorization: Bearer {adminToken}` | - | 400 | `{success: false, message: "Invalid department ID format"}` | Invalid UUID |
| Department not found | GET | `/api/departments/00000000-0000-0000-0000-000000000000` | `Authorization: Bearer {adminToken}` | - | 404 | `{success: false, message: "Department not found"}` | Non-existent department |

### 29. PUT /api/departments/:id - Update Department

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Update department (admin) | PUT | `/api/departments/{departmentId}` | `Authorization: Bearer {adminToken}` | `{"name": "Updated Department", "description": "Updated description"}` | 200 | `{success: true, data: {department: {...}}}` | Admin can update department |
| Update department (super admin) | PUT | `/api/departments/{departmentId}` | `Authorization: Bearer {superAdminToken}` | `{"isActive": false}` | 200 | `{success: true, data: {department: {...}}}` | Super admin can update department |
| **Error Cases** |
| Unauthorized update | PUT | `/api/departments/{departmentId}` | `Authorization: Bearer {userToken}` | `{"name": "Updated Department"}` | 403 | `{success: false, message: "Access denied"}` | User cannot update department |

### 30. DELETE /api/departments/:id - Delete Department

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Delete department (admin) | DELETE | `/api/departments/{departmentId}` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, message: "Department deleted successfully"}` | Admin can delete department |
| Delete department (super admin) | DELETE | `/api/departments/{departmentId}` | `Authorization: Bearer {superAdminToken}` | - | 200 | `{success: true, message: "Department deleted successfully"}` | Super admin can delete department |
| **Error Cases** |
| Unauthorized deletion | DELETE | `/api/departments/{departmentId}` | `Authorization: Bearer {userToken}` | - | 403 | `{success: false, message: "Access denied"}` | User cannot delete department |
| Department not found | DELETE | `/api/departments/00000000-0000-0000-0000-000000000000` | `Authorization: Bearer {adminToken}` | - | 404 | `{success: false, message: "Department not found"}` | Non-existent department |

### 31. GET /api/departments/:id/users - Get Department Users

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Get department users (admin) | GET | `/api/departments/{departmentId}/users` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {users: [...], total: number}}` | Admin can view department users |
| Get department users (super admin) | GET | `/api/departments/{departmentId}/users` | `Authorization: Bearer {superAdminToken}` | - | 200 | `{success: true, data: {users: [...], total: number}}` | Super admin can view department users |

### 32. POST /api/departments/:id/users - Add Department User

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Add department user (admin) | POST | `/api/departments/{departmentId}/users` | `Authorization: Bearer {adminToken}` | `{"userId": "uuid"}` | 200 | `{success: true, data: {user: {...}}}` | Admin can add department user |
| Add department user (super admin) | POST | `/api/departments/{departmentId}/users` | `Authorization: Bearer {superAdminToken}` | `{"userId": "uuid"}` | 200 | `{success: true, data: {user: {...}}}` | Super admin can add department user |
| **Error Cases** |
| Unauthorized addition | POST | `/api/departments/{departmentId}/users` | `Authorization: Bearer {userToken}` | `{"userId": "uuid"}` | 403 | `{success: false, message: "Access denied"}` | User cannot add department user |
| Invalid user ID | POST | `/api/departments/{departmentId}/users` | `Authorization: Bearer {adminToken}` | `{"userId": "invalid-id"}` | 400 | `{success: false, message: "Invalid user ID format"}` | Validation error |

### 33. DELETE /api/departments/:id/users/:userId - Remove Department User

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Remove department user (admin) | DELETE | `/api/departments/{departmentId}/users/{userId}` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, message: "Department user removed successfully"}` | Admin can remove department user |
| Remove department user (super admin) | DELETE | `/api/departments/{departmentId}/users/{userId}` | `Authorization: Bearer {superAdminToken}` | - | 200 | `{success: true, message: "Department user removed successfully"}` | Super admin can remove department user |
| **Error Cases** |
| Unauthorized removal | DELETE | `/api/departments/{departmentId}/users/{userId}` | `Authorization: Bearer {userToken}` | - | 403 | `{success: false, message: "Access denied"}` | User cannot remove department user |
| Invalid user ID | DELETE | `/api/departments/{departmentId}/users/invalid-id` | `Authorization: Bearer {adminToken}` | - | 400 | `{success: false, message: "Invalid user ID format"}` | Validation error |

---

## 📁 File Upload Endpoints

### 34. POST /api/files/profiles/:userId - Upload Profile Picture

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Upload own profile picture | POST | `/api/files/profiles/{userId}` | `Authorization: Bearer {userToken}`, `Content-Type: multipart/form-data` | `file: image.jpg` | 200 | `{success: true, data: {file: {...}}}` | User can upload own picture |
| Upload user profile picture (admin) | POST | `/api/files/profiles/{userId}` | `Authorization: Bearer {adminToken}`, `Content-Type: multipart/form-data` | `file: image.jpg` | 200 | `{success: true, data: {file: {...}}}` | Admin can upload any picture |
| **Error Cases** |
| Unauthorized upload | POST | `/api/files/profiles/{otherUserId}` | `Authorization: Bearer {userToken}`, `Content-Type: multipart/form-data` | `file: image.jpg` | 403 | `{success: false, message: "Access denied"}` | User cannot upload for others |
| No file provided | POST | `/api/files/profiles/{userId}` | `Authorization: Bearer {userToken}`, `Content-Type: multipart/form-data` | - | 400 | `{success: false, message: "No file provided"}` | Missing file |
| Invalid file type | POST | `/api/files/profiles/{userId}` | `Authorization: Bearer {userToken}`, `Content-Type: multipart/form-data` | `file: document.pdf` | 400 | `{success: false, message: "Invalid file type"}` | Wrong file type |
| File too large | POST | `/api/files/profiles/{userId}` | `Authorization: Bearer {userToken}`, `Content-Type: multipart/form-data` | `file: large-image.jpg` | 400 | `{success: false, message: "File too large"}` | Size limit exceeded |

### 35. DELETE /api/files/profiles/:userId - Delete Profile Picture

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Delete own profile picture | DELETE | `/api/files/profiles/{userId}` | `Authorization: Bearer {userToken}` | - | 200 | `{success: true, message: "Profile picture deleted successfully"}` | User can delete own picture |
| Delete user profile picture (admin) | DELETE | `/api/files/profiles/{userId}` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, message: "Profile picture deleted successfully"}` | Admin can delete any picture |
| **Error Cases** |
| Unauthorized deletion | DELETE | `/api/files/profiles/{otherUserId}` | `Authorization: Bearer {userToken}` | - | 403 | `{success: false, message: "Access denied"}` | User cannot delete others' pictures |
| No picture to delete | DELETE | `/api/files/profiles/{userId}` | `Authorization: Bearer {userToken}` | - | 404 | `{success: false, message: "No profile picture found"}` | No picture exists |

### 36. GET /api/files/profiles/:userId - Get Profile Picture

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Get own profile picture | GET | `/api/files/profiles/{userId}` | `Authorization: Bearer {userToken}` | - | 200 | `Content-Type: image/jpeg` | User can view own picture |
| Get user profile picture (admin) | GET | `/api/files/profiles/{userId}` | `Authorization: Bearer {adminToken}` | - | 200 | `Content-Type: image/jpeg` | Admin can view any picture |
| **Error Cases** |
| No picture found | GET | `/api/files/profiles/{userId}` | `Authorization: Bearer {userToken}` | - | 404 | `{success: false, message: "No profile picture found"}` | No picture exists |

### 37. GET /api/files/profiles/:userId/files - List User Files

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| List own files | GET | `/api/files/profiles/{userId}/files` | `Authorization: Bearer {userToken}` | - | 200 | `{success: true, data: {files: [...]}}` | User can list own files |
| List user files (admin) | GET | `/api/files/profiles/{userId}/files` | `Authorization: Bearer {adminToken}` | - | 200 | `{success: true, data: {files: [...]}}` | Admin can list any files |
| **Error Cases** |
| Unauthorized access | GET | `/api/files/profiles/{otherUserId}/files` | `Authorization: Bearer {userToken}` | - | 403 | `{success: false, message: "Access denied"}` | User cannot list others' files |

### 38. GET /api/files/profiles/:userId/files/:filename - Serve File

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Serve own file | GET | `/api/files/profiles/{userId}/files/image.jpg` | `Authorization: Bearer {userToken}` | - | 200 | `Content-Type: image/jpeg` | User can serve own file |
| Serve user file (admin) | GET | `/api/files/profiles/{userId}/files/image.jpg` | `Authorization: Bearer {adminToken}` | - | 200 | `Content-Type: image/jpeg` | Admin can serve any file |
| **Error Cases** |
| Unauthorized access | GET | `/api/files/profiles/{otherUserId}/files/image.jpg` | `Authorization: Bearer {userToken}` | - | 403 | `{success: false, message: "Access denied"}` | User cannot serve others' files |
| File not found | GET | `/api/files/profiles/{userId}/files/nonexistent.jpg` | `Authorization: Bearer {userToken}` | - | 404 | `{success: false, message: "File not found"}` | Non-existent file |

### 39. DELETE /api/files/profiles/:userId/files/bulk - Bulk Delete Files

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Bulk delete own files | DELETE | `/api/files/profiles/{userId}/files/bulk` | `Authorization: Bearer {userToken}` | `{"filenames": ["image1.jpg", "image2.jpg"]}` | 200 | `{success: true, data: {deleted: 2, failed: 0}}` | User can bulk delete own files |
| Bulk delete user files (admin) | DELETE | `/api/files/profiles/{userId}/files/bulk` | `Authorization: Bearer {adminToken}` | `{"filenames": ["image1.jpg"]}` | 200 | `{success: true, data: {deleted: 1, failed: 0}}` | Admin can bulk delete any files |
| **Error Cases** |
| Unauthorized bulk deletion | DELETE | `/api/files/profiles/{otherUserId}/files/bulk` | `Authorization: Bearer {userToken}` | `{"filenames": ["image1.jpg"]}` | 403 | `{success: false, message: "Access denied"}` | User cannot bulk delete others' files |
| Empty filenames | DELETE | `/api/files/profiles/{userId}/files/bulk` | `Authorization: Bearer {userToken}` | `{"filenames": []}` | 400 | `{success: false, message: "At least one filename is required"}` | Validation error |

---

## 🔍 Health Check

### 40. GET /health - Health Check

| Test Case | Method | Endpoint | Headers | Body | Expected Status | Expected Response | Notes |
|-----------|--------|----------|---------|------|----------------|-------------------|-------|
| **Success Cases** |
| Health check | GET | `/health` | - | - | 200 | `{success: true, message: "User Service is running", service: "user-service", version: "1.0.0"}` | Service health status |

---

## 📝 Test Execution Notes

### Prerequisites
1. **User Service Running**: Ensure user service is running on port 3003
2. **Database Connected**: Ensure PostgreSQL database is running and connected
3. **Auth Service Running**: Ensure auth service is running for token validation
4. **Test Data**: Create test users, teams, and departments for testing

### Test Data Setup
```bash
# Create test users with different roles
# Create test teams
# Create test departments
# Upload test files
```

### Token Management
- Get fresh tokens before each test session
- Tokens expire after 24 hours
- Use appropriate tokens for each role-based test

### Expected Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

---

## 🎯 Test Coverage Summary

- **User Management**: 15 test cases
- **User Preferences & Settings**: 4 test cases  
- **User Analytics & Activities**: 3 test cases
- **Company Analytics**: 1 test case
- **Bulk Operations**: 3 test cases
- **Team Management**: 8 test cases
- **Department Management**: 9 test cases
- **File Upload**: 6 test cases
- **Health Check**: 1 test case

**Total: 50 comprehensive test cases**

This test table covers all major functionality of the User Service with success cases, error cases, and edge cases for thorough testing.

