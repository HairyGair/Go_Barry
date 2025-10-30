#!/bin/bash
# Add debug logging to identify which file is being loaded
# Run as: bash cpanel-add-debug-logging.sh

echo "Adding debug logging to supervisors.js..."

# Create a backup first
cp ~/api/routes/supervisors.js ~/api/routes/supervisors.js.debug-backup

# Add console.log at the very top of the file (after imports)
cat > /tmp/debug-header.js << 'EOF'
// ============================================
// DEBUG: File load verification
// ============================================
const __filename_debug = new URL(import.meta.url).pathname;
console.log('==========================================');
console.log('SUPERVISORS.JS LOADED');
console.log('File path:', __filename_debug);
console.log('Timestamp:', new Date().toISOString());
console.log('File size:', __filename_debug);
console.log('==========================================');
// ============================================

EOF

# Find the line number after the last import statement
LAST_IMPORT_LINE=$(grep -n "^import" ~/api/routes/supervisors.js | tail -1 | cut -d: -f1)
NEXT_LINE=$((LAST_IMPORT_LINE + 1))

# Insert debug code after imports
head -n $LAST_IMPORT_LINE ~/api/routes/supervisors.js > /tmp/supervisors-temp.js
cat /tmp/debug-header.js >> /tmp/supervisors-temp.js
tail -n +$NEXT_LINE ~/api/routes/supervisors.js >> /tmp/supervisors-temp.js

# Replace original file
mv /tmp/supervisors-temp.js ~/api/routes/supervisors.js

echo "Debug logging added. Now restart the server..."
touch ~/api/tmp/restart.txt
pkill -9 -f node

echo ""
echo "Wait 5 seconds then check logs with:"
echo "  tail -100 ~/api/logs/error.log"
echo "  tail -100 ~/api/logs/access.log"
echo ""
echo "Or if Passenger logs exist:"
echo "  tail -100 ~/passenger.*.log"
echo ""
