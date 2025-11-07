# Security Improvements Deployment Guide

**Date:** November 7, 2025
**Branch:** security-improvements
**Status:** Ready for Production Deployment
**Build:** ✅ Frontend built successfully (5.94s)
**Dependencies:** ✅ All new dependencies installed

---

## Deployment Summary

This deployment includes 4 critical security improvements across both frontend and backend:

- **Phase 1:** HTTP-Only Cookie Session Management
- **Phase 2:** Input Validation with Joi
- **Phase 3:** Rate Limiting Memory Leak Fix
- **Phase 4:** Error Handling & Retry Logic

---

## Pre-Deployment Verification Checklist

### Build Status
- [x] Frontend built successfully: `npm run build`
- [x] No TypeScript/JavaScript errors
- [x] Dist folder generated: `frontend/dist/`
- [x] All assets compiled: CSS (326KB), JS (3.4MB), vendor (329KB)

### Dependencies Verified
- [x] cookie-parser@1.4.7 ✅
- [x] joi@18.0.1 ✅
- [x] node-cache@5.1.2 ✅
- [x] All peer dependencies present ✅

### Git Status
- [x] All changes committed to `security-improvements` branch
- [x] 4 commits with detailed messages
- [x] No uncommitted changes
- [x] Working tree clean

---

## Files to Deploy

### Backend Files (Critical)

**Core Server & Auth:**
- `backend/server.js` - Added cookie-parser middleware
- `backend/package.json` - Updated with new dependencies
- `backend/package-lock.json` - Updated lock file

**Middleware (New/Updated):**
- `backend/middleware/authMiddleware.js` - Updated with cookie extraction & NodeCache
- `backend/middleware/errorHandler.js` - **NEW** - Central error handling
- `backend/middleware/validationMiddleware.js` - Updated with Joi validation

**Validation (New):**
- `backend/validation/schemas.js` - **NEW** - Joi validation schemas for all endpoints

**Route Updates:**
- `backend/routes/auth.js` - Added HTTP-only cookie login/logout, validation
- `backend/routes/breakdowns.js` - Added input validation
- `backend/routes/analytics.js` - Added input validation
- `backend/routes/defects.js` - Minor validation updates

### Frontend Files

**Complete `frontend/dist/` directory** - Production-built files
- `dist/index.html` - Entry point
- `dist/assets/` - All CSS, JS, vendor files
- All assets updated for security improvements

**Key Source Files Modified:**
- `frontend/src/contexts/AuthContext.jsx` - Removed localStorage tokens
- `frontend/src/services/api-client.js` - Added retry logic & credentials
- `frontend/src/components/ErrorBoundary.jsx` - Enhanced error handling
- `frontend/src/components/ErrorAlert.jsx` - **NEW** - Inline error display
- Plus 20+ wizard components for consistency

---

## Deployment Instructions

### Step 1: Backup Current Production (CRITICAL)

```bash
# SSH to server
ssh user@85.234.151.224

# Create backup of current backend
cd ~/api
tar -czf backup_before_security_deploy_$(date +%Y%m%d_%H%M%S).tar.gz .

# Create backup of current frontend
cd ~/public_html/breakdowns.gobarry.co.uk/
tar -czf backup_before_security_deploy_$(date +%Y%m%d_%H%M%S).tar.gz .

# Store backups in safe location
mv *.tar.gz ~/backups/
```

### Step 2: Deploy Backend (via cPanel/SFTP or Git)

**Option A: Using Git (Preferred)**
```bash
# SSH to server
ssh user@85.234.151.224

# Navigate to backend
cd ~/api

# Pull latest security-improvements branch
git fetch origin
git checkout security-improvements
git pull origin security-improvements

# Install dependencies (IMPORTANT - new packages needed)
npm ci --production

# Verify new packages installed
npm list cookie-parser joi node-cache
```

**Option B: Manual File Upload (cPanel)**
1. Open CyberDuck or similar SFTP client
2. Connect to: 85.234.151.224
3. Navigate to: ~/api/
4. Upload files:
   - `backend/server.js`
   - `backend/package.json`
   - `backend/package-lock.json`
   - `backend/middleware/authMiddleware.js`
   - `backend/middleware/errorHandler.js` (NEW)
   - `backend/middleware/validationMiddleware.js`
   - `backend/validation/schemas.js` (NEW - create directory if needed)
   - `backend/routes/auth.js`
   - `backend/routes/breakdowns.js`
   - `backend/routes/analytics.js`
   - `backend/routes/defects.js`

5. SSH to server and run: `npm ci --production`

### Step 3: Restart Backend

```bash
# SSH to server
ssh user@85.234.151.224

# Check PM2 status
pm2 status

# Restart backend
pm2 restart breakdown-backend
# OR if using different name
pm2 restart api
pm2 restart all

# Verify restart successful
pm2 logs breakdown-backend --lines 20

# Check health endpoint
curl -s http://localhost:3001/api/health | head -20
```

### Step 4: Deploy Frontend

```bash
# Option A: Via CyberDuck (Manual)
# 1. Open CyberDuck
# 2. Connect to: 85.234.151.224
# 3. Navigate to: ~/public_html/breakdowns.gobarry.co.uk/
# 4. Delete all current files
# 5. Upload everything from frontend/dist/
# 6. Verify .htaccess is uploaded (no-cache for index.html)

# Option B: Via SCP (from local machine)
# From /Users/anthony/Go BARRY App/BreakdownGuideapp/
scp -r frontend/dist/* user@85.234.151.224:~/public_html/breakdowns.gobarry.co.uk/

# Verify upload
ssh user@85.234.151.224 'ls -lh ~/public_html/breakdowns.gobarry.co.uk/ | head -10'
```

### Step 5: Verify Deployment

```bash
# Test Backend Health
curl -s https://api.breakdowns.gobarry.co.uk/api/health

# Test Frontend Load
curl -s -I https://breakdowns.gobarry.co.uk/ | grep -E "HTTP|Cache-Control"

# Check backend logs for errors
pm2 logs breakdown-backend --lines 50

# Look for these in logs (should be absent):
# - "ENOENT" errors (file not found)
# - "Cannot find module" errors
# - "Connection refused" errors
```

---

## Post-Deployment Testing

### Authentication Testing

**Test 1: Login with HTTP-Only Cookie**
```bash
# Login and capture response headers
curl -i -X POST https://api.breakdowns.gobarry.co.uk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gobarry.co.uk",
    "password": "password123"
  }'

# Should see:
# - "Set-Cookie: auth_token=..." in response headers
# - Cookie should have: HttpOnly, Secure, SameSite=Strict
# - Authorization header in response should be removed
```

**Test 2: Cookie-Based API Call**
```bash
# Make request with cookie (browser will auto-include)
curl -i -b "auth_token=<token_from_login>" \
  https://api.breakdowns.gobarry.co.uk/api/supervisor/session
```

### Validation Testing

**Test 3: Input Validation - Login**
```bash
# Try invalid email
curl -X POST https://api.breakdowns.gobarry.co.uk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "test"
  }'

# Should return 400 with validation error:
# {
#   "success": false,
#   "error": "Validation failed",
#   "details": [...]
# }
```

**Test 4: Input Validation - Breakdown Creation**
```bash
curl -X POST https://api.breakdowns.gobarry.co.uk/api/breakdowns \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fleet_no": "INVALID",
    "location": ""
  }'

# Should return 400 validation error
```

### Error Handling Testing

**Test 5: Error Boundary (Frontend)**
- Open browser DevTools Console
- Navigate to: https://breakdowns.gobarry.co.uk
- Intentionally cause error (check console for error messages)
- Should see ErrorBoundary fallback UI with "Try Again" button

**Test 6: Retry Logic**
- Simulate network failure by disabling network in DevTools
- Try to load data
- Re-enable network
- Should auto-retry with exponential backoff

### Rate Limiting Testing

**Test 7: Rate Limit Memory Management**
```bash
# Check PM2 memory usage (should be stable)
pm2 monit

# Monitor for 5-10 minutes
# Memory should NOT continuously increase
# Should be stable around 150-200MB
```

---

## Rollback Plan (If Issues)

If critical issues occur after deployment:

```bash
# SSH to server
ssh user@85.234.151.224

# Backend Rollback
cd ~/api
tar -xzf backup_before_security_deploy_*.tar.gz
npm ci --production
pm2 restart breakdown-backend

# Frontend Rollback
cd ~/public_html/breakdowns.gobarry.co.uk/
rm -rf *
tar -xzf backup_before_security_deploy_*.tar.gz
```

**Issues & Fixes:**

| Issue | Cause | Fix |
|-------|-------|-----|
| 500 errors on login | Missing cookie-parser | Verify middleware order in server.js |
| Validation errors | Joi schema issue | Check validation/schemas.js syntax |
| Cookies not persisting | sameSite too strict | Test in private/incognito window |
| Memory usage increasing | NodeCache misconfigured | Check authMiddleware.js cache settings |
| CORS errors | Cookie domain mismatch | Verify cookie domain in auth.js |

---

## Monitoring & Alerts

### Post-Deployment Monitoring (24-48 hours)

**1. Backend Metrics**
```bash
# Check every 6 hours
pm2 monit
- Memory usage: should be 150-250MB
- CPU usage: should be <5% idle
- Error rate: should be 0-1%

# Check logs
pm2 logs breakdown-backend
- Look for: "cookie", "validation", "cache" messages
- No "ENOENT" or "Cannot find module" errors
```

**2. Frontend Metrics**
```bash
# Check website performance
curl -w "@curl-format.txt" -o /dev/null -s https://breakdowns.gobarry.co.uk

# Expected response time: <2 seconds
# HTTP Status: 200
```

**3. User Reports**
- Monitor email for user complaints
- Track: Login failures, validation errors, crashes
- Alert threshold: >5 similar errors in 1 hour

### Key Metrics to Monitor

- **Authentication Success Rate**: Should be >99%
- **Average Response Time**: Should be <500ms
- **Error Rate**: Should be <1%
- **Memory Usage**: Should be stable (not increasing)
- **CPU Usage**: Should be <10%

---

## Deployment Success Criteria

✅ **All criteria must be met for successful deployment:**

1. Backend starts without errors (`pm2 logs`)
2. Frontend loads successfully (https://breakdowns.gobarry.co.uk)
3. Login works with HTTP-only cookies
4. Cookie persists across page refreshes
5. Invalid input returns 400 validation error
6. Error boundary handles component crashes gracefully
7. Retry logic retries failed API calls automatically
8. Memory usage remains stable over 1 hour
9. No regressions in existing functionality
10. All 9 supervisors can login successfully

---

## Files to Keep for Reference

After deployment, keep these files for documentation:

- `PHASE1_*`, `PHASE2_*`, `PHASE3_*`, `PHASE4_*` - Implementation summaries
- `CLAUDE.md` - Updated with security improvements
- `frontend/dist/` - Keep for quick re-deployment
- Backup tar.gz files - Keep for 7 days minimum

---

## Next Steps After Deployment

1. **Merge to main branch** (after 24-hour stability test)
   ```bash
   git checkout main
   git merge security-improvements
   git push origin main
   ```

2. **Tag release** (for version tracking)
   ```bash
   git tag -a v3.1.0-security -m "Security improvements: cookies, validation, rate-limit, error-handling"
   git push origin v3.1.0-security
   ```

3. **Document deployment** (update DEPLOYMENT.md with execution date/time)

4. **Notify stakeholders** (email deployment summary to Go North East team)

---

## Contact & Support

**For Deployment Issues:**
- Check backend logs: `pm2 logs breakdown-backend`
- Check PM2 status: `pm2 status`
- Review rollback plan above
- Contact: anthony.gair@gonortheast.co.uk

**For Code Issues:**
- Check validation/schemas.js for validation errors
- Check middleware/errorHandler.js for error handling issues
- Check auth.js for cookie configuration issues

---

**Deployment Prepared By:** Claude Code
**Date Prepared:** November 7, 2025
**Branch:** security-improvements
**Commits:** 4 (Phase 1-4 implementations)
