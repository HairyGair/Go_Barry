#!/bin/bash
# DEPLOY_TOMTOM_NOW.sh
# Complete TomTom Integration Deployment

echo "🗺️ Go BARRY TomTom Integration Deployment"
echo "=========================================="
echo ""

# Check current directory
cd "/Users/anthony/Go BARRY App"
echo "📍 Working directory: $(pwd)"
echo ""

# Add TomTom integration files
echo "📝 Adding TomTom integration files to git..."
git add Go_BARRY/components/EnhancedTrafficMap.jsx
git add Go_BARRY/components/DisplayScreen.jsx
echo "✅ Files added to git"
echo ""

# Commit TomTom integration
echo "💾 Committing TomTom integration..."
git commit -m "🗺️ Implement TomTom Maps SDK Integration

✨ Frontend Features:
- Add EnhancedTrafficMap.jsx with TomTom Maps SDK
- Real-time traffic flow and incidents layers
- Custom alert markers with severity-based colors  
- Auto-zoom to current rotating alerts
- Traffic layer toggle control for supervisors
- Pulsing animations for current alerts

🎯 DisplayScreen Integration:
- Replace Mapbox with TomTom in control room display
- Maintain existing props interface
- Enhanced visual mapping for 24/7 monitoring
- Production-ready with localhost fallback

🚀 Production Ready:
- TomTom Maps SDK v6.25.0 from CDN
- Environment variable EXPO_PUBLIC_TOMTOM_API_KEY
- Error handling with development mode detection
- Cross-platform compatibility (web focus)

Replaces Mapbox dependency with TomTom for visual traffic intelligence."

echo "✅ Committed to git"
echo ""

# Push to trigger backend deployment
echo "📤 Pushing to GitHub (triggers Render.com deployment)..."
git push origin main

echo ""
echo "✅ Backend Deployment Triggered!"
echo ""
echo "🧪 Test backend after deployment:"
echo "   curl https://go-barry.onrender.com/api/health"
echo "   curl https://go-barry.onrender.com/api/alerts-enhanced"
echo ""
echo "⏳ Wait 2-3 minutes for Render.com deployment to complete..."
echo "   Monitor at: https://render.com/dashboard"
echo ""
echo "📱 Next: Deploy frontend with TomTom integration"
echo "   Run: npm run build:frontend"
echo "   Then: Deploy to cPanel"
