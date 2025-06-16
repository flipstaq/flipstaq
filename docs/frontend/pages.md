# Frontend Pages Documentation

This document describes the main pages and routes in the Flipstaq frontend application.

## Page Structure

### Homepage (`/`)

- **Purpose**: Main landing page for both authenticated and non-authenticated users
- **Components**:
  - Hero section with search functionality
  - User statistics display
  - Product feed with real-time search
  - Call-to-action section
- **Features**:
  - Real-time debounced search
  - User count display
  - Responsive design with RTL support
  - Dark/light theme support
- **Authentication**: Not required

### Dashboard (`/dashboard`)

- **Purpose**: Dedicated seller dashboard for authenticated users to manage their products
- **Components**:
  - Tab navigation (My Products / Post Product)
  - MyProducts component for listing user's products
  - CreateProductForm for adding new products
  - Edit/Delete functionality for existing products
- **Features**:
  - Authentication required (redirects to login if not authenticated)
  - Tab-based navigation between manage and create views
  - Support for URL parameter `?create=true` to open create tab directly
  - Full RTL and theme support
- **Authentication**: Required
- **Layout**: Clean dashboard layout with header and main content area

### Product Detail (`/[username]/[slug]`)

- **Purpose**: Server-side rendered product detail page
- **Components**:
  - ProductDetailPage with full product information
  - Image banner, pricing, location, description
  - User contact information
- **Features**:
  - SSR for better SEO and sharing
  - Custom 404 handling for non-existent products
  - Responsive card layout
- **Authentication**: Not required

### Authentication Pages

- `/auth/login` - User login
- `/auth/signup` - User registration
- `/auth/forgot-password` - Password reset

### Error Pages

- `/404` - Custom 404 page with localized content
- `/_error` - Custom error handling page

## Navigation

### Header Navigation

The main header includes:

- Logo/Brand link to homepage
- Search functionality (on homepage)
- Theme toggle (light/dark)
- Language toggle (English/Arabic)
- User menu (when authenticated):
  - Post Product (links to dashboard)
  - Dashboard
  - My Profile
  - Logout

### User Menu

For authenticated users, the user dropdown includes:

1. **Post Product** - Redirects to `/dashboard`
2. **Dashboard** - Redirects to `/dashboard`
3. **My Profile** - Redirects to `/profile`
4. **Logout** - Logs out user

## Route Protection

### Protected Routes

- `/dashboard` - Requires authentication, redirects to `/auth/login` if not authenticated

### Public Routes

- `/` - Homepage
- `/[username]/[slug]` - Product detail pages
- `/auth/*` - Authentication pages
- `/404` - Error page

## URL Patterns

### Query Parameters

- `/dashboard?create=true` - Opens dashboard with create product tab active
- Search functionality uses client-side state, not URL parameters

### Dynamic Routes

- `/[username]/[slug]` - Product detail pages using username and product slug

## Responsive Design

All pages are designed with:

- Mobile-first responsive design
- RTL support for Arabic language
- Dark/light theme compatibility
- Tailwind CSS utility classes
- Consistent spacing and typography

## Performance Considerations

- Product detail pages use SSR for better initial load
- Homepage uses debounced search to reduce API calls
- Components are lazy-loaded where appropriate
- Images are optimized with proper sizing and lazy loading
