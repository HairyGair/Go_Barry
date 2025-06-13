#!/bin/bash
# emergency-deploy-fix.sh
# Emergency deployment to fix import issue

echo "🚨 Emergency Deploy: Fix Import Error"
echo "===================================="

# Commit the fixed index.js file
git add backend/index.js
git commit -m "🚨 Emergency fix: Remove problematic import

- Removed import of emergency-endpoint.js that was causing crashes
- Built emergency endpoint directly into index.js
- Kept all memory optimization and route matching fixes
- System should now start successfully

Fixes:
- ERR_MODULE_NOT_FOUND error blocking deployment
- Memory optimization remains intact
- Route matching functionality preserved"

# Deploy immediately
echo "🚀 Deploying emergency fix..."
git push origin main

echo ""
echo "✅ Emergency Deploy Complete!"
echo ""
echo "🎯 This fixes the import error that was preventing startup"
echo "📊 All memory optimization and route matching fixes remain"
echo "⏱️ System should be running in ~2-3 minutes"
echo ""
echo "🌐 Check: https://go-barry.onrender.com/api/health"