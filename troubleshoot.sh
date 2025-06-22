#!/bin/bash
# Comprehensive GO BARRY troubleshooting script

echo "🔧 GO BARRY TROUBLESHOOTING SCRIPT"
echo "================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if backend is running locally
echo "1️⃣ Checking local backend..."
if lsof -ti:3001 >/dev/null 2>&1; then
    echo "✅ Backend is running on port 3001"
    
    # Test local endpoints
    echo "   Testing health endpoint..."
    curl -s http://localhost:3001/api/health | jq '.' || echo "❌ Health check failed"
    
    echo "   Testing alerts endpoint..."
    ALERTS=$(curl -s http://localhost:3001/api/alerts-enhanced | jq '.alerts | length')
    echo "   📊 Alerts found: $ALERTS"
else
    echo "❌ Backend is NOT running on port 3001"
    echo "   Run: cd backend && npm start"
fi
echo ""

# Check production backend
echo "2️⃣ Checking production backend..."
PROD_HEALTH=$(curl -s https://go-barry.onrender.com/api/health | jq '.status' 2>/dev/null)
if [ "$PROD_HEALTH" = '"healthy"' ]; then
    echo "✅ Production backend is healthy"
    
    # Get alert stats
    PROD_ALERTS=$(curl -s https://go-barry.onrender.com/api/alerts-enhanced | jq '.metadata')
    echo "   Production alert stats:"
    echo "$PROD_ALERTS" | jq '.totalAlerts, .sources' 2>/dev/null || echo "❌ Failed to get stats"
else
    echo "❌ Production backend is not responding properly"
fi
echo ""

# Check environment files
echo "3️⃣ Checking environment configuration..."
if [ -f "backend/.env" ]; then
    echo "✅ Backend .env exists"
    
    # Check for required keys
    if grep -q "TOMTOM_API_KEY=" backend/.env; then
        echo "✅ TomTom API key is set"
    else
        echo "❌ TomTom API key is missing"
    fi
    
    if grep -q "CONVEX_URL=" backend/.env; then
        echo "✅ Convex URL is set"
    else
        echo "❌ Convex URL is missing"
    fi
else
    echo "❌ Backend .env file is missing"
fi

if [ -f "Go_BARRY/.env" ]; then
    echo "✅ Frontend .env exists"
else
    echo "❌ Frontend .env file is missing"
fi
echo ""

# Check Node.js and npm versions
echo "4️⃣ Checking Node.js environment..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js version: $NODE_VERSION"
else
    echo "❌ Node.js is not installed"
fi

if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm version: $NPM_VERSION"
else
    echo "❌ npm is not installed"
fi
echo ""

# Provide next steps
echo "5️⃣ NEXT STEPS TO DEBUG:"
echo ""
echo "A) If backend is not running:"
echo "   cd backend"
echo "   npm install"
echo "   npm start"
echo ""
echo "B) To test TomTom API directly:"
echo "   cd backend"
echo "   node test-tomtom-simple.js"
echo ""
echo "C) To debug all components:"
echo "   cd backend"
echo "   node debug-alerts.js"
echo ""
echo "D) To check Metro bundler error:"
echo "   cd Go_BARRY"
echo "   npx expo start -c  # Clear cache and restart"
echo ""
echo "E) Check Convex dashboard:"
echo "   https://dashboard.convex.dev/d/standing-octopus-908"
echo ""

# Save diagnostic info
echo "6️⃣ Saving diagnostic info to debug-report.txt..."
{
    echo "GO BARRY Debug Report - $(date)"
    echo "================================"
    echo ""
    echo "System Info:"
    uname -a
    echo ""
    echo "Node Version:"
    node --version 2>/dev/null || echo "Not installed"
    echo ""
    echo "Backend Status:"
    curl -s http://localhost:3001/api/health 2>/dev/null || echo "Not running"
    echo ""
    echo "Production Status:"
    curl -s https://go-barry.onrender.com/api/health-extended 2>/dev/null || echo "Not accessible"
    echo ""
    echo "Alert Data:"
    curl -s https://go-barry.onrender.com/api/alerts-enhanced | jq '.metadata' 2>/dev/null || echo "Failed"
} > debug-report.txt

echo "✅ Debug report saved to debug-report.txt"
echo ""
echo "📧 If you need help, share debug-report.txt"
