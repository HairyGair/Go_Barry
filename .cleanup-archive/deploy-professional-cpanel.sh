#!/bin/bash

# 🚀 Deploy Professional Go BARRY Interface to cPanel
echo "✨ Deploying Professional Go BARRY Interface..."
echo "=============================================="

# Change to Go_BARRY directory
cd "Go_BARRY" || exit 1

echo "🔨 Building professional interface..."
npm run build:web

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📦 Professional deployment package ready in: Go_BARRY/dist/"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Upload ALL contents of Go_BARRY/dist/ to cPanel public_html"
    echo "2. Upload the .htaccess file from cpanel-deployment-professional/"
    echo "3. Visit https://gobarry.co.uk to see your professional interface"
    echo ""
    echo "✨ Professional features included:"
    echo "   - Glassmorphism design with blur effects"
    echo "   - Premium shadows and depth"
    echo "   - Professional typography"
    echo "   - Enhanced logo integration"
    echo "   - Gradient control buttons"
    echo "   - Card-based stats design"
    echo ""
    echo "🌐 Live URLs after deployment:"
    echo "   - Main App: https://gobarry.co.uk"
    echo "   - Display Screen: https://gobarry.co.uk/display"
    echo "   - Supervisor: https://gobarry.co.uk/browser-main"
    echo ""
    echo "🚦 Ready for professional traffic intelligence!"
else
    echo "❌ Build failed! Check for errors above."
    exit 1
fi
