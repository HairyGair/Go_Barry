#!/bin/bash

# Quick Deploy - Fix Imports and Deploy Display Updates
echo "🚦 Quick Deploy - Fixing Imports and Deploying Display Updates..."
echo ""

echo "✅ Fixed Import Issues:"
echo "  • IntegrationTest: Fixed path to dev/IntegrationTest"
echo "  • SimpleAPITest: Fixed path to dev/SimpleAPITest" 
echo "  • SupervisorDisplayIntegrationTest: Fixed path to dev/SupervisorDisplayIntegrationTest"
echo ""

echo "✅ Display Layout Updates:"
echo "  • Both display.jsx and DisplayScreen.jsx updated"
echo "  • 60/40 vertical split (Alerts top, Map bottom)"
echo "  • Removed priority status indicators"
echo ""

# Add all changes
git add .

# Commit with clear message
git commit -m "🔧 FIX IMPORTS + DISPLAY LAYOUT UPDATES

✅ Import Fixes:
- Fixed IntegrationTest import path (dev/IntegrationTest)  
- Fixed SimpleAPITest import path (dev/SimpleAPITest)
- Fixed SupervisorDisplayIntegrationTest path (dev/SupervisorDisplayIntegrationTest)

✅ Display Layout Changes:
- Updated display.jsx: 60/40 vertical split
- Updated DisplayScreen.jsx: 60/40 vertical split  
- Removed priority summary indicators
- Alerts section: 60% of screen (top)
- Map section: 40% of screen (bottom)"

# Push to trigger deployment
echo "🚀 Pushing to production..."
git push origin main

echo ""
echo "✅ DEPLOYMENT INITIATED!"
echo ""
echo "🌐 Production URLs:"
echo "   Frontend: https://gobarry.co.uk"
echo "   Display: https://gobarry.co.uk/display"
echo "   Backend: https://go-barry.onrender.com"
echo ""
echo "⏱️  Expected deployment time: 3-5 minutes"
echo "📋 Changes deployed:"
echo "   • Fixed all import issues preventing build"
echo "   • Updated display layout to 60/40 vertical split"
echo "   • Alerts prioritized at top (60%)"
echo "   • Map clearly visible at bottom (40%)"
