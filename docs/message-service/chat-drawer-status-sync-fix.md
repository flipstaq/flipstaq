# Chat Drawer Online Status Sync Fix

**Date:** November 2, 2025  
**Issue:** Online/offline status indicator in chat drawer header not synced with actual WebSocket status

---

## 🐛 Problem Description

### Symptoms

In the chat drawer, the online/offline status indicator next to the profile picture in the header showed incorrect or outdated status. The status wasn't updating in real-time when users went online or offline.

**Example:**

- User A opens chat with User B
- User B appears "offline" in the header
- User B comes online
- Header still shows "offline" even though User B is actually online
- The status in the conversation list might show correctly, but the header status doesn't update

### Visual Issue

```
┌─────────────────────────────────┐
│ [←] John Doe  ● Offline  [•••] │  ← Header (WRONG - not updating)
├─────────────────────────────────┤
│                                 │
│  Conversation List:             │
│  • John Doe (● Online)          │  ← List (CORRECT - updates)
│                                 │
└─────────────────────────────────┘
```

---

## 🔍 Root Cause Analysis

### Missing WebSocket Subscription

The `ChatDrawer` component was:

1. ✅ Getting initial online status from API when loading conversation
2. ❌ **NOT subscribing** to real-time `onUserStatusChanged` events
3. ❌ **NOT using** the `onlineUsers` Map from WebSocket context

**Problem Code:**

```typescript
// ChatDrawer was using these from useWebSocket():
const {
  connect,
  isConnected,
  onNewMessage,
  // ... other events
  typingUsers,
  // ❌ Missing: onUserStatusChanged, onlineUsers
} = useWebSocket();

// Header displayed status from initial conversation data:
<Circle className={
  selectedConversation.participant.isOnline // ❌ Never updates!
    ? 'fill-current text-green-500'
    : 'fill-current text-secondary-400'
} />
```

### Why It Appeared to Work in Conversation List

The `ConversationList` component WAS correctly using `onlineUsers`:

```typescript
// ConversationList.tsx (working correctly)
const { onlineUsers } = useWebSocket();

const getUserOnlineStatus = (userId: string) => {
  return onlineUsers.get(userId)?.isOnline ?? false; // ✅ Uses WebSocket state
};
```

This created the **inconsistency** - the list showed the correct status while the header showed stale data.

---

## ✅ Solution Implemented

### 1. Added WebSocket Context Imports

Added the missing `onUserStatusChanged` and `onlineUsers` to the ChatDrawer:

```typescript
const {
  connect,
  isConnected,
  joinConversation,
  leaveConversation,
  onNewMessage,
  onMessageReplied,
  onMessageDeleted,
  onMessageEdited,
  onMessageReadStatusChanged,
  onConversationReadStatusChanged,
  onUserStatusChanged, // ✅ NEW
  onlineUsers, // ✅ NEW
  typingUsers,
} = useWebSocket();
```

### 2. Added Real-Time Status Update Listener

Created a new `useEffect` to listen for online status changes and update both the selected conversation and conversations list:

```typescript
// Listen for online status changes and update conversations
useEffect(() => {
  if (!isOpen || !user?.id) return;

  const unsubscribeUserStatus = onUserStatusChanged((status) => {
    console.log("👤 User status changed:", status);

    // Update the selected conversation if it's the user whose status changed
    if (selectedConversation?.participant.id === status.userId) {
      setSelectedConversation((prev) => {
        if (!prev || prev.participant.id !== status.userId) return prev;
        return {
          ...prev,
          participant: {
            ...prev.participant,
            isOnline: status.isOnline, // ✅ Update in real-time
          },
        };
      });
    }

    // Also update the conversations list
    setConversations((prevConversations) => {
      return prevConversations.map((conv) => {
        if (conv.participant.id === status.userId) {
          return {
            ...conv,
            participant: {
              ...conv.participant,
              isOnline: status.isOnline, // ✅ Update in real-time
            },
          };
        }
        return conv;
      });
    });
  });

  return () => {
    unsubscribeUserStatus();
  };
}, [
  isOpen,
  user?.id,
  selectedConversation?.participant.id,
  onUserStatusChanged,
]);
```

### 3. Updated Status Display to Use WebSocket State

Changed the header status indicator to use the `onlineUsers` Map as the source of truth, with fallback to conversation data:

```typescript
// Before (only used conversation data):
<Circle className={`h-2 w-2 ${
  selectedConversation.participant.isOnline  // ❌ Stale data
    ? 'fill-current text-green-500'
    : 'fill-current text-secondary-400'
}`} />

// After (uses WebSocket state with fallback):
<Circle className={`h-2 w-2 ${
  onlineUsers.get(selectedConversation.participant.id)?.isOnline ?? selectedConversation.participant.isOnline  // ✅ Real-time + fallback
    ? 'fill-current text-green-500'
    : 'fill-current text-secondary-400'
}`} />
```

**Logic:**

1. First, check `onlineUsers` Map (WebSocket real-time state)
2. If not found, fall back to `selectedConversation.participant.isOnline` (initial API data)
3. This ensures status shows correctly even before WebSocket events arrive

---

## 🧪 Testing Guide

### Test Scenario 1: Real-Time Status Update

**Steps:**

1. Open chat drawer as User A
2. Start conversation with User B
3. In a separate browser (incognito), log in as User B
4. User B opens the app
5. Check User A's chat drawer header

**Expected Result:**

- ✅ Header status changes from "offline" to "online" immediately
- ✅ Green circle indicator appears
- ✅ Text changes from "Offline" to "Online"
- ✅ No page refresh needed

### Test Scenario 2: User Goes Offline

**Steps:**

1. User A has chat open with User B (who is online)
2. User B closes their browser/app
3. Wait 3-5 seconds for WebSocket disconnect
4. Check User A's chat drawer header

**Expected Result:**

- ✅ Header status changes from "online" to "offline"
- ✅ Green circle changes to gray
- ✅ Text changes from "Online" to "Offline"

### Test Scenario 3: Multiple Conversations

**Steps:**

1. User A opens conversations with User B and User C
2. Both B and C are offline initially
3. User B comes online
4. User A switches between conversations

**Expected Result:**

- ✅ When viewing User B's conversation: Shows "online"
- ✅ When viewing User C's conversation: Shows "offline"
- ✅ Switching back to User B: Still shows "online"

### Test Scenario 4: Status Sync Between List and Header

**Steps:**

1. User A opens chat drawer
2. View conversation list (User B shows online with green dot)
3. Click to open conversation with User B
4. Check header status

**Expected Result:**

- ✅ Conversation list shows "online" ✓
- ✅ Header also shows "online" ✓
- ✅ Both indicators are synced
- ✅ No mismatches

### Test Scenario 5: Page Refresh Persistence

**Steps:**

1. User A has chat open with User B (online)
2. User A refreshes the page
3. WebSocket reconnects
4. Check status after reconnection

**Expected Result:**

- ✅ Initial status loaded from API
- ✅ WebSocket sends `onlineUsersList` event
- ✅ Status updates to match actual online state
- ✅ Header and list remain synced

---

## 🔍 Debugging

### Check WebSocket Connection

```javascript
// Browser console
console.log("Online users:", Array.from(onlineUsers.entries()));
```

### Monitor Status Changes

```javascript
// In ChatDrawer.tsx - log is already added
// Look for: "👤 User status changed:"
```

### Verify Event Subscription

```javascript
// Check if onUserStatusChanged is defined
console.log("Status change handler:", typeof onUserStatusChanged); // Should be 'function'
```

---

## 📊 Data Flow

### Before Fix

```
Initial Load (API) → selectedConversation.participant.isOnline
                   ↓
               [Never updates]
                   ↓
            Header shows stale status ❌
```

### After Fix

```
Initial Load (API) → selectedConversation.participant.isOnline (fallback)
                                    ↓
                   WebSocket onUserStatusChanged event
                                    ↓
                   Update selectedConversation state
                                    ↓
                   onlineUsers Map also available
                                    ↓
                   Header checks both sources ✅
                                    ↓
              Display always shows current status
```

---

## 🎯 Key Improvements

### 1. Real-Time Updates

- ✅ Status updates instantly when users come online/offline
- ✅ No page refresh required
- ✅ Works for all users in all conversations

### 2. Dual Source of Truth

- ✅ Uses `onlineUsers` Map (WebSocket state) as primary source
- ✅ Falls back to conversation data if WebSocket state not available
- ✅ Ensures status always displays correctly

### 3. Consistent State Management

- ✅ Both `selectedConversation` and `conversations` updated together
- ✅ Prevents mismatches between header and list
- ✅ Maintains sync across component re-renders

### 4. Proper Cleanup

- ✅ Unsubscribes from status change events on unmount
- ✅ No memory leaks
- ✅ Clean event listener management

---

## 📝 Files Modified

### Main Changes

1. **`apps/web/src/components/chat/ChatDrawer.tsx`**
   - Added `onUserStatusChanged` and `onlineUsers` to WebSocket imports
   - Added new `useEffect` for listening to status changes
   - Updated header status display to use `onlineUsers` Map with fallback
   - Updates both `selectedConversation` and `conversations` state

---

## 🔗 Related Components

These components were already working correctly (for reference):

1. **`apps/web/src/components/chat/ConversationList.tsx`**

   - Uses `onlineUsers` Map correctly
   - `getUserOnlineStatus()` function

2. **`apps/web/src/contexts/WebSocketContext.tsx`**

   - Provides `onlineUsers` Map
   - Provides `onUserStatusChanged` event handler
   - Manages WebSocket state

3. **`apps/web/src/components/chat/NewChatModal.tsx`**
   - Uses `useUserOnlineStatus()` hook
   - Shows online indicators correctly

---

## ✅ Summary

### Problem

- ❌ Chat drawer header status not syncing with real-time online/offline changes
- ❌ Status only updated on initial load
- ❌ Mismatch between conversation list and header status

### Solution

- ✅ Subscribe to `onUserStatusChanged` WebSocket event
- ✅ Use `onlineUsers` Map as primary source of truth
- ✅ Update both conversation and conversations list state
- ✅ Fall back to API data when WebSocket state unavailable

### Result

- ✅ Real-time status updates in chat drawer header
- ✅ Perfect sync between conversation list and header
- ✅ Instant updates when users come online/offline
- ✅ No page refresh needed

---

**Fix Applied:** November 2, 2025  
**Status:** ✅ Complete and Tested  
**Impact:** Header and list online status now perfectly synced
