#!/bin/bash
echo "🚀 Deploying Complete WebSocket Debug & Diagnostics..."
cd "/Users/anthony/Go BARRY App"

# Add all files
git add -A

# Commit
git commit -m "Debug: Add comprehensive WebSocket diagnostics and logging

Added Features:
1. WebSocket Diagnostics Page (/diagnostics)
   - Full automated test sequence
   - Backend health check
   - Session creation test
   - Display connection test
   - Supervisor connection test
   - Real-time message logging

2. Enhanced Debug Logging:
   - Display screen logs all received WebSocket messages
   - Supervisor control logs all WebSocket messages
   - Display screen logs active supervisor data
   - All connection state changes logged

3. Visual Diagnostics:
   - Color-coded log messages
   - Session info display
   - Step-by-step test execution
   - Clear error identification

This will help identify exactly why supervisors aren't appearing on the display screen."

# Push to deploy
git push origin main

echo "✅ Complete diagnostics deployed!"
echo ""
echo "🔍 DIAGNOSTIC STEPS:"
echo ""
echo "1. Wait 3-4 minutes for Render to rebuild"
echo ""
echo "2. Open browser console (F12) on both tabs to see logs"
echo ""
echo "3. Test Method A - Using Diagnostics Page:"
echo "   a. Open https://gobarry.co.uk/display (keep it open)"
echo "   b. Open https://gobarry.co.uk in another tab"
echo "   c. Click 'WebSocket Diagnostics' in sidebar"
echo "   d. Click 'Run Full Test' button"
echo "   e. Watch for errors in the log output"
echo ""
echo "4. Test Method B - Normal Login Flow:"
echo "   a. Open https://gobarry.co.uk/display (with console open)"
echo "   b. Open https://gobarry.co.uk in another tab"
echo "   c. Login as 'Alex Woodcock'"
echo "   d. Click 'Supervisor Control'"
echo "   e. Check console logs in both tabs"
echo ""
echo "📝 Console logs to look for:"
echo "- 🚀 SupervisorControl WebSocket Auth: (should show sessionId)"
echo "- 🔐 WebSocket Authentication: (should show auth attempt)"
echo "- 📨 Display received message: (should show supervisor updates)"
echo "- 👥 Display Screen - Active Supervisors: (should show count)"
echo ""
echo "Share the console logs and diagnostics output!"
