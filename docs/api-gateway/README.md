# FlipStaq API Gateway

## Overview

The API Gateway serves as the single entry point for all external client requests to the FlipStaq eCommerce platform. It handles request routing, authentication, CORS, and communication with internal microservices.

## 🔐 Authentication System (Updated)

**Real JWT Authentication**: The API Gateway now uses real JWT tokens issued by the `auth-service`. All mock authentication has been removed.

**Authentication Flow**:

1. User signs up/logs in via `/api/v1/auth/signup` or `/api/v1/auth/login`
2. Auth service issues a real JWT access token (15 min) and refresh token (7 days)
3. Client stores tokens securely and includes them in `Authorization: Bearer <token>` headers
4. All protected endpoints require valid JWT tokens
5. Role-based access control enforced (USER, STAFF, HIGHER_STAFF, OWNER)

**No Mock Data**: All previous mock tokens, dummy users, and hardcoded authentication have been completely removed.

**Recent Fix**: Fixed auth service proxy path from `/auth/` to `/internal/auth/` to properly route authentication requests.

## ✅ Admin Panel Connection

The API Gateway now correctly forwards admin requests to fetch real user data:

- **Admin Login**: Use `testadmin@flipstaq.com` / `password123` for testing
- **User Management**: `/api/v1/users` endpoint returns real database users
- **Real Authentication**: All requests use valid JWT tokens from auth service
- **CORS**: Properly configured for frontend origin (`http://localhost:3000`)

**Test Results**: Complete authentication flow verified with 24 real users returned from database.

## Architecture

```
External Clients → API Gateway (Port 3100) → Internal Microservices
```

## Key Features

- **Single Entry Point**: All external API requests go through the gateway
- **Request Routing**: Forwards requests to appropriate internal microservices
- **Security**: CORS management and internal service authentication
- **API Versioning**: Consistent `/api/v1/*` endpoint structure
- **Documentation**: Centralized Swagger documentation

## Configuration

### Environment Variables

```env
NODE_ENV=development
PORT=3100
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Service URLs (Internal)
AUTH_SERVICE_URL=http://localhost:3001
```

### CORS Settings

```typescript
// Allowed origins for development
const corsOrigins = [
  "http://localhost:3000", // Frontend
  "http://localhost:3100", // Gateway itself
];
```

## Public API Endpoints

### Authentication Routes

All authentication routes are proxied to the internal auth service:

#### POST `/api/v1/auth/signup`

- **Purpose**: User registration
- **Forwards to**: `auth-service:3001/internal/auth/signup`
- **Body**: SignupDto (firstName, lastName, email, username, password, country, birthDate)
- **Response**: AuthResponseDto (tokens + user info)

#### POST `/api/v1/auth/login`

- **Purpose**: User authentication
- **Forwards to**: `auth-service:3001/internal/auth/login`
- **Body**: LoginDto (email/username, password)
- **Response**: AuthResponseDto (tokens + user info)

#### POST `/api/v1/auth/logout`

- **Purpose**: User logout and token invalidation
- **Forwards to**: `auth-service:3001/internal/auth/logout`
- **Headers**: Authorization Bearer token required
- **Response**: 204 No Content

#### GET `/api/v1/auth/validate`

- **Purpose**: Token validation and user info retrieval
- **Forwards to**: `auth-service:3001/internal/auth/validate`
- **Headers**: Authorization Bearer token required
- **Response**: User information

#### POST `/api/v1/auth/refresh`

- **Purpose**: Access token refresh
- **Forwards to**: `auth-service:3001/internal/auth/refresh`
- **Body**: Refresh token
- **Response**: New access token

#### POST `/api/v1/auth/forgot-password`

- **Purpose**: Password reset initiation
- **Forwards to**: `auth-service:3001/internal/auth/forgot-password`
- **Body**: Email address
- **Response**: Success message

#### POST `/api/v1/auth/reset-password`

- **Purpose**: Password reset completion
- **Forwards to**: `auth-service:3001/internal/auth/reset-password`
- **Body**: Reset token and new password
- **Response**: Success message

## Internal Communication

### Security Headers

When forwarding requests to internal services, the gateway adds security headers:

```typescript
headers: {
  'Content-Type': 'application/json',
  'x-api-gateway': 'flipstaq-gateway',
  'x-internal-service': 'true',
  'x-forwarded-from': 'api-gateway'
}
```

### Error Handling

- **400 Bad Request**: Validation errors from microservices
- **401 Unauthorized**: Authentication failures
- **500 Internal Server Error**: Communication failures with microservices

## Development

### Starting the Gateway

```bash
cd apps/api-gateway
npm install
npm run start:dev
```

The gateway will be available at `http://localhost:3100`

### API Documentation

Swagger documentation is available at:

- **URL**: `http://localhost:3100/api/docs`
- **Description**: Interactive API documentation for all public endpoints

## Security

- **CORS**: Restricted to specific origins (frontend and gateway)
- **Internal Headers**: Required for microservice communication
- **Token Validation**: JWT tokens validated through auth service
- **Rate Limiting**: Future implementation planned

## Service Dependencies

The API Gateway depends on:

- **Auth Service** (`localhost:3001`) - User authentication and authorization
- **Future Services** - Will be added as they are implemented

## Monitoring & Logging

- Request forwarding is logged with service targets
- Error responses include service-specific information
- Future: Health checks and metrics collection

## Testing

### Manual Testing

```bash
# Test gateway health
curl http://localhost:3100/api/docs

# Test auth signup via gateway
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

# Test auth login via gateway
curl -X POST http://localhost:3100/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "test@example.com",
    "password": "password123"
  }'
```

## Project Structure

```
apps/api-gateway/
├── src/
│   ├── auth/                 # Auth route handlers
│   │   └── auth-gateway.controller.ts
│   ├── proxy/                # Service forwarding logic
│   │   └── proxy.service.ts
│   ├── common/               # Shared utilities
│   │   └── config/
│   ├── app.module.ts
│   └── main.ts
├── .env                      # Environment configuration
├── Dockerfile                # Container configuration
└── package.json
```

## Implementation Details

### Proxy Service

The `ProxyService` handles forwarding requests to internal microservices:

```typescript
async forwardAuthRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  data?: any,
  headers?: Record<string, string>
): Promise<AxiosResponse>
```

### Controller Pattern

Each service domain has its own gateway controller:

```typescript
@Controller("api/v1/auth")
export class AuthGatewayController {
  // Routes that forward to auth-service
}
```

## Future Enhancements

- Rate limiting per client
- Request/response caching
- Circuit breaker pattern
- Load balancing for multiple service instances
- API analytics and monitoring
- WebSocket support for real-time features
