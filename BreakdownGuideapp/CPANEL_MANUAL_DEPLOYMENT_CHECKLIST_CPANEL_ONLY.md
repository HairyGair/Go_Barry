# cPanel Manual Deployment Checklist - Go BARRY Breakdown Management System

**Version:** 2.0.0
**Last Updated:** October 27, 2025
**Deployment Target:** breakdowns.gobarry.co.uk
**System:** React Frontend + Node.js Backend + MySQL Database

---

## Table of Contents

1. [Pre-Deployment Verification](#1-pre-deployment-verification)
2. [Database Migration & Setup](#2-database-migration--setup)
3. [Backend Deployment](#3-backend-deployment)
4. [Frontend Deployment](#4-frontend-deployment)
5. [Apache Configuration](#5-apache-configuration)
6. [Node.js Application Setup](#6-nodejs-application-setup)
7. [SSL Certificate Verification](#7-ssl-certificate-verification)
8. [Post-Deployment Testing](#8-post-deployment-testing)
9. [Rollback Procedures](#9-rollback-procedures)
10. [Troubleshooting Guide](#10-troubleshooting-guide)

---

## Critical Information

### Deployment URLs
- **Production Frontend:** https://breakdowns.gobarry.co.uk
- **Backend API:** https://breakdowns.gobarry.co.uk/api
- **Control Room Display:** https://breakdowns.gobarry.co.uk/dashboards/control-room-display.html

### System Requirements
- **Backend:** Node.js 18+ with Express.js
- **Database:** MySQL 8.0+ (cPanel hosted)
- **Frontend:** Static React build (Vite)
- **Memory:** 512MB minimum for Node.js app
- **SSL:** Required for all endpoints

### Known Constraints
- **165+ API Endpoints** must be accessible
- **5 WebSocket Channels** for real-time updates
- **13 Active Supervisors** with badge-based auth
- **4 Primary Database Tables** + supporting tables
- **cPanel Memory Limits:** 512MB-2GB depending on hosting plan

---

## 1. Pre-Deployment Verification

**Duration:** 15-20 minutes
**Critical:** These checks prevent deployment failures

### 1.1 Local Build Testing

#### Step 1: Build Frontend Locally
```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/frontend
npm run build:cpanel
```

**Expected Output:**
```
vite v5.0.8 building for production...
✓ 2287 modules transformed.
dist/index.html                   12.45 kB │ gzip:  4.21 kB
dist/assets/index-abc123.js      234.56 kB │ gzip: 89.23 kB
dist/assets/index-def456.css      45.67 kB │ gzip: 12.34 kB

✓ built in 45.23s
✓ Build complete! Upload dist/ folder to cPanel.
```

**Verification:**
```bash
# Check build output
ls -lh dist/
# Should see: index.html, assets/, .htaccess

# Verify .htaccess exists
cat dist/.htaccess
# Should contain React Router rewrite rules
```

**What to do if it fails:**
- Check Node.js version: `node --version` (must be ≥18)
- Clear cache: `npm run clean && npm install`
- Check for errors in console output
- Verify `.env` file has correct API URL

**Time:** 3-5 minutes

---

#### Step 2: Build Backend Locally
```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/backend
npm install --production
node index.js
```

**Expected Output:**
```
🚀 Backend server running on port 3001
✓ Database connection established
✓ 14 route modules loaded
✓ WebSocket server initialized
Ready to accept connections
```

**Verification:**
```bash
# Test health endpoint
curl http://localhost:3001/api/health
# Expected: {"status":"healthy","timestamp":"..."}

# Count route files
find routes -name "*.js" | wc -l
# Expected: 14 files
```

**What to do if it fails:**
- Missing dependencies: `npm install`
- Port conflict: Change PORT in .env
- Database error: Check DB credentials
- Module errors: Check for syntax errors

**Time:** 2-3 minutes

---

### 1.2 Environment Configuration Check

#### Step 3: Verify Backend .env File
```bash
cd backend
cat .env.example
```

**Required Variables:**
```bash
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gobarryco_breakdowns
DB_USER=gobarryco_breakdowns_user
DB_PASSWORD=<strong_password>
API_BASE_URL=https://breakdowns.gobarry.co.uk/api
APP_URL=https://breakdowns.gobarry.co.uk
ALLOWED_ORIGINS=https://breakdowns.gobarry.co.uk,https://gobarry.co.uk
SESSION_SECRET=<generate_random_64_char_string>
JWT_SECRET=<generate_random_64_char_string>
```

**Generate Secrets:**
```bash
# Generate session secret
openssl rand -base64 64
# Generate JWT secret
openssl rand -base64 64
```

**Verification Checklist:**
- [ ] All required variables present
- [ ] No placeholder values (no "your_*" or "change_in_production")
- [ ] URLs use HTTPS (not HTTP)
- [ ] Database credentials match cPanel MySQL setup
- [ ] Secrets are truly random (not reused from examples)

**What to do if missing:**
- Copy from `.env.example`: `cp .env.example .env`
- Fill in production values
- Store secrets in password manager

**Time:** 5 minutes

---

#### Step 4: Verify Frontend .env File
```bash
cd frontend
cat .env.example
```

**Required Variables:**
```bash
VITE_API_URL=https://breakdowns.gobarry.co.uk
VITE_API_BASE_URL=https://breakdowns.gobarry.co.uk/api
VITE_APP_URL=https://breakdowns.gobarry.co.uk
VITE_WS_URL=wss://breakdowns.gobarry.co.uk
VITE_ENABLE_AUTH=true
VITE_ENABLE_PWA=true
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG_MODE=false
```

**Verification Checklist:**
- [ ] All API URLs point to production domain
- [ ] WebSocket uses wss:// (not ws://)
- [ ] Auth enabled (VITE_ENABLE_AUTH=true)
- [ ] Mock data disabled (VITE_ENABLE_MOCK_DATA=false)
- [ ] Debug mode disabled in production

**Time:** 2 minutes

---

### 1.3 Git Repository Status

#### Step 5: Verify Clean Git State
```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp
git status
```

**Expected:**
```
On branch main
Your branch is up to date with 'breakdown/main'.

nothing to commit, working tree clean
```

**If uncommitted changes exist:**
```bash
# Review changes
git diff

# Commit if desired
git add .
git commit -m "Pre-deployment commit - [describe changes]"

# Or stash changes
git stash save "Pre-deployment stash"
```

**Verify which remote you're on:**
```bash
git remote -v
# Should show 'breakdown' remote pointing to Breakdown_Guide repo
```

**Time:** 2 minutes

---

### 1.4 Backup Current Production

#### Step 6: Backup Existing Files
**Via cPanel File Manager:**
1. Login to cPanel: https://gobarry.co.uk/cpanel
2. Navigate to File Manager
3. Select `/public_html/` directory
4. Click "Compress"
5. Create zip: `backup_breakdowns_YYYYMMDD_HHMMSS.zip`
6. Download to local machine

**Via SSH (if available):**
```bash
ssh user@gobarry.co.uk
cd ~/public_html/
tar -czf ~/backups/backup_$(date +%Y%m%d_%H%M%S).tar.gz .
```

**Verification:**
- [ ] Backup file created successfully
- [ ] Backup size is reasonable (should be 50-200MB)
- [ ] Downloaded to safe location
- [ ] Backup includes both frontend and backend

**Time:** 5 minutes

---

#### Step 7: Backup Database
**Via cPanel phpMyAdmin:**
1. Open phpMyAdmin from cPanel
2. Select database: `gobarryco_breakdowns`
3. Click "Export" tab
4. Select "Quick" export method
5. Format: SQL
6. Click "Go"
7. Save file: `db_backup_YYYYMMDD_HHMMSS.sql`

**Via MySQL Command (if SSH available):**
```bash
mysqldump -u gobarryco_breakdowns_user -p gobarryco_breakdowns > \
  ~/backups/db_backup_$(date +%Y%m%d_%H%M%S).sql
```

**Verification:**
- [ ] SQL file downloaded
- [ ] File size > 0 bytes
- [ ] Contains CREATE TABLE statements
- [ ] Contains INSERT statements with data

**What to do if it fails:**
- Increase PHP execution time in cPanel
- Export table-by-table if database is large
- Use mysqldump command line tool

**Time:** 5-10 minutes

---

## 2. Database Migration & Setup

**Duration:** 20-30 minutes
**Critical:** Database must be correct before deploying code

### 2.1 MySQL Database Creation

#### Step 8: Create Database via cPanel
1. Login to cPanel
2. Navigate to "MySQL Databases"
3. Create database:
   - Database name: `gobarryco_breakdowns`
   - Click "Create Database"
4. Create user:
   - Username: `gobarryco_breakdowns_user`
   - Password: Generate strong password (20+ chars)
   - Click "Create User"
5. Add user to database:
   - User: `gobarryco_breakdowns_user`
   - Database: `gobarryco_breakdowns`
   - Privileges: ALL PRIVILEGES
   - Click "Add"

**Verification:**
```bash
# Test connection via cPanel Terminal
mysql -u gobarryco_breakdowns_user -p gobarryco_breakdowns -e "SELECT 1;"
# Should return: 1
```

**What to do if it fails:**
- Check username format (cPanel adds prefix: `cpanelusername_dbname`)
- Verify privileges were granted
- Check MySQL service is running
- Confirm password doesn't have special characters that need escaping

**Time:** 5 minutes

---

### 2.2 Initial Schema Creation

#### Step 9: Run Base Schema Migration
**Via cPanel phpMyAdmin:**
1. Open phpMyAdmin
2. Select `gobarryco_breakdowns` database
3. Click "SQL" tab
4. Copy contents of `/backend/migrations/QUICKSTART_SUPABASE_FIXED.sql`
5. Paste into SQL field
6. Click "Go"

**Expected Output:**
```
Query executed successfully
4 tables created:
- supervisors
- breakdowns
- wizard_progress
- fleet_vehicles
```

**Schema includes:**
```sql
CREATE TABLE supervisors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    badge_number VARCHAR(20) UNIQUE,
    depot VARCHAR(100) DEFAULT 'Washington',
    role ENUM('admin', 'supervisor', 'manager') DEFAULT 'supervisor',
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE breakdowns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    breakdown_id VARCHAR(50) UNIQUE NOT NULL,
    fleet_no VARCHAR(20) NOT NULL,
    supervisor_badge VARCHAR(20),
    supervisor_name VARCHAR(255),
    location_description TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    issue_category VARCHAR(100),
    severity ENUM('STOP', 'AMBER', 'CONTINUE', 'CHANGEOVER'),
    status VARCHAR(50) DEFAULT 'received',
    wizard_type VARCHAR(100),
    wizard_decision VARCHAR(50),
    wizard_assessment_data JSON,
    depot VARCHAR(100),
    resolved_at TIMESTAMP NULL,
    resolved_by VARCHAR(100),
    resolution_type VARCHAR(50),
    resolution_notes TEXT,
    returned_to_service BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_breakdown_id (breakdown_id),
    INDEX idx_fleet_no (fleet_no),
    INDEX idx_status (status),
    INDEX idx_severity (severity),
    INDEX idx_supervisor_badge (supervisor_badge),
    INDEX idx_depot (depot),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Additional tables...
```

**Verification:**
```sql
-- Check tables were created
SHOW TABLES;
-- Expected: supervisors, breakdowns, wizard_progress, fleet_vehicles

-- Check table structure
DESCRIBE breakdowns;
-- Should show all columns with correct types

-- Verify indexes
SHOW INDEX FROM breakdowns;
-- Should show 7 indexes
```

**What to do if it fails:**
- Check for SQL syntax errors in output
- Verify MySQL version: `SELECT VERSION();` (must be 8.0+)
- If table exists error: DROP TABLE IF EXISTS first
- Check character set support: `SHOW CHARACTER SET LIKE 'utf8mb4';`

**Time:** 5 minutes

---

### 2.3 Additional Tables & Indexes

#### Step 10: Create Supporting Tables
**Run migration:** `/backend/migrations/create_activities_table.sql`

```sql
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    breakdown_id VARCHAR(50),
    fleet_no VARCHAR(20),
    supervisor_name VARCHAR(255),
    supervisor_badge VARCHAR(20),
    message TEXT,
    description TEXT,
    activity_data JSON,
    wizard_type VARCHAR(100),
    wizard_decision VARCHAR(50),
    location VARCHAR(255),
    route VARCHAR(50),
    severity VARCHAR(50),
    depot VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp),
    INDEX idx_breakdown_id (breakdown_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_supervisor_badge (supervisor_badge)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Verification:**
```sql
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'gobarryco_breakdowns'
AND table_name = 'activities';
-- Expected: 1
```

**Time:** 3 minutes

---

#### Step 11: Apply Engineering Tables
**Run migration:** `/backend/migrations/006_create_engineering_tables.sql`

```sql
CREATE TABLE IF NOT EXISTS breakdown_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    breakdown_id VARCHAR(50),
    event_type VARCHAR(100) NOT NULL,
    event_data JSON,
    by_badge VARCHAR(20),
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_breakdown_id (breakdown_id),
    INDEX idx_event_type (event_type),
    INDEX idx_occurred_at (occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS supervisor_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    supervisor_badge VARCHAR(20) NOT NULL,
    supervisor_name VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NULL,
    last_activity TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_supervisor_badge (supervisor_badge),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Verification:**
```sql
-- Check all tables exist
SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = 'gobarryco_breakdowns';
-- Expected: 6 tables (supervisors, breakdowns, wizard_progress, fleet_vehicles, activities, breakdown_events, supervisor_sessions)
```

**What to do if it fails:**
- Check previous steps completed successfully
- Verify no duplicate key errors
- Review MySQL error log in cPanel

**Time:** 5 minutes

---

### 2.4 Data Migration (if applicable)

#### Step 12: Migrate Existing Data
**Only if migrating from Supabase or existing system**

**Export from Supabase:**
```bash
# Using Supabase CLI
supabase db dump --data-only -f supabase_data.sql
```

**Transform data for MySQL:**
```bash
# Convert PostgreSQL UUID to INT AUTO_INCREMENT
# Convert JSONB to JSON
# Convert TIMESTAMPTZ to TIMESTAMP
# Convert TEXT to VARCHAR where appropriate

# Use provided migration script
node /backend/scripts/migrate_supabase_to_mysql.js
```

**Import to MySQL:**
```bash
mysql -u gobarryco_breakdowns_user -p gobarryco_breakdowns < migrated_data.sql
```

**Verification:**
```sql
-- Check record counts match
SELECT 'supervisors' as table_name, COUNT(*) as count FROM supervisors
UNION ALL
SELECT 'breakdowns', COUNT(*) FROM breakdowns
UNION ALL
SELECT 'fleet_vehicles', COUNT(*) FROM fleet_vehicles;

-- Verify data integrity
SELECT * FROM supervisors WHERE email IS NULL;
-- Expected: 0 rows (no nulls in required fields)

SELECT * FROM breakdowns WHERE breakdown_id IS NULL OR fleet_no IS NULL;
-- Expected: 0 rows
```

**What to do if it fails:**
- Check for data type mismatches
- Verify foreign key constraints don't block inserts
- Review MySQL error log for specific issues
- Import table-by-table to isolate problems

**Time:** 10-20 minutes (depends on data volume)

---

### 2.5 Database Verification

#### Step 13: Final Database Check
```sql
-- 1. Check all tables exist
SHOW TABLES;
-- Expected: 6-7 tables

-- 2. Check indexes on critical tables
SHOW INDEX FROM breakdowns;
-- Expected: 7+ indexes

-- 3. Verify foreign key relationships (if any)
SELECT
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    REFERENCED_TABLE_SCHEMA = 'gobarryco_breakdowns';

-- 4. Check character set and collation
SELECT
    table_name,
    table_collation
FROM
    information_schema.tables
WHERE
    table_schema = 'gobarryco_breakdowns';
-- Expected: utf8mb4_unicode_ci for all tables

-- 5. Test write/read operations
INSERT INTO activities (activity_type, message)
VALUES ('test', 'Database verification test');

SELECT * FROM activities WHERE activity_type = 'test';
-- Expected: 1 row returned

DELETE FROM activities WHERE activity_type = 'test';
-- Expected: 1 row deleted
```

**Critical Checks:**
- [ ] All 6-7 tables created
- [ ] All indexes present (20+ total across tables)
- [ ] Character set is utf8mb4
- [ ] Collation is utf8mb4_unicode_ci
- [ ] Can INSERT, SELECT, UPDATE, DELETE
- [ ] Database size reasonable (check via cPanel)

**Time:** 5 minutes

---

**ROLLBACK POINT:** If database verification fails, restore from backup created in Step 7 before proceeding.

---

## 3. Backend Deployment

**Duration:** 15-20 minutes
**Critical:** Backend must be running before frontend deployment

### 3.1 File Upload

#### Step 14: Upload Backend Files via FTP/SFTP
**Using FileZilla or similar:**
1. Connect to cPanel via SFTP
   - Host: `gobarry.co.uk`
   - Port: `22` (SSH) or `21` (FTP)
   - Username: Your cPanel username
   - Password: Your cPanel password
2. Navigate to `/home/[username]/backend/`
3. Upload all files from local `/backend/` directory:
   - `index.js` (main server file)
   - `routes/` directory (14 route files)
   - `middleware/` directory
   - `services/` directory
   - `utils/` directory
   - `data/` directory (JSON files)
   - `migrations/` directory
   - `package.json`
   - `package-lock.json`
   - `.htaccess`

**Files to EXCLUDE:**
- `node_modules/` (will install on server)
- `.env` (create directly on server)
- `*.log` files
- `.DS_Store`, `.git/`, etc.

**Verification:**
```bash
# Via cPanel Terminal
cd ~/backend
ls -la
# Expected: All files uploaded, ~50-100 files total

# Check critical files
ls -la index.js routes/ middleware/ services/
# All should exist

# Check package.json
cat package.json | grep '"name"'
# Expected: "gne-breakdown-management-backend"
```

**What to do if it fails:**
- Check disk space: `df -h`
- Verify permissions: `ls -la` (should be 644 for files, 755 for directories)
- Re-upload missing files
- Check FTP connection settings

**Time:** 5-10 minutes (depends on connection speed)

---

#### Step 15: Create .env File on Server
**Via cPanel File Manager:**
1. Navigate to `/backend/` directory
2. Click "New File"
3. Name: `.env`
4. Right-click → Edit
5. Paste production environment variables (from Step 3)
6. Save file

**Critical .env contents:**
```bash
NODE_ENV=production
PORT=3001

# Database (cPanel MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gobarryco_breakdowns
DB_USER=gobarryco_breakdowns_user
DB_PASSWORD=[paste_actual_password]

# API Configuration
API_BASE_URL=https://breakdowns.gobarry.co.uk/api
APP_URL=https://breakdowns.gobarry.co.uk
ALLOWED_ORIGINS=https://breakdowns.gobarry.co.uk,https://gobarry.co.uk

# Security
SESSION_SECRET=[paste_64_char_secret]
JWT_SECRET=[paste_64_char_secret]

# Node.js Memory (for cPanel shared hosting)
NODE_OPTIONS=--max-old-space-size=512
```

**Verification:**
```bash
# Via cPanel Terminal
cd ~/backend
cat .env | grep "DB_PASSWORD"
# Should NOT be empty

# Check all required variables
grep -c "=" .env
# Expected: 10-15 lines with = signs
```

**Security Note:** Set permissions to 600 (read/write owner only)
```bash
chmod 600 .env
ls -la .env
# Expected: -rw------- (600)
```

**Time:** 5 minutes

---

### 3.2 Dependency Installation

#### Step 16: Install Node.js Dependencies
**Via cPanel Terminal:**
```bash
cd ~/backend

# Install production dependencies only
npm ci --production

# Or if npm ci fails
npm install --production --no-optional
```

**Expected Output:**
```
added 89 packages in 45s

15 packages are looking for funding
  run `npm fund` for details
```

**Verification:**
```bash
# Check node_modules exists
ls -la node_modules/ | head -20
# Should show many packages

# Check critical dependencies
ls node_modules/ | grep -E "express|mysql2|ws|cors"
# Expected: All should exist

# Verify package count
ls node_modules/ | wc -l
# Expected: 80-100 packages
```

**What to do if it fails:**
- Check Node.js version: `node --version` (must be 18+)
- Clear npm cache: `npm cache clean --force`
- Check disk space: `df -h`
- Install packages individually if specific package fails
- Check for permission errors: `ls -la node_modules/`

**Time:** 3-5 minutes

---

### 3.3 Backend Configuration

#### Step 17: Verify .htaccess Configuration
**File:** `/backend/.htaccess`

```apache
# Go BARRY Backend - Apache/Passenger Configuration for cPanel
# This file configures Apache to route all requests to the Node.js app via Passenger

# Enable rewrite engine
RewriteEngine On

# Forward all requests to Passenger
PassengerEnabled on
PassengerAppType node
PassengerStartupFile index.js
PassengerAppRoot /home/[cpanel_username]/backend

# Set Node.js version (adjust based on cPanel's available versions)
# Check available versions in cPanel Node.js Selector
PassengerNodejs /usr/bin/node

# Environment variables
SetEnv NODE_ENV production
SetEnv PORT 3001

# Allow CORS from frontend domains
Header always set Access-Control-Allow-Origin "https://breakdowns.gobarry.co.uk"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
Header always set Access-Control-Allow-Credentials "true"

# Handle OPTIONS requests for CORS preflight
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Security headers
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-XSS-Protection "1; mode=block"

# WebSocket support
RewriteCond %{HTTP:Upgrade} =websocket [NC]
RewriteRule /(.*)           ws://localhost:3001/$1 [P,L]

# Forward all other requests to the app
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L]
```

**Replace placeholders:**
- `[cpanel_username]` → Your actual cPanel username
- `/usr/bin/node` → Actual Node.js path from cPanel Node.js Selector

**Verification:**
```bash
cd ~/backend
cat .htaccess | grep PassengerAppRoot
# Should show correct absolute path

# Check Node.js path
which node
# Use this path in PassengerNodejs directive
```

**Time:** 3 minutes

---

### 3.4 Backend Startup Test

#### Step 18: Test Backend Startup
**Via cPanel Terminal:**
```bash
cd ~/backend

# Test startup (will run in foreground)
node index.js
```

**Expected Output:**
```
🚀 Backend server starting...
✓ Environment: production
✓ Database connection established
✓ Connected to MySQL: gobarryco_breakdowns
✓ Loading route modules...
  ✓ auth.js
  ✓ breakdownsAPI.js
  ✓ supervisorAPI.js
  ✓ activityAPI.js
  ✓ engineeringAPI.js
  ✓ analyticsAPI.js
  ✓ fleetAPI.js
  ✓ wizardsAPI.js
  ... (14 total)
✓ 14 route modules loaded
✓ WebSocket server initialized
✓ CORS configured for: https://breakdowns.gobarry.co.uk
🚀 Backend server running on port 3001
✓ Health check available at: /api/health
Ready to accept connections
```

**Verification:**
```bash
# In another terminal/window, test health endpoint
curl http://localhost:3001/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-10-27T12:34:56.789Z",
  "database": "connected",
  "routes": 165,
  "websocket": "active"
}
```

**What to do if it fails:**

**Error: "Cannot find module"**
```bash
# Check node_modules
ls node_modules/ | grep [missing_module]
# If missing, install: npm install [missing_module]
```

**Error: "EADDRINUSE" (port in use)**
```bash
# Check what's using port 3001
lsof -i :3001
# Kill process or change PORT in .env
```

**Error: "Database connection failed"**
```bash
# Test MySQL connection directly
mysql -u gobarryco_breakdowns_user -p gobarryco_breakdowns -e "SELECT 1;"
# If fails, check DB credentials in .env
```

**Error: "MODULE_NOT_FOUND" for .env**
```bash
# Install dotenv
npm install dotenv
```

**Error: Memory issues**
```bash
# Check memory limit
node --max-old-space-size=512 index.js
# Reduce cache sizes in code if needed
```

**Press Ctrl+C to stop** when verification complete.

**Time:** 5 minutes

---

**CHECKPOINT:** Backend should now be ready for Node.js Application setup in cPanel

---

## 4. Frontend Deployment

**Duration:** 10-15 minutes
**Critical:** Frontend must point to correct backend API

### 4.1 Frontend Build Preparation

#### Step 19: Update Frontend Environment for Production
**File:** `/frontend/.env`

```bash
# API Configuration - CRITICAL: Must point to production backend
VITE_API_URL=https://breakdowns.gobarry.co.uk
VITE_API_BASE_URL=https://breakdowns.gobarry.co.uk/api
VITE_APP_URL=https://breakdowns.gobarry.co.uk

# WebSocket - Use wss:// for secure WebSocket
VITE_WS_URL=wss://breakdowns.gobarry.co.uk

# Authentication
VITE_ENABLE_AUTH=true
VITE_SESSION_TIMEOUT=3600

# Features
VITE_ENABLE_PWA=true
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_NOTIFICATIONS=true

# Disable development features
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_ANALYTICS=false

# Environment
VITE_ENV=production
VITE_APP_VERSION=1.5.4
```

**Verification:**
```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/frontend
cat .env | grep VITE_API_URL
# Expected: https://breakdowns.gobarry.co.uk (with https, not http)

cat .env | grep VITE_WS_URL
# Expected: wss://breakdowns.gobarry.co.uk (with wss, not ws)
```

**Time:** 2 minutes

---

#### Step 20: Build Frontend for Production
```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/frontend

# Clean previous builds
npm run clean

# Build for cPanel deployment
npm run build:cpanel
```

**Expected Output:**
```
vite v5.0.8 building for production...
transforming (2287) src/main.jsx
✓ 2287 modules transformed.
dist/index.html                    12.45 kB │ gzip:  4.21 kB
dist/assets/index-a1b2c3d4.js    234.56 kB │ gzip: 89.23 kB
dist/assets/index-e5f6g7h8.css    45.67 kB │ gzip: 12.34 kB
dist/assets/vendor-i9j0k1l2.js   445.78 kB │ gzip: 156.34 kB

✓ built in 45.23s
✓ Build complete! Upload dist/ folder to cPanel.
```

**Verification:**
```bash
# Check build output
ls -la dist/
# Expected: index.html, assets/, .htaccess, _redirects

# Check index.html contains correct API URL
grep -o 'https://breakdowns.gobarry.co.uk' dist/assets/*.js | head -5
# Should show production URLs

# Check asset sizes
du -sh dist/
# Expected: 50-200MB total

# Verify .htaccess for React Router
cat dist/.htaccess | grep "RewriteRule"
# Expected: RewriteRule ^ index.html [L]
```

**What to do if it fails:**
- Check Node.js version: `node --version`
- Clear cache: `rm -rf node_modules/.vite`
- Check for TypeScript errors in console
- Verify all imports resolve correctly
- Check for circular dependencies

**Time:** 3-5 minutes

---

### 4.2 Frontend File Upload

#### Step 21: Upload Frontend to cPanel
**Via cPanel File Manager:**
1. Login to cPanel
2. Navigate to File Manager
3. Go to `/public_html/` directory
4. **DELETE** old frontend files (keep backups!)
   - Select all files/folders EXCEPT `backend/`
   - Click Delete
5. Upload entire `dist/` folder contents:
   - Click "Upload"
   - Select all files from `/frontend/dist/`
   - Upload (may take 5-10 minutes)

**OR via SFTP (Faster for large files):**
```bash
# Using rsync
rsync -avz --delete \
  /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/frontend/dist/ \
  user@gobarry.co.uk:~/public_html/

# Or using scp
scp -r /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/frontend/dist/* \
  user@gobarry.co.uk:~/public_html/
```

**Files to upload:**
```
public_html/
├── index.html              (12 KB)
├── .htaccess              (1 KB)
├── _redirects             (small)
├── assets/
│   ├── index-[hash].js    (~235 KB)
│   ├── index-[hash].css   (~46 KB)
│   ├── vendor-[hash].js   (~446 KB)
│   └── [various images]
├── dashboards/
│   ├── control-room-display.html
│   ├── engineering-dashboard.html
│   └── ... (other dashboards)
├── gne-fleet-database.json
└── [logo images, etc.]
```

**Verification via cPanel Terminal:**
```bash
cd ~/public_html
ls -la
# Expected: index.html, assets/, dashboards/, .htaccess

# Check index.html
head -20 index.html
# Should contain <!DOCTYPE html> and React app mounting point

# Check .htaccess
cat .htaccess | grep "RewriteRule"
# Expected: React Router rewrite rules

# Check assets folder
ls -la assets/ | wc -l
# Expected: 20-50 files (JS, CSS, images)

# Check file sizes
du -sh assets/
# Expected: 30-100MB
```

**What to do if it fails:**
- Check disk quota: `quota -s`
- Verify file permissions: `chmod 644 *.html *.css *.js`
- Check directory permissions: `chmod 755 assets/ dashboards/`
- Re-upload individual files if corruption suspected
- Clear browser cache after upload

**Time:** 5-10 minutes

---

### 4.3 Frontend Configuration

#### Step 22: Verify Frontend .htaccess
**File:** `/public_html/.htaccess`

```apache
# Go North East Breakdown Guide - Production .htaccess
# This file ensures proper routing for React SPA on cPanel

# Enable Rewrite Engine
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Proxy API requests to backend Node.js app
    # Requests to /api/* are forwarded to port 3001
    RewriteCond %{REQUEST_URI} ^/api/ [NC]
    RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

    # WebSocket proxy for real-time updates
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule ^ws/(.*)$ ws://localhost:3001/ws/$1 [P,L]

    # Handle React Router - Don't rewrite files that exist
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-l

    # Send all non-existent paths to index.html
    RewriteRule ^ index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
    # Prevent clickjacking
    Header set X-Frame-Options "SAMEORIGIN"

    # Prevent MIME type sniffing
    Header set X-Content-Type-Options "nosniff"

    # Enable XSS filter
    Header set X-XSS-Protection "1; mode=block"

    # Force HTTPS
    Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"

    # CORS headers (allow frontend to access backend)
    Header set Access-Control-Allow-Origin "https://breakdowns.gobarry.co.uk"
    Header set Access-Control-Allow-Credentials "true"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache Control
<IfModule mod_expires.c>
    ExpiresActive On

    # Images - long cache
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"

    # CSS and JavaScript - medium cache
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"

    # HTML - no cache (always fresh)
    ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# Error Pages
ErrorDocument 404 /index.html
ErrorDocument 403 /index.html

# Force HTTPS redirect
<IfModule mod_rewrite.c>
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

**Verification:**
```bash
cd ~/public_html
cat .htaccess | grep "RewriteRule"
# Should show API proxy and React Router rules

# Test .htaccess syntax
apachectl configtest 2>&1 | grep -i "syntax"
# Expected: Syntax OK
```

**Time:** 3 minutes

---

## 5. Apache Configuration

**Duration:** 5-10 minutes

### 5.1 Virtual Host Configuration

#### Step 23: Configure Domain in cPanel
**Via cPanel Domains:**
1. Navigate to "Domains" in cPanel
2. Find `breakdowns.gobarry.co.uk`
3. Ensure Document Root is `/public_html/`
4. Click "Manage" → "Update Settings"
5. Verify SSL is enabled (Force HTTPS)

**Verification:**
```bash
# Check Apache configuration
cat /etc/apache2/sites-available/breakdowns.gobarry.co.uk.conf
# Should show VirtualHost configuration
```

**What to do if domain not found:**
1. Click "Create A New Domain"
2. Domain: `breakdowns.gobarry.co.uk`
3. Document Root: `/home/[username]/public_html`
4. Create

**Time:** 3 minutes

---

### 5.2 Apache Modules

#### Step 24: Enable Required Apache Modules
**Check via cPanel Terminal:**
```bash
# Check if mod_rewrite is enabled
apachectl -M | grep rewrite
# Expected: rewrite_module (shared)

# Check if mod_proxy is enabled
apachectl -M | grep proxy
# Expected: proxy_module, proxy_http_module

# Check if mod_headers is enabled
apachectl -M | grep headers
# Expected: headers_module
```

**If modules not enabled, contact hosting provider** or enable via WHM (if you have access):
1. Login to WHM
2. Navigate to "EasyApache 4"
3. Search and enable:
   - mod_rewrite
   - mod_proxy
   - mod_proxy_http
   - mod_headers
   - mod_deflate
   - mod_expires
4. Provision

**Verification:**
```bash
# Test Apache configuration
apachectl configtest
# Expected: Syntax OK

# Restart Apache (if you have permission)
sudo systemctl restart apache2
# Or via cPanel: "Restart Apache"
```

**Time:** 2-5 minutes

---

## 6. Node.js Application Setup

**Duration:** 10-15 minutes
**Critical:** Passenger must be configured correctly

### 6.1 Node.js Version Selection

#### Step 25: Set Node.js Version in cPanel
**Via cPanel Node.js Selector:**
1. Navigate to "Setup Node.js App" in cPanel
2. Click "Create Application"
3. Configure:
   - Node.js version: **18.x or higher**
   - Application mode: **Production**
   - Application root: `/home/[username]/backend`
   - Application URL: `breakdowns.gobarry.co.uk/api`
   - Application startup file: `index.js`
   - Passenger log file: `/home/[username]/logs/passenger.log`

**Environment Variables** (add in Node.js Selector):
```
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_NAME=gobarryco_breakdowns
DB_USER=gobarryco_breakdowns_user
DB_PASSWORD=[your_password]
API_BASE_URL=https://breakdowns.gobarry.co.uk/api
APP_URL=https://breakdowns.gobarry.co.uk
```

**Click "Create"**

**Verification:**
```bash
# Check Node.js version
node --version
# Expected: v18.x.x or higher

# Check npm version
npm --version
# Expected: 8.x or higher

# Verify application is registered
cat ~/backend/.htaccess | grep PassengerNodejs
# Should show Node.js path
```

**What to do if Node.js version unavailable:**
- Check cPanel Node.js Selector for available versions
- Contact hosting provider to install Node.js 18+
- Consider using NVM to install specific version:
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  nvm install 18
  nvm use 18
  ```

**Time:** 5 minutes

---

### 6.2 Passenger Configuration

#### Step 26: Configure Passenger Settings
**In cPanel Node.js Selector (after creating app):**

**Passenger Settings:**
- Maximum requests: `1000` (restart app every 1000 requests)
- Memory limit: `512M` (adjust based on cPanel plan)
- Startup timeout: `60` seconds
- Friendly error pages: **Off** (in production)

**Passenger Advanced Options (in .htaccess):**
```apache
# In /backend/.htaccess
PassengerMinInstances 1
PassengerMaxPoolSize 6
PassengerPoolIdleTime 300
PassengerMaxRequestQueueSize 100
PassengerStatThrottleRate 5
PassengerStartTimeout 60
PassengerPreStart https://breakdowns.gobarry.co.uk/api/health
```

**Verification:**
```bash
# Check Passenger is running
passenger-status
# Expected: Shows app running, PID, memory usage

# Or via HTTP
curl -I https://breakdowns.gobarry.co.uk/api/health
# Expected: HTTP/1.1 200 OK
```

**What to do if Passenger fails:**
- Check Passenger log: `tail -f ~/logs/passenger.log`
- Verify .htaccess syntax
- Check file permissions
- Ensure Node.js app starts successfully: `node ~/backend/index.js`
- Restart Passenger via cPanel Node.js Selector

**Time:** 5 minutes

---

### 6.3 Application Restart

#### Step 27: Start/Restart Node.js Application
**Via cPanel Node.js Selector:**
1. Navigate to "Setup Node.js App"
2. Find your application
3. Click "Restart" button
4. Wait for status to show "Running"

**OR via Terminal:**
```bash
# Create restart file (Passenger watches this)
touch ~/backend/tmp/restart.txt

# Passenger will detect and restart automatically

# Check if restarted
tail -f ~/logs/passenger.log
# Should show "Starting application..."
```

**Verification:**
```bash
# Test health endpoint
curl https://breakdowns.gobarry.co.uk/api/health
# Expected: {"status":"healthy",...}

# Check application is running
passenger-status | grep -A 5 "backend"
# Should show:
# PID: [number]
# Memory: XX MB
# Uptime: X seconds
```

**What to do if application won't start:**
```bash
# Check logs
tail -100 ~/logs/passenger.log
# Look for errors

# Common issues:
# 1. Port conflict - Check PORT in .env
# 2. Database connection - Test MySQL connection
# 3. Missing dependencies - Run npm install
# 4. Permission errors - Check file ownership
# 5. Memory limit - Check cPanel resource usage
```

**Time:** 3-5 minutes

---

## 7. SSL Certificate Verification

**Duration:** 5-10 minutes
**Critical:** SSL must be valid for secure WebSocket connections

### 7.1 SSL Certificate Check

#### Step 28: Verify SSL Certificate
**Via cPanel SSL/TLS Status:**
1. Navigate to "SSL/TLS Status" in cPanel
2. Find `breakdowns.gobarry.co.uk`
3. Status should show "✓ Valid"
4. Check expiration date (should be future)
5. If expired or missing, click "Install AutoSSL"

**Manual verification:**
```bash
# Check SSL certificate via openssl
openssl s_client -connect breakdowns.gobarry.co.uk:443 -servername breakdowns.gobarry.co.uk < /dev/null 2>/dev/null | grep -A 2 "Verify return code"
# Expected: Verify return code: 0 (ok)

# Check certificate expiration
openssl s_client -connect breakdowns.gobarry.co.uk:443 -servername breakdowns.gobarry.co.uk 2>/dev/null | openssl x509 -noout -dates
# Expected: notAfter date in future
```

**Via browser:**
1. Visit https://breakdowns.gobarry.co.uk
2. Click padlock icon in address bar
3. Check certificate details:
   - Issued to: breakdowns.gobarry.co.uk
   - Valid from: [date in past]
   - Valid until: [date in future]
   - Issued by: Let's Encrypt (or other CA)

**Verification Checklist:**
- [ ] SSL certificate is valid
- [ ] No browser warnings when visiting HTTPS URL
- [ ] Certificate covers correct domain
- [ ] Certificate not expired
- [ ] Certificate chain is complete

**What to do if SSL fails:**
- Install AutoSSL via cPanel
- If AutoSSL fails, install Let's Encrypt manually:
  ```bash
  certbot certonly --webroot -w /home/username/public_html -d breakdowns.gobarry.co.uk
  ```
- Check DNS records point to correct IP
- Wait for DNS propagation (up to 24 hours)
- Contact hosting provider if issues persist

**Time:** 3-5 minutes

---

### 7.2 HTTPS Redirect Configuration

#### Step 29: Force HTTPS Redirect
**Already configured in .htaccess**, but verify:

```apache
# In /public_html/.htaccess
<IfModule mod_rewrite.c>
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

**Verification:**
```bash
# Test HTTP redirect to HTTPS
curl -I http://breakdowns.gobarry.co.uk
# Expected:
# HTTP/1.1 301 Moved Permanently
# Location: https://breakdowns.gobarry.co.uk/

# Test final HTTPS response
curl -I https://breakdowns.gobarry.co.uk
# Expected: HTTP/1.1 200 OK
```

**Via browser:**
1. Visit http://breakdowns.gobarry.co.uk (no 's')
2. Should automatically redirect to https://
3. Check address bar shows padlock icon

**Time:** 2 minutes

---

## 8. Post-Deployment Testing

**Duration:** 30-45 minutes
**Critical:** Comprehensive testing before declaring success

### 8.1 Health Check Endpoints

#### Step 30: Test Basic Health Endpoint
```bash
# Backend health check
curl https://breakdowns.gobarry.co.uk/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-27T12:34:56.789Z",
  "database": {
    "status": "connected",
    "type": "mysql"
  },
  "routes": 165,
  "websocket": "active",
  "memory": {
    "used": 45.6,
    "total": 512
  }
}
```

**Verification Checklist:**
- [ ] Status is "healthy"
- [ ] Database status is "connected"
- [ ] Route count is 165+
- [ ] WebSocket is "active"
- [ ] Memory usage is reasonable (<80% of limit)

**What to do if it fails:**
- Status "unhealthy": Check application logs
- Database "disconnected": Verify DB credentials in .env
- Routes < 165: Check all route files loaded
- WebSocket "inactive": Check ws module installed
- Memory > 80%: Increase memory limit or optimize code

**Time:** 2 minutes

---

#### Step 31: Test Extended Health Endpoint
```bash
curl https://breakdowns.gobarry.co.uk/api/health-extended
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-27T12:34:56.789Z",
  "version": "1.5.4",
  "environment": "production",
  "database": {
    "connected": true,
    "tables": 6,
    "responseTime": "12ms"
  },
  "routes": {
    "total": 165,
    "modules": [
      "auth", "breakdownsAPI", "supervisorAPI",
      "activityAPI", "engineeringAPI", "analyticsAPI",
      "fleetAPI", "wizardsAPI", "sdcAPI",
      "dashboardAPI", "reportsAPI", "healthAPI",
      "webSocketHandler", "adminAPI"
    ]
  },
  "websocket": {
    "active": true,
    "connections": 0
  },
  "system": {
    "uptime": 3600,
    "memory": {
      "used": 234.5,
      "free": 277.5,
      "total": 512
    }
  }
}
```

**Verification Checklist:**
- [ ] Database has 6 tables
- [ ] All 14 route modules loaded
- [ ] Database response time < 50ms
- [ ] System uptime > 0

**Time:** 2 minutes

---

### 8.2 Authentication Testing

#### Step 32: Test Login Flow
**Via Browser:**
1. Visit https://breakdowns.gobarry.co.uk
2. Should see login page
3. Enter supervisor credentials:
   - Badge: `AG003` (or any valid badge)
   - Password: [actual password]
4. Click "Login"
5. Should redirect to dashboard

**Via API:**
```bash
# Test login endpoint
curl -X POST https://breakdowns.gobarry.co.uk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "badge": "AG003",
    "password": "actual_password"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "badge": "AG003",
    "name": "Anthony Gair",
    "email": "anthony.gair@gonortheast.co.uk",
    "role": "admin",
    "depot": "Washington"
  }
}
```

**Verification Checklist:**
- [ ] Login page loads without errors
- [ ] Valid credentials accepted
- [ ] Invalid credentials rejected
- [ ] JWT token returned
- [ ] User object contains correct data
- [ ] Session created in database

**Test invalid login:**
```bash
curl -X POST https://breakdowns.gobarry.co.uk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"badge": "INVALID", "password": "wrong"}'

# Expected: {"success": false, "error": "Invalid credentials"}
```

**What to do if it fails:**
- Check supervisors table has data
- Verify password hashing works
- Check JWT secret is set in .env
- Review auth middleware logs
- Test database connection

**Time:** 5 minutes

---

### 8.3 API Endpoint Testing

#### Step 33: Test Critical API Endpoints

**Test 1: Breakdowns API**
```bash
# Create test breakdown
TOKEN="[JWT from login]"

curl -X POST https://breakdowns.gobarry.co.uk/api/breakdowns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fleet_no": "1234",
    "supervisor_badge": "AG003",
    "location_description": "Newcastle City Centre",
    "issue_category": "Engine Fault",
    "severity": "AMBER",
    "status": "active"
  }'

# Expected: {"success": true, "breakdown_id": "BRK-20251027-001", ...}
```

**Test 2: Get Breakdowns**
```bash
curl https://breakdowns.gobarry.co.uk/api/breakdowns/live \
  -H "Authorization: Bearer $TOKEN"

# Expected: Array of active breakdowns
```

**Test 3: Activity Feed**
```bash
curl https://breakdowns.gobarry.co.uk/api/activity/feed \
  -H "Authorization: Bearer $TOKEN"

# Expected: {"activities": [...], "total": X, "page": 1}
```

**Test 4: Fleet Database**
```bash
curl "https://breakdowns.gobarry.co.uk/api/fleet/vehicles?search=1234" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Vehicle data for fleet 1234
```

**Test 5: Dashboard Data**
```bash
curl https://breakdowns.gobarry.co.uk/api/sdc/breakdowns \
  -H "Authorization: Bearer $TOKEN"

# Expected: SDC dashboard data with active breakdowns
```

**Verification Checklist:**
- [ ] All 5 test endpoints return 200 OK
- [ ] Data structure matches expected format
- [ ] Database records created successfully
- [ ] No 401 Unauthorized errors
- [ ] No 500 Internal Server errors
- [ ] Response times < 500ms

**Time:** 10 minutes

---

### 8.4 WebSocket Testing

#### Step 34: Test Real-Time WebSocket Connections
**Test WebSocket via Browser Console:**
```javascript
// Open browser console on https://breakdowns.gobarry.co.uk
const ws = new WebSocket('wss://breakdowns.gobarry.co.uk/ws');

ws.onopen = () => {
  console.log('✓ WebSocket connected');
  ws.send(JSON.stringify({ type: 'ping' }));
};

ws.onmessage = (event) => {
  console.log('✓ Received:', event.data);
};

ws.onerror = (error) => {
  console.error('✗ WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket closed');
};

// Should see:
// ✓ WebSocket connected
// ✓ Received: {"type":"pong","timestamp":"..."}
```

**Test WebSocket via command line:**
```bash
# Install wscat if needed
npm install -g wscat

# Connect to WebSocket
wscat -c "wss://breakdowns.gobarry.co.uk/ws"

# Type: {"type":"ping"}
# Expected: {"type":"pong","timestamp":"..."}
```

**Test WebSocket Channels:**
1. **General Channel:** `wss://breakdowns.gobarry.co.uk/ws`
2. **SDC Dashboard:** `wss://breakdowns.gobarry.co.uk/ws/sdc-dashboard`
3. **Engineering:** `wss://breakdowns.gobarry.co.uk/ws/engineering`
4. **Activity Feed:** `wss://breakdowns.gobarry.co.uk/ws/activity`
5. **Assessment Progress:** `wss://breakdowns.gobarry.co.uk/ws/assessment-progress`

**Verification Checklist:**
- [ ] WebSocket connection establishes (status: open)
- [ ] Ping/pong messages work
- [ ] All 5 channels accessible
- [ ] Real-time events broadcast correctly
- [ ] No connection drops or errors
- [ ] SSL certificate valid for WebSocket

**What to do if it fails:**
- Check Apache WebSocket proxy in .htaccess
- Verify ws module installed: `npm list ws`
- Check firewall allows WebSocket connections
- Review WebSocket handler logs
- Test without SSL: `ws://` (then fix SSL if that works)

**Time:** 5 minutes

---

### 8.5 Frontend Testing

#### Step 35: Test Frontend Pages
**Via Browser (manual testing):**

**Test 1: Homepage**
1. Visit https://breakdowns.gobarry.co.uk
2. Should load login page
3. Check:
   - [ ] Page loads without errors
   - [ ] GNE logo displays
   - [ ] Login form visible
   - [ ] No console errors (press F12)

**Test 2: Dashboard (after login)**
1. Login with valid credentials
2. Should see breakdown management dashboard
3. Check:
   - [ ] Dashboard loads
   - [ ] Live breakdown counter visible
   - [ ] Navigation menu works
   - [ ] Real-time updates working (WebSocket)

**Test 3: Control Room Display**
1. Visit https://breakdowns.gobarry.co.uk/dashboards/control-room-display.html
2. Check:
   - [ ] Full-screen display loads
   - [ ] Shows active breakdowns
   - [ ] Auto-refreshes every 30 seconds
   - [ ] No authentication required (public display)

**Test 4: Engineering Dashboard**
1. Visit https://breakdowns.gobarry.co.uk/dashboards/engineering-dashboard.html
2. Login as admin
3. Check:
   - [ ] Engineer assignment interface loads
   - [ ] Can assign engineers to breakdowns
   - [ ] Real-time status updates work

**Test 5: Mobile Responsiveness**
1. Open browser DevTools (F12)
2. Toggle device toolbar
3. Test on:
   - [ ] iPhone (375x667)
   - [ ] iPad (768x1024)
   - [ ] Android (360x640)
4. Check:
   - [ ] Layout adapts to screen size
   - [ ] Touch interactions work
   - [ ] No horizontal scrolling
   - [ ] Text is readable

**Verification Checklist:**
- [ ] All pages load without 404 errors
- [ ] Images display correctly
- [ ] JavaScript executes without errors
- [ ] CSS styles apply correctly
- [ ] React Router navigation works
- [ ] API calls succeed
- [ ] WebSocket connections establish

**Time:** 10 minutes

---

### 8.6 Database Query Testing

#### Step 36: Verify Database Operations
**Via cPanel phpMyAdmin:**
```sql
-- Test 1: Check all tables exist
SHOW TABLES;
-- Expected: 6-7 tables

-- Test 2: Check supervisor data
SELECT badge_number, name, depot, role FROM supervisors WHERE is_active = TRUE;
-- Expected: 13 active supervisors

-- Test 3: Check breakdown records (if any exist)
SELECT breakdown_id, fleet_no, status, severity, created_at
FROM breakdowns
ORDER BY created_at DESC
LIMIT 10;

-- Test 4: Test JOIN query (performance check)
SELECT
    b.breakdown_id,
    b.fleet_no,
    b.location_description,
    s.name as supervisor_name,
    s.depot
FROM breakdowns b
LEFT JOIN supervisors s ON b.supervisor_badge = s.badge_number
WHERE b.status = 'active'
ORDER BY b.created_at DESC
LIMIT 20;
-- Should execute in < 100ms

-- Test 5: Check indexes
SHOW INDEX FROM breakdowns;
-- Expected: 7+ indexes

-- Test 6: Test INSERT/UPDATE/DELETE
INSERT INTO activities (activity_type, message)
VALUES ('test', 'Database verification');
-- Expected: 1 row inserted

UPDATE activities SET message = 'Updated' WHERE activity_type = 'test';
-- Expected: 1 row updated

DELETE FROM activities WHERE activity_type = 'test';
-- Expected: 1 row deleted

-- Test 7: Check database size
SELECT
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE table_schema = 'gobarryco_breakdowns'
ORDER BY size_mb DESC;
-- Check total size is within cPanel quota
```

**Verification Checklist:**
- [ ] All tables accessible
- [ ] Queries execute successfully
- [ ] JOIN queries perform well (< 100ms)
- [ ] INSERT/UPDATE/DELETE work
- [ ] Indexes are being used (check EXPLAIN)
- [ ] Database size is reasonable

**Time:** 5 minutes

---

### 8.7 Performance Testing

#### Step 37: Test API Response Times
```bash
# Test 1: Health endpoint (should be fastest)
time curl -s https://breakdowns.gobarry.co.uk/api/health > /dev/null
# Expected: < 100ms

# Test 2: Breakdown list (database query)
time curl -s -H "Authorization: Bearer $TOKEN" \
  https://breakdowns.gobarry.co.uk/api/breakdowns/live > /dev/null
# Expected: < 500ms

# Test 3: Activity feed (larger dataset)
time curl -s -H "Authorization: Bearer $TOKEN" \
  https://breakdowns.gobarry.co.uk/api/activity/feed > /dev/null
# Expected: < 1000ms

# Test 4: Analytics (complex query)
time curl -s -H "Authorization: Bearer $TOKEN" \
  https://breakdowns.gobarry.co.uk/api/analytics/kpis > /dev/null
# Expected: < 2000ms

# Test 5: Frontend load time
time curl -s https://breakdowns.gobarry.co.uk > /dev/null
# Expected: < 200ms
```

**Load Testing (optional):**
```bash
# Install Apache Bench if not available
# ab -n 100 -c 10 https://breakdowns.gobarry.co.uk/api/health
# 100 requests, 10 concurrent

# Or use wrk
wrk -t10 -c100 -d30s https://breakdowns.gobarry.co.uk/api/health
# 10 threads, 100 connections, 30 seconds
```

**Performance Benchmarks:**
- Health endpoint: < 100ms
- Database queries: < 500ms
- Complex analytics: < 2000ms
- Frontend load: < 3 seconds (full page)
- WebSocket latency: < 100ms

**What to do if slow:**
- Check database indexes
- Review slow query log
- Check Apache/Passenger configuration
- Monitor server resource usage
- Consider caching layer (Redis)
- Optimize database queries

**Time:** 5 minutes

---

## 9. Rollback Procedures

**Duration:** 10-15 minutes
**When to use:** Deployment fails or critical bugs discovered

### 9.1 Emergency Rollback - Frontend

#### Step 38: Restore Previous Frontend
**If deployment fails immediately:**

**Via cPanel File Manager:**
1. Login to cPanel
2. Navigate to File Manager
3. Go to `/public_html/`
4. Delete current files
5. Upload backup: `backup_breakdowns_YYYYMMDD_HHMMSS.zip`
6. Extract backup
7. Verify site loads

**Via Command Line (if available):**
```bash
cd ~/public_html

# Delete current frontend
rm -rf index.html assets/ dashboards/

# Extract backup
unzip ~/backups/backup_breakdowns_YYYYMMDD_HHMMSS.zip -d .

# Verify
ls -la index.html
# Should exist

# Test
curl -I https://breakdowns.gobarry.co.uk
# Expected: HTTP/1.1 200 OK
```

**Verification:**
- [ ] Backup extracted successfully
- [ ] Index.html exists
- [ ] Assets folder restored
- [ ] Site loads in browser
- [ ] No 404 errors

**Time:** 5 minutes

---

### 9.2 Emergency Rollback - Backend

#### Step 39: Restore Previous Backend
**Via cPanel Node.js Selector:**
1. Navigate to "Setup Node.js App"
2. Find your app
3. Click "Stop Application"

**Restore Files:**
```bash
cd ~

# Delete current backend
mv backend backend_failed_$(date +%Y%m%d)

# Extract backup
tar -xzf backups/backend_backup_YYYYMMDD_HHMMSS.tar.gz

# Restore node_modules
cd backend
npm ci --production

# Verify .env file
cat .env | grep "DB_PASSWORD"
# Should not be empty
```

**Restart Application:**
1. Via cPanel Node.js Selector → Click "Restart"
2. OR: `touch ~/backend/tmp/restart.txt`

**Verification:**
```bash
# Test health endpoint
curl https://breakdowns.gobarry.co.uk/api/health
# Expected: {"status":"healthy",...}

# Check logs
tail -50 ~/logs/passenger.log
# Should show successful startup
```

**Time:** 5-10 minutes

---

### 9.3 Emergency Rollback - Database

#### Step 40: Restore Database Backup
**CRITICAL:** Only do this if database is corrupted or data lost

**Via cPanel phpMyAdmin:**
1. Open phpMyAdmin
2. Select `gobarryco_breakdowns` database
3. Click "Operations" tab
4. Scroll to "Drop database" (⚠️ DANGEROUS)
5. Confirm drop
6. Create new database: `gobarryco_breakdowns`
7. Click "Import" tab
8. Select backup file: `db_backup_YYYYMMDD_HHMMSS.sql`
9. Click "Go"
10. Wait for import to complete

**Via Command Line:**
```bash
# Drop and recreate database
mysql -u gobarryco_breakdowns_user -p -e "DROP DATABASE gobarryco_breakdowns;"
mysql -u gobarryco_breakdowns_user -p -e "CREATE DATABASE gobarryco_breakdowns CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Restore from backup
mysql -u gobarryco_breakdowns_user -p gobarryco_breakdowns < \
  ~/backups/db_backup_YYYYMMDD_HHMMSS.sql
```

**Verification:**
```sql
-- Check tables restored
SHOW TABLES;
-- Expected: All original tables

-- Check record counts
SELECT 'supervisors' as tbl, COUNT(*) as cnt FROM supervisors
UNION ALL
SELECT 'breakdowns', COUNT(*) FROM breakdowns;
-- Should match pre-deployment counts

-- Test queries
SELECT * FROM supervisors WHERE is_active = TRUE LIMIT 5;
-- Should return data
```

**What to check after restore:**
- [ ] All tables exist
- [ ] Record counts match backup
- [ ] Indexes present
- [ ] Foreign keys intact
- [ ] Application can connect
- [ ] Queries execute successfully

**Time:** 10-15 minutes

---

### 9.4 Post-Rollback Verification

#### Step 41: Verify System After Rollback
**Test all critical functionality:**

1. **Frontend:**
   ```bash
   curl https://breakdowns.gobarry.co.uk
   # Should load without errors
   ```

2. **Backend API:**
   ```bash
   curl https://breakdowns.gobarry.co.uk/api/health
   # Expected: {"status":"healthy"}
   ```

3. **Authentication:**
   - Login via browser
   - Should succeed with valid credentials

4. **Database:**
   ```sql
   SELECT COUNT(*) FROM breakdowns WHERE status = 'active';
   # Should return reasonable count
   ```

5. **WebSocket:**
   - Open browser console
   - Connect to WebSocket
   - Should establish connection

**Verification Checklist:**
- [ ] Frontend loads correctly
- [ ] Backend API responds
- [ ] Database queries work
- [ ] Authentication works
- [ ] WebSocket connects
- [ ] No console errors
- [ ] Users can access system

**If rollback successful:**
- Document what went wrong
- Fix issues in development
- Test thoroughly before re-deploying

**If rollback fails:**
- Contact hosting provider immediately
- Restore from older backup
- Consider maintenance mode

**Time:** 10 minutes

---

## 10. Troubleshooting Guide

**Common issues and solutions**

### 10.1 Frontend Issues

#### Issue 1: Page Shows Blank/White Screen
**Symptoms:**
- Frontend loads but shows white screen
- No content visible
- Console shows JavaScript errors

**Diagnosis:**
```bash
# Check browser console (F12)
# Look for errors like:
# - "Failed to load module"
# - "Unexpected token <"
# - "Cannot read property of undefined"
```

**Solutions:**
```bash
# Solution 1: Check .htaccess
cat ~/public_html/.htaccess | grep "RewriteRule"
# Should have: RewriteRule ^ index.html [L]

# Solution 2: Verify API URL in build
grep -r "localhost" ~/public_html/assets/*.js
# Should return NOTHING (no localhost references)

# Solution 3: Check index.html exists
ls -la ~/public_html/index.html
# Should exist and be > 0 bytes

# Solution 4: Clear browser cache
# Ctrl+Shift+R (hard refresh)

# Solution 5: Rebuild frontend with correct env
cd /local/frontend
cat .env | grep VITE_API_URL
# Should be: https://breakdowns.gobarry.co.uk
npm run build:cpanel
# Re-upload dist/ folder
```

---

#### Issue 2: API Calls Failing (CORS Errors)
**Symptoms:**
- Browser console shows CORS errors
- Network tab shows failed requests
- Error: "Access-Control-Allow-Origin"

**Diagnosis:**
```bash
# Check CORS headers
curl -I https://breakdowns.gobarry.co.uk/api/health
# Should show: Access-Control-Allow-Origin: https://breakdowns.gobarry.co.uk
```

**Solutions:**
```bash
# Solution 1: Check .htaccess CORS headers
cat ~/public_html/.htaccess | grep "Access-Control"
# Should have CORS headers

# Solution 2: Update backend .env
cd ~/backend
cat .env | grep ALLOWED_ORIGINS
# Should include: https://breakdowns.gobarry.co.uk

# Solution 3: Restart backend
touch ~/backend/tmp/restart.txt

# Solution 4: Check Apache headers module
apachectl -M | grep headers
# Should show: headers_module
```

---

#### Issue 3: React Router 404 Errors
**Symptoms:**
- Direct URL navigation returns 404
- Refresh on any route shows error
- Only homepage works

**Diagnosis:**
```bash
# Test direct route access
curl -I https://breakdowns.gobarry.co.uk/dashboard
# Should return 200, not 404
```

**Solutions:**
```bash
# Solution 1: Verify .htaccess rewrite rules
cat ~/public_html/.htaccess | grep -A 5 "RewriteCond"
# Should have React Router rules

# Solution 2: Check mod_rewrite enabled
apachectl -M | grep rewrite
# Should show: rewrite_module

# Solution 3: Fix .htaccess
cat > ~/public_html/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [L]
</IfModule>
EOF

# Solution 4: Restart Apache
# Via cPanel: Services → Restart Apache
```

---

### 10.2 Backend Issues

#### Issue 4: Backend Not Starting
**Symptoms:**
- Passenger shows "App not running"
- Health endpoint returns 502/503
- Application keeps crashing

**Diagnosis:**
```bash
# Check logs
tail -100 ~/logs/passenger.log
# Look for startup errors

# Try starting manually
cd ~/backend
node index.js
# See what error appears
```

**Solutions:**
```bash
# Solution 1: Check Node.js version
node --version
# Must be 18+

# Solution 2: Verify .env file
cat ~/backend/.env | grep -c "="
# Should have 10+ variables

# Solution 3: Check database connection
mysql -u gobarryco_breakdowns_user -p gobarryco_breakdowns -e "SELECT 1;"
# Should return: 1

# Solution 4: Install missing dependencies
cd ~/backend
npm ci --production

# Solution 5: Check port not in use
lsof -i :3001
# Should be empty or show your app

# Solution 6: Check file permissions
ls -la ~/backend/index.js
# Should be: -rw-r--r-- (644)

# Solution 7: Increase memory limit
# Edit .env, add:
NODE_OPTIONS=--max-old-space-size=512

# Solution 8: Restart via cPanel Node.js Selector
```

---

#### Issue 5: Database Connection Errors
**Symptoms:**
- Backend starts but API calls fail
- Error: "ER_ACCESS_DENIED_ERROR"
- Error: "ECONNREFUSED"

**Diagnosis:**
```bash
# Test database connection directly
mysql -u gobarryco_breakdowns_user -p -h localhost gobarryco_breakdowns -e "SHOW TABLES;"
# Should show tables
```

**Solutions:**
```bash
# Solution 1: Verify database credentials
cat ~/backend/.env | grep ^DB_
# Check username, password, database name match cPanel

# Solution 2: Check database exists
mysql -u [user] -p -e "SHOW DATABASES;" | grep gobarryco_breakdowns
# Should appear in list

# Solution 3: Check user privileges
mysql -u root -p -e "SHOW GRANTS FOR 'gobarryco_breakdowns_user'@'localhost';"
# Should show ALL PRIVILEGES on gobarryco_breakdowns

# Solution 4: Recreate database user
# Via cPanel MySQL Databases:
# 1. Delete user
# 2. Recreate user with new password
# 3. Grant ALL PRIVILEGES
# 4. Update .env with new password

# Solution 5: Check MySQL is running
mysqladmin -u [user] -p status
# Should show uptime

# Solution 6: Check connection limit
mysql -u root -p -e "SHOW VARIABLES LIKE 'max_connections';"
# Default: 151, increase if needed
```

---

#### Issue 6: WebSocket Connection Failures
**Symptoms:**
- Real-time updates not working
- Console shows WebSocket errors
- Error: "WebSocket connection failed"

**Diagnosis:**
```bash
# Test WebSocket directly
wscat -c "wss://breakdowns.gobarry.co.uk/ws"
# Should connect successfully

# Check WebSocket module
npm list ws
# Should show installed
```

**Solutions:**
```bash
# Solution 1: Check Apache WebSocket proxy
cat ~/public_html/.htaccess | grep -A 2 "Upgrade"
# Should have WebSocket proxy rules

# Solution 2: Install ws module
cd ~/backend
npm install ws

# Solution 3: Check WebSocket handler
cat ~/backend/routes/webSocketHandler.js
# Should exist and export WebSocket server

# Solution 4: Verify SSL certificate
openssl s_client -connect breakdowns.gobarry.co.uk:443 < /dev/null 2>&1 | grep "Verify return"
# Should return: Verify return code: 0 (ok)

# Solution 5: Check firewall
# Contact hosting provider to allow WebSocket connections

# Solution 6: Update .htaccess WebSocket rules
# Add to /public_html/.htaccess:
RewriteCond %{HTTP:Upgrade} =websocket [NC]
RewriteRule /(.*)$ ws://localhost:3001/$1 [P,L]

# Solution 7: Restart application
touch ~/backend/tmp/restart.txt
```

---

### 10.3 Database Issues

#### Issue 7: Slow Query Performance
**Symptoms:**
- API responses take > 2 seconds
- Dashboard loads slowly
- Database timeouts

**Diagnosis:**
```sql
-- Check slow queries
SHOW PROCESSLIST;
-- Look for queries in "executing" state

-- Check table sizes
SELECT
    table_name,
    table_rows,
    ROUND(data_length / 1024 / 1024, 2) AS data_mb
FROM information_schema.tables
WHERE table_schema = 'gobarryco_breakdowns'
ORDER BY data_length DESC;
```

**Solutions:**
```sql
-- Solution 1: Check indexes exist
SHOW INDEX FROM breakdowns;
-- Should have 7+ indexes

-- Solution 2: Add missing indexes
CREATE INDEX idx_breakdowns_status ON breakdowns(status);
CREATE INDEX idx_breakdowns_depot ON breakdowns(depot);
CREATE INDEX idx_breakdowns_created_at ON breakdowns(created_at);

-- Solution 3: Analyze tables
ANALYZE TABLE breakdowns;
ANALYZE TABLE activities;

-- Solution 4: Optimize tables
OPTIMIZE TABLE breakdowns;
OPTIMIZE TABLE activities;

-- Solution 5: Check query execution plan
EXPLAIN SELECT * FROM breakdowns WHERE status = 'active';
-- Should use index, not full table scan

-- Solution 6: Increase query cache
-- Contact hosting provider to adjust MySQL settings

-- Solution 7: Archive old data
-- Move resolved breakdowns older than 90 days to archive table
```

---

#### Issue 8: Database Disk Space Full
**Symptoms:**
- Error: "Can't create/write to file"
- Error: "The table is full"
- Cannot insert new records

**Diagnosis:**
```bash
# Check disk usage
quota -s
# Or via cPanel: Disk Usage

# Check database size
mysql -u [user] -p -e "
SELECT
    table_schema,
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'gobarryco_breakdowns'
GROUP BY table_schema;
"
```

**Solutions:**
```sql
-- Solution 1: Delete old test data
DELETE FROM activities WHERE activity_type = 'test';
DELETE FROM breakdowns WHERE status = 'test';

-- Solution 2: Archive resolved breakdowns
-- Export to file
SELECT * INTO OUTFILE '/tmp/archive_breakdowns.csv'
FROM breakdowns
WHERE resolved_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Delete archived records
DELETE FROM breakdowns
WHERE resolved_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Solution 3: Truncate activity logs
DELETE FROM activities
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Solution 4: Clean up events
DELETE FROM breakdown_events
WHERE created_at < DATE_SUB(NOW(), INTERVAL 60 DAY);

-- Solution 5: Optimize tables
OPTIMIZE TABLE breakdowns;
OPTIMIZE TABLE activities;
OPTIMIZE TABLE breakdown_events;
```

**Then:**
- Upgrade cPanel hosting plan for more disk space
- Implement automated archiving
- Add data retention policies

---

### 10.4 Performance Issues

#### Issue 9: High Memory Usage
**Symptoms:**
- Backend crashes unexpectedly
- Error: "JavaScript heap out of memory"
- Passenger shows high memory usage

**Diagnosis:**
```bash
# Check memory usage
passenger-status
# Look at memory column

# Check Node.js memory
ps aux | grep node
# VSZ/RSS columns show memory
```

**Solutions:**
```bash
# Solution 1: Increase Node.js memory limit
# Edit ~/backend/.env:
NODE_OPTIONS=--max-old-space-size=1024

# Solution 2: Restart application
touch ~/backend/tmp/restart.txt

# Solution 3: Check for memory leaks
# Review code for:
# - Large arrays not cleared
# - Event listeners not removed
# - Circular references
# - Large JSON files loaded repeatedly

# Solution 4: Reduce Passenger pool size
# Edit ~/backend/.htaccess:
PassengerMaxPoolSize 2
PassengerMinInstances 1

# Solution 5: Enable Passenger memory-based spawning
PassengerMaxPoolSize 4
PassengerMaxRequestQueueSize 50

# Solution 6: Upgrade cPanel plan
# For more RAM allocation
```

---

#### Issue 10: High CPU Usage
**Symptoms:**
- Server unresponsive
- API calls timing out
- cPanel shows CPU limit exceeded

**Diagnosis:**
```bash
# Check CPU usage
top -u [your_username]
# Look for node processes

# Check Apache processes
ps aux | grep apache
```

**Solutions:**
```bash
# Solution 1: Optimize database queries
# Add indexes, use LIMIT clauses

# Solution 2: Implement caching
# Add Redis or in-memory cache

# Solution 3: Reduce concurrent requests
# Edit ~/backend/.htaccess:
PassengerMaxPoolSize 2

# Solution 4: Add rate limiting
# In backend code, limit API calls per IP

# Solution 5: Optimize frontend bundle
# Lazy load components
# Code split routes
# Reduce bundle size

# Solution 6: Check for infinite loops
# Review backend logs for repeating errors

# Solution 7: Upgrade hosting plan
# For dedicated CPU resources
```

---

### 10.5 SSL/HTTPS Issues

#### Issue 11: SSL Certificate Errors
**Symptoms:**
- Browser shows "Not Secure"
- Certificate expired warning
- Error: "ERR_CERT_AUTHORITY_INVALID"

**Diagnosis:**
```bash
# Check certificate status
openssl s_client -connect breakdowns.gobarry.co.uk:443 -servername breakdowns.gobarry.co.uk < /dev/null 2>/dev/null | grep -A 2 "Verify return"
```

**Solutions:**
```bash
# Solution 1: Install/Renew Let's Encrypt
# Via cPanel SSL/TLS Status:
# 1. Find your domain
# 2. Click "Run AutoSSL"
# 3. Wait for completion

# Solution 2: Manual certificate installation
# Via cPanel SSL/TLS → Manage SSL:
# 1. Upload certificate
# 2. Upload private key
# 3. Upload CA bundle
# 4. Install

# Solution 3: Check DNS
# Via cPanel Zone Editor:
# Verify A record points to correct IP

# Solution 4: Force HTTPS redirect
# Already in .htaccess, but verify:
cat ~/public_html/.htaccess | grep "HTTPS off"

# Solution 5: Check SSL date/time
date
# Server time must be correct for SSL validation

# Solution 6: Clear SSL cache
# Remove old certificates
cd /etc/letsencrypt/archive/
ls -la
# Delete old symlinks if duplicates exist
```

---

### 10.6 Common Error Messages

#### Error: "502 Bad Gateway"
**Cause:** Backend not running or unreachable
**Fix:**
```bash
# Restart Node.js app
touch ~/backend/tmp/restart.txt

# Check if running
passenger-status

# If not running, check logs
tail -50 ~/logs/passenger.log
```

---

#### Error: "503 Service Unavailable"
**Cause:** Apache or Passenger overloaded
**Fix:**
```bash
# Increase Passenger pool
# Edit ~/backend/.htaccess:
PassengerMaxPoolSize 6

# Restart Apache (via cPanel)
# Services → Restart Apache
```

---

#### Error: "ECONNREFUSED"
**Cause:** Database connection failed
**Fix:**
```bash
# Check MySQL running
mysqladmin -u [user] -p status

# Test connection
mysql -u gobarryco_breakdowns_user -p gobarryco_breakdowns -e "SELECT 1;"

# Check credentials in .env
cat ~/backend/.env | grep ^DB_
```

---

#### Error: "MODULE_NOT_FOUND"
**Cause:** Missing npm package
**Fix:**
```bash
cd ~/backend
npm install [missing_module]

# Or reinstall all
npm ci --production
```

---

#### Error: "CORS policy: No 'Access-Control-Allow-Origin'"
**Cause:** CORS not configured
**Fix:**
```bash
# Check .htaccess has CORS headers
cat ~/public_html/.htaccess | grep "Access-Control-Allow-Origin"

# Add if missing:
Header always set Access-Control-Allow-Origin "https://breakdowns.gobarry.co.uk"
```

---

#### Error: "Invalid token" or "Token expired"
**Cause:** JWT authentication issue
**Fix:**
```bash
# Check JWT secret is set
cat ~/backend/.env | grep JWT_SECRET
# Should not be empty

# Clear browser localStorage
# In browser console:
localStorage.clear()

# Login again
```

---

## Final Verification Checklist

**After completing all steps, verify:**

### Critical Systems
- [ ] Frontend loads at https://breakdowns.gobarry.co.uk
- [ ] Backend API responds at /api/health
- [ ] Database connection working
- [ ] WebSocket connections establish
- [ ] SSL certificate valid
- [ ] HTTPS redirect working

### Authentication
- [ ] Login page loads
- [ ] Valid credentials accepted
- [ ] Invalid credentials rejected
- [ ] JWT tokens generated
- [ ] Session management works

### Core Functionality
- [ ] Can create breakdown records
- [ ] Can view breakdown list
- [ ] Activity feed updates
- [ ] Dashboard displays correctly
- [ ] Control Room Display works
- [ ] Engineering dashboard accessible

### Performance
- [ ] API response times < 500ms
- [ ] Frontend loads < 3 seconds
- [ ] WebSocket latency < 100ms
- [ ] No memory leaks
- [ ] CPU usage reasonable

### Real-Time Features
- [ ] All 5 WebSocket channels working
- [ ] Real-time breakdown updates
- [ ] Activity feed live updates
- [ ] Assessment progress tracking
- [ ] Engineer assignment notifications

### Mobile & Accessibility
- [ ] Responsive on mobile devices
- [ ] Touch interactions work
- [ ] No horizontal scrolling
- [ ] Text readable on small screens

### Database
- [ ] All 6-7 tables exist
- [ ] Indexes present (20+ total)
- [ ] Queries execute successfully
- [ ] Data integrity maintained
- [ ] Backup taken

### Monitoring
- [ ] Error logging working
- [ ] Passenger logs accessible
- [ ] Database logs available
- [ ] Can monitor resource usage

---

## Post-Deployment Tasks

**After successful deployment:**

1. **Update Documentation**
   - [ ] Record deployment date
   - [ ] Document any issues encountered
   - [ ] Update version numbers
   - [ ] Add to deployment log

2. **Monitor System**
   - [ ] Watch logs for first 24 hours
   - [ ] Monitor error rates
   - [ ] Check performance metrics
   - [ ] Verify real-time updates working

3. **User Communication**
   - [ ] Notify supervisors of deployment
   - [ ] Inform of any changes/new features
   - [ ] Provide support contact

4. **Backup Verification**
   - [ ] Test backup restoration process
   - [ ] Schedule automated backups
   - [ ] Verify backup retention

5. **Security Review**
   - [ ] Review access logs
   - [ ] Check for failed login attempts
   - [ ] Verify SSL certificate expiration
   - [ ] Review CORS configuration

---

## Emergency Contacts

**Technical Support:**
- cPanel Provider: [hosting provider support]
- DNS Provider: [DNS provider support]
- SSL Provider: Let's Encrypt (automated)

**Internal Contacts:**
- Lead Developer: anthony.gair@gonortheast.co.uk
- Operations Manager: Barry Perryman
- IT Support: [internal IT contact]

**Monitoring:**
- cPanel Health Check: https://gobarry.co.uk/cpanel
- Application Health: https://breakdowns.gobarry.co.uk/api/health
- Database Status: Via phpMyAdmin

---

## Deployment History Log

**Record each deployment:**

| Date | Version | Deployed By | Status | Notes |
|------|---------|-------------|--------|-------|
| 2025-10-27 | 1.5.4 | Anthony Gair | Success | Initial cPanel deployment |

---

**End of Checklist**

**Total Estimated Time:** 2-3 hours (first deployment), 1-2 hours (subsequent deployments)

**Questions or Issues?**
Contact: anthony.gair@gonortheast.co.uk
