#!/bin/bash

# Cleanup redundant MD files
# Keep only essential documentation

echo "🧹 Cleaning up redundant MD files..."

# Delete old fix summaries and guides from frontend
rm -f frontend/ACTIVITY_FEED_AND_AUTH_FIX.md
rm -f frontend/ACTIVITY_FEED_FIX.md
rm -f frontend/AUTH_CONTEXT_USAGE_GUIDE.md
rm -f frontend/AUTHENTICATION_FIX.md
rm -f frontend/AUTHENTICATION_GUIDE.md
rm -f frontend/ENABLE_AUTH_QUICK.md
rm -f frontend/ENGINEERING_DASHBOARD_FIX.md
rm -f frontend/ENGINEERING_THEME_COMPLETE.md
rm -f frontend/ENHANCED_LOGIN_INTEGRATION.md
rm -f frontend/FULLWIDTH_UPDATE_COMPLETE.md
rm -f frontend/GOOGLE_MAPS_SETUP_GUIDE.md
rm -f frontend/INTEGRATION_SPECIFICATIONS.md
rm -f frontend/ISSUE_FIXES_COMPLETE.md
rm -f frontend/LOGIN_FIX_APPLIED.md
rm -f frontend/LOGIN_FIX_SUMMARY.md
rm -f frontend/REAL_DATA_IMPLEMENTATION.md
rm -f frontend/ROUTING_INTEGRATION_GUIDE.md
rm -f frontend/SUPABASE_SETUP_INSTRUCTIONS.md
rm -f frontend/TESTING_INTEGRATION_GUIDE.md
rm -f frontend/UI_UX_DESIGN_GUIDE.md
rm -f frontend/WELCOME_BANNER_FIX.md
rm -f frontend/BUILD_AND_DEPLOY.md

# Delete wizard-specific docs from src
rm -f frontend/src/breakdown-guide/components/wizards/BATTERY_WIZARD_UPDATE_SUMMARY.md
rm -f frontend/src/breakdown-guide/styles/FULLWIDTH_CHANGES.md
rm -f frontend/src/dashboards/engineering/QUICK_THEME_UPDATE.md
rm -f frontend/src/dashboards/engineering/THEME_UPDATE_COMPLETE.md
rm -f frontend/src/dashboards/engineering/VISUAL_THEME_GUIDE.md
rm -f frontend/src/dashboards/STYLE_GUIDE.md
rm -f frontend/src/services/STORAGE_SERVICE_README.md
rm -f frontend/src/styles/ENGINEERING_THEME_UPDATE.md
rm -f frontend/src/styles/IMPLEMENTATION_SUMMARY.md
rm -f frontend/src/styles/MIGRATION_CHECKLIST.md
rm -f frontend/src/styles/THEME_GUIDE.md
rm -f frontend/src/tests/ManualTestingChecklist.md
rm -f frontend/src/tests/SDCDashboardTesting.md
rm -f frontend/.temp-trash/LOCATION_PREPOPULATION_TEST.md

# Delete root-level redundant files
rm -f API_ENDPOINTS_INTEGRATION.md
rm -f SUPABASE_DATABASE_STATUS.md
rm -f SUPERVISOR_LOGIN_SETUP.md

echo "✅ Cleanup complete!"
echo ""
echo "📁 Remaining essential documentation:"
echo "  - README.md (main project overview)"
echo "  - ARCHITECTURE.md (system design)"
echo "  - API_REFERENCE.md (complete API docs)"
echo "  - SETUP_AUTH_INSTRUCTIONS.md (auth setup guide)"
echo "  - SUPERVISOR_PASSWORD_RESET_SUMMARY.md (recent important info)"
echo "  - backend/API_DOCUMENTATION.md (backend-specific docs)"
echo "  - frontend/README.md (frontend-specific docs)"
echo "  - docs/ (additional documentation)"
