# 🔐 Auth Service - Germy Attendance Platform

Authentication and authorization microservice for the Germy attendance management platform. Handles user authentication, company registration, JWT token management, and platform administration.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Development Setup](#development-setup)
- [Implementation Priorities](#implementation-priorities)
- [Security Features](#security-features)
- [Testing](#testing)
- [Deployment](#deployment)

## 🎯 Overview

The Auth Service is the foundation of the Germy platform, responsible for:

- **User Authentication**: Login, logout, password management
- **Company Registration**: New company onboarding and setup
- **JWT Token Management**: Token generation, validation, and refresh
- **Platform Administration**: Super admin features for SaaS management
- **Role-Based Access Control**: Multi-level permission system
- **Audit Logging**: Complete authentication event tracking

## 🏗️ Architecture

### Service Responsibilities
```
┌─────────────────────────────────────────────────────────────┐
│                    Auth Service (Port 3001)                 │
├─────────────────────────────────────────────────────────────┤
│  • User Authentication & Authorization                      │
│  • Company Registration & Management                        │
│  • JWT Token Generation & Validation                        │
│  • Platform Super Admin Features                            │
│  • Password Reset & Email Verification                      │
│  • Audit Logging & Security Events                          │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with middleware
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Zod schema validation
- **Logging**: Winston with structured logging
- **Security**: Helmet, CORS, rate limiting

## 🗄️ Database Schema

### Tables Used by Auth Service

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `platform_admins` | Platform super admins | email, password_hash, role |
| `subscription_plans` | Available pricing plans | name, price_monthly, max_employees |
| `companies` | Customer companies | name, domain, industry, is_active |
| `company_subscriptions` | Company subscription details | company_id, plan_id, status |
| `users` | All user types | email, password_hash, role, company_id |
| `audit_logs` | Authentication events | user_id, action, ip_address |
| `notifications` | Auth-related notifications | user_id, type, message |

### Key Relationships
- `users.company_id` → `companies.id`
- `company_subscriptions.company_id` → `companies.id`
- `company_subscriptions.plan_id` → `subscription_plans.id`
- `audit_logs.user_id` → `users.id`

## 🔌 API Endpoints

### Authentication Endpoints
```
POST   /api/auth/register          # Company registration
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
POST   /api/auth/refresh           # Token refresh
POST   /api/auth/forgot-password   # Password reset request
POST   /api/auth/reset-password    # Password reset confirmation
GET    /api/auth/me                # Get current user
POST   /api/auth/verify-token      # Token validation
```

### Platform Admin Endpoints
```
GET    /api/platform/companies     # List all companies
POST   /api/platform/companies     # Create new company
PUT    /api/platform/companies/:id # Update company
GET    /api/platform/subscriptions # View all subscriptions
```

### Health & Monitoring
```
GET    /health                     # Service health check
```

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Docker (optional)

### Installation
```bash
# Navigate to auth service directory
cd backend/services/auth_service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure environment variables
# Edit .env with your database and JWT settings

# Generate database migrations
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables
```env
# Service Configuration
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/attendance_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=24h

# Service URLs
USER_SERVICE_URL=http://localhost:3002
FRONTEND_URL=http://localhost:3000

# Security
BCRYPT_ROUNDS=12
```

## 📋 Implementation Priorities

### Phase 1: Core Setup ✅
| Priority | File | Status | Description |
|----------|------|--------|-------------|
| 1 | `package.json` | ✅ | Dependencies and scripts |
| 2 | `drizzle.config.ts` | ✅ | Drizzle ORM configuration |
| 3 | `src/config/database.ts` | ✅ | Database connection setup |
| 4 | `src/config/env.ts` | ✅ | Environment variables validation |

### Phase 2: Database Schema ✅
| Priority | File | Status | Description |
|----------|------|--------|-------------|
| 5 | `src/db/schema/index.ts` | ✅ | Export all schemas |
| 6 | `src/db/schema/platform.ts` | ✅ | Platform admin and subscription tables |
| 7 | `src/db/schema/auth.ts` | ✅ | Users and authentication tables |

### Phase 3: Core Services ✅
| Priority | File | Status | Description |
|----------|------|--------|-------------|
| 8 | `src/services/auth.service.ts` | ✅ | Authentication business logic |
| 9 | `src/services/jwt.service.ts` | ✅ | JWT token management |
| 10 | `src/utils/bcrypt.ts` | ✅ | Password hashing utilities |

### Phase 4: Controllers & Routes ✅
| Priority | File | Status | Description |
|----------|------|--------|-------------|
| 11 | `src/controllers/auth.controller.ts` | ✅ | Authentication endpoints |
| 12 | `src/routes/auth.routes.ts` | ✅ | Authentication routes |
| 13 | `src/schemas/auth.schemas.ts` | ✅ | Request validation schemas |

### Phase 5: Middleware ✅
| Priority | File | Status | Description |
|----------|------|--------|-------------|
| 14 | `src/middleware/auth.middleware.ts` | ✅ | JWT authentication middleware |
| 15 | `src/middleware/validation.middleware.ts` | ✅ | Request validation middleware |
| 16 | `src/middleware/error.middleware.ts` | ✅ | Error handling middleware |

### Phase 6: Main Application ✅
| Priority | File | Status | Description |
|----------|------|--------|-------------|
| 17 | `src/index.ts` | ✅ | Express server setup |
| 18 | `Dockerfile` | ✅ | Container configuration |

### Phase 7: Platform Admin Features ✅
| Priority | File | Status | Description |
|----------|------|--------|-------------|
| 19 | `src/controllers/platform.controller.ts` | ✅ | Platform admin endpoints |
| 20 | `src/services/platform.service.ts` | ✅ | Platform management logic |
| 21 | `src/routes/platform.routes.ts` | ✅ | Platform admin routes |
| 22 | `src/schemas/platform.schemas.ts` | ✅ | Platform request validation |

### Phase 8: Utilities ✅
| Priority | File | Status | Description |
|----------|------|--------|-------------|
| 23 | `src/utils/logger.ts` | ✅ | Structured logging setup |
| 24 | `src/types/auth.types.ts` | ✅ | TypeScript type definitions |
| 25 | `src/types/common.types.ts` | ✅ | Common type definitions |

## 🔒 Security Features

### Authentication Security
- **Password Hashing**: bcrypt with configurable rounds (default: 12)
- **JWT Tokens**: Signed with secret key, configurable expiration
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Zod schema validation for all inputs

### Authorization
- **Role-Based Access Control**: 4-tier role system
- **Token Validation**: Middleware-based JWT verification
- **Company Isolation**: Users can only access their company data
- **Platform Admin Protection**: Separate authentication for platform admins

### Audit & Monitoring
- **Audit Logging**: All authentication events logged
- **IP Tracking**: Login attempts tracked by IP address
- **User Agent Logging**: Device and browser information captured
- **Structured Logging**: JSON-formatted logs for analysis

## 🧪 Testing

### Test Structure
```
src/tests/
├── auth.test.ts           # Authentication tests
├── platform.test.ts       # Platform admin tests
├── middleware.test.ts     # Middleware tests
└── utils.test.ts         # Utility function tests
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Categories
- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Security Tests**: Authentication and authorization
- **Performance Tests**: Load and stress testing

## 🚀 Deployment

### Docker Deployment
```bash
# Build the image
docker build -t germy-auth-service .

# Run the container
docker run -p 3001:3001 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  germy-auth-service
```

### Docker Compose
```yaml
auth-service:
  build: ./services/auth_service
  ports:
    - "3001:3001"
  environment:
    - DATABASE_URL=postgresql://postgres:postgres@db:5432/attendance_db
    - JWT_SECRET=your-jwt-secret
  depends_on:
    - db
```

### Production Considerations
- **Environment Variables**: Secure secret management
- **Database Connection**: Connection pooling and SSL
- **Logging**: Centralized logging with log aggregation
- **Monitoring**: Health checks and metrics collection
- **Scaling**: Horizontal scaling with load balancer

## 📊 Monitoring & Health Checks

### Health Check Endpoint
```bash
GET /health
```

Response:
```json
{
  "status": "OK",
  "service": "auth-service",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Metrics to Monitor
- **Response Time**: API endpoint performance
- **Error Rate**: Failed authentication attempts
- **Database Connections**: Connection pool health
- **Memory Usage**: Service resource consumption
- **JWT Token Generation**: Token creation rate

## 🔧 Configuration

### Drizzle ORM Configuration
```typescript
// drizzle.config.ts
export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

### Database Commands
```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema changes
npm run db:push

# Open Drizzle Studio
npm run db:studio

# Seed database
npm run db:seed
```

## 🤝 Integration with Other Services

### User Service Integration
- **JWT Validation**: User service validates tokens from auth service
- **User Context**: Auth service provides user information
- **Company Context**: Multi-tenant data isolation

### Frontend Integration
- **Login Flow**: Frontend sends credentials to auth service
- **Token Storage**: JWT tokens stored in secure HTTP-only cookies
- **Role-Based UI**: Frontend uses user role for UI rendering

## 📚 API Documentation

### Request/Response Examples

#### Company Registration
```bash
POST /api/auth/register
Content-Type: application/json

{
  "companyName": "Acme Corp",
  "companyDomain": "acme.com",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@acme.com",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "industry": "Technology",
  "companySize": "10-50"
}
```

#### User Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@acme.com",
  "password": "SecurePass123!"
}
```

#### Token Refresh
```bash
POST /api/auth/refresh
Authorization: Bearer <jwt-token>
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database connectivity
npm run db:studio

# Verify environment variables
echo $DATABASE_URL
```

#### JWT Token Issues
```bash
# Verify JWT secret is set
echo $JWT_SECRET

# Check token expiration
# Tokens expire after 24 hours by default
```

#### CORS Issues
```bash
# Verify FRONTEND_URL is set correctly
echo $FRONTEND_URL

# Check CORS configuration in index.ts
```

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development npm run dev

# Check logs
tail -f logs/combined.log
```

## 📈 Performance Optimization

### Database Optimization
- **Connection Pooling**: Configured in database.ts
- **Query Optimization**: Use Drizzle's query builder efficiently
- **Indexing**: Proper indexes on frequently queried columns

### Caching Strategy
- **JWT Tokens**: In-memory token validation cache
- **User Sessions**: Redis for session management (future)
- **Company Data**: Cache company settings (future)

### Rate Limiting
- **Global Rate Limit**: 100 requests per 15 minutes
- **Auth Endpoints**: Stricter limits for login attempts
- **IP-based Limiting**: Prevent brute force attacks

---

**Auth Service v1.0.0** - Built with ❤️ for the Germy Platform
