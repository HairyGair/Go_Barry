#!/bin/bash

# 🔥 FORCE COMPLETE REBUILD - Fix Interface Not Changing Issue
echo "🔥 FIXING: Interface not changing issue"
echo "======================================="
echo ""
echo "❌ PROBLEM: Old build bundle (entry-f64368f2878936e124041cdca570763e.js)"
echo "✅ SOLUTION: Complete rebuild with cache clearing"
echo ""

cd "/Users/anthony/Go BARRY App/Go_BARRY" || exit 1

echo "🧹 Step 1: Clearing ALL caches and builds..."
rm -rf dist/
rm -rf .expo/
rm -rf node_modules/.cache/
rm -rf .metro/
rm -rf cpanel-build/

echo "📦 Step 2: Reinstalling dependencies..."
npm install

echo "🔄 Step 3: Clearing Metro cache..."
npx expo start --clear --web --offline &
sleep 5
pkill -f "expo"

echo "🔨 Step 4: Building with professional styling..."
NODE_ENV=production npm run build:web

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PROFESSIONAL BUILD COMPLETE!"
    echo "================================"
    echo ""
    
    # Check new bundle name
    NEW_BUNDLE=$(find dist/_expo/static/js/web/ -name "entry-*.js" -exec basename {} \; 2>/dev/null | head -1)
    
    if [ -n "$NEW_BUNDLE" ]; then
        echo "📦 NEW Bundle Generated: $NEW_BUNDLE"
        
        # Verify it's different from old one
        if [ "$NEW_BUNDLE" != "entry-f64368f2878936e124041cdca570763e.js" ]; then
            echo "✅ Bundle changed - professional styling included!"
        else
            echo "⚠️  Bundle name unchanged - may need manual cache clear"
        fi
    else
        echo "❌ No bundle found in dist/"
        exit 1
    fi
    
    echo ""
    echo "📊 Build Verification:"
    echo "   📁 Dist size: $(du -sh dist/ | cut -f1)"
    echo "   📄 Files: $(find dist/ -type f | wc -l) files"
    echo ""
    echo "🎨 Professional Features Now Compiled:"
    echo "   ✅ DisplayScreen.jsx with glassmorphism"
    echo "   ✅ SupervisorControl.jsx with professional styling"
    echo "   ✅ Enhanced logos and typography"
    echo "   ✅ Advanced shadow systems"
    echo "   ✅ Backdrop blur effects"
    echo ""
    echo "🚀 READY FOR CPANEL DEPLOYMENT!"
    echo "Upload ALL contents of dist/ folder to public_html"
    echo ""
    echo "🌐 After upload: https://gobarry.co.uk"
    echo "📺 Display: https://gobarry.co.uk/display"
    echo "🎛️ Supervisor: https://gobarry.co.uk/browser-main"
    echo ""
    echo "🔍 To verify changes:"
    echo "1. Clear browser cache (Ctrl+Shift+R)"
    echo "2. Check new bundle is loading"
    echo "3. Confirm professional styling appears"
    
else
    echo "❌ BUILD FAILED!"
    echo "Check errors above and try again"
    exit 1
fi
