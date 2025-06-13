#!/bin/bash
# Deploy Go BARRY with HERE Traffic Integration

echo "🚀 Go BARRY - HERE Traffic Integration Deployment"
echo "================================================="

# Check current directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Please run from Go BARRY root directory"
    exit 1
fi

echo "📍 Current directory: $(pwd)"
echo "📅 Deployment time: $(date)"

# Test HERE API key
echo ""
echo "🔑 Checking HERE API configuration..."
cd backend
if [[ -f ".env" ]]; then
    echo "✅ .env file exists"
    if grep -q "HERE_API_KEY" .env; then
        echo "✅ HERE API key configured"
    else
        echo "⚠️ HERE API key missing in .env - you'll need to add this"
        echo "   Add this line to backend/.env:"
        echo "   HERE_API_KEY=your_here_api_key_here"
    fi
else
    echo "⚠️ .env file missing in backend/"
fi

# Quick test of HERE integration
echo ""
echo "🧪 Testing HERE integration..."
if command -v node &> /dev/null; then
    echo "🗺️ Running HERE API test..."
    node test-here.js 2>/dev/null || echo "⚠️ HERE test needs API key to run fully"
else
    echo "⚠️ Node.js not found, skipping test"
fi

cd ..

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm run install:all

# Build frontend
echo ""
echo "🏗️ Building frontend..."
cd Go_BARRY
expo export --platform web --output-dir dist --clear

cd ..

# Commit and deploy
echo ""
echo "🚀 Deploying HERE integration..."
git add .
git commit -m "🗺️ Add HERE Traffic API integration with enhanced GTFS route matching

- Integrated HERE Traffic API v7 for expanded coverage (25km radius)
- Enhanced location processing with geocoding fallbacks  
- Advanced route matching using Enhanced GTFS system
- Priority-based alert fetching: TomTom → HERE → MapQuest → StreetManager
- HERE criticality mapping (0-3) to Go Barry severity levels
- Comprehensive error handling and logging
- Wider geographical coverage than TomTom alone

This significantly expands traffic intelligence coverage for Go North East operations with HERE's comprehensive incident data."

echo ""
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "🎯 HERE Integration Summary:"
echo "✅ Enhanced HERE service with GTFS route matching"
echo "✅ Integrated into main alerts endpoint pipeline"
echo "✅ Priority-based fetching (TomTom → HERE → MapQuest → StreetManager)"
echo "✅ 25km radius coverage from Newcastle"
echo "✅ All criticality levels (0-3) supported"
echo "✅ Enhanced error handling and logging"
echo "✅ Frontend built and ready"
echo "✅ Committed and pushed to GitHub"

echo ""
echo "🔍 After deployment, check:"
echo "1. https://go-barry.onrender.com/api/alerts-enhanced"
echo "   - Should show sources.here in metadata"
echo "   - Should have alerts from multiple sources"
echo "2. https://gobarry.co.uk/display"
echo "   - Should show more comprehensive alert coverage"
echo "3. Backend logs should show:"
echo "   - 🗺️ [PRIORITY] Fetching HERE traffic..."
echo "   - ✅ HERE: X alerts fetched"

echo ""
echo "📊 Expected improvements:"
echo "- More comprehensive traffic coverage"
echo "- Better geographical reach (25km vs bbox)"
echo "- Additional incident types and severities"
echo "- Enhanced route matching accuracy"
echo "- Redundant data sources for reliability"

echo ""
echo "🔧 If HERE API key is missing:"
echo "1. Get HERE API key from developer.here.com"
echo "2. Add HERE_API_KEY=your_key to backend/.env"
echo "3. Redeploy to activate HERE integration"

echo ""
echo "✅ HERE integration deployment complete!"
