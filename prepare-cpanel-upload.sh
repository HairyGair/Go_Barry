#!/bin/bash

# Breakdown System - cPanel Deployment Preparation Script
# This script prepares your files for cPanel upload

echo "🚀 Go North East Breakdown System - cPanel Deployment Prep"
echo "========================================================="

# Configuration
SOURCE_DIR="./public"
DEPLOY_DIR="./cpanel-upload"
BACKEND_URL="https://go-barry.onrender.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create deployment directory
echo -e "${YELLOW}Creating deployment directory...${NC}"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR/breakdown/wizards
mkdir -p $DEPLOY_DIR/breakdown/assets/css
mkdir -p $DEPLOY_DIR/breakdown/assets/images
mkdir -p $DEPLOY_DIR/dashboard

# Copy breakdown guide files
echo -e "${YELLOW}Copying breakdown guide files...${NC}"
if [ -d "$SOURCE_DIR/breakdown-guide" ]; then
    cp $SOURCE_DIR/breakdown-guide/guide.html $DEPLOY_DIR/breakdown/
    cp $SOURCE_DIR/breakdown-guide/supervisorBreakdownLogger.js $DEPLOY_DIR/breakdown/
    cp $SOURCE_DIR/breakdown-guide/*-wizard.js $DEPLOY_DIR/breakdown/wizards/ 2>/dev/null || true
    echo -e "${GREEN}✓ Breakdown guide files copied${NC}"
else
    echo -e "${RED}✗ Breakdown guide directory not found${NC}"
fi

# Copy dashboard
echo -e "${YELLOW}Copying dashboard files...${NC}"
if [ -f "$SOURCE_DIR/enhanced-breakdown-dashboard.html" ]; then
    cp $SOURCE_DIR/enhanced-breakdown-dashboard.html $DEPLOY_DIR/dashboard/index.html
    echo -e "${GREEN}✓ Dashboard copied${NC}"
else
    echo -e "${RED}✗ Dashboard file not found${NC}"
fi

# Copy configuration
echo -e "${YELLOW}Copying configuration...${NC}"
cp cpanel-deployment-config.js $DEPLOY_DIR/breakdown/config.js
echo -e "${GREEN}✓ Configuration copied${NC}"

# Update API URLs in JavaScript files
echo -e "${YELLOW}Updating API URLs to production...${NC}"
find $DEPLOY_DIR -name "*.js" -type f -exec sed -i.bak "s|http://localhost:3001|$BACKEND_URL|g" {} \;
find $DEPLOY_DIR -name "*.html" -type f -exec sed -i.bak "s|http://localhost:3001|$BACKEND_URL|g" {} \;
find $DEPLOY_DIR -name "*.bak" -type f -delete
echo -e "${GREEN}✓ API URLs updated${NC}"

# Create landing page
echo -e "${YELLOW}Creating landing page...${NC}"
cat > $DEPLOY_DIR/breakdown/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Go North East - Breakdown Management System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            max-width: 600px;
            width: 100%;
            text-align: center;
        }
        h1 {
            color: #1a202c;
            margin-bottom: 10px;
            font-size: 2rem;
        }
        .subtitle {
            color: #718096;
            margin-bottom: 30px;
            font-size: 1.1rem;
        }
        .button-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 30px;
        }
        @media (max-width: 480px) {
            .button-grid { grid-template-columns: 1fr; }
        }
        .btn {
            background: #4F46E5;
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-decoration: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            transition: all 0.3s;
            font-weight: 600;
        }
        .btn:hover {
            background: #4338CA;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
        }
        .btn-dashboard {
            background: #10B981;
        }
        .btn-dashboard:hover {
            background: #059669;
            box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
        }
        .btn-icon {
            font-size: 2rem;
        }
        .status {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 30px;
            padding: 15px;
            background: #F7FAFC;
            border-radius: 10px;
        }
        .status-dot {
            width: 10px;
            height: 10px;
            background: #10B981;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px solid #E2E8F0;
        }
        .stat {
            text-align: center;
        }
        .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #4F46E5;
        }
        .stat-label {
            font-size: 0.875rem;
            color: #718096;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚌 Breakdown Management System</h1>
        <p class="subtitle">Intelligent Vehicle Assessment & Response Platform</p>
        
        <div class="button-grid">
            <a href="guide.html" class="btn">
                <span class="btn-icon">📋</span>
                <span>Breakdown Guide</span>
                <small style="opacity: 0.8; font-weight: normal;">Start Assessment</small>
            </a>
            <a href="../dashboard/" class="btn btn-dashboard">
                <span class="btn-icon">📊</span>
                <span>Live Dashboard</span>
                <small style="opacity: 0.9; font-weight: normal;">Monitor Breakdowns</small>
            </a>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">26</div>
                <div class="stat-label">Assessment Wizards</div>
            </div>
            <div class="stat">
                <div class="stat-value">900+</div>
                <div class="stat-label">Fleet Vehicles</div>
            </div>
            <div class="stat">
                <div class="stat-value">< 3min</div>
                <div class="stat-label">Avg Assessment Time</div>
            </div>
        </div>
        
        <div class="status">
            <div class="status-dot"></div>
            <span>System Online • Connected to Go BARRY</span>
        </div>
    </div>
</body>
</html>
EOF
echo -e "${GREEN}✓ Landing page created${NC}"

# Create .htaccess file
echo -e "${YELLOW}Creating .htaccess file...${NC}"
cat > $DEPLOY_DIR/breakdown/.htaccess << 'EOF'
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Prevent directory browsing
Options -Indexes

# Custom error pages
ErrorDocument 404 /breakdown/404.html
ErrorDocument 500 /breakdown/500.html

# Cache control
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType text/css "access plus 1 week"
    ExpiresByType application/javascript "access plus 1 week"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>
EOF
echo -e "${GREEN}✓ .htaccess created${NC}"

# Create deployment instructions
echo -e "${YELLOW}Creating upload instructions...${NC}"
cat > $DEPLOY_DIR/UPLOAD_INSTRUCTIONS.txt << 'EOF'
CPANEL UPLOAD INSTRUCTIONS
==========================

1. LOGIN TO CPANEL
   - Access your cPanel account
   - Open File Manager

2. NAVIGATE TO PUBLIC_HTML
   - Go to public_html directory
   - Create subdirectories if needed

3. UPLOAD FILES
   - Upload the 'breakdown' folder to public_html
   - Upload the 'dashboard' folder to public_html
   - Set permissions: Files=644, Directories=755

4. TEST URLS
   - Main: https://yourdomain.com/breakdown/
   - Guide: https://yourdomain.com/breakdown/guide.html
   - Dashboard: https://yourdomain.com/dashboard/

5. VERIFY FUNCTIONALITY
   - Test supervisor login
   - Start a test breakdown
   - Check dashboard updates
   - Test resolution process

SUPPORT
-------
Backend Status: https://go-barry.onrender.com/api/health-extended
Documentation: See cpanel-deployment-guide.md
EOF
echo -e "${GREEN}✓ Instructions created${NC}"

# Create archive for easy upload
echo -e "${YELLOW}Creating upload archive...${NC}"
cd $DEPLOY_DIR
zip -r ../breakdown-system-cpanel.zip . -q
cd ..
echo -e "${GREEN}✓ Archive created: breakdown-system-cpanel.zip${NC}"

# Summary
echo ""
echo -e "${GREEN}=========================================================${NC}"
echo -e "${GREEN}✅ DEPLOYMENT PREPARATION COMPLETE${NC}"
echo -e "${GREEN}=========================================================${NC}"
echo ""
echo "📦 Files prepared in: $DEPLOY_DIR/"
echo "🗜️  Archive created: breakdown-system-cpanel.zip"
echo ""
echo "Next steps:"
echo "1. Review files in $DEPLOY_DIR/"
echo "2. Upload breakdown-system-cpanel.zip to cPanel"
echo "3. Extract in public_html directory"
echo "4. Follow instructions in UPLOAD_INSTRUCTIONS.txt"
echo ""
echo -e "${YELLOW}⚠️  Remember to update your domain name in the configuration!${NC}"
