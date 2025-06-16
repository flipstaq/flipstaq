# Frontend Components Documentation

This document describes key components used in the FlipStaq frontend.

## ProductDetailPage Component

### Overview

The `ProductDetailPage` component provides a full-page view for individual products accessed via direct URLs (`/@username/slug`). It offers a comprehensive, card-based layout optimized for product discovery and user engagement.

### Location

`apps/web/src/components/products/ProductDetailPage.tsx`

### Features

#### Layout & Design

- **Responsive Container**: Uses `max-w-4xl mx-auto` for optimal content width
- **Card-style Layout**: Clean design with rounded corners, padding, and shadow
- **Mobile Responsive**: Adapts layout for different screen sizes
- **Dark/Light Mode**: Full theme support with proper color schemes
- **RTL Support**: Right-to-left layout for Arabic language

#### Product Information Display

- **Product Title**: Prominent heading with proper typography hierarchy
- **Seller Information**: Display with avatar placeholder and username
- **Product Meta**: Organized grid showing:
  - Location (country or "Global")
  - Category (if available)
  - Date posted (localized formatting)
- **Price Display**: Highlighted in branded primary colors with currency formatting
- **Description**: Formatted text area with proper whitespace handling
- **Product Image**: Placeholder with icon when no image is available

#### Interactive Elements

- **Message Seller Button**: Primary CTA for user engagement (functionality placeholder)
- **Share Button**: Native share API with clipboard fallback
- **Copy URL Button**: Direct link copying functionality
- **Back Navigation**: Breadcrumb and header navigation

#### SEO & Meta Tags

- Dynamic page titles with product and seller information
- OpenGraph and Twitter Card meta tags
- Canonical URLs for proper indexing
- Structured product information

### Props Interface

```typescript
interface ProductDetailPageProps {
  username: string;
  slug: string;
  initialProduct?: ProductDetail | null;
}

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

### Loading States

The component includes sophisticated loading states:

- **Skeleton Loading**: Mimics the actual layout structure
- **Progressive Enhancement**: Shows content as it becomes available
- **Error Handling**: Graceful fallbacks for missing data

### Localization

All text elements are fully localized using the translation system:

- Uses `products.detail.*` namespace for component-specific text
- Supports date/time formatting per locale
- Currency formatting based on user language preference

### Usage Locations

- **Direct Product URLs**: `/@username/slug` routes
- **SSR Pages**: Server-side rendered for SEO optimization
- **Social Media Links**: Optimized for sharing on social platforms

### Styling Approach

- **Tailwind CSS**: Utility-first approach for consistent styling
- **Design System**: Uses defined color palette and spacing
- **Component Variants**: Responsive design patterns
- **Accessibility**: Proper contrast ratios and interactive states

### Future Enhancements

- **Image Gallery**: Support for multiple product images
- **Messaging Integration**: Direct messaging functionality
- **Review System**: Product ratings and reviews display
- **Related Products**: Suggestions based on category/seller

---

## Related Components

### ProductDetailModal

- Modal version for quick preview
- Shares logic with ProductDetailPage
- Used in product listings for overlay display

### ProductCard

- Grid/list item representation
- Links to ProductDetailPage via direct URLs
- Compact information display

### ProductsList

- Container for multiple ProductCard components
- Handles search and filtering
- Implements pagination
