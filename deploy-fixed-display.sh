#!/bin/bash

echo "🚀 Go BARRY - Complete cPanel Deployment with Fixed Display"
echo "=========================================================="
echo ""

# Navigate to project root
cd "$(dirname "$0")"

echo "🔨 Building frontend with fixed 50/50 display layout..."
cd Go_BARRY

# Build for web with the corrected display
echo "📦 Running expo export for web with fixed display..."
npx expo export --platform web --output-dir dist --clear

cd ..

# Check if build was successful
if [ ! -d "Go_BARRY/dist" ]; then
    echo "❌ Build failed - no dist folder found"
    exit 1
fi

echo "✅ Build successful with fixed display layout!"

# Copy build to deployment directory
echo "📁 Copying build files to deployment directory..."
rm -rf cpanel-deployment-fixed
mkdir -p cpanel-deployment-fixed
cp -r Go_BARRY/dist/* cpanel-deployment-fixed/

# Verify the copy was successful
if [ ! -f "cpanel-deployment-fixed/index.html" ]; then
    echo "❌ Copy failed - index.html not found in deployment directory"
    exit 1
fi

echo "✅ Files copied successfully!"

# Create optimized .htaccess for cPanel
echo "⚙️ Creating optimized .htaccess configuration..."
cat > cpanel-deployment-fixed/.htaccess << 'EOF'
# Go BARRY - Professional cPanel Configuration
# Fixed Display Layout Version
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

# Create upload instructions
echo "📋 Creating upload instructions..."
cat > cpanel-deployment-fixed/UPLOAD_INSTRUCTIONS.md << 'EOF'
# 🚦 Go BARRY - Fixed Display Layout Deployment

## ✅ FIXES INCLUDED IN THIS BUILD

- ✅ **50/50 Layout**: Alerts on left (50%), Map on right (50%)
- ✅ **Supervisor Count**: Shows number of supervisors online in header
- ✅ **Professional Display**: Optimized for control room environments
- ✅ **Real-time Updates**: Live traffic data and supervisor sync

## 🚀 Upload Instructions

### 1. Access cPanel File Manager
- Log into your cPanel hosting account
- Open **File Manager** 
- Navigate to `public_html` directory

### 2. Upload ALL Files
Upload **EVERY FILE** from this deployment folder:

**Essential Files:**
- `index.html` (main application)
- `.htaccess` (server configuration)
- `_expo/` folder (JavaScript and CSS)
- `assets/` folder (images and icons)
- `gobarry-logo.png` (logo file)
- `metadata.json` (app metadata)

### 3. Verify Upload
After upload, your file structure should look like:
```
public_html/
├── index.html
├── .htaccess
├── _expo/
│   └── static/
│       ├── js/
│       └── css/
├── assets/
├── gobarry-logo.png
└── metadata.json
```

### 4. Test the Fixed Display

Visit these URLs to test:
- **Home Page**: https://gobarry.co.uk
- **Fixed Display**: https://gobarry.co.uk/display ⭐ **THIS IS THE FIXED ONE**
- **Supervisor**: https://gobarry.co.uk/browser-main

### 5. Verify the 50/50 Layout

On the display page you should see:
- ✅ Left side (50%): Live alerts with details
- ✅ Right side (50%): Interactive traffic map
- ✅ Header shows: "X Supervisors Online"
- ✅ Professional control room interface

### 6. Clear Browser Cache

After upload, clear your browser cache:
- **Chrome/Edge**: Ctrl+Shift+R (hard refresh)
- **Firefox**: Ctrl+F5
- **Safari**: Cmd+Shift+R

## 🔧 Troubleshooting

**If you still see the old layout:**
1. Clear browser cache completely
2. Try incognito/private browsing mode
3. Check that ALL files were uploaded correctly

**If alerts don't load:**
- Verify .htaccess file was uploaded
- Check browser console for errors
- Ensure backend API is accessible

---
**Go BARRY v3.0 - Fixed Display Layout**  
Ready for professional deployment! 🚦✅
EOF

# Create ZIP package for easy upload
echo "📦 Creating upload package..."
cd cpanel-deployment-fixed
zip -r ../go-barry-fixed-display.zip . -x '*.DS_Store' '*.map'
cd ..

# Get deployment statistics
FILE_COUNT=$(find cpanel-deployment-fixed -type f | wc -l)
ZIP_SIZE=$(du -sh go-barry-fixed-display.zip 2>/dev/null | cut -f1 || echo "Unknown")
FOLDER_SIZE=$(du -sh cpanel-deployment-fixed 2>/dev/null | cut -f1 || echo "Unknown")

echo ""
echo "✅ Go BARRY Fixed Display Deployment Ready!"
echo "==========================================="
echo ""
echo "🎯 FIXED ISSUES:"
echo "   ✅ 50/50 Layout (Alerts Left | Map Right)"
echo "   ✅ Supervisor Count in Header"
echo "   ✅ Professional Control Room Interface"
echo "   ✅ Real-time Traffic Intelligence"
echo ""
echo "📦 Package Details:"
echo "   📁 Folder: cpanel-deployment-fixed/"
echo "   📦 ZIP File: go-barry-fixed-display.zip"
echo "   📊 ZIP Size: $ZIP_SIZE"
echo "   📄 Total Files: $FILE_COUNT"
echo "   💾 Folder Size: $FOLDER_SIZE"
echo ""
echo "🚀 Ready to Upload!"
echo "==================="
echo "1. Upload 'go-barry-fixed-display.zip' to cPanel File Manager"
echo "2. Extract to public_html directory (replace existing files)"
echo "3. Clear browser cache (Ctrl+Shift+R)"
echo "4. Visit https://gobarry.co.uk/display"
echo ""
echo "📖 See: cpanel-deployment-fixed/UPLOAD_INSTRUCTIONS.md"
echo ""
echo "🌐 URLs After Upload:"
echo "   • Main App: https://gobarry.co.uk"
echo "   • FIXED Display: https://gobarry.co.uk/display ⭐"
echo "   • Supervisor: https://gobarry.co.uk/browser-main"
echo ""
echo "🎉 The 50/50 layout will now work correctly!"
echo ""
