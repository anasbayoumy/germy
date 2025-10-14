# Germy Backend - Comprehensive Test Scenarios

## Overview
This document outlines comprehensive test scenarios for the Germy attendance system backend services, including the correct face encoding flow and API testing procedures.

## Face Encoding Flow - Complete Sequence

### Current Implementation Issues
The current `face-encoding.controller.ts` is **incomplete** and doesn't follow the proper microservices architecture. Here's what's wrong and how it should work:

### ❌ Current (Incorrect) Flow:
```
Mobile App → Auth Service → Database
```
- Auth service receives pre-encoded data
- No actual AI processing
- No quality validation
- No integration with AI service

### ✅ Correct Flow:
```
Mobile App → Auth Service → AI Service → ArcFace Model → Auth Service → Database
```

### Detailed Correct Sequence:

1. **Mobile App** captures photo and sends to Auth Service
   ```
   POST /api/face-encoding/{userId}
   Body: {
     "photo": "base64_image_data",
     "metadata": {
       "deviceInfo": "iPhone 14 Pro",
       "lighting": "good",
       "angle": "front",
       "timestamp": "2024-01-15T10:30:00Z"
     }
   }
   ```

2. **Auth Service** validates request and forwards to AI Service
   ```
   POST http://ai-service:3004/api/ai/encode-face
   Body: {
     "image": "base64_image_data",
     "userId": "uuid",
     "companyId": "uuid",
     "metadata": {...}
   }
   ```

3. **AI Service** processes image with ArcFace model
   - Load ArcFace model
   - Preprocess image (resize to 112x112, normalize)
   - Extract facial features (512-dimensional vector)
   - Calculate quality score (0-1)
   - Return encoding and quality

4. **AI Service** responds to Auth Service
   ```
   Response: {
     "success": true,
     "encoding": [0.1, 0.2, 0.3, ...], // 512-dim vector
     "qualityScore": 0.95,
     "processingTime": 150,
     "metadata": {
       "modelVersion": "arcface_v1.0",
       "faceDetected": true,
       "confidence": 0.98
     }
   }
   ```

5. **Auth Service** stores encrypted encoding in database
   - Encrypt encoding data
   - Store in `face_encodings` table
   - Set expiration date (45 days from now)
   - Update user's face encoding fields

## Test Scenarios

### 1. Authentication & Authorization Tests

#### 1.1 Platform Admin Flow
```http
# Register Platform Admin
POST /api/auth/register/platform-admin
# Login Platform Admin
POST /api/auth/login/platform-admin
# Create Company
POST /api/platform/companies
```

#### 1.2 Company Super Admin Flow
```http
# Register Company Super Admin
POST /api/auth/register/company-super-admin
# Login Company Super Admin
POST /api/auth/login/admin
```

#### 1.3 Company Admin Flow
```http
# Register Company Admin
POST /api/auth/register/company-admin
# Login Company Admin
POST /api/auth/login/admin
```

#### 1.4 Employee Flow
```http
# Register Employee
POST /api/auth/register/employee
# Login Employee
POST /api/auth/login/user
```

### 2. Face Encoding Tests

#### 2.1 Successful Face Encoding
```http
# Step 1: Capture and send photo
POST /api/face-encoding/{userId}
Authorization: Bearer {userToken}
Body: {
  "photo": "base64_image_data",
  "metadata": {
    "deviceInfo": "iPhone 14 Pro",
    "lighting": "good",
    "angle": "front"
  }
}

# Expected Response:
{
  "success": true,
  "message": "Face encoding created successfully",
  "data": {
    "encodingId": "uuid",
    "qualityScore": 0.95,
    "expiresAt": "2024-03-01T10:30:00Z",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 2.2 Face Encoding Quality Validation
```http
# Test with low-quality image
POST /api/face-encoding/{userId}
Body: {
  "photo": "low_quality_base64_image",
  "metadata": {
    "lighting": "poor",
    "angle": "side"
  }
}

# Expected Response:
{
  "success": false,
  "message": "Face encoding quality too low",
  "error": {
    "qualityScore": 0.45,
    "minimumRequired": 0.7,
    "suggestions": [
      "Improve lighting",
      "Face the camera directly",
      "Move closer to camera"
    ]
  }
}
```

#### 2.3 Face Encoding Expiration
```http
# Check encoding status
GET /api/face-encoding/{userId}/status

# Expected Response:
{
  "success": true,
  "data": {
    "hasEncoding": true,
    "qualityScore": 0.95,
    "createdAt": "2024-01-15T10:30:00Z",
    "expiresAt": "2024-03-01T10:30:00Z",
    "daysUntilExpiration": 15,
    "needsRefresh": false
  }
}
```

### 3. Approval Workflow Tests

#### 3.1 New User Approval
```http
# Admin creates approval request for new user
POST /api/approvals/requests
Authorization: Bearer {adminToken}
Body: {
  "userId": "uuid",
  "companyId": "uuid",
  "requestedRole": "user",
  "reason": "New employee onboarding"
}

# Admin approves user
POST /api/approvals/requests/{requestId}/approve
Authorization: Bearer {adminToken}
Body: {
  "reviewNotes": "Approved after background check"
}
```

#### 3.2 Role Change Approval
```http
# User requests role change
POST /api/approvals/requests
Authorization: Bearer {userToken}
Body: {
  "userId": "uuid",
  "requestedRole": "admin",
  "reason": "Promotion to team lead"
}

# Super Admin approves role change
POST /api/approvals/requests/{requestId}/approve
Authorization: Bearer {superAdminToken}
Body: {
  "reviewNotes": "Approved based on performance review"
}
```

### 4. Work Mode Management Tests

#### 4.1 Hybrid Work Setup
```http
# Admin sets user to hybrid work mode
PUT /api/users/{userId}/work-mode
Authorization: Bearer {adminToken}
Body: {
  "workMode": "hybrid",
  "hybridRemoteDays": 3,
  "preferredRemoteDays": ["monday", "wednesday", "friday"],
  "homeAddress": "456 Home Street, Remote City, RC 12345",
  "homeLatitude": 37.7749,
  "homeLongitude": -122.4194,
  "homeGeofenceRadius": 100
}
```

#### 4.2 Work Schedule Management
```http
# Create work schedule
POST /api/users/{userId}/work-schedule
Authorization: Bearer {adminToken}
Body: {
  "scheduleDate": "2024-01-15",
  "workMode": "remote",
  "notes": "Working from home due to weather"
}
```

### 5. Error Scenarios

#### 5.1 Authentication Errors
```http
# Invalid credentials
POST /api/auth/login/user
Body: {
  "email": "user@company.com",
  "password": "wrongpassword"
}

# Expected Response:
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### 5.2 Authorization Errors
```http
# User trying to access admin endpoints
GET /api/approvals/pending
Authorization: Bearer {userToken}

# Expected Response:
{
  "success": false,
  "message": "Insufficient permissions",
  "error": {
    "requiredRole": "admin",
    "userRole": "user"
  }
}
```

#### 5.3 Validation Errors
```http
# Missing required fields
POST /api/auth/register/employee
Body: {
  "email": "user@company.com"
  // Missing password, firstName, lastName, etc.
}

# Expected Response:
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password is required"
    },
    {
      "field": "firstName",
      "message": "First name is required"
    }
  ]
}
```

## Testing Tools

### 1. HTTP Client (VS Code REST Client)
- Use the provided `.http` files
- Set up environment variables for tokens
- Run tests in sequence

### 2. Postman Collection
- Import the HTTP files into Postman
- Set up environment variables
- Create automated test scripts

### 3. Automated Testing
```bash
# Run integration tests
npm run test:integration

# Run specific service tests
npm run test:auth
npm run test:user
```

## Test Data Setup

### 1. Database Seeding
```sql
-- Insert test companies
INSERT INTO companies (id, name, domain) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Test Company Inc', 'testcompany.com');

-- Insert test users
INSERT INTO users (id, email, role, company_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'user@company.com', 'user', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440002', 'admin@company.com', 'admin', '550e8400-e29b-41d4-a716-446655440000');
```

### 2. Test Images
- Use base64 encoded test images
- Include various quality levels
- Test different angles and lighting conditions

## Performance Testing

### 1. Load Testing
```bash
# Test concurrent face encoding requests
artillery run face-encoding-load-test.yml
```

### 2. Stress Testing
```bash
# Test system limits
k6 run stress-test.js
```

## Security Testing

### 1. Authentication Bypass
- Test with invalid tokens
- Test with expired tokens
- Test with malformed tokens

### 2. Authorization Bypass
- Test role escalation
- Test cross-company access
- Test privilege escalation

### 3. Input Validation
- Test SQL injection
- Test XSS attacks
- Test file upload vulnerabilities

## Monitoring & Observability

### 1. Health Checks
```http
GET /health
GET /api/health/detailed
```

### 2. Metrics
```http
GET /metrics
GET /api/metrics/custom
```

### 3. Logs
- Check service logs for errors
- Monitor performance metrics
- Track user activities

## Continuous Integration

### 1. Pre-commit Hooks
```bash
# Run linting and tests
npm run pre-commit
```

### 2. CI/CD Pipeline
```yaml
# GitHub Actions workflow
name: Test Backend Services
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm run test:all
```

This comprehensive testing approach ensures the Germy backend services are robust, secure, and performant.
