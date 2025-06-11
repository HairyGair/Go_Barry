#!/bin/bash

# run-auth-test.sh
# Quick authentication testing for Go BARRY APIs

echo "🔧 BARRY Authentication Test Runner"
echo "==================================="

cd /Users/anthony/Go\ BARRY\ App/backend

echo "🔍 Testing API authentication..."
node ../fix-auth-issues.js

echo ""
echo "✅ Authentication test complete!"
echo ""
echo "💡 Quick fixes for common issues:"
echo "1. HERE API 400 error: Check HERE_API_KEY format"
echo "2. MapQuest 401 error: Get new key from developer.mapquest.com"  
echo "3. National Highways 401: Contact NH for enterprise API access"
echo ""
echo "🚀 To fix immediately:"
echo "   1. Update .env keys"
echo "   2. Restart backend"
echo "   3. Test with: npm run test-api-endpoints"
