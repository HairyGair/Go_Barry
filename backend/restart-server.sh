#!/bin/bash

# backend/restart-server.sh
# Safely restart the Go BARRY server

echo "🔄 Restarting Go BARRY Backend Server..."
echo ""

# Find and kill the most recent node process
RECENT_PID=$(ps aux | grep "node.*render-startup.js" | grep -v grep | tail -1 | awk '{print $2}')

if [ -n "$RECENT_PID" ]; then
    echo "Found server process: PID $RECENT_PID"
    echo "Stopping server..."
    kill $RECENT_PID
    sleep 2
    echo "✅ Server stopped"
else
    echo "⚠️  No server process found"
fi

# Kill any orphaned processes
echo ""
echo "🧹 Cleaning up old processes..."
ps aux | grep "node.*render-startup.js" | grep -v grep | awk '{print $2}' | while read pid; do
    echo "Killing orphaned process: $pid"
    kill $pid 2>/dev/null
done

echo ""
echo "🚀 Starting server..."
npm start &

echo ""
echo "⏳ Waiting for server to start..."
sleep 5

# Test if server is running
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health | grep -q "200"; then
    echo "✅ Server is running!"
    
    # Test breakdown routes
    echo ""
    echo "🧪 Testing breakdown routes..."
    RESPONSE=$(curl -s http://localhost:3001/api/admin-breakdowns)
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo "✅ Breakdown routes are working!"
        echo "Response: $RESPONSE"
    elif echo "$RESPONSE" | grep -q "No API key"; then
        echo "❌ Still getting authentication error"
        echo "Please check your .env file has correct Supabase credentials"
    else
        echo "❓ Unexpected response: $RESPONSE"
    fi
else
    echo "⚠️  Server may still be starting up..."
    echo "Wait a moment and test manually with:"
    echo "curl http://localhost:3001/api/admin-breakdowns"
fi

echo ""
echo "📝 Next steps:"
echo "1. If you see 'No API key', check your .env file"
echo "2. If you see 'relation does not exist', create the database table"
echo "3. Run the full test: node test-breakdown-logging.js"
