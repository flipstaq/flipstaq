# Email Verification Testing Guide

## Prerequisites

1. Ensure all services are running (auth-service, api-gateway, web app)
2. Set up a valid Resend API key in `.env`
3. Have access to test email addresses

## Test Cases

### 1. User Signup with Email Verification

**Steps:**

1. Navigate to `/auth/signup`
2. Fill out the signup form with a valid email
3. Submit the form
4. Check that:
   - User is created successfully
   - User receives JWT tokens
   - User's `emailVerified` field is `false`
   - Verification email is sent to the provided address

**Expected Results:**

- Success response from signup API
- Email verification banner appears after login
- Verification email received in inbox

### 2. Email Verification Link Click

**Steps:**

1. Open verification email from test case 1
2. Click "Verify Email Address" button
3. Check that:
   - Browser redirects to `/?verified=true`
   - Success message displays on homepage
   - User's `emailVerified` field becomes `true`
   - Verification banner disappears

**Expected Results:**

- Successful redirect with verification success message
- Database updated with verified status
- No more verification prompts

### 3. Invalid/Expired Token Handling

**Steps:**

1. Modify verification URL to use invalid token
2. Visit the modified URL
3. Wait 31+ minutes after signup and try original verification link
4. Check that:
   - Invalid token redirects to `/?verify=invalid`
   - Error message displays appropriately
   - Database remains unchanged

**Expected Results:**

- Proper error handling and user feedback
- Security maintained with expired tokens

### 4. Verification Email Resend

**Steps:**

1. Create unverified account (test case 1)
2. Login and observe verification banner
3. Click "Resend Verification Email" button
4. Check that:
   - New verification email is sent
   - Success feedback shows in banner
   - New token generated in database
   - Old token is invalidated

**Expected Results:**

- New email received with fresh token
- UI feedback confirms resend action

### 5. Banner Dismissal and Persistence

**Steps:**

1. Login with unverified account
2. Dismiss verification banner by clicking X
3. Navigate to different pages
4. Refresh browser
5. Check banner behavior

**Expected Results:**

- Banner hidden when dismissed
- Banner reappears on page refresh (session-based dismissal)

### 6. Verified User Experience

**Steps:**

1. Complete email verification (test case 2)
2. Login with verified account
3. Navigate through application
4. Check that:
   - No verification banner appears
   - All features are accessible
   - User status properly reflected in UI

**Expected Results:**

- Clean experience without verification prompts
- Full application access

## API Testing

### Manual API Tests

#### 1. Verify Email Endpoint

```bash
curl -X GET "http://localhost:3100/api/v1/auth/verify-email?token=valid-token-here"
```

#### 2. Resend Verification Endpoint

```bash
curl -X POST "http://localhost:3100/api/v1/auth/resend-verification" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Expected API Responses

#### Successful Verification

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### Invalid Token

```json
{
  "success": false,
  "message": "Invalid verification token"
}
```

#### Expired Token

```json
{
  "success": false,
  "message": "Verification token has expired"
}
```

## Debugging

### Common Issues

1. **Email not sending**: Check Resend API key and configuration
2. **Token not found**: Verify database schema migration completed
3. **Redirect not working**: Check frontend URL configuration
4. **Banner not showing**: Verify user context and authentication state

### Debug Endpoints

- Check user verification status: `GET /auth/me`
- View user data in database directly
- Check application logs for email sending errors

### Environment Verification

Ensure these environment variables are set:

```
RESEND_API_KEY=your-api-key
EMAIL_FROM=Flipstaq <noreply@flipstaq.com>
FRONTEND_URL=http://localhost:3000
```

## Load Testing

### High Volume Signup

1. Create multiple user accounts rapidly
2. Verify email service doesn't get overwhelmed
3. Check token uniqueness across users

### Concurrent Verification

1. Generate multiple verification tokens
2. Attempt simultaneous verifications
3. Ensure proper database locking and consistency

## Security Testing

### Token Security

1. Attempt to use tokens for different users
2. Try to reuse already-consumed tokens
3. Test token format manipulation
4. Verify token expiration enforcement

### Email Spoofing Protection

1. Ensure emails can only be resent for valid accounts
2. Test rate limiting on resend functionality
3. Verify proper sender validation

## Monitoring

### Key Metrics to Track

- Email delivery success rate
- Verification completion rate
- Token expiration rate
- Resend request frequency

### Logging Points

- Email send attempts and results
- Token generation and validation
- Verification success/failure events
- Error conditions and debugging info
