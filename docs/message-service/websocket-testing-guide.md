# WebSocket Online Status Implementation - Testing Guide

## ✅ **What Was Fixed**

The issue where users weren't being shown as online when they opened the website has been resolved by implementing a complete **custom WebSocket system** using pure `ws` library without any NestJS WebSocket decorators.

### **Root Cause**

- The frontend had **no WebSocket connection** to the backend
- Online status was hardcoded or randomized in the UI
- No real-time communication between client and server
- Previous attempts used NestJS WebSocket adapters which caused conflicts

### **Solution Implemented**

#### 1. **Pure WebSocket Gateway (Backend)**

- **File**: `services/message-service/src/gateway/messaging.gateway.ts`
- **Implementation**: Custom WebSocket server using `ws` library
- **Port**: 8001 (dedicated WebSocket port)
- **Features**:
  - JWT authentication via query parameter
  - Custom room/user management
  - Heartbeat ping/pong (30s intervals)
  - Real-time messaging and status updates
  - Cross-service communication via Redis

#### 2. **Custom WebSocket Service (Frontend)**

- **File**: `apps/web/src/lib/webSocketService.ts`
- **Connection**: `ws://localhost:8001/ws?token=${authToken}`
- **Features**:
  - Automatic connection with JWT authentication
  - Auto-reconnection with exponential backoff
  - Heartbeat/ping-pong to maintain connection
  - Event-based message handling
  - Real-time user status tracking

#### 3. **WebSocket Context Provider (Frontend)**

- **File**: `apps/web/src/contexts/WebSocketContext.tsx`
- **Features**:
  - Global WebSocket state management
  - User online status tracking
  - Typing indicators
  - Message event handlers
  - Auto-connection on auth changes

#### 3. **Enhanced Message Gateway (Backend)**

- **File**: `services/message-service/src/gateway/messaging.gateway.ts`
- **Features**:
  - Custom WebSocket implementation (NOT socket.io)
  - JWT authentication via query parameters
  - User room management for online status
  - Ping/pong heartbeat system
  - Real-time user online/offline broadcasting

#### 4. **Real-time UI Updates**

- **ConversationList**: Shows real online status from WebSocket
- **NewChatModal**: Displays live user online status
- **ChatDrawer**: Auto-connects to WebSocket and handles real-time messages

## 🧪 **How to Test**

### **Prerequisites**

1. Ensure all services are running:

   ```bash
   cd /c/Users/user/Desktop/flipstaq
   npm run dev  # This should start all services via turbo
   ```

2. Make sure you have a valid JWT token (login to the app)

### **Test 1: Auto-Connection**

1. **Login** to the app (to get JWT token)
2. **Navigate** to chat/messages section
3. **Check browser console** - you should see:
   ```
   Connecting to WebSocket: ws://localhost:8001?token=...
   ✅ WebSocket connected
   ```

### **Test 2: Online Status Display**

1. **Open two browser tabs/windows**
2. **Login with different users** in each tab
3. **Start a conversation** between the users
4. **Verify** that online status indicators show:
   - 🟢 Green dot with animation for online users
   - ⚫ Gray dot for offline users

### **Test 3: Real-time Status Updates**

1. **User A** has chat open
2. **User B** opens the website (logs in)
3. **User A** should immediately see User B come online
4. **User B** closes browser
5. **User A** should see User B go offline

### **Test 4: Real-time Messaging**

1. **Open conversation** between two users
2. **Send message** from User A
3. **User B** should receive message **instantly** without page refresh
4. **Check console** for WebSocket message logs

### **Test 5: Connection Recovery**

1. **Start WebSocket connection**
2. **Restart message service**: `Ctrl+C` and restart
3. **Frontend should automatically reconnect** within 30 seconds
4. **Check console** for reconnection attempts

## 🔧 **Connection Details**

### **WebSocket URL**

- **Development**: `ws://localhost:8001?token=JWT_TOKEN`
- **Production**: `wss://yourdomain.com?token=JWT_TOKEN`

### **Authentication**

- JWT token passed as query parameter: `?token=your_jwt_token`
- Token validated on connection
- JWT payload contains: `{ sub: userId, email, role }`
- Connection rejected if token invalid/missing
- Username displayed as email (since username not in JWT payload)

### **Events**

#### **Client → Server**

- `sendMessage` - Send new message
- `markAsRead` - Mark message as read
- `joinConversation` - Join conversation room
- `leaveConversation` - Leave conversation room
- `typing` - Send typing indicator
- `ping` - Keep connection alive

#### **Server → Client**

- `newMessage` - New message received
- `messageReadStatusChanged` - Read status update
- `userOnline` - User came online
- `userOffline` - User went offline
- `userTyping` - User typing indicator
- `pong` - Heartbeat response

## 🐛 **Troubleshooting**

### **Connection Issues**

```bash
# Check if message service is running
curl http://localhost:3003/health

# Check WebSocket port
netstat -an | grep 8001
```

### **No Online Status**

1. Check browser console for WebSocket connection errors
2. Verify JWT token in localStorage: `localStorage.getItem('authToken')`
3. Check message service logs for authentication errors

### **Messages Not Real-time**

1. Verify WebSocket connection status in browser dev tools
2. Check if conversation rooms are joined properly
3. Look for JavaScript errors in console

## 📊 **Expected Console Output**

### **Successful Connection**

```
Connecting to WebSocket: ws://localhost:8001?token=eyJ...
✅ WebSocket connected
🏠 Joining conversation room: conv_12345
```

### **Receiving Messages**

```
📨 WebSocket message received: newMessage {id: "msg_123", content: "Hello!", ...}
📨 Received new message via WebSocket: {id: "msg_123", ...}
```

### **Status Changes**

```
👁️ Message read status changed: {messageId: "msg_123", read: true}
🏓 Received pong from server
```

## 🚀 **Performance Notes**

- **Connection**: Auto-connects when user logs in
- **Heartbeat**: 30-second intervals to detect broken connections
- **Reconnection**: Automatic with exponential backoff (max 5 attempts)
- **Memory**: Automatic cleanup of disconnected users and rooms
- **Scalability**: Ready for Redis pub/sub for multi-server setups
- **Real-time Messaging**: 100% WebSocket-based (NO HTTP polling)
- **Message Sending**: All messages sent via WebSocket `sendMessage` event
- **Message Receiving**: All messages received via WebSocket `newMessage` event
- **Read Status**: Read confirmations sent via WebSocket `markAsRead` event
- **Initial Load**: HTTP used only for initial conversation/message loading

## 🔧 **Implementation Details**

### **What Uses WebSocket (Real-time)**

✅ Sending new messages
✅ Receiving new messages
✅ Marking messages as read
✅ User online/offline status
✅ Typing indicators
✅ Conversation room management

### **What Uses HTTP (Initial data only)**

🔄 Loading conversation list (one-time)
🔄 Loading message history (one-time per conversation)
🔄 File uploads
🔄 User search

### **Removed HTTP Polling**

❌ No 3-second conversation polling
❌ No message refreshing via HTTP
❌ No status polling for online users

The online status issue is now **completely resolved** with a robust, production-ready WebSocket implementation that eliminates HTTP polling!
