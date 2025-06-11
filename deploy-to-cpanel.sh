#!/bin/bash

# Deploy Go Barry Frontend to cPanel
echo "📦 Creating Go Barry cPanel Deployment Package..."
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Build the frontend
echo "🔨 Building frontend for production..."
cd Go_BARRY
npm run build:web
cd ..

# Create deployment directory
echo "📁 Creating deployment package..."
rm -rf cpanel-deployment
mkdir -p cpanel-deployment

# Copy built frontend files
if [ -d "Go_BARRY/dist" ]; then
    cp -r Go_BARRY/dist/* cpanel-deployment/
    echo "✅ Frontend files copied"
else
    echo "❌ Build directory not found! Run npm run build:web first"
    exit 1
fi

# Create .htaccess for SPA routing and optimization
cat > cpanel-deployment/.htaccess << 'EOF'
# Go Barry - cPanel .htaccess Configuration

# Enable Rewrite Engine
RewriteEngine On

# Force HTTPS (uncomment if SSL is available)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# CORS Headers for API calls
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"

# Handle React Router (SPA) - redirect all requests to index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# GZIP Compression
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
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/html "access plus 1 hour"
</IfModule>

# Security Headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
EOF

# Create deployment instructions
cat > cpanel-deployment/UPLOAD_INSTRUCTIONS.md << 'EOF'
# Go Barry cPanel Upload Instructions

## 📁 Upload These Files to cPanel

Upload ALL files in this folder to your `public_html` directory on your cPanel hosting.

### 🚀 Quick Steps:

1. **Log into cPanel**
2. **Open File Manager**
3. **Go to public_html directory**
4. **Upload all files from this folder**
5. **Visit https://gobarry.co.uk**

### 📂 Files Included:
- index.html (main app)
- static/ folder (CSS, JS, images)
- .htaccess (routing and optimization)
- asset-manifest.json
- All other build files

### ✅ After Upload:
- Frontend: https://gobarry.co.uk
- Backend API: https://go-barry.onrender.com
- Display Screen: https://gobarry.co.uk/display
- Supervisor: https://gobarry.co.uk/browser-main

Ready to go! 🚦
EOF

# Create zip file for easy upload
echo "📦 Creating upload package..."
cd cpanel-deployment
zip -r ../gobarry-cpanel-upload.zip . -x '*.DS_Store'
cd ..

# Get file count and size
FILE_COUNT=$(find cpanel-deployment -type f | wc -l)
ZIP_SIZE=$(du -sh gobarry-cpanel-upload.zip | cut -f1)

echo ""
echo "✅ cPanel Deployment Package Ready!"
echo "=================================="
echo "📦 Package: gobarry-cpanel-upload.zip" 
echo "📊 Size: $ZIP_SIZE"
echo "📄 Files: $FILE_COUNT files"
echo ""
echo "📁 Package Contents:"
echo "   ✅ Complete frontend build"
echo "   ✅ .htaccess for SPA routing"
echo "   ✅ Upload instructions"
echo "   ✅ Optimized for production"
echo ""
echo "🚀 Next Steps:"
echo "1. Upload gobarry-cpanel-upload.zip to cPanel"
echo "2. Extract to public_html directory"  
echo "3. Visit https://gobarry.co.uk"
echo ""
echo "📖 See: cpanel-deployment/UPLOAD_INSTRUCTIONS.md"
