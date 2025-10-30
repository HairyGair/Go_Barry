#!/bin/bash
# Compare file contents to identify the source of the error message

echo "=========================================="
echo "FILE CONTENT COMPARISON"
echo "=========================================="
echo ""

echo "1. SEARCHING FOR ERROR MESSAGE IN ALL FILES"
echo "--------------------------------------------"
echo "Searching for: 'Database error while fetching supervisor'"
echo ""

# Search in current file
echo "Current file (supervisors.js):"
if grep -n "Database error while fetching supervisor" ~/api/routes/supervisors.js; then
    echo "  ❌ FOUND in current file (this is WRONG!)"
else
    echo "  ✅ NOT FOUND in current file (this is correct)"
fi
echo ""

# Search in backup file
echo "Backup file (supervisors.js.backup-supabase):"
if [ -f ~/api/routes/supervisors.js.backup-supabase ]; then
    if grep -n "Database error while fetching supervisor" ~/api/routes/supervisors.js.backup-supabase; then
        echo "  ⚠️  FOUND in backup file (this is the problem source!)"
    else
        echo "  ✅ NOT FOUND in backup file"
    fi
else
    echo "  ℹ️  Backup file does not exist"
fi
echo ""

# Search in ALL .js files
echo "All .js files in routes directory:"
grep -r "Database error while fetching supervisor" ~/api/routes/*.js 2>/dev/null || echo "  ✅ Not found in any .js files"
echo ""

echo "2. CHECKING SERVER.JS IMPORTS"
echo "--------------------------------------------"
echo "Looking for supervisor route import..."
grep -n -A 2 -B 2 "supervisor" ~/api/server.js | grep -E "(import|require|routes)"
echo ""

echo "3. FILE HASHES (to verify they're different)"
echo "--------------------------------------------"
if command -v md5sum >/dev/null 2>&1; then
    md5sum ~/api/routes/supervisors.js* 2>/dev/null
elif command -v md5 >/dev/null 2>&1; then
    md5 ~/api/routes/supervisors.js* 2>/dev/null
else
    echo "md5 command not available, showing file sizes instead:"
    ls -lh ~/api/routes/supervisors.js*
fi
echo ""

echo "4. ACTUAL API RESPONSE"
echo "--------------------------------------------"
echo "Calling API: https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003"
API_RESPONSE=$(curl -s https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003)
echo "$API_RESPONSE"
echo ""

# Check which error message appears
if echo "$API_RESPONSE" | grep -q "Database error while fetching supervisor"; then
    echo "❌ API RETURNS OLD ERROR - File cache issue confirmed!"
elif echo "$API_RESPONSE" | grep -q "Failed to fetch supervisor"; then
    echo "✅ API returns CURRENT error message - File is loaded correctly"
elif echo "$API_RESPONSE" | grep -q "success"; then
    echo "✅ API returns success - Everything working!"
else
    echo "⚠️  API returns unexpected response"
fi
echo ""

echo "5. ERROR MESSAGE LOCATION IN FILES"
echo "--------------------------------------------"
echo "Current file error messages (should be these):"
grep -n "Failed to fetch" ~/api/routes/supervisors.js | head -5
echo ""
echo "Backup file error messages (should NOT appear in API):"
if [ -f ~/api/routes/supervisors.js.backup-supabase ]; then
    grep -n "Database error" ~/api/routes/supervisors.js.backup-supabase | head -5
fi
echo ""

echo "6. RECOMMENDATION"
echo "--------------------------------------------"
if echo "$API_RESPONSE" | grep -q "Database error while fetching supervisor"; then
    echo "DIAGNOSIS: Server is loading the BACKUP file, not current file!"
    echo ""
    echo "Possible causes:"
    echo "  1. server.js imports wrong file path"
    echo "  2. Passenger cached the old module"
    echo "  3. Symlink pointing to backup file"
    echo ""
    echo "Next steps:"
    echo "  A. Check server.js import: grep supervisor ~/api/server.js"
    echo "  B. Run: bash cpanel-force-refresh.sh"
    echo "  C. If still broken, rename backup file completely"
else
    echo "✅ API appears to be loading the correct file"
    echo "If you're still seeing errors, they're from the current code"
fi
echo ""

echo "=========================================="
echo "Comparison complete"
echo "=========================================="
