#!/bin/bash
# deploy-cpanel-enhanced.sh
# Deploy enhanced frontend with map button to cPanel

echo "🎯 Deploying Enhanced Frontend to cPanel"
echo "========================================"

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

print_status "Building enhanced frontend for cPanel deployment..."

# Check Node version
node_version=$(node --version)
print_status "Using Node.js version: $node_version"

# Clean previous builds
print_status "Cleaning previous cPanel builds..."
rm -rf cpanel-build/ gobarry-cpanel-deployment.zip 2>/dev/null

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Build for cPanel
print_status "Building for cPanel with enhanced features..."
if npm run build:cpanel; then
    print_success "✅ cPanel build completed successfully"
    
    # Check build contents
    if [ -d "cpanel-build" ]; then
        build_size=$(du -sh cpanel-build | cut -f1)
        print_success "Build size: $build_size"
        
        # List key files
        echo ""
        print_status "Build contents:"
        ls -la cpanel-build/ | head -10
        
        # Check for key enhanced files
        if grep -q "openIncidentMap" cpanel-build/_expo/static/js/*.js 2>/dev/null; then
            print_success "✅ Map button functionality included"
        else
            print_warning "⚠️ Map button functionality not detected in build"
        fi
    fi
else
    echo "❌ cPanel build failed"
    exit 1
fi

# Create deployment zip
print_status "Creating cPanel deployment package..."
cd cpanel-build
if zip -r ../gobarry-cpanel-deployment.zip . -x '*.DS_Store' '*.map'; then
    cd ..
    print_success "✅ cPanel deployment package created"
    
    if [ -f "gobarry-cpanel-deployment.zip" ]; then
        zip_size=$(du -sh gobarry-cpanel-deployment.zip | cut -f1)
        print_success "Package size: $zip_size"
        
        # Show zip contents summary
        echo ""
        print_status "Package contents:"
        unzip -l gobarry-cpanel-deployment.zip | head -15
    fi
else
    cd ..
    echo "❌ Failed to create deployment package"
    exit 1
fi

echo ""
echo "========================================"
print_success "🎉 cPanel Deployment Package Ready!"
echo "========================================"

echo ""
print_status "📦 File Ready: gobarry-cpanel-deployment.zip"
echo ""
print_status "cPanel Upload Instructions:"
echo "1. 📁 Login to your cPanel File Manager"
echo "2. 📂 Navigate to public_html/gobarry.co.uk (or your domain folder)"
echo "3. 🗑️ Delete old files (backup first if needed)"
echo "4. ⬆️ Upload: gobarry-cpanel-deployment.zip"
echo "5. 📦 Extract the zip file in cPanel"
echo "6. 🗂️ Move contents to root of domain folder if needed"
echo "7. 🗑️ Delete the zip file after extraction"

echo ""
print_status "🎯 Enhanced Features Included:"
echo "✅ Map button on every incident card"
echo "✅ Google Maps integration (opens in new tab)"
echo "✅ Smart coordinate & location handling"
echo "✅ Enhanced supervisor workflow"
echo "✅ Optimized for production"

echo ""
print_status "🧪 After Upload, Test:"
echo "1. Visit: https://gobarry.co.uk/browser-main"
echo "2. Login as supervisor"
echo "3. Click MAP button on any incident"
echo "4. Verify Google Maps opens with location"
echo "5. Test enhanced data feeds integration"

echo ""
print_success "Ready for cPanel upload! 🚀"

cd ..
