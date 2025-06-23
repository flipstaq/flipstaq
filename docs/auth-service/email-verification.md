# Email Verification System

## Overview

The email verification system ensures that users have access to the email address they register with. It uses the **official Resend SDK** as the email service provider and implements a secure token-based verification flow.

## Architecture

### Email Service Integration

- Uses the official **Resend SDK** (`resend` npm package) for type-safe email sending
- Configured with environment variables for API key and sender address
- Comprehensive error handling and logging
- Graceful degradation when email service is unavailable

### Database Changes

The User model has been extended with three new fields:

- `emailVerified: Boolean` - Whether the user has verified their email (default: false)
- `verificationToken: String?` - Unique token for email verification (nullable, unique)
- `tokenExpiresAt: DateTime?` - When the verification token expires (nullable)

### Flow Overview

1. User signs up → Account created with `emailVerified: false`
2. Verification email sent with unique token (30-minute expiry)
3. User clicks link in email → Token validated → Account marked as verified
4. Unverified users see banner with resend option

## API Endpoints

### GET /api/v1/auth/verify-email?token={token}

Verifies a user's email address using the provided token.

**Parameters:**

- `token` (query string): The verification token

**Responses:**

- `200 OK`: `{ success: true/false, message: string }`

### POST /api/v1/auth/resend-verification

Resends verification email to a user.

**Body:**

```json
{
  "email": "user@example.com"
}
```

**Responses:**

- `200 OK`: `{ success: true/false, message: string }`

## Frontend Integration

### Verification Page (`/auth/verify`)

- Displays verification success/failure messages
- Supports query parameters: `?verified=true` or `?verify=invalid`
- Auto-redirected from verification link
- On successful verification:
  - Refreshes user data to update `emailVerified` status
  - Shows success toast notification
  - Automatically hides email verification banner
- Integrated with AuthProvider for real-time user state updates

### API Route (`/api/auth/verify`)

- Handles verification token validation
- Redirects to appropriate page with status
- Communicates with API Gateway

### Verification Banner (`components/auth/EmailVerificationBanner.tsx`)

- Shows for unverified users
- Allows resending verification email
- Can be dismissed by user
- Integrated into main layout
- Automatically hides when user email is verified

### Success Toast Notification

- Shows when email verification is successful
- Auto-dismisses after 5 seconds
- Can be manually closed by user
- Supports both success and error states
- Positioned at top-right of screen

## Email Template

The verification email includes:

- Flipstaq branding
- Personalized greeting with user's first name
- Clear "Verify Email Address" button
- Security notice about 30-minute expiry
- Fallback copy-paste link

## Environment Variables

### Auth Service (.env)

```
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=Flipstaq <noreply@flipstaq.com>
FRONTEND_URL=http://localhost:3000
```

### Web App (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:3100
```

## Security Features

- Tokens expire after 30 minutes
- Unique tokens prevent replay attacks
- Tokens are cleared after successful verification
- Invalid/expired tokens redirect to error page

## Error Handling

- Failed email sends don't block signup
- Graceful degradation if email service unavailable
- Clear error messages for users
- Logging for debugging

## Localization

Translations available in English and Arabic for:

- Verification banner text
- Email templates (future enhancement)
- Success/error messages
- Button labels
- Toast notifications
- Success confirmation messages

## Testing

1. **Signup Flow**: Create account → Check for verification email
2. **Verification**: Click email link → Confirm account verified → Check banner disappears → Verify success toast appears
3. **Resend**: Test resend functionality for unverified users
4. **Expiry**: Wait 30+ minutes → Verify token expires
5. **Invalid Token**: Test with malformed/non-existent tokens
6. **Banner Behavior**: Verify banner only shows for unverified users and hides immediately after verification
7. **Toast Notification**: Check success toast appears and auto-dismisses after 5 seconds

## Future Enhancements

- Multi-language email templates
- Email template customization
- Bulk verification for admin users
- Integration with other verification methods (SMS, etc.)

## Dependencies

The email verification system uses the following key dependencies:

### NPM Packages

```json
{
  "resend": "^4.6.0"
}
```

### Email Service Implementation

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: process.env.EMAIL_FROM,
  to: [userEmail],
  subject: "Verify your Flipstaq account",
  html: emailTemplate,
});
```
