#!/bin/bash

echo "🚀 Starting Go BARRY Backend..."
echo "================================"

# Navigate to backend directory
cd "/Users/anthony/Go BARRY App/backend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🌐 Starting server on port 8080..."
npm start
