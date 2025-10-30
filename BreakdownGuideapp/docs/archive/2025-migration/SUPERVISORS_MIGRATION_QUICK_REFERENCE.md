# Supervisors Migration Quick Reference

---

## ⚠️ **LEGACY DOCUMENTATION - MIGRATION COMPLETE** ⚠️

**This document describes the Supabase → MySQL migration process.**

**Migration Status:** ✅ **COMPLETE** (October 2025)

**Current System:**
- ✅ Authentication: JWT + bcrypt (backend)
- ✅ Database: MySQL (cPanel)
- ✅ No Supabase dependencies
- ✅ See: `PHASE1_CLEANUP_COMPLETE.md` and `PHASE2_CLEANUP_COMPLETE.md`

**This document kept for historical reference only.**

**Last Updated:** October 27, 2025

---

## What Changed

### Before (Supabase)
```javascript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const { data, error } = await supabase
  .from('supervisors')
  .select('*')
  .eq('is_active', true);
```

### After (MySQL)
```javascript
import { from } from '../utils/queryHelpers.js';

const { data, error } = await from('supervisors')
  .select('id, email, name, badge_number, depot, role, is_active, ...')
  .eq('is_active', true)
  .execute();  // Note: .execute() required
```

## Files

- **Backup:** `/backend/routes/supervisors.js.backup-supabase`
- **Active:** `/backend/routes/supervisors.js`
- **Summary:** `/SUPERVISORS_MYSQL_MIGRATION_SUMMARY.md`

## All Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/supervisors` | GET | List all supervisors (with filters) |
| `/api/supervisors/:id` | GET | Get single supervisor |
| `/api/supervisors/:id/stats` | GET | Get performance stats |
| `/api/supervisors/by-badge/:badge` | GET | Lookup by badge |
| `/api/supervisors/depot/:depot` | GET | List by depot |
| `/api/supervisors/search?q=...` | GET | Search supervisors |
| `/api/supervisors/role/:role` | GET | Filter by role |
| `/api/supervisors/pending` | GET | Pending approvals |

## Testing Commands

```bash
# Start backend
cd backend
npm run dev

# Test in another terminal
curl http://localhost:3000/api/supervisors
curl http://localhost:3000/api/supervisors/search?q=Anthony
curl http://localhost:3000/api/supervisors/depot/Washington
curl http://localhost:3000/api/supervisors/role/admin
```

## Security Notes

- **password_hash** is NEVER returned in API responses
- All SELECT queries explicitly list columns (no SELECT *)
- Parameterized queries prevent SQL injection
- Active status filtering by default

## Rollback

```bash
cp backend/routes/supervisors.js.backup-supabase backend/routes/supervisors.js
# Then restart server
```

## Status: COMPLETED ✅

All endpoints migrated and tested. No breaking changes to API contract.
