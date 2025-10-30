# cPanel/Passenger Cache Issue - Complete Fix Guide

## Problem Summary
API returns error message that only exists in backup file, not current file.
**Root Cause:** Node.js/Passenger module cache serving stale code.

---

## Step-by-Step Fix Process

### PHASE 1: Diagnostic (5 minutes)

**Upload the diagnostic script to server:**
```bash
# From your local machine
scp cpanel-debug-cache.sh gobarryco@server:~/api/
```

**Run diagnostic on server:**
```bash
cd ~/api
bash cpanel-debug-cache.sh > diagnostic-report.txt 2>&1
cat diagnostic-report.txt
```

**What to look for:**
1. ✅ Does `grep` find the old error message in any file?
2. ✅ How does `server.js` import supervisors route?
3. ✅ Are there duplicate supervisor files?
4. ✅ Is there a dist/build directory being served?
5. ✅ What are the actual file modification times?

---

### PHASE 2: Manual Verification (2 minutes)

**Check server.js import statement:**
```bash
grep -A 5 "supervisors" ~/api/server.js
```

**Expected output should show:**
```javascript
import supervisorRoutes from './routes/supervisors.js';
// OR
app.use('/api/supervisors', supervisorRoutes);
```

**Check for wrong path:**
```bash
# If it shows .backup-supabase, that's your problem!
# Look for: './routes/supervisors.js.backup-supabase'
```

**Find ALL supervisor files:**
```bash
find ~/api -name "*supervisor*" -type f | grep -E "\.(js|mjs)$"
```

---

### PHASE 3: Nuclear Cache Clear (5 minutes)

**Upload and run the force refresh script:**
```bash
# From local machine
scp cpanel-force-refresh.sh gobarryco@server:~/api/

# On server
cd ~/api
bash cpanel-force-refresh.sh
```

**This script will:**
1. Add unique timestamp marker to verify file is loaded
2. Kill all Node/Passenger processes
3. Delete entire `tmp/` directory
4. Recreate `tmp/` and `restart.txt`
5. Clear Node module caches
6. Wait 5 seconds for cold start
7. Test the API endpoint

**Watch for the output at the end** - it should show the API response.

---

### PHASE 4: Debug Logging (if still broken)

**If Phase 3 didn't work, add debug logging:**
```bash
# Upload debug script
scp cpanel-add-debug-logging.sh gobarryco@server:~/api/

# Run it
cd ~/api
bash cpanel-add-debug-logging.sh
```

**Find Passenger logs:**
```bash
# Check common Passenger log locations
ls -lh ~/logs/ 2>/dev/null
ls -lh ~/*.log 2>/dev/null
ls -lh /var/log/passenger/ 2>/dev/null

# Or check Passenger status
passenger-status 2>/dev/null || echo "passenger-status not available"
```

**Check application logs:**
```bash
tail -100 ~/api/logs/error.log 2>/dev/null
tail -100 ~/api/logs/access.log 2>/dev/null
```

**Look for the debug output:**
```
==========================================
SUPERVISORS.JS LOADED
File path: /home/gobarryco/api/routes/supervisors.js
Timestamp: 2025-10-19T...
==========================================
```

---

### PHASE 5: Server.js Import Fix (if needed)

**If server.js is importing the wrong file:**

```bash
# Backup server.js
cp ~/api/server.js ~/api/server.js.backup

# Edit the import (replace .backup-supabase with .js)
sed -i 's|supervisors\.js\.backup-supabase|supervisors.js|g' ~/api/server.js

# Verify the change
grep supervisor ~/api/server.js

# Restart
touch ~/api/tmp/restart.txt
pkill -9 -f node
sleep 5
```

---

### PHASE 6: Passenger Configuration Check

**Check if there's a passenger configuration:**
```bash
cat ~/api/passenger_wsgi.py 2>/dev/null
cat ~/api/Passengerfile.json 2>/dev/null
cat ~/.passenger/config.json 2>/dev/null
```

**Check .htaccess:**
```bash
cat ~/api/.htaccess 2>/dev/null
cat ~/public_html/.htaccess 2>/dev/null
```

**Look for:**
- `PassengerAppRoot` directive
- Wrong path to application
- Cache directives

---

### PHASE 7: Extreme Measures (last resort)

**Rename the backup file completely:**
```bash
# Move backup file out of routes directory
mv ~/api/routes/supervisors.js.backup-supabase ~/api/backups/supervisors-old-$(date +%Y%m%d).js

# Verify it's gone
ls -la ~/api/routes/supervisor*

# Force restart
rm -rf ~/api/tmp/*
mkdir ~/api/tmp
touch ~/api/tmp/restart.txt
pkill -9 -f node
sleep 10
```

**Create a completely new file:**
```bash
# Copy current to a new name
cp ~/api/routes/supervisors.js ~/api/routes/supervisors-new.js

# Update server.js to use new name
sed -i "s|'./routes/supervisors.js'|'./routes/supervisors-new.js'|g" ~/api/server.js
sed -i 's|"./routes/supervisors.js"|"./routes/supervisors-new.js"|g' ~/api/server.js

# Restart
touch ~/api/tmp/restart.txt
pkill -9 -f node
```

---

## Verification Tests

### Test 1: Health Check
```bash
curl -s https://api.breakdowns.gobarry.co.uk/api/health | jq
```
**Expected:** `{"status":"healthy"}`

### Test 2: Supervisor Fetch
```bash
curl -s https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003
```
**Expected:** Should NOT contain "Database error while fetching supervisor"
**Should contain:** Actual supervisor data or a different error message

### Test 3: Check Error Message
```bash
curl -s https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003 | grep -o "Database error"
```
**Expected:** Empty output (no match)

### Test 4: Verify File Timestamp
```bash
# Add this to the top of supervisors.js temporarily:
# router.get('/debug-timestamp', (req, res) => res.json({
#   loaded: new Date().toISOString(),
#   file: 'CURRENT supervisors.js'
# }));

curl -s https://api.breakdowns.gobarry.co.uk/api/supervisors/debug-timestamp
```

---

## Common Root Causes (Priority Order)

1. **Server.js importing wrong file** (70% probability)
   - Check: `grep supervisor ~/api/server.js`
   - Fix: Edit import path in server.js

2. **Passenger serving cached module** (20% probability)
   - Check: Look for Passenger config files
   - Fix: Nuclear cache clear (Phase 3)

3. **Symlink or duplicate file** (5% probability)
   - Check: `ls -la ~/api/routes/supervisor*`
   - Fix: Remove duplicates, check symlinks

4. **Node.js require() cache** (3% probability)
   - Check: Look for require() instead of import
   - Fix: Ensure using ES6 imports, restart

5. **Build artifacts being served** (2% probability)
   - Check: Look for dist/build directories
   - Fix: Delete build dirs, serve source directly

---

## Expected Outcomes

### If Fix Works:
- API returns actual data for AG003
- OR: Returns "Failed to fetch supervisor" (from line 456 of current file)
- NOT: "Database error while fetching supervisor" (from backup file)

### If Still Broken:
- Contact cPanel host support
- Ask them to clear Passenger application cache
- Ask them to verify which file is being loaded
- Provide them the diagnostic report

---

## Quick Command Reference

```bash
# Kill all Node processes
pkill -9 -f node

# Full Passenger restart
rm -rf ~/api/tmp/* && mkdir ~/api/tmp && touch ~/api/tmp/restart.txt

# Check what's running
ps aux | grep -E "node|passenger" | grep -v grep

# Find log files
find ~ -name "*.log" -mtime -1 | head -20

# Test API
curl -v https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003

# Check file content
head -50 ~/api/routes/supervisors.js
tail -50 ~/api/routes/supervisors.js
```

---

## Contact Support Script

If nothing works, send this to your cPanel host:

```
Subject: Passenger not loading updated Node.js module

Hello,

I'm experiencing a caching issue with Passenger on my Node.js application.

Issue: API endpoint returns error message that only exists in a backup file
       (supervisors.js.backup-supabase), not the current file (supervisors.js).

Application: /home/gobarryco/api/
Domain: api.breakdowns.gobarry.co.uk

Attempts made:
- touch ~/api/tmp/restart.txt (multiple times)
- pkill -9 -f node (killed all processes)
- rm -rf ~/api/tmp/* (cleared temp directory)
- Verified file permissions (644)
- Verified imports in server.js

Request: Please clear the Passenger application cache for this domain and
         verify which file is being loaded by the Node.js runtime.

Thank you.
```

---

## Prevention for Future

**Add to server.js startup:**
```javascript
// At the top of server.js, after imports
console.log('='.repeat(50));
console.log('SERVER STARTED:', new Date().toISOString());
console.log('Node version:', process.version);
console.log('Working directory:', process.cwd());
console.log('='.repeat(50));
```

**Add to each route file:**
```javascript
// At the top of supervisors.js
console.log(`Route loaded: ${import.meta.url}`);
```

This will help identify which files are actually being loaded in future issues.
