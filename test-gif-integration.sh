#!/bin/bash

# GIF Integration Test Script
echo "🧪 Testing GIF Integration..."

# Test 1: Trending GIFs
echo "📈 Testing trending GIFs..."
response=$(curl -s -w "%{http_code}" "http://localhost:3100/api/v1/gifs/trending?limit=3")
status="${response: -3}"
body="${response%???}"

if [ "$status" = "200" ]; then
    echo "✅ Trending GIFs endpoint working"
    echo "📄 Sample response:"
    echo "$body" | jq '.results[0] | {id, title, gifUrl}' 2>/dev/null || echo "$body"
else
    echo "❌ Trending GIFs failed with status: $status"
    echo "Response: $body"
fi

echo

# Test 2: GIF Search
echo "🔍 Testing GIF search..."
response=$(curl -s -w "%{http_code}" "http://localhost:3100/api/v1/gifs/search?q=funny&limit=3")
status="${response: -3}"
body="${response%???}"

if [ "$status" = "200" ]; then
    echo "✅ GIF search endpoint working"
    echo "📄 Sample response:"
    echo "$body" | jq '.results[0] | {id, title, gifUrl}' 2>/dev/null || echo "$body"
else
    echo "❌ GIF search failed with status: $status"
    echo "Response: $body"
fi

echo

# Test 3: Frontend URL
echo "🌐 Frontend should be available at: http://localhost:3000"
echo "💬 To test GIF functionality:"
echo "   1. Go to chat page"
echo "   2. Click the GIF button in message input"
echo "   3. Search for GIFs or browse trending"
echo "   4. Select a GIF to send"

echo
echo "🎉 GIF Integration Test Complete!"
