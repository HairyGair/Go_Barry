#!/bin/bash
# deploy-geocoding-fix.sh
# Deploy the improved geocoding system for TomTom alerts

echo "🗺️ DEPLOYING GEOCODING FIX"
echo "========================="

echo "✅ Geocoding improvements applied:"
echo "   - Rate limiting (200ms delay) to prevent OSM throttling"
echo "   - Better User-Agent for OSM requests"
echo "   - Enhanced address parsing (road, area, city)"
echo "   - Mapbox fallback geocoding (if API key available)"
echo "   - Geographic area fallback (Newcastle, Gateshead, etc.)"
echo "   - Detailed logging for debugging"

echo ""
echo "🎯 Expected improvements:"
echo "   - TomTom alerts show actual street names instead of 'Traffic location'"
echo "   - Better location accuracy for incidents"
echo "   - Fallback to area names when street data unavailable"
echo "   - Reduced geocoding failures"

echo ""
echo "🚀 Deploying geocoding fixes..."

git add backend/services/tomtom.js
git commit -m "Fix geocoding: Add rate limiting, Mapbox fallback, geographic areas, better User-Agent for TomTom alerts"
git push origin main

echo ""
echo "✅ Geocoding fix deployed!"
echo ""
echo "⏱️ Wait 3-4 minutes for deployment, then test:"
echo "   node detailed-source-test.js"
echo ""
echo "🎯 Expected results:"
echo "   - TomTom alerts: Real street names (A1, Newcastle Road, etc.)"
echo "   - MapQuest alerts: Already working locations" 
echo "   - Much better location information overall"
echo ""
echo "📋 Geocoding fallback chain:"
echo "   1. OpenStreetMap (with rate limiting)"
echo "   2. Mapbox (if token available)" 
echo "   3. Geographic areas (Newcastle Centre, A1 Corridor, etc.)"
echo "   4. Generic 'North East England' as final fallback"
