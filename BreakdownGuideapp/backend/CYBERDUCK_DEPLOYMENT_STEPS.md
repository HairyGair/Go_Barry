# Go BARRY Backend - Cyberduck Deployment Guide

## 🎯 Quick Deployment via Cyberduck (No SSH Required!)

### Step 1: Backup Current Routes File
1. In Cyberduck, navigate to `/api/routes/`
2. Right-click `supervisors.js` → **Download**
3. Save as `supervisors.js.backup-before-route-fix`

### Step 2: Upload Fixed File
**Option A: Upload Just the Fixed File** (Fastest - 2 minutes)
1. In Cyberduck, navigate to `/api/routes/`
2. From your local machine, drag this file:
   ```
   /Users/anthony/Go BARRY App/BreakdownGuideapp/backend/routes/supervisors.js
   ```
3. Drop it into `/api/routes/` in Cyberduck
4. Click **Overwrite** when prompted

**Option B: Full Deployment** (Complete - 5 minutes)
1. In Cyberduck, navigate to `/` (home directory)
2. Upload `gobarry-backend.zip` to home directory
3. You'll need to use cPanel File Manager to extract it

### Step 3: Restart the Application
1. In Cyberduck, navigate to `/api/tmp/`
2. Right-click in the empty space → **New File**
3. Name it: `restart.txt`
4. (If it already exists, delete it and recreate it)

### Step 4: Verify the Fix
Wait 5-10 seconds, then test:
```
https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003/stats
```

Should return performance statistics (not just supervisor info).

---

## 🔍 What the Fix Does

**Before (BROKEN):**
```javascript
Line 85:  router.get('/:id', ...)       // Generic catches everything!
Line 134: router.get('/:id/stats', ...)  // Never reached
```

**After (FIXED):**
```javascript
Line 93:  router.get('/:id/stats', ...)  // Specific route FIRST ✓
Line 428: router.get('/:id', ...)        // Generic LAST ✓
```

---

## ✅ Verification Checklist

After deployment:

- [ ] File uploaded: `/api/routes/supervisors.js` (should be ~12 KB)
- [ ] Restart triggered: `/api/tmp/restart.txt` created/updated
- [ ] Wait 10 seconds for app restart
- [ ] Test endpoint returns stats (not error)

---

## 🆘 Troubleshooting

**If stats endpoint still fails:**

1. Check file was overwritten:
   - In Cyberduck, view `/api/routes/supervisors.js`
   - File size should be ~12 KB
   - Modified timestamp should be recent

2. Force restart:
   - Delete `/api/tmp/restart.txt`
   - Wait 5 seconds
   - Create new `/api/tmp/restart.txt`
   - Wait 10 seconds

3. Check route order in deployed file:
   - Download `/api/routes/supervisors.js` from server
   - Search for both route definitions
   - `/:id/stats` should come before `/:id`

---

## 📂 File Locations

**Local (your Mac):**
```
/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/
├── routes/supervisors.js           ← Upload THIS file
└── gobarry-backend.zip             ← OR upload this (full deploy)
```

**Remote (server via Cyberduck):**
```
/api/
├── routes/supervisors.js           ← Replace this file
└── tmp/restart.txt                 ← Create/update this to restart
```

---

## 🎓 Recommended: Option A (Just the fixed file)

Since only one file changed, uploading just `routes/supervisors.js` is:
- ✅ Faster (2 minutes vs 5 minutes)
- ✅ Safer (no risk of overwriting other files)
- ✅ Easier to verify
- ✅ Same result

Full deployment (Option B) is only needed if multiple files changed.
