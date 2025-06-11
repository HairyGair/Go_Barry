#!/bin/bash
echo "🔧 Deploying WebSocket Debug Logging..."
cd "/Users/anthony/Go BARRY App"

# Add files
git add Go_BARRY/components/SupervisorControl.jsx
git add Go_BARRY/components/hooks/useSupervisorSync.js

# Commit
git commit -m "Debug: Add WebSocket authentication logging to diagnose supervisor connection issue"

# Push
git push origin main

echo "✅ Debug logging deployed!"
echo ""
echo "📝 Testing Instructions:"
echo "1. Wait 2-3 minutes for Render to rebuild"
echo "2. Open https://gobarry.co.uk in Chrome"
echo "3. Press F12 to open Developer Console"
echo "4. Login as 'Alex Woodcock' (no password)"
echo "5. Click on 'Supervisor Control' in sidebar"
echo "6. Look for these console messages:"
echo "   - 🚀 SupervisorControl WebSocket Auth:"
echo "   - 🔐 WebSocket Authentication:"
echo "   - 👥 Supervisor list updated:"
echo ""
echo "7. In a new tab, open https://gobarry.co.uk/display"
echo "8. Check if it shows supervisors online"
echo ""
echo "Share the console logs to diagnose the issue!"
