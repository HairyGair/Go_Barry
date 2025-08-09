#!/bin/bash

# Quick server check and fix script for breakdown logging routes

echo "🔍 Checking Go BARRY Backend Status..."
echo ""

# Check if server is responding
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health | grep -q "200"; then
    echo "✅ Server is running"
    
    # Check if breakdown routes exist
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/breakdowns/recent | grep -q "404"; then
        echo "❌ Breakdown routes NOT FOUND"
        echo ""
        echo "📝 The server needs to be restarted to load the new routes:"
        echo ""
        echo "1. Find the terminal running the server"
        echo "2. Press Ctrl+C to stop it"
        echo "3. Run: npm start"
        echo "4. Wait for: 'GO BARRY BACKEND ULTRA-MEMORY-OPTIMIZED READY'"
        echo "5. Then run: node test-breakdown-logging.js"
    else
        echo "✅ Breakdown routes are loaded"
        echo ""
        echo "You can now run: node test-breakdown-logging.js"
    fi
else
    echo "❌ Server is NOT running"
    echo ""
    echo "Start the server with: npm start"
    echo "Then run: node test-breakdown-logging.js"
fi

echo ""
