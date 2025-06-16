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

## Dashboard Statistics

### GET /internal/products/dashboard/stats

**Description**: Retrieves dashboard statistics for the authenticated seller including total products, views, deleted products, and last created product.

**Authentication**: Internal service authentication required (x-internal-service header)

**Headers Required**:

```http
x-internal-service: true
x-api-gateway: flipstaq-gateway
x-forwarded-from: api-gateway
x-user-id: <user-id>
```

**Response Format**:

```typescript
interface DashboardStats {
  totalProducts: number; // Count of active products
  totalViews: number; // Total views across all products (currently simulated)
  deletedProducts: number; // Count of soft-deleted products
  lastProduct: {
    // Most recently created product
    name: string;
    createdAt: string; // ISO date string
  } | null; // null if no products exist
}
```

**Example Response**:

```json
{
  "totalProducts": 15,
  "totalViews": 1250,
  "deletedProducts": 3,
  "lastProduct": {
    "name": "Vintage Leather Jacket",
    "createdAt": "2025-06-15T10:30:00.000Z"
  }
}
```

**Implementation Details**:

- This endpoint is accessible through the API Gateway at `/api/v1/products/dashboard/stats`
- Statistics are calculated in real-time from the database
- Only counts products owned by the specified user
- `totalViews` is currently generated with simulated data (random factor based on products)
- Soft-deleted products (isActive: false) are counted separately from active products

### PATCH /internal/products/:slug/status

**Description**: Updates the sold status of a product. Only the product owner can change its status.

**Request Body**: `{ isSold: boolean }`
**Response**: Updated ProductResponseDto with `isSold` field
**Access**: Internal service only (via API Gateway at `/api/v1/products/:slug/status`)

**Business Rules**:

- Only product owners can update sold status
- Sold products cannot be edited (frontend restriction)
- Status changes are reflected in dashboard statistics

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

### 5. Update Product

**PATCH** `/internal/products/:slug`

Updates an existing product. Only the product owner can update their product.

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
  "title": "MacBook Pro 16 inch - Updated",
  "description": "High-performance laptop for professionals, now with M1 chip",
  "category": "Electronics",
  "price": 2399.99,
  "currency": "USD",
  "location": "United States",
  "slug": "macbook-pro-16-mint-condition"
}
```

#### Response Format

```typescript
interface ProductResponseDto {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  location: string;
  slug: string;
  imageUrl: string | null;
  userId: string;
  username: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Example Request

```bash
PATCH /internal/products/macbook-pro-16-mint-condition
Content-Type: application/json
x-user-id: clx1y2z3a4b5c6d7e8f9g0h1
x-internal-service: true

{
  "title": "MacBook Pro 16 inch - Updated",
  "description": "High-performance laptop for professionals, now with M1 chip",
  "category": "Electronics",
  "price": 2399.99,
  "currency": "USD",
  "location": "United States",
  "slug": "macbook-pro-16-mint-condition"
}
```

#### Example Response

```json
{
  "id": "clx1y2z3a4b5c6d7e8f9g0h1",
  "title": "MacBook Pro 16 inch - Updated",
  "description": "High-performance laptop for professionals, now with M1 chip",
  "category": "Electronics",
  "price": 2399.99,
  "currency": "USD",
  "location": "United States",
  "slug": "macbook-pro-16-mint-condition",
  "imageUrl": "/uploads/products/macbook-pro-a1b2.jpg",
  "userId": "clx1y2z3a4b5c6d7e8f9g0h1",
  "username": "johndoe",
  "isActive": true,
  "createdAt": "2025-06-15T10:30:00.000Z",
  "updatedAt": "2025-06-16T14:45:00.000Z"
}
```

#### Error Responses

- `400 Bad Request`: Invalid request body or missing required fields
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User does not own the product
- `404 Not Found`: Product not found
- `500 Internal Server Error`: Database or server error

---

### 6. Update Product Status

**PATCH** `/internal/products/:slug/status`

Updates the sold status of a product. Only the product owner can change its status.

#### Authentication

Required (Internal service headers)

#### Parameters

- `slug` (path): Product slug identifier

#### Request Body

```json
{
  "isSold": true
}
```

#### Response Format

```typescript
interface ProductResponseDto {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  location: string;
  slug: string;
  imageUrl: string | null;
  userId: string;
  username: string;
  isActive: boolean;
  isSold: boolean; // Updated field
  createdAt: Date;
  updatedAt: Date;
}
```

#### Example Request

```bash
PATCH /internal/products/vintage-laptop/status
Content-Type: application/json
x-user-id: user123
x-internal-service: true

{
  "isSold": true
}
```

#### Example Response

```json
{
  "id": "clx1y2z3a4b5c6d7e8f9g0h1",
  "title": "Vintage Laptop",
  "description": "Classic ThinkPad in excellent condition",
  "category": "Electronics",
  "price": 250.0,
  "currency": "USD",
  "location": "Global",
  "slug": "vintage-laptop",
  "imageUrl": "/uploads/products/laptop-abc123.jpg",
  "userId": "user123",
  "username": "johndoe",
  "isActive": true,
  "isSold": true,
  "createdAt": "2025-06-15T10:30:00.000Z",
  "updatedAt": "2025-06-16T14:45:00.000Z"
}
```

#### Error Responses

- `400 Bad Request`: Invalid request body or missing required fields
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User does not own the product
- `404 Not Found`: Product not found
- `500 Internal Server Error`: Database or server error

**Business Rules**:

- Only product owners can update the sold status
- Products marked as sold cannot be edited (frontend restriction)
- Sold status does not affect product visibility - products remain active
- Status changes are immediately reflected in dashboard statistics

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

### 5. Update Product

**PATCH** `/internal/products/:slug`

Updates an existing product. Only the product owner can update their product.

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
  "title": "MacBook Pro 16 inch - Updated",
  "description": "High-performance laptop for professionals, now with M1 chip",
  "category": "Electronics",
  "price": 2399.99,
  "currency": "USD",
  "location": "United States",
  "slug": "macbook-pro-16-mint-condition"
}
```

#### Response Format

```typescript
interface ProductResponseDto {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  location: string;
  slug: string;
  imageUrl: string | null;
  userId: string;
  username: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Example Request

```bash
PATCH /internal/products/macbook-pro-16-mint-condition
Content-Type: application/json
x-user-id: clx1y2z3a4b5c6d7e8f9g0h1
x-internal-service: true

{
  "title": "MacBook Pro 16 inch - Updated",
  "description": "High-performance laptop for professionals, now with M1 chip",
  "category": "Electronics",
  "price": 2399.99,
  "currency": "USD",
  "location": "United States",
  "slug": "macbook-pro-16-mint-condition"
}
```

#### Example Response

```json
{
  "id": "clx1y2z3a4b5c6d7e8f9g0h1",
  "title": "MacBook Pro 16 inch - Updated",
  "description": "High-performance laptop for professionals, now with M1 chip",
  "category": "Electronics",
  "price": 2399.99,
  "currency": "USD",
  "location": "United States",
  "slug": "macbook-pro-16-mint-condition",
  "imageUrl": "/uploads/products/macbook-pro-a1b2.jpg",
  "userId": "clx1y2z3a4b5c6d7e8f9g0h1",
  "username": "johndoe",
  "isActive": true,
  "createdAt": "2025-06-15T10:30:00.000Z",
  "updatedAt": "2025-06-16T14:45:00.000Z"
}
```

#### Error Responses

- `400 Bad Request`: Invalid request body or missing required fields
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User does not own the product
- `404 Not Found`: Product not found
- `500 Internal Server Error`: Database or server error

---

### 6. Update Product Status

**PATCH** `/internal/products/:slug/status`

Updates the sold status of a product. Only the product owner can change its status.

#### Authentication

Required (Internal service headers)

#### Parameters

- `slug` (path): Product slug identifier

#### Request Body

```json
{
  "isSold": true
}
```

#### Response Format

```typescript
interface ProductResponseDto {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  location: string;
  slug: string;
  imageUrl: string | null;
  userId: string;
  username: string;
  isActive: boolean;
  isSold: boolean; // Updated field
  createdAt: Date;
  updatedAt: Date;
}
```

#### Example Request

```bash
PATCH /internal/products/vintage-laptop/status
Content-Type: application/json
x-user-id: user123
x-internal-service: true

{
  "isSold": true
}
```

#### Example Response

```json
{
  "id": "clx1y2z3a4b5c6d7e8f9g0h1",
  "title": "Vintage Laptop",
  "description": "Classic ThinkPad in excellent condition",
  "category": "Electronics",
  "price": 250.0,
  "currency": "USD",
  "location": "Global",
  "slug": "vintage-laptop",
  "imageUrl": "/uploads/products/laptop-abc123.jpg",
  "userId": "user123",
  "username": "johndoe",
  "isActive": true,
  "isSold": true,
  "createdAt": "2025-06-15T10:30:00.000Z",
  "updatedAt": "2025-06-16T14:45:00.000Z"
}
```

#### Error Responses

- `400 Bad Request`: Invalid request body or missing required fields
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User does not own the product
- `404 Not Found`: Product not found
- `500 Internal Server Error`: Database or server error

**Business Rules**:

- Only product owners can update the sold status
- Products marked as sold cannot be edited (frontend restriction)
- Sold status does not affect product visibility - products remain active
- Status changes are immediately reflected in dashboard statistics

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

## Favorite Management

### POST /internal/favorites

**Description**: Add a product to the user's favorites list.

**Authentication**: Internal service authentication required + User authentication

**Headers Required**:

```http
x-internal-service: true
x-api-gateway: flipstaq-gateway
x-forwarded-from: api-gateway
x-user-id: <user-id>
```

**Request Body**:

```json
{
  "productId": "cmbzeo9070001w7h8txxutdh0"
}
```

**Response Format**:

```json
{
  "id": "cmbzf1a2b0001x8i9uvxyze1k",
  "userId": "cmbz4qbap0000w7o8sdcex7ih",
  "productId": "cmbzeo9070001w7h8txxutdh0",
  "createdAt": "2025-06-17T00:15:30.000Z"
}
```

#### Error Responses

- `400 Bad Request`: Invalid product ID or missing required fields
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Cannot favorite inactive product
- `404 Not Found`: Product not found
- `409 Conflict`: Product already in favorites

---

### DELETE /internal/favorites/:productId

**Description**: Remove a product from the user's favorites list.

**Authentication**: Internal service authentication required + User authentication

**Headers Required**:

```http
x-internal-service: true
x-api-gateway: flipstaq-gateway
x-forwarded-from: api-gateway
x-user-id: <user-id>
```

**URL Parameters**:

- `productId` (string): The ID of the product to remove from favorites

**Response Format**:

```json
{
  "message": "Product removed from favorites successfully"
}
```

#### Error Responses

- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Product not in favorites

---

### GET /internal/favorites

**Description**: Retrieve all favorited products for the authenticated user.

**Authentication**: Internal service authentication required + User authentication

**Headers Required**:

```http
x-internal-service: true
x-api-gateway: flipstaq-gateway
x-forwarded-from: api-gateway
x-user-id: <user-id>
```

**Response Format**:

```json
[
  {
    "id": "cmbzf1a2b0001x8i9uvxyze1k",
    "createdAt": "2025-06-17T00:15:30.000Z",
    "product": {
      "id": "cmbzeo9070001w7h8txxutdh0",
      "title": "Vintage Laptop",
      "description": "A classic laptop in excellent condition",
      "category": "Electronics",
      "price": 299.99,
      "currency": "USD",
      "location": "New York, USA",
      "slug": "vintage-laptop",
      "imageUrl": "/uploads/products/laptop-abc123.jpg",
      "userId": "user456",
      "username": "janedoe",
      "isActive": true,
      "isSold": false,
      "createdAt": "2025-06-15T10:30:00.000Z",
      "updatedAt": "2025-06-15T10:30:00.000Z"
    }
  }
]
```

#### Error Responses

- `401 Unauthorized`: Missing or invalid authentication

---

### GET /internal/favorites/count

**Description**: Get the total count of favorited products for the authenticated user.

**Authentication**: Internal service authentication required + User authentication

**Headers Required**:

```http
x-internal-service: true
x-api-gateway: flipstaq-gateway
x-forwarded-from: api-gateway
x-user-id: <user-id>
```

**Response Format**:

```json
{
  "count": 5
}
```

#### Error Responses

- `401 Unauthorized`: Missing or invalid authentication

---

### GET /internal/favorites/check/:productId

**Description**: Check if a specific product is in the user's favorites.

**Authentication**: Internal service authentication required + User authentication

**Headers Required**:

```http
x-internal-service: true
x-api-gateway: flipstaq-gateway
x-forwarded-from: api-gateway
x-user-id: <user-id>
```

**URL Parameters**:

- `productId` (string): The ID of the product to check

**Response Format**:

```json
{
  "isFavorited": true
}
```

#### Error Responses

- `401 Unauthorized`: Missing or invalid authentication

**Business Rules**:

- Users cannot favorite inactive products
- Each user can favorite a product only once (unique constraint)
- Deleting a product removes it from all users' favorites
- Deleting a user removes all their favorites
