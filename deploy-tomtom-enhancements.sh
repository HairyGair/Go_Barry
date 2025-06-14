#!/bin/bash

echo "🗺️ Deploying TomTom Enhancement Service..."
echo ""

# Navigate to root directory
cd /Users/anthony/Go\ BARRY\ App/

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Add TomTom Enhancement Service: Geocoding, Routing, POI, and Landmarks

🚀 New Features:
- Created tomtomEnhancementService.js with 4 major capabilities
- Added /api/enhancement/* endpoints for all features
- Integrated automatic enhancement into incident creation
- Added comprehensive test suite

✨ Feature 1: Enhanced Location Service
- Better geocoding for text locations
- UK-focused with bias toward North East
- Returns confidence scores and coordinates

✨ Feature 2: Reverse Geocoding with Landmarks
- Converts coordinates to detailed addresses
- Finds nearby POIs and landmarks for context
- Helps supervisors identify exact locations

✨ Feature 3: Route Impact Calculator
- Calculates delays on affected bus routes
- Compares normal vs current travel times
- Provides severity assessment for supervisors

✨ Feature 4: Alternative Route Suggester
- Finds detours when incidents block routes
- Calculates time/distance differences
- Provides turn-by-turn instructions

🔧 Technical Details:
- Uses TomTom's free tier (2,500 req/day per API)
- In-memory caching to reduce API calls
- Non-blocking enhancement for incidents
- Graceful fallback if APIs unavailable

📊 API Endpoints:
- POST /api/enhancement/location
- POST /api/enhancement/reverse-geocode
- POST /api/enhancement/alternative-route
- POST /api/enhancement/enhance-incident
- GET /api/enhancement/quota
- GET /api/enhancement/test

🎯 Benefits:
- More accurate incident locations
- Better context with landmarks
- Route impact analysis for decisions
- Alternative routing suggestions
- Improved supervisor experience"

# Push to trigger deployment
git push origin main

echo ""
echo "✅ Deployment triggered!"
echo "📡 Render will automatically deploy in ~2 minutes"
echo ""
echo "🧪 Test the new features with:"
echo "  node test-tomtom-enhancements.js"
echo ""
echo "💡 Remember: Each TomTom API has 2,500 requests/day on free tier"
