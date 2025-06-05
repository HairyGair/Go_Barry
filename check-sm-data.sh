#!/bin/bash
# Quick Street Manager data check for Go Barry

echo "🔍 Checking Street Manager Data in Go Barry..."
echo ""

# Check if backend is running (try both local and production ports)
if curl -s http://localhost:3001/api/status > /dev/null; then
    BASE_URL="http://localhost:3001"
    echo "✅ Using local backend on port 3001"
elif curl -s http://localhost:10000/api/status > /dev/null; then
    BASE_URL="http://localhost:10000"
    echo "✅ Using production backend on port 10000"
else
    echo "❌ Backend not running on port 3001 or 10000"
    echo "Start with: cd backend && npm start"
    exit 1
fi

echo "📊 StreetManager Status:"
curl -s $BASE_URL/api/streetmanager/status | jq '.status.storage'
echo ""

echo "🚧 Current Activities:"
ACTIVITIES=$(curl -s $BASE_URL/api/streetmanager/activities | jq '.activities | length')
echo "Activities count: $ACTIVITIES"
echo ""

echo "📋 Current Permits:" 
PERMITS=$(curl -s $BASE_URL/api/streetmanager/permits | jq '.permits | length')
echo "Permits count: $PERMITS"
echo ""

echo "🧪 Adding test data..."
curl -s -X POST $BASE_URL/api/streetmanager/test
echo ""

echo "🔄 Checking again after test:"
ACTIVITIES_AFTER=$(curl -s $BASE_URL/api/streetmanager/activities | jq '.activities | length')
echo "Activities count after test: $ACTIVITIES_AFTER"
echo ""

echo "📋 SUMMARY:"
if [ "$ACTIVITIES" -gt 0 ] || [ "$PERMITS" -gt 0 ]; then
    echo "✅ Real data found: $ACTIVITIES activities, $PERMITS permits"
else
    echo "⚠️ No real data - only test data working"
fi

if [ "$ACTIVITIES_AFTER" -gt "$ACTIVITIES" ]; then
    echo "✅ Test system working - data increased after test"
else
    echo "❌ Test system issue - data didn't increase"
fi

echo ""
echo "💡 If you see 0 real data, you may need to:"
echo "   1. Register webhook with DFT at: https://www.gov.uk/guidance/find-and-use-roadworks-data"
echo "   2. Provide webhook URL: https://go-barry.onrender.com/api/streetmanager/webhook"
echo "   3. Wait for DFT approval and real roadworks events to occur"
