#!/bin/bash
# deploy-frontend-enhanced.sh
# Deploy enhanced frontend with map button functionality

echo "🎯 Deploying Enhanced Frontend with Map Button"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "Go_BARRY/package.json" ]; then
    echo "❌ Error: Not in Go BARRY root directory"
    exit 1
fi

cd Go_BARRY

print_status "Building enhanced frontend with map functionality..."

# Check Node version
node_version=$(node --version)
print_status "Using Node.js version: $node_version"

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist/ cpanel-build/ gobarry-cpanel-deployment.zip 2>/dev/null

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Build for production
print_status "Building production web app..."
if npm run build:web:production; then
    print_success "✅ Web build completed successfully"
    
    # Check build size
    if [ -d "dist" ]; then
        build_size=$(du -sh dist | cut -f1)
        print_success "Build size: $build_size"
        
        # List key files
        echo ""
        print_status "Build output:"
        ls -la dist/ | head -10
    fi
else
    echo "❌ Web build failed"
    exit 1
fi

# Also create CPPanel deployment package
print_status "Creating CPPanel deployment package..."
if npm run build:cpanel:zip; then
    print_success "✅ CPPanel deployment package created"
    
    if [ -f "gobarry-cpanel-deployment.zip" ]; then
        zip_size=$(du -sh gobarry-cpanel-deployment.zip | cut -f1)
        print_success "CPPanel package size: $zip_size"
    fi
fi

echo ""
echo "=============================================="
print_success "🎉 Frontend Deployment Packages Ready!"
echo "=============================================="

echo ""
print_status "Deployment Options:"
echo ""
echo "📦 Option 1: Standard Web Deployment"
echo "   • Build location: Go_BARRY/dist/"
echo "   • Upload contents to your web server"
echo "   • Point domain to dist/ folder"
echo ""
echo "📦 Option 2: CPPanel Deployment"
echo "   • Package: gobarry-cpanel-deployment.zip"
echo "   • Upload to CPPanel File Manager"
echo "   • Extract in public_html or domain folder"
echo ""

print_status "New Features Included:"
echo "✅ Map button on every incident card"
echo "✅ Google Maps integration"
echo "✅ Coordinate-based mapping"
echo "✅ Location search fallback"
echo "✅ Enhanced supervisor workflow"

echo ""
print_status "Next Steps:"
echo "1. Deploy using your preferred method above"
echo "2. Test supervisor interface: https://gobarry.co.uk/browser-main"
echo "3. Click MAP button on any incident"
echo "4. Verify Google Maps opens in new tab"
echo "5. Run full system test: node ../test-enhanced-data-feeds.js"

echo ""
print_success "Frontend ready for deployment! 🚀"

cd ..
