# Flipstaq Auth Service

## Overview

The Auth Service is an internal microservice responsible for user authentication, authorization, and account management. It operates as an internal-only service and should never be exposed directly to external clients.

## Architecture

```
API Gateway → Auth Service (Port 3001) → PostgreSQL Database
```

## Key Features

- **Internal Only**: Accessible only via API Gateway with proper headers
- **JWT Authentication**: Access and refresh token management
- **User Registration**: Account creation with validation
- **Password Security**: bcrypt hashing and validation
- **Database Integration**: Prisma ORM with PostgreSQL
- **Security Middleware**: Internal service protection

## Configuration

### Environment Variables

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:p@+1MSfvr@localhost:5432/flipstaq_dev"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV="development"

# CORS Configuration
FRONTEND_URL="http://localhost:3000"
```

## Internal API Endpoints

### Base Path: `/internal/auth`

All endpoints require proper internal service headers:

- `x-api-gateway: flipstaq-gateway`
- `x-internal-service: true`

#### POST `/internal/auth/signup`

**Purpose**: Register a new user account

**Request Body** (SignupDto):

```typescript
{
  firstName: string; // Required, min 1 char
  lastName: string; // Required, min 1 char
  email: string; // Required, valid email format
  username: string; // Required, min 2 chars, unique
  password: string; // Required, min 6 chars
  country: string; // Required
  birthDate: string; // Required, must be 13+ years old
}
```

**Response** (AuthResponseDto):

```typescript
{
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    country: string;
    role: "USER" | "STAFF" | "HIGHER_STAFF" | "OWNER";
    isEmailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  }
  accessToken: string;
  refreshToken: string;
}
```

**Status Codes**:

- `201`: User successfully registered
- `400`: Validation failed or age restriction
- `409`: Email or username already exists

#### POST `/internal/auth/login`

**Purpose**: Authenticate user with email/username and password

**Request Body** (LoginDto):

```typescript
{
  emailOrUsername: string; // Email address or username
  password: string; // User password
}
```

**Response**: AuthResponseDto (same as signup)

**Status Codes**:

- `200`: User successfully logged in
- `401`: Invalid credentials

#### POST `/internal/auth/logout`

**Purpose**: Logout and invalidate refresh token

**Headers**:

- `Authorization: Bearer <access_token>`

**Response**: No content (204)

**Status Codes**:

- `204`: User successfully logged out
- `401`: Invalid token

#### POST `/internal/auth/validate`

**Purpose**: Validate current user token and get user info

**Headers**:

- `Authorization: Bearer <access_token>`

**Response**: User object (without tokens)

**Status Codes**:

- `200`: Token is valid, returns user information
- `401`: Invalid token

## Data Models

### User Model

```typescript
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  username        String   @unique
  firstName       String
  lastName        String
  password        String   // bcrypt hashed
  country         String
  birthDate       DateTime
  role            Role     @default(USER)
  isEmailVerified Boolean  @default(false)
  refreshToken    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum Role {
  USER
  STAFF
  HIGHER_STAFF
  OWNER
}
```

## Security Features

### Password Security

- **Hashing**: bcrypt with salt rounds
- **Validation**: Minimum 6 characters required
- **Storage**: Only hashed passwords stored in database

### JWT Tokens

- **Access Token**: Short-lived (15 minutes)
- **Refresh Token**: Long-lived (7 days)
- **Secrets**: Separate secrets for access and refresh tokens
- **Claims**: User ID, email, username, role

### Internal Service Protection

- **Middleware**: Blocks direct external access
- **Headers**: Requires API Gateway authentication headers
- **CORS**: Restricted to API Gateway and localhost (development)
- **Development**: Allows localhost access for debugging

### Age Verification

- **Minimum Age**: 13 years old
- **Validation**: Calculated from birthDate at registration
- **Compliance**: COPPA compliance for user accounts

## Validation Rules

### User Registration

- **firstName**: Required, minimum 1 character
- **lastName**: Required, minimum 1 character
- **email**: Required, valid email format, unique
- **username**: Required, minimum 2 characters, unique
- **password**: Required, minimum 6 characters
- **country**: Required, must be valid country code
- **birthDate**: Required, user must be 13+ years old

### Login

- **emailOrUsername**: Required, accepts email or username
- **password**: Required

## Error Handling

### Common Error Responses

```typescript
// Validation Error (400)
{
  statusCode: 400,
  message: ["field validation error messages"],
  error: "Bad Request"
}

// Authentication Error (401)
{
  statusCode: 401,
  message: "Invalid credentials",
  error: "Unauthorized"
}

// Conflict Error (409)
{
  statusCode: 409,
  message: "Email already exists",
  error: "Conflict"
}

// Internal Service Access Error (401)
{
  statusCode: 401,
  message: "Direct access to internal service is not allowed",
  error: "Unauthorized"
}
```

## Development

### Starting the Service

```bash
cd services/auth-service
npm install --legacy-peer-deps
npm run start:dev
```

The service will be available at `http://localhost:3001` (internal only)

### Database Operations

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# View database
npm run prisma:studio
```

## Internal Documentation

Swagger documentation is available at:

- **URL**: `http://localhost:3001/api/docs`
- **Access**: Internal only (requires proper headers or localhost)
- **Note**: Contains warnings about internal-only access

## Dependencies

### External Services

- **PostgreSQL**: Database storage
- **API Gateway**: Request routing and authentication

### npm Packages

- **@nestjs/\*** - NestJS framework components
- **@prisma/client** - Database ORM
- **bcrypt** - Password hashing
- **passport-jwt** - JWT authentication strategy
- **class-validator** - Request validation
- **class-transformer** - Data transformation

## Project Structure

```
services/auth-service/
├── src/
│   ├── auth/                 # Authentication logic
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   ├── dto/                  # Data transfer objects
│   │   ├── signup.dto.ts
│   │   ├── login.dto.ts
│   │   └── auth-response.dto.ts
│   ├── prisma/               # Database connection
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── common/               # Shared utilities
│   │   ├── config/
│   │   └── middleware/
│   │       └── internal-service.middleware.ts
│   ├── app.module.ts
│   └── main.ts
├── .env                      # Environment configuration
├── Dockerfile                # Container configuration
└── package.json
```

## Testing

### Manual Testing via API Gateway

```bash
# Test user registration
curl -X POST http://localhost:3100/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "password": "password123",
    "country": "US",
    "birthDate": "1990-01-01"
  }'

# Test user login
curl -X POST http://localhost:3100/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "john@example.com",
    "password": "password123"
  }'

# Test token validation (requires token from login)
curl -X GET http://localhost:3100/api/v1/auth/validate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Testing Internal Service Protection

```bash
# This should fail with 401 Unauthorized
curl -X POST http://localhost:3001/internal/auth/signup \
  -H "Content-Type: application/json" \
  -d '{...}'

# This should work (with proper headers)
curl -X POST http://localhost:3001/internal/auth/signup \
  -H "Content-Type: application/json" \
  -H "x-api-gateway: flipstaq-gateway" \
  -H "x-internal-service: true" \
  -d '{...}'
```

## Implementation Details

### Authentication Flow

1. **User Registration**:

   - Validate input data (age, email uniqueness, etc.)
   - Hash password with bcrypt
   - Store user in database
   - Generate JWT tokens
   - Return user info + tokens

2. **User Login**:

   - Find user by email or username
   - Verify password with bcrypt
   - Generate new JWT tokens
   - Update refresh token in database
   - Return user info + tokens

3. **Token Validation**:
   - Verify JWT signature and expiration
   - Extract user information from token
   - Return user details

### Security Middleware

The `InternalServiceMiddleware` protects all routes:

```typescript
// Checks for proper gateway headers
if (internalHeader === "true" || apiGatewayHeader === "flipstaq-gateway") {
  return next();
}

// Allows localhost in development
if (process.env.NODE_ENV === "development" && isLocalhost) {
  return next();
}

// Blocks all other requests
throw new UnauthorizedException("Direct access not allowed");
```

## Deleted Account Handling

### Login Attempt by Deleted User

When a user whose account is soft-deleted (`isActive: false` or `deletedAt` is set) attempts to login:

- **Error Response**: `401 Unauthorized`
- **Message**: `"Your account has been deleted and access is denied."`
- **Behavior**: No JWT tokens are issued

### Session Management for Deleted Users

All authenticated requests (including token validation) check user deletion status:

- **Validation Method**: `validateUser()` checks both `isActive` and `deletedAt` fields
- **Error Response**: `401 Unauthorized`
- **Message**: `"Your account has been deleted. You have been logged out."`
- **API Gateway**: Automatically detects deleted user responses and forces logout

### Implementation Details

```typescript
// Login check
if (!user.isActive || user.deletedAt) {
  throw new UnauthorizedException(
    "Your account has been deleted and access is denied."
  );
}

// Token validation check
if (!user.isActive || user.deletedAt) {
  throw new UnauthorizedException(
    "Your account has been deleted. You have been logged out."
  );
}
```

## Future Enhancements

- Email verification flow
- Password reset functionality
- Two-factor authentication
- Account lockout mechanisms
- Audit logging
- Rate limiting per user
- Social login integration

## Session Persistence

### Token Management

The auth service implements a robust token management system designed to survive service restarts and provide seamless user experience:

#### Access Tokens

- **Expiration**: 2 hours (configurable via `JWT_EXPIRES_IN`)
- **Purpose**: Short-lived tokens for API access
- **Storage**: Frontend localStorage
- **Auto-refresh**: Automatic refresh before expiration

#### Refresh Tokens

- **Expiration**: 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)
- **Purpose**: Long-lived tokens for obtaining new access tokens
- **Storage**: Database + Frontend localStorage
- **Security**: Single-use tokens that generate new refresh tokens

### Development Resilience

In development mode, the system is designed to be resilient to service restarts:

1. **JWT Trust**: Valid JWT tokens are trusted without constant auth service validation
2. **Automatic Refresh**: Frontend automatically refreshes expired tokens
3. **Graceful Fallback**: API Gateway falls back to JWT payload if auth service is unavailable
4. **Session Continuity**: Users remain logged in across service restarts

### Troubleshooting "Unauthorized" Errors

If you encounter persistent "Unauthorized" errors after restarting services:

1. **Check JWT Secrets**: Ensure `JWT_SECRET` is consistent across all services
2. **Clear Browser Storage**: Clear localStorage if tokens become corrupted
3. **Service Restart Order**: Start auth service before API gateway
4. **Token Expiration**: Check if tokens have expired (default: 2h access, 7d refresh)

### Manual Session Reset

If automatic token refresh fails, users can manually reset their session:

```bash
# Clear browser localStorage
localStorage.removeItem('authToken');
localStorage.removeItem('refreshToken');
localStorage.removeItem('user');
```

Then refresh the page and log in again.
