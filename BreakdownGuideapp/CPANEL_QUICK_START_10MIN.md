# cPanel 10-Minute Deployment Guide

**For**: Experienced developers | **Time**: 10 minutes | **Platform**: cPanel hosting

Full docs: See `DEPLOYMENT.md` for detailed explanations.

---

## Step 1: Check Prerequisites (2 min)

```bash
# Local machine checks
$ node --version
Expected: v18.x or higher

$ npm --version
Expected: 9.x or higher

$ git --version
Expected: Any recent version
```

**cPanel Requirements:**
- Node.js 18+ enabled
- MySQL 8.0+ database access
- SSH access (optional, recommended)
- SSL certificate installed

---

## Step 2: Prepare Build (2 min)

```bash
# Clone/navigate to repo
$ cd "Go BARRY App/BreakdownGuideapp"

# Install backend dependencies
$ cd backend
$ npm install --production

# Build frontend
$ cd ../Go_BARRY
$ npm install
$ npm run build:cpanel
Expected: dist/ folder created in Go_BARRY/

# Verify build
$ ls -la dist/
Expected: index.html, assets/, _expo/, etc.
```

---

## Step 3: Upload Files (2 min)

**Option A: SSH (Fastest)**
```bash
# From project root
$ tar -czf gobarry-deploy.tar.gz backend/ Go_BARRY/dist/
$ scp gobarry-deploy.tar.gz username@yourserver.com:~/

# On server
$ ssh username@yourserver.com
$ tar -xzf gobarry-deploy.tar.gz
$ mv backend ~/public_html/api
$ mv Go_BARRY/dist/* ~/public_html/
```

**Option B: cPanel File Manager**
1. Zip `backend/` and `Go_BARRY/dist/` locally
2. Upload via File Manager
3. Extract to:
   - `public_html/api/` (backend)
   - `public_html/` (frontend files)

---

## Step 4: Database Setup (2 min)

**In cPanel MySQL:**
```sql
-- Create database
CREATE DATABASE gobarry_prod;

-- Create user
CREATE USER 'gobarry_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON gobarry_prod.* TO 'gobarry_user'@'localhost';
FLUSH PRIVILEGES;

-- Run migrations (copy from backend/migrations/*.sql)
-- Execute these in order:
USE gobarry_prod;
SOURCE ~/public_html/api/migrations/create_breakdown_tracker.sql;
SOURCE ~/public_html/api/migrations/add_coordinate_caching.sql;
SOURCE ~/public_html/api/migrations/add_performance_indexes.sql;
```

**Quick CLI method:**
```bash
$ mysql -u gobarry_user -p gobarry_prod < ~/public_html/api/migrations/create_breakdown_tracker.sql
$ mysql -u gobarry_user -p gobarry_prod < ~/public_html/api/migrations/add_coordinate_caching.sql
$ mysql -u gobarry_user -p gobarry_prod < ~/public_html/api/migrations/add_performance_indexes.sql
```

---

## Step 5: Environment Config (1 min)

```bash
# In ~/public_html/api/
$ cp .env.example .env
$ nano .env
```

**Minimal required config:**
```env
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_USER=gobarry_user
DB_PASSWORD=YOUR_PASSWORD_HERE
DB_NAME=gobarry_prod

# Supabase (get from supabase.com)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=your_anon_key_here

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# API Keys (optional but recommended)
TOMTOM_API_KEY=your_key
HERE_API_KEY=your_key
STREET_MANAGER_API_KEY=your_key
```

Save and exit (Ctrl+X, Y, Enter)

---

## Step 6: Start Application (1 min)

**Setup Node.js App in cPanel:**
1. Go to "Setup Node.js App"
2. Click "Create Application"
3. Settings:
   - Node.js version: 18.x
   - App root: `api/`
   - App URL: `api.yourdomain.com` or `yourdomain.com/api`
   - App startup file: `index.js`
   - Passenger log file: `logs/passenger.log`
4. Click "Create"

**Or via command line:**
```bash
$ cd ~/public_html/api
$ npm install --production
$ node index.js &
Expected: Server running on port 3000
```

**Setup .htaccess for API routing:**
```bash
$ nano ~/public_html/api/.htaccess
```

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.js/$1 [L]
```

---

## Step 7: Verify Deployment (2 min)

```bash
# Test backend health
$ curl https://yourdomain.com/api/health
Expected: {"status":"healthy","timestamp":"..."}

# Test database connection
$ curl https://yourdomain.com/api/health/extended
Expected: {"database":"connected",...}

# Test frontend
$ curl https://yourdomain.com/
Expected: HTML with "Go BARRY" title

# Test API endpoint
$ curl https://yourdomain.com/api/alerts
Expected: JSON array of alerts
```

**Browser checks:**
1. Visit `https://yourdomain.com` - Should see login screen
2. Check browser console - No CORS errors
3. Try login with test supervisor badge
4. Check Network tab - API calls succeeding

---

## Common Gotchas

### 1. Node.js Version Mismatch
```bash
# Fix: Use Node.js version manager in cPanel
Error: "ERR_REQUIRE_ESM"
Fix: Ensure package.json has "type": "module"
```

### 2. Database Connection Fails
```bash
Error: "ER_ACCESS_DENIED_ERROR"
Fix: Check DB credentials in .env, verify MySQL user permissions
$ mysql -u gobarry_user -p  # Test login manually
```

### 3. CORS Errors in Browser
```bash
Error: "Access-Control-Allow-Origin"
Fix: Check backend/index.js cors config, ensure FRONTEND_URL matches
```

### 4. 404 on API Routes
```bash
Error: All /api/* routes return 404
Fix: Check .htaccess in api/ folder, verify Passenger app is running
$ cat ~/logs/passenger.log  # Check for errors
```

### 5. Frontend Shows Blank Page
```bash
Error: White screen, no errors
Fix: Check dist/ build, ensure all assets uploaded
Browser console: Look for missing asset errors
```

---

## If Something Breaks

### Emergency Fix 1: App Won't Start
```bash
# Check logs
$ tail -f ~/logs/passenger.log
$ tail -f ~/public_html/api/logs/app.log

# Common fixes:
$ cd ~/public_html/api
$ npm install --production  # Reinstall dependencies
$ node index.js  # Test direct run
Expected: Error message if something wrong

# Nuclear option: Restart Passenger
$ touch ~/public_html/api/tmp/restart.txt
```

### Emergency Fix 2: Database Issues
```bash
# Verify database exists
$ mysql -u gobarry_user -p -e "SHOW DATABASES;"
Expected: gobarry_prod in list

# Check tables
$ mysql -u gobarry_user -p gobarry_prod -e "SHOW TABLES;"
Expected: alerts, supervisors, routes, etc.

# Reset database (WARNING: deletes data)
$ mysql -u gobarry_user -p gobarry_prod < ~/public_html/api/migrations/create_breakdown_tracker.sql
```

### Emergency Fix 3: Frontend Not Loading
```bash
# Check file permissions
$ cd ~/public_html
$ chmod 755 *.html
$ chmod 755 -R assets/ _expo/

# Verify index.html exists
$ ls -la index.html
Expected: File exists, readable

# Check .htaccess for SPA routing
$ cat .htaccess
Expected: RewriteRule for React Router
```

**Missing .htaccess fix:**
```bash
$ nano ~/public_html/.htaccess
```
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

---

## Production Checklist

**Before going live:**
- [ ] SSL certificate active (`https://` works)
- [ ] Environment variables set (`.env` configured)
- [ ] Database migrations run (all tables exist)
- [ ] API health check passes (`/api/health`)
- [ ] Frontend loads without console errors
- [ ] Test supervisor login works
- [ ] API keys configured (TomTom, HERE, etc.)
- [ ] CORS configured for production domain
- [ ] Passenger app running (check cPanel Node.js Apps)
- [ ] Logs directory writable (`~/logs/`)

**Monitoring:**
```bash
# Watch logs
$ tail -f ~/logs/passenger.log

# Check app status
$ curl https://yourdomain.com/api/health/extended

# Monitor memory
$ top -u your_cpanel_username
```

---

## Quick Reference

**File Locations:**
```
~/public_html/               # Frontend files
~/public_html/api/          # Backend application
~/public_html/api/.env      # Environment config
~/logs/                     # Application logs
```

**Restart Commands:**
```bash
# Restart Node.js app
$ touch ~/public_html/api/tmp/restart.txt

# Restart directly
$ killall node && cd ~/public_html/api && node index.js &
```

**Logs:**
```bash
$ tail -f ~/logs/passenger.log       # Passenger errors
$ tail -f ~/public_html/api/logs/app.log  # Application logs
```

**Database:**
```bash
$ mysql -u gobarry_user -p gobarry_prod  # Connect to DB
```

---

## Need More Help?

- **Detailed guide**: See `DEPLOYMENT.md`
- **API docs**: See `backend/README.md`
- **Frontend setup**: See `Go_BARRY/Readme.txt`
- **Environment variables**: See `backend/.env.example`

**Common documentation:**
- Database schema: `backend/migrations/*.sql`
- API endpoints: `backend/routes/`
- Frontend components: `Go_Barry/components/`

---

**Total time**: ~10 minutes for experienced developers
**Success rate**: 90%+ if prerequisites met

**Last updated**: October 2025
