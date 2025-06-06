#!/bin/bash

# Go Barry v3.0 - Quick Backend Check & Start Script

echo "🚦 BARRY Backend Quick Start"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    print_error "Please run this script from the Go BARRY App root directory"
    exit 1
fi

print_status "Checking backend status..."

# Check if backend is already running
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    print_success "✅ Backend is already running on port 3001!"
    
    # Test alerts endpoint
    print_status "Testing alerts endpoint..."
    ALERT_COUNT=$(curl -s http://localhost:3001/api/alerts | jq '.alerts | length' 2>/dev/null || echo "0")
    print_success "📊 Found $ALERT_COUNT alerts available"
    
    print_status "🌐 Backend URLs:"
    echo "   Health: http://localhost:3001/api/health"
    echo "   Alerts: http://localhost:3001/api/alerts"
    echo "   Enhanced: http://localhost:3001/api/alerts-enhanced"
    
else
    print_warning "⚠️  Backend not running. Starting it now..."
    
    cd backend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_status "Installing backend dependencies..."
        npm install
    fi
    
    print_status "Starting BARRY backend..."
    echo ""
    print_success "🚀 Backend starting on http://localhost:3001"
    print_status "Press Ctrl+C to stop the backend"
    print_status "In another terminal, run: npm run dev:browser"
    echo ""
    
    # Start the backend
    npm run start-v3
fi
