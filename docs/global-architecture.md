# Flipstaq eCommerce Platform - Global Architecture

## Overview

Flipstaq is a modern, scalable, multi-vendor eCommerce platform built with a microservices architecture. The platform uses an **API Gateway pattern** with dedicated microservices for different business domains.

**Current Implementation Status**: This document reflects only the currently implemented features and services.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│         Web App (Next.js)          │      Future Clients        │
│           Port 3000                 │   (Mobile, Admin Panel)    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (NestJS)                      │
│                         Port 3100                              │
│  • Single Entry Point  • Request Routing  • Authentication     │
│  • CORS Management     • API Versioning   • Internal Headers   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Currently Implemented Services                 │
├─────────────────────────────────────────────────────────────────┤
│             Auth Service (Internal Only)                       │
│                      Port 3001                                 │
│  • User Registration    • JWT Authentication                   │
│  • Login/Logout        • Token Validation                     │
│  • Security Middleware • Internal API Only                    │
├─────────────────────────────────────────────────────────────────┤
│           Product Service (Internal Only)                      │
│                      Port 3004                                 │
│  • Product Creation     • Product Listing                     │
│  • Slug Management     • User Association                     │
│  • Data Validation     • Internal API Only                    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                               │
├─────────────────────────────────────────────────────────────────┤
│            PostgreSQL Database (Port 5432)                     │
│  • Shared Prisma Schema    • User Management                   │
│  • Role-based Access      • JWT Token Storage                  │
│  • Product Management     • Multi-Currency Support             │
└─────────────────────────────────────────────────────────────────┘
```

## Core Design Principles

### 1. API Gateway Pattern

All external client requests flow through a **single API Gateway** that:

- Acts as the only public-facing entry point
- Routes requests to appropriate internal microservices
- Handles authentication, validation, and error responses
- Provides consistent API versioning (`/api/v1/...`)
- Manages CORS, rate limiting, and security policies

### 2. Microservices Architecture

Each business domain is isolated into its own microservice:

- **Loose Coupling**: Services communicate via HTTP/REST APIs
- **Independent Deployment**: Each service can be deployed separately
- **Technology Freedom**: Services can use different tech stacks if needed
- **Fault Isolation**: Failure in one service doesn't affect others

### 3. Shared Database with Service Boundaries

- **Single PostgreSQL Instance**: Shared across all services for data consistency
- **Logical Separation**: Each service owns specific database tables
- **Prisma Schema**: Centralized schema in `packages/db/` with service-specific access
- **Data Integrity**: Foreign key relationships maintained at database level

## Service Breakdown

### API Gateway (`apps/api-gateway/`)

- **Purpose**: Central routing and request handling for all external requests
- **Port**: 3100 (Public)
- **Technology**: NestJS 11.1.3 + TypeScript
- **Status**: ✅ **Implemented**
- **Responsibilities**:
  - Public API endpoint management (`/api/v1/*`)
  - Request forwarding to internal microservices
  - CORS management and security headers
  - Input validation and error handling
  - Swagger API documentation
  - Internal service authentication headers

**Key Features:**

- Single entry point for all external clients
- Proxy service for internal microservice communication
- Security middleware for internal service protection
- Consistent API versioning and error handling

### Auth Service (`services/auth-service/`)

- **Purpose**: User authentication, authorization, and account management
- **Port**: 3001 (Internal only - no direct external access)
- **Technology**: NestJS 11.1.3 + JWT + bcrypt + Prisma
- **Status**: ✅ **Implemented**
- **Responsibilities**:
  - User registration with age verification (13+ years)
  - Email/username + password authentication
  - JWT access and refresh token management
  - Password hashing with bcrypt
  - Role-based access control (USER, STAFF, HIGHER_STAFF, OWNER)
  - Internal-only API with security middleware

**Key Features:**

- Complete user signup and login flow
- Secure password handling and token management
- Age verification for COPPA compliance
- Internal service protection middleware
- Integration with shared Prisma database schema

### Product Service (`services/product-service/`)

- **Purpose**: Product management and catalog operations
- **Port**: 3004 (Internal only - no direct external access)
- **Technology**: NestJS 11.1.3 + TypeScript + Prisma
- **Status**: ✅ **Implemented**
- **Responsibilities**:
  - Product creation and management
  - Slug-based product URLs (@username/slug)
  - Product listing and retrieval
  - Price and currency management
  - Location and category support
  - Internal-only API with security middleware

**Key Features:**

- Complete product posting and listing functionality
- SEO-friendly URLs with username and slug
- Multi-currency support (USD, AED, EUR, GBP, SAR)
- Location-based product organization
- Slug uniqueness enforcement per user
- Integration with shared Prisma database schema

## Currently Implemented Features

### ✅ User Authentication System

- **User Registration**: Full signup flow with validation
- **User Login**: Email/username authentication
- **JWT Tokens**: Access tokens (2h) and refresh tokens (7 days) with automatic refresh
- **Password Security**: bcrypt hashing with salt
- **Age Verification**: Minimum 13 years old requirement
- **Role Management**: Four-tier role system

### ✅ API Gateway Architecture

- **Request Routing**: All external requests routed through gateway
- **Internal Communication**: Secure headers for microservice communication
- **API Documentation**: Centralized Swagger documentation
- **Error Handling**: Consistent error responses across services
- **CORS Management**: Configured for frontend and development

### ✅ Database Infrastructure

- **PostgreSQL**: Production-ready database setup
- **Prisma ORM**: Type-safe database access with migrations
- **Shared Schema**: Centralized database schema in packages/db
- **User Management**: Complete user table with authentication fields

### ✅ Security Implementation

- **Internal Service Protection**: Middleware prevents direct access to microservices
- **JWT Authentication**: Secure token-based authentication

### ✅ Product Management System

- **Product Creation**: Full product posting with validation
- **Product Listing**: Homepage and catalog product display
- **Slug Management**: SEO-friendly URLs (@username/slug format)
- **Multi-Currency**: Support for USD, AED, EUR, GBP, SAR
- **Location Support**: Country-based or global product listings
- **User Association**: Products linked to their owners
- **Data Validation**: Comprehensive input validation and error handling
- **CORS Configuration**: Restricted to specific origins
- **Password Security**: Industry-standard bcrypt hashing
- **Request Validation**: DTO validation with class-validator

## Future Services (Not Yet Implemented)

The following services are planned but not yet developed:

- **User Service** (Port 3002) - User profiles and account management
- **Product Service** (Port 3003) - Product catalog and inventory
- **Order Service** (Port 3004) - Shopping cart and order processing
- **Payment Service** (Port 3005) - Payment processing and transactions
- **Review Service** (Port 3006) - Product reviews and ratings
- **Notification Service** (Port 3007) - Multi-channel notifications

## Data Architecture (Current Implementation)

### Database Schema

The current Prisma schema includes:

```prisma
model User {
  id              String     @id @default(cuid())
  email           String     @unique
  username        String     @unique
  firstName       String
  lastName        String
  password        String     // bcrypt hashed
  country         String
  birthDate       DateTime
  role            Role       @default(USER)
  isEmailVerified Boolean    @default(false)
  refreshToken    String?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  // Relations
  products        Product[]
  favorites       Favorite[]
}

model Product {
  id          String   @id @default(cuid())
  title       String
  description String?
  category    String?
  price       Float
  currency    String   @default("USD")
  location    String   // Country or "Global"
  slug        String   // User-chosen URL part
  imageUrl    String?  // Product image URL
  userId      String
  isActive    Boolean  @default(true)
  isSold      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  favorites   Favorite[]

  @@unique([userId, slug])
}

model Favorite {
  id        String   @id @default(cuid())
  userId    String
  productId String
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
}

enum Role {
  USER
  STAFF
  HIGHER_STAFF
  OWNER
}
```

### Shared Packages (Current)

#### `packages/db/`

**Shared Prisma Database Package**

- **Location**: `packages/db/`
- **Schema**: `packages/db/prisma/schema.prisma`
- **Generated Client**: `packages/db/generated/client/`
- **Main Entry**: Points directly to generated Prisma client

**Usage in Microservices:**

```typescript
// Import directly from shared db package
import { PrismaClient, User, UserRole, UserStatus } from "@flipstaq/db";

const prisma = new PrismaClient();
```

**Key Features:**

- **Single Source of Truth**: All database models centralized
- **Type Safety**: Shared TypeScript types across all services
- **Version Control**: Database migrations in one location
- **Consistency**: Prevents schema drift between services
- **Client Generation**: Single `npx prisma generate` command

**Database Commands:**

```bash
# Generate Prisma client (run from packages/db/)
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Push schema to database
npm run db:push
```

**Service Integration:**

Each microservice references the shared schema in their package.json:

```json
{
  "dependencies": {
    "@flipstaq/db": "workspace:*"
  },
  "scripts": {
    "prisma:generate": "prisma generate --schema=../../packages/db/prisma/schema.prisma"
  }
}
```

#### `packages/locales/`

- **English Translations**: Common and auth-specific translations
- **Arabic Translations**: RTL language support
- **Dynamic Loading**: JSON-based translation files
- **Structured Organization**: Separate files for different domains

```
packages/locales/
├── en/
│   ├── common.json      # General UI translations
│   └── auth.json        # Authentication translations
└── ar/
    ├── common.json      # Arabic general translations
    └── auth.json        # Arabic authentication translations
```

## Communication Patterns (Current Implementation)

### API Gateway to Microservice Communication

**Request Flow:**

```
External Client → API Gateway (Port 3100) → Auth Service (Port 3001) → PostgreSQL
```

**Example Authentication Flow:**

```typescript
// 1. Client Request to Gateway
POST http://localhost:3100/api/v1/auth/signup
Content-Type: application/json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "securepass123",
  "country": "US",
  "birthDate": "1990-01-01"
}

// 2. Gateway forwards to Auth Service with internal headers
POST http://localhost:3001/internal/auth/signup
x-api-gateway: flipstaq-gateway
x-internal-service: true
x-forwarded-from: api-gateway
Content-Type: application/json
{...same body...}

// 3. Auth Service Response
HTTP 201 Created
{
  "user": { "id": "...", "email": "john@example.com", ... },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}

// 4. Gateway forwards response to client
HTTP 201 Created
{...same response...}
```

**Internal Security Headers:**

- `x-api-gateway: flipstaq-gateway` - Identifies requests from the API Gateway
- `x-internal-service: true` - Marks request as internal service communication
- `x-forwarded-from: api-gateway` - Tracks request origin

### Error Handling Pattern

```typescript
// Service Error (Auth Service)
throw new ConflictException('Email already exists');

// Gateway Response to Client
HTTP 409 Conflict
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}
```

## Security Architecture (Current Implementation)

### 1. API Gateway Security

**Request Validation:**

```typescript
// All requests pass through gateway security
CORS Check → Rate Limiting (future) → Request Validation → Service Forward
```

**CORS Configuration:**

```typescript
// Restricted origins
origins: [
  "http://localhost:3000", // Frontend development
  "http://localhost:3100", // Gateway self-reference
];
```

### 2. Internal Service Security

**Access Control:**

- **Internal Service Middleware**: Blocks all requests without proper headers
- **Development Exception**: Allows localhost access during development
- **Header Validation**: Requires specific gateway identification headers

**Auth Service Protection:**

```typescript
// Middleware blocks external access
if (internalHeader !== "true" && apiGatewayHeader !== "flipstaq-gateway") {
  throw new UnauthorizedException(
    "Direct access to internal service is not allowed"
  );
}
```

### 3. Authentication Security

**JWT Token System:**

- **Access Tokens**: 2-hour expiration for development convenience (15min for production)
- **Refresh Tokens**: 7-day expiration, stored in database and frontend
- **Automatic Refresh**: Frontend automatically refreshes expired tokens
- **Development Resilience**: JWT validation bypasses auth service in development mode
- **Session Continuity**: Users remain logged in across service restarts
- **Separate Secrets**: Different secrets for access and refresh tokens
- **Token Storage**: Refresh tokens stored in database for invalidation

**Password Security:**

- **bcrypt Hashing**: Industry-standard password hashing
- **Salt Rounds**: Configurable salt complexity
- **No Plain Text**: Passwords never stored in plain text

### 4. Role-Based Access Control

**User Roles:**

- `USER`: Standard customer accounts
- `STAFF`: Basic administrative access
- `HIGHER_STAFF`: Elevated administrative privileges
- `OWNER`: Full platform access

**Implementation:**

- Roles stored in user database record
- JWT tokens include role claims
- Future services will check role permissions

## Development Workflow (Current Setup)

### Local Development Setup

```bash
# 1. Start PostgreSQL database (if not using Docker)
# Ensure PostgreSQL is running on localhost:5432

# 2. Set up database schema
cd packages/db
npm install
npx prisma migrate deploy
npx prisma generate

# 3. Start Auth Service
cd services/auth-service
npm install --legacy-peer-deps
npm run start:dev
# Service available at http://localhost:3001 (internal only)

# 4. Start API Gateway
cd apps/api-gateway
npm install
npm run start:dev
# Gateway available at http://localhost:3100

# 5. Start Frontend (optional)
cd apps/web
npm install
npm run dev
# Frontend available at http://localhost:3000
```

### Environment Configuration

**Auth Service (.env):**

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/flipstaq_dev"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="2h"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
```

**API Gateway (.env):**

```env
NODE_ENV=development
PORT=3100
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
AUTH_SERVICE_URL=http://localhost:3001
```

### Testing the Implementation

**1. Test API Gateway:**

```bash
curl http://localhost:3100/api/docs
# Should show Swagger documentation
```

**2. Test Auth Service (via Gateway):**

```bash
# User Registration
curl -X POST http://localhost:3100/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "country": "US",
    "birthDate": "1990-01-01"
  }'

# User Login
curl -X POST http://localhost:3100/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "test@example.com",
    "password": "password123"
  }'
```

**3. Verify Internal Service Protection:**

```bash
# This should fail with 401 Unauthorized
curl -X POST http://localhost:3001/internal/auth/signup \
  -H "Content-Type: application/json" \
  -d '{...}'
```

# Start Frontend

cd apps/web && npm run dev

````

### 2. Service Development Process

1. **Schema First**: Update `packages/db/schema.prisma`
2. **Generate Client**: Run `npx prisma generate`
3. **Create Migration**: Run `npx prisma migrate dev`
4. **Implement Service**: Add business logic to microservice
5. **Update Gateway**: Add routing in API Gateway
6. **Update Frontend**: Implement UI components
7. **Test Integration**: End-to-end testing

### 3. Testing Strategy

**Unit Tests**: Individual service components

```bash
cd services/auth-service && npm test
````

**Integration Tests**: Service-to-service communication

```bash
cd apps/api-gateway && npm run test:e2e
```

## API Documentation

### Swagger Documentation

**API Gateway Documentation:**

- **URL**: `http://localhost:3100/api/docs`
- **Content**: Public API endpoints for external clients
- **Features**: Interactive testing, request/response schemas

**Auth Service Documentation:**

- **URL**: `http://localhost:3001/api/docs`
- **Access**: Internal only (requires proper headers or localhost)
- **Content**: Internal API endpoints with security warnings

### API Versioning

All public APIs use versioned endpoints:

- **Pattern**: `/api/v1/*`
- **Current Version**: v1 (initial implementation)
- **Future Versions**: v2, v3 will be added as needed
- **Backward Compatibility**: Previous versions maintained during transitions

## Monitoring and Observability (Current)

### Logging

**API Gateway:**

- Request forwarding with service targets
- Error responses with service information
- CORS and security events

**Auth Service:**

- Authentication attempts (success/failure)
- Token generation and validation
- Internal service access attempts

### Health Checks (Future Implementation)

Planned health check endpoints:

- `GET /health` - Service availability
- `GET /health/detailed` - Dependency status
- `GET /metrics` - Performance metrics

## Project Structure

```
flipstaq/
├── apps/
│   ├── api-gateway/          # ✅ NestJS API Gateway (Port 3100)
│   │   ├── src/
│   │   │   ├── auth/         # Auth route handlers
│   │   │   ├── proxy/        # Service forwarding logic
│   │   │   └── common/       # Shared utilities
│   │   └── package.json
│   └── web/                  # ✅ Next.js Frontend (Port 3000)
│       ├── src/
│       │   ├── components/   # React components
│       │   ├── lib/          # Utility functions
│       │   └── pages/        # Next.js pages
│       └── package.json
├── services/
│   └── auth-service/         # ✅ Authentication Microservice (Port 3001)
│       ├── src/
│       │   ├── auth/         # Auth logic and controllers
│       │   ├── prisma/       # Database connection
│       │   ├── dto/          # Data transfer objects
│       │   └── common/       # Middleware and utilities
│       └── package.json
├── packages/
│   ├── db/                   # ✅ Shared Prisma Schema
│   │   ├── schema.prisma     # Database schema
│   │   ├── generated/        # Prisma client
│   │   └── migrations/       # Database migrations
│   └── locales/              # ✅ Internationalization
│       ├── en/               # English translations
│       └── ar/               # Arabic translations
├── docs/                     # ✅ Project Documentation
│   ├── api-gateway/          # Gateway documentation
│   ├── auth-service/         # Auth service documentation
│   └── global-architecture.md # This document
├── docker-compose.yml        # Local development setup
└── README.md                 # Project overview
```

## Next Steps and Roadmap

### Phase 1: Foundation (Completed ✅)

- [x] API Gateway setup with request routing
- [x] Auth Service with JWT authentication
- [x] Database schema and user management
- [x] Security middleware and CORS configuration
- [x] Basic frontend integration
- [x] Documentation structure

### Phase 2: User Management (Next)

- [ ] User Service for profile management
- [ ] Email verification system
- [ ] Password reset functionality
- [ ] User address management
- [ ] Account settings and preferences

### Phase 3: Product Catalog (Future)

- [ ] Product Service for catalog management
- [ ] Category and attribute system
- [ ] Multi-vendor product support
- [ ] Product search and filtering
- [ ] Inventory management

### Phase 4: Order Processing (Future)

- [ ] Order Service for cart and checkout
- [ ] Payment Service integration
- [ ] Order tracking and fulfillment
- [ ] Shipping and delivery management

### Phase 5: Platform Features (Future)

- [ ] Review and rating system
- [ ] Notification service (email, SMS, push)
- [ ] Admin panel and management tools
- [ ] Analytics and reporting
- [ ] Mobile application

## Contributing

### Development Guidelines

1. **Service Independence**: Each microservice should be independently deployable
2. **API First**: Design APIs before implementing service logic
3. **Documentation**: Update docs when adding new features
4. **Security**: Always implement proper authentication and authorization
5. **Testing**: Write tests for all new functionality

### Adding New Services

1. Create service directory in `services/`
2. Use internal-only routing (`/internal/*`)
3. Add security middleware for external access protection
4. Update API Gateway routing configuration
5. Add service documentation in `docs/`
6. Update this global architecture document

### Database Changes

1. Update `packages/db/schema.prisma`
2. Create and run migrations
3. Regenerate Prisma client
4. Update service dependencies
5. Document schema changes

---

**Last Updated**: June 13, 2025  
**Implementation Status**: Phase 1 Complete - Authentication and API Gateway  
**Next Milestone**: User Service Implementation
├── Payment Service (2+ instances)
└── Database Cluster (Primary + Read Replicas)

```

## Monitoring and Observability

### 1. Health Checks

Each service exposes health endpoints:

```

GET /health # Service health
GET /health/db # Database connectivity
GET /health/deps # External dependencies

````

### 2. Logging Strategy

**Structured Logging** (JSON format):

```json
{
  "timestamp": "2025-06-13T13:00:00.000Z",
  "level": "info",
  "service": "api-gateway",
  "method": "POST",
  "path": "/api/v1/auth/login",
  "statusCode": 200,
  "responseTime": 125,
  "userId": "user_123",
  "correlationId": "req_456"
}
````

### 3. Metrics Collection

- **Request Metrics**: Count, duration, status codes
- **Business Metrics**: Registrations, orders, revenue
- **System Metrics**: CPU, memory, disk usage
- **Error Rates**: By service and endpoint

## Technology Stack

### Backend Services

- **Runtime**: Node.js 18+ (LTS)
- **Framework**: NestJS 10.x (API Gateway + Microservices)
- **Database**: PostgreSQL 15
- **ORM**: Prisma 6.9.0
- **Caching**: Redis 7
- **Authentication**: JWT + bcrypt

### Frontend Applications

- **Framework**: Next.js 15.4.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Internationalization**: Custom LanguageProvider
- **State Management**: React Context + Zustand (future)

### Development Tools

- **Containerization**: Docker + Docker Compose
- **API Documentation**: Swagger/OpenAPI
- **Code Quality**: ESLint + Prettier
- **Testing**: Jest + Supertest
- **Version Control**: Git + GitHub

## Future Roadmap

### Phase 1: Core Platform (Current)

- ✅ Project setup and architecture
- ✅ API Gateway implementation
- ✅ Auth Service with JWT
- ✅ Frontend with auth flow
- 🔄 User Service
- 🔄 Product Service (basic)

### Phase 2: MVP Features

- 📋 Order management
- 📋 Payment integration
- 📋 Basic admin panel
- 📋 Product search and filtering
- 📋 Shopping cart

### Phase 3: Advanced Features

- 📋 Multi-vendor support
- 📋 Review and rating system
- 📋 Advanced notifications
- 📋 Analytics dashboard
- 📋 Mobile app (React Native)

### Phase 4: Scale and Optimize

- 📋 Performance optimization
- 📋 Advanced caching strategies
- 📋 Event-driven architecture
- 📋 Machine learning recommendations
- 📋 Advanced reporting

## Contributing

### Code Standards

- **TypeScript**: Strict mode enabled
- **Naming**: camelCase for variables, PascalCase for classes
- **Imports**: Use absolute paths with `@/` prefix
- **Comments**: JSDoc for public APIs

### Git Workflow

1. Create feature branch from `main`
2. Implement changes with tests
3. Create pull request with description
4. Code review and approval
5. Merge to main and deploy

### Service Creation Checklist

- [ ] Create service directory in `services/`
- [ ] Implement NestJS modules and controllers
- [ ] Add internal route prefix (`/internal`)
- [ ] Update Prisma schema if needed
- [ ] Add routes to API Gateway
- [ ] Create service documentation
- [ ] Add Docker configuration
- [ ] Write unit and integration tests
- [ ] Update global architecture docs
