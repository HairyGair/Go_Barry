#!/bin/bash

echo "🔄 Backend Restart Script"
echo "========================="
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed or not in PATH"
    echo "   Install with: npm install -g pm2"
    exit 1
fi

echo "📋 Current PM2 processes:"
pm2 list

echo ""
echo "🔍 Checking for gobarry-backend process..."

# Check if process exists
if pm2 list | grep -q "gobarry-backend"; then
    echo "✅ Process found - restarting..."
    pm2 restart gobarry-backend
    pm2 save
else
    echo "⚠️  Process not found - starting fresh..."

    # Navigate to api directory
    cd ~/api || {
        echo "❌ ~/api directory not found"
        exit 1
    }

    echo "📍 Working directory: $(pwd)"
    echo "📄 Files in directory:"
    ls -la

    # Check if server.js exists
    if [ ! -f "server.js" ]; then
        echo "❌ server.js not found in ~/api"
        exit 1
    fi

    # Check if .env exists
    if [ ! -f ".env" ]; then
        echo "⚠️  Warning: .env file not found"
    fi

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
    fi

    # Start the process
    echo "🚀 Starting backend with PM2..."
    pm2 start server.js --name "gobarry-backend" --time
    pm2 save
fi

echo ""
echo "⏱️  Waiting 3 seconds for server to start..."
sleep 3

echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "📜 Recent PM2 Logs (last 20 lines):"
pm2 logs gobarry-backend --lines 20 --nostream

echo ""
echo "🏥 Testing health endpoint..."
sleep 2
curl -s https://api.breakdowns.gobarry.co.uk/health | head -20

echo ""
echo "✅ Restart script completed"
echo ""
echo "Next steps:"
echo "  1. Check the logs above for any errors"
echo "  2. Visit https://api.breakdowns.gobarry.co.uk/health in your browser"
echo "  3. Try logging in at https://breakdowns.gobarry.co.uk"
echo ""
echo "To view live logs: pm2 logs gobarry-backend"
echo "To stop the server: pm2 stop gobarry-backend"
echo "To restart the server: pm2 restart gobarry-backend"
