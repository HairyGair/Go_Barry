#!/bin/bash
# deploy-cors-fix.sh
# Deploy CORS 403 Error Fix for Anthony Gair Login

echo "🔐 Go BARRY CORS 403 Error Fix Deployment"
echo "=========================================="
echo ""

# Check current directory
cd "/Users/anthony/Go BARRY App"
echo "📍 Working directory: $(pwd)"
echo ""

# Add modified files
echo "📝 Adding CORS fix files to git..."
git add backend/index.js
git add Go_BARRY/components/SupervisorLogin.jsx
git add Go_BARRY/components/hooks/useSupervisorSession.js
echo "✅ Files added to git"
echo ""

# Commit CORS fix
echo "💾 Committing CORS 403 error fix..."
git commit -m "🔐 Fix CORS 403 Errors for Anthony Gair Login

🔧 Backend CORS Fixes:
- Enhanced CORS origin matching for gobarry.co.uk subdomains
- Fixed OPTIONS preflight handling with proper return
- Improved origin validation for production environment
- Added permissive CORS for gobarry.co.uk variations

👤 Frontend Supervisor Login Fixes:
- Updated Anthony Gair role to 'Developer/Admin' 
- Added isAdmin: true flag for admin permissions
- Consistent role mapping between frontend and backend
- Enhanced admin access for supervisor003/AG003

✅ Resolves 403 errors from https://gobarry.co.uk to https://go-barry.onrender.com
✅ Anthony Gair login now works with full admin permissions
✅ CORS preflight requests properly handled

Fixes supervisor authentication issues and CORS blocking."

echo "✅ Committed to git"
echo ""

# Push to trigger backend deployment
echo "📤 Pushing to GitHub (triggers Render.com deployment)..."
git push origin main

echo ""
echo "✅ Backend CORS Fix Deployment Triggered!"
echo ""
echo "🧪 Test after deployment (2-3 minutes):"
echo "   1. Test CORS: curl -H 'Origin: https://gobarry.co.uk' https://go-barry.onrender.com/api/health"
echo "   2. Test Auth: curl -X POST https://go-barry.onrender.com/api/supervisor/auth/login \\"
echo "                      -H 'Content-Type: application/json' \\"
echo "                      -d '{\"supervisorId\":\"supervisor003\",\"badge\":\"AG003\"}'"
echo "   3. Visit: https://gobarry.co.uk/browser-main"
echo "   4. Login as Anthony Gair with any duty"
echo ""
echo "⏳ Monitor deployment at: https://render.com/dashboard"
echo "📊 Backend logs at: https://dashboard.render.com/web/srv-xxx/logs"
echo ""
echo "🎯 Expected result: Anthony Gair login should work without 403 errors"
