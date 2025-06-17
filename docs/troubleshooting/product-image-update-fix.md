# Product Image Update Troubleshooting Guide

## Issue: "Multipart: Unexpected end of form" Error

### Overview

This document details the resolution of product image update issues that were causing "Unexpected end of form" errors when users attempted to update products with or without image changes.

### Problem Analysis

**Primary Issue**: The Next.js API route was sending malformed multipart data to the API Gateway's FileInterceptor, causing parsing failures.

**Root Causes**:

1. Empty FormData objects being sent to FileInterceptor endpoints
2. Node.js `fetch` + `form-data` package compatibility issues
3. Incorrect service port routing
4. Missing internal service authentication headers

### Solution: Dual Routing Architecture

#### Implementation Strategy

**With Image File**:

- Route: API Gateway (port 3100) with FileInterceptor
- Method: `axios.put()` with `form-data` package
- Content-Type: `multipart/form-data`

**Without Image File**:

- Route: Direct to Product Service (port 3004)
- Method: `fetch()` with JSON payload
- Content-Type: `application/json`

#### Code Changes

**File**: `/apps/web/src/pages/api/products/manage/[slug].ts`

**Key Modifications**:

1. Added conditional routing logic based on file presence
2. Switched from `fetch` to `axios` for multipart requests
3. Added proper internal service authentication headers
4. Implemented JWT token decoding for direct service calls

**Dependencies Added**:

- `axios` - Better multipart handling than Node.js fetch
- `form-data` - Already present, used for multipart streaming

### Testing Scenarios

#### ✅ Working Scenarios

1. **Product update with new image**

   - Uploads file via API Gateway
   - Processes image with FileInterceptor
   - Updates product data and image URL

2. **Product update without image change**

   - Sends JSON directly to Product Service
   - Bypasses FileInterceptor completely
   - Updates product data only

3. **Error handling**
   - Invalid JWT tokens → 401 Unauthorized
   - Missing files → 400 Bad Request
   - Service errors → Proper error propagation

#### 🔧 Technical Details

**Authentication Headers (Direct Service)**:

```javascript
{
  'Content-Type': 'application/json',
  'x-user-id': userId,
  'x-internal-service': 'true',
  'x-api-gateway': 'flipstaq-gateway'
}
```

**Multipart Headers (API Gateway)**:

```javascript
{
  'Authorization': `Bearer ${token}`,
  ...formData.getHeaders() // Automatic boundary handling
}
```

### Debugging Steps

If issues persist:

1. **Check Console Logs**:

   - Look for "📊 API Route:" prefixed messages
   - Verify file detection: `files: []` vs `files: ['image']`

2. **Verify Service Ports**:

   - API Gateway: `http://localhost:3100`
   - Product Service: `http://localhost:3004`

3. **Test Authentication**:

   - Ensure JWT tokens are valid
   - Check internal service headers for direct calls

4. **Monitor Network Traffic**:
   - API Gateway calls should show `multipart/form-data`
   - Direct service calls should show `application/json`

### Performance Impact

**Positive Impacts**:

- Reduced API Gateway load for text-only updates
- Faster response times for non-image updates
- More reliable file upload handling

**Trade-offs**:

- Increased complexity in routing logic
- Duplicate authentication handling
- Additional dependency on axios

### Future Improvements

**Potential Enhancements**:

1. Unified multipart handling in API Gateway
2. Background image processing
3. Image optimization and resizing
4. CDN integration for uploaded images

### Related Documentation

- [Frontend Features Documentation](./frontend/features.md) - Product Management section
- [API Gateway Documentation](./api-gateway/README.md) - Product routing details
- [Global Architecture](./global-architecture.md) - Dual routing pattern explanation

---

**Last Updated**: June 17, 2025  
**Status**: ✅ Resolved  
**Verification**: Tested with both image and text-only updates
