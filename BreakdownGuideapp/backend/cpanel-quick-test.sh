#!/bin/bash
# Quick Status Test - Run this anytime to check current state
# Usage: bash cpanel-quick-test.sh

clear
echo "╔════════════════════════════════════════╗"
echo "║   GO BARRY API - Quick Status Check   ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Color codes (if supported)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Health Endpoint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HEALTH=$(curl -s https://api.breakdowns.gobarry.co.uk/api/health 2>/dev/null)
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✓ PASS${NC} - Health endpoint responding"
else
    echo -e "${RED}✗ FAIL${NC} - Health endpoint not responding"
    echo "Response: $HEALTH"
fi
echo ""

# Test 2: Supervisor Endpoint
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Supervisor Endpoint (AG003)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
SUPERVISOR=$(curl -s https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003 2>/dev/null)

if echo "$SUPERVISOR" | grep -q "Database error while fetching supervisor"; then
    echo -e "${RED}✗ FAIL${NC} - Returns OLD error message (from backup file)"
    echo "This means the cache issue is NOT fixed yet."
elif echo "$SUPERVISOR" | grep -q "Failed to fetch supervisor"; then
    echo -e "${YELLOW}⚠ PARTIAL${NC} - Returns new error message (from current file)"
    echo "File is loaded correctly, but there's a database/logic error"
elif echo "$SUPERVISOR" | grep -q "success"; then
    echo -e "${GREEN}✓ PASS${NC} - Returns success response"
else
    echo -e "${YELLOW}? UNKNOWN${NC} - Unexpected response"
    echo "Response: $SUPERVISOR" | head -5
fi
echo ""

# Test 3: Check for old error message
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Checking for Old Error Message"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if echo "$SUPERVISOR" | grep -q "Database error while fetching supervisor"; then
    echo -e "${RED}✗ OLD ERROR DETECTED${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run: bash cpanel-smoking-gun.sh"
    echo "  2. If backup file is loaded, run: bash cpanel-nuclear-fix.sh"
else
    echo -e "${GREEN}✓ OLD ERROR NOT PRESENT${NC}"
fi
echo ""

# Test 4: File Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 4: File System Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if backup file exists in routes directory
if [ -f ~/api/routes/supervisors.js.backup-supabase ]; then
    echo -e "${YELLOW}⚠ WARNING${NC} - Backup file exists in routes directory"
    echo "  File: ~/api/routes/supervisors.js.backup-supabase"
    echo "  Recommendation: Move to ~/api/backups/"
else
    echo -e "${GREEN}✓ GOOD${NC} - No backup files in routes directory"
fi

# Check current file
if [ -f ~/api/routes/supervisors.js ]; then
    SIZE=$(stat -f%z ~/api/routes/supervisors.js 2>/dev/null || stat -c%s ~/api/routes/supervisors.js 2>/dev/null)
    MODIFIED=$(ls -lh ~/api/routes/supervisors.js | awk '{print $6, $7, $8}')
    echo -e "${GREEN}✓ FOUND${NC} - supervisors.js exists"
    echo "  Size: $SIZE bytes"
    echo "  Modified: $MODIFIED"
else
    echo -e "${RED}✗ MISSING${NC} - supervisors.js not found!"
fi
echo ""

# Test 5: Process Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 5: Node.js Process Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
NODE_PROCS=$(ps aux | grep -E "[n]ode.*api|[p]assenger.*node" | wc -l)
if [ "$NODE_PROCS" -gt 0 ]; then
    echo -e "${GREEN}✓ FOUND${NC} - $NODE_PROCS Node.js/Passenger process(es) running"
else
    echo -e "${YELLOW}⚠ NOTICE${NC} - No Node.js processes visible"
    echo "  This is normal with Passenger (spawns on demand)"
fi
echo ""

# Test 6: Server.js Import Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 6: Server.js Import Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
IMPORT_LINE=$(grep -i "supervisors" ~/api/server.js | grep -E "(import|require)" | head -1)
if echo "$IMPORT_LINE" | grep -q "backup"; then
    echo -e "${RED}✗ WRONG${NC} - server.js imports backup file!"
    echo "  Line: $IMPORT_LINE"
    echo "  Fix: Edit server.js to import './routes/supervisors.js'"
elif echo "$IMPORT_LINE" | grep -q "supervisors.js"; then
    echo -e "${GREEN}✓ CORRECT${NC} - server.js imports correct file"
    echo "  Line: $IMPORT_LINE"
else
    echo -e "${YELLOW}? UNKNOWN${NC} - Could not find import statement"
    echo "  Search result: $IMPORT_LINE"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PASS_COUNT=0
FAIL_COUNT=0

# Count results
echo "$HEALTH" | grep -q "healthy" && ((PASS_COUNT++)) || ((FAIL_COUNT++))
! echo "$SUPERVISOR" | grep -q "Database error while fetching supervisor" && ((PASS_COUNT++)) || ((FAIL_COUNT++))

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}        ALL TESTS PASSED ✓            ${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "The cache issue appears to be resolved!"
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}      ISSUES DETECTED - NEEDS FIX       ${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Recommended next steps:"
    echo "  1. bash cpanel-smoking-gun.sh    (identify which file is loaded)"
    echo "  2. bash cpanel-force-refresh.sh  (try standard fix)"
    echo "  3. bash cpanel-nuclear-fix.sh    (if still broken)"
fi
echo ""

# Quick actions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Quick Actions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Restart server:  touch ~/api/tmp/restart.txt && pkill -9 -f node"
echo "  Force restart:   bash cpanel-force-refresh.sh"
echo "  Full diagnostic: bash cpanel-debug-cache.sh"
echo "  Prove file load: bash cpanel-smoking-gun.sh"
echo "  Nuclear option:  bash cpanel-nuclear-fix.sh"
echo ""
echo "Run this test again: bash cpanel-quick-test.sh"
echo ""
