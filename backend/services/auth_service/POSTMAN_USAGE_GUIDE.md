# 📚 Postman Usage Guide - Auth Service

## 🚀 Quick Start (5 Minutes)

### Step 1: Import Files
1. **Open Postman**
2. **Import Collection**: Click "Import" → Select `Auth_Service_Complete_Collection.postman_collection.json`
3. **Import Environment**: Click "Import" → Select `Auth_Service_Environment.postman_environment.json`
4. **Select Environment**: Click environment dropdown → Select "Auth Service Environment"

### Step 2: Start Services
```bash
# Navigate to backend directory
cd backend

# Start all services
docker-compose up -d

# Wait for services to be ready (30 seconds)
```

### Step 3: Run Basic Tests
1. **Open Collection**: "Auth Service - Complete API Collection"
2. **Run Authentication**: Go to "🔐 Authentication Endpoints" → Run "Platform Admin Login"
3. **Check Results**: Verify token is generated and saved

## 📋 Detailed Step-by-Step Guide

### Phase 1: Environment Setup (2 minutes)

#### 1.1 Import Collection
```
1. Open Postman
2. Click "Import" button (top left)
3. Select "Auth_Service_Complete_Collection.postman_collection.json"
4. Click "Import"
```

#### 1.2 Import Environment
```
1. Click "Import" button again
2. Select "Auth_Service_Environment.postman_environment.json"
3. Click "Import"
```

#### 1.3 Select Environment
```
1. Click environment dropdown (top right)
2. Select "Auth Service Environment"
3. Verify baseUrl is set to "http://localhost:3001"
```

### Phase 2: Service Startup (1 minute)

#### 2.1 Start Docker Services
```bash
# Navigate to project directory
cd C:\Users\anasb\Desktop\germy\backend

# Start all services
docker-compose up -d

# Check if services are running
docker ps
```

#### 2.2 Verify Services
```bash
# Check auth service health
curl http://localhost:3001/health

# Expected response: {"success":true,"message":"Auth Service is running"}
```

### Phase 3: Basic Authentication Test (3 minutes)

#### 3.1 Test Platform Admin Login
```
1. Open "Auth Service - Complete API Collection"
2. Expand "🔐 Authentication Endpoints"
3. Click "Platform Admin Login"
4. Click "Send"
5. Verify response: Status 200, success: true
6. Check that platformToken variable is set
```

#### 3.2 Test Service Health
```
1. Go to "🏥 Health & Status"
2. Click "Health Check"
3. Click "Send"
4. Verify response: Service is running
```

### Phase 4: User Registration Flow (5 minutes)

#### 4.1 Register Company
```
1. Go to "👤 User Registration"
2. Click "Register Company (Super Admin)"
3. Update request body with your test data:
   {
     "companyName": "My Test Company",
     "companyDomain": "mytestcompany.com",
     "firstName": "Super",
     "lastName": "Admin",
     "email": "superadmin@mytestcompany.com",
     "password": "admin123",
     "phone": "+1234567890"
   }
4. Click "Send"
5. Verify: Status 200, company created
```

#### 4.2 Login as Super Admin
```
1. Go to "🔐 Authentication Endpoints"
2. Click "Company Super Admin Login"
3. Update email to: "superadmin@mytestcompany.com"
4. Click "Send"
5. Verify: Token generated and saved
```

#### 4.3 Register Admin
```
1. Go to "👤 User Registration"
2. Click "Register Admin (by Super Admin)"
3. Click "Send"
4. Verify: Admin created successfully
```

#### 4.4 Register User
```
1. Click "Register User (by Admin)"
2. Update request body:
   {
     "firstName": "Test",
     "lastName": "User",
     "email": "user@mytestcompany.com",
     "password": "user123",
     "phone": "+1234567890",
     "position": "Developer",
     "department": "Engineering"
   }
3. Click "Send"
4. Verify: User created successfully
```

### Phase 5: Approval Workflow Test (5 minutes)

#### 5.1 Test Domain-Based Registration
```
1. Click "Register User with Domain"
2. Update request body:
   {
     "companyDomain": "mytestcompany.com",
     "firstName": "Domain",
     "lastName": "User",
     "email": "domainuser@mytestcompany.com",
     "password": "user123",
     "phone": "+1234567890",
     "position": "Designer",
     "department": "Design"
   }
3. Click "Send"
4. Verify: User created with pending approval
```

#### 5.2 Check Approval Requests
```
1. Go to "✅ Approval Management"
2. Click "Get All Approval Requests"
3. Click "Send"
4. Verify: Approval requests listed
```

#### 5.3 Approve User Request
```
1. Click "Approve User Request"
2. Update requestId in URL to actual ID from previous response
3. Click "Send"
4. Verify: User approved successfully
```

### Phase 6: Platform Management Test (3 minutes)

#### 6.1 Test Platform Endpoints
```
1. Go to "🏢 Platform Management"
2. Click "Get Platform Status"
3. Click "Send"
4. Verify: Platform status retrieved

5. Click "Get All Companies"
6. Click "Send"
7. Verify: Companies listed
```

#### 6.2 Test Company Management
```
1. Click "Get Company Details"
2. Update companyId in URL to your test company ID
3. Click "Send"
4. Verify: Company details retrieved
```

### Phase 7: User Management Test (3 minutes)

#### 7.1 Test Profile Management
```
1. Go to "👥 User Management"
2. Click "Get User Profile"
3. Click "Send"
4. Verify: User profile retrieved

5. Click "Update User Profile"
6. Update request body with new data
7. Click "Send"
8. Verify: Profile updated
```

#### 7.2 Test User Activation
```
1. Click "Deactivate User"
2. Update userId in request body
3. Click "Send"
4. Verify: User deactivated

5. Click "Reactivate User"
6. Click "Send"
7. Verify: User reactivated
```

### Phase 8: Advanced Features Test (5 minutes)

#### 8.1 Test Password Management
```
1. Go to "🔑 Password Management"
2. Click "Request Password Reset"
3. Update email in request body
4. Click "Send"
5. Verify: Reset request processed
```

#### 8.2 Test Token Management
```
1. Go to "🔒 Token Management"
2. Click "Verify Token"
3. Click "Send"
4. Verify: Token verified

5. Click "Get Token Info"
6. Click "Send"
7. Verify: Token info retrieved
```

## 🔧 Troubleshooting Guide

### Common Issues

#### Issue: "Connection Refused"
**Solution**:
```bash
# Check if services are running
docker ps

# Restart services if needed
docker-compose restart
```

#### Issue: "Invalid Credentials"
**Solution**:
1. Check if user exists in database
2. Verify email and password are correct
3. Try creating user first

#### Issue: "Token Not Found"
**Solution**:
1. Run login requests first
2. Check environment variables
3. Verify token is saved

#### Issue: "Permission Denied"
**Solution**:
1. Check user role
2. Verify endpoint permissions
3. Use correct token for role

### Debug Steps

#### 1. Check Service Logs
```bash
# Check auth service logs
docker logs backend-auth-service-1

# Check database logs
docker logs backend-db-1
```

#### 2. Verify Environment Variables
```
1. In Postman, click environment dropdown
2. Click "View" next to environment name
3. Verify all variables are set correctly
```

#### 3. Test Individual Endpoints
```
1. Start with health check
2. Test authentication
3. Test basic endpoints
4. Test complex workflows
```

## 📊 Test Results Validation

### Success Indicators
- ✅ All requests return 200 status
- ✅ Tokens are generated and saved
- ✅ Users can be created and managed
- ✅ Approvals work correctly
- ✅ Platform management functions

### Error Indicators
- ❌ Connection refused (services not running)
- ❌ 401 Unauthorized (authentication issues)
- ❌ 403 Forbidden (permission issues)
- ❌ 400 Bad Request (validation errors)
- ❌ 500 Internal Server Error (server issues)

## 🎯 Best Practices

### 1. Test Sequence
```
1. Start services
2. Test health endpoints
3. Test authentication
4. Test user creation
5. Test user management
6. Test platform features
7. Test approval workflow
```

### 2. Data Management
```
1. Use unique test data
2. Clean up after testing
3. Use environment variables
4. Document test results
```

### 3. Error Handling
```
1. Check response codes
2. Verify error messages
3. Test edge cases
4. Monitor service logs
```

## 📈 Performance Testing

### Load Testing
```
1. Run multiple concurrent requests
2. Monitor response times
3. Check for rate limiting
4. Verify service stability
```

### Stress Testing
```
1. Create many users
2. Test with large datasets
3. Monitor memory usage
4. Check database performance
```

## 🔄 Continuous Testing

### Automated Testing
```
1. Export collection as Newman script
2. Set up CI/CD pipeline
3. Run tests automatically
4. Monitor test results
```

### Regular Testing
```
1. Run tests after code changes
2. Test new features
3. Verify bug fixes
4. Monitor service health
```

---

**🎉 You're now ready to test the Auth Service comprehensively!**

For additional help, check the `COMPREHENSIVE_TEST_SCENARIOS.md` file for detailed test cases.
