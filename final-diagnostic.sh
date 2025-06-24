#!/bin/bash

echo "Final diagnostic check..."
echo "========================"

# Test the roadwork-alerts-test endpoint without jq to see raw response
echo -e "\n1. Raw response from roadwork-alerts-test:"
curl -s https://go-barry.onrender.com/api/roadwork-alerts-test

echo -e "\n\n2. Testing if ANY routes from index.js work:"
echo "   - Health (from render-startup.js): should work ✓"
curl -s https://go-barry.onrender.com/api/health -o /dev/null -w "   Status: %{http_code}\n"

echo "   - Supervisor login (from render-startup.js): should work ✓"
curl -s -X POST https://go-barry.onrender.com/api/supervisor/login -o /dev/null -w "   Status: %{http_code}\n"

echo "   - Routes GTFS stats (from index.js): probably won't work ✗"
curl -s https://go-barry.onrender.com/api/routes/gtfs-stats -o /dev/null -w "   Status: %{http_code}\n"

echo "   - Geocoding stats (from index.js): probably won't work ✗"
curl -s https://go-barry.onrender.com/api/geocoding/stats -o /dev/null -w "   Status: %{http_code}\n"

echo -e "\n3. CRITICAL FINDING:"
echo "   render-startup.js creates its own Express app and server"
echo "   It only imports index.js after 5 seconds with:"
echo "   setTimeout(() => { import('./index.js')... }, 5000)"
echo "   But index.js ALSO creates its own app and tries to listen!"
echo "   The routes in index.js are NOT being used by the actual server."

echo -e "\n4. The problem:"
echo "   - render-startup.js app is serving requests"
echo "   - index.js app has all the routes but isn't serving"
echo "   - The import doesn't merge the routes properly"
