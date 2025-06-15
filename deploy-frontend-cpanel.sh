#!/bin/bash

echo "🚀 Deploying Go BARRY Frontend to cPanel..."
echo "==========================================="
echo ""

# Navigate to project root
cd /Users/anthony/Go\ BARRY\ App/

# Ensure we're in the right directory
if [ ! -d "Go_BARRY" ]; then
    echo "❌ Error: Go_BARRY directory not found!"
    exit 1
fi

# Navigate to frontend directory
cd Go_BARRY

echo "📦 Step 1: Installing dependencies..."
npm install

echo ""
echo "🔨 Step 2: Building for web..."
npm run build:web

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed! No dist directory found."
    exit 1
fi

echo ""
echo "📋 Step 3: Preparing deployment files..."

# Create deployment directory
DEPLOY_DIR="gobarry-frontend-deployment-$(date +%Y%m%d-%H%M%S)"
mkdir -p ../$DEPLOY_DIR

# Copy built files
echo "   - Copying dist files..."
cp -r dist/* ../$DEPLOY_DIR/

# Copy any additional required files
echo "   - Copying .htaccess for routing..."
cat > ../$DEPLOY_DIR/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Handle client-side routing for React
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
  
  # Security headers
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Enable gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 month"
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/gif "access plus 1 month"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType text/css "access plus 1 week"
  ExpiresByType application/javascript "access plus 1 week"
  ExpiresByType text/javascript "access plus 1 week"
</IfModule>
EOF

# Create deployment info file
echo "   - Creating deployment info..."
cat > ../$DEPLOY_DIR/deployment-info.txt << EOF
Go BARRY Frontend Deployment
============================
Date: $(date)
Version: 3.0.0
Build: Web (Expo)

Recent Changes:
- Modern alert card design with severity indicators
- Improved typography (larger, bolder titles)
- Better color hierarchy (dark for important, gray for secondary)
- Enhanced spacing and visual layout
- Rounded corners (16px) and subtle shadows
- Color-coded severity indicators
- Updated DisplayScreen.jsx for control room display

Files Included:
- All built web assets from dist/
- .htaccess for proper routing
- This deployment info file

Backend API: https://go-barry.onrender.com

Notes:
- Upload all files to public_html directory
- Ensure .htaccess is included for routing
- Clear browser cache after deployment
EOF

echo ""
echo "🗜️ Step 4: Creating deployment ZIP..."
cd ..
zip -r $DEPLOY_DIR.zip $DEPLOY_DIR

# Check if zip was created
if [ ! -f "$DEPLOY_DIR.zip" ]; then
    echo "❌ Error: Failed to create ZIP file!"
    exit 1
fi

# Get file size
SIZE=$(du -h $DEPLOY_DIR.zip | cut -f1)

echo ""
echo "✅ Deployment package created successfully!"
echo ""
echo "📦 Package Details:"
echo "   - File: $DEPLOY_DIR.zip"
echo "   - Size: $SIZE"
echo "   - Location: $(pwd)/$DEPLOY_DIR.zip"
echo ""
echo "📤 Next Steps:"
echo "   1. Download the ZIP file"
echo "   2. Login to cPanel at www.gobarry.co.uk"
echo "   3. Navigate to File Manager → public_html"
echo "   4. Upload and extract the ZIP file"
echo "   5. Extract files directly into public_html (not a subdirectory)"
echo "   6. Ensure .htaccess is present"
echo "   7. Clear browser cache and test"
echo ""
echo "🎨 Changes Deployed:"
echo "   ✅ Modern alert styling with severity indicators"
echo "   ✅ Improved typography and spacing"
echo "   ✅ Color-coded alerts (Red=High, Amber=Medium, Blue=Low)"
echo "   ✅ Enhanced visual hierarchy"
echo ""
echo "🌐 URLs:"
echo "   - Main Dashboard: https://www.gobarry.co.uk"
echo "   - Display Screen: https://www.gobarry.co.uk/display"
echo "   - Supervisor Interface: https://www.gobarry.co.uk/browser-main"
echo ""

# Clean up deployment directory (keep ZIP)
rm -rf $DEPLOY_DIR

echo "🎉 Deployment package ready for upload!"
