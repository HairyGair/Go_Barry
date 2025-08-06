#!/bin/bash
# Test Unified Coordinate Service
# Run this after starting the backend server

echo "🧪 Testing Unified Coordinate Service"
echo "===================================="

# Configuration
BASE_URL="http://localhost:3001"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Process coordinates with location
echo ""
echo "Test 1: Process location (Newcastle)"
RESPONSE=$(curl -s -X POST $BASE_URL/api/coordinates/process \
  -H "Content-Type: application/json" \
  -d '{"location": "Newcastle"}')

if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Test 1 PASSED${NC}"
    echo "Response: $RESPONSE"
else
    echo -e "${RED}❌ Test 1 FAILED${NC}"
    echo "Response: $RESPONSE"
fi

# Test 2: Process coordinates with postcode
echo ""
echo "Test 2: Process postcode (NE1 1AA)"
RESPONSE=$(curl -s -X POST $BASE_URL/api/coordinates/process \
  -H "Content-Type: application/json" \
  -d '{"postcode": "NE1 1AA"}')

if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Test 2 PASSED${NC}"
    echo "Response: $RESPONSE"
else
    echo -e "${YELLOW}⚠️ Test 2 FAILED (postcode API may not be configured)${NC}"
fi

# Test 3: Validate coordinates
echo ""
echo "Test 3: Validate coordinates (Newcastle city center)"
RESPONSE=$(curl -s "$BASE_URL/api/coordinates/validate?lat=54.9783&lng=-1.6178")

if echo "$RESPONSE" | grep -q "true"; then
    echo -e "${GREEN}✅ Test 3 PASSED${NC}"
    echo "Response: $RESPONSE"
else
    echo -e "${RED}❌ Test 3 FAILED${NC}"
    echo "Response: $RESPONSE"
fi

# Test 4: Convert BNG to WGS84
echo ""
echo "Test 4: Convert BNG coordinates"
RESPONSE=$(curl -s -X POST $BASE_URL/api/coordinates/convert \
  -H "Content-Type: application/json" \
  -d '{"easting": 425000, "northing": 565000}')

if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Test 4 PASSED${NC}"
    echo "Response: $RESPONSE"
else
    echo -e "${RED}❌ Test 4 FAILED${NC}"
    echo "Response: $RESPONSE"
fi

# Test 5: Get known locations
echo ""
echo "Test 5: Get known locations"
RESPONSE=$(curl -s "$BASE_URL/api/coordinates/known-locations")

if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Test 5 PASSED${NC}"
    LOCATION_COUNT=$(echo "$RESPONSE" | grep -o '"name"' | wc -l)
    echo "Found $LOCATION_COUNT known locations"
else
    echo -e "${RED}❌ Test 5 FAILED${NC}"
    echo "Response: $RESPONSE"
fi

# Test 6: Get service stats
echo ""
echo "Test 6: Get service statistics"
RESPONSE=$(curl -s "$BASE_URL/api/coordinates/stats")

if echo "$RESPONSE" | grep -q "precision"; then
    echo -e "${GREEN}✅ Test 6 PASSED${NC}"
    echo "Response: $RESPONSE"
else
    echo -e "${RED}❌ Test 6 FAILED${NC}"
    echo "Response: $RESPONSE"
fi

# Test 7: Batch processing
echo ""
echo "Test 7: Batch process multiple locations"
RESPONSE=$(curl -s -X POST $BASE_URL/api/coordinates/batch \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"location": "Newcastle"},
      {"location": "Gateshead"},
      {"location": "Sunderland"}
    ]
  }')

if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Test 7 PASSED${NC}"
    echo "Batch processed successfully"
else
    echo -e "${RED}❌ Test 7 FAILED${NC}"
    echo "Response: $RESPONSE"
fi

# Summary
echo ""
echo "===================================="
echo "📊 Test Summary"
echo "===================================="
echo ""
echo "If all tests passed, the unified coordinate service is working correctly!"
echo "If some tests failed, check:"
echo "1. Is the backend server running? (npm start in backend folder)"
echo "2. Are environment variables set? (check backend/.env)"
echo "3. Is the database migration complete?"
echo ""
echo "For more details, check the logs at: backend/logs/"
