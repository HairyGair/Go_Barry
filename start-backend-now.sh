#!/bin/bash
# Start Go BARRY Backend

cd "/Users/anthony/Go BARRY App/backend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🚀 Starting Go BARRY backend..."
echo "📍 Backend will run on http://localhost:3001"
echo ""

# Start the backend
npm start
