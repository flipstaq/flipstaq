# Product Service

## Overview

The Product Service is a microservice responsible for managing product operations in the Flipstaq eCommerce platform. It handles product creation, retrieval, and management while ensuring data integrity and proper access control.

## Purpose

- **Product Management**: Create, read, update, and delete products
- **Slug Management**: Handle unique product URLs for SEO-friendly access
- **Data Validation**: Ensure product data integrity and validation
- **User Association**: Link products to their respective owners
- **Internal Service**: Secure API accessible only through the API Gateway

## Architecture

### Service Details

- **Port**: 3004 (Internal only - no direct external access)
- **Technology**: NestJS 11.1.3 + TypeScript + Prisma
- **Database**: PostgreSQL (shared schema in `packages/db`)
- **Status**: ✅ **Implemented**

### Database Schema

The Product model in the shared Prisma schema:

```prisma
model Product {
  id          String   @id @default(cuid())
  title       String
  description String?
  category    String?
  price       Float
  currency    String   @default("USD")
  location    String   // Country or "Global"
  slug        String   // User-chosen URL part
  userId      String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Unique constraint for slug per user
  @@unique([userId, slug])
  @@map("products")
}
```

## Key Features

### ✅ Product Creation

- Full product posting with validation
- Auto-validation of user ownership
- Slug uniqueness enforcement per user
- Price and currency management
- Location and category support

### ✅ Product Retrieval

- List all active products (homepage)
- Get product by username and slug
- Get products by user ID
- Proper sorting by creation date

### ✅ Slug Management

- User-friendly URL generation (@username/slug)
- Slug format validation (alphanumeric, hyphens, underscores)
- Uniqueness per user (not globally unique)
- SEO-friendly product URLs

### ✅ Data Validation

- Required field validation
- Price numeric validation
- Currency enum validation
- Location and category support
- User existence validation

### ✅ Security

- Internal service protection (only accessible via API Gateway)
- User authentication and authorization
- Request validation and sanitization
- Error handling and logging

## Internal Endpoints

All endpoints are prefixed with `/internal/products` and require internal service headers.

### POST /internal/products

Create a new product

**Headers Required:**

- `x-internal-service: true`
- `x-api-gateway: flipstaq-gateway`
- `x-user-id: <user-id>`

### GET /internal/products

Get all active products

**Headers Required:**

- `x-internal-service: true`
- `x-api-gateway: flipstaq-gateway`

### GET /internal/products/@:username/:slug

Get product by username and slug

**Headers Required:**

- `x-internal-service: true`
- `x-api-gateway: flipstaq-gateway`

### GET /internal/products/user/:userId

Get products by user ID

**Headers Required:**

- `x-internal-service: true`
- `x-api-gateway: flipstaq-gateway`

## Integration

### API Gateway Routes

External clients access products through API Gateway routes:

- `GET /api/v1/products` → List all products
- `POST /api/v1/products` → Create product (requires auth)
- `GET /api/v1/products/@username/slug` → Get specific product
- `GET /api/v1/products/user/:userId` → Get user's products

### Frontend Integration

- Product listing on homepage (limited)
- Full product catalog page
- Product creation form for authenticated users
- Individual product view pages
- Responsive design with RTL support
- Multi-language support (English/Arabic)

## Error Handling

The service handles various error scenarios:

- Invalid user ID
- Duplicate slug per user
- Invalid slug format
- Product not found
- Validation errors
- Database connection issues

## Dependencies

- **@flipstaq/db**: Shared Prisma client and schema
- **NestJS**: Framework and decorators
- **Prisma**: ORM and database client
- **class-validator**: DTO validation
- **Swagger**: API documentation

## Monitoring & Logging

- Request logging for all operations
- Error logging with stack traces
- Performance monitoring
- Database query logging
- Internal service access validation

## Future Enhancements

- Product image upload and management
- Advanced search and filtering
- Product categories with hierarchy
- Product ratings and reviews integration
- Inventory management
- Product variations (size, color, etc.)
- Bulk product operations
- Product analytics and insights
