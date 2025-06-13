#!/bin/bash

# Go BARRY Complete cPanel Deployment Script
echo "🚀 Building Go BARRY for cPanel Deployment"
echo "==========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "Go_BARRY" ]; then
    echo "❌ Error: Must be run from the Go Barry project root directory"
    exit 1
fi

echo "📦 Step 1: Building the frontend..."
echo "==================================="
cd Go_BARRY

echo "Installing dependencies..."
npm install

echo "Building for cPanel production..."
npm run build:cpanel

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please check for errors and try again."
    cd ..
    exit 1
fi

cd ..

echo ""
echo "📁 Step 2: Copying build files..."
echo "================================="

# Remove existing deployment folder and create fresh one
rm -rf cpanel-deployment-fresh
mkdir -p cpanel-deployment-fresh

# Copy the build files
if [ -d "Go_BARRY/cpanel-build" ]; then
    echo "Copying all build files..."
    cp -r Go_BARRY/cpanel-build/* cpanel-deployment-fresh/
    echo "✅ Build files copied"
else
    echo "❌ Build directory not found. Build may have failed."
    exit 1
fi

# Copy optimized .htaccess
echo "Installing optimized .htaccess..."
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
RewriteCond %{REQUEST_URI} !^/_expo/
RewriteCond %{REQUEST_URI} !^/assets/
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

# Error pages
ErrorDocument 404 /index.html
EOF

# Add upload guide
echo "Creating upload guide..."
cat > cpanel-deployment-fresh/CPANEL_UPLOAD_GUIDE.md << 'EOF'
# 🚀 Go BARRY - cPanel Upload Guide

## Quick Upload Steps

### 1. Access cPanel File Manager
- Log into your cPanel account  
- Open **File Manager**
- Navigate to `public_html` directory

### 2. Upload Files
**Upload the ZIP file** or **upload all files manually**:

#### Option A - ZIP Upload (Recommended):
1. Upload `go-barry-cpanel-ready.zip` 
2. Right-click → Extract
3. Move extracted files to `public_html` root

#### Option B - Manual Upload:
- Upload ALL files and folders to `public_html`
- Ensure folder structure is preserved

### 3. Verify Upload
Your `public_html` should contain:
- ✅ `index.html`
- ✅ `.htaccess`
- ✅ `_expo/` folder
- ✅ `assets/` folder (if present)
- ✅ Other asset files

### 4. Test Your Site

Visit: **https://gobarry.co.uk**

#### Features to Test:
- ✅ Main page loads
- ✅ Navigation works (`/display`, `/browser-main`)
- ✅ Traffic alerts load
- ✅ Real-time updates
- ✅ Supervisor login

### 5. Troubleshooting

**If site doesn't load:**
- Check `.htaccess` permissions (644)
- Verify mod_rewrite is enabled
- Check browser console for errors

**If alerts don't load:**
- Backend connects to: https://go-barry.onrender.com
- Check CORS headers in browser network tab

**If routing doesn't work:**
- Ensure `.htaccess` is in root directory
- Contact hosting support if needed

---
**Go BARRY v3.0 - Ready for Production!** 🚦
EOF

echo ""
echo "📦 Step 3: Creating deployment package..."
echo "========================================"

cd cpanel-deployment-fresh
zip -r ../go-barry-cpanel-ready.zip . -x '*.DS_Store' '*.map'
cd ..

# Get deployment statistics
FILE_COUNT=$(find cpanel-deployment-fresh -type f | wc -l)
ZIP_SIZE=$(du -sh go-barry-cpanel-ready.zip 2>/dev/null | cut -f1 || echo "Unknown")
FOLDER_SIZE=$(du -sh cpanel-deployment-fresh 2>/dev/null | cut -f1 || echo "Unknown")

echo ""
echo "🎉 Go BARRY cPanel Deployment Complete!"
echo "======================================="
echo ""
echo "📦 Package Details:"
echo "   📁 Folder: cpanel-deployment-fresh/"
echo "   📦 ZIP File: go-barry-cpanel-ready.zip"  
echo "   📊 ZIP Size: $ZIP_SIZE"
echo "   📄 Total Files: $FILE_COUNT"
echo "   💾 Folder Size: $FOLDER_SIZE"
echo ""
echo "🎯 What's Included:"
echo "   ✅ Complete React build (production optimized)"
echo "   ✅ Optimized .htaccess for performance & routing"
echo "   ✅ Complete upload guide with troubleshooting"
echo "   ✅ All static assets and dependencies"
echo "   ✅ Backend API integration configured"
echo ""
echo "🚀 Upload Instructions:"
echo "======================"
echo "1. 📤 Upload 'go-barry-cpanel-ready.zip' to cPanel File Manager"
echo "2. 📂 Extract to public_html directory"  
echo "3. 🌐 Visit https://gobarry.co.uk"
echo ""
echo "📖 Complete guide: cpanel-deployment-fresh/CPANEL_UPLOAD_GUIDE.md"
echo ""
echo "🌐 Your Live URLs:"
echo "   • Main App: https://gobarry.co.uk"
echo "   • Display Screen: https://gobarry.co.uk/display"  
echo "   • Supervisor Tools: https://gobarry.co.uk/browser-main"
echo ""
echo "🔗 Backend API: https://go-barry.onrender.com (pre-configured)"
echo ""
echo "✅ Ready for production deployment!"
echo ""
