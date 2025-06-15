# User Service API Documentation

## Base URL

**Internal**: `http://localhost:3003/internal/users`  
**Public (via Gateway)**: `http://localhost:3100/api/v1/users`

## Authentication

All endpoints require JWT authentication with admin privileges (OWNER, HIGHER_STAFF, or STAFF role).

Headers:

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## Endpoints

### 1. List Users

Retrieve a paginated list of users with optional filtering.

**Endpoint**: `GET /users`

**Query Parameters**:

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of users per page (default: 10, max: 100)
- `role` (optional): Filter by user role (OWNER, HIGHER_STAFF, STAFF, USER)
- `status` (optional): Filter by status (ACTIVE, INACTIVE, BANNED, PENDING_VERIFICATION)
- `search` (optional): Search in firstName, lastName, email, username
- `includeDeleted` (optional): Include soft-deleted users (default: false)

**Example Request**:

```bash
GET /api/v1/users?page=1&limit=20&role=USER&status=ACTIVE&search=john
```

**Response**:

```json
{
  "data": [
    {
      "id": "clm1234567890abcdef",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-15T00:00:00.000Z",
      "country": "US",
      "role": "USER",
      "status": "ACTIVE",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z",
      "deletedAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

**Status Codes**:

- `200 OK`: Users retrieved successfully
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Insufficient permissions (non-admin role)
- `400 Bad Request`: Invalid query parameters

---

### 2. Get User by ID

Retrieve a specific user by their ID.

**Endpoint**: `GET /users/:id`

**Path Parameters**:

- `id`: User ID (string, required)

**Example Request**:

```bash
GET /api/v1/users/clm1234567890abcdef
```

**Response**:

```json
{
  "id": "clm1234567890abcdef",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15T00:00:00.000Z",
  "country": "US",
  "role": "USER",
  "status": "ACTIVE",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T00:00:00.000Z",
  "deletedAt": null,
  "deletedById": null,
  "deletedBy": null
}
```

**For Deleted Users**:

```json
{
  "id": "clm1234567890abcdef",
  "email": "deleted.user@example.com",
  "username": "deleteduser",
  "firstName": "Deleted",
  "lastName": "User",
  "dateOfBirth": "1990-01-15T00:00:00.000Z",
  "country": "US",
  "role": "USER",
  "status": "INACTIVE",
  "isActive": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T00:00:00.000Z",
  "deletedAt": "2024-01-15T14:30:00.000Z",
  "deletedById": "clm9876543210fedcba",
  "deletedBy": {
    "id": "clm9876543210fedcba",
    "firstName": "Admin",
    "lastName": "User",
    "role": "HIGHER_STAFF"
  }
}
```

**Status Codes**:

- `200 OK`: User retrieved successfully
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `400 Bad Request`: Invalid user ID format

---

### 3. Update User

Update specific fields of a user account.

**Endpoint**: `PATCH /users/:id`

**Path Parameters**:

- `id`: User ID (string, required)

**Request Body**:

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "username": "janesmith",
  "country": "CA",
  "role": "STAFF",
  "status": "ACTIVE",
  "isActive": true
}
```

**Available Fields**:

- `firstName` (string, optional): User's first name
- `lastName` (string, optional): User's last name
- `email` (string, optional): User's email address (must be unique)
- `username` (string, optional): Username (must be unique, min 2 chars)
- `country` (string, optional): ISO country code
- `role` (enum, optional): OWNER, HIGHER_STAFF, STAFF, USER
- `status` (enum, optional): ACTIVE, INACTIVE, BANNED, PENDING_VERIFICATION
- `isActive` (boolean, optional): Account active status

**Example Request**:

```bash
PATCH /api/v1/users/clm1234567890abcdef
Content-Type: application/json

{
  "role": "STAFF",
  "status": "ACTIVE"
}
```

**Response**:

```json
{
  "id": "clm1234567890abcdef",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15T00:00:00.000Z",
  "country": "US",
  "role": "STAFF",
  "status": "ACTIVE",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "deletedAt": null
}
```

**Status Codes**:

- `200 OK`: User updated successfully
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `400 Bad Request`: Invalid input data or validation errors
- `409 Conflict`: Email or username already exists

---

### 4. Delete User (Soft Delete)

Soft delete a user account by setting the deletedAt timestamp.

**Endpoint**: `DELETE /users/:id`

**Path Parameters**:

- `id`: User ID (string, required)

**Example Request**:

```bash
DELETE /api/v1/users/clm1234567890abcdef
```

**Response**:

```json
{
  "message": "User deleted successfully",
  "deletedAt": "2024-01-15T10:45:00.000Z"
}
```

**Status Codes**:

- `200 OK`: User deleted successfully
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found or already deleted
- `400 Bad Request`: Invalid user ID format

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": ["Validation error messages"],
  "error": "Bad Request"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized access",
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Access denied. Admin role required.",
  "error": "Forbidden"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}
```

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Usage Examples

### Get Active Users

```bash
curl -X GET "http://localhost:3100/api/v1/users?status=ACTIVE&page=1&limit=10" \
  -H "Authorization: Bearer your-jwt-token"
```

### Update User Role

```bash
curl -X PATCH "http://localhost:3100/api/v1/users/clm1234567890abcdef" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"role": "STAFF"}'
```

### Search Users

```bash
curl -X GET "http://localhost:3100/api/v1/users?search=john&limit=5" \
  -H "Authorization: Bearer your-jwt-token"
```

### Soft Delete User

```bash
curl -X DELETE "http://localhost:3100/api/v1/users/clm1234567890abcdef" \
  -H "Authorization: Bearer your-jwt-token"
```

---

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Admin operations**: 50 requests per minute per user
- **Bulk operations**: 10 requests per minute per user

## Security Notes

1. All endpoints require admin-level authentication
2. User passwords are never returned in API responses
3. Soft deletion preserves data integrity and relationships
4. Email and username uniqueness is enforced
5. Input validation prevents injection attacks
6. JWT tokens must be valid and non-expired

## SDK Examples

### JavaScript/TypeScript

```typescript
const userService = {
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }) {
    const response = await fetch(
      "/api/v1/users?" + new URLSearchParams(params),
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.json();
  },

  async updateUser(id: string, data: Partial<User>) {
    const response = await fetch(`/api/v1/users/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
```
