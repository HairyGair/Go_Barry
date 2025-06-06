#!/bin/bash
# test-backend-v3.sh
# Test if Go Barry v3.0 backend starts correctly after fixes

echo "🧪 TESTING GO BARRY v3.0 BACKEND"
echo "================================"
echo ""

cd "/Users/anthony/Go BARRY App/backend"

echo "📦 Checking package.json start command..."
npm run start --dry-run

echo ""
echo "🚀 Starting backend with full logging..."
echo "Expected: All import issues should be resolved"
echo ""

# Start backend and capture both stdout and stderr
node index.js 2>&1 | head -50

echo ""
echo "🔍 If successful, you should see:"
echo "   ✅ BARRY Backend Starting with Enhanced Geocoding..."
echo "   ✅ Incident Management API ready"
echo "   ✅ Message Distribution API ready"
echo "   ✅ Server: http://localhost:3001"
echo ""
