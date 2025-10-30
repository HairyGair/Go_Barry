# Go BARRY Backend - cPanel Deployment Complete Guide

## Overview

This guide provides everything needed to deploy the fixed Go BARRY backend to cPanel, including:
- **Diagnostic tools** to identify the current deployment
- **Step-by-step deployment instructions**
- **Verification commands** to ensure the fix is working
- **Troubleshooting** for common issues

## The Problem

The supervisors API route ordering was incorrect, causing:
```
GET /api/supervisors/AG003/stats → Returns full supervisor object (WRONG)
```

Instead of:
```
GET /api/supervisors/AG003/stats → Returns performance statistics (CORRECT)
```

**Root Cause**: Express routes are matched in order. The generic `/:id` route was defined before the specific `/:id/stats` route, so "stats" was being interpreted as an ID parameter.

## The Fix

Routes have been reordered in `/routes/supervisors.js`:

### ✅ CORRECT ORDER (Current)
```javascript
Line 29:  router.get('/', ...)                    // List all supervisors
Line 93:  router.get('/:id/stats', ...)           // Stats (SPECIFIC - FIRST)
Line 217: router.get('/by-badge/:badge', ...)     // By badge
Line 254: router.get('/depot/:depot', ...)        // By depot
Line 297: router.get('/search', ...)              // Search
Line 345: router.get('/role/:role', ...)          // By role
Line 395: router.get('/pending', ...)             // Pending
Line 428: router.get('/:id', ...)                 // By ID (GENERIC - LAST)
```

### ❌ BROKEN ORDER (Previous)
```javascript
router.get('/:id', ...)        // Generic route first - catches everything!
router.get('/:id/stats', ...)  // Never reached - too late!
```

## Deployment Package

**File**: `gobarry-backend.zip`
**Location**: `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/gobarry-backend.zip`
**Size**: 248 KB (251,924 bytes)

### Contents Verified
- ✅ `server.js` (26,715 bytes)
- ✅ `routes/supervisors.js` (11,814 bytes) - **FIXED VERSION**
- ✅ `routes/breakdowns.js` (48,627 bytes)
- ✅ `routes/analytics.js`
- ✅ `routes/auth.js` (31,873 bytes)
- ✅ `routes/fleet.js` (13,155 bytes)
- ✅ `config/mysql.js` (11,505 bytes)
- ✅ `middleware/authMiddleware.js` (16,561 bytes)
- ✅ `package.json` (dependencies)

## Step 1: Diagnose Current Deployment

### Option A: Automated Diagnostic Script

From your local machine:
```bash
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp/backend"
ssh gobarryco@gobarry.co.uk 'bash -s' < diagnose-cpanel-deployment.sh
```

This will show:
- Deployment directory location
- Node.js process status
- Restart method (Passenger/PM2/CloudLinux)
- Recent logs
- API endpoint status

### Option B: Manual Diagnosis

SSH to server:
```bash
ssh gobarryco@gobarry.co.uk
```

Run these commands:
```bash
# Find deployment directories
ls -la ~/gobarry-backend-deploy/
ls -la ~/api/
ls -la ~/backend/

# Check for server.js
find ~ -name "server.js" -not -path "*/node_modules/*" 2>/dev/null

# Check if Node is running
ps aux | grep node

# Check restart method
ls -d ~/*/tmp 2>/dev/null  # Passenger uses tmp/restart.txt
```

**Expected Result**: You'll identify the deployment directory (likely `~/gobarry-backend-deploy/` or `~/api/`)

## Step 2: Deploy Fixed Backend

Based on the diagnostic results, choose the appropriate method:

### Method A: Deployment to ~/gobarry-backend-deploy/

#### 2.1 Upload via Cyberduck SFTP

1. Open Cyberduck
2. Connect to server:
   - **Protocol**: SFTP (SSH File Transfer Protocol)
   - **Server**: gobarry.co.uk
   - **Username**: gobarryco
   - **Password**: [your cPanel password]

3. Navigate to `/home/gobarryco/` (home directory)

4. Upload file:
   - Local: `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/gobarry-backend.zip`
   - Remote: `/home/gobarryco/gobarry-backend.zip`

#### 2.2 Extract and Restart via SSH

SSH to server:
```bash
ssh gobarryco@gobarry.co.uk
```

Copy-paste these commands:
```bash
# Create timestamped backup
mv ~/gobarry-backend-deploy ~/gobarry-backend-backup-$(date +%Y%m%d-%H%M%S)

# Extract new deployment
unzip -q ~/gobarry-backend.zip -d ~/gobarry-backend-deploy

# Verify extraction
ls -la ~/gobarry-backend-deploy/routes/supervisors.js

# Verify route ordering (should show line 93)
grep -n "router.get.*/:id/stats" ~/gobarry-backend-deploy/routes/supervisors.js

# Restart via Passenger
cd ~/gobarry-backend-deploy
mkdir -p tmp
touch tmp/restart.txt

# Wait for restart
sleep 3

# Test health endpoint
curl -s https://api.breakdowns.gobarry.co.uk/api/health

# Test stats endpoint
curl -s https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003/stats

# Exit SSH
exit
```

### Method B: Deployment to ~/api/

Same as Method A, but replace `~/gobarry-backend-deploy/` with `~/api/` in all commands:

```bash
# Backup
mv ~/api ~/api-backup-$(date +%Y%m%d-%H%M%S)

# Extract
unzip -q ~/gobarry-backend.zip -d ~/api

# Verify
ls -la ~/api/routes/supervisors.js
grep -n "router.get.*/:id/stats" ~/api/routes/supervisors.js

# Restart
cd ~/api
mkdir -p tmp
touch tmp/restart.txt

# Test
sleep 3
curl -s https://api.breakdowns.gobarry.co.uk/api/health
curl -s https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003/stats

exit
```

### Method C: Automated Deployment Script

From your local machine:
```bash
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp/backend"
bash quick-deploy-cpanel.sh
```

Enter SSH password when prompted. The script will:
1. Create deployment package
2. Upload to server
3. Backup existing deployment
4. Extract new deployment
5. Restart application
6. Test endpoints

## Step 3: Verify Deployment

### 3.1 Test Endpoints

From your local machine or via SSH on server:

```bash
# Health check (should return JSON with "status": "healthy")
curl https://api.breakdowns.gobarry.co.uk/api/health

# Test stats endpoint (should return statistics object)
curl https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003/stats

# Test supervisor by ID (should return supervisor object)
curl https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003

# Test list all supervisors
curl https://api.breakdowns.gobarry.co.uk/api/supervisors
```

### 3.2 Expected Responses

**✅ CORRECT - Stats Endpoint**
```json
{
  "success": true,
  "data": {
    "supervisor": {
      "id": "...",
      "name": "...",
      "badge": "AG003",
      "depot": "...",
      "shift_start": "...",
      "shift_end": "..."
    },
    "performance": {
      "totalBreakdowns": 15,
      "criticalBreakdowns": 3,
      "resolvedBreakdowns": 12,
      "avgResponseTime": 8,
      "resolutionRate": 80
    },
    "breakdown_categories": [...]
  }
}
```

**✅ CORRECT - Supervisor by ID**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "...",
    "name": "...",
    "badge_number": "AG003",
    "depot": "...",
    "role": "...",
    "is_active": true
  }
}
```

**❌ WRONG - Before Fix**
Both endpoints would return the supervisor object instead of stats.

## Step 4: Troubleshooting

### Issue: API Not Responding After Deployment

SSH to server and check logs:
```bash
ssh gobarryco@gobarry.co.uk

# Check error logs
tail -50 ~/logs/stderr.log

# Check output logs
tail -50 ~/logs/stdout.log

# Check if Node is running
ps aux | grep node

# Try force restart
cd ~/gobarry-backend-deploy  # or ~/api
mkdir -p tmp
touch tmp/restart.txt

# If Passenger restart doesn't work, kill node process
pkill -f server.js

# Wait for auto-restart
sleep 5

# Test
curl -s https://api.breakdowns.gobarry.co.uk/api/health

exit
```

### Issue: supervisors.js Not Found

The deployment directory may be different. Run diagnostic:
```bash
ssh gobarryco@gobarry.co.uk
find ~ -name "supervisors.js" -not -path "*/node_modules/*" 2>/dev/null
exit
```

Then deploy to the correct directory.

### Issue: Still Getting Wrong Response

Check if old code is cached:
```bash
ssh gobarryco@gobarry.co.uk

# Verify route order in deployed file
grep -n "^router.get" ~/gobarry-backend-deploy/routes/supervisors.js

# Line 93 should be /:id/stats
# Line 428 should be /:id

# If wrong, re-extract deployment
rm -rf ~/gobarry-backend-deploy
unzip -q ~/gobarry-backend.zip -d ~/gobarry-backend-deploy

# Hard restart
pkill -f server.js
sleep 3
cd ~/gobarry-backend-deploy
touch tmp/restart.txt

exit
```

## Files Reference

### Local Files
- **Deployment package**: `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/gobarry-backend.zip`
- **Diagnostic script**: `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/diagnose-cpanel-deployment.sh`
- **Deployment commands**: `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/DEPLOYMENT_COMMANDS.txt`
- **Quick deploy script**: `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/quick-deploy-cpanel.sh`

### Server Files (Likely Locations)
- **Deployment directory**: `~/gobarry-backend-deploy/` OR `~/api/`
- **Server entry point**: `~/gobarry-backend-deploy/server.js`
- **Fixed route file**: `~/gobarry-backend-deploy/routes/supervisors.js`
- **Restart trigger**: `~/gobarry-backend-deploy/tmp/restart.txt`
- **Error logs**: `~/logs/stderr.log`
- **Output logs**: `~/logs/stdout.log`

## Quick Reference

| Item | Value |
|------|-------|
| **Server** | gobarry.co.uk |
| **SSH User** | gobarryco |
| **Protocol** | SFTP (SSH) |
| **API Base URL** | https://api.breakdowns.gobarry.co.uk |
| **Health Endpoint** | https://api.breakdowns.gobarry.co.uk/api/health |
| **Stats Endpoint** | https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003/stats |
| **Restart Command** | `touch tmp/restart.txt` |
| **Deployment Package** | gobarry-backend.zip (248 KB) |

## Next Steps After Successful Deployment

1. ✅ Test all supervisor endpoints:
   - `/api/supervisors` (list all)
   - `/api/supervisors/AG003` (by ID)
   - `/api/supervisors/AG003/stats` (statistics)
   - `/api/supervisors/by-badge/AG003` (by badge)
   - `/api/supervisors/depot/Riverside` (by depot)
   - `/api/supervisors/search?q=Anthony` (search)

2. ✅ Monitor logs for any errors:
   ```bash
   ssh gobarryco@gobarry.co.uk 'tail -f ~/logs/stderr.log'
   ```

3. ✅ Update frontend to use stats endpoint correctly

4. ✅ Document the deployment location for future reference

## Support

If you encounter issues not covered in this guide:

1. Run the diagnostic script and save the output
2. Check all log files in `~/logs/`
3. Verify `.env` file exists with correct database credentials
4. Check cPanel error logs in File Manager
5. Verify Node.js version: `node --version` (should be 18+)

---

**Document Version**: 1.0  
**Created**: 2025-10-19  
**Package**: gobarry-backend.zip  
**Fixed File**: routes/supervisors.js (route ordering)
