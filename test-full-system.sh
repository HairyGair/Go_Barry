#!/bin/bash

# Go Barry v3.0 - Complete System Test & Deploy Script

echo "🚦 BARRY v3.0 - Browser-First System Test"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Function to test API endpoint
test_endpoint() {
    local url=$1
    local name=$2
    
    if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
        print_success "✅ $name: ONLINE"
        return 0
    else
        print_warning "⚠️  $name: OFFLINE"
        return 1
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "Go_BARRY" ]; then
    print_error "Please run this script from the Go BARRY App root directory"
    exit 1
fi

print_header "🔍 STEP 1: System Dependencies Check"
echo ""

# Check Node.js
if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_success "Node.js: $NODE_VERSION"
else
    print_error "Node.js not found! Please install Node.js 18+"
    exit 1
fi

# Check npm
if command -v npm > /dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    print_success "npm: $NPM_VERSION"
else
    print_error "npm not found!"
    exit 1
fi

echo ""
print_header "🔍 STEP 2: Backend Status Check"
echo ""

# Test backend endpoints
BACKEND_ONLINE=false

if test_endpoint "http://localhost:3001/api/health" "Local Backend Health"; then
    BACKEND_ONLINE=true
    
    # Test more endpoints
    test_endpoint "http://localhost:3001/api/alerts" "Local Alerts API"
    test_endpoint "http://localhost:3001/api/alerts-enhanced" "Local Enhanced Alerts API"
    
    # Get alert count
    ALERT_COUNT=$(curl -s http://localhost:3001/api/alerts 2>/dev/null | jq '.alerts | length' 2>/dev/null || echo "0")
    print_success "📊 Local backend has $ALERT_COUNT alerts available"
    
elif test_endpoint "https://go-barry.onrender.com/api/health" "Production Backend Health"; then
    print_success "📡 Production backend is available as fallback"
    test_endpoint "https://go-barry.onrender.com/api/alerts" "Production Alerts API"
else
    print_warning "⚠️  No backend detected. Demo mode will be used."
fi

echo ""
print_header "🔍 STEP 3: Frontend Dependencies"
echo ""

cd Go_BARRY

if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
else
    print_success "✅ Frontend dependencies already installed"
fi

echo ""
print_header "🔍 STEP 4: Build Test"
echo ""

print_status "Testing browser build..."
if npm run build:web:production > /dev/null 2>&1; then
    print_success "✅ Browser build: SUCCESS"
    
    if [ -d "dist" ]; then
        DIST_SIZE=$(du -sh dist | cut -f1)
        print_success "📦 Build output: dist/ ($DIST_SIZE)"
    fi
else
    print_error "❌ Browser build failed!"
    cd ..
    exit 1
fi

cd ..

echo ""
print_header "🚀 STEP 5: Launch Options"
echo ""

print_success "🎉 BARRY v3.0 Browser-First is ready!"
echo ""
echo "📋 AVAILABLE COMMANDS:"
echo ""
echo "   🖥️  Browser Development:"
echo "      npm run dev:browser"
echo "      # Opens at: http://localhost:19006"
echo ""
echo "   🌐 Production Preview:"
echo "      cd Go_BARRY && npm run serve"
echo "      # Opens at: http://localhost:3000"
echo ""
echo "   🔧 Backend (if not running):"
echo "      ./start-backend.sh"
echo "      # Starts at: http://localhost:3001"
echo ""
echo "   📦 Full Development Stack:"
echo "      npm run dev:full"
echo "      # Starts both backend + browser"
echo ""

echo "🎯 FEATURES READY:"
echo "   ✅ Professional supervisor dashboard"
echo "   ✅ Real-time traffic intelligence"
echo "   ✅ Smart filtering & sorting"
echo "   ✅ Keyboard shortcuts (Ctrl+1-7, F11)"
echo "   ✅ Multiple view modes (grid, list, summary)"
echo "   ✅ Responsive design for all screens"
echo "   ✅ Automatic fallback to demo data"
echo ""

if [ "$BACKEND_ONLINE" = true ]; then
    print_success "🚀 READY TO LAUNCH WITH LIVE DATA!"
    echo ""
    echo "Start now: npm run dev:browser"
else
    print_warning "🚀 READY TO LAUNCH WITH DEMO DATA!"
    echo ""
    echo "For live data: ./start-backend.sh (in another terminal)"
    echo "Then start: npm run dev:browser"
fi

echo ""
print_status "🔗 Quick Links:"
echo "   Browser App: http://localhost:19006"
echo "   Backend API: http://localhost:3001/api/health"
echo "   Production: https://go-barry.onrender.com"
