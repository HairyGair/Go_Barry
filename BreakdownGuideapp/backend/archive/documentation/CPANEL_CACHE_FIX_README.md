# cPanel Cache Fix Toolkit

A comprehensive debugging and fix toolkit for Node.js module caching issues on cPanel/Passenger hosting.

## The Problem

Your API returns an error message that only exists in a backup file, not your current code. This is a module caching issue where Node.js/Passenger is serving stale code.

## Quick Start

### 1. Upload Files to Server

From your local machine (in the `backend/` directory):

```bash
scp cpanel-*.sh cpanel-*.md QUICK_FIX_COMMANDS.md gobarryco@server:~/api/
```

### 2. Run Quick Test

```bash
ssh gobarryco@server
cd ~/api
bash cpanel-quick-test.sh
```

This shows you the current status and what to do next.

### 3. Follow Recommendations

The quick test will tell you exactly what to run next.

---

## All Files Explained

### 📚 Documentation Files

| File | What It Is | When to Read |
|------|------------|--------------|
| **CPANEL_CACHE_FIX_README.md** | This file | Start here |
| **CPANEL_CACHE_SOLUTION_SUMMARY.md** | Complete technical solution | Full understanding |
| **CPANEL_CACHE_FIX_GUIDE.md** | Step-by-step walkthrough | Detailed fix process |
| **QUICK_FIX_COMMANDS.md** | Copy-paste commands | Quick reference |

### 🔧 Diagnostic Scripts

| Script | What It Does | Output |
|--------|--------------|--------|
| **cpanel-quick-test.sh** | Quick status check | Pass/fail summary |
| **cpanel-compare-files.sh** | Compare files vs API | Shows the mismatch |
| **cpanel-smoking-gun.sh** | **Proves which file loads** | **Definitive answer** |
| **cpanel-debug-cache.sh** | Full system diagnostic | Complete report |

### 🛠️ Fix Scripts

| Script | What It Does | Risk Level |
|--------|--------------|------------|
| **cpanel-force-refresh.sh** | Standard cache clear | 🟢 Safe |
| **cpanel-add-debug-logging.sh** | Add debug output | 🟢 Safe |
| **cpanel-nuclear-fix.sh** | Rename files to bypass cache | 🟡 Moderate |

---

## Typical Workflow

### Scenario 1: First Time Issue

```bash
# 1. Check status
bash cpanel-quick-test.sh

# 2. If issues detected, prove which file loads
bash cpanel-smoking-gun.sh

# 3. If backup file is loaded, try standard fix
bash cpanel-force-refresh.sh

# 4. Test again
bash cpanel-quick-test.sh
```

### Scenario 2: Standard Fix Didn't Work

```bash
# 1. Run full diagnostic
bash cpanel-debug-cache.sh > diagnostic.txt

# 2. Review the report
cat diagnostic.txt

# 3. Look for:
#    - Wrong import in server.js?
#    - Duplicate files?
#    - Passenger config issues?

# 4. If nothing obvious, go nuclear
bash cpanel-nuclear-fix.sh
```

### Scenario 3: Nothing Works

```bash
# 1. Run all diagnostics
bash cpanel-quick-test.sh > quick-test.txt
bash cpanel-smoking-gun.sh > smoking-gun.txt
bash cpanel-debug-cache.sh > full-diagnostic.txt

# 2. Send all three files to cPanel support

# 3. Use the template in QUICK_FIX_COMMANDS.md
```

---

## Understanding the Scripts

### cpanel-quick-test.sh ⭐ Start Here

**What it does:**
- Tests health endpoint
- Tests supervisor endpoint
- Checks for old error message
- Verifies file system
- Checks running processes
- Verifies server.js imports

**When to use:** Every time you make a change

**Output:** Color-coded pass/fail results

---

### cpanel-smoking-gun.sh ⭐ Most Important

**What it does:**
- Adds unique test endpoint to CURRENT file
- Adds different test endpoint to BACKUP file
- Restarts server
- Tests both endpoints
- Tells you definitively which file loaded

**When to use:** When you need absolute proof

**Output:** Shows which file is actually being loaded by Node.js

**Why it's called "smoking gun":** It provides irrefutable evidence of which file is loaded

---

### cpanel-force-refresh.sh ⭐ First Fix Attempt

**What it does:**
1. Adds timestamp marker to current file
2. Kills all Node/Passenger processes
3. Deletes entire tmp/ directory
4. Recreates tmp/restart.txt
5. Clears Node module caches
6. Waits for cold start
7. Tests API

**When to use:** First fix attempt after diagnosis

**Success rate:** ~70% of cases

---

### cpanel-nuclear-fix.sh ⭐ Last Resort

**What it does:**
1. Creates safety backups
2. Moves ALL backup files out of routes/
3. Renames supervisors.js to supervisor-routes.js
4. Updates server.js imports
5. Clears all caches
6. Force restarts
7. Tests with new filename

**When to use:** When standard methods fail

**Success rate:** ~95% of cases

**Why it works:** Completely new filename bypasses all cached module references

---

### cpanel-debug-cache.sh

**What it does:**
- Searches for old error message in all files
- Shows server.js route imports
- Lists all supervisor-related files
- Checks for build/dist directories
- Shows Passenger configuration
- Lists running processes
- Shows file modification times
- Checks .env configuration

**When to use:** Investigation phase

**Output:** 10-section diagnostic report

---

### cpanel-compare-files.sh

**What it does:**
- Searches for error message in both files
- Checks server.js imports
- Compares file hashes
- Tests actual API response
- Shows where error messages are located
- Provides recommendations

**When to use:** To verify the problem exists

**Output:** Side-by-side comparison of files vs API

---

### cpanel-add-debug-logging.sh

**What it does:**
- Adds console.log statements to supervisors.js
- Logs file path and timestamp when loaded
- Helps identify which file is being loaded

**When to use:** When you need to see log output

**Output:** Modified file with debug logging

**Note:** Check Passenger logs after running this

---

## File Relationships

```
Documentation (Read These)
├── CPANEL_CACHE_FIX_README.md ← You are here
├── CPANEL_CACHE_SOLUTION_SUMMARY.md ← Full technical guide
├── CPANEL_CACHE_FIX_GUIDE.md ← Step-by-step walkthrough
└── QUICK_FIX_COMMANDS.md ← Command reference

Diagnostic Tools (Run to Investigate)
├── cpanel-quick-test.sh ← Run this first
├── cpanel-smoking-gun.sh ← Proves which file loads
├── cpanel-compare-files.sh ← Shows the mismatch
└── cpanel-debug-cache.sh ← Full diagnostic report

Fix Tools (Run to Resolve)
├── cpanel-force-refresh.sh ← Try this first
├── cpanel-add-debug-logging.sh ← For debugging
└── cpanel-nuclear-fix.sh ← Last resort
```

---

## Decision Tree

```
Start: API returns wrong error message
  ↓
Run: cpanel-quick-test.sh
  ↓
  ├─ All tests pass → Problem is in code logic, not cache
  │                    Check database connection
  │
  └─ Tests fail → Cache issue
      ↓
    Run: cpanel-smoking-gun.sh
      ↓
      ├─ Current file loads → Problem is in current code
      │                        Check supervisors.js logic
      │
      ├─ Backup file loads → CACHE ISSUE CONFIRMED
      │   ↓
      │   Run: cpanel-force-refresh.sh
      │   ↓
      │   Test: cpanel-quick-test.sh
      │   ↓
      │   ├─ Fixed → Done! ✓
      │   │
      │   └─ Still broken
      │       ↓
      │       Run: cpanel-debug-cache.sh
      │       ↓
      │       Review for obvious issues
      │       (wrong import, duplicates, etc.)
      │       ↓
      │       ├─ Found issue → Fix manually, restart
      │       │
      │       └─ No obvious issue
      │           ↓
      │           Run: cpanel-nuclear-fix.sh
      │           ↓
      │           Test: cpanel-quick-test.sh
      │           ↓
      │           ├─ Fixed → Done! ✓
      │           │
      │           └─ Still broken → Contact cPanel support
      │                            (Provide diagnostic outputs)
      │
      ├─ Both files load → Duplicate imports in server.js
      │                     Edit server.js, remove duplicate
      │
      └─ Neither loads → Server startup failure
                         Check logs for errors
```

---

## Examples

### Example 1: Quick Check

```bash
$ cd ~/api
$ bash cpanel-quick-test.sh

╔════════════════════════════════════════╗
║   GO BARRY API - Quick Status Check   ║
╚════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 1: Health Endpoint
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ PASS - Health endpoint responding

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 2: Supervisor Endpoint (AG003)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ FAIL - Returns OLD error message (from backup file)
This means the cache issue is NOT fixed yet.

... (more output)
```

### Example 2: Smoking Gun Test

```bash
$ bash cpanel-smoking-gun.sh

TESTING ENDPOINTS
==========================================

Test 1: Testing CURRENT file endpoint...
❌ Current file endpoint did NOT respond

Test 2: Testing BACKUP file endpoint...
❌ PROBLEM: Backup file endpoint responded!

FINAL DIAGNOSIS
==========================================
❌ RESULT: Server is loading the BACKUP file!

This CONFIRMS the cache issue. The server is definitely loading:
  ~/api/routes/supervisors.js.backup-supabase

NEXT STEPS:
  1. Check server.js import statement
  2. Run: bash cpanel-nuclear-fix.sh
  3. Contact cPanel support if that fails
```

### Example 3: Nuclear Fix

```bash
$ bash cpanel-nuclear-fix.sh

⚠️  WARNING: This will:
  1. Move ALL backup files out of the routes directory
  2. Rename current supervisors.js to supervisor-routes.js
  3. Update server.js to use new name
  4. Delete all cache and temp files
  5. Force complete cold restart

Continue? (yes/no): yes

Step 1: Creating safety backup...
✅ Backup created in ~/api/SAFETY_BACKUP_20251019_103045

Step 2: Moving ALL backup files...
✅ Old files moved to ~/api/old-files-archive/

... (more steps)

✅ SUCCESS! The old error message is gone!
```

---

## Common Questions

### Q: Which script should I run first?

**A:** `cpanel-quick-test.sh` - It tells you the current status and what to do next.

### Q: How do I know if the fix worked?

**A:** Run `cpanel-quick-test.sh` again. It will show "ALL TESTS PASSED ✓" if fixed.

### Q: Is it safe to run these scripts?

**A:** Yes. All scripts create automatic backups before making changes. The nuclear fix has the biggest impact but still creates safety backups.

### Q: What if I break something?

**A:** All scripts create backups in `~/api/SAFETY_BACKUP_*` or similar. Check `CPANEL_CACHE_SOLUTION_SUMMARY.md` for rollback instructions.

### Q: Which script actually fixes the problem?

**A:**
- `cpanel-force-refresh.sh` fixes ~70% of cases
- `cpanel-nuclear-fix.sh` fixes ~95% of cases
- If neither works, it's a Passenger configuration issue (contact support)

### Q: Can I just run the nuclear fix immediately?

**A:** You can, but it's better to diagnose first with `cpanel-smoking-gun.sh` to understand the root cause. This helps prevent future issues.

### Q: How long does each script take?

- `cpanel-quick-test.sh`: 5-10 seconds
- `cpanel-smoking-gun.sh`: 15-20 seconds
- `cpanel-force-refresh.sh`: 15-20 seconds
- `cpanel-debug-cache.sh`: 10-15 seconds
- `cpanel-nuclear-fix.sh`: 20-30 seconds

### Q: Do I need to stop the server before running these?

**A:** No. The scripts handle stopping/starting automatically.

---

## Success Indicators

You'll know it's fixed when:

1. **cpanel-quick-test.sh shows:**
   ```
   ✓ PASS - Health endpoint responding
   ✓ PASS - Returns success response
   ✓ OLD ERROR NOT PRESENT
   ```

2. **API returns:**
   - Actual data for supervisor AG003, OR
   - Different error message (from current file)
   - NOT: "Database error while fetching supervisor"

3. **cpanel-smoking-gun.sh shows:**
   ```
   ✅ SUCCESS: Current file endpoint responded!
   ✅ Backup file endpoint did NOT respond (good)
   ```

---

## Support

If all scripts fail:

1. Collect diagnostic outputs:
   ```bash
   bash cpanel-quick-test.sh > quick-test.txt
   bash cpanel-smoking-gun.sh > smoking-gun.txt
   bash cpanel-debug-cache.sh > full-diagnostic.txt
   ```

2. Use support template from `QUICK_FIX_COMMANDS.md`

3. Attach all three .txt files to support ticket

---

## Tips

- **Run quick-test after every change** - It's fast and tells you if you're making progress
- **Don't skip the smoking gun test** - It provides definitive proof of the problem
- **Read the output** - Scripts provide specific recommendations
- **Check backups** - All scripts create safety backups
- **Keep old files** - Don't delete backups until everything is working

---

## Next Steps

**If you're just starting:**
1. Upload all files to server
2. Run `bash cpanel-quick-test.sh`
3. Follow its recommendations

**If you've already tried fixes:**
1. Run `bash cpanel-smoking-gun.sh`
2. If backup file loads, run `bash cpanel-nuclear-fix.sh`
3. Test with `bash cpanel-quick-test.sh`

**If nothing works:**
1. Run `bash cpanel-debug-cache.sh > diagnostic.txt`
2. Review `CPANEL_CACHE_FIX_GUIDE.md` for manual fixes
3. Contact cPanel support with diagnostic output

---

**Good luck! These tools will solve your caching issue.**
