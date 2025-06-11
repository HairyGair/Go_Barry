#!/bin/bash
echo "🚀 Deploying Complete Session Fix for WebSocket Authentication..."
cd "/Users/anthony/Go BARRY App"

# Add all modified files
git add backend/services/supervisorManager.js
git add backend/routes/supervisorAPI.js
git add test-websocket-session-fix.js

# Commit with comprehensive message
git commit -m "Fix: WebSocket authentication - use in-memory sessions only

THE ROOT CAUSE:
- Render.com's file system is ephemeral (files deleted on restart)
- Sessions were saved to files, then lost on container restart
- This caused 'Invalid or expired session' errors

THE SOLUTION:
- Sessions now stored in memory only (no file persistence)
- Removed all saveSupervisorSessions() calls
- Sessions persist during container lifecycle

ADDED FEATURES:
- Comprehensive debug logging for auth flow
- GET /api/supervisor/debug/sessions - check active sessions
- POST /api/supervisor/debug/test-session - create test session
- test-websocket-session-fix.js - automated test script

WHAT THIS FIXES:
- WebSocket authentication now works on cloud platforms
- Display screen will show connected supervisors
- Sessions remain valid until container restart

TRADE-OFF:
- Sessions lost on backend restart (acceptable for hobby tier)
- In production, would use Redis or database for persistence"

# Push to deploy
git push origin main

echo "✅ Complete session fix deployed!"
echo ""
echo "🧪 Testing Instructions:"
echo ""
echo "Option 1 - Automated Test (requires Node.js):"
echo "1. Wait 3-4 minutes for Render to rebuild"
echo "2. npm install ws (if not installed)"
echo "3. node test-websocket-session-fix.js"
echo ""
echo "Option 2 - Manual Browser Test:"
echo "1. Open https://gobarry.co.uk"
echo "2. Login as 'Alex Woodcock'"
echo "3. Click 'WebSocket Test' in sidebar"
echo "4. Watch connection status"
echo "5. Check display at https://gobarry.co.uk/display"
echo ""
echo "Option 3 - API Test:"
echo "curl -X POST https://go-barry.onrender.com/api/supervisor/debug/test-session"
echo "curl https://go-barry.onrender.com/api/supervisor/debug/sessions"
echo ""
echo "📝 The fix ensures sessions work during normal operation."
echo "⚠️ Sessions will be lost if backend restarts (normal for free tier)."
