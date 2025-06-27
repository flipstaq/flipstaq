## 🔐 Rate Limiting

The API Gateway implements comprehensive rate limiting for authentication endpoints:

### Rate Limits Applied

| Endpoint             | Limit       | Window    | Applied At        |
| -------------------- | ----------- | --------- | ----------------- |
| `POST /auth/refresh` | 5 requests  | 1 minute  | Gateway + Service |
| `POST /auth/login`   | 5 requests  | 5 minutes | Service Level     |
| `POST /auth/signup`  | 3 requests  | 5 minutes | Service Level     |
| **Default**          | 20 requests | 1 minute  | Gateway Level     |

### Defense in Depth

The API Gateway applies rate limiting at two levels:

1. **Gateway Level**: Broad protection against general abuse (20 req/min)
2. **Service Level**: Specific protection for sensitive endpoints (varies by endpoint)

### Security Features

- **IP-based tracking**: Rate limits applied per client IP address
- **Comprehensive logging**: All rate limit events are logged with IP tracking
- **Automatic forwarding**: Rate limit headers and cookies are properly forwarded
- **Error handling**: Graceful handling of rate limit violations

### Rate Limit Headers

The Gateway forwards standard rate limiting headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

For complete security details, see [Auth Service Rate Limiting](../auth-service/rate-limiting-security.md).

---

## ...existing content...
