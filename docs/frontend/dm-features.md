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
    if (item.kind === 'file' && item.type.startsWith('image/')) {
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
