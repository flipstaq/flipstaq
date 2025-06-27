# 🚀 Global Rate Limiting Strategy

## Overview

This document outlines the comprehensive rate limiting strategy implemented across all Flipstaq microservices to enhance security, prevent abuse, and protect against spam attacks.

## 🛡️ Global Rate Limiting Rules

### Default Rate Limits

All services implement a **global default rate limit** applied to all public-facing endpoints:

```
100 requests per IP per 15 minutes
```

This baseline protection applies to all services unless specifically overridden by more restrictive limits.

### API Gateway Rate Limits

The API Gateway implements higher limits due to its role as the central entry point:

```
200 requests per IP per 15 minutes
```

This allows for legitimate client applications that make multiple API calls through the gateway.

## 🔐 Critical Routes with Tighter Limits

### Auth Service

| Endpoint                    | Limit      | Window    | Purpose                     |
| --------------------------- | ---------- | --------- | --------------------------- |
| `POST /auth/login`          | 5 requests | 5 minutes | Prevent brute force attacks |
| `POST /auth/signup`         | 3 requests | 5 minutes | Prevent automated signups   |
| `POST /auth/refresh`        | 5 requests | 1 minute  | Prevent token refresh abuse |
| `POST /auth/reset-password` | 5 requests | 5 minutes | Prevent password reset spam |

### Message Service

| Endpoint           | Limit        | Window     | Key     | Purpose                |
| ------------------ | ------------ | ---------- | ------- | ---------------------- |
| `POST /messages`   | 20 messages  | 1 minute   | User ID | Prevent message spam   |
| **Global default** | 100 requests | 15 minutes | IP      | General API protection |

### Report Service

| Endpoint           | Limit        | Window     | Key           | Purpose                |
| ------------------ | ------------ | ---------- | ------------- | ---------------------- |
| `POST /report/*`   | 5 reports    | 1 hour     | User ID or IP | Prevent report abuse   |
| **Global default** | 100 requests | 15 minutes | IP            | General API protection |

### User Service

| Endpoint           | Limit        | Window     | Key | Purpose                |
| ------------------ | ------------ | ---------- | --- | ---------------------- |
| **Global default** | 100 requests | 15 minutes | IP  | General API protection |

### Product Service

| Endpoint           | Limit        | Window     | Key | Purpose                |
| ------------------ | ------------ | ---------- | --- | ---------------------- |
| **Global default** | 100 requests | 15 minutes | IP  | General API protection |

## ⚙️ Implementation Details

### Rate Limiting Methods

1. **NestJS Throttler Module** (Auth Service, User Service, API Gateway)

   - Uses `@nestjs/throttler` package
   - Applied via global guards
   - Configurable via decorators for specific endpoints

2. **Custom Middleware** (Product Service, Message Service, Report Service)
   - In-memory rate limiting store
   - IP-based and user-based tracking
   - Automatic cleanup of expired entries

### Key Strategies

#### Global Protection

```typescript
// Applied to all routes by default
100 requests per IP per 15 minutes
```

#### Per-User Limits

```typescript
// For authenticated endpoints
keyGenerator: (req) => req.user?.id || req.ip;
```

#### Per-Endpoint Overrides

```typescript
// Specific limits for sensitive operations
@Throttle({ default: { limit: 5, ttl: 60000 } })
```

## 📊 Rate Limit Headers

All services return standard rate limiting headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1640995200
```

### Service-Specific Headers

- **Message Service**: `X-Message-RateLimit-*`
- **Report Service**: `X-Report-RateLimit-*`

## 🚨 Error Responses

When rate limits are exceeded:

```json
{
  "statusCode": 429,
  "message": "Too many requests, please try again later.",
  "error": "Too Many Requests"
}
```

### Service-Specific Messages

- **Message Service**: "Too many messages sent. Please slow down."
- **Report Service**: "Too many reports submitted. Please wait before submitting another report."

## 🔍 Monitoring & Logging

### Security Logging

All rate limiting violations are logged with:

- IP address or User ID
- Endpoint accessed
- Current request count
- Timestamp
- Rate limit configuration

### Example Log Output

```
[WARN] Rate limit exceeded for IP: 192.168.1.100. 101/100 requests
[LOG] Message sent by user: user123. Count: 15/20
[WARN] Report rate limit exceeded for user: user456. 6/5 reports submitted
```

## 🛠️ Configuration

### Environment Variables

Rate limiting can be configured via environment variables:

```bash
# Auth Service
RATE_LIMIT_REFRESH_TOKENS="5_per_minute"
RATE_LIMIT_DEFAULT="10_per_minute"
```

### Runtime Configuration

Some services use in-memory configuration that can be adjusted:

```typescript
private readonly limit = 100; // Requests
private readonly windowMs = 15 * 60 * 1000; // 15 minutes
```

## 🔒 Security Features

### Protection Against

1. **Brute Force Attacks**: Login and authentication endpoints
2. **Spam Prevention**: Message and report submission limits
3. **Resource Exhaustion**: Global rate limits prevent service overload
4. **Automated Abuse**: IP-based tracking limits bot activity
5. **Token Abuse**: Refresh token limits prevent exploitation

### Excluded Routes

Rate limiting **does not apply** to:

- Static file routes (`/public/*`, `/assets/*`)
- Health check endpoints (`/health`)
- Internal service-to-service communication
- CDN or webhook endpoints

## 🚀 Deployment Considerations

### Scalability

- **In-Memory Storage**: Current implementation uses in-memory storage
- **Distributed Deployment**: Consider Redis for shared rate limiting across instances
- **Performance Impact**: Minimal overhead with automatic cleanup

### Monitoring Recommendations

1. **Alert on High Violation Rates**: Monitor rate limit violations
2. **IP Analysis**: Track repeat offenders
3. **User Behavior**: Analyze legitimate vs. abusive patterns
4. **Performance Metrics**: Monitor rate limiting overhead

## 📈 Future Enhancements

### Planned Improvements

1. **Redis Storage**: Distributed rate limiting across multiple instances
2. **Dynamic Limits**: Adjust limits based on threat detection
3. **Geographic Limits**: Different limits by region
4. **User Tier Limits**: Different limits for premium users
5. **Smart Throttling**: Machine learning-based adaptive limits

### Integration Opportunities

- **WAF Integration**: Combine with Web Application Firewall
- **CDN Rate Limiting**: Leverage CloudFlare or AWS CloudFront
- **API Gateway Policies**: Advanced routing-based rate limiting

## 📋 Maintenance

### Regular Tasks

1. **Log Analysis**: Review rate limiting logs weekly
2. **Limit Adjustment**: Adjust limits based on usage patterns
3. **Performance Review**: Monitor impact on legitimate traffic
4. **Security Assessment**: Evaluate effectiveness against attacks

### Troubleshooting

Common issues and solutions:

- **False Positives**: Adjust limits for legitimate high-volume users
- **Memory Usage**: Monitor in-memory storage growth
- **Performance Impact**: Profile rate limiting middleware overhead
