# Database Migration Deployment Checklist

## Pre-Deployment

### 1. Environment Verification
- [ ] Confirm Supabase project URL
- [ ] Locate service role key (not anon key!)
- [ ] Verify database access in Supabase dashboard
- [ ] Check current database schema (if updating existing system)

### 2. Backup (Production Only)
- [ ] Create database backup in Supabase (Dashboard → Database → Backups)
- [ ] Note backup timestamp
- [ ] Verify backup completed successfully

### 3. Review Migration Files
- [ ] Read `QUICK_START.md`
- [ ] Review `README.md`
- [ ] Understand each migration's purpose:
  - [ ] `verify-supervisors-table.sql` - Base table
  - [ ] `add-security-indexes.sql` - Performance
  - [ ] `create-audit-logs.sql` - Security tracking
  - [ ] `add-refresh-tokens.sql` - Token management

---

## Deployment Process

### Method: Supabase SQL Editor (Recommended)

#### Step 1: Open Supabase SQL Editor
- [ ] Go to: https://app.supabase.com/project/_/sql
- [ ] Create new query window

#### Step 2: Run Migration 1 - Supervisors Table
- [ ] Copy entire contents of `verify-supervisors-table.sql`
- [ ] Paste into SQL Editor
- [ ] Click "Run" (⌘/Ctrl + Enter)
- [ ] Verify: "Success. No rows returned" (or similar)
- [ ] **If errors occur**: Stop and investigate before continuing

#### Step 3: Run Migration 2 - Security Indexes
- [ ] Copy entire contents of `add-security-indexes.sql`
- [ ] Paste into SQL Editor
- [ ] Click "Run"
- [ ] Verify: "Success" message
- [ ] **If errors occur**: Check if indexes already exist (safe to ignore)

#### Step 4: Run Migration 3 - Audit Logs
- [ ] Copy entire contents of `create-audit-logs.sql`
- [ ] Paste into SQL Editor
- [ ] Click "Run"
- [ ] Verify: "Success" message
- [ ] **If errors occur**: Check error message, may need to drop and recreate

#### Step 5: Run Migration 4 - Refresh Tokens
- [ ] Copy entire contents of `add-refresh-tokens.sql`
- [ ] Paste into SQL Editor
- [ ] Click "Run"
- [ ] Verify: "Success" message
- [ ] **If errors occur**: Check error message

---

## Verification

### Immediate Verification (Run in SQL Editor)

#### 1. Check Supervisors Table
```sql
-- Should return 14 columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'supervisors'
ORDER BY ordinal_position;
```
- [ ] Verify 14 columns exist
- [ ] Verify `badge_number`, `password_hash`, `email` present
- [ ] Verify new columns: `last_login_at`, `failed_login_attempts`, `locked_until`, `password_changed_at`

#### 2. Check Indexes
```sql
-- Should return 8+ indexes for supervisors
SELECT indexname
FROM pg_indexes
WHERE tablename = 'supervisors'
ORDER BY indexname;
```
- [ ] Verify `idx_supervisors_badge_number` exists
- [ ] Verify `idx_supervisors_badge_active` exists
- [ ] Count total indexes (should be 8+)

#### 3. Check Audit Logs Table
```sql
-- Should return 0 rows (table exists but empty)
SELECT COUNT(*) FROM audit_logs;
```
- [ ] Query runs without error
- [ ] Returns count (even if 0)

#### 4. Check Refresh Tokens Table
```sql
-- Should return 0 rows (table exists but empty)
SELECT COUNT(*) FROM refresh_tokens;
```
- [ ] Query runs without error
- [ ] Returns count (even if 0)

#### 5. Test Audit Logging Function
```sql
-- Should return a log ID
SELECT log_security_event(
  'deployment_test',
  NULL,
  'DEPLOY',
  '127.0.0.1',
  'Migration Test',
  true,
  NULL,
  '{"migration_date": "2025-10-26"}'::jsonb
);
```
- [ ] Function executes successfully
- [ ] Returns integer ID

#### 6. View Test Audit Log
```sql
-- Should show the test event
SELECT * FROM audit_logs
WHERE event_type = 'deployment_test'
ORDER BY created_at DESC
LIMIT 1;
```
- [ ] Event appears in table
- [ ] All fields populated correctly

---

## Post-Deployment Testing

### 1. Backend Connection Test
```bash
cd backend
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
supabase.from('supervisors').select('count').single()
  .then(r => console.log('✅ Connected:', r))
  .catch(e => console.error('❌ Error:', e.message));
"
```
- [ ] Connection successful
- [ ] No authentication errors

### 2. Test Supervisor Authentication
- [ ] Attempt login with valid credentials
- [ ] Verify login succeeds
- [ ] Check `last_login_at` updated in database
- [ ] Verify audit log created for login

### 3. Test Audit Logging
- [ ] Perform action that should log (login, logout, etc.)
- [ ] Query `audit_logs` table
- [ ] Verify event recorded with correct details

### 4. Test Performance
```sql
-- Should complete in <10ms with indexes
EXPLAIN ANALYZE
SELECT * FROM supervisors
WHERE badge_number = 'AG003' AND is_active = true;
```
- [ ] Query uses index (not seq scan)
- [ ] Execution time < 10ms
- [ ] Plan shows "Index Scan"

---

## Documentation

### Update Project Documentation
- [ ] Add migration completion date to project log
- [ ] Document any issues encountered
- [ ] Update team on new security features
- [ ] Share audit logging capabilities with security team

### Update .env File (if needed)
- [ ] Confirm `SUPABASE_URL` is set
- [ ] Confirm `SUPABASE_SERVICE_KEY` is set
- [ ] Add `JWT_SECRET` if not present
- [ ] Add `JWT_REFRESH_SECRET` if not present

---

## Common Issues & Solutions

### Issue: "Permission denied for table supervisors"
**Solution**: Ensure using service_role key in Supabase SQL Editor (it's automatic)

### Issue: "Relation already exists"
**Solution**: Safe to ignore - migrations are idempotent

### Issue: "Column already exists"
**Solution**: Safe to ignore - migration checks for existing columns

### Issue: "Function exec_sql does not exist"
**Solution**: Use Supabase SQL Editor instead of migration script

### Issue: Slow query performance
**Solution**:
1. Run `ANALYZE supervisors;`
2. Verify indexes created with: `\d supervisors`
3. Check query plan with `EXPLAIN ANALYZE`

---

## Rollback Plan (Emergency Only)

**Only if catastrophic failure occurs**

```sql
-- 1. Drop new tables
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- 2. Drop indexes (performance impact, not critical)
DROP INDEX IF EXISTS idx_supervisors_badge_number CASCADE;
-- ... (see full list in MIGRATION_SUMMARY.md)

-- 3. Restore from backup
-- Use Supabase Dashboard → Database → Backups → Restore
```

**Note**: Rollback should be last resort. Most issues can be fixed forward.

---

## Success Criteria

Deployment is successful when:

- ✅ All 4 migrations executed without critical errors
- ✅ Verification queries pass
- ✅ Supervisors table has 14 columns
- ✅ 20+ indexes created across all tables
- ✅ Audit logs table exists and accepts inserts
- ✅ Refresh tokens table exists and accepts inserts
- ✅ Backend can connect and authenticate
- ✅ Login performance improved (should be faster)
- ✅ Test audit event created successfully

---

## Timeline

| Task | Estimated Time |
|------|----------------|
| Pre-deployment review | 10 minutes |
| Run migrations | 3 minutes |
| Verification queries | 5 minutes |
| Backend testing | 10 minutes |
| Documentation | 5 minutes |
| **Total** | **~30 minutes** |

---

## Sign-Off

### Deployment Information
- **Date Completed**: _________________
- **Performed By**: _________________
- **Environment**: ☐ Development ☐ Staging ☐ Production
- **Supabase Project**: _________________
- **Backup Timestamp**: _________________ (production only)

### Verification Sign-Off
- [ ] All migrations executed successfully
- [ ] All verification queries passed
- [ ] Backend authentication tested
- [ ] Audit logging tested
- [ ] Performance verified
- [ ] Documentation updated
- [ ] Team notified

### Issues Encountered
```
(Note any issues and resolutions here)








```

### Notes
```
(Additional deployment notes)








```

---

**Deployment Status**: ☐ Success ☐ Partial ☐ Failed ☐ Rolled Back

**Signature**: _________________ **Date**: _________________

---

## Next Steps After Deployment

1. **Monitor Performance**:
   - Check auth endpoint response times
   - Monitor database query performance
   - Watch for any errors in logs

2. **Implement Code Changes**:
   - Update auth middleware to use audit logging
   - Implement refresh token endpoints
   - Add account lockout logic
   - Track last_login_at

3. **Security Review**:
   - Review audit logs daily for first week
   - Check for unusual login patterns
   - Verify RLS policies working correctly

4. **Team Training**:
   - Share new security features
   - Demonstrate audit log queries
   - Explain refresh token flow
   - Document best practices

---

## Support Resources

- **Migration Documentation**: `backend/migrations/README.md`
- **Quick Start Guide**: `backend/migrations/QUICK_START.md`
- **Migration Summary**: `MIGRATION_SUMMARY.md` (project root)
- **Supabase Dashboard**: https://app.supabase.com
- **Supabase Docs**: https://supabase.com/docs

---

**Last Updated**: 2025-10-26
