# Flipstaq Documentation Structure

This directory contains comprehensive documentation for the Flipstaq eCommerce platform, reflecting **only currently implemented features and services**.

## 📁 Directory Structure

```
docs/
├── api-gateway/
│   └── README.md              # API Gateway implementation guide
├── auth-service/
│   └── README.md              # Authentication service documentation
└── global-architecture.md    # High-level platform architecture
```

## 📋 Documentation Index

### 🌐 [Global Architecture](global-architecture.md)

**Overview of the entire platform architecture**

- Current implementation status
- Microservices communication patterns
- Security architecture
- Database design
- Development workflow
- Future roadmap

### 🚪 [API Gateway](api-gateway/README.md)

**Single entry point for all external requests**

- Public API endpoints (`/api/v1/*`)
- Request routing and forwarding
- Security and CORS configuration
- Internal service communication
- Error handling and documentation

### 🔐 [Auth Service](auth-service/README.md)

**Internal authentication and authorization microservice**

- User registration and login
- JWT token management
- Password security with bcrypt
- Role-based access control
- Internal-only API protection
- Database schema and validation

## 📝 Content Guidelines

### ✅ What's Included

- **Implemented Services Only**: Only auth-service and api-gateway documented
- **Working Features**: User registration, login, JWT authentication
- **Current Architecture**: API Gateway pattern with internal microservices
- **Actual API Endpoints**: Only documented endpoints that exist and work
- **Real Configuration**: Environment variables and setup that actually work

### ❌ What's NOT Included

- **Future Services**: No documentation for unimplemented services (user, product, order, etc.)
- **Placeholder Content**: No stub documentation or "coming soon" sections
- **Unimplemented Features**: No docs for features that don't exist yet
- **Outdated Information**: Removed legacy or incorrect documentation

## 🎯 Documentation Principles

1. **Accuracy First**: All documentation reflects current working implementation
2. **Developer-Focused**: Includes setup instructions, API examples, and troubleshooting
3. **Security-Aware**: Emphasizes internal service protection and security patterns
4. **Example-Rich**: Real curl commands, request/response examples, and code samples
5. **Maintenance**: Documentation updated alongside code changes

## 🔄 Keeping Documentation Current

When implementing new services or features:

1. **Create service directory** in `docs/` (e.g., `docs/user-service/`)
2. **Add README.md** with implementation details
3. **Update global-architecture.md** with new service information
4. **Remove outdated content** that no longer applies
5. **Add practical examples** and working code samples

## 🚀 Quick Start

For new developers joining the project:

1. **Start with**: [Global Architecture](global-architecture.md) for platform overview
2. **Then read**: [API Gateway](api-gateway/README.md) for external API understanding
3. **Deep dive**: [Auth Service](auth-service/README.md) for microservice implementation details
4. **Follow setup**: Development workflow in global architecture

---

**Documentation Status**: Current as of June 13, 2025  
**Implemented Services**: API Gateway + Auth Service  
**Next Documentation**: User Service (when implemented)
