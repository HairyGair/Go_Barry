#!/bin/bash
# Quick Frontend Test Script for Go BARRY

echo "📱 Go BARRY Frontend Quick Start"
echo "================================"

# Navigate to frontend directory
cd "$(dirname "$0")/Go_BARRY"

echo "📂 Current directory: $(pwd)"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
else
    echo "✅ Frontend dependencies installed"
fi

echo ""
echo "🚀 Starting frontend..."
echo "   Web interface will open in browser"
echo "   API Test available at: /test-api"
echo "   Press Ctrl+C to stop"
echo ""

# Start the frontend using npm script (most reliable)
npm run web
