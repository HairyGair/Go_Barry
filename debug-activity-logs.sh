#!/bin/bash
# Debug script to check activity log endpoints

API_URL="https://go-barry.onrender.com"

echo "🔍 Testing Activity Log Endpoints..."

# Test the main activity logs endpoint
echo -e "\n1️⃣ Testing /api/activity/logs endpoint..."
curl -s "$API_URL/api/activity/logs?limit=5&screenType=supervisor" | jq

# Test the aliased endpoint
echo -e "\n2️⃣ Testing /api/activity-logs endpoint..."
curl -s "$API_URL/api/activity-logs?limit=5&screenType=supervisor" | jq

# Test without screenType filter
echo -e "\n3️⃣ Testing without screenType filter..."
curl -s "$API_URL/api/activity/logs?limit=5" | jq

# Check active supervisors
echo -e "\n4️⃣ Checking active supervisors..."
curl -s "$API_URL/api/supervisor/active" | jq

# Check the sync-status endpoint that supervisorPollingService uses
echo -e "\n5️⃣ Checking sync-status endpoint..."
curl -s "$API_URL/api/supervisor/sync-status" | jq '.activeSupervisors'

echo -e "\n✅ Debug complete!"
