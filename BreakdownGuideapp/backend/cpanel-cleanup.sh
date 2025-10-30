#!/bin/bash
# cPanel Backend Cleanup Script
# Matches the local cleanup we just performed
# Run this via SSH on the cPanel server

echo "🧹 cPanel Backend Cleanup Script"
echo "================================="
echo ""
echo "⚠️  WARNING: This will delete 100+ legacy files from production"
echo "⚠️  Make sure you have a backup before proceeding!"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cleanup cancelled"
    exit 1
fi

echo ""
echo "📦 Step 1: Creating backup..."
cd ~/api
tar --exclude='node_modules' -czf ~/cpanel_backend_backup_$(date +%Y%m%d_%H%M%S).tar.gz .
echo "✅ Backup created in ~/"

echo ""
echo "🗑️  Step 2: Deleting backup files..."
# Delete all .backup files
find . -maxdepth 1 -name "*.backup" -type f -delete 2>/dev/null
find . -maxdepth 1 -name "*.backup-*" -type f -delete 2>/dev/null
find routes/ -name "*.backup*" -type f -delete 2>/dev/null
find middleware/ -name "*.backup*" -type f -delete 2>/dev/null
echo "✅ Backup files deleted"

echo ""
echo "🗑️  Step 3: Deleting test files..."
rm -f routes/test-defects.js
echo "✅ Test files deleted"

echo ""
echo "🗑️  Step 4: Deleting old archive..."
rm -f gobarry-backend.zip
echo "✅ Old archive deleted"

echo ""
echo "🗑️  Step 5: Deleting legacy scripts..."
rm -f cpanel-*.sh
rm -f deploy-*.sh
rm -f upload-*.sh
rm -f quick-test.sh
rm -f check-node-versions.sh
rm -f create-deployment-zip.sh
rm -f prepare-cpanel-deployment.sh
rm -f quick-deploy-cpanel.sh
rm -f diagnose-cpanel-deployment.sh
rm -f keep-alive.sh
echo "✅ Legacy scripts deleted"

echo ""
echo "🗑️  Step 6: Deleting legacy utility files..."
rm -f add-diagnostic-route.js
rm -f diagnostic-endpoint.js
rm -f REQUIRED_ENDPOINTS.js
rm -f app.js
rm -f run-migration.js
rm -f setup-passwords.sql
echo "✅ Legacy utility files deleted"

echo ""
echo "🗑️  Step 7: Deleting orphaned files..."
rm -f auth.js  # Should only be in routes/
echo "✅ Orphaned files deleted"

echo ""
echo "🗑️  Step 8: Deleting temporary/log files..."
rm -f nohup.out
rm -f stderr.log
rm -f keep-alive.log
echo "✅ Temporary files deleted"

echo ""
echo "🗑️  Step 9: Deleting old SQL files..."
rm -f RUN_ALL_MIGRATIONS.sql
rm -f RUN_ALL_MIGRATIONS_MYSQL_COMPATIBLE.sql
rm -f CREATE_MISSING_TABLES_ONLY.sql
rm -f CREATE_TABLES_NO_FK.sql
echo "✅ Old SQL files deleted"

echo ""
echo "🗑️  Step 10: Deleting legacy documentation..."

# Migration docs
rm -f *_MIGRATION_*.md
rm -f MIGRATION_*.md

# Deployment docs
rm -f DEPLOYMENT_*.md
rm -f DEPLOY_*.md

# cPanel docs
rm -f CPANEL_*.md
rm -f CPANEL_*.txt

# Quick guides
rm -f QUICK_*.md

# Other legacy docs
rm -f ADDITIONAL_*.md
rm -f ALTERNATIVE_*.md
rm -f API_DOCUMENTATION_INDEX.md
rm -f API_EXPLORATION_SUMMARY.md
rm -f API_WEBSOCKET_ANALYSIS.md
rm -f AUTH_QUICKSTART.md
rm -f CONTACT_HOST_REQUEST.md
rm -f CYBERDUCK_*.md
rm -f EMAIL_TO_PIXELISH.txt
rm -f HOST_RESTART_REQUEST.md
rm -f IMPLEMENTATION_CHECKLIST.md
rm -f OPTIMIZATION_*.md
rm -f PIXELISH_SUPPORT_TICKET.md
rm -f PRODUCTION_SUCCESS.md
rm -f PUBLIC_ROUTES_MYSQL_MIGRATION.md
rm -f QUERY_CONVERSION_QUICK_REFERENCE.md
rm -f READY_TO_TEST.md
rm -f RESOLUTION_*.md
rm -f SERVER_MIGRATION_SUMMARY.md
rm -f SETUP_*.md
rm -f SHARED_HOSTING_FIX.md
rm -f START_HERE.txt
rm -f SUPABASE_TO_MYSQL_MIGRATION_GUIDE.md
rm -f WEBSOCKET_*.md
rm -f WHAT_*.md
rm -f README_OPTIMIZATION.md

# Routes documentation
rm -f routes/FLEET_*.md
rm -f routes/ANALYTICS_*.md
rm -f routes/DEFECTS_*.md

echo "✅ Legacy documentation deleted"

echo ""
echo "📊 Cleanup Summary"
echo "=================="
echo ""
echo "Root directory files:"
ls -1 | wc -l
echo ""
echo "Essential files kept:"
echo "✅ server.js"
echo "✅ package.json"
echo "✅ .env"
echo "✅ Passengerfile.json"
echo "✅ passenger_wsgi.py"
echo "✅ start-server.sh"
echo "✅ API_DOCUMENTATION.md (active)"
echo "✅ render.yaml"
echo "✅ routes/ (13 active routes)"
echo "✅ services/ (3 active services)"
echo "✅ middleware/ (2 active files)"
echo "✅ migrations/ (all migrations)"
echo "✅ config/ (database config)"
echo "✅ data/ (application data)"
echo "✅ utils/ (utility functions)"
echo ""
echo "🎉 Cleanup complete!"
echo ""
echo "⚠️  Next steps:"
echo "1. Restart the application: pm2 restart breakdown-backend"
echo "2. Test the API endpoints"
echo "3. Monitor logs for any issues"
echo "4. If everything works, the backup can be deleted later"
echo ""
echo "💾 Backup location: ~/cpanel_backend_backup_*.tar.gz"
