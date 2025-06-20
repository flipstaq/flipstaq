# Message Service

## Recent Updates (June 2025)

✅ **Pure WebSocket Implementation**: Migrated from socket.io to custom WebSocket server

- **Pure WebSocket**: Using `ws` library without NestJS WebSocket decorators
- **Dedicated Port**: WebSocket server runs on port 8001 (separate from HTTP)
- **Zero HTTP Polling**: Eliminated all 3-second polling intervals
- **Custom Room Management**: In-memory room management for conversations and users
- **Heartbeat Detection**: 30-second ping/pong for connection health monitoring
- **JWT Authentication**: Token-based authentication via query parameters
- **Redis Integration**: Cross-service messaging via Redis pub/sub

✅ **100% Real-time Messaging**: Complete WebSocket-driven messaging system

- **Instant Message Delivery**: Messages sent/received via WebSocket events
- **Real-time Read Status**: Read confirmations via WebSocket (no HTTP)
- **Live User Status**: Online/offline status updates in real-time
- **Room Management**: Join/leave conversation rooms automatically
- **Typing Indicators**: Real-time typing status with user display names, positioned below message input (8-second timeout with keep-alive)
- **Connection Recovery**: Auto-reconnection with exponential backoff

✅ **Performance Optimizations**: Eliminated HTTP polling overhead

- **WebSocket Events**: All real-time operations use WebSocket
- **HTTP for Initial Load**: Conversations/messages loaded once via HTTP
- **Reduced Server Load**: No more constant polling requests
- **Battery Efficient**: Minimal network usage on mobile devices
- **Scalable Architecture**: Ready for multi-server deployments

### WebSocket Architecture

#### Backend (Port 8001)

- **File**: `services/message-service/src/gateway/messaging.gateway.ts`
- **Implementation**: Pure `ws` library without NestJS decorators
- **Events**: sendMessage, markAsRead, joinConversation, userOnline, etc.
- **Authentication**: JWT validation on WebSocket connection
- **Room Management**: Custom user and conversation room tracking

#### Frontend Integration

- **Service**: `apps/web/src/lib/webSocketService.ts`
- **Context**: `apps/web/src/contexts/WebSocketContext.tsx`
- **URL**: `ws://localhost:8001/ws?token=${authToken}`
- **Auto-connection**: Connects on login, reconnects on network issues

### API Integration

- **WebSocket Events**: Real-time messaging, status updates, typing indicators
- **HTTP Endpoints**: Initial data loading, file uploads, user search
- **Public Search**: `/api/v1/public/users/search` for user discovery
- **Protected Messaging**: `/api/v1/messages/*` with authentication required
- **No Polling**: Removed all HTTP polling for real-time updates

## Overview

The Message Service is a NestJS-based microservice responsible for direct messaging functionality within the Flipstaq eCommerce platform. It provides **pure WebSocket-based real-time messaging** capabilities between users, allowing them to communicate about products, transactions, and general inquiries without any HTTP polling overhead.

## Purpose

- **Direct Messaging**: One-on-one conversations between users
- **Real-time Communication**: Custom WebSocket implementation for instant messaging
- **Conversation Management**: Create and manage conversation threads
- **Message History**: Persistent storage and retrieval of messages
- **Read Status Tracking**: Mark messages as read/unread
- **Public User Search**: Allow users to search for others to start conversations
- **Secure Messaging**: Authentication required for sending/receiving messages

## Architecture

- **Framework**: NestJS 11.1.3
- **WebSocket**: Custom implementation using `ws` library (NOT socket.io)
- **Database**: PostgreSQL with Prisma ORM 6.9.0
- **Authentication**: JWT-based with role-based access control
- **Public Endpoints**: User search available without authentication
- **Private Endpoints**: Message operations require authentication
- **API Gateway Integration**: Proper routing through central gateway
- **Redis**: Cross-service messaging and caching

## Key Features

### Public Features (No Authentication Required)

- **User Search**: Find users by username, email, or name for messaging

### Private Features (Authentication Required)

- **Start Conversation**: Create new conversation with any user
- **List Conversations**: Get all conversations for authenticated user
- **Message History**: Paginated message retrieval
- **Read Status**: Individual and bulk message read tracking
- **Real-time Updates**: WebSocket integration for live messaging

### Security Implementation

- **Public Search**: `/api/v1/public/users/search` - No authentication required
- **Private Messaging**: All `/api/v1/messages/*` endpoints require JWT token
- **Role-based Access**: Admin search endpoints restricted to OWNER/STAFF roles
- **User Verification**: Participant validation for all message operations

### Data Management

- **Conversation Persistence**: PostgreSQL storage via shared Prisma schema
- **Message Threading**: Chronological message organization
- **User Relationships**: Automatic participant management
- **Search Optimization**: Efficient user discovery with result limits

## Technology Stack

- **Runtime**: Node.js
- **Framework**: NestJS 11.1.3
- **Database**: PostgreSQL
- **ORM**: Prisma 6.9.0 (shared schema from `packages/db`)
- **Language**: TypeScript
- **Authentication**: JWT tokens via API Gateway

## API Endpoints

All endpoints are internal-only and accessed through the API Gateway:

### Public API (via Gateway)

- `POST /api/v1/messages/conversations` - Start conversation
- `GET /api/v1/messages/conversations` - List conversations
- `GET /api/v1/messages/conversations/:id/messages` - Get messages
- `POST /api/v1/messages/upload` - Upload file attachments (includes GIF support)
- `GET /api/v1/gifs/search` - Search GIFs via Tenor API (public access)
- `GET /api/v1/gifs/trending` - Get trending GIFs (public access)
- `GET /api/v1/gifs/categories` - Get GIF categories (public access)
- `GET /api/v1/public/users/search` - Search users (public)

### Internal API

- `POST /internal/messages/conversations`
- `GET /internal/messages/conversations`
- `GET /internal/messages/conversations/:id/messages`
- `POST /internal/messages/upload`
- `GET /internal/messages/users/search`

### WebSocket Events (Port 8001)

#### Client → Server Events

- `sendMessage` - Send new message
- `markAsRead` - Mark message as read
- `joinConversation` - Join conversation room
- `leaveConversation` - Leave conversation room
- `typing` - Send typing indicator
- `ping` - Keep connection alive

#### Server → Client Events

- `newMessage` - New message received
- `messageReadStatusChanged` - Read status update
- `userOnline` - User came online
- `userOffline` - User went offline
- `userTyping` - User typing indicator
- `pong` - Heartbeat response

## WebSocket Architecture

### Connection URL

```
ws://localhost:8001/ws?token=${authToken}
```

### Authentication

- JWT token passed as query parameter
- Token validated on connection establishment
- Connection rejected if token invalid/missing

### Room Management

- Users automatically join personal rooms (`user_${userId}`)
- Conversation rooms (`conversation_${conversationId}`) for message delivery
- Automatic cleanup when users disconnect

### Heartbeat System

- Server sends ping every 30 seconds
- Client responds with pong to maintain connection
- Broken connections automatically cleaned up

## Database Models

### Conversation Model

```prisma
model Conversation {
  id           String   @id @default(cuid())
  participants User[]   @relation("ConversationParticipants")
  messages     Message[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### Message Model

```prisma
model Message {
  id             String       @id @default(cuid())
  content        String?      // Optional for attachment-only messages
  senderId       String
  conversationId String
  attachments    MessageAttachment[]
  read           Boolean      @default(false)
  createdAt      DateTime     @default(now())

  sender         User         @relation(fields: [senderId], references: [id])
  conversation   Conversation @relation(fields: [conversationId], references: [id])
}
```

### Message Attachment Model

```prisma
model MessageAttachment {
  id        String   @id @default(cuid())
  messageId String
  fileUrl   String
  fileName  String
  fileType  String
  fileSize  Int
  metadata  Json?    // For product covers and special attachments
  createdAt DateTime @default(now())

  message   Message  @relation(fields: [messageId], references: [id])
}
```

## Environment Configuration

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/flipstaq?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3003                    # HTTP service port
WS_PORT=8001                # WebSocket service port
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="15m"
NODE_ENV="development"
USER_SERVICE_URL="http://localhost:3003"  # For marking users offline
TENOR_API_KEY=your-tenor-api-key-here
```

## Service Communication

### Request Flow

```
Frontend ←→ WebSocket (Port 8001) ←→ Message Service (Port 3003) ←→ PostgreSQL
    ↓
API Gateway (Port 3100) ←→ Message Service (Port 3003) ←→ PostgreSQL
```

### WebSocket Communication

- **Real-time**: Messages, read status, typing, user status
- **Port**: 8001 (dedicated WebSocket server)
- **Authentication**: JWT via query parameter

### HTTP Communication

- **Initial data**: Conversations, message history, file uploads
- **Port**: 3003 (via API Gateway on 3100)
- **Authentication**: JWT via Authorization header

### Authentication Headers

```
x-user-id: <decoded-user-id>
x-internal-service: 'true'
x-api-gateway: 'flipstaq-gateway'
```

## Error Handling

- **400 Bad Request**: Invalid message data, empty user ID
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Access denied to conversation/message
- **404 Not Found**: User, conversation, or message not found

## Usage Examples

### Start a Conversation (HTTP)

```bash
curl -X POST http://localhost:3100/api/v1/messages/conversations \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"username": "@johndoe"}'
```

### Send a Message (WebSocket)

```javascript
// Connect to WebSocket
const ws = new WebSocket("ws://localhost:8001/ws?token=" + authToken);

// Send message
ws.send(
  JSON.stringify({
    event: "sendMessage",
    payload: {
      content: "Hello! Is this product still available?",
      conversationId: "clx1y2z3a4b5c6d7e8f9g0h1",
    },
  })
);

// Listen for response
ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  if (response.success) {
    console.log("Message sent:", response.message);
  }
};
```

### Get Conversation Messages (HTTP - Initial Load)

```bash
curl -X GET "http://localhost:3100/api/v1/messages/conversations/clx1y2z3a4b5c6d7e8f9g0h1/messages?page=1&limit=50" \
  -H "Authorization: Bearer <jwt-token>"
```

### Upload File Attachment (HTTP)

```bash
curl -X POST http://localhost:3100/api/v1/messages/upload \
  -H "Authorization: Bearer <jwt-token>" \
  -F "file=@image.jpg"
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test

# Generate Prisma client
npm run prisma:generate
```

## Current Implementation Status

### ✅ Completed Features

- **Pure WebSocket Messaging**: 100% real-time messaging without HTTP polling
- **File Attachments**: Image and document sharing with metadata support (including GIF files)
- **GIF Integration**: Complete GIF support with dual sources:
  - **Upload GIFs**: Direct `.gif` file uploads (max 10MB) stored locally
  - **Tenor API**: Search and send GIFs via integrated Tenor API
  - **External URLs**: Support for external GIF URLs (no local storage required)
  - **Auto-detection**: Automatic handling of local vs. external GIF sources
- **Product Integration**: Product covers can be attached to messages
- **User Search**: Public API for finding users to message
- **Read Status**: Real-time read confirmations via WebSocket
- **Online Status**: Live user presence updates
- **Typing Indicators**: Real-time typing status with visual feedback in chat messages and conversation list
- **Connection Management**: Auto-reconnection and heartbeat monitoring
- **Room Management**: Automatic conversation room join/leave
- **Authentication**: JWT-based security for all operations
- **Mobile Optimization**: Responsive UI with mobile-first design
- **Message Deduplication**: Prevents duplicate messages from WebSocket events

### 🔧 Technical Architecture

- **Backend**: NestJS with pure WebSocket implementation
- **Database**: PostgreSQL with Prisma ORM
- **Frontend**: Next.js with custom WebSocket service
- **Real-time**: 100% WebSocket-driven (no HTTP polling)
- **File Storage**: Integrated file upload system
- **Authentication**: JWT tokens for both HTTP and WebSocket
- **Documentation**: Complete API and WebSocket event documentation

### 🚀 Performance Benefits

- **Instant Messaging**: Zero delay message delivery
- **Reduced Server Load**: No HTTP polling overhead
- **Battery Efficient**: Minimal network usage on mobile
- **Scalable**: Ready for multi-server Redis pub/sub
- **Modern UX**: Real-time responsive chat experience

The Message Service is now **production-ready** with a complete WebSocket-based real-time messaging system!

## 🖼️ GIF Integration

### Tenor API Integration

The messaging system includes full GIF support through Tenor API integration:

#### GIF Search Features

- **Search GIFs**: `/api/v1/gifs/search?q=funny&limit=25` (public access)
- **Trending GIFs**: `/api/v1/gifs/trending?limit=25` (public access)
- **Categories**: `/api/v1/gifs/categories?limit=25` (public access)
- **Pagination**: Support for `pos` parameter for load more functionality
- **Authentication**: GIF browsing is public; authentication required only for sending

#### File Support

- **Upload GIFs**: Direct `.gif` file uploads up to 10MB
- **External GIFs**: Tenor CDN URLs (no local storage required)
- **Auto-detection**: Automatically handles local vs external URLs in display
- **Performance**: External GIFs don't count against storage limits

#### UI Components

- **GIF Button**: Integrated GIF search button in message input
- **Inline GIF Picker**: Dropdown-style GIF picker similar to emoji selector
- **Responsive Grid**: Mobile-friendly GIF picker with aspect ratio preservation
- **Loading States**: Proper loading indicators for API calls
- **Error Handling**: User-friendly error messages for failed requests

#### Message Structure

```json
{
  "content": "",
  "attachments": [
    {
      "fileUrl": "https://media.tenor.com/example.gif",
      "fileName": "gif",
      "fileType": "image/gif",
      "fileSize": 0
    }
  ]
}
```

#### Environment Variables

```env
# In apps/api-gateway/.env
TENOR_API_KEY=your-tenor-api-key-here
```

_Note: The system includes a demo API key for development. For production, obtain your own key from [Tenor API](https://tenor.com/gifapi/documentation)._

### Frontend Implementation

- **GIF Modal**: `apps/web/src/components/chat/GifSearchModal.tsx`
- **Message Input**: GIF button integrated in `MessageInput.tsx`
- **Message Display**: Automatic GIF rendering in `MessageList.tsx`
- **Localization**: Full English and Arabic translation support

### Performance Considerations

- **CDN URLs**: Tenor GIFs served from high-performance CDN
- **Lazy Loading**: GIFs load only when visible in chat
- **Caching**: Browser caches GIF search results
- **Network Efficient**: External URLs don't impact upload bandwidth

- User blocking/muting

## Notes

- This service requires the shared Prisma client from `packages/db`
- All external access must go through the API Gateway
- WebSocket functionality will be added in future iterations
- Redis integration is prepared but not yet implemented
