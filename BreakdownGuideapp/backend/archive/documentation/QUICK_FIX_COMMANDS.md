# Quick Fix Commands - Copy & Paste

## Upload Scripts to Server

```bash
# From your LOCAL machine (in the backend directory):
scp cpanel-*.sh gobarryco@server:~/api/
```

---

## Run Diagnostic (Do This First!)

```bash
# On SERVER (SSH):
cd ~/api
bash cpanel-compare-files.sh
```

**This will tell you immediately if the server is loading the wrong file.**

---

## Quick Checks (Manual Investigation)

```bash
# Check server.js import
grep -C 3 "supervisors" ~/api/server.js

# Find all supervisor files
find ~/api -name "*supervisor*.js" -type f

# Check API response
curl -s https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003 | head -20

# Search for old error message
grep -r "Database error while fetching supervisor" ~/api/
```

---

## Fix Attempt #1: Force Refresh (Recommended First)

```bash
cd ~/api
bash cpanel-force-refresh.sh
```

---

## Fix Attempt #2: Check Server.js Import Path

```bash
# If server.js imports the WRONG file, fix it:
nano ~/api/server.js
# Look for the import line and make sure it says:
#   import supervisorRoutes from './routes/supervisors.js';
# NOT:
#   import supervisorRoutes from './routes/supervisors.js.backup-supabase';

# Then restart:
touch ~/api/tmp/restart.txt && pkill -9 -f node
```

---

## Fix Attempt #3: Add Debug Logging

```bash
cd ~/api
bash cpanel-add-debug-logging.sh

# Then check logs:
tail -100 ~/logs/*.log
# Or wherever Passenger logs are
```

---

## Fix Attempt #4: Nuclear Option (Last Resort)

```bash
cd ~/api
bash cpanel-nuclear-fix.sh
# This will rename the file completely to avoid any cache issues
```

---

## Manual Nuclear Fix (If Scripts Don't Work)

```bash
# 1. Move backup file completely away
mkdir -p ~/api/archive
mv ~/api/routes/supervisors.js.backup-supabase ~/api/archive/

# 2. Rename current file to something completely new
mv ~/api/routes/supervisors.js ~/api/routes/supervisor-api.js

# 3. Update server.js
sed -i.bak "s|'./routes/supervisors.js'|'./routes/supervisor-api.js'|g" ~/api/server.js

# 4. Nuclear cache clear
pkill -9 -f node
rm -rf ~/api/tmp/*
mkdir ~/api/tmp
touch ~/api/tmp/restart.txt

# 5. Wait and test
sleep 10
curl https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003
```

---

## Verification Commands

```bash
# Test health endpoint
curl https://api.breakdowns.gobarry.co.uk/api/health

# Test supervisor endpoint
curl https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003

# Check for old error
curl -s https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003 | grep "Database error"
# Should return NOTHING if fixed

# Check processes
ps aux | grep -E "node|passenger" | grep -v grep

# Check file timestamps
ls -lh ~/api/routes/supervisor*
```

---

## If Nothing Works - Get System Info

```bash
# Run full diagnostic
cd ~/api
bash cpanel-debug-cache.sh > diagnostic-full.txt 2>&1

# Check Passenger status
passenger-status 2>/dev/null || echo "Not available"

# Check Passenger config
cat ~/.passenger/config.json 2>/dev/null
cat ~/api/Passengerfile.json 2>/dev/null

# Find ALL log files
find ~ -name "*.log" -mtime -1 2>/dev/null | head -20

# Check .htaccess
cat ~/api/.htaccess 2>/dev/null
cat ~/public_html/.htaccess 2>/dev/null
```

**Send diagnostic-full.txt to cPanel support if nothing works.**

---

## Rollback (If You Break Something)

```bash
# The scripts create backups automatically:
ls -lh ~/api/SAFETY_BACKUP_*
ls -lh ~/api/*.pre-nuclear

# To restore:
cp ~/api/SAFETY_BACKUP_*/supervisors.js ~/api/routes/
cp ~/api/SAFETY_BACKUP_*/server.js ~/api/
touch ~/api/tmp/restart.txt
```

---

## Expected Outcomes

### ✅ FIXED - You should see:
- API returns actual supervisor data, OR
- API returns "Failed to fetch supervisor" (new error from current file), OR
- API returns different error from current file

### ❌ NOT FIXED - You still see:
- "Database error while fetching supervisor" (old error from backup file)
- This means deeper Passenger/system cache issue

---

## Contact Support Template

```
Subject: Node.js module cache issue - Passenger serving old file

I'm experiencing a persistent module caching issue where my Node.js application
is serving code from a backup file instead of the current file.

Application: /home/gobarryco/api
Domain: api.breakdowns.gobarry.co.uk
Issue: API returns error message that only exists in .backup file

Steps taken:
✅ Verified current file is correct (different error messages)
✅ Killed all Node processes multiple times
✅ Deleted and recreated tmp/restart.txt
✅ Checked server.js imports correct file
✅ Verified file permissions
✅ Renamed files to avoid cache
✅ Cleared all temporary directories

Request: Please investigate Passenger cache and module loading.
The system appears to be loading '/routes/supervisors.js.backup-supabase'
instead of '/routes/supervisors.js' despite correct import statements.

Attached: diagnostic-full.txt
```
