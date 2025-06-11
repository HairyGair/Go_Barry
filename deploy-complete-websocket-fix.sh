#!/bin/bash
echo "🚀 Deploying Complete WebSocket Fix..."
cd "/Users/anthony/Go BARRY App"

# Add all modified files
git add Go_BARRY/app/browser-main.jsx
git add Go_BARRY/components/SupervisorControl.jsx
git add Go_BARRY/components/hooks/useSupervisorSync.js
git add backend/services/supervisorSync.js

# Commit
git commit -m "Fix: Complete WebSocket authentication and supervisor list broadcasting

- Added debug logging to trace authentication flow
- Fixed supervisor list broadcasting when supervisors connect
- Ensure displays receive supervisor list on connection
- Properly validate and broadcast supervisor details
- Frontend correctly passes backend supervisor ID and session"

# Push
git push origin main

echo "✅ Complete fix deployed!"
echo ""
echo "🧪 Testing Steps:"
echo "1. Wait 3-4 minutes for Render to rebuild both frontend and backend"
echo "2. Open https://gobarry.co.uk/display in one browser tab"
echo "3. Open https://gobarry.co.uk in another tab"
echo "4. Login as 'Alex Woodcock' (no password needed)"
echo "5. The display should now show '1 SUPERVISOR ONLINE'"
echo ""
echo "📝 If it still doesn't work, check browser console for:"
echo "   - 🚀 SupervisorControl WebSocket Auth: (should show sessionId)"
echo "   - 🔐 WebSocket Authentication: (should show supervisor001 and session)"
echo "   - 📡 Broadcasting supervisor list to displays: (backend log)"
echo "   - 👥 Supervisor list updated: (display should receive this)"
