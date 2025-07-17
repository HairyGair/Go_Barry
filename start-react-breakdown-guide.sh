#!/bin/bash

echo "🚀 Setting up React Breakdown Guide..."

# Navigate to breakdown-guide directory
cd "/Users/anthony/Go BARRY App/breakdown-guide"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo "🔄 Starting development server..."
echo "📖 Access the guide at: http://localhost:3000"
echo "🔄 The server will start automatically..."

# Start the development server
npm start
