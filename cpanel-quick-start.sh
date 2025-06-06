#!/bin/bash
# Quick Start Script for Go Barry cPanel Deployment

echo "🚀 Go Barry cPanel Quick Start"
echo "============================="

# Make scripts executable
chmod +x deploy-to-cpanel.sh
echo "✅ Made deployment script executable"

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")
echo "📦 Node.js version: $NODE_VERSION"

if [[ "$NODE_VERSION" == "not installed" ]]; then
    echo "❌ Node.js is required. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "Go_BARRY" ]; then
    echo "❌ Error: Must be run from the Go Barry project root directory"
    exit 1
fi

echo ""
echo "🎯 Quick Start Options:"
echo "======================="
echo "1. 🏗️  Build frontend for cPanel:    npm run deploy:cpanel"
echo "2. 🧪 Test build locally:           npm run deploy:cpanel:test" 
echo "3. 📖 Read full guide:              cat CPANEL_DEPLOYMENT_GUIDE.md"
echo ""
echo "📋 Your Configuration:"
echo "====================="
echo "   🌐 Frontend Domain: gobarry.co.uk"
echo "   🔗 Backend API: api.gobarry.co.uk"
echo "   📁 Build Output: cpanel-build/"
echo "   📦 Deployment Package: gobarry-cpanel-deployment.zip"
echo ""
echo "🚀 Ready to deploy to cPanel!"
echo "Run: ./deploy-to-cpanel.sh"
