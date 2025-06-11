#!/bin/bash
echo "🔍 Quick WebSocket Authentication Test"
echo ""

# Test 1: Create session
echo "1️⃣ Creating supervisor session..."
SESSION_RESPONSE=$(curl -s -X POST https://go-barry.onrender.com/api/supervisor/auth/login \
  -H "Content-Type: application/json" \
  -d '{"supervisorId":"supervisor001","badge":"AW001"}')

echo "Response: $SESSION_RESPONSE"
echo ""

# Test 2: Check sessions
echo "2️⃣ Checking active sessions..."
curl -s https://go-barry.onrender.com/api/supervisor/debug/sessions | python -m json.tool || echo "No JSON formatter available"
echo ""

# Test 3: WebSocket test instructions
echo "3️⃣ To test WebSocket manually:"
echo ""
echo "In browser console at https://gobarry.co.uk, run:"
echo ""
echo "// Test WebSocket connection"
echo "const ws = new WebSocket('wss://go-barry.onrender.com/ws/supervisor-sync');"
echo "ws.onopen = () => console.log('Connected!');"
echo "ws.onmessage = (e) => console.log('Message:', JSON.parse(e.data));"
echo "ws.onerror = (e) => console.log('Error:', e);"
echo ""
echo "// After connected, authenticate as display:"
echo "ws.send(JSON.stringify({type: 'auth', clientType: 'display'}));"
echo ""
echo "You should see auth_success and supervisor list messages."
