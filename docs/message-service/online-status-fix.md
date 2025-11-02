# Online Status System Fix

**Date:** November 2, 2025  
**Issue:** Users sometimes show as offline even when they are online

---

## 🐛 Problem Analysis

### Symptoms

- Users appear offline in the chat system even when they are actively using the application
- Online status not showing correctly when opening chat drawer
- Inconsistent online/offline indicators across different browser tabs
- Online status only updates after another user connects/disconnects

### Root Causes

#### 1. **No Initial Online Users Sent on Connection**

When a user connects to the WebSocket server, they only receive `userOnline` events for users who connect **after** them. They don't receive information about users who are **already online**.

**Example:**

- User A connects → sees nobody online
- User B connects → User B sees User A online, but User A doesn't see User B
- User C connects → sees A & B online, but A & B don't see C

#### 2. **User Not Marked Online in Database**

The backend didn't update the `isOnline` field in the database when a user connected via WebSocket. It only updated on disconnect.

**Impact:**

- Page refreshes showed stale offline status
- HTTP API calls returned incorrect online status
- Database didn't reflect actual WebSocket connection state

#### 3. **Frontend Starts with Empty State**

The `onlineUsers` Map in `WebSocketContext` started empty and only got populated by incremental `userOnline`/`userOffline` events received after connection.

**Problem:**

```typescript
// Before fix - only incremental updates
const [onlineUsers, setOnlineUsers] = useState<Map<string, UserStatus>>(
  new Map() // ❌ Starts empty!
);
```

#### 4. **Race Condition on Connection**

New connections broadcast "userOnline" before receiving the list of already-online users, creating timing issues.

---

## ✅ Solution Implemented

### Backend Changes (Message Service Gateway)

#### 1. **Mark User Online in Database**

Added `markUserOnlineInDatabase()` method to update DB when user connects:

```typescript
// Mark user online in database
private async markUserOnlineInDatabase(userId: string): Promise<void> {
  try {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: true,
        lastSeen: new Date(),
      },
    });
  } catch (error) {
    this.logger.error("Failed to mark user online in database:", error.message);
  }
}
```

**Called on connection:**

```typescript
// Mark user as online in database
await this.markUserOnlineInDatabase(payload.sub);
```

#### 2. **Send Initial Online Users List**

On connection, send all currently online users to the new client:

```typescript
// Send list of all currently online users to the newly connected user
const onlineUsersList = Array.from(this.connectedUsers.keys())
  .filter((userId) => userId !== payload.sub) // Exclude the current user
  .map((userId) => {
    const sockets = this.connectedUsers.get(userId);
    const socket = sockets && sockets[0]; // Get first socket for username
    return {
      userId,
      username: socket?.username || "Unknown",
      isOnline: true,
    };
  });

// Send the list of currently online users to the new connection
this.sendToClient(client, {
  event: "onlineUsersList",
  data: onlineUsersList,
});
```

**Flow:**

1. User connects
2. Mark user online in DB
3. Get list of all currently connected users
4. Send bulk list to new connection
5. Broadcast new user online to existing connections

#### 3. **Updated Connection Handler**

Complete connection flow in `handleConnection()`:

```typescript
// 1. Authenticate user
// 2. Add to connected users map
// 3. Mark online in database ✅ NEW
// 4. Send list of online users ✅ NEW
// 5. Broadcast user online to others
// 6. Set up message handlers
```

### Frontend Changes

#### 1. **WebSocket Service - Handle Bulk Event**

Added handler for `onlineUsersList` event in `webSocketService.ts`:

```typescript
switch (event) {
  // ... other events
  case "onlineUsersList":
    // Handle initial bulk list of online users
    this.emit("onlineUsersList", eventData);
    break;
  case "userOnline":
    this.emit("userOnline", eventData);
    break;
  case "userOffline":
    this.emit("userOffline", eventData);
    break;
  // ... other events
}
```

#### 2. **WebSocket Context - Populate Initial State**

Added handler to populate `onlineUsers` Map with bulk data:

```typescript
// User status management - bulk initial list
const handleOnlineUsersList = (
  users: Array<{ userId: string; username: string; isOnline: boolean }>
) => {
  console.log("📋 Received initial online users list:", users);
  setOnlineUsers((prev) => {
    const updated = new Map(prev);
    users.forEach((user) => {
      updated.set(user.userId, {
        userId: user.userId,
        username: user.username,
        isOnline: user.isOnline,
      });
    });
    return updated;
  });
};
```

**Registered event:**

```typescript
webSocketService.on("onlineUsersList", handleOnlineUsersList);
```

---

## 🧪 Testing Guide

### Test Scenario 1: Initial Connection

**Steps:**

1. Open the application in Browser Tab 1 as User A
2. Navigate to Messages/Chat
3. Open the application in Browser Tab 2 as User B
4. Navigate to Messages/Chat in Tab 2

**Expected Result:**

- ✅ User A immediately sees User B as online (without needing to refresh)
- ✅ User B immediately sees User A as online
- ✅ Green "online" indicator visible on both sides

### Test Scenario 2: Page Refresh Persistence

**Steps:**

1. User A and User B are both online (connected)
2. User A refreshes the page (F5 or Cmd+R)
3. Check User B's view

**Expected Result:**

- ✅ User B still sees User A as online immediately after refresh
- ✅ User A's reconnection is instant
- ✅ No temporary "offline" flash

### Test Scenario 3: Multiple Users

**Steps:**

1. Open 3 browser tabs with different users (A, B, C)
2. Connect all three to chat
3. Check each user's view

**Expected Result:**

- ✅ User A sees B and C as online
- ✅ User B sees A and C as online
- ✅ User C sees A and B as online
- ✅ All connections show in real-time

### Test Scenario 4: Disconnection

**Steps:**

1. User A and User B are both online
2. User A closes their browser tab
3. Wait 3-5 seconds
4. Check User B's view

**Expected Result:**

- ✅ User B sees User A go offline
- ✅ Offline indicator shows gray dot
- ✅ "Last seen" timestamp appears (if implemented)

### Test Scenario 5: Database Sync

**Steps:**

1. User A connects via WebSocket
2. Query database directly: `SELECT isOnline, lastSeen FROM users WHERE id = 'userId'`
3. User A disconnects
4. Query database again

**Expected Result:**

- ✅ `isOnline = true` when connected
- ✅ `lastSeen` updated to current timestamp
- ✅ `isOnline = false` after disconnect
- ✅ `lastSeen` updated to disconnect time

### Test Scenario 6: Conversation List

**Steps:**

1. User A and User B have an existing conversation
2. User A opens chat drawer
3. Check conversation list

**Expected Result:**

- ✅ Green online indicator next to User B if they're online
- ✅ Gray offline indicator if User B is offline
- ✅ Status updates in real-time when User B connects/disconnects

---

## 🔍 Debugging

### Check WebSocket Connection

**Browser Console:**

```javascript
// Check if connected
webSocketService.isConnected; // Should be true

// Check connection state
webSocketService.connectionState; // Should be "connected"
```

### Monitor Online Users

**Browser Console:**

```javascript
// In a component that uses WebSocketContext
const { onlineUsers } = useWebSocket();
console.log("Online users:", Array.from(onlineUsers.entries()));
```

### Server-Side Logs

**Look for these logs in message-service:**

```
✅ User John Doe (userId123) connected to messaging
📋 Sending online users list: [...]
🔌 WebSocket server listening on port 8001
```

### Database Check

**PostgreSQL Query:**

```sql
SELECT
  id,
  username,
  "isOnline",
  "lastSeen",
  "createdAt"
FROM users
WHERE "isOnline" = true
ORDER BY "lastSeen" DESC;
```

---

## 📊 Architecture

### Data Flow

#### **Connection Flow:**

```
1. User opens app
   ↓
2. AuthProvider gets token
   ↓
3. WebSocketContext calls connect()
   ↓
4. WebSocket connects to ws://localhost:8001/ws?token=...
   ↓
5. Backend: handleConnection()
   - Verify JWT token
   - Add to connectedUsers Map
   - Mark user online in DB ✅
   - Get list of online users ✅
   - Send onlineUsersList event ✅
   - Broadcast userOnline to others
   ↓
6. Frontend: handleOnlineUsersList()
   - Populate onlineUsers Map ✅
   ↓
7. Frontend: handleUserOnline()
   - Update existing user status
   ↓
8. UI: useUserOnlineStatus(userId)
   - Returns true if user in onlineUsers Map
```

#### **Disconnection Flow:**

```
1. User closes tab / loses connection
   ↓
2. Backend: handleDisconnect()
   - Remove from connectedUsers Map
   - Mark user offline in DB
   - Broadcast userOffline to others
   ↓
3. Frontend: handleUserOffline()
   - Update onlineUsers Map (isOnline: false)
   ↓
4. UI: Shows offline indicator
```

### Key Components

#### **Backend:**

- **File:** `services/message-service/src/gateway/messaging.gateway.ts`
- **Port:** 8001 (WebSocket)
- **Methods:**
  - `handleConnection()` - Process new connections
  - `handleDisconnect()` - Process disconnections
  - `markUserOnlineInDatabase()` - Update DB on connect ✅ NEW
  - `markUserOfflineInDatabase()` - Update DB on disconnect
  - `broadcastToAllExcept()` - Send to all except sender

#### **Frontend:**

- **WebSocket Service:** `apps/web/src/lib/webSocketService.ts`

  - Manages WebSocket connection
  - Emits events to subscribers
  - Handles reconnection logic

- **WebSocket Context:** `apps/web/src/contexts/WebSocketContext.tsx`

  - React context for WebSocket state
  - Manages `onlineUsers` Map ✅ UPDATED
  - Manages `typingUsers` Map
  - Provides hooks: `useWebSocket()`, `useUserOnlineStatus()`

- **UI Components:**
  - `ChatDrawer.tsx` - Main chat interface
  - `ConversationList.tsx` - Shows online indicators
  - `NewChatModal.tsx` - Shows online status when selecting users
  - `UserCard.tsx` - Generic user card with online indicator

### Database Schema

**User Model (`packages/db/prisma/schema.prisma`):**

```prisma
model User {
  id         String    @id @default(cuid())
  username   String    @unique
  isOnline   Boolean   @default(false)  // ✅ Updated by WebSocket
  lastSeen   DateTime?                  // ✅ Updated on connect/disconnect
  // ... other fields
}
```

---

## 🚀 Performance Considerations

### Scalability

**Current Implementation:**

- ✅ In-memory `connectedUsers` Map on each server instance
- ✅ Works well for single-server deployments
- ⚠️ **For multi-server:** Need Redis for shared state

**Multi-Server Solution (Future):**

```typescript
// Use Redis to track online users across servers
await redisService.sadd("online_users", userId);
await redisService.publish("user_online", { userId, username });
```

### Network Efficiency

- **Bulk list sent once** on connection (not repeated)
- **Incremental updates** for online/offline events
- **No polling** - pure WebSocket push notifications
- **Lightweight payloads** - only userId and username

### Memory Usage

- **Per User:** ~100 bytes (userId, username, socket reference)
- **1000 concurrent users:** ~100KB memory
- **10,000 concurrent users:** ~1MB memory

---

## 🔧 Configuration

### Environment Variables

**Message Service (`.env`):**

```bash
# WebSocket server port
PORT=8001

# JWT secret for authentication
JWT_SECRET=your-secret-key

# User service URL for marking offline
USER_SERVICE_URL=http://localhost:3003
```

**Frontend (`.env.local`):**

```bash
# WebSocket URL
NEXT_PUBLIC_WS_URL=ws://localhost:8001/ws

# For production
# NEXT_PUBLIC_WS_URL=wss://yourdomain.com/ws
```

---

## 📝 Known Limitations

1. **Single Server Only:** Current implementation uses in-memory state. For multi-server deployments, Redis integration is needed.

2. **No Offline Queue:** If a user goes offline briefly, they won't receive missed online/offline events. Only current state is sent on reconnection.

3. **Browser Tab Behavior:** Each browser tab creates a separate WebSocket connection. A user with 3 tabs open counts as 1 online user (correct), but creates 3 socket connections.

4. **Network Delays:** Online status updates depend on network speed. Typical latency is <100ms on good connections.

---

## 🎯 Future Enhancements

### 1. Redis Integration for Multi-Server

```typescript
// Track online users in Redis
await redis.sadd("online_users", userId);

// Publish to all servers
await redis.publish("user_status", {
  event: "userOnline",
  userId,
  username,
});
```

### 2. Last Seen Timestamp Display

```typescript
// Show "Last seen X minutes ago"
const lastSeenText = formatLastSeen(user.lastSeen);
```

### 3. "Away" Status

```typescript
// Detect user idle for 5+ minutes
if (idleTime > 5 * 60 * 1000) {
  status = "away";
}
```

### 4. Mobile Push Notifications

```typescript
// When user goes offline on desktop, enable mobile push
if (!isOnline && hasMobileApp) {
  enablePushNotifications(userId);
}
```

---

## 📚 Related Documentation

- [WebSocket Implementation](./websocket-implementation.md)
- [Message Service README](./README.md)
- [WebSocket Migration Summary](./websocket-migration-summary.md)
- [Chat Features Documentation](../frontend/dm.md)

---

## ✅ Summary

### What Was Fixed

1. ✅ Backend now marks users online in database on WebSocket connection
2. ✅ Backend sends bulk list of currently online users to new connections
3. ✅ Frontend populates `onlineUsers` Map immediately on connection
4. ✅ Online status displays correctly from the first moment
5. ✅ Database and WebSocket state stay in sync

### Testing Checklist

- [x] Multiple users see each other online immediately
- [x] Page refresh doesn't break online status
- [x] Disconnection marks user offline correctly
- [x] Database `isOnline` field updates properly
- [x] Conversation list shows correct online indicators
- [x] No race conditions or timing issues

### Files Modified

1. `/services/message-service/src/gateway/messaging.gateway.ts`
2. `/apps/web/src/lib/webSocketService.ts`
3. `/apps/web/src/contexts/WebSocketContext.tsx`

---

**Fix verified and tested:** ✅ November 2, 2025
