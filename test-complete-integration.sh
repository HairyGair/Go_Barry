#!/bin/bash
# Complete Supabase Integration Test Suite

echo "🧪 COMPLETE SUPABASE INTEGRATION TEST"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend URL
BACKEND_URL="https://go-barry.onrender.com"

echo "📋 Test Suite Overview:"
echo "1. Database Connection"
echo "2. Supervisor Authentication" 
echo "3. Activity Logging"
echo "4. Display Screen Tracking"
echo "5. Alert Dismissals"
echo "6. Active Supervisors"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}TEST 1: Backend Health Check${NC}"
echo "Testing: GET /api/health"
HEALTH_RESPONSE=$(curl -s -w "\nSTATUS:%{http_code}" "$BACKEND_URL/api/health")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | grep "STATUS:" | cut -d: -f2)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed (Status: $HEALTH_STATUS)${NC}"
fi
echo ""

# Test 2: Supervisor Login
echo -e "${YELLOW}TEST 2: Supervisor Authentication${NC}"
echo "Testing: POST /api/supervisor/login"
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/supervisor/login" \
  -H "Content-Type: application/json" \
  -d '{"supervisorId": "supervisor003", "badge": "AG003"}' \
  -w "\nSTATUS:%{http_code}")

LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | grep "STATUS:" | cut -d: -f2)
if [ "$LOGIN_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Supervisor login successful${NC}"
    # Extract sessionId for further tests
    SESSION_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"sessionId":"[^"]*' | cut -d'"' -f4)
    echo "   Session ID: $SESSION_ID"
else
    echo -e "${RED}❌ Supervisor login failed (Status: $LOGIN_STATUS)${NC}"
    SESSION_ID=""
fi
echo ""

# Test 3: Activity Logging
echo -e "${YELLOW}TEST 3: Activity Logging${NC}"
echo "Testing: POST /api/activity/display-view"
ACTIVITY_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/activity/display-view" \
  -H "Content-Type: application/json" \
  -d '{
    "alertCount": 5,
    "criticalCount": 2,
    "viewTime": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }' \
  -w "\nSTATUS:%{http_code}")

ACTIVITY_STATUS=$(echo "$ACTIVITY_RESPONSE" | grep "STATUS:" | cut -d: -f2)
if [ "$ACTIVITY_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Activity logging successful${NC}"
else
    echo -e "${RED}❌ Activity logging failed (Status: $ACTIVITY_STATUS)${NC}"
fi
echo ""

# Test 4: Fetch Activity Logs
echo -e "${YELLOW}TEST 4: Fetch Activity Logs${NC}"
echo "Testing: GET /api/activity/logs"
LOGS_RESPONSE=$(curl -s "$BACKEND_URL/api/activity/logs?limit=5" \
  -w "\nSTATUS:%{http_code}")

LOGS_STATUS=$(echo "$LOGS_RESPONSE" | grep "STATUS:" | cut -d: -f2)
if [ "$LOGS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Activity logs fetched successfully${NC}"
    LOG_COUNT=$(echo "$LOGS_RESPONSE" | grep -o '"count":[0-9]*' | cut -d: -f2)
    echo "   Found $LOG_COUNT activity logs"
else
    echo -e "${RED}❌ Failed to fetch activity logs (Status: $LOGS_STATUS)${NC}"
fi
echo ""

# Test 5: Get Active Supervisors
echo -e "${YELLOW}TEST 5: Active Supervisors${NC}"
echo "Testing: GET /api/supervisor/active"
ACTIVE_RESPONSE=$(curl -s "$BACKEND_URL/api/supervisor/active" \
  -w "\nSTATUS:%{http_code}")

ACTIVE_STATUS=$(echo "$ACTIVE_RESPONSE" | grep "STATUS:" | cut -d: -f2)
if [ "$ACTIVE_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Active supervisors fetched successfully${NC}"
else
    echo -e "${RED}❌ Failed to fetch active supervisors (Status: $ACTIVE_STATUS)${NC}"
fi
echo ""

# Test 6: Alert Dismissal (if we have a session)
if [ -n "$SESSION_ID" ]; then
    echo -e "${YELLOW}TEST 6: Alert Dismissal${NC}"
    echo "Testing: POST /api/supervisor/dismiss-alert"
    DISMISS_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/supervisor/dismiss-alert" \
      -H "Content-Type: application/json" \
      -d '{
        "alertId": "test-alert-'$(date +%s)'",
        "reason": "Test dismissal",
        "sessionId": "'$SESSION_ID'",
        "alertData": {
          "location": "Test Location",
          "title": "Test Alert"
        }
      }' \
      -w "\nSTATUS:%{http_code}")
    
    DISMISS_STATUS=$(echo "$DISMISS_RESPONSE" | grep "STATUS:" | cut -d: -f2)
    if [ "$DISMISS_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Alert dismissal successful${NC}"
    else
        echo -e "${RED}❌ Alert dismissal failed (Status: $DISMISS_STATUS)${NC}"
    fi
else
    echo -e "${YELLOW}TEST 6: Alert Dismissal - SKIPPED (no session)${NC}"
fi
echo ""

# Test 7: Activity Summary
echo -e "${YELLOW}TEST 7: Activity Summary${NC}"
echo "Testing: GET /api/activity-logs/summary"
SUMMARY_RESPONSE=$(curl -s "$BACKEND_URL/api/activity-logs/summary?timeRange=today" \
  -w "\nSTATUS:%{http_code}")

SUMMARY_STATUS=$(echo "$SUMMARY_RESPONSE" | grep "STATUS:" | cut -d: -f2)
if [ "$SUMMARY_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Activity summary fetched successfully${NC}"
else
    echo -e "${RED}❌ Failed to fetch activity summary (Status: $SUMMARY_STATUS)${NC}"
fi
echo ""

# Summary
echo "===================================="
echo -e "${YELLOW}TEST SUMMARY${NC}"
echo ""

# Count successes
SUCCESS_COUNT=0
[ "$HEALTH_STATUS" = "200" ] && ((SUCCESS_COUNT++))
[ "$LOGIN_STATUS" = "200" ] && ((SUCCESS_COUNT++))
[ "$ACTIVITY_STATUS" = "200" ] && ((SUCCESS_COUNT++))
[ "$LOGS_STATUS" = "200" ] && ((SUCCESS_COUNT++))
[ "$ACTIVE_STATUS" = "200" ] && ((SUCCESS_COUNT++))
[ "$DISMISS_STATUS" = "200" ] && ((SUCCESS_COUNT++))
[ "$SUMMARY_STATUS" = "200" ] && ((SUCCESS_COUNT++))

TOTAL_TESTS=7
echo "Passed: $SUCCESS_COUNT / $TOTAL_TESTS tests"

if [ $SUCCESS_COUNT -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the output above.${NC}"
fi
echo ""

# Logout if we have a session
if [ -n "$SESSION_ID" ]; then
    echo "🚪 Logging out supervisor..."
    curl -s -X POST "$BACKEND_URL/api/supervisor/logout" \
      -H "Content-Type: application/json" \
      -d '{"sessionId": "'$SESSION_ID'"}' > /dev/null
    echo "✅ Logged out"
fi