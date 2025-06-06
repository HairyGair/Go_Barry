#!/bin/bash

# Go Barry v3.0 - Backend Diagnostic Script

echo "🔍 BARRY Backend Diagnostic"
echo "=========================="

# Test all endpoints with detailed output
echo ""
echo "📡 Testing Backend Endpoints:"
echo ""

# Health endpoint
echo "1. Testing Health Endpoint:"
curl -s -w "Status: %{http_code}\n" http://localhost:3001/api/health
echo ""

# Alerts endpoint
echo "2. Testing Alerts Endpoint:"
ALERTS_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" http://localhost:3001/api/alerts)
ALERTS_HTTP_CODE=$(echo $ALERTS_RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
ALERTS_BODY=$(echo $ALERTS_RESPONSE | sed -E 's/HTTPSTATUS:[0-9]*$//')

echo "Status: $ALERTS_HTTP_CODE"
if [ "$ALERTS_HTTP_CODE" -eq 200 ]; then
    ALERT_COUNT=$(echo $ALERTS_BODY | jq '.alerts | length' 2>/dev/null || echo "Invalid JSON")
    echo "Alert Count: $ALERT_COUNT"
    echo "Sample Response:"
    echo $ALERTS_BODY | jq '.metadata' 2>/dev/null || echo "Cannot parse JSON"
else
    echo "Error Response:"
    echo $ALERTS_BODY
fi
echo ""

# Enhanced alerts endpoint
echo "3. Testing Enhanced Alerts Endpoint:"
ENHANCED_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" http://localhost:3001/api/alerts-enhanced)
ENHANCED_HTTP_CODE=$(echo $ENHANCED_RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
ENHANCED_BODY=$(echo $ENHANCED_RESPONSE | sed -E 's/HTTPSTATUS:[0-9]*$//')

echo "Status: $ENHANCED_HTTP_CODE"
if [ "$ENHANCED_HTTP_CODE" -eq 200 ]; then
    ENHANCED_COUNT=$(echo $ENHANCED_BODY | jq '.alerts | length' 2>/dev/null || echo "Invalid JSON")
    echo "Enhanced Alert Count: $ENHANCED_COUNT"
else
    echo "Error Response:"
    echo $ENHANCED_BODY
fi
echo ""

# Status endpoint
echo "4. Testing Status Endpoint:"
curl -s http://localhost:3001/api/status | jq '.endpoints' 2>/dev/null || echo "Status endpoint not available"
echo ""

# Check what's actually running on port 3001
echo "5. Process Check:"
echo "What's running on port 3001:"
lsof -i :3001 2>/dev/null || echo "No process found on port 3001"
echo ""

# Check backend logs if available
if [ -f "../backend.log" ]; then
    echo "6. Recent Backend Logs:"
    tail -10 ../backend.log
fi

echo ""
echo "🎯 RECOMMENDATIONS:"
echo ""

if [ "$ALERTS_HTTP_CODE" -eq 200 ] && [ "$ENHANCED_HTTP_CODE" -eq 200 ]; then
    echo "✅ All endpoints working! Frontend should connect successfully."
    echo "   Try: npm run dev:browser"
elif [ "$ALERTS_HTTP_CODE" -ne 200 ] || [ "$ENHANCED_HTTP_CODE" -ne 200 ]; then
    echo "⚠️  Alert endpoints not responding correctly."
    echo "   Solution: Restart backend with:"
    echo "   cd backend && npm run start-v3"
else
    echo "❌ Backend not responding. Start it with:"
    echo "   cd backend && npm install && npm run start-v3"
fi
