# 🚨 CRITICAL: GTFS Backend Deployment Required

**Status:** Production backend still has BROKEN code
**Deadline:** IMMEDIATE - Users cannot upload GTFS files
**Severity:** CRITICAL - Feature is non-functional

---

## Problem Summary

The GTFS upload feature is broken because:

1. ❌ **Production server has OLD code** without spread operator fix
2. ❌ **Middleware chain is broken** - `authenticateAdmin` not being applied
3. ❌ **File uploads fail** with "Unexpected field" error
4. ❌ **Stats endpoint crashes** trying to read undefined properties

### Evidence from PM2 Logs

```
Error: Unexpected field MulterError: Unexpected field
Error fetching GTFS stats: TypeError: Cannot read properties of undefined (reading 'count')
```

---

## Solution: Deploy Fixed Code

The fix is ready locally in: `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/routes/adminGTFS.js`

### What Was Fixed

**Line 111 - Changed from:**
```javascript
// ❌ BROKEN - Middleware array not spread
router.post('/routes', authenticateAdmin, upload.single('csvFile'), async (req, res) => {
```

**To:**
```javascript
// ✅ FIXED - Middleware array properly spread
router.post('/routes', ...authenticateAdmin, upload.single('csvFile'), async (req, res) => {
```

This fix is applied to all 5 GTFS routes:
- POST /api/admin/gtfs/routes
- POST /api/admin/gtfs/stops
- POST /api/admin/gtfs/trips
- POST /api/admin/gtfs/stop-times
- GET /api/admin/gtfs/stats

---

## Manual Deployment Steps

Since SSH keys aren't authorized for the server, use **CyberDuck** (SFTP):

### Step 1: Open CyberDuck
```
Download from: https://cyberduck.io
Connect to: sftp://85.234.151.224
Username: gobarryco
Password: [use cPanel password]
```

### Step 2: Navigate to Backend Directory
```
/home/gobarryco/api/routes/
```

### Step 3: Upload Fixed File

1. Open local file:
   ```
   /Users/anthony/Go BARRY App/BreakdownGuideapp/backend/routes/adminGTFS.js
   ```

2. Drag and drop into CyberDuck at `/home/gobarryco/api/routes/`

3. Wait for upload to complete

### Step 4: Verify Upload

1. Download the file back from server to verify it was updated
2. Check line 111 contains: `router.post('/routes', ...authenticateAdmin, upload.single('csvFile'),`

### Step 5: Restart Backend

Via cPanel Terminal or SSH:
```bash
ssh gobarryco@85.234.151.224
cd ~/api
pm2 restart breakdown-backend
sleep 10
```

### Step 6: Verify Deployment

```bash
curl -s https://api.breakdowns.gobarry.co.uk/api/admin/gtfs/stats -H "Authorization: Bearer test" | jq .
```

Expected response:
```json
{
  "success": true,
  "stats": {
    "routes": 0,
    "stops": 0,
    "trips": 0,
    "stop_times": 0
  }
}
```

If you see `"success": true`, the deployment was successful! ✅

---

## Alternative: Deploy Both Frontend & Backend

After deploying the backend fix, also deploy the frontend with the correct field name:

### Frontend Build

```bash
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend"
npm run build
```

### Frontend Upload (via cPanel)

1. Delete all files from: `~/public_html/breakdowns.gobarry.co.uk/`
2. Upload all files from: `./frontend/dist/`

---

## Testing After Deployment

### Test 1: Check GTFS Stats (No Auth Required)
```bash
curl -s https://api.breakdowns.gobarry.co.uk/api/admin/gtfs/stats | jq .
```

Should return:
```json
{
  "success": true,
  "stats": {...}
}
```

### Test 2: Upload a Routes File

Use the frontend at: https://breakdowns.gobarry.co.uk/admin-settings

1. Click "🗺️ GTFS Data" tab
2. Select "Routes" sub-tab
3. Upload sample routes.txt file
4. Should see success message

### Test 3: Check PM2 Logs

```bash
ssh gobarryco@85.234.151.224
pm2 logs breakdown-backend --lines 50
```

Should show: `✅ GTFS Routes import request received`

---

## Files Ready for Deployment

### Backend File (READY)
- ✅ `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/routes/adminGTFS.js` (has spread operator fix)
- Upload to: `/home/gobarryco/api/routes/adminGTFS.js`

### Frontend Build (NEEDS BUILD)
- Run: `npm run build` in frontend directory
- Upload dist/ to: `~/public_html/breakdowns.gobarry.co.uk/`

---

## Git Commits

**Backend Fix:**
- Commit: `060f6adb`
- Message: `fix: Add spread operator to authenticateAdmin middleware array on GTFS routes`

**Frontend Fix:**
- Commit: `c6bd3ff3`
- Message: `fix: Correct FormData field name from gtfsFile to csvFile`

---

## Next Actions

1. ✅ **Use CyberDuck** to upload fixed adminGTFS.js
2. ✅ **Restart PM2** on production
3. ✅ **Verify** stats endpoint returns 200
4. ✅ **Test upload** from frontend
5. ✅ **Deploy frontend** if backend verification successful

**After these steps, the GTFS feature will be fully functional!**

