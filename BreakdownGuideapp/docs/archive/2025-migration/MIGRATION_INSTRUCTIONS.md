# Activities Table Migration Instructions

---

## ⚠️ **LEGACY DOCUMENTATION WARNING** ⚠️

**This document is OUTDATED and maintained for historical reference only.**

**Migration Status:** **COMPLETE** - System migrated from Supabase to MySQL (October 27, 2025)

**Current Information:**
- ✅ **Database:** MySQL (cPanel)
- ✅ **Activities Table:** Created in MySQL schema
- ✅ **Migration Files:** Located in `backend/migrations/` (MySQL compatible)
- ✅ **Deployment Guide:** See `docs/CPANEL_ONLY_DEPLOYMENT_GUIDE.md`

**What changed:**
- ❌ **Supabase PostgreSQL** → ✅ **MySQL** (cPanel)
- ❌ **Supabase SQL Editor** → ✅ **phpMyAdmin** (cPanel)
- ❌ **Row Level Security (RLS)** → ✅ **Application-level security** (JWT)

**For MySQL Database Setup:**
1. Access phpMyAdmin via cPanel
2. Import schema: `backend/migrations/complete_schema.sql`
3. All tables including `activities` are included
4. No separate migration needed for MySQL deployment

**Last Updated:** October 27, 2025 - MySQL migration complete

---

## Historical Context (LEGACY - Supabase Migration)

**Original Date:** October 4, 2025
**Issue:** Activity feed not syncing because `activities` table doesn't exist in Supabase
**Migration File:** `backend/migrations/create_activities_table.sql` (Supabase version)

**NOTE:** The information below describes the OLD Supabase migration. This is kept for historical reference only.

---

## 🚨 CRITICAL: Database Migration Required (LEGACY)

The activity feed sync issue is caused by a **missing database table**. The backend is trying to write activities to the `activities` table, but it doesn't exist!

### What's Broken:
- ❌ Activity Logger Service writes to non-existent `activities` table
- ❌ Activity Feed API reads from non-existent `activities` table
- ✅ Breakdown resolution writes to JSON file (temporary workaround)
- ❌ JSON file data not accessible by Activity Feed API

### What This Migration Fixes:
- ✅ Creates `activities` table in Supabase
- ✅ Adds performance indexes
- ✅ Sets up Row Level Security
- ✅ Enables Activity Logger Service to work
- ✅ Allows Activity Feed API to read activities
- ✅ Enables real-time activity sync across all screens

---

## 📋 Step-by-Step Instructions

### Option 1: Supabase Dashboard (Recommended)

**Step 1:** Go to Supabase SQL Editor
```
https://supabase.com/dashboard/project/oieliubbvvdzhzvikzal/sql
```

**Step 2:** Copy the entire migration SQL
```bash
cat backend/migrations/create_activities_table.sql
```

**Step 3:** Paste into SQL Editor and click "Run"

**Step 4:** Verify Success
You should see:
```
✅ Activities table created successfully
📊 Indexes created for performance
🔒 Row Level Security policies applied
📝 Ready to log activities to database
```

**Step 5:** Verify Table Exists
Run this query:
```sql
SELECT COUNT(*) FROM activities;
```

Should return: `0` (table exists but is empty)

### Option 2: Command Line (Advanced)

**Requirements:**
- PostgreSQL client (`psql`) installed
- Supabase database password

**Command:**
```bash
PGPASSWORD='StaffordPark45!' psql \
  "postgresql://postgres:StaffordPark45!@db.oieliubbvvdzhzvikzal.supabase.co:5432/postgres" \
  -f backend/migrations/create_activities_table.sql
```

**Verify:**
```bash
PGPASSWORD='StaffordPark45!' psql \
  "postgresql://postgres:StaffordPark45!@db.oieliubbvvdzhzvikzal.supabase.co:5432/postgres" \
  -c "SELECT COUNT(*) FROM activities;"
```

---

## ✅ After Migration: What to Do Next

### ❌ DO NOT PUSH TO RENDER YET

The migration creates the table, but the code still needs updates to use it properly.

### Next Steps (in order):

**1. Apply the migration** (above instructions)

**2. Verify Activity Logger works locally:**
```bash
cd backend
npm run dev

# Watch logs for:
# ✅ Activity Logger Service initialized
```

**3. Test activity logging:**
- Open SDC Dashboard: http://localhost:5173/dashboards/sdc
- Resolve a breakdown
- Check backend logs for: `📝 Activity logged: breakdown_resolved by...`

**4. Verify database insert:**
```sql
SELECT * FROM activities ORDER BY created_at DESC LIMIT 5;
```

Should show the resolution activity!

**5. Test Activity Feed API:**
```bash
curl http://localhost:3001/api/activity/feed
```

Should return activities from the database.

**6. If all tests pass, THEN push to Render:**
```bash
git add .
git commit -m "fix: Create activities table migration for activity feed sync

- Add create_activities_table.sql migration
- Fixes activity feed not showing resolved breakdowns
- Enables Activity Logger Service to persist to database
- Adds Row Level Security policies
- Related to ACTIVITY_FEED_SYNC_ISSUE.md"

git push breakdown main
```

---

## 🧪 Testing Checklist

After applying migration:

- [ ] Migration applied successfully (no errors)
- [ ] Table exists: `SELECT COUNT(*) FROM activities;` returns 0
- [ ] Indexes created: `\d activities` shows 6+ indexes
- [ ] RLS enabled: `\d activities` shows "Policies"
- [ ] Activity Logger initializes: Backend logs show "✅ Activity Logger Service initialized"
- [ ] Breakdown resolution creates activity: Database shows new row in `activities`
- [ ] Activity Feed API returns data: `GET /api/activity/feed` returns activities
- [ ] Frontend activity feed updates: SDC Dashboard shows resolved breakdown in feed

---

## 🔍 Troubleshooting

### Error: "relation activities already exists"
**Cause:** Table already exists
**Solution:** Drop and recreate:
```sql
DROP TABLE IF EXISTS activities CASCADE;
-- Then run the migration again
```

### Error: "permission denied"
**Cause:** Wrong database user or password
**Solution:** Use service role key from `.env` file

### Activity Logger shows "waiting for Supabase client"
**Cause:** Supabase client not initialized
**Solution:** Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`

### Activity Feed still empty after migration
**Cause:** Code still writing to JSON file instead of database
**Solution:** Need to update `breakdownsAPI.js` to use Activity Logger (see ACTIVITY_FEED_SYNC_ISSUE.md)

### Activities not appearing in frontend
**Cause:** Missing WebSocket `activity_created` event
**Solution:** Need to add WebSocket broadcast (see ACTIVITY_FEED_SYNC_ISSUE.md)

---

## 📊 Migration Impact

**Before Migration:**
```
Breakdown Resolved
    ↓
Write to activities.json ✅
    ↓
WebSocket: breakdown_resolved ✅
    ↓
Frontend: Remove breakdown ✅
    ↓
Activity Feed API: Read from database ❌ (table doesn't exist)
    ↓
Activity Feed: Empty ❌
```

**After Migration:**
```
Breakdown Resolved
    ↓
Activity Logger → activities table ✅
    ↓
WebSocket: breakdown_resolved ✅
    ↓
Frontend: Remove breakdown ✅
    ↓
Activity Feed API: Read from database ✅
    ↓
Activity Feed: Shows activity ✅
```

---

## 🔗 Related Documentation

- **Root Cause Analysis:** `ACTIVITY_FEED_SYNC_ISSUE.md`
- **Migration File:** `backend/migrations/create_activities_table.sql`
- **Activity Logger:** `backend/services/activityLogger.js`
- **System Status:** `SYSTEM_STATUS.md` (updated with this fix)

---

## ⏱️ Estimated Time

- **Migration:** 2-5 minutes
- **Testing:** 10-15 minutes
- **Code updates (if needed):** 30-60 minutes
- **Deployment:** 5-10 minutes

**Total:** ~1 hour

---

## ✅ Success Criteria

Migration is successful when:

1. ✅ `activities` table exists in Supabase
2. ✅ Backend logs show "Activity Logger Service initialized"
3. ✅ Resolving a breakdown creates a row in `activities` table
4. ✅ Activity Feed API returns activities from database
5. ✅ Frontend activity feed displays resolved breakdowns
6. ✅ All screens sync in real-time

---

**Next Action:** Apply the migration to Supabase using Option 1 (Dashboard) above.

After migration succeeds, the Activity Logger will automatically start working!
