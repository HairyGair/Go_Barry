#!/bin/bash

echo "🔍 FINAL TEST - Which file is actually used?"
echo "============================================"
echo ""

cd "$(dirname "$0")"
cd Go_BARRY

echo "🧹 Clear cache..."
rm -rf dist/ .expo/

echo "🔨 Building with BOTH debug banners..."
npx expo export --platform web --output-dir dist

cd ..

echo "📁 Creating test deployment..."
rm -rf final-test-deployment
mkdir -p final-test-deployment
cp -r Go_BARRY/dist/* final-test-deployment/

# Simple .htaccess
cat > final-test-deployment/.htaccess << 'EOF'
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/_expo/
RewriteRule . /index.html [L]
ErrorDocument 404 /index.html
EOF

cat > final-test-deployment/TEST_RESULTS.md << 'EOF'
# 🔍 TEST RESULTS

Visit https://gobarry.co.uk/display and look for:

## 🔴 RED BANNER (top-left):
"✅ FIXED DISPLAY LOADED - 50/50 LAYOUT"
= app/display.jsx is being used

## 🟢 GREEN BANNER (top-right):
"🔧 COMPONENTS/DisplayScreen.jsx LOADED"  
= components/DisplayScreen.jsx is being used

## Expected Results:
- ONE banner should appear (not both)
- 50/50 layout: Alerts left, Map right
- Header shows: "X Supervisors Online"

## If NO banners appear:
- Routing is broken
- Neither React file is loading
- Static HTML is overriding everything
EOF

cd final-test-deployment
zip -r ../final-display-test.zip . -x '*.DS_Store'
cd ..

echo ""
echo "✅ FINAL TEST READY!"
echo "===================="
echo ""
echo "📦 Upload: final-display-test.zip"
echo "🎯 Test URL: https://gobarry.co.uk/display"
echo ""
echo "👀 LOOK FOR:"
echo "   🔴 RED banner = app/display.jsx"
echo "   🟢 GREEN banner = components/DisplayScreen.jsx"
echo "   📐 50/50 layout = FIXED!"
echo ""
echo "Both files now have:"
echo "  ✅ Correct 50/50 layout (flexDirection: 'row')"
echo "  ✅ Supervisor count in header"
echo "  ✅ Debug banners for identification"
echo ""
