# Database Migration Scripts

This directory contains scripts for migrating the Go BARRY Breakdown Management System from Supabase to cPanel MySQL/PostgreSQL.

## Available Scripts

### 1. migrate-supabase-to-cpanel.js

**Main migration script** - Exports all data from Supabase and generates SQL files for import to cPanel.

**Usage:**
```bash
# Full migration (recommended)
node backend/scripts/migrate-supabase-to-cpanel.js

# Export specific tables only
node backend/scripts/migrate-supabase-to-cpanel.js --tables=supervisors,breakdowns

# Test with limited records
node backend/scripts/migrate-supabase-to-cpanel.js --limit=100

# Generate PostgreSQL-compatible SQL
node backend/scripts/migrate-supabase-to-cpanel.js --format=postgres

# Dry run (preview only, no files created)
node backend/scripts/migrate-supabase-to-cpanel.js --dry-run

# Skip certain tables
node backend/scripts/migrate-supabase-to-cpanel.js --skip=activities,engineers
```

**Output Files:**
- `migrations/migration-data-[timestamp].sql` - SQL INSERT statements
- `migrations/migration-data-[timestamp].json` - JSON backup
- `migrations/migration-report-[timestamp].txt` - Migration summary

**Options:**
- `--tables=table1,table2` - Export specific tables only
- `--skip=table1,table2` - Skip specific tables
- `--limit=N` - Limit records per table (for testing)
- `--format=mysql|postgres` - Output format (default: mysql)
- `--dry-run` - Preview without creating files

---

### 2. export-schema-from-supabase.js

**Schema export script** - Generates CREATE TABLE statements for cPanel database setup.

**Usage:**
```bash
node backend/scripts/export-schema-from-supabase.js
```

**Output:**
- `migrations/schema-export-[timestamp].sql` - Table schemas and indexes

**When to use:**
- Before importing data (need tables first)
- When recreating database structure
- For documentation purposes

---

## Migration Workflow

### Step-by-Step Process

1. **Export Schema (Optional)**
   ```bash
   node backend/scripts/export-schema-from-supabase.js
   ```
   Creates table structure in cPanel database.

2. **Export Data**
   ```bash
   node backend/scripts/migrate-supabase-to-cpanel.js
   ```
   Exports all data from Supabase.

3. **Review Output**
   - Check `migrations/migration-report-*.txt` for summary
   - Verify record counts match expectations
   - Review any warnings or errors

4. **Import to cPanel**
   - Method A: phpMyAdmin Import
   - Method B: MySQL command line
   - Method C: Split import for large files

5. **Verify Import**
   - Check record counts in cPanel database
   - Test application with new database
   - Verify data integrity

6. **Update Application**
   - Update `backend/.env` with cPanel credentials
   - Replace Supabase queries with native SQL
   - Test all critical features

---

## Output Directory

All generated files are saved to:
```
backend/scripts/migrations/
```

**File Types:**
- `*.sql` - SQL scripts for import
- `*.json` - JSON backups
- `*.txt` - Reports and summaries

**Naming Convention:**
- `migration-data-2025-10-14T19-30-00.sql`
- `schema-export-2025-10-14T19-30-00.sql`
- `migration-report-2025-10-14T19-30-00.txt`

---

## Prerequisites

### Environment Variables

Required in `backend/.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key  # Recommended for export
```

### Node.js Packages

All required packages are already installed:
- `@supabase/supabase-js` - Supabase client
- `dotenv` - Environment variables

For post-migration:
- `mysql2` - MySQL driver (install: `npm install mysql2`)
- `pg` - PostgreSQL driver (already installed)

---

## Tables Exported

The migration includes these tables:

1. **supervisors** - User accounts and authentication
2. **breakdowns** - Breakdown records and history
3. **engineers** - Engineering staff information
4. **wizard_progress** - Assessment workflow data
5. **fleet_vehicles** - Vehicle fleet database
6. **user_preferences** - User settings
7. **notification_preferences** - Notification configs
8. **activities** - Activity logs and audit trail

---

## Common Issues

### Export Fails

**Issue**: "SUPABASE_URL not found"
```bash
# Solution: Check .env file exists and has correct values
cat backend/.env | grep SUPABASE
```

**Issue**: "Access denied"
```bash
# Solution: Use service key instead of anon key
SUPABASE_SERVICE_KEY=your_service_key_here
```

### Import Fails

**Issue**: "MySQL server has gone away"
```bash
# Solution: Split large SQL file
split -b 100M migration-data.sql part-
# Import each part separately
```

**Issue**: "Table doesn't exist"
```bash
# Solution: Create schema first
node backend/scripts/export-schema-from-supabase.js
# Import schema before data
```

**Issue**: "Foreign key constraint fails"
```sql
-- Solution: Disable checks temporarily
SET FOREIGN_KEY_CHECKS=0;
-- Import data
SET FOREIGN_KEY_CHECKS=1;
```

---

## Documentation

Comprehensive guides available:

- **`/MIGRATION_GUIDE.md`** - Complete step-by-step migration guide
- **`MIGRATION_QUICK_START.md`** - Quick reference for experienced developers
- **`/backend/config/database-cpanel.js`** - Database connection helper with examples

---

## Support

For issues or questions:

1. Review migration report for specific errors
2. Check MIGRATION_GUIDE.md for troubleshooting
3. Test on staging database first
4. Contact: Anthony Gair (developer)

---

## Version History

- **v1.0.0** (2025-10-14) - Initial release
  - Full data export from Supabase
  - MySQL and PostgreSQL support
  - Automatic report generation
  - Schema export utility

---

**Last Updated**: October 14, 2025
**Maintained By**: Anthony Gair
