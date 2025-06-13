#!/bin/bash

# 🔍 Verify Professional Interface Build
echo "🔍 Checking if professional interface was built correctly..."
echo "========================================================="

cd "$(dirname "$0")/Go_BARRY" || exit 1

if [ ! -d "dist" ]; then
    echo "❌ No dist folder found. Run build first:"
    echo "   npm run build:web"
    exit 1
fi

echo "📁 Build directory: $(pwd)/dist/"
echo "📊 Files built: $(find dist/ -type f | wc -l)"
echo "💾 Build size: $(du -sh dist/ | cut -f1)"

# Check if the main bundle exists
BUNDLE_FILE=$(find dist/_expo/static/js/web/ -name "entry-*.js" 2>/dev/null | head -1)

if [ -n "$BUNDLE_FILE" ]; then
    echo "✅ Main bundle found: $(basename "$BUNDLE_FILE")"
    
    # Check for professional styling keywords in the bundle
    echo ""
    echo "🎨 Checking for professional styling features..."
    
    if grep -q "glassmorphism\|backdrop.*blur\|rgba.*0\.9" "$BUNDLE_FILE" 2>/dev/null; then
        echo "✅ Professional styling detected in bundle"
    else
        echo "⚠️  Professional styling may not be included"
    fi
    
    if grep -q "shadowOffset.*4\|elevation.*6" "$BUNDLE_FILE" 2>/dev/null; then
        echo "✅ Advanced shadow system detected"
    else
        echo "⚠️  Advanced shadows may not be included"
    fi
    
    if grep -q "fontWeight.*700\|letterSpacing" "$BUNDLE_FILE" 2>/dev/null; then
        echo "✅ Professional typography detected"
    else
        echo "⚠️  Professional typography may not be included"
    fi
    
else
    echo "❌ Main bundle not found in dist/_expo/static/js/web/"
    exit 1
fi

echo ""
echo "📋 Next Steps:"
echo "1. Upload ALL contents of dist/ to cPanel public_html"
echo "2. Include .htaccess file for routing"
echo "3. Visit https://gobarry.co.uk to see professional interface"
echo ""
echo "🚦 Ready for deployment!"
