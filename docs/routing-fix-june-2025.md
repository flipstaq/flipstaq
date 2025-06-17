# API Route Restructuring - June 2025

## Overview

This document details the resolution of a Next.js routing conflict that was causing the application to fail during development.

## Problem Description

### Error Message

```
Error: You cannot use different slug names for the same dynamic path ('slug' !== 'username').
```

### Root Cause

Two conflicting dynamic API routes existed at the same level in the file system:

```
/api/products/
├── [slug]/
│   ├── reviews.ts        # Product reviews by slug
│   └── user-review.ts    # User's review for a product
└── [username]/           # ❌ CONFLICT with [slug]
    └── [slug].ts         # Get product by username + slug
```

Next.js treats `[slug]` and `[username]` as conflicting dynamic segments when they exist at the same route level, even though they use different parameter names.

## Solution Applied

### New Route Structure

Reorganized the API routes to eliminate conflicts:

```
/api/
├── products/
│   ├── index.ts
│   ├── my-products.ts
│   └── [slug]/
│       ├── reviews.ts       # ✅ No conflict
│       └── user-review.ts   # ✅ No conflict
├── users/
│   └── [username]/
│       └── products/
│           └── [slug].ts    # ✅ Moved to separate path
└── reviews/
    ├── index.ts
    └── [reviewId].ts
```

### Route Migration

**Before**: `/api/products/[username]/[slug].ts`
**After**: `/api/users/[username]/products/[slug].ts`

### Code Changes

#### 1. File Movement

- Moved `apps/web/src/pages/api/products/[username]/[slug].ts`
- To `apps/web/src/pages/api/users/[username]/products/[slug].ts`

#### 2. Frontend Component Updates

**ProductDetailPage.tsx**:

```typescript
// Before
const response = await fetch(`/api/products/${username}/${slug}`);

// After
const response = await fetch(`/api/users/${username}/products/${slug}`);
```

**ProductDetailModal.tsx**:

```typescript
// Before
const response = await fetch(`/api/products/${username}/${slug}`);

// After
const response = await fetch(`/api/users/${username}/products/${slug}`);
```

## Impact Assessment

### ✅ Positive Outcomes

- **No Breaking Changes**: Backend API Gateway routes remain unchanged
- **Clear Separation**: User-specific vs product-specific operations now clearly separated
- **Future-Proof**: Eliminates potential for similar conflicts
- **Better Organization**: More intuitive route hierarchy

### ✅ No Regressions

- All existing functionality maintained
- No changes to backend microservices required
- API Gateway routing unaffected
- Database schema unchanged

## Testing Results

### Development Server

- ✅ No routing conflicts on startup
- ✅ All services start successfully
- ✅ Frontend compiles without errors
- ✅ API calls work as expected

### Functionality Verification

- ✅ Product detail pages load correctly
- ✅ Reviews system fully functional
- ✅ User-specific product access works
- ✅ All existing features operational

## Best Practices Established

### Route Naming Convention

1. **Descriptive Paths**: Use clear, descriptive route segments
2. **Avoid Conflicts**: Never use different parameter names at the same level
3. **Logical Hierarchy**: Group related functionality under common paths
4. **Future Planning**: Consider potential conflicts when adding new routes

### Recommended Structure

```
/api/
├── [resource]/           # Primary resource routes
│   ├── index.ts         # CRUD operations
│   └── [id]/           # Specific resource operations
├── [entity]/            # Entity-specific operations
│   └── [entityId]/
│       └── [resource]/  # Nested resource operations
└── [action]/            # Action-specific routes
    └── [actionId].ts
```

## Documentation Updates

### Files Updated

- ✅ `docs/frontend/features.md` - Added API Route Architecture section
- ✅ `docs/api-gateway/README.md` - Added routing fix documentation
- ✅ `docs/global-architecture.md` - Added Frontend API Route Architecture
- ✅ `docs/routing-fix-june-2025.md` - This document

### Future Maintenance

- Monitor for similar conflicts when adding new routes
- Update documentation when route structure changes
- Consider automated testing for route conflicts
- Review route organization periodically

## Conclusion

The routing conflict has been successfully resolved with a clean, future-proof solution that:

- Eliminates immediate technical issues
- Improves code organization
- Maintains all existing functionality
- Provides a foundation for future development

The restructured API routes follow Next.js best practices and provide a clear, intuitive hierarchy for frontend API operations.

# API Routing Fix Documentation - June 2025

## Issue Description

During the implementation of the product reviews system, we encountered two main routing issues:

### 1. Next.js Dynamic Route Conflict ✅ RESOLVED

**Problem**: Dynamic routes `[slug]` and `[username]` were conflicting in Next.js API routes, causing the wrong handler to be called.

**Solution**: Restructured API routes by moving user-specific product routes to avoid conflicts:

- **Before**: `/api/products/[username]/[slug].ts`
- **After**: `/api/users/[username]/products/[slug].ts`

This ensures that `/api/products/` routes are reserved for product-specific operations, while user-specific routes are under `/api/users/`.

### 2. Product Service Controller Routing ✅ RESOLVED

**Problem**: The review controller in the product service was missing the `internal/` prefix, causing 404 errors when the API Gateway tried to forward requests.

**Root Cause**:

- API Gateway was forwarding requests to `/internal/reviews/product/:productId`
- Product service controller was defined with `@Controller('reviews')` instead of `@Controller('internal/reviews')`
- This caused a mismatch where the service expected `/reviews/...` but received `/internal/reviews/...`

**Solution**: Updated the ReviewController to include the proper internal prefix:

```typescript
// Before
@Controller('reviews')

// After
@Controller('internal/reviews')
```

## Impact

### API Route Changes

- **Products**: Resolved slug conflicts by separating user and product routes
- **Reviews**: Updated controller prefix to `internal/reviews`

### Product Service Endpoints

All product service endpoints now correctly use the `/internal/` prefix:

- `/internal/products/*` - Product management
- `/internal/reviews/*` - Review management
- `/internal/favorites/*` - Favorite management

This ensures consistency with other microservices like auth-service that use:

- `/auth/*` - Public endpoints
- `/internal/auth/*` - Internal endpoints

### Documentation Updates

- Frontend API Route Architecture documented
- Routing fix details added to API Gateway README
- Global architecture documentation updated

### Best Practices Established

- Clear route naming conventions
- Logical hierarchy for API routes
- Future planning to avoid conflicts

## Conclusion

The routing issues have been successfully resolved with changes that:

- Clarify API route structure
- Ensure correct request handling
- Maintain compatibility with existing services

The updates provide a more robust foundation for the product reviews system and align with Next.js best practices.
