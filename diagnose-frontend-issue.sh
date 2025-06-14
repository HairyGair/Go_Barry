#!/bin/bash
# diagnose-frontend-issue.sh
# Diagnose frontend deployment issues

echo "🔍 Diagnosing Frontend Deployment Issue"
echo "======================================="

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚨 Issue: 500 Internal Server Error from gobarry.co.uk"
echo ""

print_status "Checking local build files..."

cd Go_BARRY

# Check if there were recent builds
if [ -d "dist" ]; then
    print_success "✅ dist/ folder exists"
    ls -la dist/ | head -10
else
    print_warning "⚠️ No dist/ folder found"
fi

if [ -d "cpanel-build" ]; then
    print_success "✅ cpanel-build/ folder exists"
    ls -la cpanel-build/ | head -10
else
    print_warning "⚠️ No cpanel-build/ folder found"
fi

if [ -f "gobarry-cpanel-deployment.zip" ]; then
    zip_size=$(du -sh gobarry-cpanel-deployment.zip | cut -f1)
    print_success "✅ Deployment zip exists ($zip_size)"
else
    print_warning "⚠️ No deployment zip found"
fi

echo ""
print_status "🔍 Potential Issues:"
echo "1. ❌ .htaccess file conflicts"
echo "2. ❌ File permission issues"
echo "3. ❌ Expo build compatibility with server"
echo "4. ❌ Missing index.html or incorrect file structure"
echo "5. ❌ JavaScript compatibility issues"

echo ""
print_status "🛠️ Quick Fixes to Try:"
echo ""
echo "📁 Option 1: Check File Structure in cPanel"
echo "   • Login to cPanel File Manager"
echo "   • Check public_html/gobarry.co.uk/"
echo "   • Look for index.html in root"
echo "   • Check for .htaccess file conflicts"

echo ""
echo "🔄 Option 2: Re-build with Different Settings"
echo "   • npm run build:web (instead of build:cpanel)"
echo "   • Try basic static build"

echo ""
echo "🗑️ Option 3: Clean Deployment"
echo "   • Delete all files in domain folder"
echo "   • Upload just index.html and _expo folder"
echo "   • Test basic functionality first"

echo ""
echo "⚡ Option 4: Simple HTML Test"
echo "   • Create basic index.html"
echo "   • Test server is working"
echo "   • Then add Expo build gradually"

echo ""
print_status "🧪 Immediate Action Plan:"
echo "1. Check cPanel Error Logs for specific error"
echo "2. Verify file permissions (should be 644 for files, 755 for folders)"
echo "3. Look for .htaccess conflicts"
echo "4. Test with simple HTML file first"

# Create a simple test HTML file
print_status "Creating simple test file..."
cat > simple-test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Go BARRY - Server Test</title>
</head>
<body>
    <h1>Go BARRY Server Test</h1>
    <p>If you can see this, the server is working.</p>
    <p>Timestamp: <script>document.write(new Date().toLocaleString());</script></p>
</body>
</html>
EOF

print_success "✅ Created simple-test.html"
echo "   • Upload this to test basic server functionality"
echo "   • If this works, the issue is with the Expo build"

echo ""
print_warning "📋 Check These in cPanel:"
echo "1. 📊 Error Logs - Look for specific PHP/server errors"
echo "2. 📁 File Manager - Check file structure and permissions" 
echo "3. 🔧 .htaccess - Look for rewrite rules or conflicts"
echo "4. 📂 Domain Settings - Verify document root is correct"

cd ..
