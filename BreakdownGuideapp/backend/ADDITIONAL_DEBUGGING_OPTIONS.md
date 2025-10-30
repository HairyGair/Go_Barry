# Additional Things We Can Try (Beyond Pixelish Support)

## Summary of Current Situation

We've confirmed:
- ✅ DNS points to cPanel (85.234.151.224)
- ✅ Node.js app IS running and responding
- ✅ `/api/health` endpoint works (proves code is executing)
- ✅ Latest `server.js` is being used (confirmed by health check format)
- ❌ All `/api/supervisors/*` endpoints return errors
- ❌ MySQL queries appear to be failing

## Option 1: Deploy Diagnostic Endpoint (RECOMMENDED - START HERE)

**What:** Upload 2 files that add a `/api/diagnostics` endpoint
**Time:** 5 minutes
**Instructions:** See `QUICK_FIX_INSTRUCTIONS.md`

**Why this first:**
- Will show EXACT MySQL error messages
- Tests connection with actual running environment variables
- No guessing - will tell us exactly what's wrong
- Can share results with Pixelish if needed

---

## Option 2: Test MySQL Connection from cPanel Terminal

**Access MySQL directly via SSH to verify database access:**

```bash
# Connect to MySQL
mysql -h 85.234.151.224 -u gobarryco_Gair -p gobarryco_breakdowns

# When prompted, enter password: Turnip1105!!!!!

# Then test queries:
SHOW TABLES;
SELECT COUNT(*) FROM supervisors;
SELECT * FROM supervisors WHERE badge_number = 'AG003';
```

**What this proves:**
- ✅ Database credentials work
- ✅ Tables exist and are accessible
- ❌ If it fails: credentials or database name wrong

---

## Option 3: Check Application Logs

**Look for error messages in cPanel logs:**

### Via cPanel File Manager:
1. Go to cPanel → File Manager
2. Navigate to `~/logs/` or `~/api/logs/`
3. Look for files like:
   - `nodejs.log`
   - `error_log`
   - `access_log`
   - `stderr.log`

### Via SSH:
```bash
# Check for log files
ls -la ~/logs/
ls -la ~/api/logs/

# Read recent Node.js errors
tail -100 ~/logs/nodejs.log
tail -100 ~/logs/stderr.log

# Watch logs in real-time
tail -f ~/logs/nodejs.log
```

**What to look for:**
- MySQL connection errors
- "ECONNREFUSED" - can't connect to database
- "Access denied" - wrong credentials
- "Unknown database" - database name wrong
- Import/require errors - missing files

---

## Option 4: Verify Environment Variables Are Loaded

**Create a test endpoint that echoes .env values:**

Add to `server.js`:
```javascript
app.get('/api/env-check', (req, res) => {
  res.json({
    DB_HOST: process.env.DB_HOST || 'NOT SET',
    DB_PORT: process.env.DB_PORT || 'NOT SET',
    DB_USER: process.env.DB_USER || 'NOT SET',
    DB_NAME: process.env.DB_NAME || 'NOT SET',
    DB_PASSWORD_SET: !!process.env.DB_PASSWORD,
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    CWD: process.cwd(),
    ENV_FILE_PATH: require('path').resolve('.env')
  });
});
```

Then test: `https://api.breakdowns.gobarry.co.uk/api/env-check`

**What this shows:**
- If all values are "NOT SET" - `.env` file not being loaded
- If values wrong - `.env` file has typos
- `CWD` shows where app is running from

---

## Option 5: Check .env File Location and Permissions

**Via SSH or Cyberduck, verify:**

```bash
# Check .env exists in app directory
ls -la ~/api/.env

# Check .env file permissions (should be readable)
cat ~/api/.env

# Verify exact content
head -10 ~/api/.env
```

**Common issues:**
- `.env` file in wrong directory
- `.env` file has Windows line endings (CRLF instead of LF)
- `.env` file has spaces around equals signs: `DB_HOST = localhost` (wrong, should be `DB_HOST=localhost`)
- `.env` file has quotes around values when it shouldn't

---

## Option 6: Test with Simplified Supervisor Route

**Create a minimal test route that bypasses most logic:**

Add to `routes/supervisors.js`:
```javascript
// TEST ENDPOINT - Minimal MySQL query
router.get('/test-connection', async (req, res) => {
  try {
    // Ultra-simple query
    const result = await query('SELECT 1 as test');

    res.json({
      success: true,
      message: 'MySQL connection works!',
      result: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      stack: error.stack
    });
  }
});
```

Then test: `https://api.breakdowns.gobarry.co.uk/api/supervisors/test-connection`

**What this proves:**
- ✅ If it works: MySQL connection is fine, issue is in query logic
- ❌ If it fails: Shows exact MySQL error

---

## Option 7: Force Clear All Caches

Even though you said LiteSpeed cache isn't set up, let's clear everything:

### Via cPanel:
1. Look for "LiteSpeed Cache Manager" or "Cache Manager"
2. Click "Purge All"

### Via SSH:
```bash
# Clear any potential cache directories
rm -rf ~/api/tmp/*
rm -rf ~/api/.cache/*
rm -rf ~/api/node_modules/.cache/*

# Recreate restart trigger
mkdir -p ~/api/tmp
touch ~/api/tmp/restart.txt
```

### Via .htaccess:
We already added cache-control headers. Add more aggressive caching rules:

```apache
# Add to ~/api/.htaccess
<FilesMatch "\.(js|json)$">
    Header unset ETag
    FileETag None
    <IfModule mod_headers.c>
        Header unset Cache-Control
        Header set Cache-Control "max-age=0, no-cache, no-store, must-revalidate, proxy-revalidate"
        Header set Pragma "no-cache"
        Header set Expires "Wed, 11 Jan 1984 05:00:00 GMT"
    </IfModule>
</FilesMatch>
```

---

## Option 8: Check Passenger Configuration

**If your host uses Passenger to run Node.js apps:**

### Find Passenger config:
```bash
# Look for Passenger config files
find ~ -name "passenger*" -o -name ".passenger*" 2>/dev/null

# Check for app startup file config
cat ~/.passenger/*/config.json 2>/dev/null
```

### Common Passenger issues:
- App configured to run from wrong directory
- Wrong entry point file (index.js instead of server.js)
- Old environment variables cached

### Restart Passenger:
```bash
# Passenger restart method
touch ~/api/tmp/restart.txt

# Alternative: kill the process (Passenger will restart it)
pkill -f "api"
```

---

## Option 9: Use cPanel's "Setup Node.js App" Interface

**If available in your cPanel:**

1. cPanel → Software → **Setup Node.js App**
2. Click "Create Application"
3. Configure:
   - **Node.js version:** 18.x or higher
   - **Application mode:** Production
   - **Application root:** `api`
   - **Application URL:** `api.breakdowns.gobarry.co.uk`
   - **Application startup file:** `server.js`
   - **Environment variables:** Add all from `.env` manually

4. Save and restart

**Advantage:**
- cPanel manages environment variables
- Clear restart mechanism
- Shows actual error messages in UI
- Can see resource usage

---

## Option 10: Create a Completely Fresh Deployment

**Sometimes cleanest is fastest:**

1. **Backup current:**
   ```bash
   mv ~/api ~/api-broken-backup
   ```

2. **Create fresh directory:**
   ```bash
   mkdir ~/api
   ```

3. **Upload ONLY essential files:**
   - `server.js`
   - `package.json`
   - `.env`
   - `config/mysql.js`
   - `routes/supervisors.js`
   - `middleware/authMiddleware.js`

4. **Install dependencies:**
   ```bash
   cd ~/api
   npm install --production
   ```

5. **Test health:**
   ```
   curl https://api.breakdowns.gobarry.co.uk/api/health
   ```

**Why this works:**
- Eliminates cached files
- Fresh node_modules
- No old configuration interfering
- Easy to debug with minimal files

---

## My Recommendation: Order of Operations

### Phase 1: Quick Diagnostics (10 minutes)
1. ✅ **Deploy diagnostic endpoint** (Option 1) - DO THIS FIRST
2. ✅ **Check application logs** (Option 3) - Might show obvious error
3. ✅ **Test MySQL from terminal** (Option 2) - Verify credentials work

### Phase 2: If Diagnostics Show Environment Issue (15 minutes)
4. ✅ **Verify .env file** (Option 5) - Check for typos, line endings
5. ✅ **Add env-check endpoint** (Option 4) - See what app sees
6. ✅ **Force clear caches** (Option 7) - Just in case

### Phase 3: If MySQL Connection Works But Queries Fail (20 minutes)
7. ✅ **Add test-connection route** (Option 6) - Simplified query
8. ✅ **Check Passenger config** (Option 8) - Wrong directory?
9. ✅ **Try cPanel Node.js App manager** (Option 9) - If available

### Phase 4: Nuclear Option (30 minutes)
10. ✅ **Fresh deployment** (Option 10) - Start from scratch

### Phase 5: Get Expert Help
11. ✅ **Contact Pixelish support** - With diagnostic results from Option 1

---

## What Information to Collect

Before contacting Pixelish support, gather:

1. **Diagnostic endpoint response** (from Option 1)
2. **Environment check response** (from Option 4)
3. **Application log excerpts** (from Option 3)
4. **MySQL test results** (from Option 2)
5. **Current .env file content** (minus password)
6. **Directory structure:** `ls -laR ~/api/ | head -100`

This gives them everything they need to help immediately.

---

## Quick Win Predictions

Based on the symptoms, I predict the issue is one of:

**Most Likely (80% confidence):**
- `.env` file not being loaded by Node.js process
- Database name typo: `gobarryco_breakdown` vs `gobarryco_breakdowns`
- MySQL user doesn't have permissions on `gobarryco_breakdowns` database

**Moderately Likely (15% confidence):**
- App running from different directory than `~/api/`
- Old code cached in Passenger/Node.js require cache
- MySQL connection being blocked by firewall (localhost vs IP)

**Less Likely (5% confidence):**
- Tables don't exist (we saw them in earlier SQL tests)
- Syntax error in query (would show in error message)
- Network issue between Node.js and MySQL

---

**START WITH OPTION 1** - The diagnostic endpoint will tell us which of these it is!
