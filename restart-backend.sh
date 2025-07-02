#!/bin/bash

echo "🔄 Restarting Go BARRY Backend with Bus API..."
echo "==============================================="

# Navigate to backend directory
cd backend

# Check if nodemon is running (development mode)
if pgrep -f "nodemon" > /dev/null; then
    echo "✅ Found nodemon process - development mode"
    echo "📍 Nodemon should auto-reload with the new bus API routes"
    echo "   If not, press Ctrl+C and run: npm run dev"
else
    echo "🔍 Checking for production process..."
    
    # Check if node process is running
    if pgrep -f "render-startup.js" > /dev/null || pgrep -f "index.js" > /dev/null; then
        echo "⚠️  Production mode detected"
        echo "📍 To restart:"
        echo "   1. Press Ctrl+C to stop the current process"
        echo "   2. Run: npm start"
    else
        echo "❌ No backend process found"
        echo "📍 Start the backend with: npm start"
    fi
fi

echo ""
echo "📋 After restart, the following endpoints will be available:"
echo "   - GET  /api/bus-locations"
echo "   - GET  /api/bus-locations/config"
echo "   - GET  /api/bus-locations/stats"
echo "   - POST /api/bus-locations/refresh"
echo "   - GET  /api/bus-locations/test-sources"
echo "   - GET  /api/bus-locations/debug-api"

echo ""
echo "🧪 Test with: node ../test-bus-quick.js"
