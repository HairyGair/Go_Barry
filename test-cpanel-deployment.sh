#!/bin/bash
# test-cpanel-deployment.sh
# Test the deployed cPanel files

echo "🧪 Testing cPanel Deployment"
echo "=========================="

echo "🔍 Based on your cPanel screenshot:"
echo "✅ File structure is PERFECT"
echo "✅ index.html present (1.17 KB)"
echo "✅ _expo/ folder present"
echo "✅ assets/ folder present" 
echo "✅ Permissions correct (644/755)"
echo ""

echo "🎯 Since structure is correct, issue is likely:"
echo "1. 📄 index.html content corrupted"
echo "2. 🔧 Server not serving index.html as default"
echo "3. 📱 Expo app JavaScript errors"
echo "4. 🔍 Hidden .htaccess conflicts"
echo ""

echo "🧪 Quick Tests to Try:"
echo ""
echo "📄 Test 1: Check index.html content"
echo "   • Click index.html in cPanel File Manager"
echo "   • Click 'View' or 'Edit'"
echo "   • Should start with <!DOCTYPE html>"
echo ""

echo "🔗 Test 2: Direct file access"
echo "   • Visit: https://gobarry.co.uk/index.html"
echo "   • If this works but / doesn't, it's server config"
echo ""

echo "🔍 Test 3: Check for hidden files"
echo "   • cPanel File Manager → Settings"
echo "   • Check 'Show Hidden Files'"
echo "   • Look for .htaccess conflicts"
echo ""

echo "📱 Test 4: Check browser console"
echo "   • Visit https://gobarry.co.uk"
echo "   • Open browser Developer Tools (F12)"
echo "   • Look for JavaScript errors in Console tab"
echo ""

echo "🔧 If index.html content looks wrong:"
echo "   • The Expo build might be corrupted"
echo "   • Try: cd Go_BARRY && npm run build:web"
echo "   • Re-upload the new dist/index.html"
echo ""

echo "🎯 Most Likely Fix:"
echo "   • Check index.html content first"
echo "   • If empty/wrong, rebuild and re-upload"
echo "   • If correct, check browser console for JS errors"
