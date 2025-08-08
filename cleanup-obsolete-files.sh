#!/bin/bash

# Go BARRY Obsolete Files Cleanup Script
# This script safely removes duplicate, backup, and obsolete files
# Created: 2025-08-08
# Run from: /Users/anthony/Go BARRY App/

set -e  # Exit on any error

echo "🧹 Go BARRY Obsolete Files Cleanup"
echo "================================="
echo

# Track what we're doing
DELETED_COUNT=0
SKIPPED_COUNT=0

# Function to safely delete file
safe_delete() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "🗑️  Deleting: $file"
        rm "$file"
        ((DELETED_COUNT++))
    else
        echo "⚠️  Skipped (not found): $file"
        ((SKIPPED_COUNT++))
    fi
}

# Function to safely delete directory
safe_delete_dir() {
    local dir="$1"
    if [ -d "$dir" ]; then
        echo "🗑️  Deleting directory: $dir"
        rm -rf "$dir"
        ((DELETED_COUNT++))
    else
        echo "⚠️  Skipped directory (not found): $dir"
        ((SKIPPED_COUNT++))
    fi
}

echo "1. Removing backup files with timestamps..."
echo "----------------------------------------"

# Backend route backups (97 files total)
find backend/routes/ -name "*.backup-*" -type f -delete 2>/dev/null || true
echo "✅ Removed timestamped backup files in backend/routes/"

# Service backups
safe_delete "backend/services/unifiedRoadworksManager.js.backup"
safe_delete "backend/services/Oops.rej.backup"

# Frontend backups
safe_delete "Go_BARRY/setupProxy.js.backup"

# Other backups
safe_delete "backend/routes/bodsAPI-error.js.bak"
safe_delete "backend/routes/roadworksDebugGeocoding.js.bak"

echo
echo "2. Removing duplicate password setup scripts..."
echo "---------------------------------------------"

safe_delete "setup-anthony-password.cjs"
safe_delete "fix-password.cjs"
safe_delete "quick-password-fix.js"
safe_delete "setup-password.js"

echo
echo "3. Removing obsolete RoadworksManager components..."
echo "------------------------------------------------"

safe_delete "Go_BARRY/components/RoadworksManagerOptimized.jsx"
safe_delete "Go_BARRY/components/RoadworksManagerDashboardEnhanced.js"

echo
echo "4. Checking coordinate service enhancements..."
echo "--------------------------------------------"

# Note: coordinateServiceEnhancements.js is imported by coordinateService.js
# We should merge the enhancements into the main service rather than delete
echo "ℹ️  Skipping coordinateServiceEnhancements.js - actively imported by coordinateService.js"
echo "   Consider merging enhancements into main service in future refactor"
((SKIPPED_COUNT++))

echo
echo "5. Removing test and development files..."
echo "---------------------------------------"

safe_delete "test-shift.mjs"
safe_delete "Go_BARRY/app/test-simple.jsx"
safe_delete "Go_BARRY/components/tests/testOfflineCache.js"

# Remove test files in backend (careful not to remove legitimate test directories)
find backend/ -name "test-*.js" -maxdepth 1 -type f -delete 2>/dev/null || true
echo "✅ Removed test-*.js files in backend root"

echo
echo "6. Removing superseded 'fixed' versions..."
echo "----------------------------------------"

safe_delete "backend/index-fixed.js"
safe_delete "backend/services/tomtom-fixed.js"
safe_delete "backend/services/supervisorManagerFixed.js"
safe_delete "backend/services/unifiedRoadworksManagerFixed.js"

echo
echo "7. Removing obsolete enhanced experimental files..."
echo "------------------------------------------------"

safe_delete "backend/enhanced-gtfs-route-matcher.js"
safe_delete "backend/enhanced-route-matcher.js"
safe_delete "backend/enhanced-tomtom-processor.js"

echo
echo "8. Removing other obsolete files..."
echo "--------------------------------"

# Various deployment and fix scripts that are no longer needed
safe_delete "fetchRoadworks-fix.js"
safe_delete "roadworks-fetch-fix.js"
safe_delete "roadworks-fetch-better-fix.js"
safe_delete "roadworks-fetch-diagnostic.js"

# Old coordinate testing scripts
safe_delete "test-coordinate-service.sh"
safe_delete "test-coordinate-enhancements.sh"
safe_delete "test-coordinate-caching.sh"

echo
echo "9. Summary"
echo "========="
echo "✅ Files deleted: $DELETED_COUNT"
echo "⚠️  Files skipped: $SKIPPED_COUNT"
echo
echo "🎉 Cleanup complete! The codebase is now cleaner and more maintainable."
echo
echo "Next steps:"
echo "- Run 'git status' to review changes"
echo "- Run tests to ensure nothing is broken"
echo "- Commit the cleanup: git add -A && git commit -m 'cleanup: Remove duplicate and obsolete files'"
echo