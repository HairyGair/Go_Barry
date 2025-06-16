#!/bin/bash
# deploy-tomtom-tiles.sh
# Deploy TomTom tiles system with 50k daily tile optimization

echo "🗺️ Deploying TomTom Tiles System..."
echo ""
echo "📊 Configuration:"
echo "   🔢 Daily Limit: 50,000 tiles"
echo "   🕐 Business Hours: 6:00 AM - 12:15 AM (18.25h)"
echo "   📈 Rate: ~2,740 tiles/hour during operation"
echo "   💾 Caching: 500 tiles in memory (30min TTL)"
echo "   🚀 Load Balancing: 4 TomTom tile servers"
echo ""

# Add all new tile-related files
echo "📝 Adding files..."
git add backend/utils/requestThrottler.js
git add backend/services/tomtomTiles.js
git add backend/routes/tileAPI.js
git add backend/routes/throttleAPI.js
git add backend/index.js
git add Go_BARRY/components/EnhancedTrafficMap.jsx

# Commit changes
echo "💾 Committing changes..."
git commit -m "Implement TomTom tiles system with optimized 50k daily usage

🗺️ TomTom Tiles Integration:
- Add TomTomTileService with business hours throttling
- Implement intelligent caching (500 tiles, 30min TTL)
- Load balancing across 4 TomTom tile servers
- Support for base map + traffic incident overlay tiles

📊 Optimization Features:
- 50,000 tiles/day distributed over 18.25h business hours
- ~2,740 tiles/hour = ~1 tile/1.3 seconds during operation
- Memory-efficient LRU cache with automatic cleanup
- Request queuing outside business hours

🎯 API Endpoints:
- GET /api/tiles/map/{layer}/{style}/{zoom}/{x}/{y}.{format}
- GET /api/tiles/traffic/{zoom}/{x}/{y}.{format}
- GET /api/tiles/status - Usage monitoring

🖥️ Enhanced TrafficMap:
- Leaflet-based TomTom tile display
- Real-time traffic overlay toggle
- Alert markers with severity color coding
- Auto-zoom to current alerts
- Live tile usage statistics

Rate limiting ensures zero API limit breaches while maximizing visual capabilities."

# Push to trigger deployment
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ TomTom Tiles System Deployed!"
echo ""
echo "🧪 Test after deployment:"
echo "   curl https://go-barry.onrender.com/api/tiles/status"
echo "   curl https://go-barry.onrender.com/api/throttle/status"
echo ""
echo "📊 Monitor usage at:"
echo "   https://go-barry.onrender.com/api/tiles/status"
echo ""
echo "🎯 Expected capabilities:"
echo "   • Visual maps in all Go BARRY interfaces"
echo "   • Real-time traffic incident overlays"
echo "   • Optimized for 50k daily tile budget"
echo "   • Zero TomTom API limit breaches"
