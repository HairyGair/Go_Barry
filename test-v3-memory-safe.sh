#!/bin/bash
# test-v3-memory-safe.sh
# Test Go Barry v3.0 Memory Optimized Backend

echo "🧪 TESTING GO BARRY v3.0 MEMORY OPTIMIZED"
echo "========================================="
echo ""

cd "/Users/anthony/Go BARRY App/backend"

echo "📊 System Memory Check:"
echo "Available memory: $(free -h 2>/dev/null | grep Mem || echo 'Memory info not available')"
echo ""

echo "📦 Testing memory-optimized startup..."
echo "Command: npm run start-v3"
echo ""

# Start backend in background and capture PID
npm run start-v3 &
BACKEND_PID=$!

echo "🚀 Backend started with PID: $BACKEND_PID"
echo "⏳ Waiting 10 seconds for startup..."
sleep 10

# Test if backend is responding
echo ""
echo "🧪 Testing v3.0 endpoints..."

echo "1️⃣ Health Check:"
curl -s "http://localhost:3001/api/health" | head -200 || echo "❌ Health check failed"

echo ""
echo ""
echo "2️⃣ Status Check:"
curl -s "http://localhost:3001/api/status" | head -200 || echo "❌ Status check failed"

echo ""
echo ""
echo "3️⃣ Enhanced Alerts:"
curl -s "http://localhost:3001/api/alerts" | head -200 || echo "❌ Alerts check failed"

echo ""
echo ""
echo "4️⃣ NEW: Incidents API:"
curl -s "http://localhost:3001/api/incidents" | head -200 || echo "❌ Incidents API failed"

echo ""
echo ""
echo "5️⃣ NEW: Messaging API:"
curl -s "http://localhost:3001/api/messaging/channels" | head -200 || echo "❌ Messaging API failed"

echo ""
echo ""
echo "🔧 Backend Process Info:"
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend still running (PID: $BACKEND_PID)"
    ps -p $BACKEND_PID -o pid,ppid,rss,vsz,comm || echo "Process info not available"
else
    echo "❌ Backend process died"
fi

echo ""
echo "🛑 Stopping test backend..."
kill $BACKEND_PID 2>/dev/null
wait $BACKEND_PID 2>/dev/null

echo ""
echo "✅ Test complete!"
echo ""
echo "🎯 If successful, you should have seen:"
echo "   ✅ Go Barry v3.0 startup messages"
echo "   ✅ All 5 endpoints responding"
echo "   ✅ Memory usage under 100MB"
echo "   ✅ No heap out of memory errors"
echo ""
echo "🚀 Ready to deploy to Render if all tests passed!"
