# Smart Route Matching - Files to Deploy

## Quick Reference

**Date:** November 10, 2025
**Total Files to Upload:** 2 locations

---

## Backend Files (Upload via SFTP)

### Destination: `~/api/routes/`

**File:** `breakdowns.js`
- **Size:** ~50KB
- **Location on Local Machine:** `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/routes/breakdowns.js`
- **Action:** REPLACE existing file
- **Changes:** Added smart-route-match endpoint (lines 1412-1527)

**Note:** This is the ONLY backend file that changed. The supporting services and middleware didn't require modifications.

---

## Frontend Files (Upload via CyberDuck or cPanel File Manager)

### Destination: `/home/yourusername/public_html/breakdowns.gobarry.co.uk/`

**All files from:** `/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend/dist/`

**Process:**
1. Delete ALL existing files in the web directory
2. Upload entire `dist/` folder contents
3. Ensure `index.html` is at the root

**Key files included:**
- `index.html` - Main entry point
- `assets/` folder - JavaScript, CSS, and images
- All static assets (logos, markers, etc.)

**Total Size:** ~4.5MB

---

## Modified Files Summary

### Backend
```
backend/routes/breakdowns.js
├── Line 1412: router.post('/smart-route-match', ...)
├── Geospatial query for GTFS stops
└── Response with affected routes
```

### Frontend
```
frontend/src/breakdown-guide/components/FleetSelectionModal.jsx
├── Smart suggestions state
├── fetchSmartSuggestions() function
├── UI for displaying suggestions
└── Integration with location handlers

frontend/src/services/breakdownDataService.js
├── getSmartRouteSuggestions() method
└── API call to backend endpoint
```

### Documentation
```
CLAUDE.md
├── Updated version to 3.4.0
├── Added smart route matching documentation
└── Deployment instructions

DEPLOYMENT_SMART_ROUTE_MATCHING.md (new)
└── Step-by-step deployment guide
```

---

## Git Commit Reference

**Commit Hash:** `2c526330`
**Message:** `feat: Implement smart route matching feature using GTFS geospatial data`

**All changes staged and committed. Ready to deploy.**

---

## Pre-Deployment Checklist

Before uploading files:

- [ ] Frontend build completed successfully
- [ ] No errors in build output
- [ ] All git changes committed
- [ ] Database has GTFS tables populated
- [ ] PM2 service running and healthy

---

## Post-Deployment Verification

After uploading files:

- [ ] Backend endpoint responds (test with curl)
- [ ] Frontend loads at breakdowns.gobarry.co.uk
- [ ] Smart suggestions appear when location entered
- [ ] Can select suggested routes
- [ ] No JavaScript errors in browser console
- [ ] PM2 process healthy (no errors in logs)

---

## File Sizes

```
breakdowns.js (backend)         ~50 KB
frontend/dist/ (all files)     ~4.5 MB
  - index.html                  ~1.1 KB
  - assets/vendor-*.js          ~329 KB
  - assets/index-*.js           ~3.4 MB
  - assets/index-*.css          ~343 KB
  - Public assets (logos, etc)  ~500 KB
```

---

## Network Considerations

- **Upload speed at 1 MB/s:** ~4-5 seconds for frontend
- **PM2 restart time:** ~5 seconds
- **Browser cache:** Hard refresh (Cmd+Shift+R) may be needed

---

## Database Verification Command

Test before deployment to ensure GTFS tables exist:

```bash
mysql -h 85.234.151.224 -u gobarryco_Gair -p gobarryco_breakdown

# Check GTFS tables
SHOW TABLES LIKE 'gtfs_%';

# Expected output:
# gtfs_import_log
# gtfs_routes
# gtfs_stop_times
# gtfs_stops
# gtfs_trips
```

If tables don't exist, use the GTFS admin endpoints to import data first.

---

## Need Help?

Detailed deployment steps: See `DEPLOYMENT_SMART_ROUTE_MATCHING.md`
Feature documentation: See `CLAUDE.md` (Smart Route Matching Feature section)
API specification: See `CLAUDE.md` (Backend Endpoint section)

---

**Generated:** November 10, 2025
**Ready for Production:** ✅ YES
