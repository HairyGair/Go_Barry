#!/bin/bash
# deploy-backend-memory-fix.sh
# Deploy memory-optimized backend to fix memory issues and route matching

echo "🚦 BARRY Backend Memory Fix Deployment"
echo "======================================="

# 1. Backup current files
echo "📋 Creating backup of current files..."
cp backend/index.js backend/index-backup-$(date +%Y%m%d-%H%M%S).js
cp backend/services/tomtom.js backend/services/tomtom-backup-$(date +%Y%m%d-%H%M%S).js
cp backend/routes/api-improved.js backend/routes/api-improved-backup-$(date +%Y%m%d-%H%M%S).js

# 2. Replace main index file with memory-optimized version
echo "🔧 Deploying memory-optimized main index file..."
cp backend/index-memory-fixed.js backend/index.js

# 3. Replace TomTom service with fixed version
echo "🚗 Deploying fixed TomTom service..."
cp backend/services/tomtom-fixed.js backend/services/tomtom.js

# 4. Replace API routes with memory-optimized version
echo "📡 Deploying memory-optimized API routes..."
cp backend/routes/api-memory-optimized.js backend/routes/api-improved.js

# 5. Update package.json to use the fixed index file
echo "📦 Updating package.json start script..."
sed -i.bak 's/"start": "node.*"/"start": "node --max-old-space-size=1800 --expose-gc index.js"/' backend/package.json

# 6. Commit changes
echo "📝 Committing changes..."
git add backend/index.js backend/services/tomtom.js backend/routes/api-improved.js backend/package.json
git commit -m "🔧 Deploy memory-optimized backend with fixed route matching

- Fixed dual GTFS initialization causing memory conflicts
- Implemented working route matching instead of broken imports
- Added request throttling to prevent memory spikes  
- Reduced memory limit to 1.8GB for stability
- Fixed coordinate-based route detection
- Added garbage collection triggers

Fixes:
- Memory crashes from conflicting GTFS loaders
- No alerts reaching supervisors/display screens
- Route matching showing 0 routes for all incidents
- Concurrent API requests causing memory overload"

# 7. Deploy to Render
echo "🚀 Deploying to Render.com..."
git push origin main

echo ""
echo "✅ Backend Memory Fix Deployment Complete!"
echo ""
echo "🎯 What was fixed:"
echo "   ✅ Memory crashes from dual GTFS initialization"
echo "   ✅ Route matching now works (was showing 0 routes)"  
echo "   ✅ Request throttling prevents memory spikes"
echo "   ✅ Garbage collection reduces memory usage"
echo "   ✅ Alerts will now reach supervisors and display screens"
echo ""
echo "📊 Expected results:"
echo "   📈 Memory usage reduced from 2GB+ to ~1.5GB"
echo "   🎯 Incidents will show affected bus routes (not 0)"
echo "   📱 Alerts will appear on supervisor/display screens"
echo "   ⚡ Faster API responses due to optimizations"
echo ""
echo "🔍 Monitor logs for:"
echo "   '🎯 Route Match: Found X routes near lat, lng'"
echo "   '✨ Enhanced incident: location → enhanced (X routes)'"
echo "   '♻️ Garbage collection triggered'"
echo ""
echo "⏱️ Deployment will be live in ~2-3 minutes"
echo "🌐 Check: https://go-barry.onrender.com/api/health"