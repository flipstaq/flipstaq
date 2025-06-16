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

## File Storage

### Image Upload Structure

Product images are stored in the API Gateway using the following structure:

```
apps/api-gateway/src/uploads/products/    # Development
apps/api-gateway/dist/uploads/products/   # Production (after compilation)
├── product-image-a1b2.jpg
├── product-image-c3d4.png
└── ...
```

### Storage Best Practices

- **Upload Directory**:
  - **Development**: `src/uploads/products/` (source folder)
  - **Production**: `dist/uploads/products/` (compiled folder)
- **Static Serving**: Files are served at `/uploads/products/{filename}`
- **Supported Formats**: JPG, JPEG, PNG
- **File Size Limit**: 5MB maximum per image
- **Filename Generation**: `{original-name}-{random-hash}.{extension}`
- **Path Resolution**: Environment-aware path handling for dev/prod consistency

### Directory Creation

The uploads directory is automatically created at application startup based on the environment:

```typescript
// Development: apps/api-gateway/src/uploads/products/
// Production: apps/api-gateway/dist/uploads/products/
const uploadsPath = join(__dirname, "..", "src", "uploads", "products");
```

```typescript
// In main.ts
const uploadsPath = join(__dirname, "uploads", "products");
if (!existsSync(uploadsPath)) {
  mkdirSync(uploadsPath, { recursive: true });
}
```

### Environment-Aware File Handling

The API Gateway uses intelligent path resolution to handle file storage and serving across different environments:

#### Development Environment

- **Upload Destination**: `apps/api-gateway/src/uploads/products/`
- **Static Serving**: Serves from `src/uploads/` directory
- **Path Resolution**: Uses `__dirname + "../src/uploads"` to handle TypeScript source structure

#### Production Environment

- **Upload Destination**: `apps/api-gateway/dist/uploads/products/`
- **Static Serving**: Serves from `dist/uploads/` directory
- **Path Resolution**: Uses `__dirname + "uploads"` for compiled JavaScript structure

#### Configuration Logic

```typescript
// Upload destination (multer configuration)
const uploadPath =
  process.env.NODE_ENV === "production"
    ? join(process.cwd(), "dist", "uploads", "products")
    : join(process.cwd(), "apps", "api-gateway", "src", "uploads", "products");

// Static file serving
const staticPath =
  process.env.NODE_ENV === "production"
    ? join(__dirname, "uploads")
    : join(__dirname, "..", "src", "uploads");
```

This ensures consistent file access whether running in development (`npm run start:dev`) or production builds.

---

## Endpoints

### 1. Create Product

**POST** `/internal/products`

Creates a new product for the authenticated user with optional image upload.

#### Headers

```http
Content-Type: multipart/form-data
x-internal-service: true
x-api-gateway: flipstaq-gateway
x-user-id: clx1y2z3a4b5c6d7e8f9g0h1
x-user-email: user@example.com
x-user-role: USER
```

#### Request Body (multipart/form-data)

```
title: "MacBook Pro 16 inch"
description: "High-performance laptop for professionals"
category: "Electronics"
price: "2499.99"
currency: "USD"
location: "United States"
slug: "macbook-pro-16-mint-condition"
image: <file> (optional)
```

#### Field Validations

- **title** (required): String, minimum 1 character
- **description** (optional): String
- **category** (optional): String
- **price** (required): Number, minimum 0
- **currency** (required): Enum ["USD", "AED", "EUR", "GBP", "SAR"], default "USD"
- **location** (required): String (country name or "Global")
- **slug** (required): String, alphanumeric + hyphens + underscores only
- **image** (optional): File upload (JPG, PNG), max 5MB
- **imageUrl** (optional): String, auto-generated if image uploaded

#### Image Upload Requirements

- **Supported formats**: JPG, JPEG, PNG
- **Maximum file size**: 5MB
- **File naming**: Auto-generated with random suffix
- **Storage location**: `/uploads/products/`
- **URL format**: `/uploads/products/{filename}`

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
  "imageUrl": "/uploads/products/macbook-pro-a1b2.jpg",
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

---

## Production Deployment Notes

When deploying to production, ensure that:

1. **Build Process**: The TypeScript compilation copies the `src/uploads/` directory to `dist/uploads/`
2. **Persistence**: Use a persistent volume or external storage for production uploads
3. **Environment Variables**: Set `NODE_ENV=production` for proper path resolution
4. **Directory Permissions**: Ensure the application has write permissions to the uploads directory

### File Access URLs

All uploaded images are accessible via the following URL pattern:

```
http://localhost:3100/uploads/products/{filename}
```

Example:

```
http://localhost:3100/uploads/products/Banner-61a1.png
```

### Troubleshooting

**Common Issues:**

1. **404 Errors**: Check that `NODE_ENV` is set correctly and files exist in the expected directory
2. **Permission Errors**: Ensure application has read/write access to uploads directory
3. **Path Issues**: Verify `__dirname` resolution matches expected folder structure

**Debug Commands:**

```bash
# Check current upload directory structure
ls -la apps/api-gateway/src/uploads/products/

# Test image serving
curl -I http://localhost:3100/uploads/products/{filename}
```
