# Frontend Routing Documentation

## Overview

The Flipstaq frontend uses Next.js pages directory routing with custom dynamic routes to handle various URL patterns.

## Product URL Routing

### Direct Product Access

Products can be accessed directly via URLs in the format:

```
/@username/slug
```

**Examples:**

- `/@john/custom-shoes`
- `/@store123/amazing-product`
- `/@yourscemal/aaaa`

### Implementation

#### File Structure

```
pages/
└── [...params].tsx    # Handles /@username/slug pattern
```

#### Route Matching

The `[...params].tsx` file captures all dynamic segments after the domain and processes them as follows:

1. **URL Pattern**: `/@username/slug`
2. **Parsing Logic**:
   - Expects exactly 2 segments: `['@username', 'slug']`
   - Username must start with `@` symbol
   - Extracts username by removing the `@` prefix

#### Server-Side Rendering

The route uses `getServerSideProps` to:

1. **Parse URL Parameters**:

   ```typescript
   const [usernameParam, slug] = params.params;
   const username = usernameParam.slice(1); // Remove @ prefix
   ```

2. **Fetch Product Data**:

   ```typescript
   const response = await fetch(
     `${API_GATEWAY_URL}/api/v1/products/@${username}/${slug}`
   );
   ```

3. **Handle Errors**:
   - Returns `notFound: true` for invalid URLs
   - Returns `notFound: true` for non-existent products
   - Triggers Next.js 404 page automatically

#### Product Detail Page Component

**File**: `components/products/ProductDetailPage.tsx`

**Features**:

- **SEO Optimized**: Dynamic meta tags for title, description, and Open Graph
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Theme Support**: Light/dark mode compatibility
- **RTL Support**: Proper layout for Arabic language
- **Social Sharing**: Native Web Share API with clipboard fallback
- **Error Handling**: Graceful fallbacks for loading and error states

**Component Structure**:

```tsx
<ProductDetailPage
  username={string}
  slug={string}
  initialProduct={ProductDetail | null}
/>
```

## Dual Mode Operation

The application supports two ways to view products:

### 1. Modal View (Homepage)

- **Trigger**: Clicking product from homepage grid
- **Behavior**: Opens overlay modal
- **URL**: Remains on homepage (`/`)
- **Component**: `ProductDetailModal.tsx`

### 2. Full Page View (Direct URL)

- **Trigger**: Direct URL access or sharing
- **Behavior**: Renders full page
- **URL**: `/@username/slug`
- **Component**: `ProductDetailPage.tsx`

## Error Handling

### 404 Scenarios

- Invalid URL format (not exactly 2 segments)
- Username not starting with `@`
- Product not found in database
- API errors (server unreachable)

### Custom Error Pages

- **404 Page**: `pages/404.tsx` - Handles all 404 scenarios
- **Error Page**: `pages/_error.tsx` - Handles server/client errors
- **Error Boundary**: `components/common/ErrorBoundary.tsx` - React error catching

## API Integration

### Endpoint

```
GET /api/v1/products/@{username}/{slug}
```

### Response Format

```typescript
interface ProductDetail {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  location: string;
  category: string | null;
  slug: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}
```

### Error Responses

- `404`: Product not found
- `400`: Invalid parameters
- `500`: Server error

## SEO Features

### Meta Tags

- **Title**: `{product.title} by @{username} - FlipStaq`
- **Description**: Product description or fallback
- **Open Graph**: Title, description, URL, type
- **Twitter Cards**: Summary card with product info

### URL Structure

Clean, readable URLs that are:

- **SEO Friendly**: `/@username/slug` format
- **Shareable**: Direct links to products
- **Memorable**: Username-based organization

## Localization

### Supported Languages

- **English**: Default language
- **Arabic**: RTL support with proper text direction

### Translation Keys

Uses the `errors` and `products` namespaces:

- `errors.go_home`: Navigation text
- `products.backToProducts`: Breadcrumb text
- `products.description`: Section headers
- `products.modal.*`: Various UI elements

## Performance Considerations

### Server-Side Rendering

- Pre-fetches product data on server
- Reduces client-side loading time
- Improves SEO and social sharing

### Fallback Handling

- Client-side refetch if SSR fails
- Loading states for better UX
- Error boundaries prevent crashes

## Development Notes

### Testing Direct URLs

1. Start development server: `npm run dev`
2. Navigate to: `http://localhost:3000/@yourscemal/aaaa`
3. Should render product page (not 404)

### Adding New Product Routes

No additional configuration needed - the dynamic route automatically handles all `/@username/slug` patterns.

### Debugging

- Check server console for API fetch errors
- Verify API gateway is running on correct port
- Ensure product exists in database with correct username/slug
