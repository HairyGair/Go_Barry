#!/bin/bash

# Test Fleet Intelligence API Endpoints
# This script tests all Fleet Intelligence endpoints to ensure they're working

echo "🔍 Testing Fleet Intelligence API"
echo "================================="
echo ""

# Configuration
API_BASE="https://go-barry.onrender.com/api/fleet-intelligence"
# For local testing, uncomment:
# API_BASE="http://localhost:3001/api/fleet-intelligence"

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo "Testing: $description"
    echo "Endpoint: $API_BASE$endpoint"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE$endpoint")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ Success (HTTP 200)${NC}"
        
        # Get actual data for preview
        data=$(curl -s "$API_BASE$endpoint")
        echo "Preview:"
        echo "$data" | head -c 200
        echo "..."
    elif [ "$response" = "404" ]; then
        echo -e "${RED}❌ Not Found (HTTP 404) - Endpoint not registered${NC}"
    elif [ "$response" = "500" ]; then
        echo -e "${YELLOW}⚠️ Server Error (HTTP 500) - Check logs${NC}"
    else
        echo -e "${RED}❌ Failed (HTTP $response)${NC}"
    fi
    
    echo ""
    echo "---"
    echo ""
}

# Test each endpoint
echo "1️⃣ Health Scores Endpoint"
test_endpoint "/health-scores" "Vehicle health scores based on breakdown history"

echo "2️⃣ Cost Analysis Endpoint"
test_endpoint "/cost-analysis" "Today's breakdown cost analysis"

echo "3️⃣ Problem Vehicles Endpoint"
test_endpoint "/problem-vehicles" "Top 10 vehicles with most breakdowns"

echo "4️⃣ Predictions Endpoint"
test_endpoint "/predictions" "Breakdown predictions based on patterns"

echo "5️⃣ Depot Comparison Endpoint"
test_endpoint "/depot-comparison" "Breakdown rates across depots"

# Test the frontend
echo "6️⃣ Testing Frontend Dashboard"
echo "URL: https://go-barry.onrender.com/public/fleet-intelligence.html"
frontend_response=$(curl -s -o /dev/null -w "%{http_code}" "https://go-barry.onrender.com/public/fleet-intelligence.html")

if [ "$frontend_response" = "200" ]; then
    echo -e "${GREEN}✅ Frontend accessible${NC}"
else
    echo -e "${RED}❌ Frontend not accessible (HTTP $frontend_response)${NC}"
fi

echo ""
echo "================================="
echo "📊 Test Summary"
echo ""

# Quick health check of main API
main_api_response=$(curl -s -o /dev/null -w "%{http_code}" "https://go-barry.onrender.com/api/health")
if [ "$main_api_response" = "200" ]; then
    echo -e "${GREEN}✅ Main API is running${NC}"
else
    echo -e "${RED}❌ Main API is not responding${NC}"
fi

echo ""
echo "📝 Next Steps:"
echo "1. If endpoints return 404, ensure backend is deployed with Fleet Intelligence API"
echo "2. If endpoints return 500, check Render.com logs for errors"
echo "3. If frontend is not accessible, check Go_BARRY/public directory"
echo ""
echo "🔗 Direct Links to Test:"
echo "Dashboard: https://go-barry.onrender.com/public/fleet-intelligence.html"
echo "Health API: https://go-barry.onrender.com/api/fleet-intelligence/health-scores"
