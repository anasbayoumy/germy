# 🏢 Germy - Smart Attendance Management Platform

A comprehensive SaaS platform for modern workforce attendance management with facial recognition, geolocation verification, and multi-tenant architecture.

## 🌟 Overview

Germy is a cutting-edge attendance management system designed for companies of all sizes. It combines advanced facial recognition technology with geolocation verification to ensure accurate and secure employee attendance tracking.

## ✨ Key Features

### 👥 Multi-Role System
- **Platform Super Admin**: Manage the entire SaaS platform, billing, and company onboarding
- **Company Super Admin**: Manage company settings, geofence locations, and admin accounts
- **Company Admin**: Manage employees, view analytics, and handle flagged attendance
- **Employee**: Clock in/out with camera verification and view personal attendance history

### 🔐 Advanced Security
- **Facial Recognition**: Real-time liveness detection and anti-spoofing measures
- **Geolocation Verification**: GPS-based attendance with configurable geofence radius
- **Multi-Factor Authentication**: Photo + location + liveness verification
- **Anti-Spoofing**: IP address verification, device fingerprinting, and anomaly detection

### 📊 Analytics & Reporting
- **Real-time Dashboard**: Live attendance view and key metrics
- **Advanced Analytics**: Attendance rates, punctuality trends, and absenteeism analysis
- **Report Generation**: Export attendance data as CSV or PDF
- **Flagged Attendance Review**: Manual approval system for suspicious activities

### 🏢 Multi-Tenant SaaS Architecture
- **Company Isolation**: Secure data separation between organizations
- **Subscription Management**: Flexible pricing plans with Stripe integration
- **Billing & Invoicing**: Automated billing cycles and payment processing
- **Trial Management**: 14-day free trials with employee limits

### 🔄 Work Flexibility
- **Hybrid Work Support**: On-site, remote, and hybrid work tracking
- **Flexible Scheduling**: Customizable work hours and days
- **Remote Employee Solutions**: Optional activity tracking and check-ins
- **Team Management**: Department and team-based organization

### 🔗 Integrations
- **HRIS Integration**: Sync with BambooHR, Workday, and other HR systems
- **Payroll Integration**: Automatic attendance data export for payroll
- **Communication Tools**: Slack and Microsoft Teams notifications
- **API-First Design**: RESTful APIs for custom integrations

## 🏗️ Technical Architecture

### Microservices Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │    │   User Service  │    │ Attendance Svc  │
│   (Port 3001)   │    │   (Port 3002)   │    │   (Port 3003)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     Shared PostgreSQL     │
                    │     (Port 5432)           │
                    │   - All tables together   │
                    └───────────────────────────┘
```

### Technology Stack
- **Backend**: Node.js, TypeScript, Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with role-based access control
- **File Storage**: AWS S3 for photos and documents
- **Real-time**: WebSockets for live updates
- **Containerization**: Docker with Docker Compose
- **Frontend**: Flutter (Mobile) + React (Admin Dashboard)

### Services Overview
1. **Auth Service**: Authentication, authorization, JWT management
2. **User Service**: User management, company settings, team management
3. **Attendance Service**: Clock in/out, geolocation, attendance records
4. **Analytics Service**: Reports, dashboards, metrics calculation
5. **Notification Service**: Real-time updates, alerts, email notifications
6. **File Service**: Photo upload, facial recognition processing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 13+
- Git

### Quick Start
```bash
# Clone the repository
git clone https://github.com/your-org/germy.git
cd germy

# Start the development environment
cd backend
docker-compose up -d

# The services will be available at:
# - Auth Service: http://localhost:3001
# - User Service: http://localhost:3002
# - Database: localhost:5432
```

### Environment Setup
1. Copy environment files and configure variables
2. Run database migrations
3. Seed initial data (subscription plans, platform admin)
4. Start individual services for development

## 📱 Mobile App (Flutter)

The Flutter mobile app provides:
- **One-tap Clock In/Out**: Camera opens automatically for attendance
- **Real-time Feedback**: Immediate verification results
- **Attendance History**: Personal attendance log with status tracking
- **Profile Management**: Update personal details and facial recognition data
- **Offline Support**: Queue attendance when offline, sync when online

## 🖥️ Admin Dashboard (React)

The web-based admin dashboard includes:
- **Employee Management**: Add, edit, and manage employee profiles
- **Team Organization**: Create departments and assign team members
- **Live Attendance View**: See who's currently clocked in
- **Analytics Dashboard**: Visual charts and attendance metrics
- **Flagged Attendance Review**: Manual approval workflow
- **Report Generation**: Export data for payroll and HR

## 🔒 Security Features

### Data Protection
- **Encryption**: All sensitive data encrypted at rest and in transit
- **Row-Level Security**: Database-level data isolation between companies
- **Audit Logging**: Complete audit trail of all user actions
- **GDPR Compliance**: Data privacy and right to deletion

### Anti-Fraud Measures
- **Liveness Detection**: Prevents photo spoofing attacks
- **IP Verification**: Flags suspicious location changes
- **Device Fingerprinting**: Tracks and validates device consistency
- **Anomaly Detection**: ML-based pattern recognition for unusual behavior

## 📊 Business Model

### Subscription Plans
- **Starter**: $29.99/month - Up to 10 employees
- **Professional**: $79.99/month - Up to 50 employees
- **Enterprise**: $199.99/month - Up to 500 employees

### Revenue Streams
- Monthly/yearly subscriptions
- Setup and onboarding services
- Custom integrations and consulting
- Premium support and training

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: [docs.germy.com](https://docs.germy.com)
- **Support Email**: support@germy.com
- **Community**: [Discord Server](https://discord.gg/germy)

## 🗺️ Roadmap

### Q1 2024
- [ ] Mobile app release (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Slack/Teams integrations

### Q2 2024
- [ ] AI-powered attendance insights
- [ ] Multi-language support
- [ ] Advanced reporting features

### Q3 2024
- [ ] Mobile app for admins
- [ ] Advanced geofencing
- [ ] Custom field support

---

**Built with ❤️ by the Germy Team**
