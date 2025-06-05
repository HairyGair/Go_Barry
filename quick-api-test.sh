#!/bin/bash
# quick-api-test.sh
# Quick test of Go Barry API endpoints on Render

echo "🧪 Quick API Test - Go Barry on Render"
echo "======================================="

RENDER_URL="https://go-barry.onrender.com"

# Test basic connectivity
echo "1. Testing basic connectivity..."
curl -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" "$RENDER_URL/"

echo ""
echo "2. Testing health endpoint..."
curl -s -w "Status: %{http_code}, Time: %{time_total}s\n" "$RENDER_URL/api/health"

echo ""
echo "3. Testing main alerts endpoint..."
curl -s -w "Status: %{http_code}, Time: %{time_total}s\n" "$RENDER_URL/api/alerts"

echo ""
echo "4. Testing enhanced alerts endpoint (the one that's failing)..."
curl -s -w "Status: %{http_code}, Time: %{time_total}s\n" "$RENDER_URL/api/alerts-enhanced"

echo ""
echo "5. Testing available endpoints..."
curl -s "$RENDER_URL/api/status" | head -c 200
echo ""
