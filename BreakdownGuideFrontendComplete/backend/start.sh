#!/bin/bash

# Breakdown Guide Backend Startup Script
# Makes it easy to start the backend with proper configuration

echo "🚀 Starting Breakdown Guide Backend..."
echo "=================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please edit .env with your configuration before running in production"
    echo ""
fi

# Display configuration
echo "📋 Configuration:"
echo "  Port: ${PORT:-3003}"
echo "  Environment: ${NODE_ENV:-development}"
echo ""

# Start the server
echo "🔧 Starting server..."
echo "=================================="
echo ""

# Use nodemon for development, node for production
if [ "$NODE_ENV" = "production" ]; then
    node server.js
else
    # Check if nodemon is installed
    if command -v nodemon &> /dev/null; then
        nodemon server.js
    else
        echo "⚠️  Nodemon not found, using node instead"
        echo "💡 Install nodemon for auto-reload: npm install -g nodemon"
        node server.js
    fi
fi
