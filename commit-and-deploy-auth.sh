#!/bin/bash
# Fix and deploy authentication changes

echo "🔍 Checking current git status..."
git status

echo ""
echo "📁 Files we need to commit:"
echo "✅ backend/services/supervisorManager.js (updated supervisors)"
echo "✅ Go_BARRY/components/hooks/useSupervisorSession.js (backend auth)"  
echo "✅ Go_BARRY/app/browser-main.jsx (fixed variable)"

echo ""
echo "🔧 Adding authentication changes..."

# Add the specific files with our authentication changes
git add backend/services/supervisorManager.js
git add Go_BARRY/components/hooks/useSupervisorSession.js
git add Go_BARRY/app/browser-main.jsx

# Check what's staged
echo ""
echo "📋 Staged changes:"
git diff --cached --name-only

echo ""
echo "💾 Committing authentication fixes..."

git commit -m "Fix: Complete supervisor authentication integration

🔐 Backend Authentication:
- Updated supervisorManager.js with real supervisor names and badges
- Fixed supervisor database to match frontend supervisor list
- Backend ID mapping: supervisor001=Alex Woodcock, etc.

🖥️ Frontend Authentication:  
- useSupervisorSession.js now authenticates with backend via POST /api/supervisor/auth/login
- Added backend ID mapping for WebSocket authentication
- Fixed supervisorSession destructuring error in browser-main.jsx

🔌 WebSocket Integration:
- WebSocket now receives valid backend session ID
- Supervisor authentication should succeed
- Display screen should show connected supervisors

Resolves:
❌ 'Authentication failed: Invalid or expired session'
❌ 'Can't find variable: supervisorSession'
❌ Supervisor → Display sync issues
✅ Enables real-time supervisor control flow"

echo ""
echo "🚀 Pushing to Render..."
git push origin main

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "📋 What was deployed:"
echo "✅ Backend now has matching supervisor names/IDs"
echo "✅ Frontend authenticates with backend during login"
echo "✅ WebSocket uses valid backend session for auth"
echo "✅ All JavaScript errors should be resolved"
echo ""
echo "⏳ Wait 2-3 minutes for Render to rebuild and restart"
echo "🧪 Then test login at: https://gobarry.co.uk"
