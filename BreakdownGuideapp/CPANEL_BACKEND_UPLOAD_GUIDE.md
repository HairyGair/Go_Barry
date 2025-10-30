# cPanel Backend Upload Guide

**System:** Go BARRY Breakdown Management System - Backend
**Target:** cPanel Hosting
**Date:** October 28, 2025

---

## 📋 Quick Answer

Your backend appears to already be deployed (we found a production `.env` file). You likely need to:
1. **UPDATE** the existing `.env` file (not full re-upload)
2. Restart the Node.js app

But here's the complete guide for both scenarios:

---

## Option 1: UPDATE Existing Backend (Recommended - 5 minutes)

### If Your Backend is Already Running on cPanel:

**Step 1: Update .env File Only**

**Via cPanel File Manager:**
1. Log into cPanel
2. Click **File Manager**
3. Navigate to your backend folder (likely `~/backend/` or `~/api/` or `~/breakdown-backend/`)
4. Find the `.env` file
5. Right-click → **Edit**
6. **Backup current content** (copy to notepad)
7. Replace entire content with this:

```bash
# Production Environment Configuration - cPanel Deployment
NODE_ENV=production
PORT=3001

# MySQL Database Configuration
DB_HOST=85.234.151.224
DB_PORT=3306
DB_USER=gobarryco_Gair
DB_PASSWORD=Turnip1105!!!!!
DB_NAME=gobarryco_breakdown
MYSQL_CONNECTION_LIMIT=10

# JWT Authentication
JWT_SECRET=9fa4f0f326a2f2b997ebe6450b6ae5a236c8229cc43137462505b810c5c27bd792e6f97f058297758f0bc425ae36026e4cbdba91b10fef256541f3425ddd611a
JWT_EXPIRATION=24h

# API Configuration
API_BASE_URL=https://breakdowns.gobarry.co.uk/api

# App URLs
APP_URL=https://breakdowns.gobarry.co.uk

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=https://gobarry.co.uk,https://www.gobarry.co.uk,https://breakdowns.gobarry.co.uk,http://localhost:5173,http://localhost:3000

# Feature Flags - Production
ENABLE_AUTH=true
ENABLE_MOCK_DATA=false

# Session Configuration
SESSION_SECRET=breakdown_guide_production_secret_2025

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

8. Click **Save Changes**

**Step 2: Restart Node.js Application**

**Via cPanel:**
1. Go to **Setup Node.js App** (or **Node.js Selector**)
2. Find your breakdown backend app
3. Click **Restart** button
4. Wait for "Running" status

**Via SSH (if available):**
```bash
cd ~/backend
pm2 restart breakdown-backend
# OR
touch tmp/restart.txt  # If using Passenger
```

**Step 3: Verify**
```bash
curl https://breakdowns.gobarry.co.uk/api/health
# Should return: {"status":"ok","database":"connected"}
```

**Done! ✅** Your backend is updated.

---

## Option 2: FULL Backend Upload (Fresh Deployment - 20 minutes)

### If You Need to Upload Everything:

### What to Upload ✅

**Essential Files/Folders:**
```
backend/
├── server.js              ← Main entry point
├── app.js                 ← Express app configuration
├── package.json           ← Dependencies (NO Supabase!)
├── package-lock.json      ← Lock file
├── .env.production-clean  ← Rename to .env on server
├── routes/                ← All API routes
├── services/              ← Business logic
├── middleware/            ← Auth, validation, etc.
├── config/                ← MySQL config
├── utils/                 ← Helper functions
└── data/                  ← JSON data files
```

**Total Size:** ~5-10 MB (without node_modules)

### What NOT to Upload ❌

**Exclude These:**
```
❌ node_modules/          # Will install on server
❌ tests/                 # Not needed in production
❌ scripts/               # Migration utilities only
❌ docs/                  # Documentation only
❌ .git/                  # Git repository
❌ *.log                  # Log files
❌ *.backup               # Backup files
❌ .env                   # Don't upload local .env
❌ .env.example           # Template only
❌ reset-password.js      # Utility script
❌ test-*.js              # Test files
```

---

## Method A: cPanel File Manager (Easiest)

**Step 1: Prepare ZIP File Locally**
```bash
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp"

# Create clean backend zip
zip -r backend-deploy.zip backend/ \
  -x "backend/node_modules/*" \
  -x "backend/tests/*" \
  -x "backend/scripts/*" \
  -x "backend/docs/*" \
  -x "backend/.git/*" \
  -x "backend/*.log" \
  -x "backend/*.backup" \
  -x "backend/test-*.js" \
  -x "backend/reset-*.js"
```

**Step 2: Upload to cPanel**
1. Log into cPanel
2. Click **File Manager**
3. Navigate to home directory (`/home/yourusername/`)
4. Click **Upload** (top right)
5. Select `backend-deploy.zip`
6. Wait for upload to complete

**Step 3: Extract on Server**
1. In File Manager, right-click `backend-deploy.zip`
2. Click **Extract**
3. Confirm extraction path (creates `backend/` folder)
4. Delete the zip file after extraction

**Step 4: Configure .env**
1. Navigate into `backend/` folder
2. Find `.env.production-clean`
3. Right-click → **Rename** to `.env`
4. Verify contents are correct

**Step 5: Install Dependencies**
1. Go to cPanel → **Terminal** (or use SSH)
2. Run:
```bash
cd ~/backend
npm ci --production
```
3. Wait for installation (2-5 minutes)

**Step 6: Setup Node.js App**
1. cPanel → **Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - **Node.js version:** 18.x or higher
   - **Application mode:** Production
   - **Application root:** `backend` (or full path)
   - **Application URL:** Your domain or subdomain
   - **Application startup file:** `server.js`
   - **Environment variables:** (Leave empty, using .env file)
4. Click **Create**
5. Copy the command to enter virtual environment (you'll see it)

**Step 7: Start Application**
1. Click **Run NPM Install** (if button available)
2. Click **Start** or **Restart**
3. Verify status shows "Running"

---

## Method B: FTP/SFTP Upload (If You Prefer FTP Client)

**Step 1: Connect via FTP**
- Use FileZilla, Cyberduck, or any FTP client
- Host: `ftp.yourdomain.com` or your cPanel server IP
- Username: Your cPanel username
- Password: Your cPanel password
- Port: 21 (FTP) or 22 (SFTP)

**Step 2: Upload Files**
1. Navigate to `/home/yourusername/` (remote)
2. Create folder: `backend` (if doesn't exist)
3. Upload these folders/files:
   ```
   ✅ server.js
   ✅ app.js
   ✅ package.json
   ✅ package-lock.json
   ✅ routes/ (entire folder)
   ✅ services/ (entire folder)
   ✅ middleware/ (entire folder)
   ✅ config/ (entire folder)
   ✅ utils/ (entire folder)
   ✅ data/ (entire folder)
   ```
4. **DO NOT** upload node_modules/
5. Upload `.env.production-clean` and rename to `.env` on server

**Step 3: Continue with Steps 5-7 from Method A**
(Install dependencies, setup Node.js app, start)

---

## Method C: SSH/Terminal Upload (Advanced)

**Step 1: Prepare Deployment Package**
```bash
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp"

# Create deployment archive
tar -czf backend-deploy.tar.gz \
  --exclude="backend/node_modules" \
  --exclude="backend/tests" \
  --exclude="backend/scripts" \
  --exclude="backend/.git" \
  --exclude="backend/*.log" \
  backend/
```

**Step 2: Upload via SCP**
```bash
# Replace with your actual cPanel details
scp backend-deploy.tar.gz cpanel-user@your-server.com:~/
```

**Step 3: Extract and Setup on Server**
```bash
# SSH into server
ssh cpanel-user@your-server.com

# Extract
cd ~
tar -xzf backend-deploy.tar.gz

# Rename .env
cd backend
mv .env.production-clean .env

# Install dependencies
npm ci --production

# Start application (method depends on your setup)
pm2 start server.js --name breakdown-backend
# OR configure via cPanel Node.js interface
```

---

## Post-Upload Configuration

### Node.js App Configuration in cPanel

**Important Settings:**
```
Application root: backend/
Application startup file: server.js
Node.js version: 18.x or higher
Application mode: Production
Environment variables: Use .env file (already configured)
```

**If Using PM2 (Advanced):**
```bash
# Install PM2 globally (if not already)
npm install -g pm2

# Start app
cd ~/backend
pm2 start server.js --name breakdown-backend --max-memory-restart 1024M

# Save PM2 config
pm2 save

# Setup auto-restart
pm2 startup
```

---

## Troubleshooting

### Issue: "Cannot find module"
**Solution:**
```bash
cd ~/backend
npm ci --production
# Then restart app
```

### Issue: "Port 3001 already in use"
**Solution:**
- Check if old instance is running
- Kill old process or change PORT in .env
- Restart app

### Issue: "Cannot connect to MySQL"
**Solution:**
- Verify DB credentials in .env
- Check MySQL remote access is enabled for IP 85.234.151.224
- Test connection:
```bash
mysql -h 85.234.151.224 -u gobarryco_Gair -p gobarryco_breakdown
```

### Issue: App shows "Stopped" status
**Solution:**
- Check logs: cPanel → Node.js App → View Logs
- Common causes:
  - Syntax errors (run `node -c server.js` locally first)
  - Missing dependencies (run `npm ci --production`)
  - Port conflicts
  - .env file missing or incorrect

---

## Verification Steps

After deployment, verify everything works:

**1. Check App Status**
- cPanel → Setup Node.js App
- Status should be "Running"

**2. Test Health Endpoint**
```bash
curl https://breakdowns.gobarry.co.uk/api/health
# Expected: {"status":"ok","database":"connected"}
```

**3. Test Login Endpoint**
```bash
curl -X POST https://breakdowns.gobarry.co.uk/api/supervisor/login \
  -H "Content-Type: application/json" \
  -d '{"badge":"AG003","password":"YOUR_PASSWORD"}'
# Expected: {"success":true,"token":"..."}
```

**4. Check Logs**
- cPanel → Node.js App → View Logs
- Should see: "Server running on port 3001"
- Should see: "Database connected successfully"

---

## Quick Reference

### Essential Commands

**Restart Backend:**
```bash
# Via PM2
pm2 restart breakdown-backend

# Via cPanel
Setup Node.js App → Restart button

# Via touch file (if using Passenger)
touch ~/backend/tmp/restart.txt
```

**View Logs:**
```bash
# Via PM2
pm2 logs breakdown-backend

# Via cPanel
Setup Node.js App → View Logs → stdout/stderr

# Via file
tail -f ~/backend/server.log
```

**Update Dependencies:**
```bash
cd ~/backend
npm ci --production
# Then restart
```

---

## Summary

### If Backend Already Deployed (Most Likely):
✅ **Just update .env file** (5 minutes)
✅ Restart Node.js app
✅ Test health endpoint

### If Fresh Deployment Needed:
✅ Create zip excluding node_modules/tests/
✅ Upload to cPanel via File Manager
✅ Extract and rename .env
✅ Run `npm ci --production`
✅ Configure Node.js app in cPanel
✅ Start application
✅ Verify health endpoint

---

## Files You Need

**Ready to Upload:**
- ✅ `backend/` folder (entire structure)
- ✅ `backend/.env.production-clean` (rename to `.env`)
- ✅ All cleaned from Phases 1-3 (no Supabase!)

**Don't Upload:**
- ❌ `node_modules/`
- ❌ Test files
- ❌ Documentation

---

**Next Steps:**
1. Choose your method (File Manager recommended)
2. Upload files (or just update .env if already deployed)
3. Install dependencies on server
4. Start/restart Node.js app
5. Test endpoints

**Need Help?** Check the troubleshooting section or view logs in cPanel.
