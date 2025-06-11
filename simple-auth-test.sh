#!/bin/bash

# simple-auth-test.sh
# Test authentication using curl (no dependencies)

echo "🧪 Testing BARRY API Authentication"
echo "=================================="

echo ""
echo "🔍 Testing main enhanced alerts endpoint..."
curl -s -o /tmp/barry_test.json -w "HTTP Status: %{http_code}\n" "http://localhost:3001/api/alerts-enhanced"

if [ -f /tmp/barry_test.json ]; then
    echo "📊 Response preview:"
    head -c 200 /tmp/barry_test.json
    echo "..."
    echo ""
    
    # Check for specific API source mentions
    if grep -q "tomtom" /tmp/barry_test.json; then
        echo "✅ TomTom API: Working"
    else
        echo "❌ TomTom API: Not working"
    fi
    
    if grep -q "here" /tmp/barry_test.json; then
        echo "✅ HERE API: Working"
    else
        echo "⚠️ HERE API: Not detected in response"
    fi
    
    if grep -q "mapquest" /tmp/barry_test.json; then
        echo "✅ MapQuest API: Working"
    else
        echo "⚠️ MapQuest API: Not detected in response"
    fi
    
    if grep -q "national_highways" /tmp/barry_test.json; then
        echo "✅ National Highways API: Working"
    else
        echo "⚠️ National Highways API: Not detected in response"
    fi
    
    echo ""
    echo "🔍 Checking for auth errors..."
    if grep -q "401\|403\|400" /tmp/barry_test.json; then
        echo "❌ Authentication errors still present"
    else
        echo "✅ No obvious authentication errors"
    fi
    
    rm -f /tmp/barry_test.json
fi

echo ""
echo "🌐 Testing health endpoint..."
curl -s "http://localhost:3001/api/health" | grep -q "healthy" && echo "✅ Backend health: OK" || echo "❌ Backend health: Failed"

echo ""
echo "📈 Live production test:"
echo "   🌐 https://go-barry.onrender.com/api/alerts-enhanced"
