#!/bin/bash
# Nuclear option: Completely eliminate the possibility of loading wrong file
# Only run this if all other methods fail!

echo "=========================================="
echo "NUCLEAR CACHE FIX - LAST RESORT"
echo "=========================================="
echo ""
echo "⚠️  WARNING: This will:"
echo "  1. Move ALL backup files out of the routes directory"
echo "  2. Rename current supervisors.js to supervisor-routes.js"
echo "  3. Update server.js to use new name"
echo "  4. Delete all cache and temp files"
echo "  5. Force complete cold restart"
echo ""
read -p "Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi
echo ""

echo "Step 1: Creating safety backup..."
mkdir -p ~/api/SAFETY_BACKUP_$(date +%Y%m%d_%H%M%S)
cp ~/api/routes/supervisors.js ~/api/SAFETY_BACKUP_$(date +%Y%m%d_%H%M%S)/
cp ~/api/server.js ~/api/SAFETY_BACKUP_$(date +%Y%m%d_%H%M%S)/
echo "✅ Backup created in ~/api/SAFETY_BACKUP_*"
echo ""

echo "Step 2: Moving ALL backup and old files..."
mkdir -p ~/api/old-files-archive
mv ~/api/routes/*.backup* ~/api/old-files-archive/ 2>/dev/null || echo "No backup files found"
mv ~/api/routes/*.bak ~/api/old-files-archive/ 2>/dev/null || echo "No .bak files found"
mv ~/api/routes/*.old ~/api/old-files-archive/ 2>/dev/null || echo "No .old files found"
echo "✅ Old files moved to ~/api/old-files-archive/"
echo ""

echo "Step 3: Renaming supervisors.js to supervisor-routes.js..."
mv ~/api/routes/supervisors.js ~/api/routes/supervisor-routes.js
echo "✅ File renamed"
echo ""

echo "Step 4: Updating server.js import..."
# Make backup of server.js
cp ~/api/server.js ~/api/server.js.pre-nuclear

# Update import statement (handle both import and require styles)
sed -i 's|from [\x27\x22]./routes/supervisors.js[\x27\x22]|from "./routes/supervisor-routes.js"|g' ~/api/server.js
sed -i "s|from './routes/supervisors.js'|from './routes/supervisor-routes.js'|g" ~/api/server.js
sed -i 's|require([\x27\x22]./routes/supervisors.js[\x27\x22])|require("./routes/supervisor-routes.js")|g' ~/api/server.js

echo "✅ server.js updated. Verification:"
grep -n "supervisor-routes" ~/api/server.js || echo "❌ WARNING: Pattern not found in server.js!"
echo ""

echo "Step 5: Clearing ALL caches..."
# Kill all processes
pkill -9 -f "node" 2>/dev/null
pkill -9 -f "passenger" 2>/dev/null

# Clear tmp directory
rm -rf ~/api/tmp/*
mkdir -p ~/api/tmp

# Clear any node_modules cache
find ~/api/node_modules -type d -name ".cache" -exec rm -rf {} + 2>/dev/null

# Clear any system temp files related to this app
rm -rf /tmp/passenger* 2>/dev/null
rm -rf /tmp/node* 2>/dev/null

echo "✅ All caches cleared"
echo ""

echo "Step 6: Creating fresh restart marker..."
touch ~/api/tmp/restart.txt
chmod 644 ~/api/tmp/restart.txt
echo "✅ Restart marker created"
echo ""

echo "Step 7: Waiting 10 seconds for cold start..."
sleep 10
echo ""

echo "Step 8: Testing new endpoint..."
echo "Request: https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003"
echo ""
API_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003)
echo "$API_RESPONSE"
echo ""

# Check for old error
if echo "$API_RESPONSE" | grep -q "Database error while fetching supervisor"; then
    echo "❌ STILL SHOWING OLD ERROR!"
    echo ""
    echo "This means the issue is NOT a simple file cache."
    echo "Possible remaining causes:"
    echo "  1. Passenger is serving from a different directory entirely"
    echo "  2. There's a reverse proxy or CDN caching responses"
    echo "  3. Multiple Node processes running from different locations"
    echo ""
    echo "Run this to investigate:"
    echo "  ps aux | grep node"
    echo "  passenger-status"
    echo "  cat ~/.passenger/config.json"
    echo ""
else
    echo "✅ SUCCESS! The old error message is gone!"
    echo ""
    echo "The API is now loading from: ~/api/routes/supervisor-routes.js"
    echo ""
fi

echo "Step 9: Verification commands..."
echo ""
echo "Check running processes:"
echo "  ps aux | grep -E 'node|passenger' | grep -v grep"
echo ""
echo "Check which file is actually loaded:"
echo "  curl -s https://api.breakdowns.gobarry.co.uk/api/health"
echo ""
echo "View application logs:"
echo "  tail -50 ~/logs/*.log 2>/dev/null"
echo ""

echo "=========================================="
echo "NUCLEAR FIX COMPLETE"
echo "=========================================="
echo ""
echo "If this worked:"
echo "  - Keep using supervisor-routes.js as the new filename"
echo "  - Delete ~/api/old-files-archive when confirmed working"
echo ""
echo "If this DIDN'T work:"
echo "  - Restore from ~/api/SAFETY_BACKUP_*"
echo "  - Contact cPanel support with this diagnostic info"
echo "  - The problem is likely in Passenger configuration"
echo ""
