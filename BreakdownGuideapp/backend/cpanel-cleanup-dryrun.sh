#!/bin/bash
# cPanel Backend Cleanup - DRY RUN
# Shows what would be deleted WITHOUT actually deleting anything
# Safe to run - makes no changes

echo "🔍 cPanel Backend Cleanup - DRY RUN"
echo "===================================="
echo ""
echo "This script will show what WOULD be deleted"
echo "No files will actually be removed"
echo ""

cd ~/api || exit 1

total_count=0

echo "📋 Files that WOULD be deleted:"
echo ""

echo "1️⃣  Backup Files:"
find . -maxdepth 1 -name "*.backup" -type f 2>/dev/null | while read -r f; do echo "   - $f"; done
find . -maxdepth 1 -name "*.backup-*" -type f 2>/dev/null | while read -r f; do echo "   - $f"; done
find routes/ -name "*.backup*" -type f 2>/dev/null | while read -r f; do echo "   - $f"; done
find middleware/ -name "*.backup*" -type f 2>/dev/null | while read -r f; do echo "   - $f"; done
backup_count=$(find . -name "*.backup*" -type f 2>/dev/null | wc -l)
echo "   Total: $backup_count files"
total_count=$((total_count + backup_count))
echo ""

echo "2️⃣  Test Files:"
[ -f routes/test-defects.js ] && echo "   - routes/test-defects.js" && total_count=$((total_count + 1))
echo ""

echo "3️⃣  Old Archives:"
[ -f gobarry-backend.zip ] && echo "   - gobarry-backend.zip (252KB)" && total_count=$((total_count + 1))
echo ""

echo "4️⃣  Legacy Scripts:"
for script in cpanel-*.sh deploy-*.sh upload-*.sh quick-test.sh check-node-versions.sh create-deployment-zip.sh prepare-cpanel-deployment.sh quick-deploy-cpanel.sh diagnose-cpanel-deployment.sh keep-alive.sh; do
    [ -f "$script" ] && echo "   - $script" && total_count=$((total_count + 1))
done
echo ""

echo "5️⃣  Legacy Utility Files:"
for file in add-diagnostic-route.js diagnostic-endpoint.js REQUIRED_ENDPOINTS.js app.js run-migration.js setup-passwords.sql; do
    [ -f "$file" ] && echo "   - $file" && total_count=$((total_count + 1))
done
echo ""

echo "6️⃣  Orphaned Files:"
[ -f auth.js ] && echo "   - auth.js (should only be in routes/)" && total_count=$((total_count + 1))
echo ""

echo "7️⃣  Temporary/Log Files:"
for log in nohup.out stderr.log keep-alive.log; do
    [ -f "$log" ] && echo "   - $log" && total_count=$((total_count + 1))
done
echo ""

echo "8️⃣  Old SQL Files:"
for sql in RUN_ALL_MIGRATIONS.sql RUN_ALL_MIGRATIONS_MYSQL_COMPATIBLE.sql CREATE_MISSING_TABLES_ONLY.sql CREATE_TABLES_NO_FK.sql; do
    [ -f "$sql" ] && echo "   - $sql" && total_count=$((total_count + 1))
done
echo ""

echo "9️⃣  Legacy Documentation:"
doc_count=0

# Migration docs
for doc in *_MIGRATION_*.md MIGRATION_*.md; do
    [ -f "$doc" ] && echo "   - $doc" && doc_count=$((doc_count + 1))
done

# Deployment docs
for doc in DEPLOYMENT_*.md DEPLOY_*.md; do
    [ -f "$doc" ] && echo "   - $doc" && doc_count=$((doc_count + 1))
done

# cPanel docs
for doc in CPANEL_*.md CPANEL_*.txt; do
    [ -f "$doc" ] && echo "   - $doc" && doc_count=$((doc_count + 1))
done

# Quick guides
for doc in QUICK_*.md; do
    [ -f "$doc" ] && echo "   - $doc" && doc_count=$((doc_count + 1))
done

# Other legacy docs
for doc in ADDITIONAL_*.md ALTERNATIVE_*.md API_DOCUMENTATION_INDEX.md API_EXPLORATION_SUMMARY.md API_WEBSOCKET_ANALYSIS.md AUTH_QUICKSTART.md CONTACT_HOST_REQUEST.md CYBERDUCK_*.md EMAIL_TO_PIXELISH.txt HOST_RESTART_REQUEST.md IMPLEMENTATION_CHECKLIST.md OPTIMIZATION_*.md PIXELISH_SUPPORT_TICKET.md PRODUCTION_SUCCESS.md PUBLIC_ROUTES_MYSQL_MIGRATION.md QUERY_CONVERSION_QUICK_REFERENCE.md READY_TO_TEST.md RESOLUTION_*.md SERVER_MIGRATION_SUMMARY.md SETUP_*.md SHARED_HOSTING_FIX.md START_HERE.txt SUPABASE_TO_MYSQL_MIGRATION_GUIDE.md WEBSOCKET_*.md WHAT_*.md README_OPTIMIZATION.md; do
    [ -f "$doc" ] && echo "   - $doc" && doc_count=$((doc_count + 1))
done

# Routes documentation
for doc in routes/FLEET_*.md routes/ANALYTICS_*.md routes/DEFECTS_*.md; do
    [ -f "$doc" ] && echo "   - $doc" && doc_count=$((doc_count + 1))
done

echo "   Total: $doc_count files"
total_count=$((total_count + doc_count))
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total files to delete: $total_count"
echo ""
echo "✅ Files that WILL BE KEPT:"
echo "   - server.js"
echo "   - package.json, package-lock.json"
echo "   - .env"
echo "   - Passengerfile.json"
echo "   - passenger_wsgi.py"
echo "   - start-server.sh"
echo "   - API_DOCUMENTATION.md"
echo "   - render.yaml"
echo "   - routes/ (13 active routes)"
echo "   - services/ (3 active services)"
echo "   - middleware/ (2 active files)"
echo "   - migrations/ (all 18 migrations)"
echo "   - config/"
echo "   - data/"
echo "   - utils/"
echo "   - node_modules/"
echo "   - tmp/"
echo ""
echo "Current root directory file count:"
ls -1 | wc -l
echo ""
echo "Expected root directory file count after cleanup: ~15"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This was a DRY RUN - no files were deleted"
echo ""
echo "To actually clean up, run:"
echo "  ./cpanel-cleanup.sh"
echo ""
