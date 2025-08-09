#!/bin/bash

# backend/quick-restart-test.sh
# Quick script to restart server and test the filter fix

echo "🔄 Quick Restart and Test for Breakdown System"
echo ""

# Kill the current server
echo "Stopping current server..."
pkill -f "node.*render-startup.js" 2>/dev/null
sleep 2

# Start the server in background
echo "Starting server..."
npm start > server.log 2>&1 &
SERVER_PID=$!

echo "Server starting with PID: $SERVER_PID"
echo "Waiting for server to be ready..."

# Wait for server to start (check every 2 seconds, max 20 seconds)
for i in {1..10}; do
    sleep 2
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health | grep -q "200"; then
        echo "✅ Server is ready!"
        break
    fi
    echo "⏳ Still waiting... ($((i*2))/20 seconds)"
done

# Run the filter test
echo ""
echo "🧪 Testing filters..."
node test-filter-fix.js

echo ""
echo "📝 Server is running in background (PID: $SERVER_PID)"
echo "To stop it later: kill $SERVER_PID"
echo ""
echo "Run full test with: node test-breakdown-complete.js"
