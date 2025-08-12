#!/bin/bash

echo "🚀 Starting Go BARRY Breakdown Tracking System..."
echo ""

# Start backend in background
echo "Starting backend API server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start dashboard server
echo ""
echo "Starting dashboard server..."
cd ..
node dashboard-server.js &
DASHBOARD_PID=$!

echo ""
echo "================================================"
echo "✅ Breakdown Tracking System is running!"
echo ""
echo "📊 Dashboard: http://localhost:3002"
echo "🔧 API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "================================================"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $DASHBOARD_PID; exit" INT
wait
