#!/bin/bash
# Final Go Barry Deployment Script for gobarry.co.uk
# This script creates production-ready deployment packages

echo "🚀 Go Barry - Final Production Deployment"
echo "========================================="
echo "Domain: gobarry.co.uk | API: api.gobarry.co.uk"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "Go_BARRY" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Must be run from the Go Barry project root directory"
    exit 1
fi

echo "🏗️ Building production packages..."

# Clean previous builds
rm -rf final-deployment 2>/dev/null
rm -f gobarry-*.zip 2>/dev/null

# Create deployment directory
mkdir -p final-deployment

echo "📱 Building frontend for cPanel..."
cd Go_BARRY

# Install dependencies and build
npm install --silent
if npm run build:cpanel; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Create frontend deployment package
cd cpanel-build
zip -r ../../final-deployment/gobarry-frontend.zip . -x '*.DS_Store' '*.map' 2>/dev/null
cd ../..

echo "🔗 Preparing backend for cPanel Node.js..."

# Copy backend files
cp -r backend final-deployment/backend-deploy

# Remove development files
rm -rf final-deployment/backend-deploy/node_modules 2>/dev/null
rm -rf final-deployment/backend-deploy/.expo 2>/dev/null

# Create production environment file
cat > final-deployment/backend-deploy/.env << 'EOF'
# Go Barry Production Environment
NODE_ENV=production
PORT=3001

# API Keys - Update these with your actual keys from your current .env
TOMTOM_API_KEY=9rZJqtnfYpOzlqnypI97nFb5oX17SNzp
MAPQUEST_API_KEY=OeLAWVPNlgnBjW66iamoyiD5kEecJloN
HERE_API_KEY=Xo2Q-IQMOBERx3wCtl0o9Nc6VRVf4uCCJVUAfEbLxs
NATIONAL_HIGHWAYS_API_KEY=d2266b385f64d968f330969398b2961

# Domain Configuration
CORS_ORIGIN=https://gobarry.co.uk,https://www.gobarry.co.uk
PRODUCTION_DOMAIN=gobarry.co.uk

# Supabase Configuration
SUPABASE_URL=https://haountnghecfrsoniubq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3VudG5naGVjZnJzb25pdWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NzgxNDksImV4cCI6MjA2MzI1NDE0OX0.xtjxeGkxG3cx67IvpI4XxEpWewLG9Bh6bfyQenfTILs
EOF

# Create backend deployment package
cd final-deployment/backend-deploy
zip -r ../gobarry-backend.zip . -x '*.DS_Store' '*.log' 2>/dev/null
cd ../..

# Create deployment instructions
cat > final-deployment/DEPLOYMENT_INSTRUCTIONS.md << 'EOF'
# Go Barry - Final Deployment Instructions

## 📦 Deployment Packages Created

### 1. Frontend Package: `gobarry-frontend.zip`
**Deploy to:** cPanel public_html directory
**Domain:** gobarry.co.uk

**Steps:**
1. Log into cPanel File Manager
2. Navigate to public_html
3. Delete any existing files
4. Upload gobarry-frontend.zip
5. Extract the zip file
6. Delete the zip file after extraction

**Expected result:** https://gobarry.co.uk loads your traffic app

### 2. Backend Package: `gobarry-backend.zip`
**Deploy to:** cPanel Node.js App or subdirectory
**Domain:** api.gobarry.co.uk

**Steps:**
1. Check if cPanel has "Node.js App" section
2. If YES: Create new Node.js app pointing to api.gobarry.co.uk
3. If NO: Upload to subdirectory and use .htaccess routing
4. Upload gobarry-backend.zip
5. Extract files
6. Run npm install (via SSH or cPanel terminal)
7. Start the application

**Expected result:** https://api.gobarry.co.uk/api/health returns {"status":"operational"}

## 🖥️ Display Screen Access

### Control Room 24/7 Monitoring Display:
- **URL:** https://gobarry.co.uk/display
- **Purpose:** Continuous traffic alert monitoring for supervisors
- **Setup:** Fullscreen mode (F11), no login required
- **Features:** Priority-based alerts, service impact, acknowledgement system

### Supervisor Workstation Interface:
- **URL:** https://gobarry.co.uk
- **Purpose:** Full control panel and management tools
- **Login:** Supervisor authentication required
- **Features:** All management tools + display screen access

## 🌐 Domain Configuration

### DNS Records Needed:
```
Type: A Record
Name: @
Value: [Your cPanel server IP]

Type: CNAME  
Name: api
Value: [Your cPanel domain or server]

Type: CNAME
Name: www
Value: gobarry.co.uk
```

### SSL Certificate:
- Enable SSL in cPanel
- Force HTTPS redirects
- Let's Encrypt is usually free

## ✅ Testing Your Deployment

1. **Frontend Test:** Visit https://gobarry.co.uk
   - Should load the Go Barry traffic intelligence app
   - Check that all pages work
   - Verify responsive design on mobile

2. **Display Screen Test:** Visit https://gobarry.co.uk/display
   - Should show 24/7 control room monitoring interface
   - Check that alerts are loading with priority levels
   - Verify acknowledgement system works

3. **Backend Test:** Visit https://api.gobarry.co.uk/api/health
   - Should return: {"status":"operational"}
   - Test alerts: https://api.gobarry.co.uk/api/alerts

4. **Integration Test:**
   - Go to alerts section in the app
   - Check that traffic alerts are loading
   - Verify data is coming from your API

## 🔧 Troubleshooting

### Frontend Issues:
- Check file permissions (644 for files, 755 for directories)
- Verify .htaccess file is present for routing
- Check SSL certificate is working

### Backend Issues:
- Check Node.js version (should be 18+ or 20+)
- Verify environment variables are set
- Check cPanel error logs
- Test API endpoints directly

### Domain Issues:
- Verify DNS propagation (can take up to 24 hours)
- Check domain is pointing to correct server
- Verify subdomain configuration

## 🎉 Success!
When working correctly:
- https://gobarry.co.uk → Your traffic intelligence app
- https://gobarry.co.uk/display → 24/7 control room display
- https://api.gobarry.co.uk → Your backend API
- Real-time traffic alerts from multiple sources
- Fully functional supervisor dashboard with display screen
EOF

# Get file sizes
FRONTEND_SIZE=$(du -sh final-deployment/gobarry-frontend.zip 2>/dev/null | cut -f1)
BACKEND_SIZE=$(du -sh final-deployment/gobarry-backend.zip 2>/dev/null | cut -f1)

echo ""
echo "✅ Production Deployment Packages Ready!"
echo "========================================"
echo ""
echo "📦 Packages created:"
echo "   🌐 gobarry-frontend.zip  ($FRONTEND_SIZE) → Upload to cPanel public_html"
echo "   🔗 gobarry-backend.zip   ($BACKEND_SIZE) → Upload to cPanel Node.js app"
echo ""
echo "📁 Location: final-deployment/"
echo "📖 Instructions: final-deployment/DEPLOYMENT_INSTRUCTIONS.md"
echo ""
echo "🖥️ Your deployment includes:"
echo "   ✅ Main Application: https://gobarry.co.uk"
echo "   ✅ Display Screen: https://gobarry.co.uk/display (24/7 monitoring)"
echo "   ✅ API Backend: https://api.gobarry.co.uk"
echo ""
echo "🚀 Ready to deploy to gobarry.co.uk!"
echo ""
echo "Next steps:"
echo "1. 📁 Open final-deployment/ folder"
echo "2. 📖 Read DEPLOYMENT_INSTRUCTIONS.md"
echo "3. 📤 Upload packages to cPanel"
echo "4. 🌐 Configure domains"
echo "5. 🧪 Test deployment"
echo "6. 🖥️ Set up control room display screens"
echo ""
echo "🎯 Your traffic intelligence platform will be live at:"
echo "   Frontend: https://gobarry.co.uk"
echo "   Display: https://gobarry.co.uk/display"
echo "   API: https://api.gobarry.co.uk"
