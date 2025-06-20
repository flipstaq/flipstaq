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

## 🔍 Public User Search

The API Gateway now provides a public user search endpoint that doesn't require authentication:

- **Endpoint**: `GET /api/v1/public/users/search?query=<search_term>&limit=<number>`
- **Access**: Public (no authentication required)
- **Purpose**: Allows users to search for other users by username, first name, or last name
- **Rate Limiting**: Limited to prevent abuse (default 10 results max)
- **Security**: Only returns public user information (id, username, firstName, lastName)

This endpoint enables messaging functionality by allowing users to find and start conversations with other users.

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
- **Body**: RefreshDto (refreshToken)
- **Response**: New access token

### Messaging Routes

All messaging routes are proxied to the internal message service and require authentication:

#### GET `/api/v1/messages/conversations`

- **Purpose**: Get user's conversations
- **Forwards to**: `message-service:3003/internal/conversations`
- **Headers**: Authorization Bearer token required
- **Response**: Array of conversations with participants and last message

#### GET `/api/v1/messages/conversations/:id/messages`

- **Purpose**: Get messages for a specific conversation
- **Forwards to**: `message-service:3003/internal/conversations/:id/messages`
- **Headers**: Authorization Bearer token required
- **Query Params**: `limit` (optional), `offset` (optional)
- **Response**: Array of messages

#### POST `/api/v1/messages/conversations`

- **Purpose**: Create a new conversation
- **Forwards to**: `message-service:3003/internal/conversations`
- **Headers**: Authorization Bearer token required
- **Body**: CreateConversationDto (participantUsername)
- **Response**: Created conversation

#### POST `/api/v1/messages/send`

- **Purpose**: Send a message
- **Forwards to**: `message-service:3003/internal/send`
- **Headers**: Authorization Bearer token required
- **Body**: SendMessageDto (content, conversationId)
- **Response**: Created message

### User Search Routes

#### GET `/api/v1/public/users/search`

- **Purpose**: Search for users by username, first name, or last name
- **Access**: Public (no authentication required)
- **Forwards to**: `user-service:3002/public/users/search`
- **Query Params**: `query` (required), `limit` (optional, max 10)
- **Response**: Array of public user information (id, username, firstName, lastName)

### User Management Routes (Protected)

#### GET `/api/v1/users`

- **Purpose**: Get user list (admin only)
- **Forwards to**: `user-service:3002/internal/users`
- **Headers**: Authorization Bearer token required
- **Access**: HIGHER_STAFF role or above
- **Response**: Array of users

#### GET `/api/v1/users/:id`

- **Purpose**: Get user by ID
- **Forwards to**: `user-service:3002/internal/users/:id`
- **Headers**: Authorization Bearer token required
- **Response**: User information

#### PUT `/api/v1/users/:id`

- **Purpose**: Update user (admin or self)
- **Forwards to**: `user-service:3002/internal/users/:id`
- **Headers**: Authorization Bearer token required
- **Body**: UpdateUserDto
- **Response**: Updated user information

## Service Routing

```typescript
// Example internal service URLs
const serviceUrls = {
  auth: "http://localhost:3001",
  user: "http://localhost:3002",
  message: "http://localhost:3003",
  product: "http://localhost:3004", // Future
  order: "http://localhost:3005", // Future
  payment: "http://localhost:3006", // Future
};
```

### Internal Communication

- All internal service calls use `/internal/*` paths
- Public endpoints bypass internal routing
- JWT tokens are validated before forwarding to protected services
- Service responses are cleaned to avoid circular JSON issues

## Response Format

### Success Response

```json
{
  "status": "success",
  "data": {
    /* service response */
  }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE"
}
```
