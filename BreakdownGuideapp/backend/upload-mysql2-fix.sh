#!/bin/bash

# Upload mysql2 v2.3.3 Fix for WebAssembly Issue
# This downgrade should resolve the undici/WebAssembly memory errors

echo "📦 Creating mysql2 v2.3.3 fix package..."

# Set deployment directory name
TEMP_DIR="mysql2-fix"
ZIP_NAME="mysql2-fix.zip"

# Remove old files
rm -rf "$TEMP_DIR"
rm -f "$ZIP_NAME"

# Create fresh directory
mkdir -p "$TEMP_DIR"

echo "📋 Copying fixed files..."

# Copy package.json with downgraded mysql2
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/"

# Copy updated config
mkdir -p "$TEMP_DIR/config"
cp config/mysql.js "$TEMP_DIR/config/"

# Create instructions
cat > "$TEMP_DIR/INSTALL_INSTRUCTIONS.txt" << 'EOF'
mysql2 v2.3.3 Downgrade - Installation Instructions
=====================================================

This package downgrades mysql2 from v3.15.2 to v2.3.3 to fix WebAssembly errors.

INSTALLATION STEPS:
-------------------

1. In cPanel Terminal, stop the server if running:
   Press Ctrl+C to stop

2. Navigate to api directory:
   cd ~/api

3. Upload this zip file to ~/api/ using File Manager

4. Extract the files:
   unzip -o mysql2-fix.zip

5. Reinstall dependencies with downgraded version:
   npm install

6. Start the server:
   PORT=3002 node server.js

EXPECTED CHANGES:
-----------------
- mysql2 will downgrade from v3.15.2 → v2.3.3
- Warning messages about acquireTimeout and timeout will disappear
- WebAssembly error should be resolved

EXPECTED OUTPUT:
----------------
✅ MySQL client configuration loaded
   Database: gobarryco_breakdown@localhost
🔌 Initializing WebSocket server
✅ WebSocket server initialized (file watchers disabled for shared hosting)
🚀 Breakdown Guide API running on port 3002
🔍 Verifying MySQL database connection...
✅ MySQL database connection configured
📊 Database will be tested on first query
✅ Server ready for connections with MySQL database

[SERVER SHOULD STAY RUNNING - NO CRASH!]

WHY THIS WORKS:
---------------
- mysql2 v3.15.2 has compatibility issues with Node.js 22 on shared hosting
- mysql2 v2.3.3 is stable, battle-tested, and doesn't trigger undici
- v2.3.3 has all the features we need (connection pooling, prepared statements)
- No code changes required - 100% compatible API

IF THIS STILL DOESN'T WORK:
----------------------------
Contact Pixelish support and request Node.js 18 LTS installation.
See CONTACT_HOST_REQUEST.md for the email template.

Created: $(date)
EOF

# Create zip file
echo "🗜️ Creating zip archive..."
cd "$TEMP_DIR"
zip -r "../$ZIP_NAME" . -x "*.DS_Store"
cd ..

# Clean up temp directory
rm -rf "$TEMP_DIR"

echo ""
echo "✅ mysql2 v2.3.3 fix package created!"
echo ""
echo "📦 File: $ZIP_NAME"
echo "📏 Size: $(du -h "$ZIP_NAME" | cut -f1)"
echo ""
echo "📄 Contains:"
echo "   - package.json (mysql2 v2.3.3)"
echo "   - package-lock.json (locked dependencies)"
echo "   - config/mysql.js (removed invalid options)"
echo "   - INSTALL_INSTRUCTIONS.txt"
echo ""
echo "🚀 Upload Steps:"
echo "   1. Upload $ZIP_NAME to ~/api/ in cPanel File Manager"
echo "   2. Extract: unzip -o mysql2-fix.zip"
echo "   3. Install: npm install"
echo "   4. Run: PORT=3002 node server.js"
echo ""
