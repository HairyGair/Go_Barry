#!/bin/bash
# deploy-clean.sh
# Deploy Go BARRY with optimized traffic sources

echo "🚀 Deploying Go BARRY Backend Updates"
echo "====================================="

echo "📝 Committing changes..."
git add .
git commit -m "Backend optimization: Streamlined traffic data sources

- Optimized to use 4 efficient traffic sources
- TomTom API for primary traffic intelligence  
- National Highways for official UK roadworks
- StreetManager for planned roadworks
- Manual incidents for supervisor-created alerts
- System remains fully operational"

# Push to trigger Render deployment
echo "🚀 Pushing to trigger Render deployment..."
git push origin main

echo ""
echo "✅ DEPLOYMENT INITIATED"
echo "====================="
echo "🔄 Render will redeploy automatically"
echo "⏱️ Deployment typically takes 2-3 minutes"
echo "🧪 Test with: node verify-api-removal.js"
echo ""
echo "📊 Active traffic source configuration:"
echo "   ✅ TomTom API (primary traffic intelligence)"
echo "   ✅ National Highways DATEX II (official UK roadworks)"
echo "   ✅ StreetManager UK (planned roadworks)"
echo "   ✅ Manual Incidents (supervisor-created)"
echo ""
echo "Go BARRY fully operational! 🎉"
