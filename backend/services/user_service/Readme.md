# 👥 User Service - Germy Attendance Platform

User management microservice for the Germy attendance management platform. Handles user profiles, team management, department organization, user preferences, and employee directory functionality.

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

The User Service is responsible for comprehensive user management within the Germy platform, providing:

- **User Profile Management**: Complete CRUD operations for user profiles
- **Team Management**: Create, assign, and manage teams within companies
- **Department Organization**: Hierarchical department structure management
- **User Preferences**: Personal settings and customization options
- **Employee Directory**: Search, filter, and export employee information
- **User Activity Tracking**: Comprehensive audit logs for user actions
- **Profile Picture Management**: Avatar upload and management
- **User Settings**: Company-specific and personal user configurations

## 🏗️ Architecture

### Service Responsibilities
```
┌─────────────────────────────────────────────────────────────┐
│                    User Service (Port 3002)                 │
├─────────────────────────────────────────────────────────────┤
│  • User Profile Management & CRUD Operations                │
│  • Team Creation & Management                               │
│  • Department Organization & Hierarchy                      │
│  • User Preferences & Settings                              │
│  • Employee Directory & Search                              │
│  • User Activity Tracking & Audit Logs                      │
│  • Profile Picture & Avatar Management                      │
│  • User Onboarding & Profile Completion                     │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with middleware
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT token validation (from Auth Service)
- **Validation**: Zod schema validation
- **Logging**: Winston with structured logging
- **Security**: Helmet, CORS, rate limiting
- **File Upload**: Multer for profile pictures

## 🗄️ Database Schema

### Tables Managed by User Service

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Extended user profiles | profile_photo_url, position, department, hire_date |
| `teams` | Team definitions | name, description, manager_id, company_id |
| `user_teams` | User-team relationships | user_id, team_id, role_in_team |
| `departments` | Department structure | name, description, parent_id, company_id |
| `user_departments` | User-department assignments | user_id, department_id, role |
| `user_preferences` | Personal user settings | user_id, theme, language, notifications |
| `user_settings` | Company-specific settings | user_id, company_id, work_hours, timezone |
| `user_activities` | User action tracking | user_id, action, resource_type, timestamp |

### Key Relationships
- `users.company_id` → `companies.id` (from Auth Service)
- `teams.company_id` → `companies.id`
- `teams.manager_id` → `users.id`
- `user_teams.user_id` → `users.id`
- `user_teams.team_id` → `teams.id`
- `departments.company_id` → `companies.id`
- `departments.parent_id` → `departments.id` (self-referencing)
- `user_departments.user_id` → `users.id`
- `user_departments.department_id` → `departments.id`

## 🔌 API Endpoints

### User Management Endpoints
```
GET    /api/users                    # List users with filters
GET    /api/users/:id                # Get user profile
PUT    /api/users/:id                # Update user profile
DELETE /api/users/:id                # Deactivate user
POST   /api/users/:id/avatar         # Upload profile picture
GET    /api/users/search             # Search users
GET    /api/users/directory          # Employee directory
GET    /api/users/export             # Export user data
```

### Team Management Endpoints
```
GET    /api/teams                    # List teams
POST   /api/teams                    # Create team
GET    /api/teams/:id                # Get team details
PUT    /api/teams/:id                # Update team
DELETE /api/teams/:id                # Delete team
POST   /api/teams/:id/members        # Add team members
DELETE /api/teams/:id/members/:userId # Remove team member
GET    /api/teams/:id/members        # List team members
```

### Department Management Endpoints
```
GET    /api/departments              # List departments
POST   /api/departments              # Create department
GET    /api/departments/:id          # Get department details
PUT    /api/departments/:id          # Update department
DELETE /api/departments/:id          # Delete department
GET    /api/departments/:id/users    # List department users
POST   /api/departments/:id/users    # Assign users to department
```

### User Settings & Preferences
```
GET    /api/users/:id/settings       # Get user settings
PUT    /api/users/:id/settings       # Update user settings
GET    /api/users/:id/preferences    # Get user preferences
PUT    /api/users/:id/preferences    # Update user preferences
GET    /api/users/:id/activities     # Get user activity log
```

### Health & Monitoring
```
GET    /health                       # Service health check
```

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Docker (optional)
- Auth Service running (for JWT validation)

### Installation
```bash
# Navigate to user service directory
cd backend/services/user_service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure environment variables
# Edit .env with your database and service settings

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
PORT=3002

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/attendance_db

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880  # 5MB
UPLOAD_PATH=./uploads

# Security
BCRYPT_ROUNDS=12
```

## 📋 Implementation Priorities

### Phase 1: Core Setup
| Priority | File | Status | Description |
|----------|------|--------|-------------|
| 1 | `package.json` | ✅ | Dependencies and scripts |
| 2 | `drizzle.config.ts` | ⏳ | Drizzle ORM configuration |
| 3 | `src/config/database.ts` | ⏳ | Database connection setup |
| 4 | `src/config/env.ts` | ⏳ | Environment variables validation |

### Phase 2: Database Schema
| Priority | File | Status | Description |
|----------|------|--------|-------------|
| 5 | `src/db/schema/index.ts` | ⏳ | Export all schemas |
| 6 | `src/db/schema/user.ts` | ⏳ | User-related tables |
| 7 | `src/db/schema/team.ts` | ⏳ | Team and department tables |

### Phase 3: Core Services
| Priority | File | Status | Description |
|----------|------|--------|-------------|
| 8 | `src/services/user.service.ts` | ⏳ | User management business logic |
| 9 | `src/services/team.service.ts` | ⏳ | Team management logic |
| 10 | `src/services/department.service.ts` | ⏳ | Department management logic |

### Phase 4: Controllers & Routes
| Priority | File | Status | Description |
|----------|------|--------|-------------|
| 11 | `src/controllers/user.controller.ts` | ⏳ | User management endpoints |
| 12 | `src/controllers/team.controller.ts` | ⏳ | Team management endpoints |
| 13 | `src/controllers/department.controller.ts` | ⏳ | Department endpoints |
| 14 | `src/routes/user.routes.ts` | ⏳ | User routes |
| 15 | `src/routes/team.routes.ts` | ⏳ | Team routes |
| 16 | `src/routes/department.routes.ts` | ⏳ | Department routes |

### Phase 5: Middleware & Validation
| Priority | File | Status | Description |
|----------|------|--------|-------------|
| 17 | `src/middleware/auth.middleware.ts` | ⏳ | JWT validation middleware |
| 18 | `src/middleware/validation.middleware.ts` | ⏳ | Request validation |
| 19 | `src/middleware/error.middleware.ts` | ⏳ | Error handling |
| 20 | `src/middleware/upload.middleware.ts` | ⏳ | File upload handling |

### Phase 6: Schemas & Types
| Priority | File | Status | Description |
|----------|------|--------|-------------|
| 21 | `src/schemas/user.schemas.ts` | ⏳ | User validation schemas |
| 22 | `src/schemas/team.schemas.ts` | ⏳ | Team validation schemas |
| 23 | `src/schemas/department.schemas.ts` | ⏳ | Department validation schemas |
| 24 | `src/types/user.types.ts` | ⏳ | User TypeScript types |
| 25 | `src/types/team.types.ts` | ⏳ | Team TypeScript types |

### Phase 7: Main Application
| Priority | File | Status | Description |
|----------|------|--------|-------------|
| 26 | `src/index.ts` | ⏳ | Express server setup |
| 27 | `Dockerfile` | ✅ | Container configuration |

### Phase 8: Utilities & Testing
| Priority | File | Status | Description |
|----------|------|--------|-------------|
| 28 | `src/utils/logger.ts` | ⏳ | Structured logging |
| 29 | `src/utils/fileUpload.ts` | ⏳ | File upload utilities |
| 30 | `tests/` | ⏳ | Comprehensive test suite |

## 🔒 Security Features

### Authentication & Authorization
- **JWT Token Validation**: Validates tokens from Auth Service
- **Role-Based Access Control**: Company admin, super admin, employee permissions
- **Company Data Isolation**: Users can only access their company data
- **Input Validation**: Zod schema validation for all inputs
- **File Upload Security**: File type and size validation

### Data Protection
- **Profile Picture Security**: Secure file upload and storage
- **User Data Privacy**: Sensitive information protection
- **Activity Logging**: Complete audit trail of user actions
- **Rate Limiting**: API endpoint protection

## 🧪 Testing

### Test Structure
```
tests/
├── setup.ts                    # Test environment configuration
├── unit/                       # Unit tests for services
│   ├── user.service.test.ts    # User service logic tests
│   ├── team.service.test.ts    # Team service logic tests
│   └── department.service.test.ts # Department service tests
└── api/                        # HTTP API integration tests
    ├── user-endpoints.test.ts  # User management endpoint tests
    ├── team-endpoints.test.ts  # Team management endpoint tests
    ├── department-endpoints.test.ts # Department endpoint tests
    └── middleware-security.test.ts # Security and middleware tests
```

### Running Tests
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run API tests only
npm run test:api

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# CI mode
npm run test:ci
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build the image
docker build -t germy-user-service .

# Run the container
docker run -p 3002:3002 \
  -e DATABASE_URL=postgresql://... \
  -e AUTH_SERVICE_URL=http://auth-service:3001 \
  germy-user-service
```

### Docker Compose
```yaml
user-service:
  build: ./services/user_service
  ports:
    - "3002:3002"
  environment:
    - DATABASE_URL=postgresql://postgres:postgres@db:5432/attendance_db
    - AUTH_SERVICE_URL=http://auth-service:3001
  depends_on:
    - auth-service
    - db
```

## 📊 Key Features

### User Profile Management
- **Complete Profile CRUD**: Create, read, update, deactivate users
- **Profile Pictures**: Upload and manage user avatars
- **Personal Information**: Name, email, phone, position, department
- **Employment Details**: Hire date, salary, employee ID
- **Profile Completion**: Track and enforce profile completion

### Team Management
- **Team Creation**: Create teams with descriptions and managers
- **Member Assignment**: Add/remove users from teams
- **Team Roles**: Member, lead, manager roles within teams
- **Team Hierarchy**: Nested team structures
- **Team Analytics**: Member count, activity tracking

### Department Organization
- **Department Structure**: Hierarchical department organization
- **User Assignment**: Assign users to departments
- **Department Roles**: Different roles within departments
- **Department Management**: Create, update, delete departments
- **Organizational Chart**: Visual department structure

### Employee Directory
- **Search & Filter**: Advanced user search capabilities
- **Export Functionality**: Export user data in various formats
- **Directory Views**: List, grid, and card views
- **Contact Information**: Quick access to user contact details
- **Department Filtering**: Filter users by department

### User Preferences & Settings
- **Personal Preferences**: Theme, language, notification settings
- **Work Settings**: Work hours, timezone, schedule preferences
- **Privacy Settings**: Profile visibility, contact preferences
- **Notification Preferences**: Email, push, SMS notification settings

## 🔧 Configuration

### Database Schema Extensions
```sql
-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User-Team relationships
CREATE TABLE user_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    team_id UUID NOT NULL REFERENCES teams(id),
    role_in_team VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, team_id)
);
```

## 🤝 Integration with Other Services

### Auth Service Integration
- **JWT Validation**: Validates user tokens from Auth Service
- **User Context**: Gets user information from Auth Service
- **Company Context**: Multi-tenant data isolation
- **Role Validation**: Ensures proper permissions

### Attendance Service Integration
- **User Data**: Provides user information for attendance tracking
- **Team Context**: Team-based attendance reporting
- **Department Filtering**: Department-specific attendance views

### Frontend Integration
- **User Profile**: Complete user profile management UI
- **Team Management**: Team creation and management interface
- **Employee Directory**: Searchable employee directory
- **Settings Panel**: User preferences and settings interface

## 📚 API Documentation

### Request/Response Examples

#### Get User Profile
```bash
GET /api/users/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <jwt-token>
```

#### Create Team
```bash
POST /api/teams
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Development Team",
  "description": "Software development team",
  "managerId": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### Update User Profile
```bash
PUT /api/users/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "position": "Senior Developer",
  "department": "Engineering",
  "phone": "+1234567890"
}
```

## 🐛 Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Verify Auth Service is running
curl http://localhost:3001/health

# Check JWT token validity
# Tokens should be obtained from Auth Service
```

#### Database Connection Issues
```bash
# Check database connectivity
npm run db:studio

# Verify environment variables
echo $DATABASE_URL
```

#### File Upload Issues
```bash
# Check upload directory permissions
ls -la uploads/

# Verify file size limits
# Default: 5MB maximum file size
```

---

**User Service v1.0.0** - Built with ❤️ for the Germy Platform
