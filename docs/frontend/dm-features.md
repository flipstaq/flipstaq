# DM Features - Frontend Documentation

## Overview

This document covers the main features of the Direct Messaging (DM) system frontend, including reply functionality and paste-to-upload image support.

## Reply Feature

The DM reply feature allows users to reply to specific messages in conversations, creating a threaded conversation experience. Users can see which message they're replying to and easily navigate to the original message.

### User Experience Flow

#### Replying to a Message

1. **Context Menu**: Right-click or tap on any message to open the context menu
2. **Select Reply**: Click the "Reply" option (📨 icon)
3. **Reply Preview**: A reply preview appears above the message input showing:
   - The original message content (truncated if long)
   - The original sender's username
   - A close button to cancel the reply
4. **Type Response**: Type the reply message in the input field
5. **Send Reply**: Submit the message - it will include the reply reference

### Viewing Replies

1. **Reply Indicator**: Messages that are replies show a gray preview box above the message content
2. **Original Message Preview**: Shows:
   - "Replied to @username" text
   - Truncated content of the original message
   - Hover effect for interactivity
3. **Navigate to Original**: Click the reply preview to scroll to and highlight the original message
4. **Visual Highlight**: The original message briefly pulses when navigated to

### Real-time Updates

- Replies are sent via WebSocket with the `messageReplied` event
- Reply messages appear instantly for all conversation participants
- Reply preview information is included in real-time message data

## Technical Implementation

### Frontend Components

#### ChatDrawer.tsx

- Manages reply state (`replyingTo`)
- Handles reply selection (`handleReplyToMessage`)
- Handles reply cancellation (`handleCancelReply`)
- Passes reply data to MessageInput and MessageList

#### MessageList.tsx

- Displays reply previews above message content
- Handles click-to-scroll functionality for reply navigation
- Passes `onReply` callback to MessageContextMenu

#### MessageContextMenu.tsx

- Shows "Reply" option for all messages
- Calls `onReply` callback when selected

#### MessageInput.tsx

- Shows reply preview when replying
- Includes cancel button for reply preview
- Sends `replyToMessageId` with message payload

### WebSocket Events

#### Client → Server

```javascript
// Send reply message
{
  event: 'sendMessage',
  payload: {
    content: 'Thanks for the info!',
    conversationId: 'conv-123',
    replyToMessageId: 'msg-456'  // Reference to original message
  }
}
```

#### Server → Client

```javascript
// Receive reply message
{
  event: 'messageReplied',
  data: {
    id: 'msg-789',
    content: 'Thanks for the info!',
    senderId: 'user-123',
    conversationId: 'conv-123',
    replyToMessageId: 'msg-456',
    replyToMessage: {
      id: 'msg-456',
      content: 'The product is available',
      senderId: 'user-456',
      senderUsername: 'johndoe'
    },
    createdAt: '2025-06-25T...',
    sender: { /* sender info */ }
  }
}
```

### Data Types

#### Message Interface

```typescript
interface Message {
  id: string;
  content?: string;
  senderId: string;
  conversationId: string;
  replyToMessageId?: string;
  replyToMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderUsername: string;
  };
  createdAt: Date;
  // ... other fields
}
```

#### Reply State

```typescript
interface ReplyState {
  id: string;
  content: string;
  senderId: string;
  senderUsername: string;
}
```

### Styling

#### Reply Preview (above message content)

- Light blue/gray background for regular messages
- Slightly transparent background for own messages
- Border-left accent color
- Hover effect for interactivity
- Truncated text with ellipsis

#### Reply Preview (in message input)

- Secondary background color
- Reply icon indicator
- Username display
- Cancel button (X icon)
- Responsive layout

## Accessibility

- **Keyboard Navigation**: Reply option accessible via keyboard
- **Screen Readers**: Proper aria-labels for reply indicators
- **Focus Management**: Focus moves to input when replying
- **Visual Indicators**: Clear visual distinction for reply content

## Internationalization

The feature supports multiple languages through translation keys:

- `chat:reply` - "Reply" button text
- `chat:replying_to` - "Replying to" prefix text
- `chat:cancel_reply` - Cancel reply button tooltip
- `chat:replied_to` - "replied to" text in message previews

Available in both English and Arabic with proper RTL support.

## Error Handling

- Invalid reply targets (deleted messages) show error
- Network failures during reply send show retry option
- Graceful degradation if reply preview fails to load
- Fallback to regular message if reply data is missing

## Performance Considerations

- Reply previews are virtualized with the message list
- Original message lookup uses document.getElementById for fast scrolling
- WebSocket events are debounced to prevent spam
- Message content is truncated for performance in large conversations

---

## Paste-to-Upload Image Feature

### Overview

The paste-to-upload feature allows users to directly paste images from their clipboard (screenshots, copied images) into the message input using Ctrl+V (or ⌘+V on Mac), similar to Discord, WhatsApp, and Telegram.

### User Experience Flow

1. **Copy Image**: User copies an image to clipboard (screenshot, right-click copy, etc.)
2. **Paste in Input**: User clicks in the message input and presses Ctrl+V (⌘+V)
3. **Automatic Processing**: System automatically detects the image and adds it to the file queue
4. **Visual Feedback**:
   - Green success message appears: "Image pasted successfully! Ready to send."
   - Image appears in the file preview section
   - Success message auto-dismisses after 3 seconds
5. **Send Message**: User can add text and send the message with the pasted image

### Technical Implementation

#### Event Handling

The paste functionality is implemented in `MessageInput.tsx`:

```typescript
const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  // Look for image files in the pasted content
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Check if the item is an image file
    if (item.kind === "file" && item.type.startsWith("image/")) {
      e.preventDefault(); // Prevent default paste behavior for images

      const file = item.getAsFile();
      if (!file) continue;

      // Validation logic...
      // Add to file queue...
    }
  }
};
```

#### File Processing

1. **File Creation**: Pasted image gets a generated filename: `pasted-image-{timestamp}.{extension}`
2. **Validation**: Same validation as manual file selection:
   - File size limit: 10MB
   - Supported formats: JPEG, JPG, PNG, WebP, GIF
   - Maximum 10 files per message
3. **Integration**: Uses existing file upload infrastructure

#### Visual Feedback

- **Success Message**: Green banner with confirmation text
- **File Preview**: Image appears in the standard file preview section
- **Placeholder Hint**: Input placeholder shows paste hint when no files selected
- **Error Handling**: Red banner for validation failures

### Security Considerations

- **File Type Validation**: Only image files are accepted from clipboard
- **Size Limits**: Same 10MB limit as manual uploads
- **Format Restriction**: Limited to safe image formats
- **Non-Image Rejection**: Text and other content types are ignored

### Accessibility

- **Keyboard Accessible**: Works with standard Ctrl+V shortcut
- **Screen Reader Support**: Success/error messages are announced
- **Visual Indicators**: Clear success/error feedback
- **Graceful Degradation**: Falls back to manual file selection if paste fails

### Browser Compatibility

- **Modern Browsers**: Full support in Chrome, Firefox, Safari, Edge
- **Clipboard API**: Uses standard ClipboardEvent.clipboardData
- **Fallback**: Manual attachment button remains available

### Internationalization

Translation keys for the paste feature:

- `chat:image_paste_success` - Success message after pasting
- `chat:paste_image_hint` - Hint text in placeholder
- `chat:file_too_large` - Error for oversized files
- `chat:file_type_not_supported` - Error for unsupported formats
- `chat:max_files_exceeded` - Error when file limit reached

Available in English and Arabic with proper RTL support.

### Integration with Existing Features

- **File Upload System**: Reuses existing upload service and validation
- **Reply System**: Works seamlessly with message replies
- **Attachment UI**: Images appear in same preview section as manual attachments
- **Send Logic**: No changes needed - images are treated as regular attachments

### Performance Considerations

- **Memory Efficient**: Uses File API directly, no base64 conversion
- **Preview Optimization**: Object URLs are created and cleaned up properly
- **Upload Queue**: Integrates with existing upload queue system
- **Auto-cleanup**: Success messages auto-dismiss to avoid UI clutter

---

## Emoji Reactions Feature

The emoji reactions feature allows users to react to messages with emojis, providing a quick way to express emotions or acknowledgment without sending a separate message.

### User Experience Flow

#### Adding a Reaction

1. **Hover Over Message**: Hover over any message to reveal the reaction button next to the context menu
2. **Click Reaction Button**: Click the smiley face (😊) icon that appears on hover
3. **Choose Emoji**: Select from 6 quick emojis: 👍, ❤️, 😂, 😮, 😢, 😡
4. **Instant Feedback**: The reaction appears immediately below the message
5. **Real-time Sync**: All users in the conversation see the reaction in real-time

**Alternative Method:**

1. **Context Menu**: Right-click or click the three dots menu on any message
2. **Select React**: Click the "React" option (😊 icon)
3. **Emoji Picker Opens**: A picker with 6 emojis appears below the message: 👍, ❤️, 😂, 😮, 😢, 😡
4. **Select Emoji**: Click on any emoji to react
5. **Instant Reaction**: The reaction is applied immediately and picker closes

#### Removing a Reaction

1. **Click Same Emoji**: Click the same emoji you've already reacted with
2. **Instant Removal**: The reaction disappears immediately
3. **Real-time Update**: All users see the reaction removal

#### Viewing Reactions

1. **Grouped Display**: Reactions are grouped by emoji type with counts
2. **User List**: Hover over a reaction to see who reacted with that emoji
3. **Current User Highlight**: Your own reactions are highlighted in primary color
4. **Compact Layout**: Multiple reactions display in a compact row below messages

### Technical Implementation

#### Components

**EmojiPickerPortal.tsx** _(Enhanced)_

- Full emoji picker component using React Portal (same as MessageInput)
- Complete emoji categories: Smileys, People, Nature, Symbols
- Category-based navigation with tabs for better organization
- Grid layout with comprehensive emoji selection
- Automatically calculates optimal positioning to avoid viewport overflow
- Handles click-outside closing behavior
- Provides consistent emoji selection across all trigger methods
- Supports both hover and context menu activation

**EmojiReactionButton.tsx** _(Enhanced)_

- Uses the new EmojiPickerPortal for consistent positioning
- Handles both internal state and external control (for context menu)
- Provides proper portal-based overflow handling
- Supports bidirectional communication with parent components
- Automatically positions picker above or below based on available space

**MessageReactions.tsx** _(Simplified)_

- Focused solely on displaying existing reactions
- Removed deprecated emoji picker functionality
- Cleaner component with single responsibility
- Shows reaction counts and user information
- Provides tooltip with user names

**MessageContextMenu.tsx** _(Unchanged)_

- Includes "React" option alongside Reply, Edit, Delete
- Uses Smile icon for visual consistency
- Triggers EmojiReactionButton when React is selected

**MessageList.tsx** _(Updated)_

- Simplified state management for emoji picker visibility
- Uses single EmojiReactionButton component for both hover and context menu
- Handles real-time reaction updates via WebSocket
- Manages emoji picker visibility coordination between hover and context menu

**ChatDrawer.tsx** _(Unchanged)_

- Manages overall message state including reactions
- Provides message update handler for reaction changes
- Passes current user ID for reaction ownership detection

#### Portal-Based Positioning

The new implementation uses React Portal to render the emoji picker in `document.body`, ensuring proper positioning and avoiding overflow issues:

```typescript
// Automatic positioning calculation
const calculatePosition = () => {
  const triggerRect = triggerRef.current.getBoundingClientRect();
  const pickerWidth = 240;
  const pickerHeight = 60;

  // Smart positioning to stay within viewport
  let left = triggerRect.left;
  let top = triggerRect.top - pickerHeight - 8;

  // Adjust for viewport overflow
  if (left + pickerWidth > window.innerWidth) {
    left = triggerRect.right - pickerWidth;
  }
  if (top < 0) {
    top = triggerRect.bottom + 8; // Place below if no space above
  }

  return { top, left };
};
```

#### Real-time Updates

```typescript
// Subscribe to reaction events
useEffect(() => {
  const unsubscribe = onMessageReaction((reactionEvent) => {
    // Update local message state with new reaction data
    if (reactionEvent.action === "added") {
      // Add new reaction to message
    } else if (reactionEvent.action === "removed") {
      // Remove reaction from message
    }
  });
  return unsubscribe;
}, []);
```

#### WebSocket Integration

- **toggleReaction**: Sends reaction toggle request to server
- **messageReaction**: Receives real-time reaction updates
- **Action Types**: 'added' or 'removed' for proper state management

### Internationalization

Translation keys for reactions:

- `chat:add_emoji` - Tooltip for reaction button
- `chat:react` - Context menu "React" option text
- `chat:reacted_with` - Accessibility text for reactions
- `chat:reaction_by` - User attribution text

Available in English and Arabic with proper RTL support.

### Validation & Security

- **Built-in Emojis Only**: Only system emojis are allowed, no external sources
- **One Reaction Per Emoji**: Users can only react once per emoji per message
- **Message Ownership**: Users cannot react to deleted messages
- **Rate Limiting**: Prevents spam reactions through backend validation

### Accessibility

- **Keyboard Navigation**: All reaction buttons are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and announcements
- **High Contrast**: Reactions are visible in both light and dark themes
- **Tooltips**: Clear descriptions of reaction counts and users

### Performance

- **Optimistic Updates**: Reactions appear immediately before server confirmation
- **Efficient Re-renders**: Only affected messages re-render on reaction changes
- **Memory Management**: Proper cleanup of event listeners and subscriptions
- **Debouncing**: Prevents rapid-fire reaction toggles

### UI/UX Design

- **Hover Reveal**: Reaction button appears on message hover next to the context menu
- **Context Menu Integration**: "React" option available in message context menu
- **Portal-Based Positioning**: Emoji picker uses React Portal for optimal placement
- **Smart Overflow Handling**: Picker automatically repositions to stay within viewport
- **Smooth Animations**: Subtle scale animations on hover and click
- **Color Coding**: Current user reactions highlighted with primary color
- **Compact Layout**: Reactions don't overwhelm the message content
- **Responsive**: Works seamlessly on mobile and desktop devices
- **Visual Hierarchy**: Reaction button visually grouped with other message actions
- **Consistent Experience**: Same picker behavior for both hover and context menu triggers
- **No Layout Shift**: Portal rendering prevents layout disruption
- **Backdrop Blur**: Subtle visual separation when picker is open

## Context Menu Interaction Fix

### Issue Resolution

Fixed a critical UX issue where the chat drawer would close when users interacted with message context menu options (reply, emoji, copy, delete).

### Problem

- Users would right-click on messages to access the context menu
- Clicking any context menu option would unexpectedly close the entire chat drawer
- This was caused by the ChatDrawer's outside click detection treating portal-rendered elements as "outside" clicks

### Solution

Enhanced the ChatDrawer's outside click handler to exclude specific portal elements:

```typescript
// Exclude context menu clicks
const contextMenu = clickedElement.closest("[data-message-context-menu]");
if (contextMenu) return;

// Exclude emoji picker clicks
const emojiPicker = clickedElement.closest("[data-emoji-picker-portal]");
if (emojiPicker) return;

// Exclude modal clicks
const modal = clickedElement.closest('[role="dialog"], .modal, [data-modal]');
if (modal) return;
```

### Implementation Details

1. **MessageContextMenu**: Added `data-message-context-menu` attribute to the portal element
2. **EmojiPickerPortal**: Added `data-emoji-picker-portal` attribute to the portal element
3. **ReportModal**: Added `role="dialog"` attribute for proper modal identification
4. **ChatDrawer**: Enhanced outside click detection to check for these attributes

### Result

- Users can now freely interact with all context menu options
- Chat drawer remains open during message actions
- Improved overall user experience and reduced accidental drawer closures
- No impact on legitimate outside clicks that should close the drawer

---

### 🚫 User Blocking Overlay

#### Complete Chat Area Coverage

- **Problem**: When blocking a user, only certain elements were blocked, leaving gaps where the background was still visible
- **Solution**: Added a comprehensive blocking overlay that covers the entire chat area
- **Implementation**: Full-screen overlay with backdrop blur and centered unblock modal

#### Blocking Overlay Features

```typescript
// Full chat area coverage with Z-index layering
{blockStatus.isBlocked && (
  <div className="absolute inset-0 z-10 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center">
    <div className="text-center bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-xl">
      {/* Unblock UI */}
    </div>
  </div>
)}
```

#### User Experience

- **Complete Coverage**: Overlay covers all chat interface elements without gaps
- **Clear Messaging**: Explains why content is blocked and how to unblock
- **Easy Unblock**: Prominent button to unblock the user instantly
- **Visual Polish**: Backdrop blur and professional modal design
- **Responsive**: Works seamlessly across all device sizes
- **Theme Support**: Proper dark/light mode styling

#### API Integration Fix

- **Problem**: The unblock button in the overlay only updated local state but didn't call the API
- **Solution**: Enhanced `useBlockStatus` hook to include proper API calls
- **Implementation**: Added async `updateBlockStatus` function with loading states

#### Enhanced User Experience

```typescript
// Proper API integration with loading states
const updateBlockStatus = async (isBlocked: boolean) => {
  setIsLoading(true);
  try {
    if (isBlocked) {
      await apiClient.request('/users/blocks', { method: 'POST', ... });
    } else {
      await apiClient.request(`/users/blocks/${targetUserId}`, { method: 'DELETE' });
    }
    setBlockStatus(prev => ({ ...prev, isBlocked }));
  } finally {
    setIsLoading(false);
  }
};
```

#### Loading State Management

- **Button Disabled**: During API calls to prevent multiple requests
- **Loading Spinner**: Visual feedback while processing unblock request
- **Error Handling**: Proper error logging and user feedback
- **Optimistic Updates**: UI updates immediately after successful API response

#### Translation Support

Added comprehensive translations for blocking states:

- `user_blocked`: "User Blocked" / "المستخدم محظور"
- `blocked_user_message`: Explanation text

## Block/Unblock Error Handling Improvements

### Enhanced Error Recovery

The block/unblock system now includes robust error handling to gracefully manage state mismatches and API inconsistencies.

#### Error Types Handled

1. **"Block not found"**: When trying to unblock a user who is already unblocked
2. **"Already blocked"**: When trying to block a user who is already blocked
3. **"Already unblocked"**: When trying to unblock a user who is already unblocked
4. **Network errors**: Temporary connection issues
5. **Server errors**: Backend processing failures

#### Auto-Recovery Logic

```typescript
// Enhanced error handling in useBlockStatus hook
if (
  errorMessage.includes("already blocked") ||
  errorMessage.includes("already unblocked") ||
  errorMessage.includes("Block not found") ||
  errorMessage.includes("not found")
) {
  console.log("🔄 State mismatch detected, refetching block status...");
  await fetchBlockStatus();

  // Treat certain errors as success states
  if (errorMessage.includes("Block not found") && !isBlocked) {
    console.log(
      "✅ Block not found when unblocking - user is already unblocked"
    );
    return; // Don't re-throw the error, treat as success
  }

  if (
    (errorMessage.includes("already blocked") && isBlocked) ||
    (errorMessage.includes("already unblocked") && !isBlocked)
  ) {
    console.log("✅ User already in desired state - treating as success");
    return; // Don't re-throw the error, treat as success
  }
}
```

#### User Experience Benefits

- **Silent Recovery**: State mismatches are resolved automatically without user intervention
- **Reduced Errors**: Users don't see error messages for non-critical state sync issues
- **Consistent State**: UI always reflects the actual server state after operations
- **Better Reliability**: System is more tolerant of race conditions and timing issues

#### Error Logging

- **Debug Information**: Detailed console logs for troubleshooting
- **State Tracking**: Block status changes are logged with user context
- **Recovery Actions**: Automatic refetch attempts are logged for monitoring

#### Fallback Behavior

- **Success Treatment**: "Block not found" when unblocking is treated as success
- **State Synchronization**: Automatic status refetch ensures UI consistency
- **Graceful Degradation**: System continues to function even with API inconsistencies

This enhancement significantly improves the reliability of the blocking system and provides a smoother user experience by automatically handling common edge cases and state synchronization issues.

## Duplicate API Call Fix

### Issue Identified

Users were experiencing "User is already blocked" errors even when blocking users for the first time. This was caused by duplicate API calls:

1. **BlockButton** component made its own API call to block/unblock
2. **BlockButton** then called `onBlockChange(updateBlockStatus)`
3. **useBlockStatus** hook made a SECOND API call to the same endpoint
4. The second call failed with "User is already blocked" because the first call succeeded

### Root Cause Analysis

```typescript
// OLD - Problematic flow:
const handleBlockAction = async () => {
  // 1. BlockButton makes API call
  await apiClient.request('/users/blocks', { method: 'POST', ... });

  // 2. BlockButton calls hook's updateBlockStatus
  onBlockChange(!isBlocked); // This calls updateBlockStatus again!
}

// useBlockStatus hook
const updateBlockStatus = async (isBlocked: boolean) => {
  // 3. Hook makes ANOTHER API call (fails with "User is already blocked")
  await apiClient.request('/users/blocks', { method: 'POST', ... });
}
```

### Solution Implemented

Refactored BlockButton to delegate all API calls to the useBlockStatus hook:

```typescript
// NEW - Single API call flow:
const handleBlockAction = async () => {
  // BlockButton delegates to hook's updateBlockStatus
  await onBlockChange(!isBlocked);
  // No duplicate API calls!
};
```

### Changes Made

1. **BlockButton.tsx**:

   - Removed duplicate API calls (`apiClient.request`)
   - Updated interface: `onBlockChange: (isBlocked: boolean) => Promise<void>`
   - Now awaits the hook's `updateBlockStatus` function
   - Removed unused `apiClient` import

2. **useBlockStatus.ts**:

   - Enhanced logging for better debugging
   - Added state reset when targetUserId changes
   - Added `reset` function for manual state clearing
   - Improved error context logging

3. **Type Safety**:
   - Updated BlockButton interface to reflect async nature
   - All components type-check successfully

### Benefits

- **No More Duplicate Errors**: Eliminated "User is already blocked" errors
- **Single Source of Truth**: All block/unblock logic centralized in useBlockStatus hook
- **Better Error Handling**: Enhanced logging and state management
- **Cleaner Architecture**: Clear separation of concerns between UI and API logic

### Debug Logging Added

The enhanced logging helps troubleshoot any remaining issues:

```typescript
console.log(
  `🔄 Attempting to ${isBlocked ? "block" : "unblock"} user ${targetUserId}`
);
console.log("📊 Block status received:", data);
console.error("📊 Context:", { targetUserId, currentStatus, attemptedAction });
```

This fix ensures reliable block/unblock functionality and eliminates the confusing error messages users were experiencing.

## Smooth User Switching Transitions

### Enhanced User Experience

Added smooth animations and transitions throughout the DM chat interface to provide a polished experience when switching between conversations.

#### Implementation Details

**Chat Container Transitions**:

```tsx
// Main chat area with smooth transitions
<div
  className="relative flex h-full flex-1 flex-col transition-all duration-300 ease-in-out transform opacity-100"
  key={selectedConversation.id}
>
  {/* Content with conversation-specific key for smooth transitions */}
</div>
```

**Header Transitions**:

- User name and status information animate smoothly when switching conversations
- Online/offline status indicators transition with color changes
- Action buttons (block, report) fade in/out with conversation changes

**Message Area Transitions**:

- Message list container has smooth opacity and transform transitions
- Each conversation gets a unique key to trigger proper re-rendering
- Typing indicators fade in/out smoothly

**Input Area Transitions**:

- Message input area transitions smoothly between conversations
- Reply preview area maintains smooth animations

#### Key Features

1. **Conversation-Specific Keys**: Each UI section uses the conversation ID as a React key to ensure proper component mounting/unmounting with transitions

2. **Unified Animation Timing**: All transitions use `duration-300 ease-in-out` for consistent feel

3. **Transform + Opacity**: Combines opacity and transform for smooth visual effects

4. **Blocking Overlay Animations**: Even the blocking overlay has smooth scale and opacity transitions

5. **Status Indicator Transitions**: Online/offline status changes with smooth color transitions

#### CSS Classes Used

```css
transition-all duration-300 ease-in-out
transform opacity-100
transition-colors duration-300
```

#### Performance Considerations

- Transitions are hardware-accelerated using `transform` and `opacity`
- React keys ensure components are properly recycled between conversations
- Animations are kept lightweight to maintain 60fps performance
- No layout thrashing with CSS transitions only affecting composite properties

This enhancement creates a modern, polished chat experience that feels responsive and smooth when switching between different conversations.

## Transition Refinement

### Issue Resolution

Initially added comprehensive transitions throughout the chat interface, but some were too aggressive and interfered with interactive elements like the block button functionality.

### Problems Identified

1. **Over-aggressive transitions**: Transform and opacity changes on interactive containers
2. **Button interference**: Transition effects on action button containers caused functionality issues
3. **Performance impact**: Too many simultaneous transition effects

### Solution Applied

**Selective Transition Strategy**: Applied transitions only where they enhance UX without interfering with functionality:

```typescript
// KEPT - Main conversation switching (subtle)
className = "transition-opacity duration-200 ease-in-out";

// KEPT - Status color changes
className = "transition-colors duration-200";

// REMOVED - Interactive button containers
// OLD: className="transform opacity-100 transition-all duration-300"
// NEW: No transitions on button containers

// KEPT - Blocking overlay (essential for UX)
className = "transition-opacity duration-200 ease-in-out";
```

### Refined Implementation

1. **Chat Container**: Light opacity transition for conversation switching
2. **Status Indicators**: Color-only transitions for online/offline status
3. **Message Area**: Subtle opacity transition without transform effects
4. **Interactive Elements**: No transitions on button containers to preserve functionality
5. **Blocking Overlay**: Kept smooth fade-in/out for important state changes

### Benefits

- ✅ **Preserved Functionality**: Block/unblock buttons work reliably
- ✅ **Enhanced UX**: Smooth conversation switching remains
- ✅ **Better Performance**: Reduced simultaneous transition effects
- ✅ **Cleaner Animation**: Focused on meaningful transitions only
- ✅ **Stable Interactions**: No interference with user actions

The chat now provides **subtle, purposeful animations** that enhance the user experience without compromising functionality or performance.

## Message Loading and Conversation History

### Complete Conversation History

The DM system ensures that users see **all messages** from the beginning of any conversation, not just recent messages.

#### Loading Behavior

1. **First Load**: When opening a DM conversation, the system fetches all messages from the start of the conversation
2. **No Time Filtering**: Messages are loaded regardless of when they were sent (no "today only" or recent filtering)
3. **Chronological Order**: Messages are displayed in chronological order from oldest to newest
4. **Background Sync**: Fresh messages are fetched in the background to ensure real-time updates

#### Technical Implementation

- Backend fetches up to 1000 messages on first page load to ensure complete history
- Messages ordered by `createdAt ASC` for proper chronological display
- Frontend caches messages per conversation for instant switching
- WebSocket events update the cache in real-time

#### Cache Management

- **Per-conversation caching**: Messages cached separately for each conversation
- **Instant switching**: Cached messages allow immediate display when switching conversations
- **Memory cleanup**: Cache cleared when chat drawer is closed
- **Background updates**: Cache refreshed with latest messages on conversation selection

## Infinite Scroll for Older Messages

### Overview

For conversations with many messages, the system supports infinite scroll to load older messages efficiently without overwhelming the initial load.

### User Experience

1. **Scroll to Top**: When user scrolls to the very top of the message list
2. **Automatic Loading**: System automatically fetches the next batch of older messages
3. **Seamless Integration**: New messages appear at the top without disrupting scroll position
4. **Loading Indicator**: Shows "Loading older messages..." spinner during fetch

### Technical Implementation

#### Backend Cursor-Based Pagination

- Uses message `createdAt` timestamp for cursor-based pagination
- Fetches messages before a specific timestamp to get older messages
- Returns `hasMore` flag to indicate if more messages exist

```typescript
// Example API call
GET /messages/conversations/:id/messages/older?before=messageId&limit=50
```

#### Frontend Scroll Detection

- Monitors scroll position to detect when user reaches the top
- Preserves scroll position after loading new messages
- Prevents duplicate requests while loading

### Performance Considerations

- Only loads 50 messages per batch to maintain performance
- Uses cursor-based pagination for efficient database queries
- Caches loaded messages to prevent re-fetching

## Message Search

### Overview

Users can search for specific messages within a conversation using keywords or phrases.

### User Experience

1. **Search Button**: Click the search icon in the conversation header
2. **Modal Interface**: Opens a dedicated search modal with input field
3. **Real-time Results**: Shows results as user types (debounced)
4. **Highlighted Matches**: Search terms are highlighted in yellow in results
5. **Jump to Message**: Click any result to scroll to that message in the conversation

### Search Features

- **Case-insensitive**: Search ignores letter case
- **Partial matching**: Finds messages containing the search term
- **Result count**: Shows total number of matching messages
- **Message context**: Shows sender name, timestamp, and message preview
- **Highlighted text**: Visual highlighting of matching terms

### Technical Implementation

#### Backend Search

- Uses PostgreSQL `ILIKE` for case-insensitive search
- Searches only message content (not attachments or metadata)
- Returns up to 100 results ordered chronologically

```typescript
// Example API call
GET /messages/search?conversationId=xyz&query=keyword&limit=100
```

#### Frontend Search Interface

- Debounced search (300ms delay) to reduce API calls
- Modal overlay with dedicated search UI
- Auto-focus on search input when opened
- Real-time loading indicators

### Search Result Navigation and Modal Behavior

### Jump to Message Feature

When users select a search result, the system provides smooth navigation to the target message:

#### Implementation Details

1. **Search Result Selection**: When clicking on a search result:

   - The search modal closes automatically
   - The target message is highlighted with a yellow ring
   - The view scrolls smoothly to center the target message
   - The highlight effect fades after 3 seconds

2. **Visual Highlighting**:

   - Target message gets `ring-2 ring-yellow-400 ring-opacity-75 shadow-lg` classes
   - Smooth transitions ensure the highlight is noticeable but not jarring
   - Works with both light and dark themes

3. **Scroll Behavior**:
   - Uses `scrollIntoView({ behavior: 'smooth', block: 'center' })`
   - Centers the target message in the viewport
   - 100ms delay ensures the message is rendered before scrolling

### Modal Interaction Behavior

The search modal has intelligent interaction handling:

#### Outside Click Logic

1. **Backdrop Clicks**: Clicking the modal backdrop closes only the search modal
2. **Event Propagation**: Uses `e.stopPropagation()` to prevent backdrop clicks from bubbling to the chat drawer
3. **Chat Preservation**: The main chat drawer remains open when search closes
4. **Data Attributes**: Both backdrop and modal content have `data-message-search-modal` attribute for proper exclusion
5. **Event Handling**: Uses `e.target === e.currentTarget` to detect pure backdrop clicks

#### Search Modal Lifecycle

1. **Opening**: Auto-focuses the search input after 100ms delay
2. **Searching**: Debounced search with 300ms delay to reduce API calls
3. **Result Selection**: Closes modal and triggers navigation to message
4. **Manual Close**: X button or backdrop click closes the modal only

### Code Implementation

#### ChatDrawer.tsx - Message Selection Handler

```typescript
const handleMessageSearchSelect = (messageId: string) => {
  setHighlightedMessageId(messageId);
  setIsMessageSearchOpen(false); // Close search modal only

  // Scroll to message after short delay
  setTimeout(() => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, 100);

  // Clear highlight after 3 seconds
  setTimeout(() => {
    setHighlightedMessageId(null);
  }, 3000);
};
```

#### MessageSearch.tsx - Backdrop Click Handling

```typescript
<div
  data-message-search-modal
  className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  onClick={(e) => {
    // Only close search modal if clicking the backdrop, not the chat
    if (e.target === e.currentTarget) {
      e.stopPropagation(); // Prevent event from bubbling to chat drawer
      onClose();
    }
  }}
>
  <div
    data-message-search-modal
    className="mx-4 w-full max-w-2xl rounded-lg border border-secondary-200 bg-white shadow-xl dark:border-secondary-700 dark:bg-secondary-800"
    onClick={(e) => e.stopPropagation()}
  >
```

#### MessageList.tsx - Message Highlighting

```typescript
<div
  className={`group relative px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${
    // Add highlighting effect when message is highlighted
    highlightedMessageId === message.id
      ? 'ring-2 ring-yellow-400 ring-opacity-75 shadow-lg'
      : ''
  } ${/* other styling classes */}`}
>
```

### User Experience Benefits

1. **Intuitive Navigation**: Users can quickly jump to specific messages from search results
2. **Clear Visual Feedback**: Highlighted messages are easy to identify
3. **Preserved Context**: Chat stays open when search modal closes
4. **Smooth Interactions**: All transitions are smooth and responsive

### Browser Support

- **Scroll Behavior**: Modern browsers support smooth scrolling
- **Ring Effects**: CSS ring utilities work in all modern browsers
- **Event Handling**: Click event logic is universally supported
