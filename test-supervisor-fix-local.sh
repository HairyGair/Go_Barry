#!/bin/bash
# Test supervisor tracking fix locally

echo "🧪 Testing Supervisor Tracking Fix Locally..."

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Not in the Go BARRY App directory"
    echo "Please run from the root project directory"
    exit 1
fi

# Kill any existing backend process
echo -e "\n🛑 Stopping any existing backend..."
pkill -f "node.*backend" || true

# Start the backend
echo -e "\n🚀 Starting backend with supervisor tracking fix..."
cd backend
npm start &
BACKEND_PID=$!

echo -e "\n⏳ Waiting for backend to start (10 seconds)..."
sleep 10

# Test the sync-status endpoint
echo -e "\n🔍 Testing sync-status endpoint..."
curl -s http://localhost:3001/api/supervisor/sync-status | jq '.'

echo -e "\n📋 Backend is running with PID: $BACKEND_PID"
echo ""
echo "🧪 Now test:"
echo "1. Open http://localhost:3000/browser-main"
echo "2. Login as any supervisor"
echo "3. Open http://localhost:3000/display"
echo "4. Check if supervisor count shows correctly"
echo ""
echo "🛑 To stop backend: kill $BACKEND_PID"
