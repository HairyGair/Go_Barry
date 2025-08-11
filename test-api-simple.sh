#!/bin/bash

echo "Testing Go BARRY Backend Status"
echo "================================"

# Test if the API is responding
echo "1. Testing health endpoint..."
curl -s https://go-barry.onrender.com/api/health | head -c 200
echo ""

echo "2. Testing breakdown test endpoint..."
curl -s https://go-barry.onrender.com/api/breakdowns/test
echo ""

echo "3. Testing with simpler JSON..."
curl -X POST https://go-barry.onrender.com/api/breakdowns/start \
  -H "Content-Type: application/json" \
  -d '{"fleet_number":"6301","supervisor_badge":"AG003","supervisor_name":"Anthony Gair","location":"Test","depot_id":"Gateshead","wizard_type":"brakes"}'

echo ""
echo "Done."
