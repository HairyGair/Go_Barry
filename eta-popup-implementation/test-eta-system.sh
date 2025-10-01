#!/bin/bash

# ETA Request System - Test Script
# Run this after deployment to verify everything is working

echo "🧪 ETA Request System Test Suite"
echo "================================"
echo ""

# Configuration
BACKEND_URL="https://go-barry.onrender.com"
# BACKEND_URL="http://localhost:3001"  # Uncomment for local testing

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

# Function to create a test breakdown
create_test_breakdown() {
    local fleet_no=$1
    local depot=$2
    
    curl -s -X POST "$BACKEND_URL/api/breakdowns/start" \
        -H "Content-Type: application/json" \
        -d "{
            \"fleet_number\": \"$fleet_no\",
            \"supervisor_badge\": \"TEST001\",
            \"supervisor_name\": \"Test Supervisor\",
            \"location\": \"Test Location\",
            \"depot_id\": \"$depot\",
            \"wizard_type\": \"test\"
        }"
}

echo "1️⃣  Testing Backend Health"
echo "----------------------------"
run_test "API Health Check" \
    "curl -s $BACKEND_URL/health | grep -o '\"status\":\"OK\"'" \
    '"status":"OK"'

echo ""
echo "2️⃣  Testing Database Connection"
echo "--------------------------------"
run_test "Pending ETA Requests Endpoint" \
    "curl -s $BACKEND_URL/api/eta-requests/pending | grep -o 'success'" \
    "success"

run_test "ETA Statistics Endpoint" \
    "curl -s $BACKEND_URL/api/eta-requests/stats | grep -o 'success'" \
    "success"

echo ""
echo "3️⃣  Testing Breakdown Creation"
echo "-------------------------------"
# Create a test breakdown
echo -n "Creating test breakdown... "
breakdown_response=$(create_test_breakdown "TEST-001" "Washington")
breakdown_id=$(echo $breakdown_response | grep -o '"breakdown_id":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$breakdown_id" ]; then
    echo -e "${GREEN}✓ Created: $breakdown_id${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Failed to create breakdown${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "4️⃣  Testing ETA Request Flow"
echo "----------------------------"

if [ ! -z "$breakdown_id" ]; then
    # Request ETA
    run_test "Request ETA" \
        "curl -s -X POST $BACKEND_URL/api/breakdowns/$breakdown_id/request-eta \
            -H 'Content-Type: application/json' \
            -d '{
                \"requested_by\": \"SDC001\",
                \"urgency_level\": \"normal\",
                \"notes\": \"Test ETA request\",
                \"fleet_number\": \"TEST-001\",
                \"location\": \"Test Location\",
                \"depot_id\": \"Washington\"
            }' | grep -o 'success'" \
        "success"
    
    # Provide ETA
    run_test "Provide ETA Response" \
        "curl -s -X POST $BACKEND_URL/api/breakdowns/$breakdown_id/provide-eta \
            -H 'Content-Type: application/json' \
            -d '{
                \"engineer_badge\": \"ENG001\",
                \"engineer_name\": \"Test Engineer\",
                \"estimated_minutes\": 30,
                \"notes\": \"On my way\"
            }' | grep -o 'success'" \
        "success"
fi

echo ""
echo "5️⃣  Testing WebSocket Connection"
echo "---------------------------------"
echo -n "Testing WebSocket endpoint... "

# Test if socket.io is responding
socket_test=$(curl -s "$BACKEND_URL/socket.io/?EIO=4&transport=polling" 2>/dev/null | head -c 20)
if [[ ! -z "$socket_test" ]]; then
    echo -e "${GREEN}✓ WebSocket endpoint accessible${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠ WebSocket may not be configured${NC}"
fi

echo ""
echo "6️⃣  Testing Frontend Files"
echo "--------------------------"

# Test if dashboard files are accessible
test_frontend() {
    local file_path=$1
    local file_name=$2
    
    echo -n "Testing $file_name... "
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL$file_path")
    
    if [ "$response_code" = "200" ]; then
        echo -e "${GREEN}✓ Accessible${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}⚠ Not deployed (HTTP $response_code)${NC}"
    fi
}

test_frontend "/engineering-eta-dashboard.html" "Engineering Dashboard"
test_frontend "/enhanced-breakdown-dashboard.html" "SDC Dashboard"

echo ""
echo "7️⃣  Testing Auto-Escalation"
echo "---------------------------"
run_test "Escalation Endpoint" \
    "curl -s -X POST $BACKEND_URL/api/eta-requests/escalate | grep -o 'success'" \
    "success"

echo ""
echo "8️⃣  Performance Test"
echo "--------------------"
echo -n "Testing response time... "
response_time=$(curl -s -o /dev/null -w "%{time_total}" "$BACKEND_URL/api/eta-requests/pending")
response_ms=$(echo "$response_time * 1000" | bc | cut -d'.' -f1)

if [ "$response_ms" -lt 500 ]; then
    echo -e "${GREEN}✓ Fast response: ${response_ms}ms${NC}"
    ((TESTS_PASSED++))
elif [ "$response_ms" -lt 1000 ]; then
    echo -e "${YELLOW}⚠ Acceptable response: ${response_ms}ms${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Slow response: ${response_ms}ms${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "================================"
echo "📊 Test Results Summary"
echo "================================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! System is ready for production.${NC}"
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠️  Some tests failed. Please review and fix issues before deploying.${NC}"
    exit 1
fi