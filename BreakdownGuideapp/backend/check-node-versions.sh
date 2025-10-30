#!/bin/bash

# Node.js Version Discovery Script for cPanel
# This script finds all available Node.js versions on the server

echo "=============================================="
echo "Node.js Version Discovery for cPanel"
echo "=============================================="
echo ""

echo "📍 Current Default Node Version:"
node --version 2>/dev/null || echo "  ❌ Node not found in PATH"
echo ""

echo "🔍 Searching for Node 18 installations..."
echo ""

echo "1️⃣ Checking EasyApache Node.js (ea-nodejs):"
if [ -d "/opt/cpanel/ea-nodejs18" ]; then
    echo "  ✅ FOUND: /opt/cpanel/ea-nodejs18/bin/node"
    /opt/cpanel/ea-nodejs18/bin/node --version 2>/dev/null
    echo "  👉 USE THIS: /opt/cpanel/ea-nodejs18/bin/node server.js"
else
    echo "  ❌ ea-nodejs18 not found"
fi

for dir in /opt/cpanel/ea-nodejs*; do
    if [ -d "$dir" ]; then
        version=$("$dir/bin/node" --version 2>/dev/null)
        echo "  📦 Found: $dir → $version"
    fi
done
echo ""

echo "2️⃣ Checking CloudLinux alt-nodejs:"
if [ -d "/opt/alt/alt-nodejs18" ]; then
    echo "  ✅ FOUND: /opt/alt/alt-nodejs18/root/usr/bin/node"
    /opt/alt/alt-nodejs18/root/usr/bin/node --version 2>/dev/null
    echo "  👉 USE THIS: /opt/alt/alt-nodejs18/root/usr/bin/node server.js"
else
    echo "  ❌ alt-nodejs18 not found"
fi

for dir in /opt/alt/alt-nodejs*; do
    if [ -d "$dir" ]; then
        version=$("$dir/root/usr/bin/node" --version 2>/dev/null)
        echo "  📦 Found: $dir → $version"
    fi
done
echo ""

echo "3️⃣ Checking /usr/local/bin wrappers:"
for wrapper in /usr/local/bin/ea-nodejs*; do
    if [ -f "$wrapper" ] && [ -x "$wrapper" ]; then
        version=$("$wrapper" --version 2>/dev/null)
        echo "  📦 Found: $wrapper → $version"
        if [[ $version == v18.* ]]; then
            echo "  ✅ Node 18 wrapper found!"
            echo "  👉 USE THIS: $wrapper server.js"
        fi
    fi
done
echo ""

echo "4️⃣ Checking for NVM (Node Version Manager):"
if command -v nvm &> /dev/null; then
    echo "  ✅ NVM is installed!"
    nvm list
    echo "  👉 To use Node 18: nvm install 18 && nvm use 18"
elif [ -d "$HOME/.nvm" ]; then
    echo "  ⚠️  NVM directory exists but not loaded"
    echo "  👉 Run: source ~/.nvm/nvm.sh"
else
    echo "  ❌ NVM not found"
    echo "  💡 You can install it: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
fi
echo ""

echo "5️⃣ Checking system-wide Node installations:"
find /usr -name "node" -type f 2>/dev/null | grep -v node_modules | while read -r nodepath; do
    version=$("$nodepath" --version 2>/dev/null)
    echo "  📦 Found: $nodepath → $version"
    if [[ $version == v18.* ]]; then
        echo "  ✅ Node 18 found!"
        echo "  👉 USE THIS: $nodepath server.js"
    fi
done
echo ""

echo "6️⃣ Checking CloudLinux Selector:"
if command -v cl-selector &> /dev/null; then
    echo "  ✅ CloudLinux Selector available"
    echo "  👉 Check cPanel for 'Select Node.js Version' tool"
else
    echo "  ❌ CloudLinux Selector not found"
fi
echo ""

echo "7️⃣ Checking available Node binaries in /opt:"
find /opt -name "node" -type f 2>/dev/null | grep -v node_modules | while read -r nodepath; do
    if [ -x "$nodepath" ]; then
        version=$("$nodepath" --version 2>/dev/null)
        echo "  📦 Found: $nodepath → $version"
        if [[ $version == v18.* ]]; then
            echo "  ✅ Node 18 found!"
            echo "  👉 USE THIS: $nodepath server.js"
        fi
    fi
done
echo ""

echo "=============================================="
echo "🎯 Summary & Next Steps"
echo "=============================================="
echo ""

# Check if we found any Node 18 installations
found_node18=false

if [ -f "/opt/cpanel/ea-nodejs18/bin/node" ]; then
    found_node18=true
    echo "✅ Node 18 FOUND via EasyApache!"
    echo ""
    echo "📝 To use it, run:"
    echo "   cd ~/api"
    echo "   PORT=3002 /opt/cpanel/ea-nodejs18/bin/node server.js"
    echo ""
fi

if [ -f "/opt/alt/alt-nodejs18/root/usr/bin/node" ]; then
    found_node18=true
    echo "✅ Node 18 FOUND via CloudLinux!"
    echo ""
    echo "📝 To use it, run:"
    echo "   cd ~/api"
    echo "   PORT=3002 /opt/alt/alt-nodejs18/root/usr/bin/node server.js"
    echo ""
fi

if [ "$found_node18" = false ]; then
    echo "❌ Node 18 not found on this server"
    echo ""
    echo "📧 Next Steps:"
    echo ""
    echo "1. Check cPanel 'Setup Node.js App' for version selector"
    echo "2. Contact Pixelish support to request Node 18 installation"
    echo "3. Consider alternative hosting (Render.com $7/month)"
    echo ""
    echo "📄 Use this email template: EMAIL_TO_PIXELISH.txt"
fi

echo ""
echo "💡 For more solutions, see: CPANEL_NODE18_SOLUTIONS.md"
echo "=============================================="
