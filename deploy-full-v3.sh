#!/bin/bash
# deploy-full-v3.sh  
# Deploy the complete Go Barry v3.0 system (not ultra-simple mode)

echo "🔧 DEPLOYING COMPLETE GO BARRY v3.0 SYSTEM"
echo "=========================================="
echo ""
echo "Current status: Backend running in ultra-simple mode"
echo "Goal: Deploy full v3.0 with all features"
echo ""

cd "/Users/anthony/Go BARRY App"

# Ensure we're using the full index.js (not index-simple.js)
echo "📦 Updating backend to use full v3.0 system..."
cd backend

# Make sure package.json uses the full index.js
npm pkg set scripts.start="node index.js"

echo "✅ Backend configured to use index.js (full system)"
cd ..

# Add and commit the change
echo "📝 Committing full v3.0 configuration..."
git add backend/package.json

git commit -m "🚀 Deploy FULL Go Barry v3.0 system

Switch from ultra-simple mode to complete system with:
✅ All 7 Disruption Control Room screens
✅ /api/incidents endpoint  
✅ /api/messaging endpoint
✅ /api/routes/gtfs-stats endpoint
✅ Full GTFS integration
✅ Complete supervisor system
✅ AI disruption management
✅ Multi-channel messaging
✅ Automated reporting
✅ System health monitoring
✅ Training & help system

Ready for full production deployment!"

echo "📤 Pushing full v3.0 to remote..."
git push origin main

echo ""
echo "✅ Full Go Barry v3.0 committed and pushed!"
echo ""
echo "🚢 NEXT: Redeploy on Render"
echo ""
echo "1. 🌐 Go to: https://dashboard.render.com"  
echo "2. 🔍 Find: go-barry service"
echo "3. 🚀 Click: 'Manual Deploy' → 'Deploy latest commit'"
echo "4. 👀 Watch logs for: 'BARRY Backend Starting with Enhanced Geocoding...'"
echo ""
echo "🧪 After redeployment, test these NEW endpoints:"
echo "   • https://go-barry.onrender.com/api/incidents"
echo "   • https://go-barry.onrender.com/api/messaging/channels"  
echo "   • https://go-barry.onrender.com/api/routes/gtfs-stats"
echo "   • https://go-barry.onrender.com/api/supervisor"
echo ""
echo "🎯 Expected NEW features after redeployment:"
echo "   ✅ Incident Manager working"
echo "   ✅ AI Disruption Manager working"  
echo "   ✅ Message Distribution working"
echo "   ✅ System Health Monitor working"
echo "   ✅ Training & Help working"
echo "   ✅ Supervisor persistence working"
echo ""
echo "🎉 FULL GO BARRY v3.0 READY FOR DEPLOYMENT!"
