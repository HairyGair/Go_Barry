#!/bin/bash

# deploy-production-fixes.sh
# Deploy the authentication and geocoding fixes to production

echo "🚀 Deploying Production Fixes for Go BARRY"
echo "=========================================="

echo ""
echo "🔧 Fixes Applied:"
echo "   ✅ HERE API: Removed criticality parameter (400 → 200 expected)"
echo "   ✅ Geocoding: Production-optimized location processing"
echo "   ✅ TomTom: Updated to use fast coordinate mapping"
echo "   ✅ Performance: Reduced timeouts for production environment"

echo ""
echo "📊 Expected Results:"
echo "   • HERE API: Should work (no more 400 errors)"
echo "   • Locations: Specific areas instead of 'North East England'"
echo "   • Performance: Faster response times (<5 seconds)"
echo "   • Coverage: 2-4/4 APIs working instead of 1/4"

echo ""
echo "🌐 Deploying to Render.com..."

# Add, commit and push changes
git add .
git commit -m "Fix: Production authentication and geocoding issues

- Fixed HERE API 400 error (removed criticality parameter)
- Added production-optimized geocoding with coordinate mapping  
- Reduced timeouts for production environment
- Updated TomTom to use fast location processing

Expected: HERE API working + specific locations instead of generic"

git push origin main

echo ""
echo "⏱️ Deployment started! Render.com will rebuild automatically."
echo ""
echo "🧪 Test the fixes in ~3-5 minutes:"
echo "   curl https://go-barry.onrender.com/api/alerts-enhanced"
echo ""
echo "📈 Success metrics to check:"
echo "   • HERE API success: true (not 400 error)" 
echo "   • Locations: Specific street names/areas"
echo "   • Response time: <8 seconds (vs current 8s)"
echo "   • Sources working: 2-4 instead of 1"

echo ""
echo "🎯 If still issues:"
echo "   • Wait 15-30 minutes for API key activation"
echo "   • Check Render.com deployment logs"
echo "   • Run fallback mode: node disable-failing-apis.js"
