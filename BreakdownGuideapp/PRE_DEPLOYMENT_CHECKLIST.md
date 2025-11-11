# Pre-Deployment Checklist - Smart Route Matching

**Date:** November 10, 2025
**Feature:** Smart Route Matching v1.0
**Status:** Ready for Production

---

## Before You Start

### System Requirements Check
- [ ] cPanel server is accessible via SSH
- [ ] cPanel server is accessible via SFTP
- [ ] PM2 is running and healthy on backend
- [ ] MySQL database is accessible
- [ ] HTTPS is working on breakdowns.gobarry.co.uk

### Database Verification
- [ ] Connect to MySQL and verify GTFS tables exist:
  ```bash
  mysql -h 85.234.151.224 -u gobarryco_Gair -p gobarryco_breakdown
  SHOW TABLES LIKE 'gtfs_%';
  ```
- [ ] Verify tables are populated (not empty):
  ```sql
  SELECT COUNT(*) FROM gtfs_routes;      -- Should be > 0
  SELECT COUNT(*) FROM gtfs_stops;       -- Should be > 0
  SELECT COUNT(*) FROM gtfs_trips;       -- Should be > 0
  SELECT COUNT(*) FROM gtfs_stop_times;  -- Should be > 0
  ```

### Backup Verification
- [ ] Backup current breakdowns.js exists
- [ ] Backup current frontend/dist/ files
- [ ] Know how to restore from backup if needed

### Code Verification
- [ ] Git commit 2c526330 is present
- [ ] Frontend build completed with no errors
- [ ] All files ready in dist/ folder

---

## Deployment Checklist

### Step 1: Backend Upload ✓
- [ ] Open SFTP client (CyberDuck, WinSCP, etc.)
- [ ] Connect to cPanel server
- [ ] Navigate to ~/api/routes/
- [ ] **BACKUP:** Copy breakdowns.js to breakdowns.js.backup
- [ ] Upload new breakdowns.js (overwrite)
- [ ] Close SFTP connection

### Step 2: Backend Restart ✓
- [ ] Open SSH terminal
- [ ] Connect to cPanel server
- [ ] Run: `cd ~/api`
- [ ] Run: `pm2 restart breakdown-backend`
- [ ] Wait 5 seconds for restart
- [ ] Run: `pm2 status` (verify "online" status)
- [ ] Run: `pm2 logs breakdown-backend --lines 50`
- [ ] **CHECK:** No error messages in logs
- [ ] Close SSH connection

### Step 3: Frontend Upload ✓
- [ ] Open CyberDuck or cPanel File Manager
- [ ] Navigate to `/home/yourusername/public_html/breakdowns.gobarry.co.uk/`
- [ ] **BACKUP:** Download current files to local backup folder
- [ ] **DELETE:** Select all files and delete
- [ ] **UPLOAD:** Upload all files from `frontend/dist/`
  - [ ] index.html
  - [ ] assets/ folder (entire folder with all files)
  - [ ] All other static files (logos, markers, etc.)
- [ ] **VERIFY:** index.html is at root (not in subdirectory)
- [ ] Close SFTP/File Manager

### Step 4: Verify Deployment ✓
- [ ] Open browser
- [ ] Navigate to https://breakdowns.gobarry.co.uk
- [ ] **Page loads:** No 404 errors
- [ ] **CSS loads:** Page is styled correctly (not plain HTML)
- [ ] **Log in:** Use valid credentials
- [ ] **Dashboard loads:** Home page displays
- [ ] Create breakdown:
  - [ ] Click "New Breakdown"
  - [ ] Fleet selection modal opens
  - [ ] Search for vehicle (e.g., "6301")
  - [ ] Select a vehicle
  - [ ] Proceed to route selection
  - [ ] Proceed to location step
- [ ] Test smart suggestions:
  - [ ] Enter coordinates: `54.969564, -1.609568`
  - [ ] **VERIFY:** Green "Smart Route Suggestions" panel appears
  - [ ] **COUNT:** Should see 3-10 suggested routes
  - [ ] **CHECK:** Each route shows: name, trip count, distance
  - [ ] Click a route to select it
  - [ ] **VERIFY:** Route selection succeeds
- [ ] Check console (F12 → Console):
  - [ ] No JavaScript errors in red
  - [ ] No 404 errors for missing assets
  - [ ] Network tab shows all requests successful

### Step 5: End-to-End Test ✓
- [ ] Complete a full breakdown creation:
  - [ ] Select vehicle (6301)
  - [ ] Accept smart route suggestion
  - [ ] Select location (ticketer or depot)
  - [ ] Fill in remaining fields
  - [ ] Submit breakdown
- [ ] Verify breakdown appears in:
  - [ ] Dashboard
  - [ ] Activity feed
  - [ ] Appropriate depot view

### Step 6: Performance Check ✓
- [ ] Check smart suggestions response time:
  - [ ] Should appear within 1-2 seconds
  - [ ] No lag in UI
  - [ ] No timeout errors
- [ ] Check backend logs:
  - [ ] No errors for /api/breakdowns/smart-route-match endpoint
  - [ ] Requests logged successfully

---

## Post-Deployment Verification

### Frontend Check
- [ ] Home page loads: ✓
- [ ] Login works: ✓
- [ ] Breakdown creation modal opens: ✓
- [ ] Smart suggestions appear: ✓
- [ ] Routes displayed correctly: ✓
- [ ] Can select suggested routes: ✓
- [ ] No JavaScript console errors: ✓

### Backend Check
- [ ] PM2 process running: ✓
- [ ] No PM2 error logs: ✓
- [ ] API endpoint responds: ✓
- [ ] Database queries working: ✓

### User Workflow Check
- [ ] Supervisor can create breakdown: ✓
- [ ] Location entry triggers suggestions: ✓
- [ ] Can accept or reject suggestions: ✓
- [ ] Breakdown saves correctly: ✓

---

## Rollback Preparation

### If Backend Issues
```bash
ssh user@85.234.151.224
cd ~/api/routes
cp breakdowns.js.backup breakdowns.js
pm2 restart breakdown-backend
```

### If Frontend Issues
1. Re-upload previous frontend/dist files
2. Or restore from backup folder

### If Database Issues
1. Verify GTFS tables still populated
2. Run GTFS import again if needed

---

## Communication Plan

After successful deployment:
- [ ] Notify supervisors feature is live
- [ ] Provide usage instructions
- [ ] Monitor for user feedback
- [ ] Check logs daily for errors

---

## Documentation for Reference

- **Quick Start:** DEPLOY_NOW.md
- **Detailed Guide:** DEPLOYMENT_SMART_ROUTE_MATCHING.md
- **File Manifest:** DEPLOYMENT_FILES_MANIFEST.md
- **Feature Docs:** CLAUDE.md

---

## Sign-Off

- [ ] All checklist items completed
- [ ] No errors encountered
- [ ] Feature working as expected
- [ ] Deployment successful
- [ ] Ready to notify users

**Date Deployed:** ________________
**Deployed By:** ________________
**Notes:** ________________________________________________________________________

---

**Status:** ✅ READY TO DEPLOY
