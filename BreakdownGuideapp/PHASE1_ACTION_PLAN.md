# Phase 1 Supabase Cleanup - Action Plan

**Status:** Ready for execution
**Estimated Time:** 2-3 hours
**Risk Level:** LOW

---

## 🎯 Execution Order (MUST follow this order)

### Step 1: Update 16 Files to Remove Supabase Imports ⏱️ 2-3 hours

**CRITICAL:** Must do this FIRST, before deleting files!

#### Group A: Service Files (7 files)

1. **frontend/src/services/auth-service.js**
   - Remove: `import { supabase, authHelpers, supabaseHelpers } from './supabase-client.js';`
   - Action: Use backend API calls only

2. **frontend/src/services/enhanced-auth-service.js**
   - Remove: `import { supabase } from './supabase-client.js';`
   - Action: Use backend API calls only

3. **frontend/src/services/security-service.js**
   - Remove: `import { supabase } from './supabase-client.js'`
   - Action: Use backend API calls only

4. **frontend/src/services/activityRealtimeService.js**
   - Remove: `import { supabase } from './supabase-client.js';`
   - Action: Check if realtime needed, use WebSocket or polling instead

5. **frontend/src/services/assessmentBroadcaster.js**
   - Remove: `import { supabase } from './supabase-client.js';`
   - Action: Use WebSocket or polling instead

6. **frontend/src/services/assessmentProgressService.js**
   - Remove: `import { supabase } from './supabase-client.js';`
   - Action: Use backend API calls only

7. **frontend/src/utils/secureApiClient.js**
   - Remove: `import { supabase } from '../services/supabase-client.js';`
   - Action: Use backend API calls only

#### Group B: Breakdown Guide Files (3 files)

8. **frontend/src/breakdown-guide/auth/authService.js**
   - Remove: `import { authHelpers, supabase } from '../../services/supabase-client.js';`
   - Action: Use backend API calls only

9. **frontend/src/breakdown-guide/components/Step7Submit.jsx**
   - Remove: `import { authHelpers } from '../../services/supabase-client';`
   - Action: Use backend API calls only

10. **frontend/src/breakdown-guide/supervisorBreakdownLogger.js**
    - Remove: `const { supabase } = await import('../services/supabase-client.js');`
    - Action: Use backend API calls only

#### Group C: Components (2 files)

11. **frontend/src/components/HeaderLogin.jsx**
    - Remove: `import { authHelpers, supabase } from '../services/supabase-client.js';`
    - Action: Use backend API calls only

12. **frontend/src/components/SupabaseDebug.jsx**
    - Remove: `import { supabase } from '../services/supabase-client.js';`
    - Action: **DELETE THIS FILE** (debug component not needed)

#### Group D: Other Files (4 files)

13. **frontend/src/dashboards/engineering/EngineeringDashboard.jsx**
    - Remove: `import { supabase } from '../../services/supabase-client';`
    - Action: Use backend API calls only

14. **frontend/src/hooks/useAssessmentData.js**
    - Remove: `import { supabase } from '../services/supabase-client';`
    - Action: Use backend API calls only

15. **frontend/src/tests/authentication.test.js**
    - Remove: `import { supabase } from '../services/supabase-client.js';`
    - Action: Update tests to use mock backend API

16. **frontend/src/breakdown-guide/components/SupabaseDebug.jsx**
    - Remove: `import { supabase } from '../../services/supabase-client.js';`
    - Action: **DELETE THIS FILE** (debug component not needed)

---

### Step 2: Update Files Importing Supabase Components ⏱️ 10 minutes

17. **frontend/src/breakdown-guide/components/SupervisorLogin.jsx**
    - Remove: `import SupabaseDebug from './SupabaseDebug.jsx';`
    - Action: Remove any usage of SupabaseDebug component

18. **frontend/src/breakdown-guide/App.jsx**
    - Remove: `import SupabaseLogin from './components/SupabaseLogin.jsx';`
    - Action: Remove any usage of SupabaseLogin component

---

### Step 3: Delete 5 Supabase Files ⏱️ 5 minutes

**ONLY after Step 1 & 2 are complete!**

```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp

rm frontend/src/services/supabase-client.js
rm frontend/src/services/supabase-integration-service.js
rm frontend/src/breakdown-guide/components/SupabaseLogin.jsx
rm frontend/src/breakdown-guide/components/SupabaseDebug.jsx
rm frontend/src/components/SupabaseDebug.jsx
```

---

### Step 4: Remove Package Dependencies ⏱️ 5 minutes

```bash
# Frontend
cd frontend
npm uninstall @supabase/supabase-js

# Backend
cd ../backend
npm uninstall @supabase/supabase-js

# Rebuild
cd ../frontend
npm install
npm run build
```

---

### Step 5: Update Backend Env Fallbacks ⏱️ 5 minutes

**File 1:** `backend/routes/auth.js:26`
```javascript
// Change this line:
const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;

// To:
const JWT_SECRET = process.env.JWT_SECRET;
```

**File 2:** `backend/middleware/authMiddleware.js:13`
```javascript
// Change this line:
const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;

// To:
const JWT_SECRET = process.env.JWT_SECRET;
```

---

### Step 6: Update Frontend .env.example ⏱️ 5 minutes

**File:** `frontend/.env.example`

```bash
# Find these lines:
VITE_SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
VITE_SUPABASE_ANON_KEY=...

# Replace with:
# ═══════════════════════════════════════════════════════════════
# LEGACY SUPABASE CONFIGURATION (SYSTEM MIGRATED TO MYSQL)
# ═══════════════════════════════════════════════════════════════
# Migration Date: October 2025
# Old Database: Supabase PostgreSQL
# New Database: MySQL via cPanel
#
# VITE_SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
# VITE_SUPABASE_ANON_KEY=... (commented out, no longer used)
```

---

### Step 7: Run Verification Tests ⏱️ 15 minutes

```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp

# Test 1: No Supabase imports in active code
echo "Test 1: Checking for Supabase imports..."
grep -r "from '@supabase" frontend/src/ --include="*.js" --include="*.jsx" | grep -v node_modules
# Expected: No results

# Test 2: No supabase-client imports
echo "Test 2: Checking for supabase-client imports..."
grep -r "supabase-client" frontend/src/ --include="*.js" --include="*.jsx" | grep -v node_modules | grep import
# Expected: No results

# Test 3: No Supabase dependencies
echo "Test 3: Checking package.json..."
grep -i supabase frontend/package.json backend/package.json
# Expected: No results

# Test 4: Frontend builds
echo "Test 4: Building frontend..."
cd frontend
npm install
npm run build
# Expected: Build succeeds

# Test 5: Backend starts
echo "Test 5: Starting backend..."
cd ../backend
npm run dev
# Expected: Server starts on port 3001

# Test 6: Count remaining references
echo "Test 6: Counting remaining references..."
cd ..
grep -r -i "supabase" . --include="*.js" --include="*.jsx" | grep -v node_modules | grep -v .backup | grep -v migration | grep -v documentation_backup | wc -l
# Expected: Much lower than 557
```

---

## 📋 Checklist

Print this and check off as you go:

```
Phase 1 Completion Checklist
────────────────────────────────────────────────────────────

STEP 1: UPDATE FILES (2-3 hours)
□ auth-service.js
□ enhanced-auth-service.js
□ security-service.js
□ activityRealtimeService.js
□ assessmentBroadcaster.js
□ assessmentProgressService.js
□ secureApiClient.js
□ breakdown-guide/auth/authService.js
□ breakdown-guide/components/Step7Submit.jsx
□ breakdown-guide/supervisorBreakdownLogger.js
□ components/HeaderLogin.jsx
□ components/SupabaseDebug.jsx (DELETE)
□ dashboards/engineering/EngineeringDashboard.jsx
□ hooks/useAssessmentData.js
□ tests/authentication.test.js
□ breakdown-guide/components/SupabaseDebug.jsx (DELETE)

STEP 2: UPDATE COMPONENT IMPORTS (10 minutes)
□ breakdown-guide/components/SupervisorLogin.jsx
□ breakdown-guide/App.jsx

STEP 3: DELETE FILES (5 minutes)
□ Delete supabase-client.js
□ Delete supabase-integration-service.js
□ Delete SupabaseLogin.jsx
□ Delete SupabaseDebug.jsx (breakdown-guide)
□ Delete SupabaseDebug.jsx (components)

STEP 4: REMOVE DEPENDENCIES (5 minutes)
□ Uninstall from frontend
□ Uninstall from backend
□ npm install (frontend)
□ npm install (backend)

STEP 5: UPDATE BACKEND (5 minutes)
□ Fix backend/routes/auth.js
□ Fix backend/middleware/authMiddleware.js

STEP 6: UPDATE .ENV (5 minutes)
□ Update frontend/.env.example

STEP 7: VERIFICATION TESTS (15 minutes)
□ Test 1: No Supabase imports
□ Test 2: No supabase-client imports
□ Test 3: No package dependencies
□ Test 4: Frontend builds
□ Test 5: Backend starts
□ Test 6: Reference count reduced

────────────────────────────────────────────────────────────
✓ PHASE 1 COMPLETE!
```

---

## 🚨 Common Patterns to Replace

### Pattern 1: Supabase Auth
```javascript
// ❌ OLD
import { supabase } from './supabase-client.js';
const { data, error } = await supabase.auth.getUser();

// ✅ NEW
import apiClient from './apiClient.js';
const { data, error } = await apiClient.get('/api/supervisor/me');
```

### Pattern 2: Supabase Query
```javascript
// ❌ OLD
import { supabase } from './supabase-client.js';
const { data, error } = await supabase
  .from('supervisors')
  .select('*')
  .eq('badge', badge);

// ✅ NEW
import apiClient from './apiClient.js';
const { data, error } = await apiClient.get(`/api/supervisors?badge=${badge}`);
```

### Pattern 3: Supabase Insert
```javascript
// ❌ OLD
import { supabase } from './supabase-client.js';
const { data, error } = await supabase
  .from('assessments')
  .insert({ ...assessment });

// ✅ NEW
import apiClient from './apiClient.js';
const { data, error } = await apiClient.post('/api/assessments', assessment);
```

### Pattern 4: Supabase Update
```javascript
// ❌ OLD
import { supabase } from './supabase-client.js';
const { data, error } = await supabase
  .from('supervisors')
  .update({ status: 'active' })
  .eq('id', id);

// ✅ NEW
import apiClient from './apiClient.js';
const { data, error } = await apiClient.put(`/api/supervisors/${id}`, { status: 'active' });
```

### Pattern 5: Supabase Realtime
```javascript
// ❌ OLD
import { supabase } from './supabase-client.js';
const channel = supabase
  .channel('assessments')
  .on('postgres_changes', { event: '*', schema: 'public' }, handleChange)
  .subscribe();

// ✅ NEW
// Option A: Use backend WebSocket
import { io } from 'socket.io-client';
const socket = io(API_URL);
socket.on('assessment:update', handleChange);

// Option B: Use polling
setInterval(async () => {
  const { data } = await apiClient.get('/api/assessments');
  handleChange(data);
}, 5000);
```

---

## 💡 Tips

1. **Work in batches:** Fix all service files first, then components, etc.
2. **Test incrementally:** After each file, check if app still runs
3. **Use search & replace:** Many imports are identical
4. **Comment out first:** Don't delete code immediately, comment it out
5. **Git commits:** Commit after each group is complete
6. **Keep notes:** Track any weird edge cases you find

---

## 🆘 If Something Breaks

### Frontend won't build
```bash
# Check for syntax errors
cd frontend
npm run build 2>&1 | grep -A5 "error"

# Common issues:
# - Missing import (add apiClient)
# - Undefined variable (from removed supabase)
# - Component not found (deleted Supabase component)
```

### Backend won't start
```bash
# Check for missing JWT_SECRET
cd backend
cat .env | grep JWT_SECRET

# If missing, add to .env:
echo "JWT_SECRET=your-secret-key-here" >> .env
```

### Tests fail
```bash
# Update test mocks
# Replace Supabase mocks with API mocks
```

---

## 📊 Success Criteria

✅ Phase 1 is complete when:

1. All 16 files no longer import supabase-client
2. All 5 Supabase files deleted
3. No @supabase/* dependencies in package.json
4. No SUPABASE_* fallbacks in backend code
5. Frontend builds without errors
6. Backend starts without errors
7. Reference count < 100 (down from 557)

---

**Created:** October 27, 2025
**Ready for:** Immediate execution
**Estimated completion:** 2-3 hours
