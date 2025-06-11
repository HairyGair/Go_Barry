#!/bin/bash
# Comprehensive Render backend debugging

echo "🔍 BARRY Backend Connection Diagnostics"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. Testing basic connectivity...${NC}"

# Test basic connectivity
if curl -s --connect-timeout 10 https://go-barry.onrender.com > /dev/null; then
    echo -e "${GREEN}✅ Basic connection to go-barry.onrender.com successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to go-barry.onrender.com${NC}"
    echo -e "${YELLOW}💡 This usually means:${NC}"
    echo "   - Service is sleeping (free tier)"
    echo "   - Service failed to start"
    echo "   - Wrong URL"
fi

echo -e "\n${BLUE}2. Testing HTTP response...${NC}"

# Test HTTP response with more details
response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" https://go-barry.onrender.com/api/health)
http_code=$(echo $response | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3}).*/\1/')
time_total=$(echo $response | tr -d '\n' | sed -E 's/.*TIME:([0-9.]+).*/\1/')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ HTTP 200 OK (${time_total}s)${NC}"
    echo "Response: $(echo $response | sed -E 's/HTTPSTATUS.*//g')"
elif [ "$http_code" = "000" ]; then
    echo -e "${RED}❌ Connection failed - no HTTP response${NC}"
    echo -e "${YELLOW}💡 Service is likely down or URL is wrong${NC}"
else
    echo -e "${YELLOW}⚠️ HTTP $http_code (${time_total}s)${NC}"
    echo "Response: $(echo $response | sed -E 's/HTTPSTATUS.*//g')"
fi

echo -e "\n${BLUE}3. Testing alternative URLs...${NC}"

# Test alternative URLs
urls=(
    "https://go-barry.onrender.com"
    "https://barry-traffic-intelligence.onrender.com" 
    "https://gobarry.onrender.com"
    "https://go-barry-backend.onrender.com"
)

for url in "${urls[@]}"; do
    echo -n "Testing $url... "
    if curl -s --connect-timeout 5 "$url" > /dev/null; then
        echo -e "${GREEN}✅ Reachable${NC}"
    else
        echo -e "${RED}❌ Failed${NC}"
    fi
done

echo -e "\n${BLUE}4. Testing specific endpoints...${NC}"

# Test specific endpoints
endpoints=(
    "/api/health"
    "/api/supervisor/active"
    "/api/alerts"
)

for endpoint in "${endpoints[@]}"; do
    echo -n "Testing $endpoint... "
    response=$(curl -s -w "%{http_code}" "https://go-barry.onrender.com$endpoint")
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ $http_code${NC}"
    elif [ "$http_code" = "000" ]; then
        echo -e "${RED}❌ No response${NC}"
    else
        echo -e "${YELLOW}⚠️ $http_code${NC}"
    fi
done

echo -e "\n${BLUE}5. DNS Resolution test...${NC}"

# Test DNS resolution
if nslookup go-barry.onrender.com > /dev/null 2>&1; then
    echo -e "${GREEN}✅ DNS resolution successful${NC}"
    nslookup go-barry.onrender.com | grep "Address:" | tail -1
else
    echo -e "${RED}❌ DNS resolution failed${NC}"
fi

echo -e "\n${BLUE}6. Wake-up attempt (if sleeping)...${NC}"

# Try to wake up the service
echo "Sending wake-up request..."
curl -s --connect-timeout 30 https://go-barry.onrender.com > /dev/null &
wake_pid=$!

# Wait and show progress
for i in {1..10}; do
    echo -n "."
    sleep 1
done
echo ""

# Check if wake-up worked
if curl -s --connect-timeout 10 https://go-barry.onrender.com/api/health > /dev/null; then
    echo -e "${GREEN}✅ Service woke up successfully!${NC}"
else
    echo -e "${RED}❌ Service still not responding after wake-up attempt${NC}"
fi

echo -e "\n${YELLOW}📋 SUMMARY & NEXT STEPS:${NC}"
echo "=========================="
echo "1. Check your Render dashboard: https://dashboard.render.com"
echo "2. Look for your service named 'go-barry' or similar"
echo "3. Check the service logs for errors"
echo "4. Verify the service URL matches what we're testing"
echo "5. If free tier: services sleep after 15min of inactivity"
echo ""
echo -e "${BLUE}🔧 If service is running but not responding:${NC}"
echo "   - Check environment variables"
echo "   - Verify start command"
echo "   - Check memory/CPU limits"
echo "   - Look for Node.js errors in logs"
