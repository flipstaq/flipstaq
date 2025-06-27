# Flipstaq Persistent Login Strategy

## Overview

Flipstaq implements a modern persistent login system similar to Discord, YouTube, and other contemporary applications. Users remain logged in indefinitely unless they explicitly log out, providing a seamless user experience.

## Authentication Flow

### Token Strategy

**Short-lived Access Token (15 minutes)**

- Used for API authentication
- Stored in memory or short-lived storage on client
- Automatically refreshed in background

**Long-lived Refresh Token (30 days)**

- Used to generate new access tokens
- Stored as secure HttpOnly cookie
- Persistent across browser sessions

### Login Process

1. User submits credentials to `/auth/login`
2. Server validates credentials
3. Server generates access token (15m) and refresh token (30d)
4. Access token returned in response body
5. Refresh token set as HttpOnly cookie with 30-day expiry
6. User remains logged in for 30 days unless they logout

### Token Refresh Process

1. When access token expires (15 minutes), client automatically calls `/auth/refresh`
2. Refresh token sent automatically via HttpOnly cookie
3. Server validates refresh token
4. New access token (15m) and refresh token (30d) generated
5. New refresh token updates the HttpOnly cookie
6. Client continues with new access token

### Logout Process

1. User clicks logout or calls `/auth/logout`
2. Server invalidates refresh token in database
3. HttpOnly cookie is cleared
4. Client removes access token from memory
5. User is fully logged out

## Security Features

### HttpOnly Cookies

- Refresh tokens stored as HttpOnly cookies
- Prevents XSS attacks from accessing refresh tokens
- Automatically sent with requests to auth endpoints

### Secure Cookies (Production)

- `Secure` flag enabled in production (HTTPS only)
- `SameSite=Lax` prevents CSRF attacks
- 30-day expiry for persistent login

### Token Rotation

- New refresh token generated on each refresh
- Old refresh tokens invalidated
- Prevents token replay attacks

### Rate Limiting

- Refresh endpoint should be rate limited
- Prevents brute force token attacks

## Environment Configuration

```env
# JWT Configuration - Persistent Login Strategy
JWT_SECRET="supersupersecretCEMal"
JWT_ACCESS_TOKEN_EXPIRY="15m"  # Short-lived access token
JWT_REFRESH_TOKEN_EXPIRY="30d" # Long-lived refresh token for persistent login
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"

# Legacy variables for backward compatibility
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"
```

## API Endpoints

### POST /auth/login

**Request:**

```json
{
  "identifier": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...", // Also set as HttpOnly cookie
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "username"
    // ... user details
  }
}
```

**Cookies Set:**

```
Set-Cookie: refreshToken=eyJ...; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000
```

### POST /auth/refresh

**Request:** (Empty body, refresh token sent via cookie)

```json
{}
```

**Response:**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...", // New refresh token also set as HttpOnly cookie
  "user": {
    // Updated user details
  }
}
```

### POST /auth/logout

**Request:** Bearer token in Authorization header
**Response:** 204 No Content
**Effect:** Clears refresh token cookie and invalidates tokens

## Frontend Implementation

### Token Storage

```typescript
// Store only access token in localStorage
localStorage.setItem("authToken", response.accessToken);
// Refresh token automatically handled via HttpOnly cookie
localStorage.setItem("user", JSON.stringify(response.user));
```

### Automatic Token Refresh

```typescript
// On 401 response, automatically refresh token
if (response.status === 401 && !isRefreshRequest) {
  await this.refreshToken(); // Calls /auth/refresh
  // Retry original request with new access token
}
```

### Session Persistence

- Users stay logged in across browser restarts
- No "Remember Me" checkbox needed
- 30-day session expiry (refreshes automatically)
- Only explicit logout terminates session

## Database Schema

### RefreshToken Table

```sql
CREATE TABLE "RefreshToken" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

## Benefits

1. **User Experience**: Seamless login experience like modern apps
2. **Security**: HttpOnly cookies prevent XSS attacks
3. **Performance**: Short access tokens reduce server validation load
4. **Scalability**: Refresh tokens can be stored separately if needed
5. **Flexibility**: Easy to adjust token lifetimes via environment variables

## Migration from Previous System

The new system is backward compatible:

- Legacy JWT settings still work
- New environment variables take precedence
- Existing sessions will expire naturally
- Users will experience seamless upgrade

## Troubleshooting

### User Logged Out After 1 Hour

- Check `JWT_ACCESS_TOKEN_EXPIRY` is set to `15m`
- Verify refresh endpoint is working
- Confirm cookies are enabled in browser

### Refresh Token Not Working

- Check cookie-parser is installed and configured
- Verify CORS credentials are enabled
- Confirm refresh token endpoint handles cookies

### Security Concerns

- Always use HTTPS in production for Secure cookies
- Monitor refresh token usage for suspicious activity
- Implement rate limiting on refresh endpoint
