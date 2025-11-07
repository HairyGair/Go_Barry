# CyberDuck Deployment Guide - Security Improvements

**Date:** November 7, 2025
**Files:** 11 backend files + frontend dist/
**Time Estimate:** 10-15 minutes

---

## Step 1: Open CyberDuck and Connect to Server

1. Open CyberDuck
2. Click **Open Connection** or **File** → **New Connection**
3. Select **SFTP (SSH File Transfer Protocol)**
4. Enter connection details:
   - **Server:** `85.234.151.224`
   - **Username:** `gobarryco`
   - **Password:** *(your password)*
   - **Port:** `22` (default)
5. Click **Connect**

---

## Step 2: Deploy Backend Files

### Navigate to backend root directory

In CyberDuck, navigate to: `/home/gobarryco/api`

### Deploy these 6 root-level files:

From your local: `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/`

Upload to: `/home/gobarryco/api/`

**Files to upload:**
1. `server.js` (MODIFIED)
2. `package.json` (MODIFIED - has new dependencies)
3. `package-lock.json` (MODIFIED)

**That's it for root level** - the other files go in subdirectories.

### Deploy middleware files (3 files)

From: `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/middleware/`

Upload to: `/home/gobarryco/api/middleware/`

**Files to upload:**
1. `authMiddleware.js` (MODIFIED)
2. `errorHandler.js` (NEW - this file doesn't exist yet, create it)
3. `validationMiddleware.js` (MODIFIED)

**For the new `errorHandler.js`:**
- If the file doesn't exist on the server, CyberDuck will create it when you upload
- Just drag and drop from local to remote

### Deploy validation folder (1 file - NEW FOLDER)

From: `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/validation/`

Upload to: `/home/gobarryco/api/validation/` (create if doesn't exist)

**Files to upload:**
1. `schemas.js` (NEW)

**Note:** If `/home/gobarryco/api/validation/` folder doesn't exist:
- Right-click in `/home/gobarryco/api/`
- Select **Create New Folder**
- Name it `validation`
- Then upload `schemas.js` into it

### Deploy route files (4 files)

From: `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/routes/`

Upload to: `/home/gobarryco/api/routes/`

**Files to upload:**
1. `auth.js` (MODIFIED)
2. `breakdowns.js` (MODIFIED)
3. `analytics.js` (MODIFIED)
4. `defects.js` (MODIFIED)

---

## Step 3: Deploy Frontend Files

### Navigate to frontend directory

In CyberDuck, navigate to: `/home/gobarryco/public_html/breakdowns.gobarry.co.uk/`

### Delete all existing files

1. Select ALL files in this directory
2. Press **Delete** or right-click → **Delete**
3. Confirm deletion

### Upload new dist files

From: `/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend/dist/`

Upload to: `/home/gobarryco/public_html/breakdowns.gobarry.co.uk/`

**Files to upload:**
- `index.html`
- `assets/` folder (all files inside)

---

## Step 4: Install New Dependencies on Server

Once files are uploaded via CyberDuck, SSH to server and run:

```bash
ssh gobarryco@85.234.151.224
cd ~/api
npm ci --production
```

This will install the 3 new packages:
- cookie-parser@1.4.7
- joi@18.0.1
- node-cache@5.1.2

---

## Step 5: Restart Backend

```bash
pm2 restart breakdown-backend
sleep 2
pm2 logs breakdown-backend --lines 20
```

Expected output:
- Should see: `✅ Server ready for connections with MySQL database`
- No "Cannot find module" errors
- No syntax errors

---

## Step 6: Verify Deployment

### Test backend health

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{"status":"healthy","timestamp":"...","auth":"mysql-configured","rateLimit":"active"}
```

### Test frontend loads

```bash
curl -I https://breakdowns.gobarry.co.uk/
```

Expected response:
```
HTTP/2 200
```

### Test HTTP-only cookie login

```bash
curl -i -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"anthony.gair@gonortheast.co.uk","password":"YourPassword"}'
```

Look for in response headers:
```
Set-Cookie: auth_token=...
```

---

## CyberDuck Tips

### To see file details

- Right-click file → **Info** to see size, modified date
- Helps verify you're uploading the correct version

### To refresh view

- Press **Cmd+R** (Mac) or **F5** (Windows)
- CyberDuck doesn't always auto-refresh

### To upload folders

- Drag entire folder to CyberDuck
- It will create folder structure automatically
- Best for `/validation/` folder

### Keyboard shortcuts

- **Cmd+N** (Mac) / **Ctrl+N** (Windows) - New connection
- **Cmd+U** (Mac) / **Ctrl+U** (Windows) - Upload files
- **Delete** - Delete files/folders

---

## Deployment Checklist

**Backend Files (via CyberDuck):**
- [ ] `/api/server.js` uploaded
- [ ] `/api/package.json` uploaded
- [ ] `/api/package-lock.json` uploaded
- [ ] `/api/middleware/authMiddleware.js` uploaded
- [ ] `/api/middleware/errorHandler.js` uploaded (NEW)
- [ ] `/api/middleware/validationMiddleware.js` uploaded
- [ ] `/api/validation/schemas.js` uploaded (NEW folder)
- [ ] `/api/routes/auth.js` uploaded
- [ ] `/api/routes/breakdowns.js` uploaded
- [ ] `/api/routes/analytics.js` uploaded
- [ ] `/api/routes/defects.js` uploaded

**Frontend Files (via CyberDuck):**
- [ ] `/public_html/breakdowns.gobarry.co.uk/` cleared (all files deleted)
- [ ] `/public_html/breakdowns.gobarry.co.uk/index.html` uploaded
- [ ] `/public_html/breakdowns.gobarry.co.uk/assets/` folder uploaded

**Server Commands (via SSH):**
- [ ] `npm ci --production` completed
- [ ] `pm2 restart breakdown-backend` completed
- [ ] `curl http://localhost:3001/api/health` returns healthy

**Verification:**
- [ ] Backend returns health check
- [ ] Frontend loads at https://breakdowns.gobarry.co.uk/
- [ ] Login test shows Set-Cookie header
- [ ] No errors in PM2 logs

---

## Rollback (If Issues)

If something goes wrong, you can restore from backup:

**Restore Backend:**
```bash
cd ~/api
rm -rf node_modules
tar -xzf ~/backups/backup_backend_*.tar.gz
npm ci --production
pm2 restart breakdown-backend
```

**Restore Frontend:**
```bash
cd ~/public_html/breakdowns.gobarry.co.uk/
rm -rf *
tar -xzf ~/backups/backup_frontend_*.tar.gz
```

---

## File Summary

**Total files to upload: 11 backend + frontend dist**

```
backend/
├── server.js                    ← Upload (MODIFIED)
├── package.json                 ← Upload (MODIFIED - HAS NEW DEPS)
├── package-lock.json            ← Upload (MODIFIED)
├── middleware/
│   ├── authMiddleware.js        ← Upload (MODIFIED)
│   ├── errorHandler.js          ← Upload (NEW)
│   └── validationMiddleware.js  ← Upload (MODIFIED)
├── validation/
│   └── schemas.js               ← Upload (NEW folder & file)
└── routes/
    ├── auth.js                  ← Upload (MODIFIED)
    ├── breakdowns.js            ← Upload (MODIFIED)
    ├── analytics.js             ← Upload (MODIFIED)
    └── defects.js               ← Upload (MODIFIED)

frontend/
└── dist/                        ← Upload everything (entire folder)
    ├── index.html
    ├── assets/
    │   ├── *.css
    │   ├── *.js
    │   └── vendor-*.js
    └── ... (all compiled files)
```

---

## Size Reference

Files shouldn't be huge - here's what to expect:

- `server.js` - ~3 KB
- `package.json` - ~1 KB
- `authMiddleware.js` - ~5 KB
- `errorHandler.js` - ~3 KB (NEW)
- `validationMiddleware.js` - ~2 KB
- `schemas.js` - ~15 KB (NEW)
- `auth.js` - ~25 KB
- `breakdowns.js` - ~20 KB
- `analytics.js` - ~18 KB
- `defects.js` - ~12 KB
- `frontend/dist/` - ~3.8 MB total

**Total:** ~85 MB including frontend

---

## Support

If you encounter issues during CyberDuck upload:

1. **Connection drops** - Reconnect and retry upload
2. **File already exists** - CyberDuck will ask to overwrite, click **Yes**
3. **Permission denied** - Check you're uploading to correct directory
4. **Upload seems stuck** - Check file size in status bar at bottom
5. **Folder not created** - Right-click parent, select **Create New Folder**

**Questions?** Refer to `DEPLOYMENT_SECURITY_IMPROVEMENTS.md` for full details.

---

**Last Updated:** November 7, 2025
**Ready for CyberDuck Deployment ✅**
