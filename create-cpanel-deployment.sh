#!/bin/bash

# Fresh Go BARRY cPanel Deployment Script
echo "🚀 Creating Fresh Go BARRY cPanel Deployment..."
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Clean and build the frontend
echo "🔨 Building frontend for cPanel..."
cd Go_BARRY

# Build for web with production optimization
echo "📦 Running expo export for web..."
npx expo export --platform web --output-dir ../cpanel-deployment-fresh --clear

cd ..

# Check if build was successful
if [ ! -d "cpanel-deployment-fresh/static" ]; then
    echo "❌ Build failed - no static folder found"
    exit 1
fi

# Create optimized .htaccess for cPanel
echo "⚙️ Creating .htaccess configuration..."
cat > cpanel-deployment-fresh/.htaccess << 'EOF'
# Go BARRY - Professional cPanel Configuration
# Version 3.0 - Traffic Intelligence Platform

# Enable Rewrite Engine
RewriteEngine On

# Force HTTPS (uncomment if SSL certificate is installed)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# CORS Headers for Go BARRY API Integration
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
    Header always set Access-Control-Max-Age "3600"
</IfModule>

# React Router SPA Support - Route all requests to index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/static/
RewriteRule . /index.html [L]

# GZIP Compression for Performance
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Browser Caching for Static Assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType text/html "access plus 1 hour"
    ExpiresByType application/json "access plus 1 hour"
</IfModule>

# Security Headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options SAMEORIGIN
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Prevent access to source maps in production
<Files "*.map">
    Order allow,deny
    Deny from all
</Files>

# Error pages (optional)
ErrorDocument 404 /index.html
EOF

# Create upload instructions
echo "📋 Creating upload instructions..."
cat > cpanel-deployment-fresh/CPANEL_UPLOAD_GUIDE.md << 'EOF'
# 🚀 Go BARRY - cPanel Upload Guide

## Quick Upload Steps

### 1. Access cPanel File Manager
- Log into your cPanel account
- Open **File Manager**
- Navigate to `public_html` directory

### 2. Upload Files
- **Upload ALL files** from this deployment folder
- Make sure to upload:
  - `index.html` (main app file)
  - `static/` folder (contains CSS, JS, images)
  - `.htaccess` (routing and optimization)
  - `asset-manifest.json`
  - Any other files in this package

### 3. Set Permissions (if needed)
- Set folder permissions to `755`
- Set file permissions to `644`
- Set `.htaccess` permissions to `644`

### 4. Test Your Deployment

Visit these URLs after upload:

- **Main App**: https://gobarry.co.uk
- **Display Screen**: https://gobarry.co.uk/display  
- **Supervisor Interface**: https://gobarry.co.uk/browser-main

### 5. Verify Features

✅ Check these work:
- Traffic alerts loading
- Map displaying (on production, not localhost)
- Supervisor login functionality
- Real-time updates
- Display screen rotation

### 6. Backend Connection

The frontend automatically connects to:
- **Backend API**: https://go-barry.onrender.com
- This provides all traffic data and functionality

## 🔧 Troubleshooting

**If alerts don't load:**
- Check browser console for CORS errors
- Verify .htaccess was uploaded correctly
- Ensure backend API is running

**If routing doesn't work:**
- Verify .htaccess file was uploaded
- Check if mod_rewrite is enabled on your hosting

**Need help?** 
- Check browser developer console for errors
- Verify all files uploaded correctly
- Contact hosting support for .htaccess issues

---
**Go BARRY Traffic Intelligence Platform v3.0**  
Professional deployment ready! ✅
EOF

# Create ZIP package for easy upload
echo "📦 Creating upload package..."
cd cpanel-deployment-fresh
zip -r ../go-barry-cpanel-ready.zip . -x '*.DS_Store' '*.map'
cd ..

# Get deployment statistics
FILE_COUNT=$(find cpanel-deployment-fresh -type f | wc -l)
ZIP_SIZE=$(du -sh go-barry-cpanel-ready.zip 2>/dev/null | cut -f1 || echo "Unknown")
FOLDER_SIZE=$(du -sh cpanel-deployment-fresh 2>/dev/null | cut -f1 || echo "Unknown")

echo ""
echo "✅ Go BARRY cPanel Deployment Ready!"
echo "======================================"
echo ""
echo "📦 Package Details:"
echo "   📁 Folder: cpanel-deployment-fresh/"
echo "   📦 ZIP File: go-barry-cpanel-ready.zip"
echo "   📊 ZIP Size: $ZIP_SIZE"
echo "   📄 Total Files: $FILE_COUNT"
echo "   💾 Folder Size: $FOLDER_SIZE"
echo ""
echo "🎯 Deployment Contents:"
echo "   ✅ Complete React build (index.html + static assets)"
echo "   ✅ Optimized .htaccess (SPA routing + performance)"
echo "   ✅ Upload instructions and troubleshooting guide"
echo "   ✅ Production-ready configuration"
echo ""
echo "🚀 Ready to Upload!"
echo "==================="
echo "1. Upload 'go-barry-cpanel-ready.zip' to cPanel File Manager"
echo "2. Extract to public_html directory"
echo "3. Visit https://gobarry.co.uk"
echo ""
echo "📖 See: cpanel-deployment-fresh/CPANEL_UPLOAD_GUIDE.md"
echo ""
echo "🌐 Your URLs will be:"
echo "   • Main App: https://gobarry.co.uk"
echo "   • Display: https://gobarry.co.uk/display"
echo "   • Supervisor: https://gobarry.co.uk/browser-main"
echo ""
