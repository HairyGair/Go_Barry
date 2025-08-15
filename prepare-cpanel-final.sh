#!/bin/bash

# =====================================================
# Go North East Breakdown System - cPanel Upload Prep
# =====================================================
# This script prepares the breakdown guide service for cPanel deployment

echo "🚌 Go North East Breakdown System - cPanel Deployment"
echo "====================================================="
echo ""

# Configuration
BREAKDOWN_SERVICE_DIR="./breakdown-guide-service"
DEPLOY_DIR="./cpanel-upload-ready"
BACKEND_URL="https://go-barry.onrender.com"
CURRENT_DATE=$(date +"%Y-%m-%d_%H-%M-%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Cleanup and create deployment directory
echo -e "${YELLOW}📁 Setting up deployment directory...${NC}"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR/breakdown/{components/wizards,services,styles,assets}
mkdir -p $DEPLOY_DIR/dashboard

# Copy main files
echo -e "${BLUE}📋 Copying main breakdown guide files...${NC}"
if [ -d "$BREAKDOWN_SERVICE_DIR/public" ]; then
    # Core files
    cp $BREAKDOWN_SERVICE_DIR/public/guide.html $DEPLOY_DIR/breakdown/
    cp $BREAKDOWN_SERVICE_DIR/public/index.html $DEPLOY_DIR/breakdown/landing.html
    cp $BREAKDOWN_SERVICE_DIR/public/supervisorBreakdownLogger.js $DEPLOY_DIR/breakdown/
    cp $BREAKDOWN_SERVICE_DIR/public/breakdown-analytics.js $DEPLOY_DIR/breakdown/
    cp $BREAKDOWN_SERVICE_DIR/public/breakdown-tracking-helper.js $DEPLOY_DIR/breakdown/
    cp $BREAKDOWN_SERVICE_DIR/public/app-integration.js $DEPLOY_DIR/breakdown/
    
    # Logo
    if [ -f "$BREAKDOWN_SERVICE_DIR/public/gobarry-logo.png" ]; then
        cp $BREAKDOWN_SERVICE_DIR/public/gobarry-logo.png $DEPLOY_DIR/breakdown/assets/
    fi
    
    echo -e "${GREEN}✓ Core files copied${NC}"
else
    echo -e "${RED}✗ Breakdown service directory not found${NC}"
    exit 1
fi

# Copy wizard components
echo -e "${BLUE}📚 Copying wizard components...${NC}"
if [ -d "$BREAKDOWN_SERVICE_DIR/public/components/wizards" ]; then
    cp -r $BREAKDOWN_SERVICE_DIR/public/components/wizards/* $DEPLOY_DIR/breakdown/components/wizards/
    echo -e "${GREEN}✓ ${NC}$(ls -1 $DEPLOY_DIR/breakdown/components/wizards | wc -l) wizards copied"
fi

# Copy services
echo -e "${BLUE}🔧 Copying services...${NC}"
if [ -d "$BREAKDOWN_SERVICE_DIR/public/services" ]; then
    cp -r $BREAKDOWN_SERVICE_DIR/public/services/* $DEPLOY_DIR/breakdown/services/ 2>/dev/null || true
fi

# Copy styles
echo -e "${BLUE}🎨 Copying styles...${NC}"
if [ -d "$BREAKDOWN_SERVICE_DIR/public/styles" ]; then
    cp -r $BREAKDOWN_SERVICE_DIR/public/styles/* $DEPLOY_DIR/breakdown/styles/ 2>/dev/null || true
fi

# Copy dashboard files
echo -e "${BLUE}📊 Copying dashboard files...${NC}"
if [ -f "./breakdown-dashboard-enhanced.html" ]; then
    cp ./breakdown-dashboard-enhanced.html $DEPLOY_DIR/dashboard/index.html
    echo -e "${GREEN}✓ Enhanced dashboard copied${NC}"
elif [ -f "./breakdown-dashboard.html" ]; then
    cp ./breakdown-dashboard.html $DEPLOY_DIR/dashboard/index.html
    echo -e "${GREEN}✓ Dashboard copied${NC}"
fi

# Create configuration file
echo -e "${YELLOW}⚙️  Creating configuration file...${NC}"
cat > $DEPLOY_DIR/breakdown/config.js << EOF
// Breakdown System Configuration
// Generated: $CURRENT_DATE

const CONFIG = {
    // Backend API URL
    BACKEND_URL: '$BACKEND_URL',
    
    // API Endpoints
    API: {
        // Breakdown tracking endpoints
        START_BREAKDOWN: '/api/breakdowns/start',
        LOG_STEP: '/api/breakdowns/step',
        DIAGNOSE: '/api/breakdowns/diagnose',
        RESOLVE: '/api/breakdowns/resolve',
        LIVE_BREAKDOWNS: '/api/breakdowns/live',
        TODAY_BREAKDOWNS: '/api/breakdowns/today',
        FLEET_HISTORY: '/api/breakdowns/fleet',
        
        // Fleet endpoints
        FLEET_LOOKUP: '/api/fleet',
        
        // Health check
        HEALTH: '/api/health-extended'
    },
    
    // Dashboard settings
    DASHBOARD: {
        REFRESH_INTERVAL: 5000,  // 5 seconds
        OVERDUE_THRESHOLD: 30    // 30 minutes
    },
    
    // Supervisor configuration
    SUPERVISORS: {
        BADGES: ['AW001', 'AC002', 'AG003', 'CF004', 'DH005', 'JD006', 'JP007', 'SG008', 'BP009'],
        ADMIN: ['AG003', 'BP009']
    },
    
    // Priority routes
    PRIORITY_ROUTES: ['X10', 'X21', '21', '56', '307'],
    
    // Depots
    DEPOTS: [
        'Washington',
        'Gateshead',
        'Consett',
        'Hexham',
        'Percy Main',
        'Deptford'
    ],
    
    // System settings
    SYSTEM: {
        VERSION: '2.0',
        ENVIRONMENT: 'production',
        DEBUG: false
    }
};

// Make config globally available
window.CONFIG = CONFIG;
EOF
echo -e "${GREEN}✓ Configuration created${NC}"

# Update API URLs in all JavaScript files
echo -e "${YELLOW}🔄 Updating API URLs to production...${NC}"
find $DEPLOY_DIR -type f \( -name "*.js" -o -name "*.html" \) -exec sed -i.bak \
    -e "s|http://localhost:3001|$BACKEND_URL|g" \
    -e "s|http://localhost:3000|$BACKEND_URL|g" \
    -e "s|localhost:3001|${BACKEND_URL#https://}|g" \
    {} \;
find $DEPLOY_DIR -name "*.bak" -type f -delete
echo -e "${GREEN}✓ API URLs updated${NC}"

# Create enhanced landing page
echo -e "${YELLOW}🏠 Creating enhanced landing page...${NC}"
cat > $DEPLOY_DIR/breakdown/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Go North East - Breakdown Management System</title>
    <script src="config.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
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
            padding: 50px;
            max-width: 700px;
            width: 100%;
            animation: slideIn 0.5s ease-out;
        }
        
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: #1e3c72;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
        }
        
        h1 {
            color: #1a202c;
            margin-bottom: 10px;
            font-size: 2.2rem;
        }
        
        .subtitle {
            color: #718096;
            font-size: 1.1rem;
        }
        
        .button-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 40px 0;
        }
        
        @media (max-width: 600px) {
            .button-grid { grid-template-columns: 1fr; }
            .container { padding: 30px; }
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            text-decoration: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        
        .btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.1);
            transform: translateX(-100%);
            transition: transform 0.3s;
        }
        
        .btn:hover::before {
            transform: translateX(0);
        }
        
        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 30px rgba(102, 126, 234, 0.4);
        }
        
        .btn-dashboard {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }
        
        .btn-dashboard:hover {
            box-shadow: 0 15px 30px rgba(56, 239, 125, 0.4);
        }
        
        .btn-icon {
            font-size: 2.5rem;
        }
        
        .btn-title {
            font-size: 1.2rem;
            font-weight: 600;
        }
        
        .btn-desc {
            font-size: 0.9rem;
            opacity: 0.9;
            font-weight: normal;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin: 40px 0;
            padding: 30px 0;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #718096;
            margin-top: 5px;
        }
        
        .status {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 20px;
            background: #f7fafc;
            border-radius: 12px;
            margin-top: 20px;
        }
        
        .status-dot {
            width: 12px;
            height: 12px;
            background: #48bb78;
            border-radius: 50%;
            animation: pulse 2s infinite;
            box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.3);
        }
        
        @keyframes pulse {
            0%, 100% { 
                opacity: 1;
                transform: scale(1);
            }
            50% { 
                opacity: 0.7;
                transform: scale(0.95);
            }
        }
        
        .status-text {
            color: #2d3748;
            font-weight: 500;
        }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚌</div>
            <h1>Breakdown Management System</h1>
            <p class="subtitle">Intelligent Vehicle Assessment & Response Platform</p>
        </div>
        
        <div class="button-grid">
            <a href="guide.html" class="btn">
                <span class="btn-icon">📋</span>
                <span class="btn-title">Breakdown Guide</span>
                <span class="btn-desc">Start Assessment Wizard</span>
            </a>
            <a href="../dashboard/" class="btn btn-dashboard">
                <span class="btn-icon">📊</span>
                <span class="btn-title">Live Dashboard</span>
                <span class="btn-desc">Monitor Active Breakdowns</span>
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
                <div class="stat-value"><3min</div>
                <div class="stat-label">Avg Assessment</div>
            </div>
            <div class="stat">
                <div class="stat-value">24/7</div>
                <div class="stat-label">Availability</div>
            </div>
        </div>
        
        <div class="status">
            <div class="status-dot"></div>
            <span class="status-text">System Online • Connected to Go BARRY</span>
        </div>
        
        <div class="footer">
            <p>Go North East • Part of Go-Ahead Group</p>
            <p style="margin-top: 5px;">Version 2.0 • © 2025</p>
        </div>
    </div>
    
    <script>
        // Check backend connectivity
        fetch(CONFIG.BACKEND_URL + CONFIG.API.HEALTH)
            .then(response => response.json())
            .then(data => {
                console.log('Backend connected:', data);
            })
            .catch(error => {
                console.error('Backend connection error:', error);
                document.querySelector('.status-dot').style.background = '#f56565';
                document.querySelector('.status-text').textContent = 'System Offline - Check Connection';
            });
    </script>
</body>
</html>
EOF
echo -e "${GREEN}✓ Landing page created${NC}"

# Create .htaccess file
echo -e "${YELLOW}🔒 Creating .htaccess for security...${NC}"
cat > $DEPLOY_DIR/breakdown/.htaccess << 'EOF'
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Prevent directory browsing
Options -Indexes

# Block access to sensitive files
<FilesMatch "\.(env|json|md|sh|log)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Custom error pages
ErrorDocument 404 /breakdown/404.html
ErrorDocument 500 /breakdown/500.html

# CORS headers for API calls
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://go-barry.onrender.com"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# Cache control
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType text/css "access plus 1 week"
    ExpiresByType application/javascript "access plus 1 week"
    ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>
EOF
echo -e "${GREEN}✓ .htaccess created${NC}"

# Create deployment instructions
echo -e "${YELLOW}📝 Creating deployment instructions...${NC}"
cat > $DEPLOY_DIR/README.md << EOF
# cPanel Deployment Instructions
Generated: $CURRENT_DATE

## 📦 Package Contents
- **breakdown/** - Main breakdown guide system
- **dashboard/** - Live breakdown monitoring dashboard
- **README.md** - This file

## 🚀 Quick Deploy

### Step 1: Access cPanel
1. Log into your cPanel account
2. Open **File Manager**
3. Navigate to **public_html**

### Step 2: Upload Files
1. Upload the entire **breakdown** folder to public_html
2. Upload the entire **dashboard** folder to public_html
3. Verify file structure:
   \`\`\`
   public_html/
   ├── breakdown/
   │   ├── index.html
   │   ├── guide.html
   │   ├── config.js
   │   └── [other files]
   └── dashboard/
       └── index.html
   \`\`\`

### Step 3: Set Permissions
- Files: 644
- Directories: 755

### Step 4: Update Domain
Edit **breakdown/config.js** and update if needed:
- Replace backend URL if different
- Adjust any domain-specific settings

## 🔗 Access URLs
After deployment, access your system at:
- **Landing Page**: https://yourdomain.com/breakdown/
- **Breakdown Guide**: https://yourdomain.com/breakdown/guide.html
- **Dashboard**: https://yourdomain.com/dashboard/

## ✅ Testing Checklist
- [ ] Landing page loads correctly
- [ ] Supervisor login works
- [ ] Can start a breakdown assessment
- [ ] Wizards function properly
- [ ] Dashboard shows live data
- [ ] Backend API connection successful

## 🔧 Troubleshooting

### API Connection Issues
1. Check browser console for errors
2. Verify backend is running: $BACKEND_URL/api/health-extended
3. Check CORS settings in .htaccess

### 404 Errors
1. Verify file paths are correct
2. Check .htaccess is uploaded
3. Ensure proper file permissions

### JavaScript Errors
1. Clear browser cache
2. Check console for specific errors
3. Verify config.js is loaded

## 📞 Support
- Backend Status: $BACKEND_URL/api/health-extended
- Documentation: See executive summary and implementation guides

## 🎯 System Features
- 26 Assessment Wizards
- Real-time Breakdown Tracking
- 900+ Fleet Vehicle Database
- Supervisor Authentication
- Pattern Detection
- Complete Audit Trail
- < 3 minute average assessment time

---
Go North East - Leading the future of intelligent bus operations
EOF
echo -e "${GREEN}✓ Instructions created${NC}"

# Create a test file
echo -e "${YELLOW}🧪 Creating test file...${NC}"
cat > $DEPLOY_DIR/test-connection.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Connection Test</title>
    <style>
        body { font-family: Arial; padding: 20px; }
        .test { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .pending { background: #fff3cd; color: #856404; }
    </style>
</head>
<body>
    <h1>Breakdown System Connection Test</h1>
    <div id="results"></div>
    
    <script>
        const BACKEND_URL = 'https://go-barry.onrender.com';
        const tests = [
            { name: 'Backend Health', url: BACKEND_URL + '/api/health-extended' },
            { name: 'Fleet API', url: BACKEND_URL + '/api/fleet/6301' },
            { name: 'Breakdowns API', url: BACKEND_URL + '/api/breakdowns/live' }
        ];
        
        const results = document.getElementById('results');
        
        tests.forEach(test => {
            const div = document.createElement('div');
            div.className = 'test pending';
            div.textContent = `Testing ${test.name}...`;
            results.appendChild(div);
            
            fetch(test.url)
                .then(response => {
                    div.className = 'test success';
                    div.textContent = `✓ ${test.name} - Connected (Status: ${response.status})`;
                })
                .catch(error => {
                    div.className = 'test error';
                    div.textContent = `✗ ${test.name} - Failed: ${error.message}`;
                });
        });
    </script>
</body>
</html>
EOF
echo -e "${GREEN}✓ Test file created${NC}"

# Create deployment archive
echo -e "${YELLOW}📦 Creating deployment archive...${NC}"
cd $DEPLOY_DIR
zip -r ../breakdown-system-cpanel-${CURRENT_DATE}.zip . -q
cd ..
ARCHIVE_SIZE=$(du -h breakdown-system-cpanel-${CURRENT_DATE}.zip | cut -f1)
echo -e "${GREEN}✓ Archive created: breakdown-system-cpanel-${CURRENT_DATE}.zip (${ARCHIVE_SIZE})${NC}"

# Summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ CPANEL DEPLOYMENT PACKAGE READY${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📦 Package Details:${NC}"
echo "   • Location: $DEPLOY_DIR/"
echo "   • Archive: breakdown-system-cpanel-${CURRENT_DATE}.zip"
echo "   • Size: ${ARCHIVE_SIZE}"
echo "   • Wizards: $(ls -1 $DEPLOY_DIR/breakdown/components/wizards/*.js 2>/dev/null | wc -l)"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "   1. Upload the zip file to cPanel"
echo "   2. Extract in public_html directory"
echo "   3. Update domain in config.js if needed"
echo "   4. Test using test-connection.html"
echo ""
echo -e "${BLUE}🔗 After deployment, access at:${NC}"
echo "   • Main: https://yourdomain.com/breakdown/"
echo "   • Guide: https://yourdomain.com/breakdown/guide.html"
echo "   • Dashboard: https://yourdomain.com/dashboard/"
echo ""
echo -e "${YELLOW}⚠️  Remember to update 'yourdomain.com' with your actual domain!${NC}"
echo ""
echo -e "${GREEN}Good luck with your deployment! 🚀${NC}"
