#!/bin/bash

# Deploy CORS Fix for Breakdown Dashboard
# This script deploys the CORS configuration update to allow breakdowns.gobarry.co.uk

echo "🚀 Deploying CORS Fix for Breakdown Dashboard"
echo "============================================="

# Navigate to backend directory
cd /Users/anthony/Go\ BARRY\ App/backend || exit

# Check if we're in the right directory
if [ ! -f "render-startup.js" ]; then
    echo "❌ Error: render-startup.js not found. Are you in the backend directory?"
    exit 1
fi

# Check git status
echo "📊 Checking git status..."
git status

# Add the CORS fix file
echo "📝 Adding CORS fix to git..."
git add render-startup.js

# Commit the changes
echo "💾 Committing changes..."
git commit -m "Fix: Add breakdowns.gobarry.co.uk to CORS allowed origins

- Added https://breakdowns.gobarry.co.uk to corsOptions
- Added https://breakdowns.gobarry.co.uk to manual CORS middleware
- Enables dashboard at breakdowns subdomain to access API
- Fixes CORS policy blocking API calls from breakdown dashboard"

# Push to remote
echo "⬆️ Pushing to remote repository..."
git push

echo ""
echo "✅ CORS fix deployed!"
echo ""
echo "📝 Next Steps:"
echo "1. Wait ~5 minutes for Render.com to auto-deploy"
echo "2. Monitor deployment at: https://dashboard.render.com"
echo "3. Test the fix at: https://breakdowns.gobarry.co.uk/dashboard/"
echo ""
echo "🔍 To verify the fix is working:"
echo "- Open browser DevTools (F12)"
echo "- Check Network tab - API calls should return 200 OK"
echo "- Check Console - no CORS errors should appear"
echo ""
echo "📊 Test API endpoint directly:"
echo "curl https://go-barry.onrender.com/api/breakdowns/live"
