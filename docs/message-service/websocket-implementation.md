# Custom WebSocket Implementation - Message Service

## Overview

The message service uses a **custom WebSocket implementation** using the native `ws` library and NestJS WebSocket support, **not socket.io**. This provides better performance and more control over the WebSocket connections.

## Architecture

### Gateway Implementation

- Uses `@nestjs/websockets` with the `ws` adapter
- Located in `src/gateway/messaging.gateway.ts`
- Handles all real-time messaging functionality

### Key Features

1. **Authentication**: JWT token-based authentication via URL query parameters or headers
2. **Room Management**: Custom room implementation for conversations and user channels
3. **Connection Management**: Tracks connected users and handles disconnections gracefully
4. **Heartbeat**: Automatic ping/pong to detect broken connections
5. **Cross-service Communication**: Redis integration for multi-service messaging

## WebSocket Events

### Client to Server Events

#### sendMessage

```json
{
  "event": "sendMessage",
  "payload": {
    "conversationId": "string",
    "content": "string",
    "receiverId": "string",
    "attachments": [...]
  }
}
```

#### markAsRead

```json
{
  "event": "markAsRead",
  "payload": {
    "messageId": "string",
    "read": true
  }
}
```

#### joinConversation

```json
{
  "event": "joinConversation",
  "payload": {
    "conversationId": "string"
  }
}
```

#### leaveConversation

```json
{
  "event": "leaveConversation",
  "payload": {
    "conversationId": "string"
  }
}
```

#### typing

```json
{
  "event": "typing",
  "payload": {
    "conversationId": "string",
    "isTyping": true
  }
}
```

### Server to Client Events

#### newMessage

```json
{
  "event": "newMessage",
  "data": {
    "id": "string",
    "content": "string",
    "senderId": "string",
    "conversationId": "string",
    "createdAt": "ISO string",
    "attachments": [...]
  }
}
```

#### messageReadStatusChanged

```json
{
  "event": "messageReadStatusChanged",
  "data": {
    "messageId": "string",
    "read": true
  }
}
```

#### userOnline

```json
{
  "event": "userOnline",
  "data": {
    "userId": "string",
    "username": "string"
  }
}
```

#### userOffline

```json
{
  "event": "userOffline",
  "data": {
    "userId": "string",
    "username": "string"
  }
}
```

#### userTyping

```json
{
  "event": "userTyping",
  "data": {
    "userId": "string",
    "username": "string",
    "conversationId": "string",
    "isTyping": true
  }
}
```

## Connection Process

1. **Client connects** to `ws://localhost:8001` (or configured port)
2. **Authentication** via JWT token in query parameters: `ws://localhost:8001?token=JWT_TOKEN`
3. **Connection established** and user added to personal room (`user_{userId}`)
4. **Heartbeat initiated** with 30-second intervals
5. **Message handling** setup for incoming WebSocket messages

## Room Management

### User Rooms

- Each authenticated user is automatically added to `user_{userId}` room
- Used for direct messages and notifications

### Conversation Rooms

- Users join/leave conversation rooms as needed
- Room key format: `conversation_{conversationId}`
- Used for group messaging and typing indicators

## Error Handling

- **Authentication failures**: Connection closed with code 1008
- **Invalid message format**: Error response sent to client
- **Service errors**: Logged and error response sent to client
- **Broken connections**: Detected via heartbeat and cleaned up automatically

## Configuration

- **Port**: Default 8001, configurable via environment
- **CORS**: Configured for frontend origins
- **JWT Secret**: Must match auth service configuration
- **Redis**: Required for cross-service messaging

## Performance Considerations

- **Connection pooling**: Multiple connections per user supported
- **Memory management**: Automatic cleanup of disconnected clients
- **Heartbeat**: Prevents accumulation of dead connections
- **Room optimization**: Rooms cleaned up when empty

## Differences from Socket.io

1. **No automatic reconnection**: Client must handle reconnection logic
2. **Custom room implementation**: Managed in-memory with Maps
3. **Manual message routing**: No built-in namespace/room features
4. **Lower-level control**: Direct WebSocket message handling
5. **Better performance**: Less overhead than Socket.io abstraction layer
