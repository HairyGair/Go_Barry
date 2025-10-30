# Backend Optimization Implementation Checklist

**Go BARRY - cPanel Shared Hosting Optimization**
**Version**: 1.0.0
**Target Environment**: cPanel Shared Hosting (512MB-1GB RAM)

---

## Pre-Implementation

- [ ] **Backup current deployment**
  - [ ] Database backup created
  - [ ] Code repository committed
  - [ ] Current .env file backed up
  - [ ] Current working deployment URL documented

- [ ] **Review documentation**
  - [ ] Read OPTIMIZATION_SUMMARY.md
  - [ ] Review OPTIMIZATION_QUICK_START.md
  - [ ] Understand CPANEL_BACKEND_OPTIMIZATION.md structure

---

## Phase 1: Critical Optimizations (5 minutes)

### Environment Configuration

- [ ] **Update .env file**
  ```bash
  # Add these lines to .env:
  HOSTING_TYPE=shared
  MEMORY_LIMIT=512
  MYSQL_CONNECTION_LIMIT=3
  MYSQL_QUEUE_LIMIT=20
  WS_MAX_CONNECTIONS=20
  WS_MAX_PER_CHANNEL=10
  ```

- [ ] **Verify .env file**
  ```bash
  cat .env | grep HOSTING_TYPE
  cat .env | grep MYSQL_CONNECTION_LIMIT
  ```

### MySQL Configuration

- [ ] **Edit config/mysql.js**
  - [ ] Line 36: Update connectionLimit
    ```javascript
    connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT ||
      (process.env.HOSTING_TYPE === 'shared' ? '3' : '10')),
    ```
  - [ ] Line 38: Add queueLimit
    ```javascript
    queueLimit: process.env.HOSTING_TYPE === 'shared' ? 20 : 0,
    ```
  - [ ] Line 42: Update connectTimeout
    ```javascript
    connectTimeout: process.env.HOSTING_TYPE === 'shared' ? 5000 : 10000,
    ```

- [ ] **Save and verify changes**
  ```bash
  git diff config/mysql.js
  ```

### Package.json Scripts

- [ ] **Update package.json scripts**
  ```json
  "scripts": {
    "start": "node --no-experimental-fetch --max-old-space-size=512 server.js",
    "start:safe": "node --no-experimental-fetch --max-old-space-size=450 server.js"
  }
  ```

- [ ] **Verify package.json**
  ```bash
  cat package.json | grep -A2 "scripts"
  ```

### Local Testing

- [ ] **Test locally with shared hosting settings**
  ```bash
  export HOSTING_TYPE=shared
  npm run start:safe
  ```

- [ ] **Verify server starts**
  - [ ] No errors in console
  - [ ] Startup time < 5 seconds
  - [ ] Memory usage shown in logs

- [ ] **Test health endpoint**
  ```bash
  curl http://localhost:3001/health
  ```
  - [ ] Returns 200 OK
  - [ ] Database status: "connected"
  - [ ] No errors

- [ ] **Test key endpoints**
  ```bash
  # Supervisors
  curl http://localhost:3001/api/supervisors

  # Fleet (requires auth)
  # Test via frontend or Postman
  ```

- [ ] **Stop server**
  ```bash
  # Ctrl+C
  ```

---

## Phase 2: Deployment to cPanel (10 minutes)

### Upload Code

- [ ] **Create deployment package**
  ```bash
  cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/backend
  npm run deploy:zip
  ```

- [ ] **Upload to cPanel**
  - Option A: SSH deploy
    ```bash
    npm run deploy
    ```
  - Option B: Manual upload via cPanel File Manager
    - [ ] Login to cPanel
    - [ ] Upload gobarry-backend.zip
    - [ ] Extract to ~/backend/

- [ ] **Verify files uploaded**
  ```bash
  ssh gobarryco@gobarry.co.uk
  ls -la ~/backend/
  ```

### Environment Setup on Server

- [ ] **SSH into server**
  ```bash
  ssh gobarryco@gobarry.co.uk
  ```

- [ ] **Navigate to backend directory**
  ```bash
  cd ~/backend
  ```

- [ ] **Copy production environment**
  ```bash
  cp .env.production .env
  ```

- [ ] **Verify .env contains optimizations**
  ```bash
  cat .env | grep HOSTING_TYPE
  # Should show: HOSTING_TYPE=shared
  ```

- [ ] **Install dependencies**
  ```bash
  /opt/cpanel/ea-nodejs20/bin/npm install --production
  ```

- [ ] **Verify node_modules**
  ```bash
  ls -la node_modules/ | head -20
  ```

### Configure Passenger

- [ ] **Verify .htaccess exists**
  ```bash
  cat .htaccess
  ```

- [ ] **Create restart trigger**
  ```bash
  mkdir -p tmp
  touch tmp/restart.txt
  ```

- [ ] **Restart application**
  ```bash
  touch tmp/restart.txt
  ```

### Verify Deployment

- [ ] **Test health endpoint (production)**
  ```bash
  curl https://api.breakdowns.gobarry.co.uk/health
  ```
  - [ ] Returns 200 OK
  - [ ] Database: "connected"
  - [ ] Environment: "production"

- [ ] **Test supervisors endpoint**
  ```bash
  curl https://api.breakdowns.gobarry.co.uk/api/supervisors
  ```
  - [ ] Returns supervisor list
  - [ ] No errors

- [ ] **Test in browser**
  - [ ] Open: https://api.breakdowns.gobarry.co.uk/health
  - [ ] Verify JSON response
  - [ ] Check database status

- [ ] **Check logs for errors**
  ```bash
  tail -50 ~/logs/stderr.log
  tail -50 ~/logs/stdout.log
  ```
  - [ ] No critical errors
  - [ ] MySQL connected message present
  - [ ] Server started message present

---

## Phase 3: Validation (5 minutes)

### Functional Testing

- [ ] **Test frontend connection**
  - [ ] Open frontend: https://breakdowns.gobarry.co.uk
  - [ ] Test supervisor login
  - [ ] Verify data loads
  - [ ] Check real-time updates

- [ ] **Test Control Room Display**
  - [ ] Open control room display
  - [ ] Verify breakdowns show
  - [ ] Check live updates work

- [ ] **Test WebSocket connection**
  - [ ] Open browser console
  - [ ] Run: `new WebSocket('wss://api.breakdowns.gobarry.co.uk/ws/control-room')`
  - [ ] Should connect without errors
  - [ ] Should receive welcome message

### Performance Validation

- [ ] **Check memory usage**
  ```bash
  # Via API (if admin endpoint available)
  curl https://api.breakdowns.gobarry.co.uk/api/admin/metrics
  ```
  - [ ] Memory < 200MB baseline
  - [ ] No warnings

- [ ] **Check database pool**
  ```bash
  # Via API (if admin endpoint available)
  curl https://api.breakdowns.gobarry.co.uk/api/admin/pool-stats
  ```
  - [ ] Active connections < 3
  - [ ] No queue buildup

- [ ] **Response time check**
  - [ ] Health: < 100ms
  - [ ] Supervisors: < 200ms
  - [ ] Breakdowns: < 500ms

### Log Monitoring

- [ ] **Set up continuous monitoring**
  ```bash
  # In separate terminal
  ssh gobarryco@gobarry.co.uk
  tail -f ~/logs/stderr.log
  ```

- [ ] **Generate traffic and monitor**
  - [ ] Make several requests from frontend
  - [ ] Watch logs for errors
  - [ ] Verify no memory warnings

---

## Phase 4: Post-Deployment (15 minutes)

### Update Frontend

- [ ] **Update frontend environment**
  - [ ] Point to new backend URL
  - [ ] Test all features
  - [ ] Verify no CORS errors

- [ ] **Deploy frontend changes**
  ```bash
  cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/Go_BARRY
  npm run build:cpanel
  # Upload to cPanel
  ```

### Documentation

- [ ] **Document deployment**
  - [ ] Deployment date/time
  - [ ] Version deployed
  - [ ] Any issues encountered
  - [ ] Current memory baseline

- [ ] **Update team**
  - [ ] Notify team of deployment
  - [ ] Share new monitoring URLs
  - [ ] Document any changes in behavior

### Monitoring Setup

- [ ] **Set up health check cron**
  ```bash
  # Add to crontab
  crontab -e

  # Add line:
  0 */6 * * * /home/gobarryco/backend/scripts/health-check.sh https://api.breakdowns.gobarry.co.uk > /home/gobarryco/logs/health-$(date +\%Y\%m\%d).log 2>&1
  ```

- [ ] **Test cron job**
  ```bash
  # Run manually
  /home/gobarryco/backend/scripts/health-check.sh https://api.breakdowns.gobarry.co.uk
  ```

---

## Phase 5: Ongoing Monitoring (Daily/Weekly)

### Daily Checks (5 minutes)

- [ ] **Check health endpoint**
  ```bash
  curl https://api.breakdowns.gobarry.co.uk/health
  ```

- [ ] **Review logs for errors**
  ```bash
  ssh gobarryco@gobarry.co.uk
  tail -100 ~/logs/stderr.log | grep -i error
  ```

- [ ] **Verify user reports**
  - [ ] Any error reports from supervisors?
  - [ ] Any performance complaints?

### Weekly Checks (15 minutes)

- [ ] **Check memory trends**
  ```bash
  # Review logs for memory warnings
  grep -i "memory" ~/logs/stderr.log | tail -20
  ```

- [ ] **Check database pool stats**
  - [ ] Any connection issues?
  - [ ] Pool ever saturated?

- [ ] **Review response times**
  - [ ] Any slow queries?
  - [ ] Any timeouts?

- [ ] **Check disk space**
  ```bash
  df -h ~
  du -sh ~/backend/logs/
  ```

---

## Rollback Plan

### If Critical Issues Occur

- [ ] **Immediate actions**
  1. Document the error
  2. Check logs: `tail -100 ~/logs/stderr.log`
  3. Try restart: `touch ~/backend/tmp/restart.txt`

- [ ] **If restart doesn't fix**
  1. Revert .env changes
     ```bash
     cp .env.backup .env
     touch tmp/restart.txt
     ```
  2. Revert code changes
     ```bash
     git checkout HEAD~1 config/mysql.js
     touch tmp/restart.txt
     ```

- [ ] **Emergency fallback**
  1. Point frontend back to Render
  2. Investigate cPanel issue
  3. Re-deploy when fixed

---

## Success Criteria

All items below should be ✅ before considering deployment successful:

### Critical Success Factors

- [ ] ✅ Health endpoint returns 200
- [ ] ✅ Database connection working
- [ ] ✅ Supervisors can log in
- [ ] ✅ Breakdowns can be created
- [ ] ✅ Real-time updates working
- [ ] ✅ No errors in logs (first 30 minutes)
- [ ] ✅ Memory usage < 200MB baseline
- [ ] ✅ Response times < 500ms

### Performance Success Factors

- [ ] ✅ Startup time < 5 seconds
- [ ] ✅ MySQL pool stable (< 3 connections)
- [ ] ✅ WebSocket connects successfully
- [ ] ✅ No memory warnings
- [ ] ✅ No connection pool warnings

### Operational Success Factors

- [ ] ✅ Logs accessible
- [ ] ✅ Monitoring working
- [ ] ✅ Team notified
- [ ] ✅ Documentation updated
- [ ] ✅ Rollback plan tested

---

## Troubleshooting Quick Reference

### Issue: Server won't start

```bash
# Check logs
tail -50 ~/logs/stderr.log

# Test manually
cd ~/backend
/opt/cpanel/ea-nodejs20/bin/node server.js
```

### Issue: Database won't connect

```bash
# Test MySQL directly
mysql -h localhost -u gobarryco_Gair -p gobarryco_breakdown

# Check credentials in .env
cat .env | grep DB_
```

### Issue: High memory usage

```bash
# Check current memory
curl https://api.breakdowns.gobarry.co.uk/api/admin/metrics

# Lower memory limit
# Edit package.json: --max-old-space-size=450
touch tmp/restart.txt
```

### Issue: WebSocket won't connect

```bash
# Check WebSocket URL
# Should be: wss://api.breakdowns.gobarry.co.uk/ws/control-room

# Check for firewall/proxy issues
# Test from different network
```

---

## Resources

- **Full Documentation**: CPANEL_BACKEND_OPTIMIZATION.md
- **Quick Start**: OPTIMIZATION_QUICK_START.md
- **Summary**: OPTIMIZATION_SUMMARY.md
- **Deployment Guide**: CPANEL_COMPLETE_DEPLOYMENT.md

---

## Sign-off

**Deployment Information:**
- Date: _______________
- Time: _______________
- Deployed by: _______________
- Version: _______________

**Verification:**
- [ ] All critical success factors met
- [ ] All performance success factors met
- [ ] All operational success factors met
- [ ] Team notified
- [ ] Documentation complete

**Notes:**
_________________________________________
_________________________________________
_________________________________________

**Status**: ✅ Deployment Successful / ⚠️ Partial Success / ❌ Rollback Required

---

**Checklist Version**: 1.0.0
**Last Updated**: October 27, 2025
