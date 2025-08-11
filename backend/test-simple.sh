#!/bin/bash
# Simple test to check if backend is running and routes are working

echo "Checking Backend Status..."
echo "=========================="

# Test 1: Health check
echo ""
echo "1. Health check:"
curl -s http://localhost:3001/api/health
echo ""

# Test 2: Check breakdown endpoint (without JSON parsing)
echo ""
echo "2. Breakdown endpoint response:"
curl -s -X POST http://localhost:3001/api/breakdowns/start \
  -H "Content-Type: application/json" \
  -d '{"fleet_number":"5501","supervisor_badge":"AG003"}'
echo ""

# Test 3: Check if getting HTML error
echo ""
echo "3. Checking response type:"
response=$(curl -s -I http://localhost:3001/api/breakdowns/live)
echo "$response" | head -n 3

echo ""
echo "If you see HTML or 404 errors above, the backend is not running correctly."
echo "Start it with: cd backend && node render-startup.js"
