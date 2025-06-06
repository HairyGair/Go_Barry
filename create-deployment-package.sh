#!/bin/bash

# Go Barry v3.0 - Professional Deployment Package Creator

echo "📦 Creating Professional Deployment Package for BARRY v3.0"
echo "============================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[NOTE]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "Go_BARRY" ]; then
    echo "❌ Please run this script from the Go BARRY App root directory"
    exit 1
fi

# Create deployment directory
DEPLOY_DIR="barry-v3-deployment-$(date +%Y%m%d-%H%M%S)"
mkdir "$DEPLOY_DIR"

print_status "Building production version..."
cd Go_BARRY
npm run build:web:production

if [ ! -d "dist" ]; then
    echo "❌ Build failed. Please check for errors."
    exit 1
fi

print_success "✅ Build completed successfully"

# Copy built files
print_status "Packaging deployment files..."
cp -r dist/* "../$DEPLOY_DIR/"

# Create deployment documentation
cd "../$DEPLOY_DIR"

cat > DEPLOYMENT_GUIDE.md << 'EOF'
# 🚦 BARRY v3.0 - Professional Deployment Guide

## 📋 DEPLOYMENT CHECKLIST

### ✅ QUICK DEPLOYMENT (Any Web Server)
1. **Upload all files** in this folder to your web server's public directory
2. **Ensure index.html** is the default file
3. **Access via web browser** at your server's URL
4. **Test functionality** - should show traffic intelligence dashboard

### 🌐 RECOMMENDED SERVERS
- **Apache**: Upload to `/var/www/html/` or `/public_html/`
- **Nginx**: Upload to `/usr/share/nginx/html/`
- **IIS**: Upload to `C:\inetpub\wwwroot\`
- **Cloud**: Upload to Netlify, Vercel, or AWS S3

### 🎯 SUPERVISOR ACCESS
- **URL**: `http://your-server.com/barry`
- **Features**: Real-time traffic intelligence dashboard
- **Login**: Supervisor authentication system
- **Views**: Grid, List, Summary dashboards
- **Shortcuts**: Ctrl+1-7 for navigation, F11 for fullscreen

### 🔧 TECHNICAL REQUIREMENTS
- **Web Server**: Any HTTP server (Apache, Nginx, IIS)
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: Responsive design for tablets and desktop
- **Bandwidth**: Minimal - optimized static files

### 📊 FEATURES INCLUDED
✅ Professional supervisor dashboard
✅ Real-time traffic intelligence
✅ Smart filtering and sorting
✅ Multiple view modes
✅ Keyboard shortcuts for efficiency
✅ Responsive design for all screens
✅ Automatic data fallback system

### 🆘 SUPPORT
- **Demo Mode**: Always shows sample North East England traffic data
- **Backend**: Optional - can run standalone with demo data
- **Updates**: Replace files to update system
- **Backup**: Keep copy of current files before updating

### 🎉 READY FOR PRODUCTION
This is a complete, production-ready deployment of BARRY v3.0
Traffic Intelligence Platform for Go North East supervisors.

**Deployment Date**: $(date)
**Version**: 3.0.0 Browser-First
**Contact**: Go North East IT Department
EOF

# Create simple server instructions
cat > START_LOCAL_SERVER.md << 'EOF'
# 🚀 Quick Local Server Instructions

## For Immediate Testing:

### Option 1: Python (if installed)
```bash
python -m http.server 8000
```
Then open: http://localhost:8000

### Option 2: Node.js (if installed)
```bash
npx serve . -p 8000
```
Then open: http://localhost:8000

### Option 3: PHP (if installed)
```bash
php -S localhost:8000
```
Then open: http://localhost:8000

## 🎯 Professional Deployment
Upload all files to your organization's web server for production use.
EOF

# Create a simple launcher HTML for testing
cat > DEMO_LAUNCHER.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BARRY v3.0 - Demo Launcher</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 2rem;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        
        .container {
            text-align: center;
            max-width: 600px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 2rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .logo {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        
        h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        
        .version {
            font-size: 1.2rem;
            opacity: 0.8;
            margin-bottom: 2rem;
        }
        
        .launch-button {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid white;
            color: white;
            padding: 1rem 2rem;
            border-radius: 50px;
            text-decoration: none;
            font-size: 1.2rem;
            font-weight: 600;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }
        
        .launch-button:hover {
            background: white;
            color: #667eea;
            transform: translateY(-2px);
        }
        
        .info {
            margin-top: 2rem;
            font-size: 0.9rem;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚦</div>
        <h1>BARRY</h1>
        <div class="version">v3.0 Professional • Traffic Intelligence</div>
        
        <a href="index.html" class="launch-button">
            🚀 Launch Supervisor Dashboard
        </a>
        
        <div class="info">
            <p><strong>Professional traffic intelligence platform for Go North East supervisors.</strong></p>
            <p>Features: Real-time monitoring • Smart filtering • Multiple view modes • Keyboard shortcuts</p>
            <p>Browser-optimized for desktop workstations and tablets.</p>
        </div>
    </div>
</body>
</html>
EOF

# Create package info
cat > PACKAGE_INFO.txt << EOF
🚦 BARRY v3.0 - Professional Deployment Package
==============================================

Package Created: $(date)
Version: 3.0.0 Browser-First
Platform: Web Application (HTML5)

📁 CONTENTS:
- index.html (Main application entry)
- All compiled JavaScript and assets
- DEPLOYMENT_GUIDE.md (Full instructions)
- START_LOCAL_SERVER.md (Testing instructions)
- DEMO_LAUNCHER.html (Professional demo page)

🎯 DEPLOYMENT READY:
This package contains everything needed to deploy
BARRY v3.0 Traffic Intelligence Platform to any web server.

📋 NEXT STEPS:
1. Read DEPLOYMENT_GUIDE.md
2. Upload all files to your web server
3. Access via browser for immediate use
4. Share URL with supervisors for testing

✅ PRODUCTION READY: $(date)
EOF

print_success "✅ Deployment package created: $DEPLOY_DIR"
print_warning "📋 Package includes full deployment documentation"
print_warning "🌐 Ready for web server deployment"

# Create a ZIP file for easy sharing
if command -v zip > /dev/null 2>&1; then
    print_status "Creating ZIP archive for easy distribution..."
    zip -r "${DEPLOY_DIR}.zip" "$DEPLOY_DIR"
    print_success "✅ ZIP created: ${DEPLOY_DIR}.zip"
fi

cd ..
echo ""
echo "🎉 DEPLOYMENT PACKAGE READY!"
echo ""
echo "📁 Folder: $DEPLOY_DIR"
echo "📦 Archive: ${DEPLOY_DIR}.zip (if available)"
echo ""
echo "🚀 QUICK DEMO:"
echo "   cd $DEPLOY_DIR"
echo "   python -m http.server 8000"
echo "   Open: http://localhost:8000/DEMO_LAUNCHER.html"
echo ""
echo "☁️  PROFESSIONAL DEPLOYMENT:"
echo "   Upload contents of $DEPLOY_DIR to your web server"
echo "   Share URL with supervisors and management"
echo ""
