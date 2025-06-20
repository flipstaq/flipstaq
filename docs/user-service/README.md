# User Service

## Overview

The User Service is a NestJS-based microservice responsible for user management operations within the eCommerce platform. It provides both admin endpoints for managing user accounts and public endpoints for user discovery in messaging.

## Purpose

- **User Management**: CRUD operations for user accounts
- **Admin Operations**: Restricted access for administrative tasks
- **Public User Search**: Allow users to find others for messaging
- **Role-Based Access**: Enforces role-based permissions
- **Soft Deletion**: Maintains data integrity with soft delete functionality

## Architecture

- **Framework**: NestJS 11.1.3
- **Database**: PostgreSQL with Prisma ORM 6.9.0
- **Authentication**: JWT-based with role validation
- **Access Control**: Mixed public and admin-only endpoints
- **Public Search**: Unauthenticated user discovery for messaging

## Key Features

### Public Features (No Authentication Required)

- **User Search**: Find users by username, first name, or last name for messaging

### Admin Features (Authentication Required)

- **List Users**: Paginated user listing with filtering
- **Get User**: Retrieve specific user details
- **Update User**: Modify user information
- **Soft Delete**: Mark users as deleted without removal

### Security

- **Mixed Access Control**: Public search endpoints + protected admin endpoints
- **JWT Validation**: Token-based authentication for protected routes
- **Internal Service Protection**: Middleware for service-to-service calls
- **Rate Limiting**: Public endpoints limited to prevent abuse

### Data Management

- **Public User Data**: Limited information returned for search (id, username, names)
- **Filtering**: By role, status, and other criteria
- **Pagination**: Efficient data retrieval
- **Soft Deletion**: Maintains referential integrity

## Technology Stack

- **Runtime**: Node.js
- **Framework**: NestJS 11.1.3
- **Database**: PostgreSQL
- **ORM**: Prisma 6.9.0
- **Language**: TypeScript
- **Authentication**: JWT tokens

## Internal API (Protected)

All routes are prefixed with `/internal/users` and are only accessible from the API Gateway:

- `GET /internal/users` - List all users (admin only)
- `GET /internal/users/:id` - Get user by ID (admin only)
- `PATCH /internal/users/:id` - Update user (admin only)
- `DELETE /internal/users/:id` - Soft delete user (admin only)

## Public API (No Authentication Required)

### User Search for Messaging

- `GET /public/users/search` - Search users by username, first name, or last name
  - **Query Parameters**:
    - `query` (required): Search term
    - `limit` (optional): Number of results (default: 10, max: 10)
  - **Response**: Array of user objects with limited public information
  - **Example**: `/public/users/search?query=john&limit=5`

## Protected API (via Gateway)

Access through API Gateway at `/api/v1/users/*`:

- `GET /api/v1/users` - List users (admin only)
- `GET /api/v1/users/:id` - Get user details
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Public Search (via Gateway)

Access through API Gateway at `/api/v1/public/users/*`:

- `GET /api/v1/public/users/search` - Search users for messaging (no auth required)

## Internal Route Mappings

The User Service exposes both public and internal endpoints that are accessed through the API Gateway. The following table shows how public API routes map to internal service routes:

| Public Route (API Gateway)        | Internal Route (User Service) | Authentication | Description                              |
| --------------------------------- | ----------------------------- | -------------- | ---------------------------------------- |
| `GET /api/v1/public/users/search` | `GET /public/users/search`    | None           | Search users for messaging               |
| `GET /api/v1/users`               | `GET /internal/users`         | JWT + Admin    | List users with filtering and pagination |
| `GET /api/v1/users/:id`           | `GET /internal/users/:id`     | JWT + Admin    | Get specific user by ID                  |
| `PATCH /api/v1/users/:id`         | `PATCH /internal/users/:id`   | JWT + Admin    | Update user information                  |
| `DELETE /api/v1/users/:id`        | `DELETE /internal/users/:id`  | JWT + Admin    | Soft delete user                         |

### Internal Service Authentication

Internal requests are authenticated using special headers:

- `x-internal-service: true` - Identifies the request as internal
- `x-api-gateway: flipstaq-gateway` - Verifies the request comes from the API Gateway
- `x-forwarded-from: api-gateway` - Additional security header

### Security Model

1. **Public Endpoints**: `/public/*` routes require no authentication and return limited user data
2. **API Gateway**: Handles external authentication (JWT tokens) and role-based access control for protected routes
3. **User Service**: Validates internal service headers for protected endpoints and processes public requests directly
4. **Mixed Authentication**: Public search available to all, admin operations require JWT + role validation

### Request Flow

#### Public User Search

```
External Client → API Gateway → User Service (Public Controller)
    ↓               ↓              ↓
No Auth → Route Forwarding → Public Data Response
```

#### Protected Operations

```
External Client → API Gateway → User Service (Internal Controller)
    ↓               ↓              ↓
JWT Token → Role Validation → Internal Headers → Response
```

The API Gateway acts as the security boundary for protected operations, while public endpoints bypass authentication entirely.

## Environment Configuration

```env
NODE_ENV=development
PORT=3003
DATABASE_URL=postgresql://username:password@localhost:5432/ecommerce_db
JWT_SECRET=your-jwt-secret-key
```

## Dependencies

```json
{
  "@nestjs/common": "^11.1.3",
  "@nestjs/core": "^11.1.3",
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.3",
  "@nestjs/swagger": "^8.0.4",
  "@prisma/client": "^6.9.0",
  "prisma": "^6.9.0",
  "passport-jwt": "^4.0.1"
}
```

## Role Requirements

All endpoints require the user to have one of the following roles:

- `OWNER`
- `HIGHER_STAFF`
- `STAFF`

Regular `USER` role cannot access any user management endpoints.

## Role Management & Business Logic

### Role Hierarchy Enforcement

The User Service implements business logic to enforce role hierarchy and access control:

#### Update Operations (`PATCH /internal/users/:id`)

- **Role Changes**: Validates that role changes follow hierarchy rules
- **Self-Protection**: Prevents users from modifying their own roles
- **Owner Protection**: Prevents modification of owner accounts by non-owners
- **Data Validation**: Ensures all field updates are valid and consistent

#### Delete Operations (`DELETE /internal/users/:id`)

- **Soft Deletion**: Sets `deletedAt` timestamp and `isActive: false`
- **Role Protection**: Enforces deletion permissions based on user hierarchy
- **Referential Integrity**: Maintains data relationships after deletion
- **Audit Trail**: Preserves deletion metadata for compliance

#### Business Rules Implementation

```typescript
// Example role change validation
async updateUser(id: string, updateData: UpdateUserDto) {
  const targetUser = await this.findById(id);
  const currentUser = this.getCurrentUser(); // From JWT context

  // Check if role change is requested
  if (updateData.role && updateData.role !== targetUser.role) {
    this.validateRoleChange(currentUser, targetUser, updateData.role);
  }

  // Prevent self-modification of critical fields
  if (id === currentUser.id && 'role' in updateData) {
    throw new ForbiddenException('Cannot modify your own role');
  }

  return this.prisma.user.update({ where: { id }, data: updateData });
}
```

### Permission Validation

The service validates permissions at the business logic level:

1. **Requester Role**: Extracted from JWT token forwarded by API Gateway
2. **Target User Role**: Retrieved from database
3. **Requested Action**: Determined by endpoint and request data
4. **Permission Matrix**: Applied based on role hierarchy rules

### Data Consistency

- **Atomic Operations**: All user updates are wrapped in database transactions
- **Validation**: Input validation using NestJS DTOs and Prisma schema
- **Constraints**: Database-level constraints for data integrity
- **Audit Logging**: All modifications are logged with user context

## Database Schema

The service uses shared Prisma schema located in `packages/db/schema.prisma`:

- **User Model**: Includes role, status, soft deletion support
- **User Roles**: OWNER, HIGHER_STAFF, STAFF, USER
- **User Status**: ACTIVE, INACTIVE, BANNED, PENDING_VERIFICATION

## Security Features

1. **JWT Authentication**: All requests require valid JWT tokens
2. **Role-Based Access**: Admin-only endpoint protection
3. **Internal Service Protection**: Middleware validates internal calls
4. **Data Validation**: DTOs for request/response validation
5. **Error Handling**: Comprehensive error responses
6. **Deleted Account Handling**: Integration with auth service for real-time user status validation

### Deleted Account Management

The User Service implements soft deletion with full traceability to maintain data integrity:

- **Soft Delete**: Sets `deletedAt` timestamp, `deletedById` (admin ID), and `isActive: false`
- **Deletion Traceability**: Tracks which admin performed the deletion for audit purposes
- **Data Preservation**: User records are retained for audit and referential integrity
- **Real-time Validation**: Auth service validates user status on every request
- **Automatic Logout**: Frontend automatically logs out deleted users

**Delete Process:**

1. Admin triggers user deletion via DELETE endpoint
2. User record is marked as `isActive: false`, `deletedAt: [timestamp]`, and `deletedById: [admin_id]`
3. Next API request by deleted user triggers 401 response
4. Frontend detects deleted account response and forces logout
5. User is redirected to login page with deletion message

**Deletion Metadata:**

- `deletedAt`: Timestamp when the user was deleted
- `deletedById`: ID of the admin who performed the deletion
- `deletedBy`: (Virtual field) Full admin information including name and role

## Integration

- **API Gateway**: Routes proxied through gateway service
- **Auth Service**: JWT validation for authentication
- **Database**: Shared Prisma schema with other services
- **Monitoring**: Structured logging and error tracking

## Development

### Starting the Service

```bash
# Navigate to user-service
cd services/user-service

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Start development server
npm run start:dev
```

### Testing

```bash
# Run tests
npm run test

# Run e2e tests
npm run test:e2e
```

## API Documentation

Detailed API documentation is available via Swagger when the service is running:

- Local: `http://localhost:3003/api/docs`

## Monitoring & Logging

- Structured logging with contextual information
- Error tracking and reporting
- Performance monitoring
- Health check endpoints

## Future Enhancements

- User analytics and reporting
- Bulk user operations
- Advanced filtering and search
- User activity tracking
- Export functionality
