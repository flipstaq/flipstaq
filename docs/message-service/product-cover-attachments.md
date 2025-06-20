# Product Cover Attachments in Chat System

## Overview

The chat system now supports sending product covers as rich attachments when messaging from a product detail page. This allows users to easily share product information within conversations.

## Features

### 1. Product Cover Attachments

- **Type**: Special attachment type `application/product-cover`
- **Metadata**: Contains product information (title, price, image, seller, etc.)
- **Rendering**: Displays as a rich card with product details in chat

### 2. Implementation

#### Frontend Components

- **InlineMessageComposer**: Updated to send product cover data as attachment metadata
- **ProductCoverAttachment**: New component for rendering product covers in chat
- **MessageList**: Updated to handle and display product cover attachments

#### Backend Support

- **Message Service**: Updated to store metadata in `MessageAttachment` model
- **API Gateway**: Updated to accept and forward metadata in attachment objects
- **Database**: Added `metadata` JSON field to `message_attachments` table

### 3. Product Cover Data Structure

```json
{
  "fileUrl": "",
  "fileName": "product-cover-{productId}",
  "fileType": "application/product-cover",
  "fileSize": 0,
  "metadata": {
    "type": "product-cover",
    "productId": "clx1y2z3a4b5c6d7e8f9g0h1",
    "title": "iPhone 15 Pro Max",
    "price": 1200,
    "currency": "USD",
    "imageUrl": "/uploads/products/iphone-15.jpg",
    "username": "seller123",
    "location": "New York",
    "slug": "iphone-15-pro-max"
  }
}
```

### 4. UI Components

#### ProductCoverAttachment

- Displays product image, title, price, seller, and location
- Includes "View Product" button that opens product detail page
- Responsive design with dark/light mode support
- RTL language support

#### InlineMessageComposer

- Automatically includes product cover when messaging from product page
- No duplicate success messages (fixed)
- Maintains existing file attachment functionality

### 5. Localization

Added new translation keys:

- `product_shared`: "Product Shared"
- `untitled_product`: "Untitled Product"
- `view_product`: "View Product"

Available in English and Arabic.

### 6. Database Schema

```sql
-- MessageAttachment model with metadata support
model MessageAttachment {
  id        String   @id @default(cuid())
  messageId String
  fileUrl   String
  fileName  String
  fileType  String
  fileSize  Int
  metadata  Json?    -- Store product cover and other metadata as JSON
  createdAt DateTime @default(now())

  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
}
```

## Usage

1. User visits a product detail page
2. Clicks "Message Seller" button
3. Inline composer appears with product context
4. When user sends message, product cover is automatically attached
5. Recipient sees product cover as rich attachment in chat
6. Recipient can click "View Product" to go to product page

## Benefits

- **Enhanced UX**: Rich product previews in chat
- **Context Preservation**: Product information travels with messages
- **Easy Navigation**: Direct links back to product pages
- **Professional Appearance**: Branded product cards in conversations
