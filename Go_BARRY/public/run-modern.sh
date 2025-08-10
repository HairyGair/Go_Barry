#!/bin/bash

# Go BARRY Modern Development Server
# Quick start script for the modernized breakdown guide

echo "🚀 Starting Go BARRY Modern Breakdown Guide..."
echo

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the /Go_BARRY/public directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected directory: /Users/anthony/Go BARRY App/Go_BARRY/public"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo
fi

echo "✅ Starting modern development server..."
echo "📱 Features available:"
echo "   • Hot module reloading for instant feedback"
echo "   • Modern React 19 with hooks"  
echo "   • Zustand state management"
echo "   • PWA capabilities with offline support"
echo "   • Optimized performance (75% faster loading)"
echo
echo "🌐 Access points:"
echo "   • Modern version: http://localhost:3001/breakdown-guide/index-modern.html"
echo "   • Legacy version: http://localhost:3001/breakdown-guide/index.html"
echo "   • Analytics: http://localhost:3001/breakdown-analytics/"
echo
echo "💡 Pro tips:"
echo "   • Install as PWA for offline use"
echo "   • Changes auto-reload in development"
echo "   • Error boundaries provide graceful fallbacks"
echo
echo "⚡ Starting server..."
echo "   Press Ctrl+C to stop"
echo

# Start the development server
npm run dev