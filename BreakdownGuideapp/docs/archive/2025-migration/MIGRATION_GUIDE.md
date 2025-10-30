# Supabase to cPanel Database Migration Guide

---

## ⚠️ **LEGACY DOCUMENTATION - SUPABASE MIGRATION** ⚠️

**This document describes the OLD architecture using Supabase.**

**System Status:** ✅ **Migrated to MySQL (October 2025)**

**Current Information:**
- ✅ Database: MySQL (cPanel)
- ✅ Authentication: JWT + bcrypt
- ✅ Real-time: Native WebSocket (ws library)
- ✅ Deployment: cPanel self-hosted

**For current documentation, see:**
- Main Guide: `docs/CPANEL_ONLY_DEPLOYMENT_GUIDE.md`
- Quick Start: `docs/CPANEL_QUICK_START_10MIN.md`
- Master Index: `docs/MASTER_CPANEL_DOCUMENTATION_INDEX.md`

**Last Updated:** October 27, 2025 - Supabase fully removed

---

Complete step-by-step guide for migrating the Go BARRY Breakdown Management System from Supabase to cPanel MySQL/PostgreSQL.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Pre-Migration Checklist](#pre-migration-checklist)
4. [Export from Supabase](#export-from-supabase)
5. [Prepare cPanel Database](#prepare-cpanel-database)
6. [Import to cPanel](#import-to-cpanel)
7. [Verify Migration](#verify-migration)
8. [Update Application](#update-application)
9. [Rollback Procedures](#rollback-procedures)
10. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
11. [Performance Optimization](#performance-optimization)
12. [Security Considerations](#security-considerations)

---

## Overview

This guide covers migrating all application data from Supabase (PostgreSQL) to a cPanel-hosted database (MySQL or PostgreSQL).

### What Gets Migrated

The following tables will be exported and imported:

- **supervisors** - User accounts and authentication data
- **breakdowns** - Breakdown records and history
- **engineers** - Engineering staff information
- **wizard_progress** - Assessment workflow data
- **fleet_vehicles** - Vehicle fleet database
- **user_preferences** - User settings and preferences
- **notification_preferences** - Notification configurations
- **activities** - Activity logs and audit trail

### Estimated Time

- Small database (< 1,000 records): 15-30 minutes
- Medium database (1,000-10,000 records): 30-60 minutes
- Large database (> 10,000 records): 1-2 hours

---

## Prerequisites

### Required Software

- Node.js 18+ installed on your local machine
- Access to Supabase dashboard
- cPanel access with database management privileges
- Terminal/command line access

### Required Information

Gather the following before starting:

#### Supabase Credentials
- **Supabase URL**: `https://your-project.supabase.co`
- **Supabase Anon Key** or **Service Key** (service key recommended)
- Available in: Supabase Dashboard → Settings → API

#### cPanel Database Credentials
- **Database Host**: Usually `localhost` or `server-name.com`
- **Database Name**: Your cPanel database name
- **Database Username**: Your cPanel database user
- **Database Password**: Your database password
- **Port**: Usually `3306` for MySQL, `5432` for PostgreSQL

### Access Requirements

- **Supabase**: Read access to all tables
- **cPanel**: Database create/import privileges
- **Local**: Write access to create migration files

---

## Pre-Migration Checklist

Complete these steps before starting migration:

### 1. Backup Current Data

```bash
# Backup Supabase data via dashboard
# Settings → Database → Backup → Create Backup

# Or use pg_dump if you have direct access
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > supabase-backup.sql
```

### 2. Document Current State

- [ ] Record current record counts for all tables
- [ ] List all active user sessions
- [ ] Document any scheduled jobs or cron tasks
- [ ] Note current application version

### 3. Notify Users

- [ ] Schedule maintenance window (recommended: off-peak hours)
- [ ] Notify all supervisors and users
- [ ] Prepare status page or notification message
- [ ] Set up communication channel for issues

### 4. Test Environment

- [ ] Create staging/test cPanel database
- [ ] Test import process on staging first
- [ ] Verify application works with new database
- [ ] Test all critical workflows

### 5. Prepare Rollback Plan

- [ ] Keep Supabase database active during testing
- [ ] Document steps to revert to Supabase
- [ ] Prepare emergency contact list
- [ ] Create rollback checklist

---

## Export from Supabase

### Step 1: Set Up Environment Variables

Create or update `backend/.env` with Supabase credentials:

```bash
# backend/.env
SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here  # Recommended for export
```

**Security Note**: Use Service Key for exports as it has full read access. Never commit these keys to version control.

### Step 2: Run Migration Script

Navigate to your project root and run the export:

```bash
# Full export (all tables, all records)
node backend/scripts/migrate-supabase-to-cpanel.js

# Export specific tables only
node backend/scripts/migrate-supabase-to-cpanel.js --tables=supervisors,breakdowns,fleet_vehicles

# Test export with limited records
node backend/scripts/migrate-supabase-to-cpanel.js --limit=100

# Generate PostgreSQL-compatible SQL (if cPanel uses PostgreSQL)
node backend/scripts/migrate-supabase-to-cpanel.js --format=postgres

# Dry run (preview without creating files)
node backend/scripts/migrate-supabase-to-cpanel.js --dry-run

# Skip certain tables
node backend/scripts/migrate-supabase-to-cpanel.js --skip=activities,engineers
```

### Step 3: Review Generated Files

The script creates three files in `backend/scripts/migrations/`:

```
migrations/
├── migration-data-2025-10-14T19-30-00.sql      # SQL INSERT statements
├── migration-data-2025-10-14T19-30-00.json     # JSON backup
└── migration-report-2025-10-14T19-30-00.txt    # Migration report
```

**Review the report** to:
- Verify record counts match expectations
- Check for any export errors
- Note any warnings or recommendations

### Step 4: Validate Export Data

```bash
# Check SQL file size (should not be empty)
ls -lh backend/scripts/migrations/migration-data-*.sql

# Verify JSON structure
cat backend/scripts/migrations/migration-data-*.json | jq '.metadata'

# Count INSERT statements
grep -c "INSERT INTO" backend/scripts/migrations/migration-data-*.sql
```

---

## Prepare cPanel Database

### Step 1: Log into cPanel

1. Navigate to your cPanel URL
2. Log in with your credentials
3. Find **MySQL Databases** or **PostgreSQL Databases** section

### Step 2: Create Database

**For MySQL:**

1. In MySQL Databases section:
   - **New Database**: `gobarry_breakdown` (or your preferred name)
   - Click **Create Database**
   - Note the full database name (may have prefix like `username_gobarry_breakdown`)

2. Create database user:
   - **Username**: `gobarry_user`
   - **Password**: Generate strong password
   - Click **Create User**

3. Add user to database:
   - Select database: `gobarry_breakdown`
   - Select user: `gobarry_user`
   - Check **ALL PRIVILEGES**
   - Click **Make Changes**

**For PostgreSQL:**

1. In PostgreSQL Databases section:
   - **Database Name**: `gobarry_breakdown`
   - Click **Create Database**

2. Create user and grant privileges:
   - **Username**: `gobarry_user`
   - **Password**: Generate strong password
   - Grant all privileges on database

### Step 3: Create Database Schema

You need to create tables before importing data. Choose one method:

#### Option A: Export Schema from Supabase

1. Go to Supabase Dashboard → SQL Editor
2. Run this query to get CREATE TABLE statements:

```sql
SELECT
  'CREATE TABLE ' || table_name || ' (' ||
  string_agg(
    column_name || ' ' || data_type ||
    CASE WHEN character_maximum_length IS NOT NULL
      THEN '(' || character_maximum_length || ')'
      ELSE ''
    END,
    ', '
  ) || ');'
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'supervisors', 'breakdowns', 'engineers',
    'wizard_progress', 'fleet_vehicles',
    'user_preferences', 'notification_preferences',
    'activities'
  )
GROUP BY table_name;
```

3. Copy the CREATE TABLE statements
4. Run them in your cPanel database

#### Option B: Use Application Schema File

If your project has a schema file (e.g., `database-schema.sql`):

```bash
# Import via phpMyAdmin or command line
mysql -u username -p database_name < database-schema.sql
```

#### Option C: Manual Table Creation

Create tables based on this structure (adjust data types for MySQL if needed):

```sql
-- Supervisors table
CREATE TABLE supervisors (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  badge_number VARCHAR(50),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Breakdowns table
CREATE TABLE breakdowns (
  id VARCHAR(255) PRIMARY KEY,
  supervisor_id VARCHAR(255) NOT NULL,
  fleet_no VARCHAR(50) NOT NULL,
  issue_type VARCHAR(100),
  location TEXT,
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id)
);

-- Engineers table
CREATE TABLE engineers (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  specialization VARCHAR(100),
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wizard Progress table
CREATE TABLE wizard_progress (
  id VARCHAR(255) PRIMARY KEY,
  supervisor_id VARCHAR(255) NOT NULL,
  wizard_type VARCHAR(100) NOT NULL,
  current_step INT DEFAULT 0,
  data JSON,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id)
);

-- Fleet Vehicles table
CREATE TABLE fleet_vehicles (
  id VARCHAR(255) PRIMARY KEY,
  fleet_no VARCHAR(50) UNIQUE NOT NULL,
  vehicle_type VARCHAR(100),
  depot VARCHAR(100),
  registration VARCHAR(50),
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  year_of_manufacture INT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Preferences table
CREATE TABLE user_preferences (
  id VARCHAR(255) PRIMARY KEY,
  supervisor_id VARCHAR(255) UNIQUE NOT NULL,
  theme VARCHAR(50) DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  preferences JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id)
);

-- Notification Preferences table
CREATE TABLE notification_preferences (
  id VARCHAR(255) PRIMARY KEY,
  supervisor_id VARCHAR(255) NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id)
);

-- Activities table
CREATE TABLE activities (
  id VARCHAR(255) PRIMARY KEY,
  supervisor_id VARCHAR(255),
  activity_type VARCHAR(100) NOT NULL,
  description TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id)
);

-- Create indexes for performance
CREATE INDEX idx_breakdowns_supervisor ON breakdowns(supervisor_id);
CREATE INDEX idx_breakdowns_status ON breakdowns(status);
CREATE INDEX idx_breakdowns_created ON breakdowns(created_at);
CREATE INDEX idx_wizard_progress_supervisor ON wizard_progress(supervisor_id);
CREATE INDEX idx_activities_supervisor ON activities(supervisor_id);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_fleet_vehicles_fleet_no ON fleet_vehicles(fleet_no);
```

**Note**: Adjust data types for MySQL vs PostgreSQL:
- PostgreSQL: Use `SERIAL` for auto-increment, `JSONB` for JSON
- MySQL: Use `AUTO_INCREMENT`, `JSON` or `TEXT` for JSON data

---

## Import to cPanel

### Method 1: phpMyAdmin (Recommended for < 100MB files)

1. **Access phpMyAdmin**:
   - cPanel → phpMyAdmin
   - Select your database from left sidebar

2. **Import Data**:
   - Click **Import** tab at top
   - Click **Choose File**
   - Select `migration-data-[timestamp].sql`
   - **Format**: Auto-detect (SQL)
   - **Character set**: utf8mb4 (recommended)
   - **Partial import**: Check if file is large
   - **Max execution time**: Increase if available (300 seconds)

3. **Execute Import**:
   - Click **Go** button at bottom
   - Wait for completion (may take several minutes)
   - Review success/error messages

4. **Common Import Settings**:
   ```
   Format: SQL
   Compression: None
   Character set: utf8mb4_unicode_ci
   SQL compatibility mode: NONE
   ```

### Method 2: MySQL Command Line (Recommended for > 100MB files)

**Via SSH (if enabled in cPanel):**

```bash
# Connect to your server via SSH
ssh username@yourserver.com

# Navigate to home directory
cd ~

# Upload SQL file (via SCP from local machine)
scp backend/scripts/migrations/migration-data-*.sql username@yourserver.com:~/

# Import to MySQL
mysql -u username -p database_name < migration-data-[timestamp].sql

# Enter password when prompted
```

**For large files, use split import:**

```bash
# Split SQL file into smaller chunks (100MB each)
split -b 100M migration-data-[timestamp].sql migration-part-

# Import each part sequentially
for file in migration-part-*; do
  echo "Importing $file..."
  mysql -u username -p database_name < "$file"
done
```

### Method 3: PostgreSQL Command Line

```bash
# Connect via SSH
ssh username@yourserver.com

# Import to PostgreSQL
psql -U username -d database_name -f migration-data-[timestamp].sql

# Or with connection string
psql "postgresql://username:password@localhost/database_name" < migration-data-[timestamp].sql
```

### Method 4: Split Import for Very Large Databases

If import times out or fails:

1. **Split SQL file by table**:

```bash
# Create separate file for each table
grep -B1 "INSERT INTO \`supervisors\`" migration-data-*.sql > import-supervisors.sql
grep -B1 "INSERT INTO \`breakdowns\`" migration-data-*.sql > import-breakdowns.sql
# Repeat for each table...
```

2. **Import each table individually**:
   - Smaller files are less likely to timeout
   - Can retry individual tables if they fail
   - Better progress tracking

### Monitoring Import Progress

**MySQL:**
```sql
-- In another MySQL session, check progress
SELECT
  table_name,
  table_rows
FROM information_schema.tables
WHERE table_schema = 'your_database_name';
```

**PostgreSQL:**
```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

---

## Verify Migration

### Step 1: Verify Record Counts

Compare record counts between export report and imported database:

```sql
-- Get counts for all tables
SELECT 'supervisors' as table_name, COUNT(*) as count FROM supervisors
UNION ALL
SELECT 'breakdowns', COUNT(*) FROM breakdowns
UNION ALL
SELECT 'engineers', COUNT(*) FROM engineers
UNION ALL
SELECT 'wizard_progress', COUNT(*) FROM wizard_progress
UNION ALL
SELECT 'fleet_vehicles', COUNT(*) FROM fleet_vehicles
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM user_preferences
UNION ALL
SELECT 'notification_preferences', COUNT(*) FROM notification_preferences
UNION ALL
SELECT 'activities', COUNT(*) FROM activities;
```

Compare these counts with the migration report file.

### Step 2: Verify Data Integrity

```sql
-- Check for orphaned records (foreign key issues)
SELECT COUNT(*)
FROM breakdowns b
LEFT JOIN supervisors s ON b.supervisor_id = s.id
WHERE s.id IS NULL;

-- Should return 0 if all foreign keys are valid

-- Check for NULL values in required fields
SELECT COUNT(*) FROM supervisors WHERE email IS NULL;
SELECT COUNT(*) FROM breakdowns WHERE fleet_no IS NULL;

-- Verify date ranges
SELECT
  MIN(created_at) as earliest,
  MAX(created_at) as latest,
  COUNT(*) as total
FROM breakdowns;
```

### Step 3: Test Sample Queries

```sql
-- Test join operations
SELECT
  b.id,
  b.fleet_no,
  s.name as supervisor_name,
  b.status,
  b.created_at
FROM breakdowns b
JOIN supervisors s ON b.supervisor_id = s.id
ORDER BY b.created_at DESC
LIMIT 10;

-- Test JSON fields (if using JSON columns)
SELECT
  id,
  JSON_EXTRACT(preferences, '$.theme') as theme
FROM user_preferences
LIMIT 5;

-- Verify unique constraints
SELECT email, COUNT(*)
FROM supervisors
GROUP BY email
HAVING COUNT(*) > 1;
```

### Step 4: Verify Application Functionality

1. **Update database configuration** (see next section)
2. **Start application** in test mode
3. **Test critical workflows**:
   - [ ] User login/authentication
   - [ ] View breakdown list
   - [ ] Create new breakdown
   - [ ] Search fleet vehicles
   - [ ] View activity logs
   - [ ] Update user preferences

4. **Check for errors**:
   - Review application logs
   - Monitor browser console
   - Test API endpoints
   - Verify data displays correctly

---

## Update Application

### Step 1: Update Backend Configuration

Edit `backend/.env` with new cPanel database credentials:

```bash
# backend/.env

# Database Configuration
DB_TYPE=mysql  # or postgres
DB_HOST=localhost  # or your cPanel server
DB_PORT=3306  # 3306 for MySQL, 5432 for PostgreSQL
DB_NAME=username_gobarry_breakdown  # Include cPanel prefix if required
DB_USER=username_gobarry_user
DB_PASSWORD=your_secure_password

# Supabase (keep for reference, but update code to use DB_* vars)
# SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
# SUPABASE_ANON_KEY=...
```

### Step 2: Update Database Connection Code

If your application uses Supabase client, you'll need to switch to native MySQL/PostgreSQL:

**Install database driver:**

```bash
cd backend
npm install mysql2  # for MySQL
# or
npm install pg      # for PostgreSQL (already installed)
```

**Create database connection helper** (`backend/config/database.js`):

```javascript
import mysql from 'mysql2/promise';
// or
import pg from 'pg';

// MySQL
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// PostgreSQL
// const { Pool } = pg;
// export const pool = new Pool({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT || 5432,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   max: 10
// });

// Test connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}
```

### Step 3: Update Query Functions

Replace Supabase queries with native SQL:

**Before (Supabase):**
```javascript
const { data, error } = await supabase
  .from('breakdowns')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false });
```

**After (MySQL/PostgreSQL):**
```javascript
import { pool } from './config/database.js';

const [rows] = await pool.execute(
  'SELECT * FROM breakdowns WHERE status = ? ORDER BY created_at DESC',
  ['active']
);
```

### Step 4: Update Authentication

If using Supabase Auth, implement alternative:

**Options:**
1. **JWT-based auth** (recommended)
2. **Passport.js** with local strategy
3. **Custom session management**

**Example JWT implementation:**

```javascript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from './config/database.js';

export async function login(email, password) {
  // Get user from database
  const [users] = await pool.execute(
    'SELECT * FROM supervisors WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = users[0];

  // Verify password (assumes passwords are hashed)
  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    throw new Error('Invalid credentials');
  }

  // Generate JWT
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return { user, token };
}
```

### Step 5: Test Application

1. **Start backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Check startup logs** for:
   - ✅ Database connected successfully
   - ✅ Server listening on port 3001
   - ❌ Any connection errors

3. **Test API endpoints**:
   ```bash
   # Health check
   curl http://localhost:3001/api/health

   # Test database query
   curl http://localhost:3001/api/breakdowns
   ```

4. **Start frontend** and test full workflows

### Step 6: Deploy Updated Application

1. **Commit changes**:
   ```bash
   git add .
   git commit -m "Migrate from Supabase to cPanel database"
   git push
   ```

2. **Deploy to cPanel**:
   - Upload updated backend code
   - Update `.env` with production credentials
   - Restart Node.js application
   - Test production deployment

---

## Rollback Procedures

If migration fails or issues are found:

### Emergency Rollback (Immediate)

1. **Revert backend .env**:
   ```bash
   # Restore Supabase credentials
   SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
   SUPABASE_ANON_KEY=your_original_key
   ```

2. **Restart application**:
   ```bash
   # Restart with original configuration
   npm run start
   ```

3. **Verify Supabase is working**:
   - Test user login
   - Verify data access
   - Check all critical features

### Planned Rollback (After Testing)

If issues are found during testing phase:

1. **Document issues** encountered
2. **Stop application** using cPanel database
3. **Revert code changes**:
   ```bash
   git revert HEAD
   git push
   ```
4. **Update .env** to Supabase credentials
5. **Redeploy** application
6. **Notify users** of rollback
7. **Analyze issues** before retry

### Data Rollback

If data needs to be reverted in cPanel database:

```sql
-- Drop all imported data
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE activities;
TRUNCATE TABLE notification_preferences;
TRUNCATE TABLE user_preferences;
TRUNCATE TABLE wizard_progress;
TRUNCATE TABLE breakdowns;
TRUNCATE TABLE engineers;
TRUNCATE TABLE fleet_vehicles;
TRUNCATE TABLE supervisors;
SET FOREIGN_KEY_CHECKS=1;
```

**Warning**: This permanently deletes all data. Only use if certain data is corrupted.

---

## Common Issues & Troubleshooting

### Import Errors

#### Issue: "MySQL server has gone away"

**Cause**: Import file too large or timeout

**Solutions**:
```bash
# Increase MySQL timeout in cPanel or my.cnf
max_allowed_packet=256M
wait_timeout=600

# Or split SQL file and import in batches
split -l 50000 migration-data.sql migration-part-
```

#### Issue: "Duplicate entry for key 'PRIMARY'"

**Cause**: Primary key conflict, data already exists

**Solutions**:
1. Drop and recreate tables
2. Use `INSERT IGNORE` instead of `INSERT` (edit SQL file)
3. Truncate tables before import:
   ```sql
   TRUNCATE TABLE table_name;
   ```

#### Issue: "Unknown column in field list"

**Cause**: Schema mismatch between export and cPanel

**Solutions**:
1. Verify schema matches Supabase
2. Check column names and data types
3. Review CREATE TABLE statements
4. Update SQL file if needed

#### Issue: Foreign key constraint fails

**Cause**: Referenced parent record doesn't exist

**Solutions**:
```sql
-- Temporarily disable foreign key checks
SET FOREIGN_KEY_CHECKS=0;
-- Import data
-- Re-enable checks
SET FOREIGN_KEY_CHECKS=1;
```

### Connection Errors

#### Issue: "Access denied for user"

**Cause**: Wrong credentials or insufficient privileges

**Solutions**:
1. Verify credentials in cPanel
2. Check user has ALL PRIVILEGES on database
3. Confirm host is correct (`localhost` vs IP)
4. Test connection:
   ```bash
   mysql -u username -p -h localhost database_name
   ```

#### Issue: "Can't connect to MySQL server"

**Cause**: MySQL service not running or firewall

**Solutions**:
1. Check MySQL is running in cPanel
2. Verify port is open (3306 for MySQL)
3. Check firewall rules
4. Try `127.0.0.1` instead of `localhost`

### Performance Issues

#### Issue: Slow queries after migration

**Cause**: Missing indexes

**Solutions**:
```sql
-- Add indexes for common queries
CREATE INDEX idx_breakdowns_supervisor ON breakdowns(supervisor_id);
CREATE INDEX idx_breakdowns_status ON breakdowns(status);
CREATE INDEX idx_breakdowns_created ON breakdowns(created_at DESC);

-- Check query performance
EXPLAIN SELECT * FROM breakdowns WHERE status = 'active';
```

#### Issue: High memory usage

**Cause**: Large result sets, connection pooling

**Solutions**:
1. Implement pagination
2. Limit result sets with `LIMIT`
3. Adjust connection pool size
4. Use streaming for large queries

### Data Issues

#### Issue: Timestamps are wrong timezone

**Cause**: Timezone mismatch between Supabase and cPanel

**Solutions**:
```sql
-- Set timezone for MySQL
SET time_zone = '+00:00';

-- Convert timestamps during import
UPDATE breakdowns
SET created_at = CONVERT_TZ(created_at, '+00:00', 'Europe/London');
```

#### Issue: JSON fields not working

**Cause**: MySQL version too old or wrong data type

**Solutions**:
```sql
-- Check MySQL version (needs 5.7+ for JSON)
SELECT VERSION();

-- Convert TEXT to JSON
ALTER TABLE user_preferences
MODIFY COLUMN preferences JSON;

-- For older MySQL, query as TEXT and parse in application
```

#### Issue: Special characters corrupted

**Cause**: Character encoding mismatch

**Solutions**:
```sql
-- Set correct character set
ALTER DATABASE database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Convert table
ALTER TABLE table_name CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Application Errors

#### Issue: "Table doesn't exist"

**Cause**: Case sensitivity differences (Linux vs Windows)

**Solutions**:
```bash
# Check MySQL case sensitivity
SHOW VARIABLES LIKE 'lower_case_table_names';

# Use consistent case in all queries
# Linux: tables are case-sensitive
# Windows: tables are case-insensitive
```

#### Issue: Authentication fails after migration

**Cause**: Password hashing differences or missing auth table

**Solutions**:
1. Verify supervisor records imported
2. Check password hash format matches
3. Reset passwords if needed:
   ```bash
   node backend/scripts/reset-barry-password.js
   ```

#### Issue: Real-time features not working

**Cause**: Supabase real-time replaced, need alternative

**Solutions**:
1. Implement WebSocket server
2. Use polling for updates
3. Implement server-sent events (SSE)
4. Consider Redis pub/sub

---

## Performance Optimization

### After Migration Optimizations

#### 1. Optimize Indexes

```sql
-- Analyze table usage
SELECT * FROM information_schema.statistics
WHERE table_schema = 'your_database';

-- Add composite indexes for common queries
CREATE INDEX idx_breakdown_supervisor_status
ON breakdowns(supervisor_id, status);

CREATE INDEX idx_activities_supervisor_date
ON activities(supervisor_id, created_at DESC);

-- Remove unused indexes
DROP INDEX idx_rarely_used ON table_name;
```

#### 2. Update Statistics

```sql
-- MySQL
ANALYZE TABLE breakdowns;
ANALYZE TABLE supervisors;
ANALYZE TABLE activities;

-- PostgreSQL
VACUUM ANALYZE breakdowns;
VACUUM ANALYZE supervisors;
VACUUM ANALYZE activities;
```

#### 3. Configure Connection Pooling

```javascript
// backend/config/database.js
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,        // Adjust based on traffic
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  waitForConnections: true
});
```

#### 4. Implement Query Caching

```javascript
// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

export async function getCachedBreakdowns() {
  const cacheKey = 'active_breakdowns';
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const [rows] = await pool.execute(
    'SELECT * FROM breakdowns WHERE status = "active"'
  );

  cache.set(cacheKey, {
    data: rows,
    timestamp: Date.now()
  });

  return rows;
}
```

#### 5. Optimize Large Table Queries

```sql
-- Partition large tables by date
ALTER TABLE activities
PARTITION BY RANGE (YEAR(created_at)) (
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Archive old data
CREATE TABLE activities_archive LIKE activities;
INSERT INTO activities_archive
SELECT * FROM activities
WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

DELETE FROM activities
WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

---

## Security Considerations

### Post-Migration Security Checklist

- [ ] **Change all database passwords** after migration
- [ ] **Revoke Supabase access** if no longer needed
- [ ] **Update firewall rules** to restrict database access
- [ ] **Enable SSL/TLS** for database connections
- [ ] **Set up database backups** in cPanel (daily recommended)
- [ ] **Implement prepared statements** (prevent SQL injection)
- [ ] **Limit database user privileges** to minimum required
- [ ] **Monitor database access logs** for suspicious activity
- [ ] **Update environment variables** in production (never commit)
- [ ] **Enable query logging** temporarily to catch issues

### Secure Database Configuration

```sql
-- Create read-only user for reporting
CREATE USER 'gobarry_readonly'@'localhost'
IDENTIFIED BY 'secure_password';

GRANT SELECT ON gobarry_breakdown.*
TO 'gobarry_readonly'@'localhost';

-- Limit connections per user
ALTER USER 'gobarry_user'@'localhost'
WITH MAX_USER_CONNECTIONS 10;

-- Enable audit logging
SET GLOBAL general_log = 'ON';
SET GLOBAL general_log_file = '/var/log/mysql/query.log';
```

### Connection Security

```javascript
// Use SSL for database connections
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-cert.pem')
  }
});
```

---

## Support and Resources

### Documentation

- [cPanel Database Documentation](https://docs.cpanel.net/cpanel/databases/)
- [MySQL Reference Manual](https://dev.mysql.com/doc/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js mysql2 Package](https://www.npmjs.com/package/mysql2)

### Getting Help

1. **Check migration report** for warnings and errors
2. **Review application logs** for specific error messages
3. **Test on staging** before production migration
4. **Contact cPanel support** for hosting-specific issues
5. **Consult database administrator** for complex queries

### Emergency Contacts

Prepare this list before migration:

- **Database Administrator**: ___________________
- **cPanel Support**: ___________________
- **Application Developer**: Anthony Gair
- **Go North East IT**: ___________________

---

## Maintenance After Migration

### Regular Tasks

**Daily:**
- [ ] Monitor application logs for database errors
- [ ] Check database connection pool status
- [ ] Verify backups completed successfully

**Weekly:**
- [ ] Review slow query log
- [ ] Check database disk space
- [ ] Test backup restoration
- [ ] Update indexes if needed

**Monthly:**
- [ ] Analyze table statistics
- [ ] Archive old data
- [ ] Review and optimize queries
- [ ] Update database documentation

### Backup Strategy

```bash
# Automated daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/username/backups"

mysqldump -u username -p'password' database_name \
  | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Add to cPanel cron jobs: Daily at 2 AM
# 0 2 * * * /home/username/scripts/backup.sh
```

---

## Conclusion

This migration guide provides comprehensive instructions for moving from Supabase to cPanel.

**Key Takeaways:**
- ✅ Always test on staging first
- ✅ Keep multiple backups before and after
- ✅ Verify data integrity thoroughly
- ✅ Monitor performance after migration
- ✅ Have rollback plan ready
- ✅ Update all documentation

For questions or issues not covered in this guide, please contact the development team or consult the resources section above.

**Last Updated**: October 14, 2025
**Version**: 1.0.0
**Maintained By**: Anthony Gair

---
