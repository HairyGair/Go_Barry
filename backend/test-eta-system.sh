#!/bin/bash

# ETA Request System - Test Script
# Run this after deployment to verify everything is working

echo "🧪 ETA Request System Test Suite"
echo "================================"
echo ""

# Configuration
BACKEND_URL="http://localhost:3001"  # Change to https://go-barry.onrender.com for production

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    local expected_result=$3
    
    echo -n "Testing: $test_name... "
    
    result=$(eval $test_command 2>/dev/null)
    
    if [[ $result == *"$expected_result"* ]]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Expected: $expected_result"
        echo "  Got: $result"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "1️⃣  Testing Backend Health"
echo "----------------------------"
run_test "API Health Check" \
    "curl -s $BACKEND_URL/api/health | grep -o '\"success\":true'" \
    '"success":true'

echo ""
echo "2️⃣  Testing ETA Endpoints"
echo "-------------------------"
run_test "Pending ETA Requests Endpoint" \
    "curl -s $BACKEND_URL/api/eta-requests/pending | grep -o 'success'" \
    "success"

run_test "ETA Statistics Endpoint" \
    "curl -s $BACKEND_URL/api/eta-requests/stats | grep -o 'success'" \
    "success"

echo ""
echo "================================"
echo "📊 Test Results Summary"
echo "================================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! ETA System is ready.${NC}"
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠️  Some tests failed. Check the system configuration.${NC}"
    exit 1
fi