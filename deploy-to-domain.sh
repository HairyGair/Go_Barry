#!/bin/bash

# BARRY v3.0 - Pixelish.co.uk Deployment Helper

echo "🚦 BARRY v3.0 - Domain Deployment Helper"
echo "======================================="
echo ""
echo "📋 DEPLOYMENT CHECKLIST for gobarry.co.uk:"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✅]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Check if deployment folder exists
if [ ! -d "barry-v3-deployment-20250606-124636" ]; then
    echo "❌ Deployment folder not found. Please run the deployment script first."
    exit 1
fi

print_step "1. Preparing files for gobarry.co.uk deployment..."

cd barry-v3-deployment-20250606-124636

# Create a clean ZIP for upload
print_info "Creating upload-ready ZIP file..."
zip -r ../gobarry-deployment.zip . -x "DEPLOYMENT_GUIDE.md" "START_LOCAL_SERVER.md" "PACKAGE_INFO.txt"

cd ..

print_success "Upload ZIP created: gobarry-deployment.zip"
echo ""

print_step "2. Upload Instructions for Pixelish.co.uk:"
echo ""
echo "   🌐 Login to your Pixelish.co.uk cPanel"
echo "   📁 Go to File Manager"
echo "   📂 Navigate to public_html/"
echo "   📤 Upload: gobarry-deployment.zip"
echo "   📦 Extract the ZIP file"
echo "   ✅ Ensure index.html is in public_html root"
echo ""

print_step "3. Your BARRY URLs will be:"
echo ""
echo "   🚀 Main Site: https://gobarry.co.uk"
echo "   🔒 Secure: https://gobarry.co.uk (with SSL)"
echo "   📱 Mobile: Works on all devices"
echo ""

print_step "4. Post-Upload Testing:"
echo ""
echo "   ✅ Visit: https://gobarry.co.uk"
echo "   ✅ Check: Professional BARRY interface loads"
echo "   ✅ Test: Traffic intelligence dashboard works"
echo "   ✅ Verify: All view modes functional"
echo ""

print_step "5. Share with Supervisors:"
echo ""
echo "   📧 Email: 'BARRY v3.0 is live at https://gobarry.co.uk'"
echo "   📱 SMS: 'New traffic system ready: gobarry.co.uk'"
echo "   💼 Teams: 'BARRY v3.0 Traffic Intelligence - gobarry.co.uk'"
echo ""

print_success "🎉 READY FOR PROFESSIONAL DEPLOYMENT!"
echo ""
print_info "Next steps:"
echo "1. Upload gobarry-deployment.zip to your Pixelish.co.uk hosting"
echo "2. Extract in public_html/"
echo "3. Visit https://gobarry.co.uk to test"
echo "4. Share with your team!"
echo ""

# Create upload instructions file
cat > PIXELISH_UPLOAD_GUIDE.md << 'EOF'
# 🚦 BARRY v3.0 - Pixelish.co.uk Upload Guide

## 📤 UPLOAD STEPS:

### 1. Login to Pixelish.co.uk
- Go to your client area
- Access cPanel for gobarry.co.uk

### 2. File Manager Upload
- Open File Manager in cPanel
- Navigate to `public_html/`
- Upload `gobarry-deployment.zip`
- Extract the ZIP file
- Ensure `index.html` is in the root directory

### 3. Test Deployment
- Visit: https://gobarry.co.uk
- Should see professional BARRY interface
- Test all features work correctly

### 4. SSL Configuration
- Ensure SSL certificate is active
- Force HTTPS redirects if needed
- Test secure access: https://gobarry.co.uk

## 🎯 RESULT:
Professional BARRY v3.0 Traffic Intelligence Platform
accessible at your branded domain: gobarry.co.uk

## 📧 SHARE WITH TEAM:
"BARRY v3.0 Traffic Intelligence is now live at:
https://gobarry.co.uk

Features:
✅ Real-time traffic monitoring
✅ Professional supervisor dashboard  
✅ Multi-view traffic intelligence
✅ Keyboard shortcuts for efficiency
✅ Mobile and desktop optimized

Access from any work browser - no installations required!"
EOF

print_success "📋 Upload guide created: PIXELISH_UPLOAD_GUIDE.md"
echo ""
print_info "🎯 Your professional BARRY v3.0 deployment is ready!"
print_info "📦 Upload file: gobarry-deployment.zip"
print_info "🌐 Target URL: https://gobarry.co.uk"
