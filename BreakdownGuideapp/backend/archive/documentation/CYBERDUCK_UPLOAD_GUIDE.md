# Cyberduck Upload Guide - Diagnostic Endpoint

## Quick 2-File Upload (5 minutes)

### Files to Upload

**File 1: diagnostic-endpoint.js** (NEW)
- **Local Path:** `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/diagnostic-endpoint.js`
- **Remote Path:** `~/api/diagnostic-endpoint.js`
- **Action:** Drag and drop (new file)

**File 2: server.js** (UPDATED)
- **Local Path:** `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/server.js`
- **Remote Path:** `~/api/server.js`
- **Action:** Drag and drop, click "Overwrite"

---

## Step-by-Step Instructions

### Step 1: Open Cyberduck and Connect

1. Open **Cyberduck**
2. Click your saved **gobarry.co.uk** bookmark (or reconnect with SFTP)
3. You should see your home directory (`/home/gobarryco/`)

### Step 2: Navigate to API Directory

1. In Cyberduck, **double-click** the `api` folder
2. You should now be in `/home/gobarryco/api/`
3. Verify you can see files like:
   - `server.js`
   - `package.json`
   - `.env`
   - `config/` folder
   - `routes/` folder

### Step 3: Upload diagnostic-endpoint.js

**On your Mac:**
1. Open **Finder**
2. Navigate to: `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/`
3. Find the file: `diagnostic-endpoint.js`

**In Cyberduck:**
1. Make sure you're in the `api` folder (not a subfolder!)
2. **Drag** `diagnostic-endpoint.js` from Finder
3. **Drop** it into the Cyberduck window (in the main `api` directory)
4. Wait for upload to complete (should be instant - it's a small file)

✅ **Verify:** You should now see `diagnostic-endpoint.js` in the file list

### Step 4: Upload server.js (Overwrite Existing)

**On your Mac:**
1. In the same Finder window
2. Find the file: `server.js`

**In Cyberduck:**
1. **Drag** `server.js` from Finder
2. **Drop** it into the Cyberduck window
3. A popup will appear: **"File already exists"**
4. Click **"Overwrite"** (or "Replace")
5. Wait for upload to complete

✅ **Verify:**
- Right-click `server.js` in Cyberduck
- Click "Info"
- Check "Modified" date - should be today's date, just now

### Step 5: Restart the Application

**In Cyberduck:**
1. Navigate to the `tmp` folder:
   - Double-click `tmp` folder inside `api`
   - You should now be in `/home/gobarryco/api/tmp/`

2. **If `restart.txt` exists:**
   - Right-click `restart.txt`
   - Click "Delete"
   - Confirm deletion

3. **Create new restart.txt:**
   - Right-click in empty space
   - Click "New File"
   - Name it: `restart.txt`
   - Click "Create"

4. **Wait 10 seconds** for the app to restart

### Step 6: Test the Diagnostic Endpoint

**Open your web browser and go to:**
```
https://api.breakdowns.gobarry.co.uk/api/diagnostics
```

**Or use Terminal:**
```bash
curl https://api.breakdowns.gobarry.co.uk/api/diagnostics
```

**What you should see:**
- A JSON response with server info, database config, and test results
- Look for ✅ (success) or ❌ (error) symbols in the tests section

---

## Visual Checklist

### Before Upload:
```
Local Machine:
/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/
├── diagnostic-endpoint.js  ← UPLOAD THIS
├── server.js               ← UPLOAD THIS (overwrite)
└── ... other files
```

### After Upload:
```
Remote Server (via Cyberduck):
/home/gobarryco/api/
├── diagnostic-endpoint.js  ← NEW FILE ✓
├── server.js               ← UPDATED ✓
├── config/
├── routes/
├── tmp/
│   └── restart.txt         ← RECREATED ✓
└── ... other files
```

---

## Troubleshooting Cyberduck Upload

### Problem: "Permission Denied" when uploading
**Solution:**
- Check you're connected as `gobarryco` user
- Try uploading to home directory first, then move file

### Problem: Can't find `api` folder
**Solution:**
- You might be in the wrong directory
- Look for breadcrumb at top of Cyberduck window
- Should show: `/home/gobarryco/api/`
- If not, click bookmarks and reconnect

### Problem: Files upload but changes don't appear
**Solution:**
- Make sure you overwrote the file (didn't create `server (1).js`)
- Check "Modified" date is recent
- Make sure you restarted via `tmp/restart.txt`

### Problem: Can't create restart.txt
**Solution:**
- Delete the `tmp` folder and recreate it
- Or just delete and recreate restart.txt multiple times
- Or create a file named with timestamp: `restart-20251021.txt`

---

## After Upload - Testing Sequence

### Test 1: Health Check (Should Already Work)
```bash
curl https://api.breakdowns.gobarry.co.uk/api/health
```
**Expected:** `{"status":"healthy","timestamp":"...","auth":"configured","rateLimit":"active"}`

### Test 2: Diagnostics (NEW - Should Work After Upload)
```bash
curl https://api.breakdowns.gobarry.co.uk/api/diagnostics
```
**Expected:** JSON with database connection tests

### Test 3: Supervisor Stats (Currently Broken - Should be Fixed After Diagnostics)
```bash
curl https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003/stats
```
**Current:** `{"success":false,"error":"Database error while fetching supervisor"}`
**After Fix:** JSON with supervisor statistics

---

## Alternative: Upload via cPanel File Manager

If Cyberduck isn't working:

1. **Log into cPanel:** https://gobarry.co.uk:2083
2. **Click "File Manager"**
3. **Navigate to:** `api` folder
4. **Click "Upload"** (top menu)
5. **Select files:** Browse to local files
6. **Wait for upload**
7. **Overwrite when prompted**
8. **Navigate to** `api/tmp/`
9. **Delete and recreate** `restart.txt`

---

## Quick Reference

| File | Local Path | Remote Path | Action |
|------|------------|-------------|---------|
| diagnostic-endpoint.js | `/Users/anthony/.../backend/diagnostic-endpoint.js` | `~/api/diagnostic-endpoint.js` | New file |
| server.js | `/Users/anthony/.../backend/server.js` | `~/api/server.js` | Overwrite |
| restart.txt | *(create new)* | `~/api/tmp/restart.txt` | Delete & recreate |

**Test URL:** `https://api.breakdowns.gobarry.co.uk/api/diagnostics`

---

## What Happens Next

After you run diagnostics, the JSON response will tell us:

✅ **If all tests pass:**
- MySQL is connected
- Tables are accessible
- Issue is in the specific query logic in supervisors.js
- We fix the query syntax

❌ **If MySQL connection fails:**
- Shows exact error message
- We fix .env credentials or database configuration
- Or contact Pixelish if it's a hosting issue

❌ **If tables not found:**
- Database name is wrong
- We update .env file with correct name
- Or tables need to be created

Either way, **we'll know exactly what to fix** instead of guessing!

---

**Total Time:** 5 minutes to upload, 2 minutes to test, immediate answers!
