# Reports API Documentation

## Overview

The Reports API handles user-generated reports for content moderation across the platform.

## Base URL

- Development: `http://localhost:3003`
- Via API Gateway: `http://localhost:3100/reports`

## Authentication

All endpoints require JWT authentication via Authorization header:

```
Authorization: Bearer <jwt_token>
```

Admin endpoints require `OWNER` or `HIGHER_STAFF` role.

## Endpoints

### Submit Report

**POST** `/reports`

Submit a new report for moderation review.

**Request Body:**

```json
{
  "type": "USER|PRODUCT|MESSAGE",
  "targetId": "string",
  "reason": "string",
  "comment": "string" // optional, max 500 chars
}
```

**Response:**

```json
{
  "success": true,
  "message": "Report submitted successfully"
}
```

**Error Responses:**

- `400` - Invalid input or daily limit exceeded
- `401` - Unauthorized
- `409` - Duplicate report (user has already reported this item)
- `429` - Rate limit exceeded

### List Reports (Admin)

**GET** `/reports`

Retrieve all reports for admin review.

**Query Parameters:**

- `status` - Filter by status (PENDING, RESOLVED, DISMISSED)
- `type` - Filter by type (USER, PRODUCT, MESSAGE)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**

```json
[
  {
    "id": "string",
    "reporterId": "string",
    "type": "USER|PRODUCT|MESSAGE",
    "targetUserId": "string",
    "targetProductId": "string",
    "targetMessageId": "string",
    "reason": "string",
    "comment": "string",
    "status": "PENDING|RESOLVED|DISMISSED",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "reporter": {
      "id": "string",
      "username": "string",
      "firstName": "string",
      "lastName": "string"
    }
  }
]
```

### Resolve Report (Admin)

**PATCH** `/reports/:id/resolve`

Mark a report as resolved.

**Response:**

```json
{
  "success": true,
  "message": "Report resolved successfully"
}
```

### Set Report Under Review (Admin)

**PATCH** `/reports/:id/under-review`

Set a report status to under review (only works for pending reports).

**Response:**

```json
{
  "success": true,
  "message": "Report set to under review successfully"
}
```

### Dismiss Report (Admin)

**PATCH** `/reports/:id/dismiss`

Mark a report as dismissed.

**Response:**

```json
{
  "success": true,
  "message": "Report dismissed successfully"
}
```

### Export Reports (Admin Only)

**GET** `/reports/export/json`

Export filtered reports as JSON for data analysis.

**Query Parameters:**

- `status` - Filter by status (PENDING, RESOLVED, DISMISSED)
- `type` - Filter by type (USER, PRODUCT, MESSAGE)
- `reporterUsername` - Filter by reporter username
- `reporterId` - Filter by reporter ID
- `targetUsername` - Filter by target username
- `targetId` - Filter by target ID
- `reason` - Filter by reason keyword
- `dateFrom` - Filter from date (ISO string)
- `dateTo` - Filter to date (ISO string)
- `ipAddress` - Filter by IP address
- `resolvedBy` - Filter by resolver username

**Response:**

```json
{
  "data": [
    {
      "id": "report-123",
      "type": "USER",
      "reason": "spam",
      "comment": "This user is spamming",
      "status": "PENDING",
      "createdAt": "2025-01-01T00:00:00Z",
      "reporter": {
        "id": "user-456",
        "username": "reporter123",
        "email": "reporter@example.com"
      },
      "target": {
        "id": "user-789",
        "username": "target123",
        "email": "target@example.com"
      },
      "ipAddress": "192.168.1.1"
    }
  ],
  "exportedAt": "2025-01-01T12:00:00Z"
}
```

**GET** `/reports/export/html`

Export filtered reports as HTML for human review.

**Query Parameters:** Same as JSON export

**Response:** HTML document with formatted report table

### Export Single Report (Admin Only)

**GET** `/reports/:id/export/json`

Export a single report as JSON.

**Parameters:**

- `id` - Report ID

**Response:**

```json
{
  "data": {
    "id": "report-123",
    "type": "USER",
    "reason": "spam",
    "comment": "This user is spamming",
    "status": "RESOLVED",
    "createdAt": "2025-01-01T00:00:00Z",
    "resolvedAt": "2025-01-01T01:00:00Z",
    "reporter": {
      "id": "user-456",
      "username": "reporter123",
      "email": "reporter@example.com"
    },
    "target": {
      "id": "user-789",
      "username": "target123",
      "email": "target@example.com"
    },
    "resolvedBy": {
      "id": "admin-123",
      "username": "admin",
      "email": "admin@example.com"
    },
    "ipAddress": "192.168.1.1"
  },
  "exportedAt": "2025-01-01T12:00:00Z"
}
```

**GET** `/reports/:id/export/html`

Export a single report as HTML.

**Parameters:**

- `id` - Report ID

**Response:** HTML document with formatted report details

## Report Types

### USER Report

- `targetId` maps to `targetUserId`
- Used for reporting user profiles or behavior

### PRODUCT Report

- `targetId` maps to `targetProductId`
- Used for reporting product listings

### MESSAGE Report

- `targetId` maps to `targetMessageId`
- Used for reporting chat messages

## Report Reasons

Standard reason codes:

- `spam` - Spam content
- `misleading` - Misleading information
- `offensive` - Offensive content
- `harassment` - Harassment or bullying
- `fake_listing` - Fake product listing
- `scam` - Scam or fraud
- `inappropriate` - Inappropriate content
- `copyright` - Copyright violation
- `other` - Other reasons (comment required)

## Rate Limiting

- **User Reports**: 10 reports per user per hour
- **Admin Actions**: 100 actions per admin per hour

## Error Codes

- `DUPLICATE_REPORT` - User already reported this item
- `INVALID_TARGET` - Target item not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INSUFFICIENT_PERMISSIONS` - Admin access required
- `REPORT_NOT_FOUND` - Report ID not found

## Error Responses

### Common Error Codes

- **400 Bad Request**: Invalid input data or daily report limit exceeded
- **401 Unauthorized**: Authentication required or invalid token
- **403 Forbidden**: Insufficient permissions (admin required for certain endpoints)
- **404 Not Found**: Report or target entity not found
- **409 Conflict**: Duplicate report - user has already reported this item
- **429 Too Many Requests**: Rate limiting active

### Error Response Format

```json
{
  "error": "Error message",
  "message": "Detailed error description",
  "statusCode": 400
}
```

### Specific Error Messages

- **"You have already reported this item"** (409): User attempted to create a duplicate report
- **"Daily report limit exceeded"** (400): User has reached the 10 reports per day limit
- **"You cannot report yourself"** (400): User attempted to report their own account
- **"Exactly one target must be provided"** (400): Invalid target specification in request
- **"Authentication required"** (401): Missing or invalid auth token
- **"Admin access required"** (403): Non-admin user attempted to access admin endpoint

## Status Transitions

```
PENDING → RESOLVED (admin action)
PENDING → DISMISSED (admin action)
```

Once resolved or dismissed, reports cannot be changed.

## Anti-Abuse Measures

1. **Duplicate Prevention**: One report per user per target
2. **IP Logging**: All submissions logged with IP address
3. **Rate Limiting**: Prevents spam submissions
4. **Validation**: Content and target validation

## Integration Examples

### Frontend Report Submission

```typescript
const response = await fetch("/api/reports", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    type: "PRODUCT",
    targetId: "product-123",
    reason: "spam",
    comment: "This is clearly spam content",
  }),
});
```

### Admin Report Review

```typescript
const reports = await fetch("/api/reports", {
  headers: {
    Authorization: `Bearer ${adminToken}`,
  },
});

// Resolve a report
await fetch(`/api/reports/${reportId}/resolve`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${adminToken}`,
  },
});
```
