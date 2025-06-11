#!/bin/bash
echo "🚀 Deploying Session Fix for WebSocket Authentication..."
cd "/Users/anthony/Go BARRY App"

# Add all files
git add backend/services/supervisorManager.js
git add backend/routes/supervisorAPI.js

# Commit with detailed message
git commit -m "Fix: WebSocket authentication by using in-memory sessions only

The Issue:
- Sessions were being saved to files on Render.com
- Render's file system is ephemeral (files get wiped on restart)
- This caused 'Invalid or expired session' errors

The Fix:
- Sessions now stored in memory only (no file persistence)
- Added comprehensive debug logging for auth flow
- Added /api/supervisor/debug/sessions endpoint to check sessions
- Removed all file save operations for sessions

This ensures sessions persist during the container lifecycle and WebSocket authentication works properly on cloud platforms."

# Push to deploy
git push origin main

echo "✅ Session fix deployed!"
echo ""
echo "🧪 Testing Instructions:"
echo ""
echo "1. Wait 3-4 minutes for Render to rebuild"
echo "2. Test the session debug endpoint:"
echo "   curl https://go-barry.onrender.com/api/supervisor/debug/sessions"
echo ""
echo "3. Open https://gobarry.co.uk and login as Alex Woodcock"
echo "4. Check browser console for session logs:"
echo "   - 🔐 Auth attempt: supervisor001 with badge AW001"
echo "   - ✅ Session created: session_supervisor001_..."
echo "   - 🔍 Validating session: session_supervisor001_..."
echo ""
echo "5. The display at https://gobarry.co.uk/display should now show supervisors"
echo ""
echo "⚠️ Note: Sessions will be lost if backend restarts, but will work during normal operation"
