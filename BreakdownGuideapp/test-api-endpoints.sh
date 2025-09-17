#!/bin/bash

# API Endpoints Test Script
# Tests the backend API endpoints for Supabase integration

echo "🧪 Testing Go North East Breakdown Guide API Endpoints"
echo "======================================================"

# Configuration
API_BASE="https://breakdown-guide.onrender.com"
LOCAL_API="http://localhost:3001"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -e "\n${BLUE}Testing: ${description}${NC}"
    echo "URL: $url"
    
    # Make request and capture response
    response=$(curl -s -o /tmp/response.json -w "%{http_code}" "$url" 2>/dev/null)
    http_code=$response
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ Success: HTTP $http_code${NC}"
        
        # Show response preview
        if [ -f /tmp/response.json ]; then
            echo "Response preview:"
            head -c 200 /tmp/response.json
            echo ""
        fi
    else
        echo -e "${RED}❌ Failed: HTTP $http_code (expected $expected_status)${NC}"
        if [ -f /tmp/response.json ]; then
            echo "Error response:"
            cat /tmp/response.json
        fi
    fi
}

echo -e "\n${YELLOW}🔍 Testing Production API Endpoints${NC}"

# Test production endpoints
test_endpoint "$API_BASE/health" "Health Check"
test_endpoint "$API_BASE/api/fleet?limit=2" "Fleet API - Get Vehicles"
test_endpoint "$API_BASE/api/auth/supervisors" "Auth API - Get Supervisors"
test_endpoint "$API_BASE/api/breakdowns?limit=2" "Breakdowns API - Get Records"

echo -e "\n${YELLOW}🔍 Testing Table Name Mappings${NC}"

# Test specific table queries
test_endpoint "$API_BASE/api/fleet/TEST001" "Fleet API - Get Specific Vehicle"
test_endpoint "$API_BASE/api/auth/supervisor/anthony.gair" "Auth API - Get Specific Supervisor"

echo -e "\n${YELLOW}📊 Data Validation Tests${NC}"

# Check for correct data structure
echo -e "\n${BLUE}Validating fleet_vehicles data structure:${NC}"
curl -s "$API_BASE/api/fleet?limit=1" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'data' in data and len(data['data']) > 0:
        vehicle = data['data'][0]
        print('✅ Fleet data structure valid')
        print(f'   Vehicle keys: {list(vehicle.keys())[:10]}...')
        if 'fleet_number' in vehicle:
            print('✅ Correct field name: fleet_number')
        else:
            print('❌ Missing fleet_number field')
    else:
        print('❌ No fleet data returned')
except Exception as e:
    print(f'❌ JSON parsing failed: {e}')
"

echo -e "\n${BLUE}Validating users (supervisors) data structure:${NC}"
curl -s "$API_BASE/api/auth/supervisors" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if isinstance(data, list) and len(data) > 0:
        supervisor = data[0]
        print('✅ Supervisors data structure valid')
        print(f'   Supervisor keys: {list(supervisor.keys())}')
        if 'username' in supervisor and 'full_name' in supervisor:
            print('✅ Correct field names: username, full_name')
        else:
            print('❌ Missing expected username/full_name fields')
    else:
        print('❌ No supervisor data returned')
except Exception as e:
    print(f'❌ JSON parsing failed: {e}')
"

echo -e "\n${BLUE}Validating breakdown ID format:${NC}"
curl -s "$API_BASE/api/breakdowns?limit=1" | python3 -c "
import sys, json, re
try:
    data = json.load(sys.stdin)
    if 'data' in data and len(data['data']) > 0:
        breakdown = data['data'][0]
        breakdown_id = breakdown.get('breakdown_id', '')
        pattern = r'^BD-\d{4}-\d{5}$'
        if re.match(pattern, breakdown_id):
            print(f'✅ Breakdown ID format correct: {breakdown_id}')
        else:
            print(f'❌ Breakdown ID format incorrect: {breakdown_id}')
    else:
        print('❌ No breakdown data returned')
except Exception as e:
    print(f'❌ JSON parsing failed: {e}')
"

echo -e "\n${GREEN}🎉 API Endpoint Testing Complete${NC}"
echo "=============================================="

# Cleanup
rm -f /tmp/response.json