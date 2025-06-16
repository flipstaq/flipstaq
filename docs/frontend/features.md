# Frontend Features Documentation

## Favorites System

### Overview

The favorites system allows authenticated users to save products they're interested in for later viewing. This feature enhances user engagement and provides a personalized shopping experience.

### Components

#### FavoriteButton (`/components/products/FavoriteButton.tsx`)

A reusable component that provides a heart icon button for favoriting/unfavoriting products.

**Props:**

- `productId` (string): The ID of the product to favorite
- `className` (string, optional): Additional CSS classes
- `showTooltip` (boolean, optional): Whether to show tooltip on hover (default: true)
- `size` ('sm' | 'md' | 'lg', optional): Button size (default: 'md')

**Features:**

- Heart icon that fills when favorited
- Hover animations and visual feedback
- Loading states during API calls
- Toast notifications for success/error states
- Responsive to theme (light/dark mode)
- RTL language support
- Only visible to authenticated users
- Users can favorite their own products

**Usage:**

```tsx
import { FavoriteButton } from "@/components/products/FavoriteButton";

<FavoriteButton
  productId="product-id-123"
  size="md"
  className="custom-class"
/>;
```

### Pages

#### Favorites Page (`/pages/favorites.tsx`)

A dedicated page displaying all of the user's saved products.

**Route:** `/favorites`

**Features:**

- Grid layout of saved products using ProductCard component
- Empty state with call-to-action
- Authentication protection (redirects to login if not authenticated)
- Loading states
- Responsive design
- RTL and dark mode support

**Access:**

- Available through user dropdown menu in header
- Requires authentication

### Hooks

#### useFavorites (`/hooks/useFavorites.ts`)

A custom React hook for managing favorite operations.

**Returns:**

- `favorites`: Array of favorite products with full product details
- `favoritesCount`: Number of favorited products
- `isLoading`: Loading state for favorites operations
- `addToFavorites(productId)`: Function to add a product to favorites
- `removeFromFavorites(productId)`: Function to remove a product from favorites
- `isProductFavorited(productId)`: Function to check if a product is favorited
- `refetchFavorites()`: Function to refresh the favorites list

**Usage:**

```tsx
import { useFavorites } from "@/hooks/useFavorites";

const { favorites, addToFavorites, removeFromFavorites } = useFavorites();
```

### API Integration

#### Frontend API Routes

- `POST /api/favorites` - Add product to favorites
- `DELETE /api/favorites/[productId]` - Remove product from favorites
- `GET /api/favorites` - Get user's favorites
- `GET /api/favorites?count=true` - Get favorites count
- `GET /api/favorites/[productId]` - Check if product is favorited

#### Backend Integration

All frontend API routes proxy to the API Gateway which forwards to the Product Service:

- `POST /api/v1/products/favorites`
- `DELETE /api/v1/products/favorites/:productId`
- `GET /api/v1/products/favorites`
- `GET /api/v1/products/favorites/count`
- `GET /api/v1/products/favorites/check/:productId`

### User Experience

#### Navigation

- Favorites link in user dropdown menu (Header component)
- Heart icon in ProductCard components
- Direct access via `/favorites` URL

#### Visual Feedback

- Filled heart for favorited products
- Empty heart for non-favorited products
- Hover animations and transitions
- Loading states during API operations

#### Responsive Design

- Mobile-friendly layouts
- Touch-friendly button sizes
- Proper spacing in grid layouts

#### Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly tooltips
- High contrast in dark mode

### Business Rules

1. **Authentication Required**: Only logged-in users can favorite products
2. **Self-Restriction**: Users cannot favorite their own products
3. **Active Products Only**: Only active products can be favorited
4. **Unique Favorites**: Each user can favorite a product only once
5. **Automatic Cleanup**: Favorites are removed when products are deleted
6. **Immediate Updates**: UI updates immediately on favorite/unfavorite actions

### Localization

#### English Translations (`packages/locales/en/common.json`)

```json
{
  "save": "Save",
  "unsave": "Unsave",
  "saved": "Saved",
  "favorites": "Favorites",
  "savedProducts": "Saved Products",
  "noSavedProducts": "You haven't saved any products yet.",
  "saveForLater": "Save for later",
  "removeFromSaved": "Remove from saved"
}
```

#### Arabic Translations (`packages/locales/ar/common.json`)

```json
{
  "save": "حفظ",
  "unsave": "إلغاء الحفظ",
  "saved": "محفوظ",
  "favorites": "المفضلة",
  "savedProducts": "المنتجات المحفوظة",
  "noSavedProducts": "لم تقم بحفظ أي منتجات بعد.",
  "saveForLater": "حفظ لاحقاً",
  "removeFromSaved": "إزالة من المحفوظات"
}
```

### Error Handling

- Network errors are caught and logged
- Failed operations show user-friendly feedback
- Automatic retry on authentication token refresh
- Graceful degradation when services are unavailable

### Performance Considerations

- Lazy loading of favorites data
- Optimistic UI updates for immediate feedback
- Debounced API calls to prevent spam
- Efficient re-rendering with proper React hooks

## Toast Notifications

The application includes a comprehensive toast notification system for user feedback.

### ToastProvider

Located in `apps/web/src/components/providers/ToastProvider.tsx`, this component provides a global toast notification system.

**Features:**

- Multiple toast types: success, error, warning, info
- Auto-dismiss with configurable duration
- Manual dismiss with close button
- Dark/light theme support
- RTL language support
- Animated slide-in from right
- Stacked positioning in top-right corner

**Usage:**

```typescript
import { useToast } from "@/components/providers/ToastProvider";

function MyComponent() {
  const { success, error, warning, info } = useToast();

  const handleAction = () => {
    success("Operation completed!");
    error("Something went wrong");
    warning("Please check your input");
    info("Here's some information");
  };
}
```

**Toast Properties:**

- `type`: 'success' | 'error' | 'warning' | 'info'
- `title`: Main message text
- `message`: Optional additional details
- `duration`: Auto-dismiss time in ms (default: 5000)
