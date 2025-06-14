#!/bin/bash
# debug-expo-js-loading.sh
# Debug Expo JavaScript loading issues

echo "🔍 Debugging Expo JavaScript Loading"
echo "==================================="

echo "✅ HTML content is correct for Expo app"
echo "🎯 Issue: JavaScript bundle not loading or has errors"
echo ""

echo "📋 Systematic Debug Steps:"
echo ""

echo "🔍 Step 1: Check if JS file exists"
echo "   • cPanel File Manager → _expo/static/js/web/"
echo "   • Look for: entry-d600793e447562948d1c421bd5375dad.js"
echo "   • File should be 500KB+ in size"
echo ""

echo "🌐 Step 2: Check browser console"
echo "   • Visit: https://gobarry.co.uk"
echo "   • Press F12 → Console tab"
echo "   • Look for red error messages"
echo "   • Common errors:"
echo "     - 404 errors (files not found)"
echo "     - SyntaxError (JS compilation issues)"
echo "     - Network errors"
echo ""

echo "📡 Step 3: Check Network tab"
echo "   • F12 → Network tab → Refresh page"
echo "   • Look for failed requests (red entries)"
echo "   • Check if JS bundle loads (large file)"
echo ""

echo "🔧 Quick Fixes Based on Findings:"
echo ""

echo "❌ If JS file missing from _expo folder:"
echo "   1. Delete _expo folder in cPanel"
echo "   2. Re-upload _expo folder from cpanel-build/"
echo "   3. Check file permissions (755 for folders, 644 for files)"
echo ""

echo "❌ If JS file exists but won't load:"
echo "   1. Try basic web build instead:"
echo "      cd Go_BARRY"
echo "      npm run build:web"
echo "   2. Replace index.html and _expo with dist/ contents"
echo ""

echo "❌ If JavaScript errors in console:"
echo "   1. Expo might have server compatibility issues"
echo "   2. Try building with different settings"
echo "   3. Check if server supports modern JavaScript"
echo ""

echo "🎯 Most Common Issue:"
echo "   • _expo folder uploaded incompletely"
echo "   • Missing or corrupted JS bundle files"
echo "   • Server not serving static files correctly"
echo ""

echo "⚡ First Thing to Check:"
echo "   Navigate to: _expo/static/js/web/ in cPanel"
echo "   Verify the JS file exists and has proper size"
