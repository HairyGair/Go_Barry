# Breakdown Guide Integration - Continuation Prompt

## Current Status (as of previous chat):
- ✅ Project structure created in `/Users/anthony/Go BARRY App/BreakdownGuideapp/`
- ✅ All files transferred from BreakdownGuideFrontendComplete:
  - 33 assessment wizards
  - Core supervisorBreakdownLogger.js
  - All components (Mobile, PWA, Camera, Real-time)
  - 4 dashboards (HTML format)
  - Supporting files (fleet DB, SQL schemas, PWA files)
- ✅ Vite aliases configured
- ✅ Router wired up in App.jsx for lazy loading
- ✅ Directory structure created in src/breakdown-guide

## What Was Being Done:
We were in the middle of the integration phase, specifically:
1. Configuring Vite aliases ✅ COMPLETE
2. Wiring up the router ✅ COMPLETE
3. Creating directory structure ✅ COMPLETE
4. Ready to fix import paths in transferred files ⏳ NEXT

## Files That Need To Be Moved:
The user needs to copy these files from BreakdownGuideFrontendComplete/breakdown-guide/ to the new location:

### To: `frontend/src/breakdown-guide/`
- App.js
- supervisorBreakdownLogger.js
- All other JS files in root of breakdown-guide

### To: `frontend/src/breakdown-guide/components/`
- All component files (CameraCapture.js, FleetSelectionModal.js, etc.)

### To: `frontend/src/breakdown-guide/components/wizards/`
- All 33 wizard files

### To: `frontend/src/breakdown-guide/components/common/`
- All common component files

### To: `frontend/src/breakdown-guide/data/`
- All diagnostic-flows-*.js files

### To: `frontend/src/breakdown-guide/services/`
- fleetDatabase.js

## Next Steps After File Transfer:
1. Fix import paths in App.js
2. Fix import paths in supervisorBreakdownLogger.js
3. Update API endpoints to use environment variables
4. Test one wizard end-to-end
5. Fix remaining import paths
6. Convert dashboards to React components

## Key Technical Details:
- Using Vite with React
- Aliases configured: @, @components, @breakdown-guide, @services, @data
- API URL: https://breakdown-guide.onrender.com
- Supabase project: oieliubbvvdzhzvikzal
- Production URL: https://breakdowns.gobarry.co.uk

## Current Working Directory:
`/Users/anthony/Go BARRY App/BreakdownGuideapp/`

## Documentation Files:
- BUILD_PROMPT.md - Master reference (keep updated!)
- INTEGRATION_GUIDE.md - Step-by-step integration instructions
- MIGRATION_CHECKLIST.md - Shows all files transferred
- API_CHECKLIST.md - Backend endpoints needed

## Priority:
Get the Breakdown Guide working first, then dashboards, then advanced features.

---
**Instructions for next assistant**: Continue helping with the integration phase, starting with fixing import paths after the user confirms they've moved the files to the correct locations.
