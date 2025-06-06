#!/bin/bash

# BARRY v3.0 - 123reg Domain Deployment Helper

echo "🚦 BARRY v3.0 - 123reg Domain Deployment"
echo "====================================="
echo ""
echo "📜 DEPLOYMENT CHECKLIST for gobarry.co.uk (123reg):"
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

print_step "1. Preparing files for 123reg hosting..."

cd barry-v3-deployment-20250606-124636

# Create a clean ZIP for upload
print_info "Creating 123reg upload-ready ZIP file..."
zip -r ../gobarry-123reg-deployment.zip . -x "DEPLOYMENT_GUIDE.md" "START_LOCAL_SERVER.md" "PACKAGE_INFO.txt"

cd ..

print_success "123reg upload ZIP created: gobarry-123reg-deployment.zip"
echo ""

print_step "2. 123reg Upload Instructions:"
echo ""
echo "   🌐 Login to: https://www.123-reg.co.uk/secure/cpanel"
echo "   🔑 Use your 123reg account credentials"
echo "   📁 Access File Manager or FTP"
echo "   📂 Navigate to public_html/ (or httpdocs/)"
echo "   📤 Upload: gobarry-123reg-deployment.zip"
echo "   📦 Extract the ZIP file in the web root"
echo "   ✅ Ensure index.html is in the main directory"
echo ""

print_step "3. 123reg Control Panel Access:"
echo ""
echo "   🌐 Main Login: https://www.123-reg.co.uk/secure/cpanel"
echo "   📋 Alternative: Check your 123reg welcome email"
echo "   🔧 Tools: File Manager, FTP Accounts, Domain Management"
echo ""

print_step "4. Your BARRY URLs:"
echo ""
echo "   🚀 Main Site: https://gobarry.co.uk"
echo "   🔒 Secure: https://gobarry.co.uk (123reg provides free SSL)"
echo "   📱 Mobile: Fully responsive design"
echo "   🌍 Alternative: http://gobarry.co.uk (if SSL not yet active)"
echo ""

print_step "5. 123reg Specific Steps:"
echo ""
echo "   1️⃣ Login to 123reg control panel"
echo "   2️⃣ Find 'File Manager' or 'Web Space'"
echo "   3️⃣ Upload to public_html/ or httpdocs/"
echo "   4️⃣ Enable SSL certificate (usually free)"
echo "   5️⃣ Test at gobarry.co.uk"
echo ""

print_step "6. Post-Upload Testing:"
echo ""
echo "   ✅ Visit: https://gobarry.co.uk"
echo "   ✅ Check: Professional BARRY interface loads"
echo "   ✅ Test: Traffic intelligence dashboard works"
echo "   ✅ Verify: All view modes functional"
echo "   ✅ Mobile: Test on phone/tablet"
echo ""

print_step "7. Share with Team:"
echo ""
echo "   📧 Email: 'BARRY v3.0 is live at https://gobarry.co.uk'"
echo "   📱 SMS: 'New traffic system: gobarry.co.uk'"
echo "   💼 Teams: 'BARRY v3.0 Traffic Intelligence - gobarry.co.uk'"
echo ""

print_success "🎉 READY FOR 123REG DEPLOYMENT!"
echo ""
print_info "Next steps:"
echo "1. Login to 123reg control panel"
echo "2. Upload gobarry-123reg-deployment.zip"
echo "3. Extract in web root directory"
echo "4. Visit https://gobarry.co.uk"
echo "5. Share with supervisors!"
echo ""

# Create 123reg-specific upload instructions
cat > 123REG_UPLOAD_GUIDE.md << 'EOF'
# 🚦 BARRY v3.0 - 123reg Upload Guide

## 📤 123REG UPLOAD STEPS:

### 1. Access 123reg Control Panel
- Login at: https://www.123-reg.co.uk/secure/cpanel
- Use your 123reg account credentials
- Look for "File Manager" or "Web Space" option

### 2. File Upload Process
**Option A: File Manager (Recommended)**
- Open File Manager in control panel
- Navigate to `public_html/` or `httpdocs/`
- Upload `gobarry-123reg-deployment.zip`
- Extract/unzip the file
- Ensure `index.html` is in the root web directory

**Option B: FTP Upload**
- Create FTP account in 123reg panel
- Use FTP client (FileZilla, etc.)
- Upload files to web root directory
- FTP details usually: ftp.gobarry.co.uk

### 3. SSL Certificate Setup
- 123reg usually provides free SSL
- Look for "SSL Certificates" in control panel
- Enable for gobarry.co.uk
- May take 30 minutes to activate

### 4. DNS Verification
- Ensure domain points to hosting
- Check DNS settings in 123reg panel
- Usually automatic, but verify if issues

### 5. Test Deployment
- Visit: http://gobarry.co.uk (initially)
- Then: https://gobarry.co.uk (once SSL active)
- Should see professional BARRY v3.0 interface
- Test all features work correctly

## 🎆 RESULT:
Professional BARRY v3.0 Traffic Intelligence Platform
accessible at: https://gobarry.co.uk

## 📧 TEAM ANNOUNCEMENT:
"BARRY v3.0 Traffic Intelligence is now live!

🌐 URL: https://gobarry.co.uk

Features:
✅ Real-time North East England traffic data
✅ Professional supervisor dashboard
✅ Multiple view modes (Grid, List, Summary)
✅ Smart filtering by incident type
✅ Keyboard shortcuts for efficiency
✅ Works on any device - no apps needed

Access from any work browser and explore!"

## 🔧 TROUBLESHOOTING:

**If site doesn't load:**
1. Check files are in public_html/ (not subfolder)
2. Verify index.html is present
3. Wait for DNS propagation (up to 24 hours)
4. Try http:// if https:// not working yet

**If features don't work:**
1. Check browser console for errors
2. Ensure all files uploaded correctly
3. Verify JavaScript files are present
4. Clear browser cache and reload

**123reg Support:**
- Help: https://www.123-reg.co.uk/support/
- Phone: Check your 123reg account for support number
- Email: Usually available through control panel
EOF

print_success "📜 123reg upload guide created: 123REG_UPLOAD_GUIDE.md"
echo ""
print_info "🎆 Your professional BARRY v3.0 deployment is ready for 123reg!"
print_info "📦 Upload file: gobarry-123reg-deployment.zip"
print_info "🌐 Target URL: https://gobarry.co.uk"
print_info "📚 Instructions: 123REG_UPLOAD_GUIDE.md"
