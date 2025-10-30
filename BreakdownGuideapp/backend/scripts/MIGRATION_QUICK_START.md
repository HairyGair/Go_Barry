# Migration Quick Start Guide

Fast-track guide for experienced developers. For detailed instructions, see `/MIGRATION_GUIDE.md`.

## Quick Steps

### 1. Export from Supabase (5 minutes)

```bash
# Set environment variables in backend/.env
SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here

# Run export
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp
node backend/scripts/migrate-supabase-to-cpanel.js

# Output files will be in:
# backend/scripts/migrations/
```

### 2. Create cPanel Database (10 minutes)

```
1. cPanel → MySQL Databases
2. Create database: gobarry_breakdown
3. Create user: gobarry_user
4. Grant ALL PRIVILEGES
5. Note credentials
```

### 3. Import Schema (5 minutes)

Use one of these methods to create tables:

**Option A - Export from Supabase:**
```sql
-- In Supabase SQL Editor, export table definitions
-- Copy CREATE TABLE statements to cPanel phpMyAdmin
```

**Option B - Use schema file if available:**
```bash
mysql -u username -p database_name < schema.sql
```

**Option C - See full table definitions in `/MIGRATION_GUIDE.md`**

### 4. Import Data (15 minutes)

**Small files (< 100MB):**
```
1. cPanel → phpMyAdmin
2. Select database
3. Import tab
4. Choose migration-data-*.sql
5. Click Go
```

**Large files (> 100MB):**
```bash
# Via SSH
mysql -u username -p database_name < migration-data-[timestamp].sql
```

### 5. Verify (10 minutes)

```sql
-- Check record counts
SELECT 'supervisors', COUNT(*) FROM supervisors
UNION ALL SELECT 'breakdowns', COUNT(*) FROM breakdowns
UNION ALL SELECT 'fleet_vehicles', COUNT(*) FROM fleet_vehicles;

-- Compare with migration report
```

### 6. Update Application (15 minutes)

Edit `backend/.env`:

```bash
# Database Configuration
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=username_gobarry_breakdown
DB_USER=username_gobarry_user
DB_PASSWORD=your_password_here
```

Update database connection code:

```javascript
// backend/config/database.js
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});
```

Replace Supabase queries with native SQL:

```javascript
// Before
const { data } = await supabase.from('breakdowns').select('*');

// After
const [rows] = await pool.execute('SELECT * FROM breakdowns');
```

### 7. Test (10 minutes)

```bash
# Start server
npm run dev

# Test endpoints
curl http://localhost:3001/api/health
curl http://localhost:3001/api/breakdowns

# Test in browser
# - Login
# - View breakdowns
# - Create test breakdown
```

---

## Command Reference

```bash
# Full export (all tables, all records)
node backend/scripts/migrate-supabase-to-cpanel.js

# Export specific tables
node backend/scripts/migrate-supabase-to-cpanel.js --tables=supervisors,breakdowns

# Test with limited records
node backend/scripts/migrate-supabase-to-cpanel.js --limit=100

# PostgreSQL format
node backend/scripts/migrate-supabase-to-cpanel.js --format=postgres

# Dry run (no files created)
node backend/scripts/migrate-supabase-to-cpanel.js --dry-run

# Skip tables
node backend/scripts/migrate-supabase-to-cpanel.js --skip=engineers,activities
```

---

## Common Issues

**"MySQL server has gone away"**
```bash
# Split large file
split -b 100M migration-data.sql part-
# Import each part
```

**"Access denied"**
```bash
# Verify credentials
mysql -u username -p -h localhost database_name
```

**"Table doesn't exist"**
```sql
-- Create schema first, then import data
```

**Foreign key errors**
```sql
-- Disable temporarily during import
SET FOREIGN_KEY_CHECKS=0;
-- Import data here
SET FOREIGN_KEY_CHECKS=1;
```

---

## Rollback

If issues occur:

```bash
# 1. Stop application
# 2. Restore backend/.env with Supabase credentials
# 3. Restart application
# 4. Verify Supabase connection works
```

---

## Files Generated

```
backend/scripts/migrations/
├── migration-data-[timestamp].sql      # SQL INSERT statements
├── migration-data-[timestamp].json     # JSON backup
└── migration-report-[timestamp].txt    # Summary report
```

---

## Checklist

Before migration:
- [ ] Backup Supabase data
- [ ] Test on staging database
- [ ] Notify users of maintenance
- [ ] Document current record counts

During migration:
- [ ] Export from Supabase
- [ ] Create cPanel database
- [ ] Import schema
- [ ] Import data
- [ ] Verify record counts

After migration:
- [ ] Update application .env
- [ ] Replace Supabase queries
- [ ] Test all critical features
- [ ] Monitor logs for errors
- [ ] Set up automated backups

---

## Timeline

- **Preparation**: 30 minutes
- **Export**: 5 minutes
- **Database setup**: 15 minutes
- **Import**: 15-60 minutes (depending on size)
- **Verification**: 15 minutes
- **Code updates**: 30-60 minutes
- **Testing**: 30 minutes

**Total: 2-4 hours**

---

For detailed instructions, troubleshooting, and best practices, see the full guide:
**`/MIGRATION_GUIDE.md`**
