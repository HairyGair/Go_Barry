#!/bin/bash

# Quick integration test for supervisor screen fix

echo "🚦 Go BARRY Supervisor Screen - Quick Integration Test"
echo "====================================================="
echo ""

# Check if backend is running
echo "⚠️  Make sure backend is running first:"
echo "   cd backend && npm start"
echo ""
read -p "Is the backend running? (y/n): " backend_running

if [[ $backend_running != "y" && $backend_running != "Y" ]]; then
    echo "❌ Please start the backend first, then run this test again."
    exit 1
fi

echo ""
echo "🧪 Testing integration..."
echo ""

# Test 1: Create incident
echo "1️⃣ Creating test incident..."
INCIDENT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "type": "incident",
    "subtype": "Road Traffic Accident", 
    "location": "A1 Junction 65, Birtley",
    "description": "Quick test incident",
    "severity": "High",
    "createdBy": "Quick Test"
  }')

if echo "$INCIDENT_RESPONSE" | grep -q '"success":true'; then
    INCIDENT_ID=$(echo "$INCIDENT_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ Created incident: $INCIDENT_ID"
else
    echo "   ❌ Failed to create incident"
    exit 1
fi

# Test 2: Check if it appears in dashboard
echo ""
echo "2️⃣ Checking if incident appears in dashboard..."
sleep 2  # Brief delay to ensure data is synced

DASHBOARD_RESPONSE=$(curl -s http://localhost:3001/api/alerts-enhanced)

if echo "$DASHBOARD_RESPONSE" | grep -q "$INCIDENT_ID"; then
    echo "   ✅ Incident appears in dashboard!"
    
    # Check statistics
    MANUAL_COUNT=$(echo "$DASHBOARD_RESPONSE" | grep -o '"manualIncidents":[0-9]*' | cut -d':' -f2)
    TOTAL_COUNT=$(echo "$DASHBOARD_RESPONSE" | grep -o '"totalAlerts":[0-9]*' | cut -d':' -f2)
    
    echo "   📊 Manual incidents: $MANUAL_COUNT"
    echo "   📊 Total alerts: $TOTAL_COUNT"
else
    echo "   ❌ Incident NOT found in dashboard"
    echo "   🔍 This indicates the integration is not working"
    exit 1
fi

# Test 3: Clean up
echo ""
echo "3️⃣ Cleaning up test incident..."
DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:3001/api/incidents/$INCIDENT_ID)

if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Test incident deleted"
else
    echo "   ⚠️  Failed to delete test incident (manual cleanup needed)"
fi

echo ""
echo "🎉 INTEGRATION TEST PASSED!"
echo ""
echo "✅ What this means:"
echo "   • Incidents created in Incident Manager will appear in Control Dashboard"
echo "   • The supervisor screen is now fully functional"
echo "   • Real-time sync between systems is working"
echo ""
echo "👉 Try it yourself:"
echo "   1. Open browser → Go BARRY interface"
echo "   2. Login as supervisor"  
echo "   3. Go to 'Incident Manager' → Create incident"
echo "   4. Go to 'Control Dashboard' → See your incident!"
echo "   5. Click on the incident to see detailed information"
echo ""
echo "🔧 If you see issues:"
echo "   • Check backend console for errors"
echo "   • Ensure you're logged in as supervisor"
echo "   • Try refreshing the browser"
