#!/bin/bash

# BARRY v3.0 - Pixelish Hosting Deployment (123reg Domain)

echo "🚦 BARRY v3.0 - Pixelish Hosting Deployment"
echo "=========================================="
echo ""
echo "📜 DEPLOYMENT for gobarry.co.uk"
echo "   Domain: 123reg"
echo "   Hosting: Pixelish.co.uk"
echo "   Nameservers: ns1.pixelish.uk / ns2.pixelish.uk"
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

print_step "1. Preparing files for Pixelish hosting..."

cd barry-v3-deployment-20250606-124636

# Create a clean ZIP for upload
print_info "Creating Pixelish upload-ready ZIP file..."
zip -r ../gobarry-pixelish-deployment.zip . -x "DEPLOYMENT_GUIDE.md" "START_LOCAL_SERVER.md" "PACKAGE_INFO.txt"

cd ..

print_success "Pixelish upload ZIP created: gobarry-pixelish-deployment.zip"
echo ""

print_step "2. Pixelish cPanel Access:"
echo ""
echo "   🌐 Login URL: Check your Pixelish welcome email"
echo "   📧 Alternative: Look for cPanel link in Pixelish client area"
echo "   🔑 Credentials: Your Pixelish hosting account details"
echo "   📱 Mobile: Pixelish cPanel works on mobile too"
echo ""

print_step "3. Upload Instructions for Pixelish:"
echo ""
echo "   📁 Login to Pixelish cPanel"
echo "   🗂️  Open File Manager"
echo "   📂 Navigate to public_html/"
echo "   📤 Upload: gobarry-pixelish-deployment.zip"
echo "   📦 Extract/Unzip the file"
echo "   ✅ Ensure index.html is in public_html root"
echo ""

print_step "4. Pixelish-Specific Features:"
echo ""
echo "   🔒 Free SSL: Usually included with Pixelish"
echo "   ⚡ Fast servers: Good performance for BARRY"
echo "   🇬🇧 UK hosting: Perfect for Go North East"
echo "   📊 Analytics: Pixelish provides usage stats"
echo ""

print_step "5. Your BARRY URLs:"
echo ""
echo "   🚀 Main Site: https://gobarry.co.uk"
echo "   🔒 Secure: https://gobarry.co.uk (Pixelish SSL)"
echo "   📱 Mobile: Fully responsive design"
echo "   🌍 Alternative: http://gobarry.co.uk (if SSL pending)"
echo ""

print_step "6. Testing Checklist:"
echo ""
echo "   ✅ Visit: https://gobarry.co.uk"
echo "   ✅ Professional BARRY interface loads"
echo "   ✅ Traffic intelligence dashboard works"
echo "   ✅ All view modes functional"
echo "   ✅ Mobile responsive"
echo "   ✅ Fast loading on Pixelish servers"
echo ""

print_step "7. Share with Supervisors:"
echo ""
echo "   📧 Email: 'BARRY v3.0 live at https://gobarry.co.uk'"
echo "   📱 SMS: 'New traffic system: gobarry.co.uk'"
echo "   💼 Teams: 'BARRY v3.0 on professional domain'"
echo ""

print_success "🎉 READY FOR PIXELISH DEPLOYMENT!"
echo ""
print_info "Next steps:"
echo "1. Login to Pixelish cPanel"
echo "2. Upload gobarry-pixelish-deployment.zip"
echo "3. Extract in public_html/"
echo "4. Visit https://gobarry.co.uk"
echo "5. Enjoy fast UK hosting!"
echo ""

# Create Pixelish-specific upload instructions
cat > PIXELISH_HOSTING_GUIDE.md << 'EOF'
# 🚦 BARRY v3.0 - Pixelish Hosting Guide

## 📤 PIXELISH UPLOAD STEPS:

### 1. Access Pixelish cPanel
- Check your Pixelish welcome email for cPanel URL
- Usually: your-domain.pixelish.co.uk/cpanel
- Or look in Pixelish client area for cPanel link
- Login with your Pixelish hosting credentials

### 2. File Manager Upload
**Step-by-step:**
- Open File Manager in cPanel
- Navigate to `public_html/` folder
- Click "Upload" button
- Select `gobarry-pixelish-deployment.zip`
- Wait for upload to complete
- Right-click ZIP file → Extract/Unzip
- Ensure `index.html` is in public_html root

### 3. Pixelish SSL Setup
- Pixelish usually provides free SSL
- Look for "SSL/TLS" in cPanel
- Enable for gobarry.co.uk
- Should activate within 30 minutes

### 4. Domain Configuration
- Your domain (123reg): gobarry.co.uk
- Nameservers: ns1.pixelish.uk / ns2.pixelish.uk
- Hosting: Pixelish servers (UK-based)
- Should work immediately after upload

### 5. Test Your Site
- Visit: http://gobarry.co.uk (immediate)
- Visit: https://gobarry.co.uk (once SSL active)
- Should load professional BARRY v3.0 interface
- Test all features work correctly

## 🇬🇧 PIXELISH ADVANTAGES:
- ✅ UK-based servers (fast for Go North East)
- ✅ Good uptime and reliability
- ✅ Free SSL certificates included
- ✅ cPanel interface (user-friendly)
- ✅ Good support for UK businesses

## 🎆 RESULT:
Professional BARRY v3.0 Traffic Intelligence Platform
accessible at: https://gobarry.co.uk
Hosted on fast UK servers via Pixelish

## 📧 TEAM ANNOUNCEMENT:
"BARRY v3.0 Traffic Intelligence is now live!

🌐 URL: https://gobarry.co.uk
🇬🇧 Hosted on fast UK servers

Features:
✅ Real-time North East England traffic data
✅ Professional supervisor dashboard
✅ Multiple view modes (Grid, List, Summary)
✅ Smart filtering and sorting
✅ Keyboard shortcuts for efficiency
✅ Mobile and desktop optimized
✅ Fast loading on UK hosting

Access from any work browser - no installations required!"

## 🔧 TROUBLESHOOTING:

**If site doesn't load:**
1. Check files are in public_html/ root directory
2. Verify index.html is present and accessible
3. Wait for any DNS propagation (usually instant)
4. Try http:// if https:// not working yet
5. Clear browser cache and reload

**If features don't work:**
1. Check browser console for JavaScript errors
2. Ensure all files uploaded correctly
3. Verify no files are corrupted
4. Test on different browsers
5. Check Pixelish server status

**Pixelish Support:**
- Client area: Log into your Pixelish account
- Support tickets: Available through client portal
- Knowledge base: Check Pixelish help section
- Email: Support contact in your Pixelish account
EOF

print_success "📜 Pixelish hosting guide created: PIXELISH_HOSTING_GUIDE.md"
echo ""
print_info "🎆 Your BARRY v3.0 is ready for Pixelish hosting!"
print_info "📦 Upload file: gobarry-pixelish-deployment.zip"
print_info "🌐 Target URL: https://gobarry.co.uk"
print_info "🇬🇧 Hosting: Fast UK servers via Pixelish"
print_info "📚 Guide: PIXELISH_HOSTING_GUIDE.md"
