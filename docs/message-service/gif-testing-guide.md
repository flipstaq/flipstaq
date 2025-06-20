# GIF Integration Testing Guide

## Current Implementation Status

✅ **GIF Browsing**: Public access (no authentication required)  
✅ **Backend API**: Fully functional with Tenor API integration  
✅ **Frontend**: GifSearchModal with search and trending GIFs  
⚠️ **GIF Sending**: Requires authentication (handled by message service)

### Design Decision

GIF browsing is intentionally public because:

- Users should be able to browse GIFs without authentication
- Authentication is enforced when actually sending GIFs via the message service
- This provides a better user experience for GIF discovery

## Testing

### 1. Backend API Testing

#### Test Tenor API Endpoints (No Authentication Required)

```bash
# Test trending GIFs
curl http://localhost:3100/api/v1/gifs/trending?limit=10

# Test GIF search
curl http://localhost:3100/api/v1/gifs/search?q=funny&limit=10

# Test categories
curl http://localhost:3100/api/v1/gifs/categories?limit=10
```

Expected response format:

```json
{
  "results": [
    {
      "id": "12345",
      "title": "Funny Cat",
      "url": "https://tenor.com/view/...",
      "gifUrl": "https://media.tenor.com/example.gif",
      "tags": ["funny", "cat", "animal"]
    }
  ],
  "next": "pagination_token"
}
```

#### Test File Upload with GIF

```bash
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.gif" \
  http://localhost:3100/api/v1/messages/upload
```

Expected response:

```json
{
  "fileUrl": "/uploads/messages/1234567890-123456.gif",
  "fileName": "test.gif",
  "fileType": "image/gif",
  "fileSize": 1024000
}
```

### 2. Frontend Testing

#### Test GIF Search Modal

1. Open a conversation in the chat
2. Click the GIF button (Image icon) next to emoji button
3. Verify trending GIFs load automatically
4. Type in search box and verify search results appear
5. Click on a GIF to send it
6. Verify GIF appears in chat with proper rendering

#### Test GIF File Upload

1. Click attachment button (paperclip icon)
2. Select a `.gif` file from your device
3. Verify file appears in preview
4. Send the message
5. Verify uploaded GIF displays correctly

#### Test GIF Display

1. Send both uploaded and Tenor GIFs
2. Verify both display correctly
3. Check that GIFs autoplay (if browser supports)
4. Test in both light and dark modes
5. Test responsive design on mobile

### 3. Error Handling Testing

#### Invalid API Key

- Set invalid `TENOR_API_KEY` in environment
- Verify graceful error handling in GIF search

#### Network Issues

- Disconnect internet while searching GIFs
- Verify error messages display properly
- Test retry functionality

#### Large File Upload

- Try uploading GIF larger than 10MB
- Verify proper error message

### 4. Performance Testing

#### GIF Loading

- Search for many GIFs
- Verify lazy loading works
- Check network tab for optimization

#### Memory Usage

- Open GIF modal multiple times
- Verify no memory leaks
- Check browser performance

### 5. Localization Testing

#### Arabic Translation

- Switch to Arabic language
- Verify all GIF-related text is translated
- Check RTL layout for GIF modal

#### Translation Keys

Verify these translation keys work:

- `chat:send_gif`
- `chat:search_gifs`
- `chat:trending_gifs`
- `chat:no_gifs_found`

### 6. Integration Testing

#### WebSocket Events

- Send GIF via Tenor API
- Verify real-time delivery to other user
- Check message structure includes correct fileUrl

#### Cross-browser Testing

- Test in Chrome, Firefox, Safari, Edge
- Verify GIF autoplay behavior
- Check modal responsiveness

### 7. Expected Issues & Solutions

#### GIF Not Displaying

- Check if fileUrl is external (starts with http)
- Verify image source handling in MessageList.tsx

#### Search Not Working

- Check TENOR_API_KEY in environment
- Verify network connectivity
- Check browser console for API errors

#### Upload Failing

- Verify file size under 10MB
- Check file type is .gif
- Ensure upload endpoint accepts image/gif

### 8. Successful Test Criteria

✅ Trending GIFs load on modal open
✅ Search returns relevant results
✅ GIF selection sends message immediately
✅ Both uploaded and Tenor GIFs display correctly
✅ Error handling works gracefully
✅ Mobile responsive design functions properly
✅ Real-time delivery via WebSocket
✅ Proper localization in both languages
✅ No console errors or warnings
✅ Performance is smooth and responsive

## Debugging Tips

### Check API Response

```javascript
// In browser console - Check if user is logged in
console.log("Token exists:", !!localStorage.getItem("token"));
console.log("Token value:", localStorage.getItem("token"));

// Test API call
fetch("/api/v1/gifs/trending", {
  headers: { Authorization: "Bearer " + localStorage.getItem("token") },
})
  .then((r) => {
    console.log("Response status:", r.status);
    if (!r.ok) {
      throw new Error(`HTTP ${r.status}: ${r.statusText}`);
    }
    return r.json();
  })
  .then(console.log)
  .catch(console.error);
```

### Monitor WebSocket

```javascript
// Check WebSocket connection
const ws = new WebSocket(
  "ws://localhost:8001/ws?token=" + localStorage.getItem("token")
);
ws.onmessage = (event) => {
  console.log("WebSocket message:", JSON.parse(event.data));
};
```

### Check Environment Variables

```bash
# In API Gateway container/process
echo $TENOR_API_KEY
```

This testing guide ensures comprehensive verification of the GIF integration feature across all components and use cases.
