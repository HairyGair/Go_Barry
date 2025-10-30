#!/bin/bash

# Upload WebAssembly Fix to cPanel
# Only uploads the two files that were fixed by the agent

echo "📦 Creating WebAssembly fix package..."

# Create temporary directory
TEMP_DIR="webassembly-fix"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Copy only the fixed files
echo "📋 Copying fixed files..."
cp server.js "$TEMP_DIR/"
mkdir -p "$TEMP_DIR/config"
cp config/mysql.js "$TEMP_DIR/config/"
mkdir -p "$TEMP_DIR/routes"
cp routes/webSocketHandler.js "$TEMP_DIR/routes/"

# Create instructions file
cat > "$TEMP_DIR/UPLOAD_INSTRUCTIONS.txt" << 'EOF'
WebAssembly Fix - Upload Instructions
======================================

These three files fix the "WebAssembly.instantiate(): Out of memory" error.

FILES TO UPLOAD:
1. server.js → Replace ~/api/server.js
2. config/mysql.js → Replace ~/api/config/mysql.js
3. routes/webSocketHandler.js → Replace ~/api/routes/webSocketHandler.js

METHOD 1: Via cPanel File Manager
----------------------------------
1. Log into cPanel at Pixelish
2. Open "File Manager"
3. Navigate to /home/gobarryco/api/
4. Upload server.js (replace existing)
5. Navigate to /home/gobarryco/api/config/
6. Upload mysql.js (replace existing)

METHOD 2: Via Terminal (if SSH enabled)
----------------------------------------
From your Mac terminal:
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp/backend"
scp server.js gobarryco@85.234.151.224:~/api/
scp config/mysql.js gobarryco@85.234.151.224:~/api/config/
scp routes/webSocketHandler.js gobarryco@85.234.151.224:~/api/routes/

AFTER UPLOADING:
----------------
In cPanel Terminal, run:
cd ~/api
PORT=3002 node server.js

EXPECTED OUTPUT:
----------------
✅ MySQL client configuration loaded
🔍 Verifying MySQL database connection...
✅ MySQL database connection configured
📊 Database will be tested on first query
✅ WebSocket server initialized
🚀 Breakdown Guide API running on port 3002

WHAT WAS FIXED:
---------------
- Removed automatic database connection verification on startup
- Simplified healthCheck to avoid WebAssembly memory allocation
- Disabled file watchers to prevent background WebAssembly triggers
- Database will be tested lazily on first actual API call
- This allows server to start on shared hosting with limited memory
EOF

# Create zip file
echo "🗜️ Creating zip archive..."
cd "$TEMP_DIR"
zip -r ../webassembly-fix.zip . -x "*.DS_Store"
cd ..

# Clean up temp directory
rm -rf "$TEMP_DIR"

echo ""
echo "✅ WebAssembly fix package created!"
echo ""
echo "📦 File: webassembly-fix.zip"
echo "📏 Size: $(du -h webassembly-fix.zip | cut -f1)"
echo ""
echo "📄 Contains:"
echo "   - server.js (main server file)"
echo "   - config/mysql.js (database configuration)"
echo "   - UPLOAD_INSTRUCTIONS.txt (detailed instructions)"
echo ""
echo "🚀 Next steps:"
echo "   1. Upload this zip to cPanel File Manager"
echo "   2. Extract it in the ~/api directory (overwrite existing files)"
echo "   3. In Terminal: PORT=3002 node server.js"
echo ""
