# Frontend Deployment - GTFS Feature

**Status:** ✅ Built and Ready for Deployment
**Build Time:** Nov 10, 2025
**Build Size:** 3.8 MB total (assets optimized)
**Files Location:** `/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend/dist/`

---

## Build Summary

Frontend was successfully built with the GTFS feature and correct field name:

✅ 229 modules transformed
✅ Assets generated (CSS: 343KB, JS: 3.4GB)
✅ Index page ready: `dist/index.html`
✅ All components built with correct API integration

### Key Files Built

```
frontend/dist/
├── index.html (main entry point)
├── assets/
│   ├── index-Du7-ymEQ.css (main styles)
│   ├── index-CoXv824o.js (main app bundle)
│   ├── vendor-CyOBpIAc.js (dependencies)
│   └── [other asset files]
└── [static assets]
```

---

## What's Included in This Build

### ✅ GTFS Admin Settings Page
- **Component:** AdminGTFSSettings.jsx
- **Features:**
  - 4 file type tabs: Routes, Stops, Trips, Stop Times
  - Drag-and-drop upload with progress
  - Real-time statistics display
  - Error handling and user feedback
  - **FIXED:** FormData sends `csvFile` field (was `gtfsFile`)

### ✅ Authentication System
- Premium login page with glassmorphism design
- Duty selection modal (4 shift options)
- JWT token handling
- Session management

### ✅ All Other Features
- Breakdown management
- Activity feed with real-time updates
- Analytics dashboard
- Settings page

---

## Deployment Instructions

### Option A: Using CyberDuck (Recommended)

**Step 1: Open CyberDuck**
```
Download: https://cyberduck.io
```

**Step 2: Connect to cPanel**
```
Protocol: SFTP
Server: 85.234.151.224
Username: gobarryco
Password: [cPanel password]
Port: 22
```

**Step 3: Navigate to Web Root**
```
/home/gobarryco/public_html/breakdowns.gobarry.co.uk/
```

**Step 4: Delete Old Files**
- Select ALL files in the directory
- Press Delete to remove old build
- Empty trash

**Step 5: Upload New Build**
1. Open Finder: `/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend/dist/`
2. Select ALL files in dist/
3. Drag and drop into CyberDuck window
4. Wait for upload to complete (status shows "Done")

**Step 6: Verify Upload**
1. Visit: https://breakdowns.gobarry.co.uk
2. Should load the new build
3. Page should display correctly (no 404 errors)

---

### Option B: Using cPanel File Manager

**Step 1: Login to cPanel**
```
https://85.234.151.224:2083
Username: gobarryco
Password: [password]
```

**Step 2: Open File Manager**
- Click "File Manager"
- Navigate to: `/public_html/breakdowns.gobarry.co.uk/`

**Step 3: Delete Old Files**
- Select all files (Ctrl+A)
- Click "Delete"
- Confirm deletion

**Step 4: Upload New Build**
- Click "Upload"
- From `/frontend/dist/`, select all files
- Upload to the directory

**Step 5: Verify**
- Visit: https://breakdowns.gobarry.co.uk
- Should display new UI

---

### Option C: Command Line (If SSH Access Available)

```bash
# Remove old build
rm -rf ~/public_html/breakdowns.gobarry.co.uk/*

# Copy new build
cp -r "/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend/dist"/* \
      ~/public_html/breakdowns.gobarry.co.uk/

# Set permissions
chmod -R 755 ~/public_html/breakdowns.gobarry.co.uk/
```

---

## Post-Deployment Verification

### Test 1: Frontend Loads
```
URL: https://breakdowns.gobarry.co.uk
Expected: Login page with purple gradient background
```

### Test 2: GTFS Settings Tab Visible
1. Login with any email and password: `GoNorthEast2025!`
2. Click settings (gear icon)
3. Should see "🗺️ GTFS Data" tab
4. Should be able to see all 4 sub-tabs

### Test 3: Upload Form Works
1. Click GTFS Data tab
2. Select "Routes" sub-tab
3. Should see file upload area
4. Should be able to drag files over it

### Test 4: API Connection
Open browser console (F12):
```javascript
// Should show connection to backend
console.log('GTFS component mounted');
```

---

## Troubleshooting

### Issue: Page shows 404
**Solution:**
- Clear browser cache (Cmd+Shift+R)
- Verify files uploaded to correct directory
- Check file permissions (should be 755)

### Issue: Styles look broken
**Solution:**
- Files in `assets/` must be present
- CSS file path should be `assets/index-*.css`
- Check browser console for missing asset errors

### Issue: GTFS tab doesn't appear
**Solution:**
- Rebuild frontend: `npm run build`
- Clear browser cache
- Check AdminSettings.jsx includes GTFS tab

### Issue: Upload buttons don't work
**Solution:**
- Backend must be deployed first with spread operator fix
- Check browser console for API errors
- Verify API URL in .env matches production URL

---

## Files in This Build

### Main Files
- `index.html` - Entry point
- `assets/vendor-CyOBpIAc.js` - Dependencies
- `assets/index-CoXv824o.js` - Application code
- `assets/index-Du7-ymEQ.css` - Styles

### Static Assets
All images, fonts, and other static files needed for the app

---

## Build Configuration

**Framework:** React + Vite
**Build Command:** `npm run build`
**Output:** Optimized production bundle
**Bundle Size:** ~3.8MB (reasonable for enterprise app)
**Optimization:** Minified and gzip-ready

---

## After Frontend Deployment

Once frontend is deployed:

1. ✅ Login page should display
2. ✅ Settings should show GTFS tab
3. ✅ But uploads won't work until backend is also deployed with spread operator fix

**Next Step:** Deploy backend adminGTFS.js with spread operator fix
- See: `DEPLOY_GTFS_NOW.md`

---

## Rollback Instructions

If deployment causes issues:

```bash
# Restore previous build from backup
# Contact Anthony Gair for backup restoration
```

---

**Status:** Ready to deploy
**Next:** Deploy backend, then test uploads
**Timeline:** 15 minutes for frontend deployment + 5 minutes verification

