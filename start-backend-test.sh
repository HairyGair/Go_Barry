#!/bin/bash
# Quick Backend Test and Start Script for Go BARRY

echo "🚦 Go BARRY Backend Quick Start & Test"
echo "====================================="

# Navigate to backend directory
cd "$(dirname "$0")/backend"

echo "📂 Current directory: $(pwd)"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "   Please copy .env.example to .env and configure API keys"
    exit 1
fi

echo "✅ .env file found"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
else
    echo "✅ Backend dependencies installed"
fi

# Test API connectivity first
echo ""
echo "🧪 Testing API connectivity..."
node test-backend-apis.js

echo ""
echo "🚀 Starting backend server..."
echo "   Server will run on http://localhost:3001"
echo "   Press Ctrl+C to stop"
echo ""

# Start the backend server
npm run dev
