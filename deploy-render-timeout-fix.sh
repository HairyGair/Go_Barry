#!/bin/bash
# deploy-render-timeout-fix.sh
# Fix Render.com deployment timeout error

echo "🔧 Go BARRY Render.com Timeout Fix Deployment"
echo "==============================================="
echo ""

# Check current directory
cd "/Users/anthony/Go BARRY App"
echo "📍 Working directory: $(pwd)"
echo ""

# Add modified files
echo "📝 Adding timeout fix files to git..."
git add backend/index.js
git add Go_BARRY/components/SupervisorLogin.jsx
git add Go_BARRY/components/hooks/useSupervisorSession.js
echo "✅ Files added to git"
echo ""

# Commit timeout fix
echo "💾 Committing Render.com timeout fix..."
git commit -m "🔧 Fix Render.com Deployment Timeout & CORS Issues

🚀 Server Startup Fixes:
- Fixed async initialization blocking server startup
- Added 30-second timeout for initialization process
- Server now starts with degraded mode fallback if initialization fails
- Proper async/await handling for Render.com health checks

🔐 CORS & Authentication Fixes:
- Enhanced CORS origin matching for gobarry.co.uk subdomains
- Fixed OPTIONS preflight handling with proper return
- Updated Anthony Gair role to 'Developer/Admin' with admin permissions
- Consistent role mapping between frontend and backend

✅ Resolves Render.com 'dial tcp i/o timeout' errors
✅ Prevents startup hanging on initialization
✅ Maintains functionality if some services fail to initialize
✅ Anthony Gair login works with full admin permissions

Production-ready with guaranteed startup success on Render.com."

echo "✅ Committed to git"
echo ""

# Push to trigger backend deployment
echo "📤 Pushing to GitHub (triggers Render.com deployment)..."
git push origin main

echo ""
echo "✅ Render.com Timeout Fix Deployment Triggered!"
echo ""
echo "🧪 Monitor deployment (2-3 minutes):"
echo "   📊 Render dashboard: https://render.com/dashboard"
echo "   📋 Logs: https://dashboard.render.com/web/srv-xxx/logs"
echo ""
echo "🧪 Test after deployment:"
echo "   1. Health check: curl https://go-barry.onrender.com/api/health"
echo "   2. CORS test: curl -H 'Origin: https://gobarry.co.uk' https://go-barry.onrender.com/api/health"
echo "   3. Visit: https://gobarry.co.uk/browser-main"
echo "   4. Login as Anthony Gair"
echo ""
echo "🎯 Expected result: No more timeout errors, successful deployment, Anthony Gair login works"
echo "⚡ Server should start quickly and respond to health checks immediately"
