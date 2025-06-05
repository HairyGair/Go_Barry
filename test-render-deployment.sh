#!/bin/bash
# test-render-deployment.sh
# Test Go Barry API endpoints on Render after deployment

RENDER_URL="https://go-barry.onrender.com"
echo "🧪 Testing Go Barry API on Render"
echo "=================================="
echo "🔗 Base URL: $RENDER_URL"
echo ""

# Function to test endpoint
test_endpoint() {
    local endpoint="$1"
    local description="$2"
    local full_url="$RENDER_URL$endpoint"
    
    echo "🔍 Testing: $description"
    echo "   URL: $full_url"
    
    # Test with timeout and follow redirects
    response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" \
                   --max-time 30 \
                   --connect-timeout 10 \
                   -L "$full_url")
    
    # Extract HTTP status and timing
    http_status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    time_total=$(echo "$response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*;TIME:[0-9.]*$//')
    
    if [ "$http_status" = "200" ]; then
        echo "   ✅ Status: $http_status (${time_total}s)"
        
        # Check for specific success indicators
        if echo "$body" | grep -q '"success":true'; then
            echo "   ✅ Success: API response indicates success"
        elif echo "$body" | grep -q '"alerts":\['; then
            echo "   ✅ Data: Alerts array found in response"
        elif echo "$body" | grep -q '"status":"operational"'; then
            echo "   ✅ Health: Service operational"
        else
            echo "   ⚠️  Response: No clear success indicators"
        fi
        
        # Check for memory optimization indicators
        if echo "$body" | grep -q '"memoryOptimized"'; then
            echo "   🚀 Memory: Optimization active"
        fi
        
    elif [ "$http_status" = "404" ]; then
        echo "   ❌ Status: $http_status - Endpoint not found"
    elif [ "$http_status" = "500" ]; then
        echo "   ❌ Status: $http_status - Server error"
        if echo "$body" | grep -q "memory"; then
            echo "   💥 Memory: Possible memory-related error"
        fi
    elif [ -z "$http_status" ]; then
        echo "   ❌ Connection: Failed to reach server (timeout or connection error)"
    else
        echo "   ⚠️  Status: $http_status (${time_total}s)"
    fi
    
    echo ""
}

echo "🔄 Starting API endpoint tests..."
echo ""

# Test core endpoints
test_endpoint "/api/health" "Health Check"
test_endpoint "/api/status" "Service Status" 
test_endpoint "/" "Root Endpoint"

# Test main alerts endpoints
test_endpoint "/api/alerts" "Main Alerts (Cached)"
test_endpoint "/api/alerts-enhanced" "Enhanced Alerts (GTFS)"
test_endpoint "/api/alerts-test" "Test Alerts"

# Test configuration
test_endpoint "/api/config" "API Configuration"
test_endpoint "/api/gtfs-status" "GTFS Status"

# Test StreetManager
test_endpoint "/api/streetmanager/status" "StreetManager Status"
test_endpoint "/api/streetmanager/all" "StreetManager Combined"

echo "🏁 API Testing Complete!"
echo ""
echo "📋 Summary of Expected Results:"
echo "   ✅ Health endpoints should return 200 with operational status"
echo "   ✅ Alerts endpoints should return 200 with alerts array"
echo "   ✅ GTFS status should show memory optimization active"
echo "   ✅ All responses should complete under 30 seconds"
echo ""
echo "🚨 Red Flags to Watch For:"
echo "   ❌ 500 errors with memory-related messages"
echo "   ❌ Timeouts or connection failures"
echo "   ❌ Response times over 30 seconds"
echo "   ❌ Empty or malformed JSON responses"
echo ""
echo "💡 If all tests pass, your API is ready for team testing!"
echo "   Share this URL with your team: $RENDER_URL/api/alerts"
