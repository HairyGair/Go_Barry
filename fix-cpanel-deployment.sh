#!/bin/bash
# fix-cpanel-deployment.sh
# Fix cPanel deployment with manual approach

echo "🔧 Fixing cPanel Deployment"
echo "=========================="

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
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo "🎯 Issue: Directory listing instead of Go BARRY app"
echo "✅ Server works (simple-test.html loads)"
echo "❌ Expo build not deployed correctly"
echo ""

cd Go_BARRY

print_status "Preparing manual deployment files..."

# Create a clean deployment folder
rm -rf manual-deployment
mkdir -p manual-deployment

# Copy the essential files from cpanel-build
if [ -d "cpanel-build" ]; then
    print_status "Copying files from cpanel-build..."
    
    # Copy main files
    cp cpanel-build/index.html manual-deployment/ 2>/dev/null
    cp cpanel-build/metadata.json manual-deployment/ 2>/dev/null
    
    # Copy directories
    cp -r cpanel-build/_expo manual-deployment/ 2>/dev/null
    cp -r cpanel-build/assets manual-deployment/ 2>/dev/null
    
    print_success "✅ Files copied to manual-deployment/"
    
    # List what we have
    echo ""
    print_status "📁 Files ready for upload:"
    ls -la manual-deployment/
    echo ""
    
    # Check index.html content
    if [ -f "manual-deployment/index.html" ]; then
        print_success "✅ index.html exists"
        echo "   First few lines:"
        head -5 manual-deployment/index.html
    else
        print_warning "⚠️ index.html missing!"
    fi
    
else
    print_warning "⚠️ cpanel-build folder not found, using dist/"
    
    if [ -d "dist" ]; then
        cp dist/index.html manual-deployment/
        cp -r dist/_expo manual-deployment/
        cp -r dist/assets manual-deployment/
        print_success "✅ Files copied from dist/"
    else
        echo "❌ No build folder found! Run npm run build:cpanel first"
        exit 1
    fi
fi

# Create upload instructions
cat > upload-instructions.txt << 'EOF'
📤 Manual Upload Instructions for cPanel:

1. 🔐 Login to cPanel File Manager

2. 📂 Navigate to: public_html/gobarry.co.uk/

3. 🗑️ Delete ALL current files in the folder:
   - Select all files and folders
   - Click Delete
   - Confirm deletion

4. ⬆️ Upload these files from manual-deployment/ folder:
   - index.html (main file)
   - _expo/ (entire folder)
   - assets/ (entire folder)
   - metadata.json (if present)

5. 📁 File structure should look like:
   public_html/gobarry.co.uk/
   ├── index.html
   ├── _expo/
   ├── assets/
   └── metadata.json

6. 🔧 Set file permissions:
   - Files: 644
   - Folders: 755

7. 🧪 Test: Visit https://gobarry.co.uk
   Should show Go BARRY app, not directory listing

🚨 Important Notes:
- Make sure index.html is in the ROOT of gobarry.co.uk/
- Do NOT put files in a subfolder
- If still showing directory listing, check .htaccess files
EOF

print_success "✅ Created upload-instructions.txt"

echo ""
print_status "🎯 Next Steps:"
echo "1. 📁 Upload files from manual-deployment/ folder"
echo "2. 📋 Follow upload-instructions.txt"
echo "3. 🧪 Test https://gobarry.co.uk"
echo ""

print_warning "💡 If still broken after manual upload:"
echo "   • Check cPanel error logs"
echo "   • Look for .htaccess conflicts"
echo "   • Verify file permissions"
echo "   • Try creating a simple index.html first"

cd ..
