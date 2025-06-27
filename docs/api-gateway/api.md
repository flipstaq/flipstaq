## 🔐 Rate Limiting

The API Gateway implements comprehensive rate limiting as the first line of defense:

### Global Rate Limits

| Scope              | Limit              | Window           | Applied At            |
| ------------------ | ------------------ | ---------------- | --------------------- |
| **Gateway Level**  | 200 requests       | 15 minutes       | All incoming requests |
| **Auth Endpoints** | Varies by endpoint | See Auth Service | Forwarded to service  |

### Implementation Strategy

The API Gateway uses a **dual-layer approach**:

1. **Gateway Level**: Broad protection against general abuse (200 req/15min)
2. **Service Level**: Specific protection forwarded to microservices

### Rate Limit Matrix

| Endpoint Pattern | Gateway Limit | Service Limit               | Total Protection  |
| ---------------- | ------------- | --------------------------- | ----------------- |
| `/auth/login`    | 200/15min     | 5/5min                      | Gateway + Service |
| `/auth/signup`   | 200/15min     | 3/5min                      | Gateway + Service |
| `/auth/refresh`  | 200/15min     | 5/1min                      | Gateway + Service |
| `/messages/*`    | 200/15min     | 100/15min + 20 messages/min | Gateway + Service |
| `/reports/*`     | 200/15min     | 100/15min + 5 reports/hour  | Gateway + Service |
| **All Others**   | 200/15min     | 100/15min                   | Gateway + Service |

### Defense in Depth

```
Client → Gateway (200/15min) → Service (100/15min) → Endpoint (varies)
```

This layered approach ensures:

- **Primary Defense**: Gateway blocks obvious abuse
- **Service Defense**: Microservices provide additional protection
- **Endpoint Defense**: Critical operations have specific limits

### Security Features

- **IP-based tracking**: Rate limits applied per client IP address
- **Comprehensive logging**: All rate limit events logged with IP tracking
- **Header forwarding**: Rate limit headers and cookies properly forwarded
- **Error handling**: Graceful handling of rate limit violations
- **High throughput**: Higher limits accommodate legitimate client applications

### Rate Limit Headers

The Gateway includes enhanced rate limiting headers:

```http
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 150
X-RateLimit-Reset: 1640995200
X-Gateway-RateLimit: true
```

### Performance Optimization

- **Higher Gateway Limits**: 200 requests vs. 100 for services
- **Efficient Forwarding**: Minimal overhead on request proxying
- **Smart Caching**: Rate limit calculations cached for performance
- **Load Balancing**: Rate limits work with multiple gateway instances

For complete security details, see:

- [Auth Service Rate Limiting](../auth-service/rate-limiting-security.md)
- [Global Rate Limiting Strategy](../global-rate-limiting-strategy.md)

---

## ...existing content...
