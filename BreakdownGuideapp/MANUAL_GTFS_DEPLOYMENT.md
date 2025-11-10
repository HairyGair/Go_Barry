# Manual GTFS Backend Deployment Guide

**Status:** Backend code ready, needs to be deployed to production

---

## Quick Deploy (5 minutes)

### Step 1: Copy Backend Files

You need to upload 2 files to your production server:

**File 1: adminGTFS.js**
- **Local:** `/backend/routes/adminGTFS.js`
- **Remote:** `/home/gobarryco/api/routes/adminGTFS.js`

**File 2: server.js**
- **Local:** `/backend/server.js`
- **Remote:** `/home/gobarryco/api/server.js`

### Option A: Using CyberDuck (GUI - Easiest)

1. Open CyberDuck
2. Connect to your server (FTP or SFTP)
3. Navigate to `/home/gobarryco/api/`
4. Drag and drop:
   - `backend/routes/adminGTFS.js` → `api/routes/` folder
   - `backend/server.js` → `api/` folder (overwrite existing)

### Option B: Using SCP (Command Line)

```bash
# Upload adminGTFS.js
scp backend/routes/adminGTFS.js gobarryco@85.234.151.224:/home/gobarryco/api/routes/

# Upload server.js
scp backend/server.js gobarryco@85.234.151.224:/home/gobarryco/api/
```

### Option C: Using SFTP Client (Filezilla, WinSCP)

1. Connect to: `85.234.151.224` (SFTP)
2. Username: `gobarryco`
3. Navigate to `/home/gobarryco/api/`
4. Upload both files

---

## Step 2: Restart Backend

### Via SSH (Fastest)

```bash
# SSH to server
ssh gobarryco@85.234.151.224

# Restart PM2
cd /home/gobarryco/api
pm2 restart breakdown-backend

# Check status
pm2 status

# Exit
exit
```

### Via cPanel Terminal (If SSH unavailable)

1. Login to cPanel
2. Go to Terminal (if available)
3. Run: `pm2 restart breakdown-backend`

### If PM2 Not Available

```bash
# Kill old process
pkill -f "node.*server.js"

# Start new process
cd /home/gobarryco/api
nohup node server.js > api.log 2>&1 &
```

---

## Step 3: Verify Deployment

Wait 10 seconds, then test:

```bash
curl https://api.breakdowns.gobarry.co.uk/api/admin/gtfs/stats
```

### Success Response:
```json
{
  "success": true,
  "stats": {
    "routes": 0,
    "stops": 0,
    "trips": 0,
    "stopTimes": 0,
    "routesLastUpdated": null,
    "stopsLastUpdated": null,
    "tripsLastUpdated": null,
    "stopTimesLastUpdated": null
  },
  "message": "GTFS data statistics"
}
```

### Error Response (404 - Backend not redeployed yet):
```json
{
  "success": false,
  "error": "Route not found: GET /api/admin/gtfs/stats"
}
```

If you get the error response, wait 30 seconds and try again (backend may still be restarting).

---

## Step 4: Test Frontend

1. Go to: https://breakdowns.gobarry.co.uk
2. Login with email and password: `GoNorthEast2025!`
3. Go to: Settings → Admin Controls
4. Click: "🗺️ GTFS Data" tab
5. Try uploading a routes.txt file

You should see the upload progress bar and success message.

---

## Troubleshooting

### Problem: Still getting "Route not found" error

**Solution 1:** Wait longer
- Backend may take 30-60 seconds to restart
- Wait and try again

**Solution 2:** Verify files were uploaded
- SSH to server and check:
  ```bash
  ls -la /home/gobarryco/api/routes/adminGTFS.js
  ls -la /home/gobarryco/api/server.js
  ```
- If files don't exist, they weren't uploaded correctly

**Solution 3:** Check backend logs
```bash
ssh gobarryco@85.234.151.224
pm2 logs breakdown-backend --lines 50
```

Look for errors starting with "Error:" or "❌"

### Problem: Backend won't restart

**Possible causes:**
1. Syntax error in adminGTFS.js
2. Incorrect server.js update
3. Missing dependencies (multer, csv-parse)

**Check:**
```bash
ssh gobarryco@85.234.151.224
cd /home/gobarryco/api
pm2 logs breakdown-backend
```

### Problem: Upload button doesn't appear

**Possible causes:**
1. Frontend not deployed yet
2. Browser cache (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
3. Still showing old frontend code

**Solution:**
1. Deploy frontend first: `npm run build` then upload `/frontend/dist/` to cPanel
2. Hard refresh browser
3. Check browser console for errors (F12)

---

## Files to Deploy

**These 2 files MUST be on the production server:**

```
/home/gobarryco/api/routes/adminGTFS.js (NEW)
/home/gobarryco/api/server.js (UPDATED)
```

**DO NOT UPLOAD:**
- `backend/migrations/009_create_gtfs_tables.sql` (already applied ✅)
- `package.json` (no new dependencies)
- Database files

---

## Verification Checklist

- [ ] Uploaded `routes/adminGTFS.js` to production
- [ ] Uploaded `server.js` to production
- [ ] Restarted PM2 (or backend process)
- [ ] Waited 10+ seconds for restart
- [ ] Tested endpoint: `curl https://api.breakdowns.gobarry.co.uk/api/admin/gtfs/stats`
- [ ] Got success response (not 404)
- [ ] Frontend deployed
- [ ] Can see GTFS tab in Admin Settings
- [ ] Can upload routes.txt file

---

## Quick Reference

| Step | Command | Expected Result |
|------|---------|-----------------|
| Upload adminGTFS.js | `scp backend/routes/adminGTFS.js gobarryco@85.234.151.224:/home/gobarryco/api/routes/` | File uploaded |
| Upload server.js | `scp backend/server.js gobarryco@85.234.151.224:/home/gobarryco/api/` | File uploaded |
| Restart backend | `ssh gobarryco@85.234.151.224 'pm2 restart breakdown-backend'` | Backend restarted |
| Test endpoint | `curl https://api.breakdowns.gobarry.co.uk/api/admin/gtfs/stats` | `"success":true` |
| Deploy frontend | Upload `/frontend/dist/` to cPanel | GTFS tab appears |

---

## Still Having Issues?

**Check these files on the production server:**

```bash
# SSH to server
ssh gobarryco@85.234.151.224

# Check if files exist
ls -la /home/gobarryco/api/routes/adminGTFS.js
ls -la /home/gobarryco/api/server.js

# Check for syntax errors
node --check /home/gobarryco/api/routes/adminGTFS.js
node --check /home/gobarryco/api/server.js

# View recent logs
pm2 logs breakdown-backend --lines 100

# Check if PM2 is running
pm2 status
```

---

**Need Help?** Check the GTFS_BACKEND_VERIFICATION.md file for complete endpoint documentation.

