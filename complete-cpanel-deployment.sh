#!/bin/bash

echo "🚀 Go BARRY - Complete cPanel Deployment"
echo "========================================"
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Check if source build exists
if [ ! -d "Go_BARRY/dist" ]; then
    echo "❌ No build found! Please run: cd Go_BARRY && npm run build:web"
    exit 1
fi

echo "📦 Copying complete build to cpanel-deployment-fresh..."

# Copy all files from dist
cp -r Go_BARRY/dist/* cpanel-deployment-fresh/

# Overwrite with our optimized files
cp cpanel-deployment-fresh/.htaccess cpanel-deployment-fresh/.htaccess.backup 2>/dev/null
cat > cpanel-deployment-fresh/.htaccess << 'EOF'
# Go BARRY - Professional cPanel Configuration
RewriteEngine On

# CORS Headers for Go BARRY API Integration
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
</IfModule>

# React Router SPA Support
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/_expo/
RewriteRule . /index.html [L]

# GZIP Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain text/html text/css application/javascript application/json
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/* "access plus 1 year"
    ExpiresByType text/html "access plus 1 hour"
</IfModule>

ErrorDocument 404 /index.html
EOF

# Create final upload package
echo "📦 Creating upload package..."
cd cpanel-deployment-fresh
zip -r ../go-barry-cpanel-complete.zip . -x '*.DS_Store' '*.map'
cd ..

# Get stats
FILE_COUNT=$(find cpanel-deployment-fresh -type f | wc -l)
ZIP_SIZE=$(du -sh go-barry-cpanel-complete.zip 2>/dev/null | cut -f1)

echo ""
echo "✅ Go BARRY cPanel Deployment Complete!"
echo "======================================="
echo ""
echo "📦 Package: go-barry-cpanel-complete.zip"
echo "📊 Size: $ZIP_SIZE"
echo "📄 Files: $FILE_COUNT files"
echo ""
echo "🚀 Upload Instructions:"
echo "1. Log into cPanel File Manager"
echo "2. Navigate to public_html directory"
echo "3. Upload go-barry-cpanel-complete.zip"
echo "4. Extract the ZIP file"
echo "5. Visit https://gobarry.co.uk"
echo ""
echo "📖 See: cpanel-deployment-fresh/CPANEL_UPLOAD_GUIDE.md"
echo ""
echo "🌐 Your live URLs:"
echo "   • Main: https://gobarry.co.uk"
echo "   • Display: https://gobarry.co.uk/display"
echo "   • Supervisor: https://gobarry.co.uk/browser-main"
echo ""
