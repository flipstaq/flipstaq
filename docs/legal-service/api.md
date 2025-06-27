# Legal Service API Documentation

This document provides detailed API documentation for the Legal Service endpoints.

## Base URL

- **Service Direct**: `http://localhost:3010`
- **Via API Gateway**: `http://localhost:3000/api/v1/legal`

## Authentication

Admin endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Only users with `OWNER` or `HIGHER_STAFF` roles can access admin endpoints.

## Public Endpoints

### Get Document Types

Get a list of all available legal document types.

**Endpoint**: `GET /legal/documents/types`

**Response**:

```json
["tos", "privacy", "cookie_policy", "community_guidelines"]
```

**Status Codes**:

- `200`: Success

**Example Usage**:

```bash
curl -X GET http://localhost:3000/api/v1/legal/documents/types
```

---

### Get Document Languages

Get available languages for a specific document type.

**Endpoint**: `GET /legal/documents/types/{type}/languages`

**Parameters**:

- `type` (path): Document type (e.g., "tos", "privacy")

**Response**:

```json
["en", "ar"]
```

**Status Codes**:

- `200`: Success
- `404`: Document type not found

**Example Usage**:

```bash
curl -X GET http://localhost:3000/api/v1/legal/documents/types/tos/languages
```

---

### Get Document by Type

Get a legal document by type and language (public endpoint).

**Endpoint**: `GET /legal/documents/{type}`

**Parameters**:

- `type` (path): Document type (e.g., "tos", "privacy")
- `language` (query): Language code (default: "en")

**Response**:

```json
{
  "id": "uuid-string",
  "type": "tos",
  "language": "en",
  "content": "Terms of Service content...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "lastEditedBy": {
    "id": "user-uuid",
    "username": "admin",
    "firstName": "Admin",
    "lastName": "User"
  }
}
```

**Status Codes**:

- `200`: Success
- `404`: Document not found

**Example Usage**:

```bash
# Get English Terms of Service
curl -X GET http://localhost:3000/api/v1/legal/documents/tos?language=en

# Get Arabic Privacy Policy
curl -X GET http://localhost:3000/api/v1/legal/documents/privacy?language=ar
```

```json
["en", "ar"]
```

**Status Codes**:

- `200`: Success

---

### Get Legal Document

Get an active legal document by type and language.

**Endpoint**: `GET /legal/documents/{type}`

**Parameters**:

- `type` (path): Document type (e.g., "tos", "privacy")
- `language` (query, optional): Language code (default: "en")

**Example**: `GET /legal/documents/tos?language=ar`

**Response**:

```json
{
  "id": "clh2k3j4h0000qwerty123456",
  "type": "tos",
  "language": "ar",
  "title": "شروط الخدمة",
  "content": "# شروط الخدمة\n\nمرحباً بك في فليبستاق...",
  "version": 1,
  "isActive": true,
  "createdAt": "2025-06-27T10:00:00.000Z",
  "updatedAt": "2025-06-27T10:00:00.000Z",
  "updatedById": "admin123",
  "updatedBy": {
    "id": "admin123",
    "username": "admin",
    "firstName": "Admin",
    "lastName": "User"
  }
}
```

**Status Codes**:

- `200`: Success
- `404`: Document not found for the specified type and language

---

## Admin Endpoints

### Get All Documents

Get all legal documents (all versions and languages).

**Endpoint**: `GET /legal/documents`

**Authentication**: Required (Owner/Higher Staff)

**Response**:

```json
[
  {
    "id": "clh2k3j4h0000qwerty123456",
    "type": "tos",
    "language": "en",
    "title": "Terms of Service",
    "content": "# Terms of Service\n\nWelcome to Flipstaq...",
    "version": 1,
    "isActive": true,
    "createdAt": "2025-06-27T10:00:00.000Z",
    "updatedAt": "2025-06-27T10:00:00.000Z",
    "updatedById": "admin123",
    "updatedBy": {
      "id": "admin123",
      "username": "admin",
      "firstName": "Admin",
      "lastName": "User"
    }
  }
]
```

**Status Codes**:

- `200`: Success
- `401`: Unauthorized
- `403`: Insufficient permissions

---

### Get Document by ID

Get a specific legal document by its ID.

**Endpoint**: `GET /legal/documents/id/{id}`

**Authentication**: Required (Owner/Higher Staff)

**Parameters**:

- `id` (path): Document ID

**Response**: Same as individual document response above

**Status Codes**:

- `200`: Success
- `401`: Unauthorized
- `403`: Insufficient permissions
- `404`: Document not found

---

### Create Legal Document

Create a new legal document.

**Endpoint**: `POST /legal/documents`

**Authentication**: Required (Owner/Higher Staff)

**Request Body**:

```json
{
  "type": "tos",
  "language": "en",
  "title": "Terms of Service",
  "content": "# Terms of Service\n\nWelcome to Flipstaq...",
  "isActive": true
}
```

**Field Descriptions**:

- `type` (string, required): Document type identifier
- `language` (string, required): Language code (e.g., "en", "ar")
- `title` (string, required): Document title
- `content` (string, required): Document content (markdown/HTML)
- `isActive` (boolean, optional): Whether this version should be active (default: true)

**Response**: Same as individual document response

**Status Codes**:

- `201`: Created successfully
- `400`: Validation error
- `401`: Unauthorized
- `403`: Insufficient permissions
- `409`: Conflict (e.g., active document already exists)

**Validation Rules**:

- `type`: Non-empty string
- `language`: Non-empty string
- `title`: Non-empty string
- `content`: Minimum 10 characters

---

### Update Legal Document

Update an existing legal document.

**Endpoint**: `PATCH /legal/documents/{id}`

**Authentication**: Required (Owner/Higher Staff)

**Parameters**:

- `id` (path): Document ID

**Request Body** (all fields optional):

```json
{
  "type": "tos",
  "language": "en",
  "title": "Updated Terms of Service",
  "content": "# Updated Terms of Service\n\nWelcome to Flipstaq...",
  "isActive": true
}
```

**Response**: Updated document object

**Status Codes**:

- `200`: Updated successfully
- `400`: Validation error
- `401`: Unauthorized
- `403`: Insufficient permissions
- `404`: Document not found

**Notes**:

- If `content` is changed, version number is automatically incremented
- If `isActive` is set to true and `type`/`language` changed, other documents of the same type/language are deactivated

---

### Delete Legal Document

Delete a legal document permanently.

**Endpoint**: `DELETE /legal/documents/{id}`

**Authentication**: Required (Owner/Higher Staff)

**Parameters**:

- `id` (path): Document ID

**Response**:

```json
{
  "message": "Legal document deleted successfully"
}
```

**Status Codes**:

- `200`: Deleted successfully
- `401`: Unauthorized
- `403`: Insufficient permissions
- `404`: Document not found

---

## Error Responses

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Common Error Codes

- `400`: Bad Request - Validation error or malformed request
- `401`: Unauthorized - Missing or invalid authentication token
- `403`: Forbidden - Insufficient permissions (not Owner/Higher Staff)
- `404`: Not Found - Document or resource not found
- `409`: Conflict - Resource already exists or conflict with current state
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Unexpected server error

## Rate Limiting

All endpoints are subject to rate limiting:

- **Limit**: 100 requests per IP per 15 minutes
- **Headers**: Rate limit information included in response headers
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Unix timestamp when rate limit resets

When rate limit is exceeded:

```json
{
  "statusCode": 429,
  "message": "Too many requests, please try again later.",
  "error": "Too Many Requests"
}
```

## OpenAPI/Swagger Documentation

Interactive API documentation is available at:

- **Service Direct**: `http://localhost:3010/api/docs`
- **Via API Gateway**: `http://localhost:3000/api/docs` (includes legal endpoints)

## SDK/Client Examples

### JavaScript/TypeScript

```typescript
class LegalServiceClient {
  constructor(
    private baseUrl: string,
    private authToken?: string
  ) {}

  async getDocument(type: string, language = "en") {
    const response = await fetch(
      `${this.baseUrl}/legal/documents/${type}?language=${language}`
    );
    return response.json();
  }

  async createDocument(document: CreateLegalDocumentDto) {
    const response = await fetch(`${this.baseUrl}/legal/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(document),
    });
    return response.json();
  }

  async updateDocument(id: string, updates: UpdateLegalDocumentDto) {
    const response = await fetch(`${this.baseUrl}/legal/documents/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(updates),
    });
    return response.json();
  }
}

// Usage
const client = new LegalServiceClient("/api/v1", "your-jwt-token");
const tos = await client.getDocument("tos", "en");
```

## Practical Examples

### Admin Panel Workflow

**1. Loading the Legal Tab**

```bash
# Get all existing documents
curl -X GET "http://localhost:3000/api/v1/legal/documents" \
  -H "Authorization: Bearer admin-jwt-token"

# Get available document types
curl -X GET "http://localhost:3000/api/v1/legal/documents/types"
```

**2. Creating a New Legal Document**

```bash
curl -X POST "http://localhost:3000/api/v1/legal/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-jwt-token" \
  -d '{
    "type": "tos",
    "language": "en",
    "content": "## Terms of Service\n\nBy using Flipstaq, you agree to these terms..."
  }'
```

**3. Updating Existing Document**

```bash
curl -X PUT "http://localhost:3000/api/v1/legal/documents/doc-uuid-123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-jwt-token" \
  -d '{
    "content": "## Updated Terms of Service\n\nBy using Flipstaq, you agree to these updated terms..."
  }'
```

### Frontend Public Pages Workflow

**1. Terms of Service Page (/tos)**

```bash
# Fetch terms in user's language (English)
curl -X GET "http://localhost:3000/api/v1/legal/documents/tos?language=en"

# Fetch terms in Arabic
curl -X GET "http://localhost:3000/api/v1/legal/documents/tos?language=ar"
```

**2. Privacy Policy Page (/privacy)**

```bash
# Fetch privacy policy in user's language
curl -X GET "http://localhost:3000/api/v1/legal/documents/privacy?language=en"
```

### Error Scenarios

**1. Document Not Found (Public Page)**

```bash
# Request for non-existent document type
curl -X GET "http://localhost:3000/api/v1/legal/documents/nonexistent?language=en"
# Returns 404 - Frontend shows "Document not available" message
```

**2. Language Not Available (Public Page)**

```bash
# Request for document in unsupported language
curl -X GET "http://localhost:3000/api/v1/legal/documents/tos?language=fr"
# Returns 404 - Frontend shows fallback message with link to English version
```

**3. Unauthorized Admin Access**

```bash
# Admin endpoint without proper authentication
curl -X GET "http://localhost:3000/api/v1/legal/documents"
# Returns 401 - Admin panel shows login required message
```

### Integration Guidelines

### Frontend Integration

1. **Public Pages**: Use public endpoints to display legal documents
2. **Language Support**: Respect user's language preference
3. **Error Handling**: Handle 404 errors gracefully (show fallback content)
4. **Caching**: Cache documents appropriately but respect updates

### Admin Panel Integration

1. **Role Checking**: Verify user role before showing admin features
2. **Form Validation**: Validate input on client-side before API calls
3. **Success/Error Notifications**: Use toast notifications for user feedback
4. **Real-time Updates**: Refresh document list after create/update/delete operations

### Backend Integration

1. **Service Discovery**: Use environment variables for service URLs
2. **Error Propagation**: Properly handle and forward errors
3. **Logging**: Log important operations for audit purposes
4. **Health Checks**: Monitor service health and availability
