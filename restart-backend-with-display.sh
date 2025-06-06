#!/bin/bash
# Restart Go Barry Backend with Static File Serving

echo "🔄 Restarting Go Barry Backend with Control Room Display Support..."
echo "📁 Static files (HTML, logos) will be served from backend directory"

cd "/Users/anthony/Go BARRY App/backend"

# Kill any existing backend process
echo "🛑 Stopping existing backend..."
pkill -f "index-v3-optimized.js" || echo "No existing backend found"

# Wait a moment
sleep 2

# Start the new backend
echo "🚀 Starting Go Barry Backend v3.0 with HTML display support..."
node --max-old-space-size=2048 --expose-gc index-v3-optimized.js &

echo "✅ Backend starting up..."
echo "📡 Backend API: http://localhost:3001"
echo "🖥️ Control Room Display: http://localhost:3001/control-room-display-screen.html"
echo "📊 Status Check: http://localhost:3001/api/status"
echo ""
echo "🎯 The control room display will now show your Go Barry logo!"

# Show the backend process
sleep 3
echo "📋 Backend process status:"
ps aux | grep index-v3-optimized.js | grep -v grep || echo "Backend may still be starting..."
