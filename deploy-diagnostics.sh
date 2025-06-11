#!/bin/bash
echo "🔍 Deploying WebSocket Diagnostics Tool..."
cd "/Users/anthony/Go BARRY App"

# Add all files
git add Go_BARRY/components/WebSocketDiagnostics.jsx
git add Go_BARRY/app/browser-main.jsx

# Commit
git commit -m "Add: WebSocket Diagnostics tool to identify connection issues

Features:
- Test backend health and connectivity
- Create test supervisor sessions
- Check active sessions on backend
- Connect WebSocket as display client
- Connect WebSocket as supervisor with auth
- Real-time message logging
- Full automated test sequence

This tool will help identify exactly where the WebSocket connection is failing between supervisor and display screens."

# Push to deploy
git push origin main

echo "✅ Diagnostics tool deployed!"
echo ""
echo "🔍 How to diagnose the issue:"
echo ""
echo "1. Wait 3-4 minutes for Render to rebuild"
echo "2. Open https://gobarry.co.uk/display in one tab (leave it open)"
echo "3. Open https://gobarry.co.uk in another tab"
echo "4. Click 'WebSocket Diagnostics' in the sidebar (near bottom)"
echo "5. Click the blue 'Run Full Test' button"
echo "6. Watch the logs for any errors"
echo ""
echo "📝 What to look for:"
echo "✅ Green 'success' messages = working correctly"
echo "❌ Red 'error' messages = problem found"
echo "🟡 Orange 'warning' messages = important info"
echo ""
echo "The test will:"
echo "- Create a supervisor session"
echo "- Connect as display (should see 0 supervisors)"
echo "- Connect as supervisor (display should update to 1)"
echo ""
echo "Share the log output if issues persist!"
