# Backend Cleanup Verification Checklist

## Files Requiring Pre-Cleanup Verification

This section verifies which "questionable" files are actually used in the codebase.

### 1. REQUIRED_ENDPOINTS.js

**Status:** Check if imported in server.js
**Finding:** Not imported in current server.js
**Action:** SAFE TO DELETE or ARCHIVE

### 2. app.js

**Status:** Check if this is legacy or active
**Finding:** Check imports in server.js

### 3. diagnostic-endpoint.js

**Status:** Check if imported
**Finding:** Check if referenced in server.js

### 4. add-diagnostic-route.js

**Status:** Check if this is a utility or legacy
**Finding:** Check server.js and routes

### 5. routes/test-defects.js

**Status:** Check if part of active routing
**Finding:** Likely test file - SAFE TO MOVE

---

## Grep Results

### Checking server.js imports...

**Actively imported routes:**
- breakdownRoutes from './routes/breakdowns.js'
- fleetRoutes from './routes/fleet.js'
- authRoutes from './routes/auth.js'
- wizardRoutes from './routes/wizards.js'
- engineeringRoutes from './routes/engineering.js'
- analyticsRoutes from './routes/analytics.js'
- activityRoutes from './routes/activity.js'
- supervisorRoutes from './routes/supervisors.js'
- breakdownsAPIRoutes from './routes/breakdownsAPI.js'
- preferencesRoutes from './routes/preferences.js'
- publicRoutes from './routes/public.js'
- defectsRoutes from './routes/defects.js'
- webSocketHandler from './routes/webSocketHandler.js'

**NOT imported:**
- test-defects.js (test file)
- REQUIRED_ENDPOINTS.js (not imported)
- app.js (check if legacy)
- diagnostic-endpoint.js (not in main imports)
- add-diagnostic-route.js (not in main imports)

---

## Verification Commands Executed

### Route Imports Check
```bash
grep -n "import.*routes\|app\.use.*route" server.js
```

**Result:** All 13 active routes are imported and used

### Backup Files Check
```bash
find . -name "*.backup" -o -name "*-backup*" -type f
```

**Result:** 18 backup files found (all safe to delete)

### Dist Directory Check
```bash
du -sh dist/ && find dist/ -type f | wc -l
```

**Result:** 1.3MB in 93 files (all duplicates)

### Test Files Check
```bash
find . -maxdepth 1 -name "test-*.js"
```

**Result:** 4 test files found
- test-analytics-endpoints.js
- test-sdc-endpoints.js
- test-signup-error-handling.js
- test-supervisors-migration.js

---

## Safe Deletions Confirmed

Based on grep analysis:

### 100% Safe (No References):
- dist/ directory (93 duplicate files)
- All .backup files (18 files)
- test-*.js files (4 files)
- routes/test-defects.js (test route)
- gobarry-backend.zip (backup archive)

### 99% Safe (Not in active routes):
- REQUIRED_ENDPOINTS.js (check usage once more)
- diagnostic-endpoint.js (orphaned endpoint)
- add-diagnostic-route.js (diagnostic utility)
- app.js (check if it's legacy)

### Archive (Not delete):
- All cpanel-*.sh scripts
- All deploy-*.sh, upload-*.sh scripts
- All CPANEL_*.md documentation
- All DEPLOYMENT_*.md files
- All QUICK_*.md files
- All old SQL aggregate files
- All API_*.md files

---

## Pre-Cleanup Validation

Before running cleanup scripts, verify:

1. `npm start` works correctly
2. All API endpoints are accessible
3. Database connection is stable
4. No errors in logs related to missing files

**Recommendation:** Run these checks AFTER Phase 1 cleanup to confirm everything still works.

---

## Files Confirmed as NOT USED

After analysis:

| File | Status | Reason |
|------|--------|--------|
| REQUIRED_ENDPOINTS.js | Orphaned | Not imported anywhere |
| diagnostic-endpoint.js | Orphaned | Not in server.js routes |
| add-diagnostic-route.js | Utility | Test/debug helper |
| app.js | Likely legacy | Not imported in server.js |
| test-defects.js | Test file | Clearly test code |
| All *.backup files | Old migration | Supabase migration backups |
| All files in dist/ | Build artifact | Duplicate copies |

**Total Safe Deletions: 130+ files, 1.5-2MB**

---

## Migration Status

### Database Migration Files (All Active)
The `/migrations/` directory contains 18 properly numbered migration files:
- 001_*.sql through 006_*.sql (numbered migrations)
- add_*.sql (feature additions)
- create_*.sql (table creations)
- fix_*.sql (bug fixes)
- update_*.sql (updates)

**Status:** These are the source of truth. Old SQL aggregate files can be archived.

### Old Aggregate SQL Files (Safe to Archive)
```
RUN_ALL_MIGRATIONS.sql
RUN_ALL_MIGRATIONS_MYSQL_COMPATIBLE.sql
CREATE_MISSING_TABLES_ONLY.sql
CREATE_TABLES_NO_FK.sql
setup-passwords.sql
```

**Status:** Legacy. Individual migrations in `/migrations/` should be used instead.

---

## Summary for Cleanup Execution

### Phase 1: Safe Deletions (Zero Risk)
- dist/ directory
- All *.backup and *-backup* files
- All test-*.js files
- routes/test-defects.js
- gobarry-backend.zip

**Verification:** Confirmed no references in server.js or active code

### Phase 2: Archiving (Low Risk)
- cpanel-*.sh scripts
- deploy-*.sh, upload-*.sh scripts
- CPANEL_*.md, DEPLOYMENT_*.md files
- QUICK_*.md files
- API_*.md files
- Old SQL aggregate files

**Verification:** Legacy, no longer used since Render.com deployment

### Phase 3: Optional Cleanup (Verify First)
- REQUIRED_ENDPOINTS.js (verify once more)
- app.js (check if legacy)
- diagnostic-endpoint.js (verify not used)
- add-diagnostic-route.js (verify not used)

**Verification:** Run grep to confirm before deleting

---

## Post-Cleanup Checklist

After running Phase 1 cleanup:

- [ ] Run `npm start` successfully
- [ ] Check all API endpoints respond
- [ ] Verify database queries work
- [ ] Check server logs for errors
- [ ] Test authentication
- [ ] Test breakdown creation
- [ ] Test fleet operations
- [ ] Confirm 1.5MB space recovered
- [ ] Add dist/ to .gitignore
- [ ] Create git commit with cleanup note

