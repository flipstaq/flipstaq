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

## Dashboard Components

### DashboardStats Component

**Location**: `apps/web/src/components/dashboard/DashboardStats.tsx`

**Purpose**: Displays key statistics for the authenticated seller's product management dashboard.

#### Features

- **Real-time Stats**: Fetches live data from `/api/dashboard/stats`
- **Visual Cards**: Four stat cards with icons and colored backgrounds
- **Responsive Grid**: 1 column on mobile, 2-4 columns on larger screens
- **RTL Support**: Proper layout for Arabic language
- **Dark Mode**: Full support for light/dark themes
- **Loading States**: Skeleton loading animation while fetching data
- **Error Handling**: Graceful error display with retry functionality

#### Stats Displayed

1. **Total Products**: Count of active products posted by the user
2. **Total Views**: Aggregated views across all user's products (currently simulated)
3. **Deleted Products**: Count of products that have been soft-deleted
4. **Last Product**: Name and creation date of most recently posted product

#### Data Flow

```typescript
interface DashboardStatsData {
  totalProducts: number;
  totalViews: number;
  deletedProducts: number;
  lastProduct: {
    name: string;
    createdAt: string;
  } | null;
}
```

#### Integration

- Used in `/pages/dashboard.tsx` on the "My Products" tab
- Positioned above the product grid for contextual information
- Automatically refreshes when component mounts

#### Localization

All labels are localized using keys from `dashboard.json`:

- `dashboard:product_stats` - Section title
- `dashboard:total_products` - Total products label
- `dashboard:total_views` - Total views label
- `dashboard:deleted_products` - Deleted products label
- `dashboard:last_product` - Last product label
- `dashboard:no_products_yet` - Empty state message

#### Styling

- Uses Tailwind CSS for responsive design
- Color-coded icons (blue, green, red, purple) for different stat types
- Consistent card design with shadows and rounded corners
- Smooth animations for loading states

## Chat Components

### Overview

The chat system provides real-time messaging functionality integrated into the main application interface. It consists of several components that work together to create a seamless messaging experience.

### Location

`apps/web/src/components/chat/`

### Components

#### ChatDrawer

**File**: `ChatDrawer.tsx`

The main chat interface component that renders as a slide-in drawer from the right side of the screen (left side for RTL languages).

**Features**:

- **Responsive Design**: Full-screen modal on mobile, fixed-width drawer on desktop
- **Conversation/Message View**: Toggle between conversation list and individual chat
- **Real-time Updates**: Integrates with WebSocket for live messaging
- **Minimize/Maximize**: Drawer can be minimized to save screen space
- **RTL Support**: Properly positioned for Arabic language

**Props**:

```typescript
interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}
```

#### ConversationList

**File**: `ConversationList.tsx`

Displays a list of recent conversations with preview information.

**Features**:

- **User Avatars**: Shows profile pictures or default user icons
- **Online Status**: Real-time online/offline indicators
- **Unread Badges**: Shows count of unread messages
- **Message Preview**: Displays last message content (truncated)
- **Timestamp**: Shows relative time of last message
- **Empty State**: Friendly message when no conversations exist

#### MessageList

**File**: `MessageList.tsx`

Renders the chat messages in a conversation with proper formatting, status indicators, and file attachment display.

**Features**:

- **Message Bubbles**: Different styling for sent/received messages
- **Status Indicators**: Shows sent/delivered/read status for outgoing messages
- **Date Separators**: Groups messages by date
- **Auto-scroll**: Automatically scrolls to newest messages
- **Loading States**: Shows spinner while loading message history
- **File Attachment Display**:
  - **Image Attachments**:
    - Inline image preview with click to download
    - Hover overlay with external link icon
    - Responsive sizing (max 256px height)
    - Lazy loading for performance
  - **Document Attachments**:
    - File card with icon, name, and size
    - Click to download functionality
    - Appropriate icons for different file types
    - File size formatting (bytes, KB, MB)
  - **Mixed Content**: Support for messages with both text and files
  - **File-only Messages**: Messages containing only file attachments
- **File Download**:
  - Direct download links for all file types
  - Proper file naming preservation
  - Opens in new tab for images and PDFs

**Message Interface with File Support**:

```typescript
interface Message {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  createdAt: Date;
  isRead: boolean;
  status: "sent" | "delivered" | "read";
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}
```

#### MessageInput

**File**: `MessageInput.tsx`

Provides the input interface for composing and sending messages with support for text and file attachments.

**Features**:

- **Auto-resize Textarea**: Expands/contracts based on content
- **Send Button**: Enabled when message has content OR file is selected
- **Keyboard Shortcuts**: Enter to send, Shift+Enter for new line
- **File Attachment Support**:
  - **Upload Button**: Paperclip icon to select files
  - **File Preview**: Shows selected file with icon and size
  - **File Types**: Images (jpg, jpeg, png, webp), PDFs, text files, documents
  - **Size Limit**: 10MB maximum file size
  - **Image Preview**: Thumbnail preview for selected images
  - **Remove Option**: X button to remove selected file
  - **Upload Progress**: Loading spinner during file upload
  - **Error Handling**: Shows error messages for invalid files
- **Emoji Support**: Emoji picker with multiple categories
  - **Categories**: Smileys, People, Nature, Food, Travel, Objects
  - **Search**: Click-to-insert emoji functionality
  - **Positioning**: Smart positioning to avoid screen edges
- **Upload Workflow**:
  1. User selects file via attachment button
  2. File is validated (type and size)
  3. File preview is shown
  4. When send is clicked, file is uploaded first
  5. Message is sent with file metadata
  6. Input is reset after successful send

**File Attachment Interface**:

```typescript
interface MessageInputProps {
  onSend: (
    message: string,
    fileData?: {
      fileUrl: string;
      fileName: string;
      fileType: string;
      fileSize: number;
    }
  ) => void;
  disabled?: boolean;
}
```

#### NewChatModal

**File**: `NewChatModal.tsx`

Modal interface for starting new conversations with other users.

**Features**:

- **User Search**: Real-time search functionality
- **User Status**: Shows online/offline status in search results
- **Auto-focus**: Search input is focused when modal opens
- **Empty States**: Handles no results and no users scenarios

### Integration

#### Header Integration

The messaging system is integrated into the `Header` component with:

- **Messages Button**: Located in the user menu area (desktop) and mobile menu
- **Unread Indicator**: Red badge showing unread message count
- **Responsive Positioning**: Adapts to screen size and language direction

#### WebSocket Connection

The chat components are designed to work with:

- **Real-time Messages**: Live message delivery and status updates
- **Online Presence**: User online/offline status
- **Typing Indicators**: Show when users are typing (future feature)

#### API Integration

The components integrate with the following API endpoints via the API Gateway:

- `GET /conversations` - Fetch user's conversations
- `GET /conversations/:id/messages` - Get messages for a conversation
- `POST /messages` - Send a new message (with optional file attachments)
- `POST /conversations` - Start a new conversation
- `POST /upload` - Upload files for messaging

### Localization

All chat components support full internationalization:

- **English**: `packages/locales/en/chat.json`
- **Arabic**: `packages/locales/ar/chat.json`

Supported translation keys include:

- **Basic actions**: `send`, `close`, `minimize`, `expand`, `typing`, etc.
- **File attachment actions**:
  - `attach_file` - "Attach file" button tooltip
  - `file_selected` - "File selected" status message
  - `remove_file` - "Remove file" button tooltip
  - `uploading_file` - "Uploading file..." progress indicator
  - `file_upload_failed` - "File upload failed" error message
  - `file_too_large` - "File too large (max 10MB)" validation error
  - `file_type_not_supported` - "File type not supported" validation error
  - `download_file` - "Download file" button tooltip
  - `view_image` - "View image" button tooltip
  - `image` - "Image" file type label
  - `document` - "Document" file type label
  - `file_size` - "Size" file size label
  - `file_name` - "File" generic file label
- **Emoji picker**: `choose_emoji`, `add_emoji`
- **Status messages**: `online`, `offline`, `last_seen`
- **Conversation management**: `new_chat`, `back_to_conversations`, `select_conversation`
- Status messages (online, offline, typing)
- Empty states and error messages
- User interface labels

### Styling

The chat components follow the application's design system:

- **Theme Support**: Full dark/light mode compatibility
- **Tailwind CSS**: Uses utility classes for consistent styling
- **RTL Support**: Proper layout for Arabic text direction
- **Responsive**: Mobile-first design approach

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
