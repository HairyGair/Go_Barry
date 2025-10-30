# FINAL DEPLOYMENT READINESS CHECKLIST
## Go BARRY Breakdown Management System - cPanel Production Deployment

**Version:** 3.0.0
**Last Updated:** October 27, 2025
**Deployment Target:** breakdowns.gobarry.co.uk (cPanel)
**Estimated Total Time:** 2-3 hours (first deployment), 1-2 hours (subsequent)
**Critical Path:** Yes - impacts live operations for 9 supervisors

---

## Quick Reference

**Status Legend:**
- ⚠️ **Critical** - Must complete, deployment blocker
- 🔴 **High** - Should complete, may impact stability
- 🟡 **Medium** - Recommended, improves performance
- 🟢 **Low** - Optional, nice-to-have

**Sign-Off Required:**
- 📋 Technical Lead (Anthony Gair)
- 👔 Operations Manager (Barry Perryman)
- 🔒 IT Security (if applicable)

---

## Table of Contents

1. [Phase 1: Preparation (T-24 hours)](#phase-1-preparation)
2. [Phase 2: Pre-Flight Checks (T-1 hour)](#phase-2-pre-flight-checks)
3. [Phase 3: Deployment Execution (T=0)](#phase-3-deployment-execution)
4. [Phase 4: Immediate Verification (T+15 min)](#phase-4-immediate-verification)
5. [Phase 5: 24-48 Hour Monitoring](#phase-5-24-48-hour-monitoring)
6. [Rollback Decision Points](#rollback-decision-points)
7. [Emergency Contacts](#emergency-contacts)

---

## PHASE 1: PREPARATION
### Before Deployment Day (T-24 hours)

**Duration:** 60-90 minutes
**Rollback Point:** Yes - Nothing committed yet
**Sign-Off Required:** Technical Lead

---

### 1.1 Code Verification

#### [ ] Task: Code Review Complete
- **Priority:** ⚠️ Critical
- **Expected Outcome:** All code reviewed, approved, and merged to main branch
- **Verification:**
  ```bash
  cd "/Users/anthony/Go BARRY App/BreakdownGuideapp"
  git status
  git log --oneline -5
  ```
- **Success Criteria:**
  - `git status` shows "working tree clean"
  - Latest commit contains deployment changes
  - No uncommitted changes
- **Time:** 15 minutes
- **Reference:** CODEBASE_EXPLORATION_REPORT.md
- **If Fails:** Complete code review before proceeding

---

#### [ ] Task: Security Audit
- **Priority:** ⚠️ Critical
- **Expected Outcome:** No critical/high vulnerabilities
- **Verification:**
  ```bash
  cd backend
  npm audit
  npm audit fix --dry-run
  ```
- **Success Criteria:**
  - 0 critical vulnerabilities
  - 0 high vulnerabilities
  - Medium/low documented and accepted
- **Time:** 10 minutes
- **Reference:** AUTHENTICATION_SECURITY_STRATEGY.md
- **If Fails:** Fix critical vulnerabilities, re-audit

---

#### [ ] Task: Build Verification
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Both frontend and backend build successfully
- **Verification:**
  ```bash
  # Backend test
  cd backend
  node server.js
  # Should start without errors, Ctrl+C to stop

  # Frontend build
  cd ../frontend
  npm run build:cpanel
  # Should complete with dist/ folder created
  ```
- **Success Criteria:**
  - Backend starts without errors
  - Frontend builds successfully
  - `dist/` folder contains index.html, assets/, .htaccess
- **Time:** 10 minutes
- **Reference:** CPANEL_INTEGRATION_GUIDE.md, Section 6
- **If Fails:** Fix build errors, re-test

---

### 1.2 Environment Configuration

#### [ ] Task: Production .env Files Prepared
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Both backend and frontend .env files ready
- **Verification:**
  ```bash
  # Check backend .env template
  cat backend/.env.example

  # Check frontend .env
  cat frontend/.env
  grep "https://breakdowns.gobarry.co.uk" frontend/.env
  ```
- **Success Criteria:**
  - Backend .env.example has all required variables
  - Frontend .env uses production URLs (HTTPS)
  - No localhost references in production configs
  - JWT secrets generated (64 characters)
  - Database credentials ready
- **Time:** 15 minutes
- **Reference:** CPANEL_INTEGRATION_GUIDE.md, lines 824-1100
- **If Fails:** Complete environment configuration

**Required Variables:**
```bash
# Backend .env (minimum required)
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_NAME=gobarryco_breakdowns
DB_USER=gobarryco_breakdowns_user
DB_PASSWORD=[strong_password]
API_BASE_URL=https://breakdowns.gobarry.co.uk/api
APP_URL=https://breakdowns.gobarry.co.uk
SESSION_SECRET=[64_char_secret]
JWT_SECRET=[64_char_secret]
NODE_OPTIONS=--max-old-space-size=512

# Frontend .env
VITE_API_URL=https://breakdowns.gobarry.co.uk
VITE_API_BASE_URL=https://breakdowns.gobarry.co.uk/api
VITE_WS_URL=wss://breakdowns.gobarry.co.uk
VITE_ENABLE_AUTH=true
VITE_ENABLE_MOCK_DATA=false
```

---

#### [ ] Task: Database Credentials Secured
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Database credentials stored securely
- **Verification:**
  - MySQL database created in cPanel
  - Database user created with strong password
  - Password stored in password manager
  - Connection tested from cPanel Terminal
- **Success Criteria:**
  ```bash
  mysql -u gobarryco_breakdowns_user -p gobarryco_breakdowns -e "SELECT 1;"
  # Returns: 1
  ```
- **Time:** 10 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 310-345
- **If Fails:** Create database and user in cPanel MySQL Databases

---

### 1.3 Backups

#### [ ] Task: Current Production Backed Up
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Full backup of current production system
- **Verification:**
  ```bash
  # Via cPanel File Manager
  # 1. Compress public_html/ → backup_YYYYMMDD_HHMMSS.zip
  # 2. Download backup
  # 3. Verify file size > 0 bytes
  ```
- **Success Criteria:**
  - File backup downloaded to local machine
  - Database backup exported to SQL file
  - Backups labeled with timestamp
  - Backup integrity verified (can extract/open)
- **Time:** 10 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 248-304
- **If Fails:** Cannot proceed without backups

**Backup Checklist:**
- [ ] Files: `~/public_html/` compressed
- [ ] Database: SQL export via phpMyAdmin
- [ ] Node modules: Document package versions
- [ ] Current .env files: Saved locally
- [ ] Apache configs: Saved if customized

---

#### [ ] Task: Database Schema Backup
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Database structure and data exported
- **Verification:**
  ```sql
  -- Via phpMyAdmin Export
  -- Database: gobarryco_breakdowns
  -- Format: SQL
  -- Include: Structure and Data
  ```
- **Success Criteria:**
  - SQL file downloaded
  - File size > 0 bytes
  - Contains CREATE TABLE statements
  - Contains INSERT statements (data)
  - File named: `db_backup_YYYYMMDD_HHMMSS.sql`
- **Time:** 5 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 277-304
- **If Fails:** Cannot proceed without database backup

---

### 1.4 Deployment Package

#### [ ] Task: Create Clean Deployment Package
- **Priority:** 🔴 High
- **Expected Outcome:** Zip file ready for upload
- **Verification:**
  ```bash
  cd "/Users/anthony/Go BARRY App/BreakdownGuideapp"

  # Create deployment directory
  mkdir -p deployment_$(date +%Y%m%d)

  # Copy backend (exclude node_modules)
  rsync -av --exclude 'node_modules' backend/ deployment_*/backend/

  # Copy frontend dist
  cp -r frontend/dist/* deployment_*/public_html/

  # Create zip
  zip -r deployment_$(date +%Y%m%d).zip deployment_*/
  ```
- **Success Criteria:**
  - Zip file created
  - Size: 10-50MB (without node_modules)
  - Contains backend/, public_html/ folders
  - No .git/, node_modules/ included
- **Time:** 10 minutes
- **Reference:** CPANEL_ONLY_DEPLOYMENT_GUIDE.md, lines 456-497
- **If Fails:** Re-create package excluding unnecessary files

---

### 1.5 Communication

#### [ ] Task: Stakeholder Notification
- **Priority:** 🔴 High
- **Expected Outcome:** All stakeholders aware of deployment
- **Verification:**
  - Email sent to Operations Manager
  - SDC operators notified of potential downtime
  - Supervisors informed via Teams/Email
- **Success Criteria:**
  - Deployment window communicated
  - Expected downtime: 15-30 minutes
  - Rollback plan communicated
  - Emergency contact provided
- **Time:** 15 minutes
- **Reference:** N/A
- **If Fails:** Deployment may proceed but with risks

**Email Template:**
```
Subject: Go BARRY Production Deployment - [Date] at [Time]

Hello team,

We will be deploying updates to the Go BARRY Breakdown Management System:

Date: [Deployment Date]
Time: [Start Time] - [End Time]
Expected Downtime: 15-30 minutes maximum
URL: https://breakdowns.gobarry.co.uk

What to expect:
- Brief service interruption during deployment
- Login page may be unavailable for 15-30 minutes
- All data will be preserved
- System will be tested before re-opening access

Emergency Contact:
Anthony Gair: anthony.gair@gonortheast.co.uk

Thank you for your patience.
```

---

### 1.6 Pre-Deployment Testing

#### [ ] Task: Local Integration Test
- **Priority:** 🔴 High
- **Expected Outcome:** Full system tested locally
- **Verification:**
  ```bash
  # Start backend
  cd backend
  npm run dev

  # In another terminal, test frontend
  cd frontend
  npm run dev

  # Open browser to http://localhost:5173
  # Test login, breakdown creation, dashboard
  ```
- **Success Criteria:**
  - Backend starts without errors
  - Frontend connects to backend
  - Login works
  - Breakdown creation works
  - WebSocket connects
  - No console errors
- **Time:** 20 minutes
- **Reference:** SCREEN_TO_SCREEN_DATA_FLOW.md
- **If Fails:** Fix integration issues before deployment

---

**PHASE 1 SIGN-OFF**

- [ ] **Technical Lead Approval:** All preparation tasks completed
- [ ] **Deployment Package Ready:** Zip file prepared
- [ ] **Backups Verified:** Current production backed up
- [ ] **Stakeholders Notified:** Communication sent

**Name:** ________________  **Date:** __________  **Time:** __________

---

## PHASE 2: PRE-FLIGHT CHECKS
### Day of Deployment (T-1 hour)

**Duration:** 30 minutes
**Rollback Point:** Yes - Can cancel deployment
**Sign-Off Required:** Technical Lead

---

### 2.1 System Readiness

#### [ ] Task: cPanel Access Verified
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Can access cPanel and SSH
- **Verification:**
  ```bash
  # Test cPanel login
  # URL: https://gobarry.co.uk:2083
  # Username: [your_username]

  # Test SSH access (if available)
  ssh user@gobarry.co.uk
  # Should connect successfully
  ```
- **Success Criteria:**
  - cPanel dashboard loads
  - Can navigate to File Manager
  - SSH connection established (if using)
  - No account suspensions or issues
- **Time:** 5 minutes
- **Reference:** CPANEL_INTEGRATION_GUIDE.md, lines 75-149
- **If Fails:** Contact hosting provider immediately

---

#### [ ] Task: Server Resource Check
- **Priority:** 🔴 High
- **Expected Outcome:** Server has adequate resources
- **Verification:**
  ```bash
  # Via cPanel: Check CPU and Memory Usage widget
  # Or via SSH:
  free -h
  df -h
  ```
- **Success Criteria:**
  - Memory available: > 512MB free
  - Disk space available: > 2GB free
  - CPU usage: < 70%
  - Inodes available: > 20,000
- **Time:** 5 minutes
- **Reference:** CPANEL_ONLY_DEPLOYMENT_GUIDE.md, lines 293-357
- **If Fails:** Free up resources or upgrade plan

---

#### [ ] Task: Node.js Version Confirmed
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Node.js 18+ available
- **Verification:**
  ```bash
  # Via cPanel Terminal or SSH
  node --version
  npm --version
  ```
- **Success Criteria:**
  - Node.js version: v18.x.x or v20.x.x
  - npm version: 9.x or 10.x
  - Versions match deployment requirements
- **Time:** 2 minutes
- **Reference:** CPANEL_ONLY_DEPLOYMENT_GUIDE.md, lines 117-149
- **If Fails:** Install Node.js 18+ via cPanel Node.js Selector

**Decision Point:** If Node.js <18, contact hosting to install

---

#### [ ] Task: Database Connectivity Test
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Can connect to MySQL database
- **Verification:**
  ```bash
  # Via cPanel Terminal or SSH
  mysql -h localhost -u gobarryco_breakdowns_user -p gobarryco_breakdowns -e "SHOW TABLES;"
  ```
- **Success Criteria:**
  - Connection succeeds
  - Can list tables (even if empty)
  - No authentication errors
  - Response time < 5 seconds
- **Time:** 3 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 310-345
- **If Fails:** Fix database credentials before proceeding

---

### 2.2 Deployment Readiness

#### [ ] Task: Maintenance Mode Ready
- **Priority:** 🟡 Medium
- **Expected Outcome:** Can enable maintenance page if needed
- **Verification:**
  - Create `maintenance.html` in public_html/
  - Test .htaccess redirect to maintenance page
- **Success Criteria:**
  - Maintenance page displays correctly
  - Easy to enable/disable
  - Users see clear message
- **Time:** 5 minutes
- **Reference:** N/A
- **If Fails:** Deploy without maintenance mode (optional)

**Simple Maintenance Page:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Go BARRY - Maintenance</title>
</head>
<body style="text-align:center; padding:50px; font-family:Arial;">
  <h1>🔧 System Maintenance</h1>
  <p>Go BARRY is being updated.</p>
  <p>We'll be back shortly. Thank you for your patience.</p>
  <p><small>Expected completion: [Time]</small></p>
</body>
</html>
```

---

#### [ ] Task: SSL Certificate Valid
- **Priority:** ⚠️ Critical
- **Expected Outcome:** SSL certificate active and valid
- **Verification:**
  ```bash
  # Check certificate
  openssl s_client -connect breakdowns.gobarry.co.uk:443 -servername breakdowns.gobarry.co.uk < /dev/null 2>/dev/null | grep -A 2 "Verify return code"
  # Expected: Verify return code: 0 (ok)
  ```
- **Success Criteria:**
  - Certificate valid (not expired)
  - Domain matches: breakdowns.gobarry.co.uk
  - Issued by: Let's Encrypt or trusted CA
  - Expiration date > 7 days away
- **Time:** 3 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 1506-1595
- **If Fails:** Install/renew SSL via cPanel AutoSSL

---

#### [ ] Task: Final Code Freeze
- **Priority:** ⚠️ Critical
- **Expected Outcome:** No code changes during deployment
- **Verification:**
  ```bash
  git status
  git log --oneline -1
  ```
- **Success Criteria:**
  - Working tree clean
  - Latest commit is deployment commit
  - No pending pull requests
  - All team members notified of freeze
- **Time:** 2 minutes
- **Reference:** N/A
- **If Fails:** Resolve conflicts, commit changes

---

#### [ ] Task: Rollback Plan Reviewed
- **Priority:** 🔴 High
- **Expected Outcome:** Team knows rollback procedure
- **Verification:**
  - Backup files accessible
  - Rollback steps documented
  - Time estimate: < 10 minutes to rollback
- **Success Criteria:**
  - Can restore from backup
  - Database can be rolled back
  - Backup tested (can extract)
- **Time:** 5 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 2098-2297
- **If Fails:** Review rollback procedures with team

---

**PHASE 2 SIGN-OFF**

- [ ] **System Ready:** All pre-flight checks passed
- [ ] **Resources Adequate:** Server capacity confirmed
- [ ] **SSL Valid:** Certificate active
- [ ] **Rollback Ready:** Can revert if needed

**Name:** ________________  **Date:** __________  **Time:** __________

---

## PHASE 3: DEPLOYMENT EXECUTION
### Actual Deployment Steps (T=0)

**Duration:** 45-60 minutes
**Rollback Points:** Multiple checkpoints
**Sign-Off Required:** Technical Lead (after each phase)

---

### 3.1 Database Deployment

#### [ ] Task: Apply Database Migrations
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Database schema updated
- **Verification:**
  ```sql
  -- Via phpMyAdmin
  -- Run: backend/migrations/QUICKSTART_SUPABASE_FIXED.sql
  -- Then verify:
  SHOW TABLES;
  -- Expected: 6-7 tables
  ```
- **Success Criteria:**
  - All tables created successfully
  - Indexes applied
  - Character set: utf8mb4
  - No SQL errors
  - Query execution time < 30 seconds
- **Time:** 10 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 349-441
- **If Fails:** STOP - Restore database from backup

**Critical Tables:**
- supervisors
- breakdowns
- activities
- wizard_progress
- fleet_vehicles
- supervisor_sessions

**CHECKPOINT 1:** Can rollback database without affecting production

---

#### [ ] Task: Verify Database Structure
- **Priority:** ⚠️ Critical
- **Expected Outcome:** All tables and indexes present
- **Verification:**
  ```sql
  -- Check tables
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = 'gobarryco_breakdowns';
  -- Expected: 6-7

  -- Check indexes
  SHOW INDEX FROM breakdowns;
  -- Expected: 7+ indexes

  -- Test write operation
  INSERT INTO activities (activity_type, message)
  VALUES ('deployment_test', 'Deployment verification test');
  SELECT * FROM activities WHERE activity_type = 'deployment_test';
  DELETE FROM activities WHERE activity_type = 'deployment_test';
  ```
- **Success Criteria:**
  - All tables present
  - All indexes created
  - Can INSERT, SELECT, DELETE
  - No permission errors
- **Time:** 5 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 590-648
- **If Fails:** STOP - Fix database issues before proceeding

---

### 3.2 Backend Deployment

#### [ ] Task: Upload Backend Files
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Backend code uploaded to server
- **Verification:**
  ```bash
  # Via cPanel File Manager or SSH
  ls -la ~/backend/
  # Should show: server.js, routes/, services/, package.json

  # Count files
  find ~/backend -type f | wc -l
  # Expected: 50-100 files
  ```
- **Success Criteria:**
  - All backend files uploaded
  - Directory structure intact
  - File permissions: 644 (files), 755 (directories)
  - No upload errors
  - Total size: 10-50MB
- **Time:** 10 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 657-708
- **If Fails:** Re-upload files, verify FTP connection

**CHECKPOINT 2:** Can delete uploaded files without affecting current production

---

#### [ ] Task: Create Production .env File
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Environment variables configured
- **Verification:**
  ```bash
  # Via cPanel File Manager or SSH
  cat ~/backend/.env | grep -c "="
  # Expected: 10-15 variables

  # Check no placeholder values
  grep -E "(your_|change_in_|REPLACE)" ~/backend/.env
  # Expected: No results
  ```
- **Success Criteria:**
  - .env file created in ~/backend/
  - All required variables present
  - No placeholder values
  - Secrets are truly random
  - File permissions: 600 (read/write owner only)
- **Time:** 5 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 710-763
- **If Fails:** STOP - Missing or incorrect environment variables

---

#### [ ] Task: Install Node.js Dependencies
- **Priority:** ⚠️ Critical
- **Expected Outcome:** All dependencies installed
- **Verification:**
  ```bash
  cd ~/backend
  npm ci --production

  # Verify
  ls node_modules/ | wc -l
  # Expected: 80-100 packages

  # Check critical packages
  ls node_modules/ | grep -E "express|mysql2|ws|bcrypt|jsonwebtoken"
  # All should exist
  ```
- **Success Criteria:**
  - Dependencies installed successfully
  - No installation errors
  - Critical packages present
  - Installation time < 10 minutes
- **Time:** 10 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 768-812
- **If Fails:** Clear npm cache, retry installation

**CHECKPOINT 3:** Can remove node_modules and re-install without affecting production

---

#### [ ] Task: Configure Backend .htaccess
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Apache configured for Node.js
- **Verification:**
  ```bash
  cat ~/backend/.htaccess | grep "PassengerAppRoot"
  # Should show correct absolute path

  which node
  # Use this path in PassengerNodejs directive
  ```
- **Success Criteria:**
  - .htaccess file created
  - Passenger directives present
  - Correct Node.js path
  - Correct application root path
  - CORS headers configured
- **Time:** 5 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 817-883
- **If Fails:** Fix .htaccess configuration

---

#### [ ] Task: Test Backend Startup
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Backend starts without errors
- **Verification:**
  ```bash
  cd ~/backend
  node server.js

  # Expected output:
  # 🚀 Backend server starting...
  # ✓ Database connection established
  # ✓ 14 route modules loaded
  # 🚀 Backend server running on port 3001

  # Press Ctrl+C to stop
  ```
- **Success Criteria:**
  - Server starts successfully
  - Database connects
  - All routes load
  - No startup errors
  - Startup time < 30 seconds
- **Time:** 5 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 886-975
- **If Fails:** STOP - Fix startup errors before proceeding

**CHECKPOINT 4:** Backend tested manually, can proceed to Node.js app setup

---

### 3.3 Frontend Deployment

#### [ ] Task: Upload Frontend Build
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Frontend files uploaded to public_html
- **Verification:**
  ```bash
  # Via cPanel File Manager or SSH
  ls -la ~/public_html/
  # Expected: index.html, assets/, .htaccess

  # Check index.html size
  ls -lh ~/public_html/index.html
  # Should be > 10KB

  # Check assets folder
  ls ~/public_html/assets/ | wc -l
  # Expected: 20-50 files
  ```
- **Success Criteria:**
  - All frontend files uploaded
  - index.html present
  - assets/ folder with JS/CSS/images
  - .htaccess for React Router
  - No upload errors
- **Time:** 10 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 1090-1166
- **If Fails:** Re-upload frontend files

**CHECKPOINT 5:** Can delete frontend files without affecting backend

---

#### [ ] Task: Configure Frontend .htaccess
- **Priority:** ⚠️ Critical
- **Expected Outcome:** React Router and API proxy configured
- **Verification:**
  ```bash
  cat ~/public_html/.htaccess | grep -A 5 "RewriteRule"
  # Should show React Router rules and API proxy
  ```
- **Success Criteria:**
  - .htaccess present
  - React Router rules configured
  - API proxy rules for /api/
  - WebSocket proxy for /ws/
  - HTTPS redirect configured
  - Security headers present
- **Time:** 5 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 1170-1267
- **If Fails:** Fix .htaccess configuration

---

### 3.4 Node.js Application Setup

#### [ ] Task: Create Node.js App in cPanel
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Node.js app registered and running
- **Verification:**
  ```bash
  # Via cPanel: Setup Node.js App
  # Check application shows as "Running"
  # Green indicator, PID displayed
  ```
- **Success Criteria:**
  - Application created successfully
  - Node.js version: 18+
  - Application mode: Production
  - Application root: correct path
  - Startup file: server.js
  - Status: Running
- **Time:** 10 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 1347-1503
- **If Fails:** Review application configuration, check logs

---

#### [ ] Task: Configure Environment Variables in cPanel
- **Priority:** ⚠️ Critical
- **Expected Outcome:** All environment variables set
- **Verification:**
  ```bash
  # In cPanel Node.js App Manager
  # Check environment variables tab
  # Verify all required variables present
  ```
- **Success Criteria:**
  - NODE_ENV=production
  - PORT=3001
  - All database credentials set
  - JWT secrets configured
  - Memory limit set
- **Time:** 5 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 1540-1555
- **If Fails:** Add missing environment variables

---

#### [ ] Task: Start Node.js Application
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Application running and responding
- **Verification:**
  ```bash
  # Test health endpoint (internal)
  curl http://localhost:3001/api/health

  # Test health endpoint (external)
  curl https://breakdowns.gobarry.co.uk/api/health

  # Expected:
  # {"status":"healthy","timestamp":"..."}
  ```
- **Success Criteria:**
  - Application started
  - Health endpoint responds
  - Database connected
  - WebSocket active
  - Response time < 1 second
- **Time:** 5 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 1456-1503
- **If Fails:** STOP - Check Passenger logs, fix startup issues

**CHECKPOINT 6:** Backend is live, can test API endpoints

---

**PHASE 3 SIGN-OFF**

- [ ] **Database Deployed:** All migrations applied successfully
- [ ] **Backend Running:** Node.js application active
- [ ] **Frontend Uploaded:** Static files in place
- [ ] **Application Started:** Health check responds

**Name:** ________________  **Date:** __________  **Time:** __________

---

## PHASE 4: IMMEDIATE VERIFICATION
### Post-Deployment Testing (T+15 minutes)

**Duration:** 30 minutes
**Rollback Point:** Yes - Can rollback if critical issues found
**Sign-Off Required:** Technical Lead + Operations Manager

---

### 4.1 Health Checks

#### [ ] Task: Backend Health Verification
- **Priority:** ⚠️ Critical
- **Expected Outcome:** All systems healthy
- **Verification:**
  ```bash
  curl https://breakdowns.gobarry.co.uk/api/health

  # Expected:
  {
    "status": "healthy",
    "timestamp": "2025-10-27T...",
    "database": "connected",
    "routes": 165,
    "websocket": "active"
  }
  ```
- **Success Criteria:**
  - status: "healthy"
  - database: "connected"
  - routes: 165
  - websocket: "active"
  - Response time < 500ms
- **Time:** 2 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 1604-1644
- **If Fails:** ROLLBACK - Backend not healthy

---

#### [ ] Task: Frontend Load Test
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Frontend loads correctly
- **Verification:**
  ```bash
  # Test homepage
  curl -I https://breakdowns.gobarry.co.uk
  # Expected: HTTP/1.1 200 OK

  # Open in browser
  # Navigate to: https://breakdowns.gobarry.co.uk
  ```
- **Success Criteria:**
  - Page loads (no 404/500 errors)
  - Login page displays
  - No JavaScript errors in console
  - Logo/branding visible
  - Page loads < 3 seconds
- **Time:** 3 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 1904-1963
- **If Fails:** ROLLBACK - Frontend not accessible

---

### 4.2 Authentication Flow

#### [ ] Task: Login Test
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Authentication works
- **Verification:**
  ```bash
  # Test via API
  curl -X POST https://breakdowns.gobarry.co.uk/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"badge":"AG003","password":"actual_password"}'

  # Via browser
  # 1. Go to https://breakdowns.gobarry.co.uk
  # 2. Enter supervisor badge: AG003
  # 3. Enter password
  # 4. Click Login
  ```
- **Success Criteria:**
  - API returns JWT token
  - Browser redirects to dashboard
  - Session created in database
  - No authentication errors
  - Login time < 2 seconds
- **Time:** 5 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 1700-1762
- **If Fails:** CRITICAL - ROLLBACK if login broken

**Test Credentials:**
- Badge: AG003 (admin)
- Badge: BP009 (admin)
- Badge: [test supervisor]

---

### 4.3 Core Functionality

#### [ ] Task: Breakdown Creation Test
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Can create breakdown
- **Verification:**
  ```bash
  # Via API (with token from login)
  curl -X POST https://breakdowns.gobarry.co.uk/api/breakdowns \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "fleet_no": "1234",
      "location_description": "Test Location",
      "issue_category": "Engine",
      "severity": "AMBER"
    }'

  # Via browser
  # 1. Login as supervisor
  # 2. Click "New Breakdown"
  # 3. Fill in wizard
  # 4. Submit
  ```
- **Success Criteria:**
  - Breakdown created successfully
  - Returns breakdown_id
  - Stored in database
  - Activity logged
  - Response time < 2 seconds
- **Time:** 5 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 1769-1830
- **If Fails:** CRITICAL - ROLLBACK if core function broken

---

#### [ ] Task: Dashboard Display Test
- **Priority:** ⚠️ Critical
- **Expected Outcome:** Dashboard loads and displays data
- **Verification:**
  ```bash
  # Via browser
  # 1. Login
  # 2. Navigate to dashboard
  # 3. Verify breakdown list displays
  # 4. Check statistics update
  # 5. Test filters
  ```
- **Success Criteria:**
  - Dashboard loads
  - Breakdown list visible
  - Statistics display correctly
  - Filters work
  - No console errors
- **Time:** 5 minutes
- **Reference:** SCREEN_TO_SCREEN_DATA_FLOW.md
- **If Fails:** HIGH - May proceed with monitoring

---

### 4.4 WebSocket Verification

#### [ ] Task: Real-Time Connection Test
- **Priority:** 🔴 High
- **Expected Outcome:** WebSocket connects and broadcasts
- **Verification:**
  ```bash
  # Via wscat
  wscat -c "wss://breakdowns.gobarry.co.uk/ws"

  # Via browser console
  const ws = new WebSocket('wss://breakdowns.gobarry.co.uk/ws');
  ws.onopen = () => console.log('✓ Connected');
  ws.onmessage = (e) => console.log('Received:', e.data);
  ```
- **Success Criteria:**
  - WebSocket connection establishes
  - Ping/pong works
  - Can subscribe to channels
  - Receives test messages
  - No connection drops
- **Time:** 5 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 1834-1898
- **If Fails:** MEDIUM - Can proceed without WebSocket

**Decision Point:** If WebSocket fails, enable fallback polling

---

### 4.5 Database Operations

#### [ ] Task: Database Query Verification
- **Priority:** 🔴 High
- **Expected Outcome:** All database operations work
- **Verification:**
  ```sql
  -- Via phpMyAdmin

  -- Check tables
  SHOW TABLES;

  -- Check supervisors
  SELECT COUNT(*) FROM supervisors WHERE is_active = TRUE;
  -- Expected: 9-13

  -- Check breakdowns
  SELECT COUNT(*) FROM breakdowns WHERE status = 'active';

  -- Test JOIN
  SELECT b.breakdown_id, s.name
  FROM breakdowns b
  LEFT JOIN supervisors s ON b.supervisor_badge = s.badge_number
  LIMIT 5;
  ```
- **Success Criteria:**
  - All tables accessible
  - Queries execute successfully
  - JOIN queries work (< 100ms)
  - Data integrity maintained
- **Time:** 5 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 1967-2033
- **If Fails:** HIGH - Check database connection

---

### 4.6 Performance Baseline

#### [ ] Task: Response Time Check
- **Priority:** 🟡 Medium
- **Expected Outcome:** Acceptable performance
- **Verification:**
  ```bash
  # Health endpoint (should be fastest)
  time curl -s https://breakdowns.gobarry.co.uk/api/health > /dev/null
  # Expected: < 200ms

  # Breakdown list (database query)
  time curl -s -H "Authorization: Bearer $TOKEN" \
    https://breakdowns.gobarry.co.uk/api/breakdowns/live > /dev/null
  # Expected: < 1000ms
  ```
- **Success Criteria:**
  - Health check: < 200ms
  - API endpoints: < 1000ms
  - Frontend load: < 3 seconds
  - No timeouts
- **Time:** 5 minutes
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 2037-2091
- **If Fails:** LOW - Document for optimization

---

**PHASE 4 SIGN-OFF**

- [ ] **Health Checks Pass:** All systems healthy
- [ ] **Authentication Works:** Login successful
- [ ] **Core Functions Work:** Can create breakdowns
- [ ] **Performance Acceptable:** Response times within targets

**Technical Lead:** ________________  **Date:** __________
**Operations Manager:** ________________  **Date:** __________

**GO/NO-GO DECISION:** Proceed to production ☐ YES  ☐ NO (rollback)

---

## PHASE 5: 24-48 HOUR MONITORING
### Post-Deployment Observation

**Duration:** 24-48 hours
**Rollback Point:** Yes - Can rollback with data migration
**Sign-Off Required:** Technical Lead (after 48 hours)

---

### 5.1 Continuous Monitoring (First 4 Hours)

#### [ ] Task: Server Health Monitoring
- **Priority:** ⚠️ Critical
- **Expected Outcome:** System stable
- **Verification:**
  ```bash
  # Check every 15 minutes
  curl https://breakdowns.gobarry.co.uk/api/health

  # Check Passenger status
  passenger-status

  # Check memory usage
  free -h
  ```
- **Success Criteria:**
  - Health check responds
  - Memory usage < 80%
  - CPU usage < 70%
  - No crashes
- **Time:** 5 min every 15 min (first 4 hours)
- **Reference:** N/A
- **If Fails:** Investigate immediately, may need rollback

---

#### [ ] Task: Error Log Monitoring
- **Priority:** 🔴 High
- **Expected Outcome:** No critical errors
- **Verification:**
  ```bash
  # Check Passenger logs
  tail -f ~/logs/passenger.log

  # Check Apache error logs
  tail -f /var/log/apache2/error.log

  # Check application logs (if configured)
  tail -f ~/backend/logs/app.log
  ```
- **Success Criteria:**
  - No critical errors
  - Warning errors < 5 per hour
  - No database connection errors
  - No memory errors
- **Time:** Continuous (first 4 hours)
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 2978-3001
- **If Fails:** Investigate errors, fix or rollback

---

#### [ ] Task: User Acceptance Testing
- **Priority:** 🔴 High
- **Expected Outcome:** Users can perform tasks
- **Verification:**
  - Request 2-3 supervisors test system
  - Monitor user activity in database
  - Collect feedback
- **Success Criteria:**
  - Users can login
  - Users can create breakdowns
  - Users can navigate dashboard
  - No major usability issues reported
- **Time:** Ongoing (first 24 hours)
- **Reference:** N/A
- **If Fails:** Address critical issues immediately

---

### 5.2 Performance Monitoring (24 Hours)

#### [ ] Task: Response Time Trends
- **Priority:** 🟡 Medium
- **Expected Outcome:** Performance maintained
- **Verification:**
  ```bash
  # Run every 6 hours
  for i in {1..10}; do
    time curl -s https://breakdowns.gobarry.co.uk/api/health > /dev/null
  done

  # Average response time should be consistent
  ```
- **Success Criteria:**
  - Response times stable
  - No degradation over time
  - No timeout errors
  - < 1% failed requests
- **Time:** 10 min every 6 hours (24 hours)
- **Reference:** N/A
- **If Fails:** Investigate performance degradation

---

#### [ ] Task: Database Performance
- **Priority:** 🟡 Medium
- **Expected Outcome:** Queries remain fast
- **Verification:**
  ```sql
  -- Check slow queries
  SHOW PROCESSLIST;

  -- Check table sizes
  SELECT table_name, table_rows
  FROM information_schema.tables
  WHERE table_schema = 'gobarryco_breakdowns';
  ```
- **Success Criteria:**
  - No queries > 5 seconds
  - Table sizes stable
  - No locking issues
  - Indexes being used
- **Time:** 10 min every 6 hours (24 hours)
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 2574-2686
- **If Fails:** Optimize queries, add indexes

---

### 5.3 Data Integrity Checks (48 Hours)

#### [ ] Task: Breakdown Data Verification
- **Priority:** 🔴 High
- **Expected Outcome:** All data persisted correctly
- **Verification:**
  ```sql
  -- Check breakdowns created post-deployment
  SELECT COUNT(*)
  FROM breakdowns
  WHERE created_at > '[deployment_timestamp]';

  -- Verify no data loss
  SELECT COUNT(*) FROM breakdowns WHERE breakdown_id IS NULL;
  -- Expected: 0

  -- Check activity logs
  SELECT COUNT(*)
  FROM activities
  WHERE created_at > '[deployment_timestamp]';
  ```
- **Success Criteria:**
  - All breakdowns have breakdown_id
  - Activity logs populated
  - No null required fields
  - Data relationships intact
- **Time:** 15 minutes (at 48 hours)
- **Reference:** N/A
- **If Fails:** CRITICAL - Investigate data integrity issues

---

#### [ ] Task: User Session Verification
- **Priority:** 🟡 Medium
- **Expected Outcome:** Sessions working correctly
- **Verification:**
  ```sql
  -- Check active sessions
  SELECT COUNT(*)
  FROM supervisor_sessions
  WHERE active = TRUE;

  -- Check for expired sessions cleanup
  SELECT COUNT(*)
  FROM supervisor_sessions
  WHERE expires_at < NOW();
  -- Should be 0 (expired sessions cleaned up)
  ```
- **Success Criteria:**
  - Active sessions present
  - Expired sessions removed
  - No session conflicts
  - Login/logout working
- **Time:** 10 minutes (at 48 hours)
- **Reference:** N/A
- **If Fails:** LOW - Monitor session handling

---

### 5.4 Backup Verification

#### [ ] Task: Post-Deployment Backup
- **Priority:** 🔴 High
- **Expected Outcome:** New baseline backup created
- **Verification:**
  ```bash
  # Create post-deployment backup
  # Via cPanel File Manager: Compress public_html/
  # Via phpMyAdmin: Export database

  # Verify backup
  ls -lh ~/backups/post_deployment_*.zip
  ls -lh ~/backups/db_post_deployment_*.sql
  ```
- **Success Criteria:**
  - Files backup created
  - Database backup created
  - Backups labeled correctly
  - Backup integrity verified
- **Time:** 15 minutes (at 24-48 hours)
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 248-273
- **If Fails:** Create backup before proceeding

---

### 5.5 Documentation Updates

#### [ ] Task: Update Deployment Log
- **Priority:** 🟡 Medium
- **Expected Outcome:** Deployment documented
- **Verification:**
  - Deployment date recorded
  - Version number updated
  - Issues encountered documented
  - Resolution actions noted
- **Success Criteria:**
  - Deployment log complete
  - Lessons learned captured
  - Next deployment improvements noted
- **Time:** 30 minutes (at 48 hours)
- **Reference:** CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md, lines 3039-3048
- **If Fails:** Complete documentation before sign-off

---

**PHASE 5 SIGN-OFF**

- [ ] **24-Hour Stability:** No critical issues
- [ ] **Performance Acceptable:** Response times maintained
- [ ] **Data Integrity:** All data verified
- [ ] **Backup Created:** Post-deployment backup complete
- [ ] **Documentation Updated:** Deployment recorded

**Technical Lead:** ________________  **Date:** __________

**DEPLOYMENT SUCCESSFUL:** ☐ YES  ☐ NO (with notes)

---

## ROLLBACK DECISION POINTS

### When to Rollback

**Immediate Rollback (Within 1 Hour):**
- ⚠️ Authentication completely broken
- ⚠️ Database connection fails
- ⚠️ Backend won't start
- ⚠️ Frontend returns 500 errors
- ⚠️ Critical data loss detected

**Rollback Within 4 Hours:**
- 🔴 Core functionality broken (can't create breakdowns)
- 🔴 More than 3 critical bugs reported
- 🔴 System unusable for majority of users
- 🔴 Memory exhaustion causing crashes
- 🔴 Performance degradation > 3x slower

**Rollback Within 24 Hours:**
- 🟡 Multiple high-priority bugs
- 🟡 Data integrity concerns
- 🟡 Persistent stability issues
- 🟡 User feedback overwhelmingly negative

**Continue with Fixes:**
- 🟢 Minor UI issues
- 🟢 Single feature not working
- 🟢 Performance slightly degraded
- 🟢 Edge case bugs

---

### Rollback Procedures by Phase

#### Rollback from Phase 3 (During Deployment)

**Checkpoint 1-2: Database/Backend Upload**
```bash
# Restore database
mysql -u gobarryco_breakdowns_user -p gobarryco_breakdowns < \
  ~/backups/db_backup_YYYYMMDD_HHMMSS.sql

# Delete uploaded backend files
rm -rf ~/backend/*

# NO IMPACT ON PRODUCTION (old system still running)
```
**Time:** 5 minutes
**Risk:** None (production unchanged)

---

**Checkpoint 3-4: Dependencies/Configuration**
```bash
# Stop Node.js app (if started)
# Via cPanel: Node.js Selector → Stop

# Restore from backup
cd ~
rm -rf public_html/* backend/*
unzip backups/backup_YYYYMMDD_HHMMSS.zip -d .

# Restart old application
# Via cPanel: Node.js Selector → Start
```
**Time:** 10 minutes
**Risk:** Brief downtime (5-10 minutes)

---

#### Rollback from Phase 4 (After Go-Live)

**Full Rollback (Within 1 Hour)**
```bash
# 1. Stop current Node.js app
# Via cPanel: Node.js Selector → Stop

# 2. Restore files
cd ~
rm -rf public_html/* backend/*
unzip backups/backup_YYYYMMDD_HHMMSS.zip -d .

# 3. Restore database
mysql -u gobarryco_breakdowns_user -p gobarryco_breakdowns < \
  backups/db_backup_YYYYMMDD_HHMMSS.sql

# 4. Restart old application
# Via cPanel: Node.js Selector → Start

# 5. Verify
curl https://breakdowns.gobarry.co.uk/api/health
```
**Time:** 15 minutes
**Risk:** Data created between deployment and rollback will be lost

**Data Loss Mitigation:**
1. Export recent breakdowns before rollback
2. Re-import after rollback (if compatible)
3. Notify users of potential data loss

---

#### Rollback from Phase 5 (After 24 Hours)

**Partial Rollback with Data Migration**
```bash
# 1. Export current data
mysqldump -u gobarryco_breakdowns_user -p gobarryco_breakdowns \
  --where="created_at > 'DEPLOYMENT_TIMESTAMP'" \
  breakdowns activities > recent_data.sql

# 2. Stop application
# Via cPanel: Node.js Selector → Stop

# 3. Restore old files and database
# (same as full rollback)

# 4. Import recent data
mysql -u gobarryco_breakdowns_user -p gobarryco_breakdowns < recent_data.sql

# 5. Restart
# Via cPanel: Node.js Selector → Start
```
**Time:** 30 minutes
**Risk:** Complex data migration, may have compatibility issues

---

### Rollback Authorization

**Who Can Authorize Rollback:**

**Immediate (No approval needed):**
- System completely down
- Authentication broken
- Data loss occurring

**Within 4 Hours (Technical Lead approval):**
- Multiple critical bugs
- Major functionality broken
- Performance severely degraded

**Within 24 Hours (Operations Manager + Technical Lead):**
- Multiple high-priority issues
- User feedback negative
- Stability concerns

---

## EMERGENCY CONTACTS

### Primary Contacts

**Technical Lead:**
- Name: Anthony Gair
- Email: anthony.gair@gonortheast.co.uk
- Phone: [To be added]
- Availability: Business hours + on-call during deployment

**Operations Manager:**
- Name: Barry Perryman
- Email: [To be added]
- Phone: [To be added]
- Availability: Business hours

**IT Support:**
- Email: [To be added]
- Phone: [To be added]
- Availability: 24/7 (for critical issues)

---

### Hosting Provider

**cPanel Hosting Support:**
- Provider: [Hosting company name]
- Support Email: [To be added]
- Support Phone: [To be added]
- Support Portal: [To be added]
- Response Time: 2-4 hours (standard), <1 hour (emergency)

**Emergency Escalation:**
- Account Manager: [To be added]
- Direct Phone: [To be added]

---

### External Services

**Database (MySQL):**
- Managed by: cPanel hosting
- Support: Via hosting provider
- Backup Schedule: Daily (automated)

**SSL Certificate:**
- Provider: Let's Encrypt (via cPanel AutoSSL)
- Renewal: Automatic (every 90 days)
- Support: Via hosting provider

---

## FINAL SIGN-OFF

### Deployment Complete

I certify that:
- All phases of deployment have been completed successfully
- All verification tests have passed
- System is stable and performing acceptably
- Users have been notified of completion
- Documentation has been updated
- Post-deployment backup has been created

**Technical Lead:**
Name: ________________
Signature: ________________
Date: __________  Time: __________

**Operations Manager:**
Name: ________________
Signature: ________________
Date: __________  Time: __________

**IT Security (if applicable):**
Name: ________________
Signature: ________________
Date: __________  Time: __________

---

## LESSONS LEARNED

### What Went Well
_To be completed after deployment:_

1.
2.
3.

### What Could Be Improved
_To be completed after deployment:_

1.
2.
3.

### Action Items for Next Deployment
_To be completed after deployment:_

1.
2.
3.

---

## APPENDICES

### A. Quick Command Reference

**Health Check:**
```bash
curl https://breakdowns.gobarry.co.uk/api/health
```

**View Logs:**
```bash
tail -f ~/logs/passenger.log
```

**Restart Application:**
```bash
touch ~/backend/tmp/restart.txt
```

**Check Database:**
```bash
mysql -u gobarryco_breakdowns_user -p gobarryco_breakdowns -e "SHOW TABLES;"
```

**Check Passenger Status:**
```bash
passenger-status
```

---

### B. Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 502 | Backend not running | Restart Node.js app |
| 503 | Service unavailable | Check Passenger, restart Apache |
| 401 | Authentication failed | Check JWT token, verify credentials |
| 500 | Server error | Check application logs |
| 404 | Not found | Check .htaccess, verify file paths |
| CORS | Origin blocked | Update CORS_ORIGIN in .env |

---

### C. Critical File Locations

**Backend:**
- Application: `~/backend/`
- Main file: `~/backend/server.js`
- Config: `~/backend/.env`
- Logs: `~/logs/passenger.log`

**Frontend:**
- Files: `~/public_html/`
- Index: `~/public_html/index.html`
- Assets: `~/public_html/assets/`
- Config: `~/public_html/.htaccess`

**Database:**
- Name: `gobarryco_breakdowns`
- User: `gobarryco_breakdowns_user`
- Access: phpMyAdmin via cPanel

---

### D. Related Documentation

**Required Reading:**
1. CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md - Detailed deployment steps
2. CPANEL_INTEGRATION_GUIDE.md - WebSocket and API integration
3. AUTHENTICATION_SECURITY_STRATEGY.md - Security considerations
4. DATABASE_ANALYSIS_REPORT.md - Database structure

**Reference:**
5. SCREEN_TO_SCREEN_DATA_FLOW.md - Application flow
6. API_INTEGRATION_ROADMAP.md - API endpoints
7. CODEBASE_EXPLORATION_REPORT.md - System architecture
8. REPOSITORY_STRUCTURE.md - File organization

---

**END OF CHECKLIST**

**Document Version:** 3.0.0
**Last Updated:** October 27, 2025
**Next Review:** After deployment completion
**Maintained By:** Anthony Gair (anthony.gair@gonortheast.co.uk)

---

## Document Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-27 | 3.0.0 | Initial comprehensive deployment checklist created | Claude Code |
| | | | |
| | | | |

---

**Print this document for use during actual deployment.**
