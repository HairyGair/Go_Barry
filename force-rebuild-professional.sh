#!/bin/bash

# 🚀 Force Rebuild Professional Go BARRY Interface
echo "✨ Forcing rebuild of Professional Go BARRY Interface..."
echo "======================================================"

# Navigate to Go_BARRY directory
cd "$(dirname "$0")/Go_BARRY" || exit 1

echo "🧹 Cleaning previous build..."
rm -rf dist/
rm -rf .expo/
rm -rf cpanel-build/

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building professional interface with latest changes..."
npm run build:web

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Professional interface built successfully!"
    echo ""
    echo "📊 Build Statistics:"
    echo "   Directory: $(pwd)/dist/"
    echo "   Files: $(find dist/ -type f | wc -l) files"
    echo "   Size: $(du -sh dist/ | cut -f1)"
    echo ""
    echo "🎨 Professional Features Included:"
    echo "   ✅ Glassmorphism design with blur effects"
    echo "   ✅ Premium shadow system"
    echo "   ✅ Professional typography"
    echo "   ✅ Enhanced logo integration (48px)"
    echo "   ✅ Gradient control buttons"
    echo "   ✅ Card-based stats design"
    echo ""
    echo "📦 Ready for cPanel deployment!"
    echo "Upload the entire contents of dist/ folder to public_html"
    echo ""
    echo "🌐 After upload visit: https://gobarry.co.uk"
else
    echo "❌ Build failed! Check for errors above."
    exit 1
fi
