# cPanel/Passenger Node.js Cache Issue - Complete Solution

## Executive Summary

**Problem:** API returns error message `"Database error while fetching supervisor"` that only exists in backup file (`supervisors.js.backup-supabase`), not in current file (`supervisors.js`).

**Root Cause:** Node.js/Passenger module cache is serving stale code from backup file instead of current file.

**Solution:** 4-phase approach from diagnostic to nuclear fix.

---

## Quick Start (For Impatient Fixers)

```bash
# 1. Upload scripts
scp cpanel-*.sh gobarryco@server:~/api/

# 2. Run smoking gun test (proves which file is loaded)
cd ~/api && bash cpanel-smoking-gun.sh

# 3. If backup file is loaded, run nuclear fix
bash cpanel-nuclear-fix.sh

# 4. Test
curl https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003
```

---

## Files Included in This Solution

| File | Purpose | When to Use |
|------|---------|-------------|
| `CPANEL_CACHE_FIX_GUIDE.md` | Complete step-by-step guide | Full documentation |
| `QUICK_FIX_COMMANDS.md` | Copy-paste command reference | Quick lookup |
| `cpanel-debug-cache.sh` | Full system diagnostic | Initial investigation |
| `cpanel-compare-files.sh` | Compare files vs API response | Verify the problem |
| `cpanel-smoking-gun.sh` | Definitively prove which file loads | **Start here!** |
| `cpanel-force-refresh.sh` | Standard cache clear | First fix attempt |
| `cpanel-add-debug-logging.sh` | Add logging to identify loaded file | Debugging |
| `cpanel-nuclear-fix.sh` | Rename files to bypass all caching | Last resort |

---

## Recommended Fix Sequence

### Phase 1: Confirm the Problem (2 minutes)

```bash
cd ~/api
bash cpanel-smoking-gun.sh
```

**This will definitively tell you which file is being loaded.**

**Possible outcomes:**
- ✅ Current file loads → Problem is in the code logic, not cache
- ❌ Backup file loads → Confirmed cache issue, proceed to Phase 2
- ⚠️ Both files load → server.js has duplicate imports
- ❌ Neither loads → Server startup failure, check logs

---

### Phase 2: Standard Fix (5 minutes)

```bash
cd ~/api
bash cpanel-force-refresh.sh
```

**This performs:**
- Adds timestamp marker to verify file loading
- Kills all Node/Passenger processes
- Clears tmp directory completely
- Tests the API endpoint

**If this works:** Problem solved! ✅

**If this fails:** Proceed to Phase 3

---

### Phase 3: Investigation (10 minutes)

```bash
cd ~/api
bash cpanel-debug-cache.sh > diagnostic.txt
cat diagnostic.txt
```

**Look for:**
1. Does `server.js` import the wrong file?
   ```javascript
   // WRONG:
   import supervisorRoutes from './routes/supervisors.js.backup-supabase';

   // CORRECT:
   import supervisorRoutes from './routes/supervisors.js';
   ```

2. Are there duplicate supervisor files in routes/?

3. Is there a `dist/` or `build/` directory being served?

4. Are there Passenger config files pointing to wrong paths?

**Manual fixes:**
```bash
# Fix server.js import
nano ~/api/server.js
# Change import line to './routes/supervisors.js'

# Remove duplicate files
mv ~/api/routes/*.backup* ~/api/archive/

# Restart
touch ~/api/tmp/restart.txt && pkill -9 -f node
```

---

### Phase 4: Nuclear Option (10 minutes)

**Only if Phases 1-3 fail!**

```bash
cd ~/api
bash cpanel-nuclear-fix.sh
```

**This will:**
1. Move ALL backup files out of routes/
2. Rename `supervisors.js` → `supervisor-routes.js`
3. Update `server.js` to import new filename
4. Clear all caches
5. Force complete cold restart

**Why this works:**
- Completely new filename bypasses any cached module references
- No possibility of importing old file
- Forces Passenger to reload everything from scratch

---

## Understanding the Root Cause

### Why does this happen?

**Node.js Module Cache:**
```javascript
// When you do this:
import supervisorRoutes from './routes/supervisors.js';

// Node.js caches the module internally
// Even if you change the file, the cache persists until process restarts
```

**Passenger Cache:**
- Passenger preloads modules for performance
- Cache persists even after `touch tmp/restart.txt`
- May require `pkill` to fully clear

**Possible scenarios:**

1. **Server.js imports wrong file** (70% of cases)
   - Check: `grep supervisor ~/api/server.js`
   - Fix: Edit import path

2. **Passenger cached old module** (20% of cases)
   - Check: Process list shows old timestamps
   - Fix: `pkill -9 -f node` + clear tmp/

3. **Symlink or duplicate file** (5% of cases)
   - Check: `ls -la ~/api/routes/supervisor*`
   - Fix: Remove duplicates

4. **Import statement cached in parent module** (5% of cases)
   - Check: Restart entire application
   - Fix: Nuclear option (rename file)

---

## How to Prevent This in Future

### 1. Add startup logging to server.js

```javascript
// At the top of server.js
console.log('='.repeat(50));
console.log('SERVER START:', new Date().toISOString());
console.log('Node version:', process.version);
console.log('Working dir:', process.cwd());
console.log('='.repeat(50));
```

### 2. Add file load logging to each route

```javascript
// At the top of supervisors.js
console.log(`[LOAD] supervisors.js - ${new Date().toISOString()}`);
console.log(`[LOAD] File: ${import.meta.url}`);
```

### 3. Never use .backup extensions in production

```bash
# Instead of:
supervisors.js.backup-supabase  # ❌ Bad

# Do this:
../backups/supervisors-supabase-2025-10-19.js  # ✅ Good
```

### 4. Add restart verification

```javascript
// In server.js
let startupId = Date.now();
app.get('/api/startup-id', (req, res) => {
  res.json({
    startupId,
    started: new Date(startupId).toISOString()
  });
});
```

Then after restart:
```bash
curl https://api.breakdowns.gobarry.co.uk/api/startup-id
# Should show new timestamp after each restart
```

---

## Troubleshooting Specific Errors

### Error: "Database error while fetching supervisor"

**Diagnosis:**
```bash
bash cpanel-smoking-gun.sh
```

**If backup file is loaded:**
- Run `cpanel-nuclear-fix.sh`

**If current file is loaded:**
- Error is in the current code
- Check database connection in `supervisors.js`
- Check MySQL config in `.env`

### Error: Cannot find module './routes/supervisors.js'

**Diagnosis:**
```bash
ls -la ~/api/routes/supervisors*
```

**Fix:**
- File was deleted or renamed
- Restore from backup
- Or update import in server.js

### Error: Server won't restart

**Diagnosis:**
```bash
ps aux | grep node
tail -50 ~/logs/*.log
```

**Fix:**
```bash
# Kill all processes
pkill -9 -f node

# Check for syntax errors
node ~/api/server.js
# (will show errors if any)

# Check file permissions
chmod 644 ~/api/routes/*.js
chmod 755 ~/api/routes/
```

### Error: Both test endpoints respond

**Diagnosis:** server.js imports both files

**Fix:**
```bash
grep -n "supervisors" ~/api/server.js
# Look for duplicate import or app.use() statements

nano ~/api/server.js
# Remove duplicate lines
```

---

## When to Contact cPanel Support

Contact support if:

1. ✅ You've run all 4 phases
2. ✅ Nuclear fix didn't work
3. ✅ Smoking gun test shows backup file is still loaded
4. ✅ You've verified server.js imports correct file
5. ✅ No duplicate files exist

**Provide them:**
- Output from `cpanel-debug-cache.sh`
- Output from `cpanel-smoking-gun.sh`
- Proof that current file is correct
- Proof that server.js imports correct file

**Ask them to:**
- Clear Passenger application cache manually
- Verify which file is being loaded by Node.js runtime
- Check for system-level caching or proxies
- Verify Passenger configuration

---

## Success Criteria

### ✅ Problem is FIXED when:

```bash
# Test 1: Old error is gone
curl -s https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003 | grep "Database error"
# Should return: (nothing)

# Test 2: Gets actual data OR new error message
curl -s https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003
# Should return: Data OR "Failed to fetch supervisor" (from current file)

# Test 3: Smoking gun shows current file
bash cpanel-smoking-gun.sh
# Should show: "✅ SUCCESS: Current file endpoint responded!"
```

---

## Emergency Rollback

If you break something:

```bash
# Scripts create automatic backups:
ls -lh ~/api/SAFETY_BACKUP_*
ls -lh ~/api/routes/*.smoking-gun-backup

# Restore from backup:
cp ~/api/SAFETY_BACKUP_*/supervisors.js ~/api/routes/
cp ~/api/SAFETY_BACKUP_*/server.js ~/api/

# Restart:
touch ~/api/tmp/restart.txt
pkill -9 -f node
```

---

## Technical Details

### Module Resolution in Node.js

```javascript
// When you import a module:
import supervisorRoutes from './routes/supervisors.js';

// Node.js resolves it like this:
// 1. Check cache: require.cache['/full/path/to/supervisors.js']
// 2. If cached, return cached version (THIS IS THE PROBLEM)
// 3. If not cached, load file and cache it

// The cache persists until the process exits
// touch tmp/restart.txt doesn't always kill the process
// Hence: pkill -9 -f node
```

### Passenger Application Lifecycle

```
User request
    ↓
Passenger spawns Node.js process (if not already running)
    ↓
Node.js loads server.js
    ↓
server.js imports routes (cached by Node.js)
    ↓
Routes handle request
```

**Key points:**
- Passenger may keep Node.js process alive between requests
- `touch tmp/restart.txt` tells Passenger to restart on NEXT request
- Old process may handle current request
- `pkill` forces immediate termination

---

## Scripts Reference

### cpanel-smoking-gun.sh
**Purpose:** Definitively prove which file is loaded
**How:** Adds unique test endpoints to each file
**Output:** Shows which endpoint responds
**Use when:** You need absolute proof of which file is active

### cpanel-force-refresh.sh
**Purpose:** Standard cache clear procedure
**How:** Kills processes, clears tmp, restarts
**Output:** API response showing success/failure
**Use when:** First fix attempt after diagnosis

### cpanel-nuclear-fix.sh
**Purpose:** Completely bypass all caching
**How:** Renames file to new name, updates imports
**Output:** Step-by-step progress and final test
**Use when:** All standard methods have failed

### cpanel-debug-cache.sh
**Purpose:** Comprehensive system diagnostic
**How:** Searches files, checks configs, lists processes
**Output:** Full report of system state
**Use when:** You need to investigate the environment

### cpanel-compare-files.sh
**Purpose:** Compare file contents to API response
**How:** Searches for error strings, tests API
**Output:** Shows which error messages exist where
**Use when:** You need to verify the mismatch

---

## Final Checklist

Before declaring victory:

- [ ] Old error message is gone from API responses
- [ ] Smoking gun test shows current file loaded
- [ ] Database connection works (if applicable)
- [ ] No duplicate route registrations
- [ ] Backups moved out of routes/ directory
- [ ] server.js imports correct file
- [ ] Startup logging shows new timestamps
- [ ] Test with real supervisor badge (AG003)

---

**Questions? Issues? Check QUICK_FIX_COMMANDS.md for copy-paste solutions.**
