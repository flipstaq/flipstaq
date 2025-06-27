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
  - User blocking restrictions (blocked users' products are hidden)
  - Internal-only API with security middleware

**Key Features:**

- Complete product posting and listing functionality
- SEO-friendly URLs with username and slug
- Multi-currency support (USD, AED, EUR, GBP, SAR)
- Location-based product organization
- Slug uniqueness enforcement per user
- User blocking integration (products from blocked users are filtered out)
- Integration with shared Prisma database schema

### User Service (`services/user-service/`)

- **Purpose**: User profile management and user blocking system
- **Port**: 3002 (Internal only - no direct external access)
- **Technology**: NestJS 11.1.3 + TypeScript + Prisma
- **Status**: ✅ **Implemented**
- **Responsibilities**:
  - User profile management
  - User blocking and unblocking functionality
  - Block status checking
  - User search for messaging
  - Online/offline status management
  - Internal-only API with security middleware

**Key Features:**

- Complete user blocking system
- Block status checking between users
- User search functionality for messaging
- Online status tracking and cleanup
- Integration with shared Prisma database schema

### Message Service (`services/message-service/`)

- **Purpose**: Real-time messaging system with blocking support
- **Port**: 3005 (Internal only - no direct external access)
- **Technology**: NestJS 11.1.3 + WebSocket + TypeScript + Prisma
- **Status**: ✅ **Implemented**
- **Responsibilities**:
  - Direct messaging between users
  - Conversation management
  - File attachments support
  - User blocking enforcement (blocked users cannot message each other)
  - Real-time message delivery via WebSocket
  - Internal-only API with security middleware

**Key Features:**

- Real-time messaging with WebSocket support
- File attachment support
- User blocking integration (prevents messaging between blocked users)
- Conversation management
- Message read status tracking
- Integration with shared Prisma database schema

## Currently Implemented Features

### ✅ User Authentication System

- **User Registration**: Full signup flow with validation
- **User Login**: Email/username authentication
- **Password Reset**: Secure token-based password reset via email (30-min expiry)
- **Password Change**: Authenticated password change with current password verification
- **JWT Tokens**: Access tokens (2h) and refresh tokens (7 days) with automatic refresh
- **Password Security**: bcrypt hashing with salt (12 rounds)
- **Age Verification**: Minimum 13 years old requirement
- **Role Management**: Four-tier role system
- **Email Integration**: Resend integration for verification and password reset emails
- **Rate Limiting**: Protection against abuse for password operations

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
- **Product Listing**: Homepage and catalog product display with blocking filters
- **Slug Management**: SEO-friendly URLs (@username/slug format)
- **Multi-Currency**: Support for USD, AED, EUR, GBP, SAR
- **Location Support**: Country-based or global product listings
- **User Association**: Products linked to their owners
- **Blocking Integration**: Products from blocked users are automatically filtered out
- **Data Validation**: Comprehensive input validation and error handling

### ✅ User Blocking System

- **Block Users**: Users can block other users to prevent interactions
- **Unblock Users**: Users can unblock previously blocked users
- **Block Status Checking**: Real-time checking of block status between users
- **Messaging Restrictions**: Blocked users cannot send messages to each other
- **Product Visibility**: Products from blocked users are hidden from view
- **UI Integration**: Block/Unblock buttons in messaging interface and product pages
- **Confirmation Modals**: User-friendly confirmation dialogs for blocking actions

### ✅ Real-time Messaging System

- **Direct Messaging**: One-on-one conversations between users
- **File Attachments**: Support for document and image attachments
- **Real-time Delivery**: WebSocket-based instant message delivery
- **Conversation Management**: Persistent conversation history
- **Read Status**: Message read/unread status tracking
- **Blocking Integration**: Prevents messaging between blocked users
- **Online Status**: Real-time user online/offline status tracking

### ✅ Persistent Authentication System

- **Modern Login Experience**: Users stay logged in indefinitely like Discord/YouTube
- **Dual Token Strategy**:
  - Short-lived access tokens (15 minutes) for API calls
  - Long-lived refresh tokens (30 days) for session persistence
- **Secure Cookie Storage**: Refresh tokens stored in HttpOnly cookies
- **Automatic Token Refresh**: Seamless background token renewal
- **No "Remember Me"**: All logins are persistent by default
- **Security Features**:
  - HttpOnly cookies prevent XSS attacks
  - Secure cookies for HTTPS in production
  - SameSite protection against CSRF
  - Token rotation on refresh
  - Database-backed token invalidation

**Token Configuration:**

```env
# New persistent login strategy (all services)
JWT_SECRET="supersupersecretCEMal"
JWT_ACCESS_TOKEN_EXPIRY="15m"   # Short-lived for API calls
JWT_REFRESH_TOKEN_EXPIRY="30d"  # Long-lived for persistence
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Legacy variables (maintained for backward compatibility)
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"
```

**Authentication Flow:**

1. User logs in → receives access token + refresh token cookie
2. Access token expires (15min) → automatically refreshes using cookie
3. New tokens generated → user stays logged in seamlessly
4. User explicitly logs out → tokens invalidated, cookies cleared

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
// Enums
enum Role {
  USER
  STAFF
  HIGHER_STAFF
  OWNER
}

enum ProductType {
  DIGITAL
  PHYSICAL
  SERVICE
}

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
  reviews         Review[]
  refreshTokens   RefreshToken[] // For persistent login
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model Product {
  id          String      @id @default(cuid())
  title       String
  description String?
  category    String?
  price       Float
  currency    String      @default("USD")
  location    String      // Country or "Global"
  slug        String      // User-chosen URL part
  imageUrl    String?     // Product image URL
  type        ProductType // DIGITAL, PHYSICAL, or SERVICE
  userId      String
  isActive    Boolean     @default(true)
  isSold      Boolean     @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  // Relations
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  favorites   Favorite[]
  reviews     Review[]

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

model Review {
  id        String   @id @default(cuid())
  rating    Int      // 1–5
  comment   String
  productId String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([productId, userId]) // One review per user per product
}

model Block {
  id        String   @id @default(cuid())
  blockerId String
  blockedId String

  blocker   User @relation("Blocker", fields: [blockerId], references: [id], onDelete: Cascade)
  blocked   User @relation("Blocked", fields: [blockedId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([blockerId, blockedId])
}

model Conversation {
  id           String   @id @default(cuid())
  participants User[]   @relation("ConversationParticipants")
  messages     Message[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Message {
  id             String       @id @default(cuid())
  content        String?
  senderId       String
  conversationId String
  read           Boolean      @default(false)
  createdAt      DateTime     @default(now())

  sender         User         @relation(fields: [senderId], references: [id], onDelete: Cascade)
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  attachments    MessageAttachment[]
}

model MessageAttachment {
  id        String   @id @default(cuid())
  messageId String
  fileUrl   String
  fileName  String
  fileType  String
  fileSize  Int
  metadata  Json?    // Store product cover and other metadata as JSON
  createdAt DateTime @default(now())

  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
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

## Frontend API Route Architecture

### Route Organization

The frontend uses a carefully organized API route structure to avoid conflicts and provide clear separation of concerns:

```
/api/
├── products/
│   ├── index.ts                    # Get all products, create products
│   ├── my-products.ts              # Current user's products
│   └── [slug]/
│       ├── reviews.ts              # All reviews for a product
│       └── user-review.ts          # Current user's review for a product
├── users/
│   └── [username]/
│       └── products/
│           └── [slug].ts           # Get product by username and slug
├── reviews/
│   ├── index.ts                    # Create review, get user reviews
│   └── [reviewId].ts               # Update/delete specific review
├── favorites/
│   ├── index.ts                    # Get favorites, add favorite
│   └── [productId].ts              # Remove specific favorite
├── auth/
│   ├── login.ts                    # User authentication
│   ├── signup.ts                   # User registration
│   └── logout.ts                   # User logout
└── dashboard/
    └── stats.ts                    # Dashboard statistics
```

### Recent Routing Fix (June 2025)

**Issue Resolved**: Fixed Next.js dynamic route conflict.

**Problem**: Conflicting parameter names at the same route level:

- `/api/products/[slug]/` and `/api/products/[username]/` caused Next.js error

**Solution**: Restructured routes to eliminate conflicts:

- User-specific product routes moved to `/api/users/[username]/products/[slug]`
- Product-specific operations remain at `/api/products/[slug]/`

**Components Updated**:

- `ProductDetailPage.tsx` now uses `/api/users/${username}/products/${slug}`
- `ProductDetailModal.tsx` now uses `/api/users/${username}/products/${slug}`

### API Proxy Pattern

All frontend API routes act as proxies to the API Gateway:

1. **Frontend Route**: `/api/products` → **Gateway**: `/api/v1/products`
2. **Frontend Route**: `/api/auth/login` → **Gateway**: `/api/v1/auth/login`
3. **Frontend Route**: `/api/reviews` → **Gateway**: `/api/v1/products/reviews`

This pattern provides:

- **Simplified Frontend**: Clean route structure for components
- **Centralized Logic**: All business logic remains in microservices
- **Security**: Frontend routes can add additional validation/auth
- **Flexibility**: Can modify proxy behavior without changing components

## 🔄 Request Routing Patterns

### Standard API Gateway Pattern

Most requests follow the traditional API Gateway pattern:

```
Frontend → API Gateway → Microservice → Database
```

**Example**: User authentication, product listing, reviews

### Dual Routing Pattern (Product Updates)

Product updates use a specialized dual routing pattern to handle different content types efficiently:

#### Image Upload Requests

```
Frontend (FormData) → Next.js API Route → API Gateway (FileInterceptor) → Product Service → Database
```

**Characteristics**:

- Content-Type: `multipart/form-data`
- Uses `axios` + `form-data` package
- Handles file streaming and validation
- Requires specialized NestJS FileInterceptor

#### Text-Only Update Requests

```
Frontend (FormData) → Next.js API Route → Product Service (Direct) → Database
```

**Characteristics**:

- Content-Type: `application/json`
- Bypasses API Gateway for efficiency
- Direct internal service communication
- Requires internal service authentication headers

### Why Dual Routing?

1. **Technical Constraints**: NestJS FileInterceptor has strict multipart requirements
2. **Performance**: Text-only updates don't need file processing overhead
3. **Reliability**: Separate paths prevent "Unexpected end of form" errors
4. **Maintainability**: Clear separation of concerns between file and data updates

### Authentication in Both Patterns

**API Gateway Route**:

- JWT Bearer token in Authorization header
- API Gateway validates and forwards with internal headers

**Direct Service Route**:

- JWT token decoded by Next.js API route
- Internal service headers manually set:
  - `x-internal-service: 'true'`
  - `x-api-gateway: 'flipstaq-gateway'`
  - `x-user-id: <decoded-user-id>`

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
```

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

```

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
```

## Product Moderation and Approval Workflow

### Overview

Flipstaq implements a comprehensive product moderation system to ensure quality and compliance across the platform. All newly created products must be manually approved by staff members before becoming publicly visible.

### Workflow Process

1. **Product Creation**

   - User creates a product through the frontend
   - Product is automatically set to `status: PENDING`
   - Product is stored in database but not visible to the public
   - Seller can view their own pending products

2. **Staff Review**

   - Staff members access the admin panel
   - Pending products are displayed in a dedicated moderation queue
   - Staff can review product details, images, and descriptions
   - Staff makes approval/rejection decision with optional reason

3. **Approval Actions**

   - **Approve**: Product becomes publicly visible (`status: APPROVED`)
   - **Reject**: Product remains hidden with reason provided (`status: REJECTED`)

4. **Email Notifications**
   - Automated emails sent to sellers via Resend SDK
   - Approval emails confirm product is live
   - Rejection emails include detailed reason for rejection

### Database Schema Changes

```prisma
enum ProductStatus {
  PENDING
  APPROVED
  REJECTED
}

model Product {
  // ... existing fields
  status        ProductStatus @default(PENDING)
  approvedAt    DateTime?
  approvedById  String?
  approvedBy    User?        @relation("ProductApprovals", fields: [approvedById], references: [id])
}

model User {
  // ... existing fields
  approvedProducts Product[] @relation("ProductApprovals")
}
```

### Security and Access Control

- **Public Visibility**: Only approved products appear in:

  - Homepage listings
  - Search results
  - Category pages
  - Product detail pages (for non-owners)

- **Staff Permissions**:

  - `STAFF`: Can approve/reject products
  - `HIGHER_STAFF`: Can approve/reject products
  - `OWNER`: Can approve/reject products

- **Seller Access**: Product owners can view their own products regardless of status

### Technical Implementation

#### Backend Services

- **Product Service**: Handles CRUD operations and approval logic
- **Mailer Service**: Sends email notifications via Resend
- **API Gateway**: Exposes public and admin endpoints

#### Frontend Components

- **Admin Panel**: Product moderation interface for staff
- **Product Listings**: Filtered to show only approved products
- **Seller Dashboard**: Shows all products with status indicators

#### Email Templates

- **Approval**: Welcome message with product live confirmation
- **Rejection**: Professional explanation with improvement suggestions

### API Endpoints

```
GET  /api/products/admin/pending     - Get pending products (Admin only)
PATCH /api/products/admin/:id/approve - Approve/reject product (Admin only)
GET  /api/products                   - Public listings (approved only)
GET  /api/products/@:username/:slug  - Product details (with approval checks)
```

### Quality Assurance

The moderation system ensures:

- Product descriptions are appropriate and accurate
- Images are relevant and professional
- Pricing is reasonable and clearly displayed
- Location information is valid
- Category assignment is correct
- No prohibited items are listed

This workflow maintains platform quality while providing clear feedback to sellers and ensuring a positive experience for buyers.

## 🔐 Security - Rate Limiting

### Authentication Rate Limiting Strategy

The platform implements a comprehensive rate limiting strategy to protect against authentication abuse:

#### Multi-Layer Protection

1. **API Gateway Level**: Broad rate limiting (20 req/min default)
2. **Microservice Level**: Endpoint-specific rate limiting
3. **IP-based Tracking**: All limits applied per client IP address

#### Critical Endpoint Protection

| Service | Endpoint | Limit | Window | Protection Against |
|---------|----------|-------|--------|-------------------|
| Auth Service | `/auth/refresh` | 5 requests | 1 minute | Token refresh abuse, replay attacks |
| Auth Service | `/auth/login` | 5 requests | 5 minutes | Brute force, credential stuffing |
| Auth Service | `/auth/signup` | 3 requests | 5 minutes | Automated account creation |

#### Security Features

- **Single-use refresh tokens**: Each refresh invalidates previous token
- **Automatic token cleanup**: Expired tokens removed from database
- **Comprehensive audit logging**: All attempts logged with IP tracking
- **Graceful error handling**: Proper HTTP 429 responses
- **Defense in depth**: Multiple layers of protection

#### Configuration

Rate limiting is configured via environment variables:
```bash
RATE_LIMIT_REFRESH_TOKENS="5_per_minute"
RATE_LIMIT_DEFAULT="10_per_minute"
```

#### Monitoring

All rate limiting events are logged for security monitoring:
- Failed authentication attempts
- Rate limit violations
- Token refresh patterns
- IP address tracking
- Error trends and analysis

For detailed implementation, see [Auth Service Rate Limiting Security](./auth-service/rate-limiting-security.md).
````
