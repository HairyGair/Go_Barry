#!/bin/bash

# Test Bus API Endpoints
API_BASE="https://go-barry.onrender.com"

echo "🚌 Testing Go BARRY Bus API Endpoints"
echo "===================================="

# Test 1: Configuration
echo -e "\n1. Testing /api/bus-locations/config"
curl -s "$API_BASE/api/bus-locations/config" | jq '.' || echo "❌ Config endpoint failed"

# Test 2: Statistics
echo -e "\n2. Testing /api/bus-locations/stats"
curl -s "$API_BASE/api/bus-locations/stats" | jq '.' || echo "❌ Stats endpoint failed"

# Test 3: Get Bus Locations
echo -e "\n3. Testing /api/bus-locations"
curl -s "$API_BASE/api/bus-locations" | jq '{success: .success, count: .metadata.count, cached: .metadata.cached}' || echo "❌ Bus locations endpoint failed"

# Test 4: Test Sources
echo -e "\n4. Testing /api/bus-locations/test-sources"
curl -s "$API_BASE/api/bus-locations/test-sources" | jq '{success: .success, recommendation: .recommendation}' || echo "❌ Test sources endpoint failed"

# Test 5: Operations Stats (includes bus info)
echo -e "\n5. Testing /api/operations/stats (bus section)"
curl -s "$API_BASE/api/operations/stats" | jq '.stats.buses' || echo "❌ Operations stats endpoint failed"

echo -e "\n✅ Test complete!"
