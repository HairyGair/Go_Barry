#!/bin/bash
# Quick test script to check if alerts are being fetched and synced

echo "🔍 Testing Go BARRY Alert System..."
echo ""

# Test backend health
echo "1️⃣ Testing backend health..."
curl -s https://go-barry.onrender.com/api/health-extended | jq '.'

echo ""
echo "2️⃣ Testing alerts endpoint..."
curl -s https://go-barry.onrender.com/api/alerts-enhanced | jq '.metadata.sources, .alerts | length'

echo ""
echo "3️⃣ To test Convex sync, run:"
echo "cd backend && node test-convex-sync.js"

echo ""
echo "4️⃣ To see live TomTom data, run:"
echo "cd backend && node test-alerts-status.js"
