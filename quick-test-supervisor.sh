#!/bin/bash

# Quick test script for Go BARRY Supervisor Screen fix

echo "🚦 Go BARRY Supervisor Screen - Quick Test"
echo "=========================================="
echo ""

echo "Step 1: Testing if backend is running..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running!"
    echo "💡 Start it with: cd backend && npm start"
    exit 1
fi

echo ""
echo "Step 2: Testing incident API endpoints..."

echo "📋 Testing GET /api/incidents..."
curl -s http://localhost:3001/api/incidents | jq '.success' > /dev/null && echo "✅ Incidents endpoint working" || echo "❌ Incidents endpoint failed"

echo "🗺️ Testing geocoding endpoint..."
curl -s http://localhost:3001/api/geocode/Newcastle | jq '.success' > /dev/null && echo "✅ Geocoding endpoint working" || echo "❌ Geocoding endpoint failed"

echo "🚏 Testing stop search endpoint..."
curl -s "http://localhost:3001/api/routes/search-stops?query=Newcastle" | jq '.success' > /dev/null && echo "✅ Stop search endpoint working" || echo "❌ Stop search endpoint failed"

echo "🗺️ Testing route finder endpoint..."
curl -s "http://localhost:3001/api/routes/find-near-coordinate?lat=54.9783&lng=-1.6178" | jq '.success' > /dev/null && echo "✅ Route finder endpoint working" || echo "❌ Route finder endpoint failed"

echo ""
echo "Step 3: Testing incident creation..."
INCIDENT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "type": "incident",
    "subtype": "Road Traffic Accident", 
    "location": "A1 Junction 65, Birtley",
    "description": "Test incident created by quick test script",
    "severity": "Medium",
    "createdBy": "Quick Test",
    "createdByRole": "Test Script"
  }')

if echo "$INCIDENT_RESPONSE" | jq '.success' > /dev/null 2>&1; then
    echo "✅ Incident creation working"
    INCIDENT_ID=$(echo "$INCIDENT_RESPONSE" | jq -r '.incident.id')
    echo "📝 Created incident: $INCIDENT_ID"
else
    echo "❌ Incident creation failed"
fi

echo ""
echo "📊 Summary:"
echo "If all tests passed ✅, the supervisor screen should now work!"
echo ""
echo "🌐 Next steps:"
echo "1. Open your browser to the Go BARRY interface"
echo "2. Login as a supervisor" 
echo "3. Navigate to 'Incident Manager'"
echo "4. Try creating a new incident"
echo ""
echo "🔧 If tests failed, check:"
echo "- Backend console for errors"
echo "- Ensure all dependencies are installed"
echo "- Check if ports are available"
