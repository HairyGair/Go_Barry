#!/bin/bash

echo "🔄 Go BARRY - FORCE FRESH BUILD (Clear All Caches)"
echo "=================================================="
echo ""

cd "$(dirname "$0")"
cd Go_BARRY

echo "🧹 Clearing ALL caches and build artifacts..."
# Clear Expo cache
npx expo start --clear --no-dev --web &
EXPO_PID=$!
sleep 5
kill $EXPO_PID 2>/dev/null || true

# Clear build directories
rm -rf dist/
rm -rf .expo/
rm -rf node_modules/.cache/
rm -rf web-build/

echo "✅ All caches cleared!"

echo "🔨 Building completely fresh..."
npx expo export --platform web --output-dir dist --clear

if [ ! -f "dist/index.html" ]; then
    echo "❌ Fresh build failed"
    exit 1
fi

echo "✅ Fresh build complete!"

# Check what's actually in the build
echo "📋 Build contents:"
ls -la dist/
echo ""
echo "📋 JavaScript files:"
find dist/ -name "*.js" | head -5

cd ..

# Copy to deployment
echo "📁 Creating fresh deployment..."
rm -rf cpanel-deployment-fresh-build
mkdir -p cpanel-deployment-fresh-build
cp -r Go_BARRY/dist/* cpanel-deployment-fresh-build/

# Create .htaccess
cat > cpanel-deployment-fresh-build/.htaccess << 'EOF'
RewriteEngine On

# CORS Headers
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
</IfModule>

# SPA Routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/_expo/
RewriteRule . /index.html [L]

# Caching
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/* "access plus 1 year"
    ExpiresByType text/html "access plus 1 hour"
</IfModule>

ErrorDocument 404 /index.html
EOF

# Create instructions
cat > cpanel-deployment-fresh-build/DEPLOYMENT_NOTES.md << 'EOF'
# FRESH BUILD DEPLOYMENT

## What This Contains:
- Completely fresh build with cleared caches
- Fixed 50/50 display layout 
- Updated supervisor count in header

## Upload Instructions:
1. Upload ALL files to public_html
2. HARD REFRESH browser (Ctrl+Shift+Delete to clear all cache)
3. Test: https://gobarry.co.uk/display

## If Still Not Working:
1. Check browser developer console for errors
2. Verify all files uploaded correctly
3. Try incognito/private browsing mode

## Expected Display Layout:
- Left 50%: Traffic alerts
- Right 50%: Live map
- Header: Shows supervisor count
EOF

cd cpanel-deployment-fresh-build
zip -r ../go-barry-FRESH-BUILD.zip . -x '*.DS_Store'
cd ..

echo ""
echo "✅ FRESH BUILD DEPLOYMENT READY!"
echo "================================"
echo ""
echo "📦 Package: go-barry-FRESH-BUILD.zip"
echo "📁 Folder: cpanel-deployment-fresh-build/"
echo ""
echo "🚀 CRITICAL: After upload, CLEAR ALL BROWSER CACHE"
echo "   Chrome: Ctrl+Shift+Delete > All time > Clear data"
echo "   Then test: https://gobarry.co.uk/display"
echo ""
