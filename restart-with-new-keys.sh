#!/bin/bash

# restart-with-new-keys.sh
# Restart BARRY backend with updated API keys

echo "🔄 Restarting BARRY Backend with Updated API Keys"
echo "================================================="

cd "$(dirname "$0")/backend"

echo "📋 Updated API Keys:"
echo "   ✅ HERE: New key from developer portal"
echo "   ✅ MapQuest: Alternative key from Go_Barry app"  
echo "   ✅ National Highways: Secondary key"
echo ""

echo "🛑 Stopping any running backend processes..."
pkill -f "node.*index.js" 2>/dev/null || true
sleep 2

echo "🚀 Starting backend with new keys..."
NODE_ENV=development npm start &

BACKEND_PID=$!
echo "📍 Backend started with PID: $BACKEND_PID"

echo ""
echo "⏱️ Waiting 10 seconds for startup..."
sleep 10

echo "🧪 Testing authentication..."
cd ..
node quick-auth-test.js

echo ""
echo "🌐 Testing main API endpoint..."
curl -s "http://localhost:3001/api/health" | grep -q "healthy" && echo "✅ Backend is responding" || echo "❌ Backend not responding"

echo ""
echo "📊 Check full API status:"
echo "   Local:  http://localhost:3001/api/alerts-enhanced"
echo "   Live:   https://go-barry.onrender.com/api/alerts-enhanced"
echo ""
echo "🎯 If auth issues persist, run: ./disable-failing-apis.sh"
