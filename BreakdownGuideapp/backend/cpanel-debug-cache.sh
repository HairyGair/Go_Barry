#!/bin/bash
# cPanel/Passenger Cache Diagnostic Script
# Run this in SSH as: bash cpanel-debug-cache.sh

echo "=========================================="
echo "GO BARRY API - Cache Diagnostic Report"
echo "=========================================="
echo ""

echo "1. FINDING ALL FILES WITH OLD ERROR MESSAGE"
echo "--------------------------------------------"
grep -r "Database error while fetching supervisor" ~/api/ 2>/dev/null || echo "Not found in any files"
echo ""

echo "2. CHECKING SERVER.JS ROUTE IMPORTS"
echo "--------------------------------------------"
grep -n "supervisors" ~/api/server.js
echo ""

echo "3. CHECKING ALL SUPERVISOR-RELATED FILES"
echo "--------------------------------------------"
find ~/api -name "*supervisor*" -type f -exec ls -lh {} \;
echo ""

echo "4. CHECKING FOR BUILD/DIST DIRECTORIES"
echo "--------------------------------------------"
find ~/api -type d \( -name "dist" -o -name "build" -o -name ".cache" -o -name "node_modules/.cache" \) 2>/dev/null
echo ""

echo "5. CHECKING PASSENGER CONFIGURATION"
echo "--------------------------------------------"
if [ -f ~/api/tmp/restart.txt ]; then
    ls -lh ~/api/tmp/restart.txt
else
    echo "restart.txt does not exist"
fi
echo ""

echo "6. CHECKING RUNNING NODE PROCESSES"
echo "--------------------------------------------"
ps aux | grep -E "(node|passenger)" | grep -v grep || echo "No Node/Passenger processes found"
echo ""

echo "7. CHECKING FILE MODIFICATION TIMES"
echo "--------------------------------------------"
ls -lh ~/api/routes/supervisors.js*
echo ""

echo "8. CHECKING ACTUAL FILE CONTENT (first 20 lines)"
echo "--------------------------------------------"
head -20 ~/api/routes/supervisors.js
echo ""

echo "9. CHECKING FOR SYMLINKS"
echo "--------------------------------------------"
ls -la ~/api/routes/ | grep supervisor
echo ""

echo "10. CHECKING .ENV FILE"
echo "--------------------------------------------"
if [ -f ~/api/.env ]; then
    grep -E "DB_|MYSQL_" ~/api/.env | sed 's/PASSWORD=.*/PASSWORD=***REDACTED***/g'
else
    echo ".env file not found"
fi
echo ""

echo "=========================================="
echo "Diagnostic complete. Review output above."
echo "=========================================="
