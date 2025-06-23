# Password Reset and Change System

## Overview

This document describes the secure password reset and password change system implemented for Flipstaq. The system includes token-based password reset via email and authenticated password changes through user settings.

## Architecture

### Database Schema Changes

The `User` model in Prisma has been extended with two new fields:

```prisma
model User {
  // ... existing fields
  resetPasswordToken   String?   @unique
  resetTokenExpiresAt  DateTime?
  // ... rest of fields
}
```

### Security Features

- **Token Expiration**: Reset tokens expire after 30 minutes
- **One-time Use**: Tokens are invalidated after successful password reset
- **Rate Limiting**: Prevents abuse with configurable limits
- **Strong Password Hashing**: Uses bcrypt with 12 salt rounds
- **No Email Enumeration**: Same response for valid/invalid emails
- **Token Validation**: Separate endpoint for frontend token validation

## API Endpoints

### 1. Request Password Reset

**Endpoint**: `POST /api/auth/request-password-reset`

**Description**: Initiates a password reset flow by sending a reset email to the user.

**Request Body**:

```json
{
  "email": "user@example.com"
}
```

**Response**: Always returns success to prevent email enumeration

```json
{
  "message": "If an account with that email exists, a password reset link has been sent.",
  "success": true
}
```

**Rate Limiting**: 3 requests per 15 minutes per IP address

**Features**:

- Generates secure UUID token
- Sets 30-minute expiration
- Sends localized email via Resend
- Cleans up expired tokens automatically

### 2. Validate Reset Token

**Endpoint**: `POST /api/auth/validate-reset-token`

**Description**: Validates if a reset token is valid and not expired.

**Request Body**:

```json
{
  "token": "uuid-token-here"
}
```

**Response**:

```json
{
  "message": "Token is valid",
  "valid": true
}
```

**Error Response**:

```json
{
  "message": "Invalid or expired reset token",
  "valid": false
}
```

### 3. Reset Password

**Endpoint**: `POST /api/auth/reset-password`

**Description**: Resets the user's password using a valid token.

**Request Body**:

```json
{
  "token": "uuid-token-here",
  "password": "newpassword123"
}
```

**Response**:

```json
{
  "message": "Password has been reset successfully",
  "success": true
}
```

**Features**:

- Validates token and expiration
- Hashes new password with bcrypt (12 rounds)
- Clears reset token fields
- Logs successful resets

### 4. Change Password

**Endpoint**: `POST /api/auth/change-password`

**Description**: Changes user password when authenticated (requires current password).

**Headers**:

```
Authorization: Bearer <jwt-token>
```

**Request Body**:

```json
{
  "currentPassword": "currentpassword123",
  "newPassword": "newpassword123"
}
```

**Response**:

```json
{
  "message": "Password has been changed successfully",
  "success": true
}
```

**Rate Limiting**: 5 requests per 15 minutes per user

**Features**:

- Requires valid JWT authentication
- Verifies current password
- Prevents setting same password
- Logs successful changes

## Frontend Pages

### 1. Forgot Password Page

**Route**: `/auth/forgot-password`

**Features**:

- Simple email input form
- Form validation with Zod
- Responsive design with dark/light mode
- RTL support for Arabic
- Success/error state handling

### 2. Reset Password Page

**Route**: `/auth/reset-password?token=<token>`

**Features**:

- Token validation on page load
- Password and confirm password fields
- Real-time form validation
- Loading states during submission
- Success/error state handling
- Automatic redirect to login on success

### 3. Security Settings Page

**Route**: `/settings/security`

**Features**:

- Requires authentication
- Current password verification
- New password with confirmation
- Form validation and security checks
- Success/error feedback

## Email Templates

### Password Reset Email

**Location**: Inline template in `request-password-reset.ts`

**Features**:

- Localized content (English/Arabic)
- RTL support for Arabic emails
- Responsive HTML template
- Professional branding
- Clear call-to-action button
- Expiration time notice

**Email Content**:

- Subject: "Reset your password" / "إعادة تعيين كلمة المرور"
- Reset link with token
- 30-minute expiration notice
- Security disclaimer

## Security Considerations

### Token Security

- UUIDs generated using `crypto.randomUUID()`
- Stored as unique fields in database
- 30-minute expiration enforced
- Tokens cleared after use or expiration
- Database cleanup for expired tokens

### Password Security

- bcrypt hashing with 12 salt rounds
- Minimum 8 characters required
- Maximum 100 characters to prevent DoS
- Current password verification for changes
- Prevention of reusing current password

### Rate Limiting

- In-memory rate limiting (Redis recommended for production)
- IP-based limiting for reset requests
- User-based limiting for password changes
- Configurable time windows and limits

### Authentication

- JWT token verification for authenticated endpoints
- Token extraction from Authorization header
- Proper error handling for invalid tokens
- User existence verification

## Error Handling

### Common Error Responses

**Invalid Token**:

```json
{
  "message": "Invalid or expired reset token",
  "success": false
}
```

**Rate Limited**:

```json
{
  "message": "Too many password reset requests. Please try again later.",
  "success": false
}
```

**Validation Error**:

```json
{
  "message": "Invalid request data. Password must be at least 8 characters long.",
  "success": false
}
```

**Authentication Required**:

```json
{
  "message": "Authentication required",
  "success": false
}
```

## Internationalization

### Translation Keys

All UI text is internationalized with keys in:

- `packages/locales/en/auth.json`
- `packages/locales/ar/auth.json`

**Key Examples**:

```json
{
  "forgot_password": "Forgot your password?",
  "reset_password": "Reset your password",
  "new_password": "New password",
  "confirm_password": "Confirm password",
  "current_password": "Current password",
  "password_updated": "Your password has been updated",
  "invalid_token": "This link is invalid or has expired",
  "passwords_dont_match": "Passwords don't match"
}
```

### Email Localization

Email content is dynamically localized based on user's preferred language, with proper RTL support for Arabic emails.

## Testing Checklist

### Password Reset Flow

- [ ] Submit reset request with valid email
- [ ] Submit reset request with invalid email (should show same message)
- [ ] Verify email received with valid reset link
- [ ] Click reset link and verify token validation
- [ ] Submit new password and verify success
- [ ] Verify old password no longer works
- [ ] Verify new password works for login
- [ ] Test token expiration after 30 minutes
- [ ] Test rate limiting (3 requests per 15 minutes)

### Password Change Flow

- [ ] Access settings page while authenticated
- [ ] Submit with incorrect current password
- [ ] Submit with same new password as current
- [ ] Submit with valid current and new passwords
- [ ] Verify old password no longer works
- [ ] Verify new password works for login
- [ ] Test rate limiting (5 requests per 15 minutes)

### Security Tests

- [ ] Test with expired tokens
- [ ] Test with invalid/malformed tokens
- [ ] Test without authentication for change password
- [ ] Test email enumeration protection
- [ ] Test password strength requirements
- [ ] Test XSS prevention in error messages

## Production Considerations

### Environment Variables

Ensure these are properly configured:

- `JWT_SECRET`: Strong secret for JWT verification
- `RESEND_API_KEY`: Valid Resend API key
- `FRONTEND_URL`: Correct frontend URL for reset links
- `EMAIL_FROM`: Verified sender email address

### Performance

- Consider Redis for rate limiting in production
- Monitor email delivery rates
- Set up proper logging and alerting
- Consider database connection pooling

### Security

- Use HTTPS in production
- Implement proper CORS policies
- Monitor for suspicious activity
- Regular security audits
- Consider additional 2FA for password changes
