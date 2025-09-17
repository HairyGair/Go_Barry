#!/bin/bash

echo "🚀 Testing Go North East Breakdown Guide Integration"
echo "=================================================="

cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/frontend

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🏗️ Starting development server..."
echo "The app should open at http://localhost:3000"
echo ""
echo "To test the Breakdown Guide:"
echo "1. Navigate to http://localhost:3000/breakdown-guide"
echo "2. Select a supervisor and click Login (NO AUTH mode)"
echo "3. Choose a vehicle from the fleet"
echo "4. Select a wizard to test"
echo ""
echo "Press Ctrl+C to stop the server"

npm run dev
