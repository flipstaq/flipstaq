# Product Service API Documentation

## Base URL

**Internal Service URL**: `http://localhost:3004`

⚠️ **Important**: This service is internal-only and accessible only through the API Gateway. Direct access is blocked by internal service guards.

## Authentication & Headers

All endpoints require these headers for internal service access:

```http
x-internal-service: true
x-api-gateway: flipstaq-gateway
x-forwarded-from: api-gateway
```

For endpoints requiring user context:

```http
x-user-id: <user-id>
x-user-email: <user-email>
x-user-role: <user-role>
```

---

## Endpoints

### 1. Create Product

**POST** `/internal/products`

Creates a new product for the authenticated user.

#### Headers

```http
Content-Type: application/json
x-internal-service: true
x-api-gateway: flipstaq-gateway
x-user-id: clx1y2z3a4b5c6d7e8f9g0h1
x-user-email: user@example.com
x-user-role: USER
```

#### Request Body

```json
{
  "title": "MacBook Pro 16 inch",
  "description": "High-performance laptop for professionals",
  "category": "Electronics",
  "price": 2499.99,
  "currency": "USD",
  "location": "United States",
  "slug": "macbook-pro-16-mint-condition"
}
```

#### Field Validations

- **title** (required): String, minimum 1 character
- **description** (optional): String
- **category** (optional): String
- **price** (required): Number, minimum 0
- **currency** (required): Enum ["USD", "AED", "EUR", "GBP", "SAR"], default "USD"
- **location** (required): String (country name or "Global")
- **slug** (required): String, alphanumeric + hyphens + underscores only

#### Slug Rules

- Must contain only letters, numbers, hyphens (-), and underscores (\_)
- Must be unique per user (not globally unique)
- Case-sensitive matching
- No spaces or special characters allowed

#### Response (201 Created)

```json
{
  "id": "clx1y2z3a4b5c6d7e8f9g0h2",
  "title": "MacBook Pro 16 inch",
  "description": "High-performance laptop for professionals",
  "category": "Electronics",
  "price": 2499.99,
  "currency": "USD",
  "location": "United States",
  "slug": "macbook-pro-16-mint-condition",
  "userId": "clx1y2z3a4b5c6d7e8f9g0h1",
  "username": "johndoe",
  "isActive": true,
  "createdAt": "2025-06-15T10:30:00.000Z",
  "updatedAt": "2025-06-15T10:30:00.000Z"
}
```

#### Error Responses

**400 Bad Request** - Invalid user ID

```json
{
  "message": "Invalid user ID",
  "statusCode": 400
}
```

**400 Bad Request** - Invalid slug format

```json
{
  "message": "Slug can only contain letters, numbers, hyphens, and underscores",
  "statusCode": 400
}
```

**409 Conflict** - Slug already exists for user

```json
{
  "message": "A product with this slug already exists for this user",
  "statusCode": 409
}
```

---

### 2. Get All Products

**GET** `/internal/products`

Retrieves all active products, sorted by creation date (newest first).

#### Headers

```http
x-internal-service: true
x-api-gateway: flipstaq-gateway
```

#### Response (200 OK)

```json
[
  {
    "id": "clx1y2z3a4b5c6d7e8f9g0h2",
    "title": "MacBook Pro 16 inch",
    "description": "High-performance laptop for professionals",
    "category": "Electronics",
    "price": 2499.99,
    "currency": "USD",
    "location": "United States",
    "slug": "macbook-pro-16-mint-condition",
    "userId": "clx1y2z3a4b5c6d7e8f9g0h1",
    "username": "johndoe",
    "isActive": true,
    "createdAt": "2025-06-15T10:30:00.000Z",
    "updatedAt": "2025-06-15T10:30:00.000Z"
  }
]
```

---

### 3. Get Product by Username and Slug

**GET** `/internal/products/@:username/:slug`

Retrieves a specific product by username and slug.

#### URL Parameters

- **username**: The product owner's username
- **slug**: The product's URL slug

#### Example

```
GET /internal/products/@johndoe/macbook-pro-16-mint-condition
```

#### Headers

```http
x-internal-service: true
x-api-gateway: flipstaq-gateway
```

#### Response (200 OK)

```json
{
  "id": "clx1y2z3a4b5c6d7e8f9g0h2",
  "title": "MacBook Pro 16 inch",
  "description": "High-performance laptop for professionals",
  "category": "Electronics",
  "price": 2499.99,
  "currency": "USD",
  "location": "United States",
  "slug": "macbook-pro-16-mint-condition",
  "userId": "clx1y2z3a4b5c6d7e8f9g0h1",
  "username": "johndoe",
  "isActive": true,
  "createdAt": "2025-06-15T10:30:00.000Z",
  "updatedAt": "2025-06-15T10:30:00.000Z"
}
```

#### Error Responses

**404 Not Found** - Product not found

```json
{
  "message": "Product not found",
  "statusCode": 404
}
```

---

### 4. Get Products by User ID

**GET** `/internal/products/user/:userId`

Retrieves all active products for a specific user.

#### URL Parameters

- **userId**: The user's ID

#### Example

```
GET /internal/products/user/clx1y2z3a4b5c6d7e8f9g0h1
```

#### Headers

```http
x-internal-service: true
x-api-gateway: flipstaq-gateway
```

#### Response (200 OK)

```json
[
  {
    "id": "clx1y2z3a4b5c6d7e8f9g0h2",
    "title": "MacBook Pro 16 inch",
    "description": "High-performance laptop for professionals",
    "category": "Electronics",
    "price": 2499.99,
    "currency": "USD",
    "location": "United States",
    "slug": "macbook-pro-16-mint-condition",
    "userId": "clx1y2z3a4b5c6d7e8f9g0h1",
    "username": "johndoe",
    "isActive": true,
    "createdAt": "2025-06-15T10:30:00.000Z",
    "updatedAt": "2025-06-15T10:30:00.000Z"
  }
]
```

---

## External API Gateway Routes

These are the public-facing routes accessible through the API Gateway:

### GET /api/v1/products

- **Public Access**: Yes
- **Description**: List all active products
- **Forwards to**: `GET /internal/products`

### POST /api/v1/products

- **Authentication**: Required (JWT Bearer token)
- **Description**: Create a new product
- **Forwards to**: `POST /internal/products`

### GET /api/v1/products/@:username/:slug

- **Public Access**: Yes
- **Description**: Get specific product by username and slug
- **Used for**: Product detail modal/overlay on frontend
- **Forwards to**: `GET /internal/products/@:username/:slug`
- **Frontend Integration**: Called from ProductDetailModal component when user clicks on a product card

### GET /api/v1/products/user/:userId

- **Public Access**: Yes
- **Description**: Get user's products
- **Forwards to**: `GET /internal/products/user/:userId`

---

## Data Types

### Product Response Object

```typescript
interface ProductResponseDto {
  id: string; // Unique product ID
  title: string; // Product title
  description: string | null; // Product description (optional)
  category: string | null; // Product category (optional)
  price: number; // Product price
  currency: string; // Currency code (USD, AED, EUR, GBP, SAR)
  location: string; // Country or "Global"
  slug: string; // URL-friendly identifier
  userId: string; // Owner's user ID
  username: string; // Owner's username
  isActive: boolean; // Whether product is active
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last update timestamp
}
```

### Create Product Request

```typescript
interface CreateProductDto {
  title: string; // Required, min 1 char
  description?: string; // Optional
  category?: string; // Optional
  price: number; // Required, min 0
  currency: string; // Required, enum value
  location: string; // Required
  slug: string; // Required, alphanumeric + - + _
}
```

---

## Error Handling

The service provides consistent error responses:

### Common Error Status Codes

- **400 Bad Request**: Invalid input data or validation errors
- **401 Unauthorized**: Missing or invalid internal service headers
- **404 Not Found**: Product or user not found
- **409 Conflict**: Slug already exists for user
- **500 Internal Server Error**: Database or server errors

### Error Response Format

```json
{
  "message": "Error description",
  "statusCode": 400,
  "error": "Bad Request"
}
```

---

## Database Constraints

### Unique Constraints

- **userId + slug**: Each user can have only one product with a specific slug
- **id**: Primary key, globally unique

### Foreign Key Constraints

- **userId**: References User.id with CASCADE delete

### Default Values

- **currency**: "USD"
- **isActive**: true
- **createdAt**: Current timestamp
- **updatedAt**: Current timestamp (auto-updated)

---

## Swagger Documentation

When running the service locally, Swagger documentation is available at:
`http://localhost:3004/api-docs`

This provides an interactive API explorer for testing endpoints directly.
