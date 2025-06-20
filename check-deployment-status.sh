#!/bin/bash
# Check backend deployment status and routes

API_URL="https://go-barry.onrender.com"

echo "🔍 Checking Backend Deployment Status..."

# Check extended health for version info
echo -e "\n1️⃣ Extended Health Check:"
curl -s "$API_URL/api/health-extended" | jq '{
  version: .version,
  services: .services,
  timestamp: .timestamp
}'

# Check if the routes exist in the deployed version
echo -e "\n2️⃣ Checking Route Existence:"

# These endpoints SHOULD exist if properly deployed
endpoints=(
  "/api/activity-logs"
  "/api/activity/logs" 
  "/api/duty/start"
  "/api/duty/types"
  "/api/supervisor/active"
)

for endpoint in "${endpoints[@]}"; do
  echo -e "\nTesting $endpoint:"
  response=$(curl -s -X GET "$API_URL$endpoint")
  
  # Check if response contains renderOptimized (catch-all response)
  if echo "$response" | grep -q "renderOptimized"; then
    echo "❌ Route NOT FOUND - Getting default response"
  else
    echo "✅ Route EXISTS - Getting proper response"
    echo "$response" | jq -C '.' | head -5
  fi
done

echo -e "\n3️⃣ Deployment Timestamp Check:"
curl -s "$API_URL/api/health-extended" | jq '.timestamp'

echo -e "\n⚠️ If all routes return 'renderOptimized', the backend needs redeployment with the latest code!"
