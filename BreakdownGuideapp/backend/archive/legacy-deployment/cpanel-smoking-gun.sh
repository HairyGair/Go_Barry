#!/bin/bash
# Smoking Gun Detector - Definitively prove which file is loaded
# This adds unique markers to each file and tests which one responds

echo "=========================================="
echo "SMOKING GUN DETECTION"
echo "=========================================="
echo ""

echo "This script will:"
echo "1. Add unique test endpoints to BOTH files"
echo "2. Test which endpoint responds"
echo "3. This proves definitively which file is loaded"
echo ""

# Create backups
echo "Creating safety backups..."
cp ~/api/routes/supervisors.js ~/api/routes/supervisors.js.smoking-gun-backup
if [ -f ~/api/routes/supervisors.js.backup-supabase ]; then
    cp ~/api/routes/supervisors.js.backup-supabase ~/api/routes/supervisors.js.backup-supabase.smoking-gun-backup
fi
echo ""

# Add unique marker to CURRENT file
echo "Adding marker to CURRENT file (supervisors.js)..."
cat >> ~/api/routes/supervisors.js << 'EOF'

// ============ SMOKING GUN TEST ============
// This endpoint ONLY exists in supervisors.js (CURRENT FILE)
router.get('/smoking-gun-test-current', (req, res) => {
  res.json({
    loaded_from: 'supervisors.js (CURRENT FILE)',
    timestamp: new Date().toISOString(),
    file_path: '/home/gobarryco/api/routes/supervisors.js',
    expected: 'This is the CORRECT file to load'
  });
});
// ==========================================

EOF
echo "✅ Marker added to CURRENT file"
echo ""

# Add unique marker to BACKUP file (if it exists)
if [ -f ~/api/routes/supervisors.js.backup-supabase ]; then
    echo "Adding marker to BACKUP file (supervisors.js.backup-supabase)..."
    cat >> ~/api/routes/supervisors.js.backup-supabase << 'EOF'

// ============ SMOKING GUN TEST ============
// This endpoint ONLY exists in supervisors.js.backup-supabase (BACKUP FILE)
router.get('/smoking-gun-test-backup', (req, res) => {
  res.json({
    loaded_from: 'supervisors.js.backup-supabase (BACKUP FILE - WRONG!)',
    timestamp: new Date().toISOString(),
    file_path: '/home/gobarryco/api/routes/supervisors.js.backup-supabase',
    expected: 'This file should NOT be loaded!'
  });
});
// ==========================================

EOF
    echo "✅ Marker added to BACKUP file"
else
    echo "ℹ️  Backup file doesn't exist, skipping"
fi
echo ""

# Restart server
echo "Restarting server..."
pkill -9 -f node
sleep 2
touch ~/api/tmp/restart.txt
sleep 5
echo "✅ Server restarted"
echo ""

# Test endpoints
echo "=========================================="
echo "TESTING ENDPOINTS"
echo "=========================================="
echo ""

echo "Test 1: Testing CURRENT file endpoint..."
echo "URL: https://api.breakdowns.gobarry.co.uk/api/supervisors/smoking-gun-test-current"
CURRENT_RESPONSE=$(curl -s https://api.breakdowns.gobarry.co.uk/api/supervisors/smoking-gun-test-current)
echo "$CURRENT_RESPONSE"
echo ""

if echo "$CURRENT_RESPONSE" | grep -q "CURRENT FILE"; then
    echo "✅ SUCCESS: Current file endpoint responded!"
    CURRENT_LOADED=true
else
    echo "❌ Current file endpoint did NOT respond"
    CURRENT_LOADED=false
fi
echo ""

echo "Test 2: Testing BACKUP file endpoint..."
echo "URL: https://api.breakdowns.gobarry.co.uk/api/supervisors/smoking-gun-test-backup"
BACKUP_RESPONSE=$(curl -s https://api.breakdowns.gobarry.co.uk/api/supervisors/smoking-gun-test-backup)
echo "$BACKUP_RESPONSE"
echo ""

if echo "$BACKUP_RESPONSE" | grep -q "BACKUP FILE"; then
    echo "❌ PROBLEM: Backup file endpoint responded!"
    BACKUP_LOADED=true
else
    echo "✅ Backup file endpoint did NOT respond (good)"
    BACKUP_LOADED=false
fi
echo ""

# Test original endpoint
echo "Test 3: Testing original AG003 endpoint..."
echo "URL: https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003"
ORIGINAL_RESPONSE=$(curl -s https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003)
echo "$ORIGINAL_RESPONSE" | head -20
echo ""

if echo "$ORIGINAL_RESPONSE" | grep -q "Database error while fetching supervisor"; then
    echo "❌ Original endpoint shows OLD error (backup file error)"
    ORIGINAL_OLD=true
else
    echo "✅ Original endpoint does NOT show old error"
    ORIGINAL_OLD=false
fi
echo ""

# Final diagnosis
echo "=========================================="
echo "FINAL DIAGNOSIS"
echo "=========================================="
echo ""

if [ "$CURRENT_LOADED" = true ] && [ "$BACKUP_LOADED" = false ]; then
    echo "✅ RESULT: Server is loading the CURRENT file correctly!"
    echo ""
    echo "The caching issue may be:"
    echo "  - In the specific route handler code"
    echo "  - In database connection"
    echo "  - In error handling logic"
    echo ""
    echo "But the FILE ITSELF is correct."

elif [ "$CURRENT_LOADED" = false ] && [ "$BACKUP_LOADED" = true ]; then
    echo "❌ RESULT: Server is loading the BACKUP file!"
    echo ""
    echo "This CONFIRMS the cache issue. The server is definitely loading:"
    echo "  ~/api/routes/supervisors.js.backup-supabase"
    echo ""
    echo "NEXT STEPS:"
    echo "  1. Check server.js import statement"
    echo "  2. Run: bash cpanel-nuclear-fix.sh"
    echo "  3. Contact cPanel support if that fails"

elif [ "$CURRENT_LOADED" = true ] && [ "$BACKUP_LOADED" = true ]; then
    echo "⚠️  RESULT: BOTH files are loaded!"
    echo ""
    echo "This means:"
    echo "  - Multiple router instances are registered"
    echo "  - server.js may import BOTH files"
    echo "  - There may be duplicate app.use() statements"
    echo ""
    echo "Check server.js for duplicate imports/routes"

else
    echo "❌ RESULT: NEITHER file responded!"
    echo ""
    echo "This means:"
    echo "  - Server didn't restart properly"
    echo "  - Router export is broken"
    echo "  - Route registration failed"
    echo ""
    echo "Check server logs for errors"
fi
echo ""

echo "=========================================="
echo "CLEANUP"
echo "=========================================="
echo ""
echo "The test endpoints are still in the files."
echo ""
echo "To remove them:"
echo "  cp ~/api/routes/supervisors.js.smoking-gun-backup ~/api/routes/supervisors.js"
if [ -f ~/api/routes/supervisors.js.backup-supabase ]; then
    echo "  cp ~/api/routes/supervisors.js.backup-supabase.smoking-gun-backup ~/api/routes/supervisors.js.backup-supabase"
fi
echo "  touch ~/api/tmp/restart.txt"
echo ""
echo "Or leave them - they don't hurt anything and can be used for future testing."
echo ""

echo "=========================================="
echo "TEST COMPLETE"
echo "=========================================="
