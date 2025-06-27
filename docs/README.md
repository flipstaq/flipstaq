# Flipstaq Documentation Structure

This directory contains comprehensive documentation for the Flipstaq eCommerce platform, reflecti5. **Legal Documents**: [Legal Service](legal-service/README.md) for document management and compliance 6. **Follow setup**: Development workflow in global architecture

---

**Documentation Status**: Current as of June 27, 2025  
**Implemented Services**: API Gateway + Auth Service + Message Service + Legal Service  
**Recent Updates**: Legal documents management system with multi-language support  
**Next Documentation**: User Service (when implemented)y currently implemented features and services\*\*.

## 📁 Directory Structure

```
docs/
├── api-gateway/
│   └── README.md              # API Gateway implementation guide
├── auth-service/
│   └── README.md              # Authentication service documentation
├── legal-service/
│   ├── README.md              # Legal service documentation
│   └── api.md                 # Legal API endpoints and examples
├── message-service/
│   ├── README.md              # Message service documentation
│   └── api.md                 # Message API endpoints with file upload
├── frontend/
│   └── components.md          # Frontend component documentation
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

### 💬 [Message Service](message-service/README.md)

**Direct messaging system with file attachment support**

- Real-time conversation management
- Message sending and retrieval
- File upload and attachment system
- Support for images, documents, and multimedia
- User search and conversation initiation
- Message read status tracking

### ⚖️ [Legal Service](legal-service/README.md)

**Legal documents management system with multi-language support**

- Legal document management (Terms of Service, Privacy Policy, etc.)
- Multi-language support (English, Arabic)
- Version control and audit tracking
- Role-based access control (Owners/Higher Staff only)
- Public document serving for frontend consumption
- Admin panel integration for document management
- Automatic version incrementing and active document management

### 🎨 [Frontend Components](frontend/components.md)

**React/Next.js frontend component documentation**

- Chat system UI components
- File attachment interface
- Product management forms
- Authentication components
- Responsive design patterns

## 📝 Content Guidelines

### ✅ What's Included

- **Implemented Services**: Auth-service, message-service, legal-service, and API gateway documented
- **Working Features**: User registration, login, JWT authentication, direct messaging, file attachments
- **Current Architecture**: API Gateway pattern with internal microservices
- **Actual API Endpoints**: Only documented endpoints that exist and work
- **Real Configuration**: Environment variables and setup that actually work
- **File Upload System**: Complete documentation for message file attachments

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
4. **Messaging**: [Message Service](message-service/README.md) for chat and file upload features
5. **Frontend**: [Frontend Components](frontend/components.md) for UI implementation details
6. **Follow setup**: Development workflow in global architecture

---

**Documentation Status**: Current as of June 20, 2025  
**Implemented Services**: API Gateway + Auth Service + Message Service  
**Recent Updates**: File attachment support in messaging system  
**Next Documentation**: User Service (when implemented)
