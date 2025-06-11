#!/bin/bash
echo "🚀 Deploying Complete WebSocket Fix with Test Page..."
cd "/Users/anthony/Go BARRY App"

# Add all files
git add -A

# Commit with detailed message
git commit -m "Fix: Complete WebSocket authentication system with test page

Frontend Changes:
- Added debug logging to trace authentication flow
- Fixed supervisor ID mapping (frontend ID -> backend ID)
- Added WebSocket Test page for debugging connections
- Ensured session ID is properly passed to WebSocket

Backend Changes:
- Fixed supervisor list broadcasting when supervisors connect
- Ensure displays receive supervisor list immediately on connection
- Added proper supervisor validation in WebSocket service
- Debug logging for connection events

Test Page Features:
- Shows login status and session details
- Monitors both supervisor and display WebSocket connections
- Shows active supervisor count
- Real-time connection logs
- Test login button for quick testing

Access test page at: /websockettest in browser navigation"

# Push to deploy
git push origin main

echo "✅ Complete WebSocket fix deployed with test page!"
echo ""
echo "🧪 Testing Instructions:"
echo ""
echo "Method 1 - Using Test Page:"
echo "1. Wait 3-4 minutes for Render to rebuild"
echo "2. Open https://gobarry.co.uk"
echo "3. Click 'WebSocket Test' in the sidebar (bottom of list)"
echo "4. Click 'Test Login (Alex Woodcock)' button"
echo "5. Watch the connection logs"
echo "6. In another tab, open https://gobarry.co.uk/display"
echo "7. Should show '1 SUPERVISOR ONLINE'"
echo ""
echo "Method 2 - Normal Flow:"
echo "1. Open https://gobarry.co.uk/display (first)"
echo "2. Open https://gobarry.co.uk in another tab"
echo "3. Login as 'Alex Woodcock'"
echo "4. Click 'Supervisor Control' in sidebar"
echo "5. Display should update to show supervisor online"
echo ""
echo "📝 The test page will show:"
echo "- Login status and session ID"
echo "- Backend supervisor ID mapping"
echo "- WebSocket connection states"
echo "- Active supervisor count"
echo "- Real-time connection logs"
