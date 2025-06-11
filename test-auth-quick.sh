#!/bin/bash
# Quick test script for WebSocket authentication

echo "🧪 Testing Go BARRY WebSocket Authentication..."
echo ""

# Test 1: Create a test session
echo "1️⃣ Creating test session for Alex Woodcock..."
SESSION_RESPONSE=$(curl -s -X POST https://go-barry.onrender.com/api/supervisor/debug/test-session)
echo "Response: $SESSION_RESPONSE"
echo ""

# Extract session ID using grep and sed
SESSION_ID=$(echo $SESSION_RESPONSE | grep -o '"sessionId":"[^"]*' | sed 's/"sessionId":"//')

if [ -z "$SESSION_ID" ]; then
    echo "❌ Failed to create session!"
    exit 1
fi

echo "✅ Session created: $SESSION_ID"
echo ""

# Test 2: Check active sessions
echo "2️⃣ Checking active sessions..."
curl -s https://go-barry.onrender.com/api/supervisor/debug/sessions | python -m json.tool
echo ""

# Test 3: Check if display endpoint works
echo "3️⃣ Testing display screen data endpoint..."
DISPLAY_RESPONSE=$(curl -s https://go-barry.onrender.com/api/supervisor/active)
echo "Active supervisors: $DISPLAY_RESPONSE"
echo ""

echo "✅ All API tests complete!"
echo ""
echo "📝 Next steps:"
echo "1. Open https://gobarry.co.uk/display to see if supervisors appear"
echo "2. Check Render logs for WebSocket debug messages"
echo "3. Use the WebSocket Test page in the browser for real-time monitoring"
