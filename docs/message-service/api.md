# Message Service API Documentation

## Base URL

- **Internal**: `http://localhost:3003/internal/messages`
- **Public (via API Gateway)**: `http://localhost:3100/api/v1/messages`

All public endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## Conversations

### POST /conversations

**Start a new conversation with another user**

#### Request Body

```json
{
  "username": "@johndoe"
}
```

#### Response (201)

```json
{
  "id": "clx1y2z3a4b5c6d7e8f9g0h1",
  "participants": [
    {
      "id": "clx1y2z3a4b5c6d7e8f9g0h3",
      "username": "currentuser",
      "firstName": "Current",
      "lastName": "User"
    },
    {
      "id": "clx1y2z3a4b5c6d7e8f9g0h4",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe"
    }
  ],
  "lastMessage": null,
  "unreadCount": 0,
  "createdAt": "2025-06-19T17:30:00.000Z",
  "updatedAt": "2025-06-19T17:30:00.000Z"
}
```

#### Errors

- `400` - Invalid username or cannot message yourself
- `404` - User not found

---

### GET /conversations

**Get all conversations for the current user**

#### Response (200)

```json
[
  {
    "id": "clx1y2z3a4b5c6d7e8f9g0h1",
    "participants": [
      {
        "id": "clx1y2z3a4b5c6d7e8f9g0h3",
        "username": "currentuser",
        "firstName": "Current",
        "lastName": "User"
      },
      {
        "id": "clx1y2z3a4b5c6d7e8f9g0h4",
        "username": "johndoe",
        "firstName": "John",
        "lastName": "Doe"
      }
    ],
    "lastMessage": {
      "id": "clx1y2z3a4b5c6d7e8f9g0h5",
      "content": "Hello! Is this product still available?",
      "senderId": "clx1y2z3a4b5c6d7e8f9g0h3",
      "createdAt": "2025-06-19T17:35:00.000Z",
      "read": false
    },
    "unreadCount": 1,
    "createdAt": "2025-06-19T17:30:00.000Z",
    "updatedAt": "2025-06-19T17:35:00.000Z"
  }
]
```

---

### GET /conversations/:id/messages

**Get messages for a specific conversation**

#### Query Parameters

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of messages per page (default: 50, max: 100)

#### Response (200)

```json
{
  "messages": [
    {
      "id": "clx1y2z3a4b5c6d7e8f9g0h5",
      "content": "Hello! Is this product still available?",
      "senderId": "clx1y2z3a4b5c6d7e8f9g0h3",
      "conversationId": "clx1y2z3a4b5c6d7e8f9g0h1",
      "replyToMessageId": null,
      "replyToMessage": null,
      "read": false,
      "createdAt": "2025-06-19T17:35:00.000Z",
      "fileUrl": null,
      "fileName": null,
      "fileType": null,
      "fileSize": null,
      "sender": {
        "id": "clx1y2z3a4b5c6d7e8f9g0h3",
        "username": "currentuser",
        "firstName": "Current",
        "lastName": "User"
      }
    },
    {
      "id": "clx1y2z3a4b5c6d7e8f9g0h6",
      "content": "Yes, it's still available! Are you interested?",
      "senderId": "clx1y2z3a4b5c6d7e8f9g0h4",
      "conversationId": "clx1y2z3a4b5c6d7e8f9g0h1",
      "replyToMessageId": "clx1y2z3a4b5c6d7e8f9g0h5",
      "replyToMessage": {
        "id": "clx1y2z3a4b5c6d7e8f9g0h5",
        "content": "Hello! Is this product still available?",
        "senderId": "clx1y2z3a4b5c6d7e8f9g0h3",
        "senderUsername": "currentuser"
      },
      "read": true,
      "createdAt": "2025-06-19T17:36:00.000Z",
      "fileUrl": null,
      "fileName": null,
      "fileType": null,
      "fileSize": null,
      "sender": {
        "id": "clx1y2z3a4b5c6d7e8f9g0h4",
        "username": "johndoe",
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    {
      "id": "clx1y2z3a4b5c6d7e8f9g0h7",
      "content": "Here's a photo of the item",
      "senderId": "clx1y2z3a4b5c6d7e8f9g0h4",
      "conversationId": "clx1y2z3a4b5c6d7e8f9g0h1",
      "read": false,
      "createdAt": "2025-06-19T17:38:00.000Z",
      "fileUrl": "/uploads/messages/1703123456789-987654321.jpg",
      "fileName": "product-photo.jpg",
      "fileType": "image/jpeg",
      "fileSize": 245760,
      "sender": {
        "id": "clx1y2z3a4b5c6d7e8f9g0h4",
        "username": "johndoe",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "total": 3,
  "hasMore": false
}
```

#### Errors

- `404` - Conversation not found or access denied

---

## File Uploads

### POST /upload

**Upload a file for messaging**

> **Note**: Files must be uploaded before sending a message. Use the returned `fileUrl` in the message payload.

#### Request Body

- **Content-Type**: `multipart/form-data`
- **Field**: `file` (binary file data)

#### Supported File Types

- **Images**: `.jpg`, `.jpeg`, `.png`, `.webp`
- **Documents**: `.pdf`, `.txt`, `.doc`, `.docx`, `.xls`, `.xlsx`

#### File Size Limit

- **Maximum**: 10MB per file

#### Response (201)

```json
{
  "fileUrl": "/uploads/messages/1703123456789-987654321.jpg",
  "fileName": "product-photo.jpg",
  "fileType": "image/jpeg",
  "fileSize": 245760
}
```

#### Errors

- `400` - File type not allowed or file too large
- `401` - Authentication required

#### Example Usage

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/your/file.jpg" \
  http://localhost:3100/api/v1/messages/upload
```

---

## Messages

### POST /

**Send a new message**

#### Request Body

**Text-only message:**

```json
{
  "content": "Hello! Is this product still available?",
  "conversationId": "clx1y2z3a4b5c6d7e8f9g0h1"
}
```

**Message with file attachment:**

```json
{
  "content": "Here's a photo of the item",
  "conversationId": "clx1y2z3a4b5c6d7e8f9g0h1",
  "fileUrl": "/uploads/messages/1703123456789-987654321.jpg",
  "fileName": "product-photo.jpg",
  "fileType": "image/jpeg",
  "fileSize": 245760
}
```

**File-only message (no text content):**

```json
{
  "content": "",
  "conversationId": "clx1y2z3a4b5c6d7e8f9g0h1",
  "fileUrl": "/uploads/messages/1703123456789-987654321.pdf",
  "fileName": "invoice.pdf",
  "fileType": "application/pdf",
  "fileSize": 128400
}
```

#### Response (201)

```json
{
  "id": "clx1y2z3a4b5c6d7e8f9g0h5",
  "content": "Hello! Is this product still available?",
  "senderId": "clx1y2z3a4b5c6d7e8f9g0h3",
  "conversationId": "clx1y2z3a4b5c6d7e8f9g0h1",
  "read": false,
  "createdAt": "2025-06-19T17:35:00.000Z",
  "fileUrl": null,
  "fileName": null,
  "fileType": null,
  "fileSize": null,
  "sender": {
    "id": "clx1y2z3a4b5c6d7e8f9g0h3",
    "username": "currentuser",
    "firstName": "Current",
    "lastName": "User"
  }
}
```

#### Errors

- `400` - Invalid message data
- `404` - Conversation not found or access denied

---

### PATCH /:id/read

**Mark a message as read or unread**

#### Request Body

```json
{
  "read": true // optional, defaults to true
}
```

#### Response (200)

```json
{
  "success": true,
  "message": "Message marked as read"
}
```

#### Errors

- `400` - Cannot mark own message as unread
- `403` - Access denied to this message
- `404` - Message not found

---

### PATCH /messages/:id

**Edit a message**

#### Request Body

```json
{
  "content": "This is the updated message content"
}
```

#### Response (200)

```json
{
  "id": "clx1y2z3a4b5c6d7e8f9g0h5",
  "content": "This is the updated message content",
  "senderId": "clx1y2z3a4b5c6d7e8f9g0h3",
  "conversationId": "clx1y2z3a4b5c6d7e8f9g0h1",
  "read": false,
  "createdAt": "2025-06-19T17:35:00.000Z",
  "editedAt": "2025-06-19T18:15:00.000Z",
  "sender": {
    "id": "clx1y2z3a4b5c6d7e8f9g0h3",
    "username": "currentuser",
    "firstName": "Current",
    "lastName": "User"
  },
  "attachments": []
}
```

#### Errors

- `400` - Cannot edit deleted message
- `403` - Can only edit your own messages / Message too old (24h limit)
- `404` - Message not found

#### Business Rules

- Only the message sender can edit their own messages
- Messages older than 24 hours cannot be edited
- Deleted messages cannot be edited
- Edit timestamp (`editedAt`) is automatically set

---

### PATCH /conversations/:id/read

**Mark all messages in a conversation as read**

#### Response (200)

```json
{
  "success": true,
  "message": "Marked 3 messages as read",
  "updatedCount": 3
}
```

#### Errors

- `404` - Conversation not found or access denied

---

## WebSocket Events (Current Implementation)

### Client → Server Events

#### `sendMessage`

```json
{
  "content": "Hello there!",
  "conversationId": "clx1y2z3a4b5c6d7e8f9g0h1",
  "replyToMessageId": "clx1y2z3a4b5c6d7e8f9g0h2", // Optional: ID of message being replied to
  "attachments": [
    // Optional: File attachments
    {
      "fileUrl": "https://example.com/uploads/image.jpg",
      "fileName": "screenshot.jpg",
      "fileType": "image/jpeg",
      "fileSize": 1024000
    }
  ]
}
```

**Fields:**

- `content` (optional): Text content of the message
- `conversationId` (required): ID of the conversation
- `replyToMessageId` (optional): ID of the message being replied to. When provided, creates a reply message with preview information of the original message.
- `attachments` (optional): Array of file attachments with the following structure:
  - `fileUrl` (required): URL of the uploaded file
  - `fileName` (required): Original or generated filename
  - `fileType` (required): MIME type of the file
  - `fileSize` (required): File size in bytes

**File Attachment Support:**

- **Manual Upload**: Users can select files via attachment button
- **Paste Upload**: Users can paste images directly (Ctrl+V/⌘+V) from clipboard
- **Supported Types**: Images (JPEG, PNG, WebP, GIF), PDFs, text files, Word docs, Excel files
- **Size Limit**: 10MB per file
- **File Limit**: Maximum 10 files per message
- **Paste Behavior**: Clipboard images are automatically processed and added to attachment queue

**Reply Behavior:**

- When `replyToMessageId` is provided, the message will include a preview of the original message
- The original message must exist, not be deleted, and be within the same conversation
- Reply messages emit a `messageReplied` event instead of `newMessage` for better client-side handling
- Reply preview includes original message content and sender username for display

#### `editMessage`

```json
{
  "messageId": "clx1y2z3a4b5c6d7e8f9g0h5",
  "content": "Updated message content",
  "conversationId": "clx1y2z3a4b5c6d7e8f9g0h1"
}
```

#### `markAsRead`

```json
{
  "messageId": "clx1y2z3a4b5c6d7e8f9g0h5",
  "read": true
}
```

#### `markConversationAsRead`

```json
{
  "conversationId": "clx1y2z3a4b5c6d7e8f9g0h1"
}
```

#### `joinConversation`

```json
{
  "conversationId": "clx1y2z3a4b5c6d7e8f9g0h1"
}
```

#### `typing`

```json
{
  "conversationId": "clx1y2z3a4b5c6d7e8f9g0h1",
  "isTyping": true
}
```

### Server → Client Events

#### `newMessage`

Emitted when a new message is received in any conversation the user participates in.

#### `messageReplied`

Emitted when a reply message is received in any conversation the user participates in. Contains the same message structure as `newMessage` but includes reply information:

```json
{
  "id": "clx1y2z3a4b5c6d7e8f9g0h6",
  "content": "Thanks for the info!",
  "senderId": "clx1y2z3a4b5c6d7e8f9g0h4",
  "conversationId": "clx1y2z3a4b5c6d7e8f9g0h1",
  "replyToMessageId": "clx1y2z3a4b5c6d7e8f9g0h5",
  "replyToMessage": {
    "id": "clx1y2z3a4b5c6d7e8f9g0h5",
    "content": "The product is still available",
    "senderId": "clx1y2z3a4b5c6d7e8f9g0h3",
    "senderUsername": "johndoe"
  },
  "createdAt": "2025-06-19T18:20:00.000Z",
  "sender": {
    "id": "clx1y2z3a4b5c6d7e8f9g0h4",
    "username": "alice",
    "firstName": "Alice",
    "lastName": "Smith"
  }
}
```

#### `messageEdited`

Emitted when a message is edited in any conversation the user participates in.

```json
{
  "messageId": "clx1y2z3a4b5c6d7e8f9g0h5",
  "content": "Updated message content",
  "editedAt": "2025-06-19T18:15:00.000Z",
  "conversationId": "clx1y2z3a4b5c6d7e8f9g0h1"
}
```

#### `messageReadStatusChanged`

Emitted when message read status changes.

#### `conversationReadStatusChanged`

Emitted when a conversation's read status changes, includes:

- `conversationId`: The conversation that was marked as read
- `userId`: The user who marked it as read
- `updatedCount`: Number of messages that were marked as read

#### `userOnline` / `userOffline`

Emitted when users come online or go offline.

#### `userTyping`

Emitted when someone is typing in a conversation.

---

## Error Responses

All endpoints return standardized error responses:

```json
{
  "statusCode": 400,
  "message": "Validation error message",
  "error": "Bad Request"
}
```

### Common Status Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (access denied)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Authentication

### JWT Token

All requests must include a valid JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Internal Headers (API Gateway)

When forwarding requests, the API Gateway includes:

```
x-user-id: clx1y2z3a4b5c6d7e8f9g0h3
x-internal-service: true
x-api-gateway: flipstaq-gateway
```

---

## Rate Limiting (Future)

Planned rate limits:

- **Conversations**: 10 new conversations per hour per user
- **Messages**: 100 messages per minute per user
- **Read Operations**: 1000 requests per minute per user
- **File Uploads**: 20 uploads per minute per user

---

## File Attachment Workflow

### Complete Example: Sending a Message with File

1. **Upload the file first:**

   ```bash
   curl -X POST \
     -H "Authorization: Bearer <token>" \
     -F "file=@product-photo.jpg" \
     http://localhost:3100/api/v1/messages/upload
   ```

   **Response:**

   ```json
   {
     "fileUrl": "/uploads/messages/1703123456789-987654321.jpg",
     "fileName": "product-photo.jpg",
     "fileType": "image/jpeg",
     "fileSize": 245760
   }
   ```

2. **Send the message with file attachment:**
   ```bash
   curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "content": "Here is the product photo",
       "conversationId": "clx1y2z3a4b5c6d7e8f9g0h1",
       "fileUrl": "/uploads/messages/1703123456789-987654321.jpg",
       "fileName": "product-photo.jpg",
       "fileType": "image/jpeg",
       "fileSize": 245760
     }' \
     http://localhost:3100/api/v1/messages/
   ```

### Frontend Implementation Notes

- **File Preview**: Show image thumbnails and file icons before sending
- **Progress Indicator**: Display upload progress during file upload
- **Error Handling**: Handle file size limits and unsupported file types
- **Image Display**: Show inline image previews in chat messages
- **Download Links**: Provide download buttons for non-image files
- **Responsive Design**: Ensure file attachments work on mobile devices

### File Storage

- **Location**: `apps/api-gateway/src/uploads/messages/`
- **Naming**: `{timestamp}-{random}.{extension}`
- **Access**: Files are served statically via the API Gateway
- **Security**: Only authenticated users can upload and access files
