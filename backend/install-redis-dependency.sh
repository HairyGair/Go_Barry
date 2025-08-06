#!/bin/bash
# install-redis-dependency.sh
# Quick installer for Redis dependency

echo "🔴 Installing Redis dependency for Go BARRY..."
echo

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the backend directory"
    exit 1
fi

# Check if redis is already installed
if npm list redis --depth=0 >/dev/null 2>&1; then
    echo "✅ Redis already installed"
    npm list redis --depth=0
else
    echo "📦 Installing redis package..."
    npm install redis
    
    if [ $? -eq 0 ]; then
        echo "✅ Redis installed successfully!"
        npm list redis --depth=0
    else
        echo "❌ Failed to install Redis"
        exit 1
    fi
fi

echo
echo "🎯 Redis Cache Features Now Available:"
echo "• Enhanced caching layer for memory optimization"
echo "• Automatic fallback to memory cache if Redis unavailable"  
echo "• Production-ready Redis connection with error handling"
echo "• Cache statistics and monitoring"
echo
echo "💡 Optional: Set REDIS_URL environment variable for production"
echo "   Example: REDIS_URL=redis://localhost:6379"
echo
echo "🚀 Start the backend to see Redis cache in action:"
echo "   npm run dev"
echo
