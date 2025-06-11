#!/bin/bash
# Check Render service status and redeploy if needed

echo "🔍 Checking Render backend status..."

# Test if backend is responding
echo "Testing backend health..."
curl -s https://go-barry.onrender.com/api/health || echo "❌ Backend not responding"

echo ""
echo "🚀 Triggering fresh Render deployment..."

# Force redeploy
git add .
git commit --allow-empty -m "Force Render redeploy - backend unreachable

Backend is currently returning 'Failed to fetch' errors.
This commit triggers a fresh deployment to restore service."

git push origin main

echo "✅ Redeployment triggered!"
echo ""
echo "Next steps:"
echo "1. Check Render dashboard: https://dashboard.render.com"
echo "2. Monitor deployment logs"
echo "3. Test backend health: curl https://go-barry.onrender.com/api/health"
echo "4. If still failing, check for build errors in Render logs"
