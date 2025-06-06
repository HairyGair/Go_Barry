#!/bin/bash
# Go Barry Project Cleanup & Production Deployment Script
# Cleans up unnecessary files and creates production-ready deployment

echo "🧹 Go Barry Project Cleanup & Production Deployment"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "Go_BARRY" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Must be run from the Go Barry project root directory"
    exit 1
fi

echo "📋 Current project size before cleanup:"
du -sh . 2>/dev/null || echo "Unable to calculate size"

echo ""
echo "🗑️ Removing unnecessary files and directories..."

# Remove old deployment files and scripts
rm -f deploy-*.sh 2>/dev/null
rm -f test-*.sh 2>/dev/null
rm -f debug-*.sh 2>/dev/null
rm -f check-*.sh 2>/dev/null
rm -f build-*.sh 2>/dev/null
rm -f complete-*.sh 2>/dev/null
rm -f setup-*.sh 2>/dev/null
rm -f start-*.sh 2>/dev/null
rm -f emergency-*.sh 2>/dev/null
rm -f final-*.sh 2>/dev/null
rm -f make-*.sh 2>/dev/null
rm -f quick-*.sh 2>/dev/null
rm -f create-*.sh 2>/dev/null

# Remove old documentation files
rm -f 123REG_UPLOAD_GUIDE.md 2>/dev/null
rm -f 123reg-visual-guide.html 2>/dev/null
rm -f BROWSER_FIRST_GUIDE.md 2>/dev/null
rm -f DEPLOY.md 2>/dev/null
rm -f DEPLOYMENT.md 2>/dev/null
rm -f DEPLOYMENT_STEPS.md 2>/dev/null
rm -f DISRUPTION_LOGGING_COMPLETE.md 2>/dev/null
rm -f DOMAIN_SETUP_GUIDE.md 2>/dev/null
rm -f MOBILE_DISTRIBUTION.md 2>/dev/null
rm -f NODE_FIX_SUMMARY.md 2>/dev/null
rm -f PIXELISH_HOSTING_GUIDE.md 2>/dev/null
rm -f TEAM_TESTING_GUIDE.md 2>/dev/null

# Remove old deployment packages
rm -f *.zip 2>/dev/null

# Remove unnecessary directories
rm -rf DisplayScreen 2>/dev/null
rm -rf Go_BARRY.bfg-report 2>/dev/null
rm -rf barry-v3-deployment-* 2>/dev/null
rm -rf cpanel-deployment 2>/dev/null
rm -rf cpanel-nodejs-backend 2>/dev/null

# Remove debug files
rm -f debug-*.js 2>/dev/null
rm -f check-*.js 2>/dev/null
rm -f tree.txt 2>/dev/null
rm -f index.html 2>/dev/null

# Remove .DS_Store files
find . -name ".DS_Store" -delete 2>/dev/null

echo "✅ Cleanup completed!"

echo ""
echo "📋 Project size after cleanup:"
du -sh . 2>/dev/null || echo "Unable to calculate size"

echo ""
echo "🏗️ Creating clean production deployment structure..."

# Create clean deployment directories
mkdir -p production-deployment/frontend
mkdir -p production-deployment/backend
mkdir -p production-deployment/docs

echo "📁 Copying essential files..."

# Copy frontend files
cp -r Go_BARRY/* production-deployment/frontend/
# Remove development files from frontend copy
rm -rf production-deployment/frontend/node_modules 2>/dev/null
rm -rf production-deployment/frontend/.expo 2>/dev/null
rm -rf production-deployment/frontend/dist 2>/dev/null
rm -rf production-deployment/frontend/cpanel-build 2>/dev/null

# Copy backend files
cp -r backend/* production-deployment/backend/
# Remove development files from backend copy
rm -rf production-deployment/backend/node_modules 2>/dev/null
rm -rf production-deployment/backend/.expo 2>/dev/null

# Copy essential documentation
cp README.md production-deployment/docs/ 2>/dev/null
cp CPANEL_DEPLOYMENT_GUIDE.md production-deployment/docs/ 2>/dev/null

echo "⚙️ Creating production configuration files..."

# Create main deployment script
cat > production-deployment/deploy-gobarry.sh << 'EOF'
#!/bin/bash
# Go Barry Production Deployment for gobarry.co.uk

echo "🚀 Deploying Go Barry to gobarry.co.uk"
echo "====================================="

# Build frontend for cPanel
echo "🏗️ Building frontend..."
cd frontend
npm install
npm run build:cpanel

# Create deployment package
echo "📦 Creating deployment package..."
cd cpanel-build
zip -r ../../gobarry-production.zip . -x '*.DS_Store' '*.map'
cd ../..

# Backend package
echo "📦 Creating backend package..."
cd backend
zip -r ../gobarry-backend.zip . -x '*.DS_Store' '*.log' 'node_modules/*'
cd ..

echo "✅ Deployment packages created:"
echo "   🌐 Frontend: gobarry-production.zip"
echo "   🔗 Backend: gobarry-backend.zip"
echo ""
echo "📋 Next steps:"
echo "1. Upload gobarry-production.zip to cPanel public_html"
echo "2. Upload gobarry-backend.zip to cPanel Node.js app directory"
echo "3. Extract both files"
echo "4. Configure domains and start services"
EOF

chmod +x production-deployment/deploy-gobarry.sh

# Create environment template
cat > production-deployment/backend/.env.production << 'EOF'
# Go Barry Production Environment
# Copy this to .env and update with your actual values

NODE_ENV=production
PORT=3001

# API Keys - Update these with your actual keys
TOMTOM_API_KEY=your_tomtom_key_here
MAPQUEST_API_KEY=your_mapquest_key_here
HERE_API_KEY=your_here_key_here
NATIONAL_HIGHWAYS_API_KEY=your_national_highways_key_here

# Domain Configuration
CORS_ORIGIN=https://gobarry.co.uk,https://www.gobarry.co.uk
PRODUCTION_DOMAIN=gobarry.co.uk

# Database (optional)
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_key_here
EOF

# Create production README
cat > production-deployment/README.md << 'EOF'
# Go Barry - Production Deployment

## 🎯 Quick Deployment Guide

### Frontend (Static Website)
1. **Build**: `cd frontend && npm run build:cpanel`
2. **Upload**: Upload contents of `cpanel-build/` to cPanel `public_html`
3. **Domain**: Configure `gobarry.co.uk` to point to your cPanel

### Backend (Node.js API)
1. **Upload**: Upload `backend/` files to cPanel Node.js app directory
2. **Configure**: Set up Node.js app in cPanel pointing to `api.gobarry.co.uk`
3. **Environment**: Copy `.env.production` to `.env` and update API keys
4. **Install**: Run `npm install` in cPanel or via SSH
5. **Start**: Start the Node.js application

### Testing
- **Frontend**: https://gobarry.co.uk
- **Backend**: https://api.gobarry.co.uk/api/health

## 📁 File Structure
```
production-deployment/
├── frontend/           # React/Expo web app
├── backend/           # Node.js API server
├── docs/             # Documentation
└── deploy-gobarry.sh # Automated deployment script
```

## 🔧 Configuration
- Frontend automatically detects `gobarry.co.uk` and uses `api.gobarry.co.uk`
- Backend requires API keys in `.env` file
- CORS configured for your domain
EOF

echo ""
echo "✅ Production deployment structure created!"
echo "=========================================="
echo ""
echo "📁 Clean project structure:"
echo "   ✅ production-deployment/frontend/ - Website files"
echo "   ✅ production-deployment/backend/  - API server files"
echo "   ✅ production-deployment/docs/     - Documentation"
echo "   ✅ deploy-gobarry.sh              - Deployment script"
echo ""
echo "🚀 Ready for deployment:"
echo "1. cd production-deployment"
echo "2. ./deploy-gobarry.sh"
echo "3. Upload the created zip files to cPanel"
echo ""
echo "📖 See production-deployment/README.md for detailed instructions"
