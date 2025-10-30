#!/bin/bash
# Start backend locally for development
# This connects to the production database but runs the server on your local machine

echo "🚀 Starting Go BARRY Backend (Local Development)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env with database credentials"
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server with nodemon for auto-reload
echo "🔄 Starting server with nodemon (auto-reload enabled)..."
echo "📡 Backend will be available at: http://localhost:3001"
echo "🗄️ Connected to: Production MySQL Database"
echo ""
echo "Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev
