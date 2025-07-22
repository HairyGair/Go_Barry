#!/bin/bash
# Start the Go BARRY backend

echo "🚀 Starting Go BARRY Backend..."
cd backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the backend
echo "🌟 Starting backend on port 3001..."
npm start
