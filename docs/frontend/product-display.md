# Product Display UI Components

## ProductDetailModal Component

### Overview

The `ProductDetailModal` is a responsive modal component that displays detailed product information when a user clicks on a product card. This provides an overlay experience without navigating to a new route, keeping users on the homepage.

### Features

- **Modal Overlay**: Full-screen modal with backdrop blur
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **RTL Support**: Full right-to-left layout support for Arabic
- **Dark/Light Theme**: Automatic theme adaptation
- **Loading States**: Shows spinner while fetching product data
- **Error Handling**: Displays error messages with retry capability
- **Keyboard Navigation**: ESC key closes modal
- **Click-outside**: Clicking backdrop closes modal

### Component Location

```
apps/web/src/components/products/ProductDetailModal.tsx
```

### Usage

```tsx
import { ProductDetailModal } from "@/components/products/ProductDetailModal";

<ProductDetailModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  username="johndoe"
  slug="awesome-product"
/>;
```

### Props

| Prop       | Type         | Required | Description                      |
| ---------- | ------------ | -------- | -------------------------------- |
| `isOpen`   | `boolean`    | Yes      | Controls modal visibility        |
| `onClose`  | `() => void` | Yes      | Callback when modal should close |
| `username` | `string`     | Yes      | Product owner's username         |
| `slug`     | `string`     | Yes      | Product slug identifier          |

### Data Fetching

The modal automatically fetches product details when opened using:

```
GET /api/v1/products/@{username}/{slug}
```

### Product Information Displayed

#### Main Details

- **Product Title**: Large, prominent heading
- **Price**: Formatted with currency (supports multiple currencies)
- **Posted By**: Username with @ symbol
- **Location**: Geographic location or "Global"
- **Category**: Product category (if available)
- **Date Posted**: Formatted creation date with time
- **Full URL**: Complete product URL for sharing

#### Description

- **Product Description**: Full text with line breaks preserved
- **Image Placeholder**: Square placeholder for future image upload feature

### Internationalization

All text is fully localized using the `useLanguage` hook:

#### English Translations (`packages/locales/en/products.json`)

```json
{
  "modal": {
    "close": "Close",
    "loading": "Loading product details...",
    "error": "Failed to load product details",
    "postedBy": "Posted by",
    "datePosted": "Date posted",
    "fullUrl": "Full URL",
    "urlWillBe": "URL will be"
  }
}
```

#### Arabic Translations (`packages/locales/ar/products.json`)

```json
{
  "modal": {
    "close": "إغلاق",
    "loading": "جاري تحميل تفاصيل المنتج...",
    "error": "فشل في تحميل تفاصيل المنتج",
    "postedBy": "منشور بواسطة",
    "datePosted": "تاريخ النشر",
    "fullUrl": "الرابط الكامل",
    "urlWillBe": "سيكون الرابط"
  }
}
```

### Styling Features

#### Responsive Layout

- **Desktop**: Two-column layout (image + details)
- **Mobile**: Single-column stacked layout
- **Grid System**: CSS Grid for flexible layouts

#### Theme Support

- **Light Mode**: Clean white background with subtle shadows
- **Dark Mode**: Dark secondary background with light text
- **Automatic Detection**: Uses system preference by default

#### RTL Support

- **Text Direction**: Full RTL text and layout support
- **Icon Positioning**: Icons flip appropriately for RTL
- **Spacing**: Margins and padding reverse for RTL languages

### Integration with ProductCard

The modal is triggered from `ProductCard` components via the `onProductClick` callback:

```tsx
// In ProductCard
const handleClick = () => {
  if (onProductClick) {
    onProductClick(product.username, product.slug);
  }
};

// In ProductsList
const handleProductClick = (username: string, slug: string) => {
  setSelectedProduct({ username, slug });
  setModalOpen(true);
};
```

### Error States

#### Loading State

- Animated spinner with loading text
- Centered in modal content area

#### Error State

- Red error box with descriptive message
- Retry capability by closing and reopening modal

#### No Data State

- Graceful handling of missing product data
- Clear error messaging

### Accessibility

- **Keyboard Navigation**: ESC key support
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Focus Management**: Traps focus within modal when open
- **Color Contrast**: Meets WCAG 2.1 AA standards

### Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 90+
- **Feature Detection**: Graceful degradation for older browsers

### Future Enhancements

1. **Image Support**: Product image display and upload
2. **Social Sharing**: Direct sharing buttons
3. **Related Products**: Suggested similar products
4. **User Actions**: Contact seller, add to favorites
5. **Animation**: Enhanced enter/exit animations
6. **Zoom**: Image zoom functionality

### Dependencies

- **React**: ^19.0.0
- **Lucide React**: ^0.469.0 (for icons)
- **Tailwind CSS**: ^3.4.3 (for styling)
- **TypeScript**: ^5.4.3 (for type safety)

### Performance Considerations

- **Lazy Loading**: Modal content loads only when opened
- **Memory Management**: Cleanup on component unmount
- **Network Optimization**: Caches product data during session
- **Bundle Size**: Minimal external dependencies
