# Quick Start: Database Migrations

## Run All Migrations (Recommended Method)

### Step 1: Go to Supabase SQL Editor
Open: https://app.supabase.com/project/_/sql

### Step 2: Run Migrations in Order

Copy and paste each SQL file in this order:

#### 1. Verify Supervisors Table ✅
```bash
# Copy from: verify-supervisors-table.sql
```
Creates/updates the base supervisors table with all required columns.

#### 2. Add Security Indexes ⚡
```bash
# Copy from: add-security-indexes.sql
```
Adds performance indexes for 50-100x faster authentication.

#### 3. Create Audit Logs 📋
```bash
# Copy from: create-audit-logs.sql
```
Enables security event tracking and compliance logging.

#### 4. Add Refresh Tokens 🔐
```bash
# Copy from: add-refresh-tokens.sql
```
Implements secure JWT token management with device tracking.

---

## Alternative: Command Line (Advanced)

### Prerequisites
```bash
# Add to .env file
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### Run
```bash
cd backend
node scripts/run-migrations.js
```

---

## Verification

After running all migrations, verify in Supabase SQL Editor:

```sql
-- Check supervisors table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'supervisors';

-- Check indexes (should see 8+ indexes)
SELECT indexname FROM pg_indexes
WHERE tablename = 'supervisors';

-- Verify audit logs
SELECT COUNT(*) FROM audit_logs;

-- Verify refresh tokens
SELECT COUNT(*) FROM refresh_tokens;
```

Expected Results:
- ✅ Supervisors table: 14 columns
- ✅ Supervisors indexes: 8 indexes
- ✅ Audit logs table: exists
- ✅ Refresh tokens table: exists

---

## Next Steps

After running migrations:

1. **Update Backend Code**: Use new security features
2. **Test Authentication**: Verify login works
3. **Enable Audit Logging**: Update auth middleware
4. **Implement Token Refresh**: Add refresh token endpoints

---

## Troubleshooting

**Q: Migration fails with permission error?**
A: Ensure you're using service_role key in Supabase SQL Editor (automatic) or .env file.

**Q: Table already exists error?**
A: Safe to ignore - migrations are idempotent (can run multiple times).

**Q: Want to start fresh?**
A: See "Rollback Instructions" in main README.md

---

## Time Estimate

Running all 4 migrations: **~2-3 minutes**

Each migration runs in seconds, but allow time for:
- Copying SQL
- Running in SQL Editor
- Verification queries

---

## Get Help

- See full documentation: `migrations/README.md`
- Check backend logs for errors
- Review audit_logs table for security events
