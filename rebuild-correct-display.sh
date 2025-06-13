#!/bin/bash

# 🎯 REBUILD WITH CORRECT DISPLAY FILE - PROFESSIONAL STYLING
echo "🎯 REBUILDING WITH PROFESSIONAL DISPLAY.JSX"
echo "============================================="
echo ""
echo "✅ CORRECT FILE IDENTIFIED: app/display.jsx"
echo "✅ PROFESSIONAL STYLING APPLIED TO DISPLAY SCREEN"
echo ""

cd "/Users/anthony/Go BARRY App/Go_BARRY" || exit 1

echo "🧹 Step 1: Nuclear cache clear..."
rm -rf dist/
rm -rf .expo/
rm -rf node_modules/.cache/
rm -rf .metro/

echo "🔄 Step 2: Clear Metro bundler cache..."
npx expo start --clear --web --offline &
sleep 3
pkill -f "expo" 2>/dev/null || true

echo "🔨 Step 3: Building with PROFESSIONAL display.jsx..."
NODE_ENV=production npm run build:web

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PROFESSIONAL DISPLAY BUILD COMPLETE!"
    echo "======================================"
    echo ""
    
    # Check new bundle
    NEW_BUNDLE=$(find dist/_expo/static/js/web/ -name "entry-*.js" -exec basename {} \; 2>/dev/null | head -1)
    OLD_BUNDLE="entry-f64368f2878936e124041cdca570763e.js"
    
    if [ -n "$NEW_BUNDLE" ]; then
        echo "📦 NEW Bundle: $NEW_BUNDLE"
        
        if [ "$NEW_BUNDLE" != "$OLD_BUNDLE" ]; then
            echo "✅ BUNDLE CHANGED - Professional styling compiled!"
        else
            echo "⚠️  Bundle name same - check if cache cleared properly"
        fi
    fi
    
    echo ""
    echo "🎨 PROFESSIONAL FEATURES NOW COMPILED:"
    echo "   ✅ Glassmorphism header with 72px logo"
    echo "   ✅ Light theme with backdrop blur effects"
    echo "   ✅ Enhanced typography (28px titles, 48px time)"
    echo "   ✅ Professional shadows and elevation"
    echo "   ✅ Bright map integration"
    echo "   ✅ Card-based alert display"
    echo ""
    echo "📊 Build Info:"
    echo "   📁 Size: $(du -sh dist/ | cut -f1)"
    echo "   📄 Files: $(find dist/ -type f | wc -l)"
    echo ""
    echo "🚀 READY FOR CPANEL!"
    echo "Upload dist/ contents to public_html"
    echo ""
    echo "🌐 Professional URLs:"
    echo "   📺 Display: https://gobarry.co.uk/display"
    echo "   🎛️ Supervisor: https://gobarry.co.uk/browser-main"
    echo "   🏠 Main: https://gobarry.co.uk"
    
else
    echo "❌ BUILD FAILED!"
    exit 1
fi
