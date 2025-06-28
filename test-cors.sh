#!/bin/bash

# Test CORS fix for www.gobarry.co.uk

echo "🧪 Testing CORS configuration..."
echo ""

# Function to test CORS
test_cors() {
    local origin=$1
    local endpoint=$2
    
    echo "Testing origin: $origin"
    echo "Endpoint: $endpoint"
    
    # Send OPTIONS preflight request
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X OPTIONS \
        -H "Origin: $origin" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        "$endpoint")
    
    if [ "$response" = "200" ]; then
        echo "✅ Preflight passed"
    else
        echo "❌ Preflight failed (HTTP $response)"
    fi
    
    # Send actual request
    cors_header=$(curl -s -I \
        -H "Origin: $origin" \
        "$endpoint" | grep -i "access-control-allow-origin")
    
    if [[ "$cors_header" == *"$origin"* ]] || [[ "$cors_header" == *"*"* ]]; then
        echo "✅ CORS header present: $cors_header"
    else
        echo "❌ CORS header missing or incorrect"
        echo "   Response: $cors_header"
    fi
    
    echo "---"
}

# Test different origins
echo "🌐 Testing production endpoints..."
test_cors "https://www.gobarry.co.uk" "https://go-barry.onrender.com/api/health"
test_cors "https://gobarry.co.uk" "https://go-barry.onrender.com/api/health"
test_cors "http://localhost:3000" "https://go-barry.onrender.com/api/health"

echo ""
echo "📊 Testing alerts endpoint specifically..."
test_cors "https://www.gobarry.co.uk" "https://go-barry.onrender.com/api/alerts-enhanced"

echo ""
echo "✅ Test complete!"
echo ""
echo "If all tests passed, CORS is working correctly."
echo "If any failed, check the backend logs on Render for more details."
