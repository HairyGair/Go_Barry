#!/bin/bash
# Go BARRY Frontend - Production Deployment Script
# Run from project root: bash deploy-frontend.sh

echo "🚀 Go BARRY Frontend Deployment"
echo "================================"

# Check we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "Go_BARRY" ]; then
    echo "❌ Error: Please run this script from the Go BARRY project root"
    exit 1
fi

echo "📍 Current directory: $(pwd)"

# Check Node.js version
echo "📦 Checking Node.js version..."
node --version
npm --version

# Check if backend is accessible
echo "🔍 Checking backend connectivity..."
curl -f https://go-barry.onrender.com/api/health || {
    echo "⚠️  Warning: Backend health check failed. Continuing anyway..."
}

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Build frontend
echo "🔨 Building frontend for production..."
npm run build:frontend

# Check build output
if [ -f "Go_BARRY/dist/index.html" ]; then
    echo "✅ Build successful! Output files:"
    ls -la Go_BARRY/dist/
    
    # Check build size
    BUILD_SIZE=$(du -sh Go_BARRY/dist/ | cut -f1)
    echo "📊 Build size: $BUILD_SIZE"
else
    echo "❌ Build failed - no dist/index.html found"
    exit 1
fi

# Pre-deployment validation
echo "🔍 Pre-deployment validation..."

# Check for required files
REQUIRED_FILES=(
    "Go_BARRY/dist/index.html"
    "Go_BARRY/components/hooks/useSupervisorSync.js"
    "Go_BARRY/config/api.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ Missing required file: $file"
        exit 1
    fi
done

# Check configuration
echo "🔧 Validating configuration..."
if grep -q "go-barry.onrender.com" Go_BARRY/config/api.js; then
    echo "✅ Production API URL configured"
else
    echo "❌ Production API URL not found in config"
    exit 1
fi

if grep -q "EXPO_PUBLIC_API_BASE_URL=https://go-barry.onrender.com" Go_BARRY/.env; then
    echo "✅ Environment variables configured for production"
else
    echo "⚠️  Warning: Check environment variables in Go_BARRY/.env"
fi

echo ""
echo "🎯 Deployment Summary"
echo "===================="
echo "Frontend build: Ready ✅"
echo "API endpoint: https://go-barry.onrender.com ✅"
echo "WebSocket URL: wss://go-barry.onrender.com/ws/supervisor-sync ✅"
echo "Target domain: https://gobarry.co.uk ✅"
echo ""

# Offer to deploy
echo "🚀 Ready to deploy!"
echo ""
echo "Deploy now? (y/n): "
read -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to production..."
    npm run deploy:render
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Deployment completed!"
        echo ""
        echo "📋 Post-deployment checklist:"
        echo "1. Visit https://gobarry.co.uk to test frontend"
        echo "2. Check browser console for any errors"
        echo "3. Test supervisor login and WebSocket connection"
        echo "4. Verify display screen at https://gobarry.co.uk/display"
        echo "5. Test real-time synchronization between supervisor and display"
        echo ""
        echo "🔍 Monitor at:"
        echo "- Frontend: https://gobarry.co.uk"
        echo "- Backend health: https://go-barry.onrender.com/api/health"
        echo "- API status: https://go-barry.onrender.com/api/config"
    else
        echo "❌ Deployment failed. Check the error messages above."
        exit 1
    fi
else
    echo "⏸️  Deployment cancelled. Run 'npm run deploy:render' when ready."
fi

echo ""
echo "🎉 Deployment script completed!"
