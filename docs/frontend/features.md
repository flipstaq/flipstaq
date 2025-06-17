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

## API Route Architecture

### Route Structure

The frontend API routes are organized to avoid conflicts and provide clear separation of concerns:

#### Product-Specific Routes

- `/api/products/index.ts` - Get all products, create new products
- `/api/products/my-products.ts` - Get current user's products
- `/api/products/[slug]/reviews.ts` - Get all reviews for a product by slug
- `/api/products/[slug]/user-review.ts` - Get current user's review for a product by slug

#### User-Specific Routes

- `/api/users/[username]/products/[slug].ts` - Get specific product by username and slug

#### Review Routes

- `/api/reviews/index.ts` - Create review, get user's reviews
- `/api/reviews/[reviewId].ts` - Update or delete specific review

#### Favorites Routes

- `/api/favorites/index.ts` - Get user favorites, add favorite
- `/api/favorites/[productId].ts` - Remove specific favorite

### Recent Route Restructuring

**Issue Fixed**: Resolved Next.js routing conflict where different dynamic parameter names (`slug` vs `username`) were used at the same route level.

**Previous Conflicting Structure**:

```
/api/products/
├── [slug]/          # ❌ Conflict
│   ├── reviews.ts
│   └── user-review.ts
└── [username]/      # ❌ Conflict with [slug]
    └── [slug].ts
```

**New Structure**:

```
/api/
├── products/
│   ├── index.ts
│   ├── my-products.ts
│   └── [slug]/
│       ├── reviews.ts
│       └── user-review.ts
├── users/
│   └── [username]/
│       └── products/
│           └── [slug].ts
└── reviews/
    ├── index.ts
    └── [reviewId].ts
```

**Migration**: Updated all frontend components to use the new route structure:

- `ProductDetailPage.tsx` now calls `/api/users/${username}/products/${slug}`
- `ProductDetailModal.tsx` now calls `/api/users/${username}/products/${slug}`

### Backend Integration

All frontend API routes proxy requests to the API Gateway (`localhost:3100`) which forwards them to appropriate microservices:

- **Products**: Forward to Product Service (`localhost:3004`)
- **Authentication**: Forward to Auth Service (`localhost:3001`)
- **Users**: Forward to User Service (`localhost:3003`)

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

## Reviews and Ratings System

### Overview

The reviews and ratings system allows authenticated users to leave feedback on products they have interacted with. This feature builds trust, increases credibility for sellers, and encourages higher quality listings.

### Components

#### StarRating (`/components/ui/StarRating.tsx`)

A reusable component for displaying and interacting with star ratings.

**Props:**

- `rating` (number): Current rating value
- `maxRating` (number, optional): Maximum rating value (default: 5)
- `size` ('sm' | 'md' | 'lg', optional): Star size (default: 'md')
- `interactive` (boolean, optional): Whether stars are clickable (default: false)
- `onRatingChange` (function, optional): Callback when rating is changed
- `showValue` (boolean, optional): Show numeric rating value (default: false)
- `className` (string, optional): Additional CSS classes

**Features:**

- Visual star representation with yellow fill
- Support for partial ratings (half stars)
- Interactive mode for rating input
- Hover effects in interactive mode
- Multiple sizes (sm, md, lg)
- Dark/light theme support
- Displays numeric value optionally

**Usage:**

```tsx
import { StarRating } from "@/components/ui/StarRating";

// Display only
<StarRating rating={4.5} showValue size="lg" />

// Interactive rating input
<StarRating
  rating={currentRating}
  interactive
  onRatingChange={setRating}
  size="lg"
/>
```

#### ReviewForm (`/components/reviews/ReviewForm.tsx`)

A form component for creating and editing product reviews.

**Props:**

- `productId` (string): The ID of the product being reviewed
- `existingReview` (Review, optional): Existing review data for editing
- `onSuccess` (function, optional): Callback on successful submission
- `onCancel` (function, optional): Callback when form is cancelled

**Features:**

- Interactive star rating input (1-5 stars)
- Text area for detailed comments
- Form validation (rating and comment required)
- Loading states during submission
- Success/error toast notifications
- Support for both creating and editing reviews
- Character count display (500 character limit)
- Multilingual support

**Usage:**

```tsx
import { ReviewForm } from "@/components/reviews/ReviewForm";

// New review
<ReviewForm
  productId="product-123"
  onSuccess={() => refetchReviews()}
/>

// Edit existing review
<ReviewForm
  productId="product-123"
  existingReview={userReview}
  onSuccess={() => handleUpdateSuccess()}
  onCancel={() => setEditMode(false)}
/>
```

#### ReviewList (`/components/reviews/ReviewList.tsx`)

A component that displays a list of reviews with summary statistics.

**Props:**

- `reviews` (Review[]): Array of review objects
- `averageRating` (number): Average rating for the product
- `totalReviews` (number): Total number of reviews
- `onReviewUpdate` (function, optional): Callback when reviews need to be refreshed

**Features:**

- Review summary with average rating and total count
- Individual review cards with user info, rating, and comments
- Edit/delete buttons for user's own reviews
- Date formatting and "edited" indicators
- Empty state for products with no reviews
- User avatar placeholders
- Responsive design

#### ReviewsSection (`/components/reviews/ReviewsSection.tsx`)

The main component that orchestrates the entire reviews experience for a product.

**Props:**

- `productId` (string): The ID of the product
- `productSlug` (string): The slug of the product for API calls
- `productOwnerId` (string): The ID of the product owner

**Features:**

- Complete reviews management for a product
- Integrates ReviewForm and ReviewList components
- Handles user authentication state
- Prevents product owners from reviewing their own products
- Manages review creation, editing, and deletion
- Loading states and error handling
- Automatic data refresh after actions

### Hooks

#### useReviews (`/hooks/useReviews.ts`)

Custom hook for managing review operations.

**Methods:**

- `createReview(reviewData)`: Create a new review
- `updateReview(reviewId, updateData)`: Update an existing review
- `deleteReview(reviewId)`: Delete a review
- `getUserReviews()`: Get all reviews by the current user

**State:**

- `loading`: Boolean indicating if an operation is in progress
- `error`: Error message if an operation fails

#### useProductReviews (`/hooks/useReviews.ts`)

Custom hook for fetching reviews for a specific product.

**Parameters:**

- `slug` (string): Product slug

**Returns:**

- `reviews`: Object containing reviews array, averageRating, and totalReviews
- `loading`: Loading state
- `error`: Error message
- `refetchReviews()`: Function to refresh the reviews data

#### useUserProductReview (`/hooks/useReviews.ts`)

Custom hook for managing the current user's review for a specific product.

**Parameters:**

- `slug` (string): Product slug

**Returns:**

- `userReview`: The user's review for the product (null if none)
- `loading`: Loading state
- `error`: Error message
- `refetchUserReview()`: Function to refresh the user's review

### Business Rules

- **One Review Per Product**: Each user can only submit one review per product
- **No Self-Review**: Product owners cannot review their own products
- **Authentication Required**: Only logged-in users can create reviews
- **Rating Range**: Ratings must be between 1 and 5 stars
- **Required Fields**: Both rating and comment are mandatory
- **Edit/Delete Permissions**: Users can only edit or delete their own reviews
- **Data Integrity**: Reviews are automatically deleted when products or users are deleted

### Localization

The reviews system is fully localized with support for English and Arabic:

**English Keys:**

- `reviews.leave_review`: "Leave a Review"
- `reviews.rating`: "Rating"
- `reviews.comment`: "Comment"
- `reviews.submit_review`: "Submit Review"
- `reviews.no_reviews_yet`: "No reviews yet"

**Arabic Keys:**

- `reviews.leave_review`: "اترك تقييماً"
- `reviews.rating`: "التقييم"
- `reviews.comment`: "التعليق"
- `reviews.submit_review`: "إرسال التقييم"
- `reviews.no_reviews_yet`: "لا توجد تقييمات بعد"

### Integration

The reviews system is integrated into the product detail page (`ProductDetailPage.tsx`) and automatically appears below the product information. It provides:

- Review summary statistics
- Interactive review form for eligible users
- Complete list of existing reviews
- User-friendly empty states
- Responsive design for all screen sizes

## Product Management

### Product Image Updates

#### Overview

The product management system supports updating products with new images through a multipart form data upload process. The system uses a dual-routing approach to handle both image and text-only updates efficiently.

#### Architecture

**Dual Routing Strategy:**

- **With Image**: Multipart FormData → API Gateway (port 3100) → Product Service
- **Without Image**: JSON → Product Service (port 3004) directly

#### Implementation Details

**API Route:** `/api/products/manage/[slug].ts`

**Dependencies:**

- `formidable` - Parse multipart form data
- `form-data` - Create Node.js multipart streams
- `axios` - HTTP client with better multipart support
- `fs` - File system operations

**Request Flow:**

1. **Parse Request**: Uses `formidable` to parse multipart form data
2. **Route Decision**: Checks if image file is present
3. **Image Present**:
   - Creates `FormData` using `form-data` package
   - Streams image file using `fs.createReadStream()`
   - Sends via `axios.put()` to API Gateway
   - API Gateway handles with `FileInterceptor`
4. **No Image**:
   - Extracts user ID from JWT token
   - Sends JSON directly to Product Service
   - Bypasses FileInterceptor complications

#### Fix History: "Unexpected end of form" Error (June 2025)

**Problem:** When updating products (especially without images), the API route was sending malformed multipart data to the API Gateway, causing "Multipart: Unexpected end of form" errors.

**Root Causes:**

1. Empty FormData objects being sent to FileInterceptor endpoints
2. Node.js `fetch` + `form-data` compatibility issues
3. Incorrect port routing (3003 vs 3004)
4. Missing internal service authentication headers

**Solutions Applied:**

1. **Dual Routing Architecture**

   - Separate paths for image vs. text-only updates
   - Conditional logic based on file presence

2. **HTTP Client Upgrade**

   - Switched from `fetch` to `axios` for multipart requests
   - Better `form-data` package compatibility

3. **Direct Service Access**

   - Text-only updates bypass API Gateway
   - Direct calls to Product Service (port 3004)
   - Proper internal service headers

4. **Authentication Handling**
   - JWT token decoding for user identification
   - Proper internal service headers:
     - `x-internal-service: 'true'`
     - `x-api-gateway: 'flipstaq-gateway'`
     - `x-user-id: <userId>`

#### API Endpoints

**Image Updates:**

- Route: API Gateway → `PUT /api/v1/products/:slug`
- Content-Type: `multipart/form-data`
- Client: `axios` with `form-data`

**Text-Only Updates:**

- Route: Product Service → `PUT /internal/products/:slug`
- Content-Type: `application/json`
- Client: `fetch`

#### Error Handling

- JWT decode failures → 401 Unauthorized
- Missing files → 400 Bad Request
- Service errors → Proxied status codes
- Authentication failures → 401/403 responses

#### Files Modified

- `/apps/web/src/pages/api/products/manage/[slug].ts`
- `/apps/web/package.json` (axios dependency)

#### Testing

The system supports:

- ✅ Product updates with new images
- ✅ Product updates without image changes
- ✅ Proper error handling and validation
- ✅ User authentication and authorization
- ✅ File type and size validation (5MB limit)

---
