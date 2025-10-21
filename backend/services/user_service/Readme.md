# 👥 Germy User Service

## **📋 Overview**
The User Service is a comprehensive microservice that handles user management, preferences, settings, analytics, and bulk operations for the Germy AI-powered attendance platform.

## **🚀 Features**

### **Core Functionality**
- **User Management**: CRUD operations for users
- **User Preferences**: Personal settings and preferences
- **User Settings**: Work-related configurations
- **User Analytics**: Statistics and activity tracking
- **Bulk Operations**: Import, export, and bulk updates
- **Search & Filtering**: Advanced user search capabilities

### **Security Features**
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permission system
- **Company Scoping**: Users can only access their company's data
- **Input Validation**: Comprehensive data validation
- **SQL Injection Prevention**: Parameterized queries

## **🔧 Technical Stack**

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens
- **Validation**: Zod schemas
- **Logging**: Winston
- **Containerization**: Docker

## **📁 Project Structure**

```
user_service/
├── src/
│   ├── controllers/          # Request handlers
│   ├── services/            # Business logic
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   ├── schemas/             # Validation schemas
│   ├── db/                  # Database configuration
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
├── tests/                   # Test files
├── Dockerfile              # Container configuration
├── package.json            # Dependencies
└── README.md              # This file
```

## **🔌 API Endpoints**

### **User Management**
- `GET /api/users` - Get paginated users list
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (full)
- `PATCH /api/users/:id` - Update user (partial)
- `PATCH /api/users/:id/deactivate` - Deactivate user

### **User Preferences**
- `GET /api/users/:id/preferences` - Get user preferences
- `PUT /api/users/:id/preferences` - Update user preferences

### **User Activities**
- `GET /api/users/:id/activities` - Get user activities

### **User Settings**
- `GET /api/users/:id/settings` - Get user settings
- `PUT /api/users/:id/settings` - Update user settings

### **User Analytics**
- `GET /api/users/:id/statistics` - Get user statistics
- `GET /api/users/:id/activity-summary` - Get activity summary
- `GET /api/users/analytics/company/:companyId` - Get company analytics

### **Bulk Operations**
- `PUT /api/users/bulk/update` - Bulk update users
- `GET /api/users/export/company/:companyId` - Export users
- `POST /api/users/import` - Import users

### **Health Check**
- `GET /health` - Service health status

## **🔐 Authentication & Authorization**

### **Authentication**
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

### **Authorization Levels**
- **User**: Can access own data only
- **Company Admin**: Can access company users
- **Company Super Admin**: Can access company users and analytics
- **Platform Admin**: Can access all users and analytics

## **📊 Data Models**

### **User Model**
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  position?: string;
  department?: string;
  hireDate?: Date;
  salary?: number;
  profilePhotoUrl?: string;
  role: 'user' | 'company_admin' | 'company_super_admin' | 'platform_admin';
  companyId: string;
  isActive: boolean;
  isVerified: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  mobileAppAccess: boolean;
  dashboardAccess: boolean;
  platformPanelAccess: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### **User Preferences Model**
```typescript
interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notifications: Record<string, any>;
  privacy: Record<string, any>;
}
```

### **User Settings Model**
```typescript
interface UserSettings {
  workHoursStart: string; // HH:MM format
  workHoursEnd: string;    // HH:MM format
  workDays: number[];      // 1-7 (Monday-Sunday)
  breakDuration: number;   // minutes
  overtimeEnabled: boolean;
  remoteWorkEnabled: boolean;
  attendanceReminders: Record<string, any>;
}
```

## **🧪 Testing**

### **Test Files**
- **Postman Collection**: `User_Service_Complete_Collection.postman_collection.json`
- **Environment**: `User_Service_Environment.postman_environment.json`
- **HTTP Tests**: `../tests/user-service.http`
- **Test Guide**: `COMPLETE_TEST_GUIDE.md`
- **Test Table**: `../tests/user-service-test-table.md`

### **Running Tests**

#### **1. Postman Collection**
1. Import the collection and environment files
2. Set up authentication token
3. Run individual requests or the entire collection
4. Check test results and response times

#### **2. HTTP Tests**
```bash
# Using VS Code REST Client
# Open ../tests/user-service.http
# Click "Send Request" on any endpoint
```

#### **3. Manual Testing**
```bash
# Get authentication token
curl -X POST "http://localhost:3003/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@testcorp.com", "password": "password123"}'

# Get users
curl -X GET "http://localhost:3003/api/users" \
  -H "Authorization: Bearer <token>"
```

## **🚀 Getting Started**

### **Prerequisites**
- Node.js 20+
- PostgreSQL 15+
- Docker (optional)

### **Local Development**

#### **1. Install Dependencies**
```bash
cd backend/services/user_service
npm install
```

#### **2. Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Update environment variables
DATABASE_URL=postgresql://username:password@localhost:5432/germy_db
JWT_SECRET=your-jwt-secret
USER_SERVICE_PORT=3003
```

#### **3. Database Setup**
```bash
# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

#### **4. Start Development Server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### **Docker Development**

#### **1. Build and Run**
```bash
# Build the service
docker build -t user-service .

# Run the service
docker run -p 3003:3003 user-service
```

#### **2. Docker Compose**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs user-service
```

## **📈 Performance**

### **Response Time Targets**
- **Simple Queries**: < 500ms
- **Complex Analytics**: < 2000ms
- **Bulk Operations**: < 5000ms

### **Concurrent Users**
- **Recommended**: 1000+ concurrent users
- **Maximum**: 5000+ concurrent users

### **Database Optimization**
- **Indexes**: Optimized for common queries
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Parameterized queries

## **🔒 Security**

### **Authentication**
- **JWT Tokens**: Secure token-based authentication
- **Token Expiration**: Configurable token lifetime
- **Refresh Tokens**: Automatic token renewal

### **Authorization**
- **Role-Based Access**: Granular permission system
- **Company Scoping**: Data isolation by company
- **Resource-Level Permissions**: Fine-grained access control

### **Data Protection**
- **Input Validation**: Comprehensive data validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Input sanitization
- **Data Encryption**: Sensitive data encryption

## **📊 Monitoring & Logging**

### **Logging**
- **Winston Logger**: Structured logging
- **Log Levels**: Error, Warn, Info, Debug
- **Log Rotation**: Automatic log file rotation
- **Request Logging**: All API requests logged

### **Health Checks**
- **Service Health**: `/health` endpoint
- **Database Health**: Connection status
- **Dependencies**: External service status

### **Metrics**
- **Response Times**: Request duration tracking
- **Error Rates**: Error frequency monitoring
- **Throughput**: Requests per second
- **Resource Usage**: CPU and memory monitoring

## **🛠️ Configuration**

### **Environment Variables**
```bash
# Service Configuration
NODE_ENV=development
USER_SERVICE_PORT=3003

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/germy_db

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# External Services
AUTH_SERVICE_URL=http://localhost:3001
ATTENDANCE_SERVICE_URL=http://localhost:3002

# Logging
LOG_LEVEL=info
LOG_FILE=logs/user-service.log

# Performance
MAX_CONNECTIONS=100
QUERY_TIMEOUT=30000
```

### **Database Configuration**
```typescript
// Database connection settings
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'germy_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

## **🔧 Troubleshooting**

### **Common Issues**

#### **1. Database Connection Errors**
```bash
# Check database status
docker-compose ps db

# Check database logs
docker-compose logs db

# Test database connection
npm run db:test
```

#### **2. Authentication Errors**
```bash
# Check JWT secret
echo $JWT_SECRET

# Verify token format
# Token should be: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **3. Permission Errors**
```bash
# Check user role
# User must have appropriate role for the endpoint

# Check company access
# User must belong to the same company
```

#### **4. Validation Errors**
```bash
# Check request body format
# Ensure all required fields are present
# Validate data types and formats
```

### **Debug Mode**
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Check service logs
docker-compose logs user-service -f
```

## **📚 API Documentation**

### **Request/Response Examples**

#### **Get Users**
```bash
GET /api/users?page=1&limit=20&role=user
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### **Update User**
```bash
PUT /api/users/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "position": "Developer"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "firstName": "John",
      "lastName": "Doe",
      ...
    }
  }
}
```

## **🤝 Contributing**

### **Development Workflow**
1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests for new functionality**
5. **Run the test suite**
6. **Submit a pull request**

### **Code Standards**
- **TypeScript**: Strict type checking
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Jest**: Unit testing
- **Supertest**: Integration testing

## **📄 License**

This project is part of the Germy platform and is proprietary software.

## **🆘 Support**

For support and questions:
- **Documentation**: Check this README and test guides
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Email**: Contact the development team

---

**The User Service is production-ready and fully tested! 🚀**