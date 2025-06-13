#!/bin/bash

echo "🔍 DEBUGGING - Testing if display.jsx is actually loading"
echo "======================================================="
echo ""

cd "$(dirname "$0")"
cd Go_BARRY

echo "🧹 Quick cache clear..."
rm -rf dist/
rm -rf .expo/web

echo "🔨 Building with debug indicator..."
npx expo export --platform web --output-dir dist

cd ..

if [ ! -f "Go_BARRY/dist/index.html" ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "📁 Creating debug deployment..."
rm -rf debug-deployment
mkdir -p debug-deployment
cp -r Go_BARRY/dist/* debug-deployment/

# Create simple .htaccess
cat > debug-deployment/.htaccess << 'EOF'
RewriteEngine On

# SPA Routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/_expo/
RewriteRule . /index.html [L]

ErrorDocument 404 /index.html
EOF

cat > debug-deployment/DEBUG_TEST.md << 'EOF'
# 🔍 DEBUG TEST

Upload this to cPanel and test:

1. Visit https://gobarry.co.uk/display
2. Look for RED BANNER at top that says "✅ FIXED DISPLAY LOADED - 50/50 LAYOUT"

## If you see the RED BANNER:
- The correct React component is loading!
- The 50/50 layout should be working
- Problem was browser cache

## If you DON'T see the RED BANNER:
- The routing is broken
- Static HTML is overriding the React component
- We need to fix the routing system

## What to look for:
- Red banner = SUCCESS (component loading)
- No red banner = ROUTING PROBLEM
EOF

cd debug-deployment
zip -r ../debug-test.zip . -x '*.DS_Store'
cd ..

echo ""
echo "✅ DEBUG TEST READY!"
echo "==================="
echo ""
echo "📦 Upload: debug-test.zip"
echo "📋 Instructions: debug-deployment/DEBUG_TEST.md"
echo ""
echo "🎯 TEST: Visit https://gobarry.co.uk/display"
echo "👀 LOOK FOR: Red banner saying 'FIXED DISPLAY LOADED'"
echo ""
echo "If you see the red banner = component is loading correctly!"
echo "If no red banner = routing problem!"
echo ""
