# Auth Service API Documentation

## Overview

The Auth Service handles user authentication, registration, and session management for the Flipstaq eCommerce platform. It implements a modern persistent login strategy using short-lived access tokens and long-lived refresh tokens.

## Base URL

- Development: `http://localhost:3001/internal/auth`
- Production: `https://api.flipstaq.com/internal/auth`

## Authentication Strategy

- **Access Token**: 15 minutes (JWT in Authorization header)
- **Refresh Token**: 30 days (HttpOnly cookie)
- **Persistent Login**: Users stay logged in for 30 days unless they logout

## Endpoints

### POST /signup

Register a new user account.

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "password": "SecurePassword123!",
  "dateOfBirth": "1990-01-15",
  "country": "United States"
}
```

**Response:** `201 Created`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "country": "United States",
    "emailVerified": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Cookies Set:**

```
Set-Cookie: refreshToken=eyJ...; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/
```

### POST /login

Authenticate user with email/username and password.

**Request Body:**

```json
{
  "identifier": "john.doe@example.com", // email or username
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "country": "United States",
    "emailVerified": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### POST /refresh

Refresh access token using refresh token cookie.

**Request Body:**

```json
{}
 // Empty body - refresh token sent via HttpOnly cookie
```

**Response:** `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "john.doe@example.com"
    // ... updated user details
  }
}
```

### POST /logout

**Authentication:** Bearer token required

Log out user and invalidate refresh token.

**Response:** `204 No Content`

**Effect:**

- Invalidates refresh token in database
- Clears refresh token cookie
- User must login again

### POST /validate

**Authentication:** Bearer token required

Validate current user token and get user information.

**Response:** `200 OK`

```json
{
  "id": "uuid-here",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "country": "United States",
  "emailVerified": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### GET /verify-email

Verify user email with verification token.

**Query Parameters:**

- `token` (string, required): Email verification token

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### POST /resend-verification

Resend email verification.

**Request Body:**

```json
{
  "email": "john.doe@example.com"
}
```

### POST /forgot-password

Request password reset.

**Request Body:**

```json
{
  "email": "john.doe@example.com"
}
```

### POST /reset-password

Reset password with reset token.

**Request Body:**

```json
{
  "token": "reset-token-here",
  "password": "NewSecurePassword123!"
}
```

### POST /change-password

**Authentication:** Bearer token required

Change user password.

**Request Body:**

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword123!"
}
```

## Error Responses

### 400 Bad Request

```json
{
  "message": "Validation failed",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 401 Unauthorized

```json
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### 409 Conflict

```json
{
  "message": "Email already exists",
  "error": "Conflict",
  "statusCode": 409
}
```

## Security Headers

All responses include security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

## Rate Limiting

- Login attempts: 5 per minute per IP
- Password reset: 3 per hour per email
- Token refresh: 10 per minute per user

## Environment Variables

```env
# JWT Configuration
JWT_SECRET="your-secret-key"
JWT_ACCESS_TOKEN_EXPIRY="15m"
JWT_REFRESH_TOKEN_EXPIRY="30d"
JWT_REFRESH_SECRET="your-refresh-secret"

# Database
DATABASE_URL="postgresql://..."

# Email Service
RESEND_API_KEY="re_..."
EMAIL_FROM="Flipstaq <noreply@flipstaq.com>"
```
