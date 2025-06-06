#!/bin/bash

# Go Barry v3.0 - Browser-First Quick Deployment Script
# This script sets up and deploys the browser-optimized version

echo "🌐 Go Barry v3.0 - Browser-First Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
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
if [ ! -f "package.json" ] || [ ! -d "Go_BARRY" ]; then
    print_error "Please run this script from the Go Barry App root directory"
    exit 1
fi

print_status "Installing dependencies..."
npm run install:all

print_status "Building browser-optimized version..."
cd Go_BARRY

# Check if all required files exist
if [ ! -f "App.web.tsx" ]; then
    print_error "App.web.tsx not found! Browser-first setup incomplete."
    exit 1
fi

if [ ! -f "app/browser-main.jsx" ]; then
    print_error "browser-main.jsx not found! Browser interface missing."
    exit 1
fi

print_status "Building production web version..."
export NODE_ENV=production
npm run build:web:production

if [ $? -eq 0 ]; then
    print_success "Browser build completed successfully!"
    
    # Check if dist folder was created
    if [ -d "dist" ]; then
        print_success "Production files ready in Go_BARRY/dist/"
        
        echo ""
        print_status "🎯 DEPLOYMENT OPTIONS:"
        echo ""
        echo "1. 📱 LOCAL DEVELOPMENT:"
        echo "   npm run dev:browser"
        echo "   Access: http://localhost:19006"
        echo ""
        echo "2. 🌐 LOCAL PRODUCTION PREVIEW:"
        echo "   npm run serve"
        echo "   Access: http://localhost:3000"
        echo ""
        echo "3. ☁️  WEB SERVER DEPLOYMENT:"
        echo "   Upload 'Go_BARRY/dist' folder to your web server"
        echo ""
        echo "4. 🚀 RENDER/NETLIFY/VERCEL:"
        echo "   Deploy the 'Go_BARRY/dist' folder"
        echo ""
        
        # Ask if user wants to start local preview
        echo ""
        read -p "🚀 Start local preview now? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Starting local preview server..."
            npm run serve
        else
            print_success "Build complete! Ready for deployment."
        fi
        
    else
        print_error "Build completed but dist folder not found"
        exit 1
    fi
else
    print_error "Build failed! Check the error messages above."
    exit 1
fi

print_success "🎉 Go Barry v3.0 Browser-First deployment ready!"
echo ""
print_status "📖 For detailed instructions, see: BROWSER_FIRST_GUIDE.md"
print_status "🎯 For supervisor training, use the built-in help system (Ctrl+7)"
