# API Gateway - Users Management

## Overview

The Users Management endpoints in the API Gateway provide external access to user administration functionality. These endpoints forward requests to the internal `user-service` and enforce role-based access control.

## Authentication & Authorization

- **Authentication**: All endpoints require a valid JWT token via `Authorization: Bearer <token>`
- **Authorization**: Only users with admin roles can access these endpoints:
  - `OWNER`: Full access to all user management functions
  - `HIGHER_STAFF`: Full access to all user management functions
  - `STAFF`: Full access to all user management functions
  - `USER`: **No access** to user management endpoints

## Endpoints

### 1. List Users

Retrieve a paginated list of users with optional filtering.

**Endpoint**: `GET /api/v1/users`

**Query Parameters**:

- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Users per page (default: 10, min: 1, max: 100)
- `role` (optional): Filter by role (`OWNER`, `HIGHER_STAFF`, `STAFF`, `USER`)
- `status` (optional): Filter by status (`ACTIVE`, `INACTIVE`, `BANNED`, `PENDING_VERIFICATION`)
- `search` (optional): Search in firstName, lastName, email, username
- `includeDeleted` (optional): Include soft-deleted users (default: false)

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
    "limit": 10,
    "total": 150,
    "pages": 15
  }
}
```

### 2. Get User by ID

Retrieve a specific user by their ID.

**Endpoint**: `GET /api/v1/users/:id`

**Parameters**:

- `id`: User ID (string, required)

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

### 3. Update User

Update specific fields of a user account.

**Endpoint**: `PATCH /api/v1/users/:id`

**Parameters**:

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

- `firstName`: User's first name
- `lastName`: User's last name
- `email`: Email address (must be unique)
- `username`: Username (min 2 chars, must be unique)
- `country`: ISO country code
- `role`: User role (`OWNER`, `HIGHER_STAFF`, `STAFF`, `USER`)
- `status`: User status (`ACTIVE`, `INACTIVE`, `BANNED`, `PENDING_VERIFICATION`)
- `isActive`: Account active status

### 4. Delete User (Soft Delete)

Soft delete a user account by setting the deletedAt timestamp.

**Endpoint**: `DELETE /api/v1/users/:id`

**Parameters**:

- `id`: User ID (string, required)

**Response**:

```json
{
  "message": "User deleted successfully",
  "deletedAt": "2024-01-15T10:45:00.000Z"
}
```

## Error Responses

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
  "message": "JWT token is required",
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Access denied. Required roles: OWNER, HIGHER_STAFF, STAFF",
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

## Role Management & Permissions

### Access Control Rules

The user management endpoints enforce strict role-based access control:

#### Owner (`OWNER`)

- **Full access** to all user management functions
- Can **view, update, and delete** any user except other owners
- Can **promote/demote** users to any role except `OWNER`
- **Cannot modify** other owners (protection against accidental lockout)
- Can manage `USER`, `STAFF`, and `HIGHER_STAFF` roles

#### Higher Staff (`HIGHER_STAFF`)

- Can **view** all users
- Can **update and delete** only `STAFF` and `USER` roles
- Can **promote/demote** between `USER` and `STAFF` roles only
- **Cannot modify** `HIGHER_STAFF` or `OWNER` users
- **Cannot elevate** users to `HIGHER_STAFF` or `OWNER` roles

#### Staff (`STAFF`)

- **Read-only access** to user listings
- **Cannot modify or delete** any users
- Can view user details but cannot perform administrative actions

#### Regular User (`USER`)

- **No access** to user management endpoints
- Requests will be rejected with `403 Forbidden`

### Role Change Restrictions

When updating user roles via `PATCH /api/v1/users/:id`:

1. **Cannot promote to `OWNER`**: Only system administrators can create owners
2. **Self-modification protection**: Users cannot change their own role
3. **Hierarchy enforcement**: Users can only manage roles below their level
4. **Owner protection**: Owner roles cannot be modified by other users

### Permission Examples

```
OWNER user updating:
  ✅ USER → STAFF (allowed)
  ✅ STAFF → HIGHER_STAFF (allowed)
  ✅ HIGHER_STAFF → USER (allowed)
  ❌ USER → OWNER (forbidden)
  ❌ Another OWNER (forbidden)

HIGHER_STAFF user updating:
  ✅ USER → STAFF (allowed)
  ✅ STAFF → USER (allowed)
  ❌ USER → HIGHER_STAFF (forbidden)
  ❌ STAFF → HIGHER_STAFF (forbidden)
  ❌ Any HIGHER_STAFF user (forbidden)
  ❌ Any OWNER user (forbidden)

STAFF user:
  ✅ View user list (allowed)
  ❌ Update any user (forbidden)
  ❌ Delete any user (forbidden)
```

## Usage Examples

### Get Active Users with Pagination

```bash
curl -X GET "http://localhost:3100/api/v1/users?status=ACTIVE&page=1&limit=20" \
  -H "Authorization: Bearer your-jwt-token"
```

### Search Users

```bash
curl -X GET "http://localhost:3100/api/v1/users?search=john&limit=5" \
  -H "Authorization: Bearer your-jwt-token"
```

### Update User Role

```bash
curl -X PATCH "http://localhost:3100/api/v1/users/clm1234567890abcdef" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"role": "STAFF", "status": "ACTIVE"}'
```

### Soft Delete User

```bash
curl -X DELETE "http://localhost:3100/api/v1/users/clm1234567890abcdef" \
  -H "Authorization: Bearer your-jwt-token"
```

## Integration with User Service

The API Gateway forwards all user management requests to the internal `user-service` at `http://localhost:3003/internal/users`. The gateway:

1. **Validates JWT tokens** and extracts user information
2. **Enforces role-based access** before forwarding requests
3. **Adds internal service headers** for secure service-to-service communication
4. **Translates responses** and handles errors from the user service
5. **Provides API documentation** via Swagger UI

## Security Features

- **JWT Authentication**: All requests require valid tokens
- **Role-Based Authorization**: Admin-only access control
- **Input Validation**: DTOs validate all request data
- **Error Handling**: Secure error responses without sensitive data
- **Internal Headers**: Secure communication with downstream services

## Rate Limiting

- **General**: 100 requests per minute per user
- **Admin Operations**: 50 requests per minute for user management
- **Search Operations**: 30 requests per minute for search queries

## Monitoring

- All requests are logged with user context
- Failed authorization attempts are tracked
- Service communication errors are monitored
- Response times and error rates are measured
