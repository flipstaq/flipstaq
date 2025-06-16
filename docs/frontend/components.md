# Frontend Components Documentation

This document describes key components used in the FlipStaq frontend.

## Header Component

### Overview

The `Header` component provides navigation, authentication, and user profile management functionality. It includes a dropdown menu system for authenticated users to access various features including product posting.

### Location

`apps/web/src/components/layout/Header.tsx`

### Features

#### User Profile Dropdown Menu

When authenticated users click their name in the header, a dropdown menu appears with the following options:

- **Post Product**: Navigates to the homepage product posting section (`/#post-product`)
- **My Profile**: Links to user profile page (`/profile`)
- **Logout**: Securely logs out the user

#### Responsive Design

- **Desktop**: Full dropdown menu with hover effects
- **Mobile**: Expanded mobile menu with stacked buttons
- **RTL Support**: Proper positioning for Arabic language (right-to-left)

#### Accessibility Features

- Click-outside detection to close dropdown
- Keyboard navigation support
- Proper ARIA labels and semantic HTML
- Focus management for better UX

## HomePage Component

### Overview

The `HomePage` component serves as the main landing page and includes an integrated product posting feature for authenticated users.

### Location

`apps/web/src/components/pages/HomePage.tsx`

### Features

#### Post Product Section

For authenticated users, the homepage includes a dedicated section for posting products:

- **Conditional Display**: Only visible to logged-in users
- **Smooth Scrolling**: Header menu links scroll smoothly to this section
- **Integrated Form**: Uses the `CreateProductForm` component
- **Toggle Functionality**: Show/hide form to reduce visual clutter
- **Proper Spacing**: Dedicated background section with clear visual separation

#### Deep Linking

The post product section can be accessed via:

- Header dropdown menu (`Post Product` option)
- Direct anchor link (`/#post-product`)
- Smooth scrolling behavior for better UX

## ProductDetailPage Component

### Overview

The `ProductDetailPage` component provides a full-page view for individual products accessed via direct URLs (`/@username/slug`). It features a large banner image display for enhanced visual appeal.

### Location

`apps/web/src/components/products/ProductDetailPage.tsx`

### Features

#### Banner Image Display

- **Large Banner**: Hero-style image display at the top (`max-h-[400px]`)
- **Full Width**: Spans the entire card width for maximum visual impact
- **Object Cover**: Maintains image quality and aspect ratio
- **Rounded Corners**: Consistent with card design (`rounded-t-lg`)
- **Fallback UI**: Professional placeholder layout when no image exists

#### Enhanced Fallback Design

- **Prominent Icon**: Large image icon (`h-20 w-20`) for clear indication
- **Descriptive Messages**: Clear primary and secondary text
- **Minimum Height**: Ensures consistent layout (`min-h-[300px]`)
- **Centered Layout**: Professional appearance even without images
- **Theme Integration**: Proper dark/light mode support

#### Design Considerations

- **Visual Hierarchy**: Image banner draws immediate attention
- **Content Flow**: Natural progression from image to details
- **Responsive Design**: Adapts gracefully across device sizes
- **Performance**: Optimized image loading and display

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

### CreateProductForm

- Modal form for creating new products
- Supports image upload with preview functionality
- Image validation (type, size) on frontend
- Uses multipart/form-data for submission
- Localized upload interface with drag & drop area
- Real-time image preview with file management

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
