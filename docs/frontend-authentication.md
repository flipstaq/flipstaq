# FlipStaq Frontend Authentication

## Overview

The frontend now uses **real JWT authentication** with no mock data or hardcoded tokens. All authentication flows integrate with the backend API Gateway and auth service.

## 🔐 Authentication Implementation

### Real JWT Flow

1. **User Registration/Login**

   - Forms submit to `/api/v1/auth/signup` or `/api/v1/auth/login`
   - Backend validates credentials and returns JWT tokens
   - Tokens are stored in localStorage (production should use secure httpOnly cookies)

2. **Token Management**

   - Access Token: 15 minutes expiration, used for API requests
   - Refresh Token: 7 days expiration, used for token renewal
   - Automatic inclusion in `Authorization: Bearer <token>` headers

3. **Role-Based Access Control**
   - USER: Standard customer access
   - STAFF: Basic admin panel access
   - HIGHER_STAFF: Elevated admin privileges
   - OWNER: Full platform access

### Authentication Provider

```typescript
// Real authentication using authService
const validateCurrentUser = async () => {
  try {
    const userInfo = await authService.validateToken();
    setUser(userInfo);
  } catch (error) {
    console.warn("Token validation failed:", error);
    // Redirect to login
  }
};
```

### API Client Security

All API requests now require valid authentication:

```typescript
// No more mock tokens - real JWT required
const token = localStorage.getItem("authToken");
if (!token) {
  throw new ApiError("Authentication required. Please log in.", 401);
}

const config = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};
```

## 🛡️ Admin Panel Protection

### Route Guards

Admin routes are protected by `AdminRouteGuard`:

- **Unauthenticated users**: Redirected to `/auth/login?redirect=/admin`
- **Regular users**: Redirected to home page
- **Admin users**: Full access to admin features

### Admin User Creation

Admin users must be created via direct database access or API calls with OWNER role:

```bash
# Example admin user creation
curl -H "Content-Type: application/json" -X POST http://localhost:3100/api/v1/auth/signup \
  -d '{"firstName":"Admin","lastName":"User","email":"admin@flipstaq.com","username":"admin","password":"admin123","dateOfBirth":"1990-01-01","country":"US","role":"OWNER"}'
```

## 🔄 User Fetching (Fixed)

### Real API Integration

The admin panel now fetches real users from the database:

- **Endpoint**: `GET /api/v1/users` (requires admin role)
- **Authentication**: Real JWT tokens with role validation
- **Data Source**: PostgreSQL database via Prisma ORM
- **Pagination**: Full pagination support with query parameters

### Error Handling

- **401 Unauthorized**: Invalid or missing JWT token
- **403 Forbidden**: Valid token but insufficient permissions (USER role trying to access admin endpoints)
- **Network Errors**: Proper error messages for connectivity issues

## 🧪 Testing Authentication

### Manual Testing

1. **Sign Up**: Visit `/auth/signup` and create an account
2. **Login**: Use credentials to log in
3. **Admin Access**: Create admin user and test admin panel access
4. **Token Validation**: Check that tokens are properly stored and used

### API Testing

```bash
# Test user signup
curl -H "Content-Type: application/json" -X POST http://localhost:3100/api/v1/auth/signup \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","username":"testuser","password":"password123","dateOfBirth":"1990-01-01","country":"US"}'

# Test login
curl -H "Content-Type: application/json" -X POST http://localhost:3100/api/v1/auth/login \
  -d '{"identifier":"test@example.com","password":"password123"}'

# Test admin endpoint (with token from login)
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3100/api/v1/users
```

## 🌐 Multi-Language Support

Authentication works in both English and Arabic:

- **RTL Support**: Login/signup forms adapt to Arabic language
- **Error Messages**: Translated validation and error messages
- **Admin Panel**: Full i18n support for admin interface

## 🚀 Production Considerations

For production deployment:

1. **Secure Token Storage**: Replace localStorage with httpOnly cookies
2. **HTTPS**: Ensure all authentication endpoints use HTTPS
3. **Token Refresh**: Implement automatic token refresh logic
4. **Rate Limiting**: Add rate limiting to authentication endpoints
5. **Session Management**: Consider Redis for session storage

## ✅ Verification Checklist

- [x] All mock authentication removed
- [x] Real JWT tokens implemented
- [x] Role-based access control working
- [x] Admin panel fetches real users
- [x] Authentication redirects functional
- [x] Error handling for auth failures
- [x] Multi-language support maintained
- [x] API endpoints properly secured
