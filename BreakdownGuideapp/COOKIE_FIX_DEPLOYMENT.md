# HTTP-Only Cookie Fix Deployment - CRITICAL

**Date:** November 7, 2025
**Issue:** Frontend receiving 401 errors despite login - cookies not being sent across subdomains
**Root Cause:** Cookie domain configuration was conditional on NODE_ENV environment variable
**Fix:** Updated auth.js to ALWAYS set correct cookie domain and use sameSite=lax

---

## The Problem

Frontend at `breakdowns.gobarry.co.uk` and backend at `api.breakdowns.gobarry.co.uk` were using different subdomains. The original cookie configuration was:

```javascript
domain: process.env.NODE_ENV === 'production' ? '.gobarry.co.uk' : undefined
sameSite: 'strict'
```

**Result:** If NODE_ENV != 'production', cookie domain is `undefined`, so the cookie only works for `api.breakdowns.gobarry.co.uk`, NOT `breakdowns.gobarry.co.uk`.

---

## The Solution

Updated both login and logout endpoints to ALWAYS set correct cookie configuration:

```javascript
// Login endpoint (line 360-367)
res.cookie('auth_token', token, {
  httpOnly: true,
  secure: true,              // ✅ ALWAYS enabled
  sameSite: 'lax',           // ✅ Changed from 'strict' to 'lax'
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
  domain: '.gobarry.co.uk'   // ✅ ALWAYS set (no conditional)
});

// Logout endpoint (line 589-595)
res.clearCookie('auth_token', {
  httpOnly: true,
  secure: true,              // ✅ ALWAYS enabled
  sameSite: 'lax',           // ✅ ALWAYS 'lax'
  path: '/',
  domain: '.gobarry.co.uk'   // ✅ ALWAYS set (no conditional)
});
```

---

## What Changed

**File Modified:** `backend/routes/auth.js`

**Changes:**
1. **Line 360-367 (Login):** Updated cookie configuration
   - `secure: true` (was conditional on NODE_ENV)
   - `sameSite: 'lax'` (was 'strict')
   - `domain: '.gobarry.co.uk'` (was conditional)

2. **Line 589-595 (Logout):** Updated clearCookie configuration
   - Same changes as login endpoint for consistency

**Why these changes work:**
- `secure: true` - Forces HTTPS usage (correct for production, ignored in development)
- `sameSite: 'lax'` - Allows cookies to be sent on cross-subdomain requests from browser navigation (frontend → API)
- `domain: '.gobarry.co.uk'` - Explicitly sets domain to share cookies across ALL subdomains

---

## Deployment Steps

### Option A: Upload via CyberDuck (Recommended)

1. Open CyberDuck and connect to server (85.234.151.224)
2. Navigate to `/home/gobarryco/api/routes/`
3. Upload the updated `backend/routes/auth.js` file (overwrite existing)
4. SSH to server and run:
   ```bash
   pm2 restart breakdown-backend
   pm2 logs breakdown-backend --lines 20
   ```

### Option B: Deploy via Git

```bash
# From local machine
cd backend
git add routes/auth.js
git commit -m "fix: Update HTTP-only cookie configuration for cross-subdomain sharing"
git push origin security-improvements

# On server
cd ~/api
git pull origin security-improvements
pm2 restart breakdown-backend
pm2 logs breakdown-backend --lines 20
```

---

## Verification Steps

After deployment, test the login flow:

### Test 1: Login and Check Cookies

```bash
curl -i -X POST https://api.breakdowns.gobarry.co.uk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"anthony.gair@gonortheast.co.uk","password":"GoNorthEast2025!"}'
```

**Look for in response headers:**
```
Set-Cookie: auth_token=eyJ...; HttpOnly; Secure; Path=/; Domain=.gobarry.co.uk; SameSite=Lax; Max-Age=86400
```

### Test 2: Frontend Login

1. Go to https://breakdowns.gobarry.co.uk
2. Enter credentials and login
3. Open browser DevTools (F12)
4. Go to Application → Cookies → `.gobarry.co.uk`
5. Should see `auth_token` cookie with HttpOnly flag set
6. Check Network tab - API requests should now return 200 (not 401)

### Test 3: Verify API Calls Work

```bash
curl -i https://api.breakdowns.gobarry.co.uk/api/supervisor/session \
  -H "Cookie: auth_token=<token_from_login>"
```

Should return 200 with supervisor session data (not 401).

---

## Expected Results

After deployment:

✅ Login returns Set-Cookie header with correct domain/path/flags
✅ HTTP-only cookie automatically sent by browser to API
✅ Frontend API calls return 200 (not 401)
✅ Dashboard shows live data (not "Offline Mode")
✅ All 4 security phases active:
- Phase 1: HTTP-only cookie authentication ✅
- Phase 2: Input validation with Joi ✅
- Phase 3: Rate limiting with NodeCache ✅
- Phase 4: Error handling & retry logic ✅

---

## Rollback (If Needed)

If deployment causes issues:

```bash
# SSH to server
cd ~/api
git checkout HEAD~1 routes/auth.js
pm2 restart breakdown-backend
```

---

## Summary

This fix ensures HTTP-only cookies are correctly shared across subdomains in production, allowing the frontend at `breakdowns.gobarry.co.uk` to authenticate with the backend at `api.breakdowns.gobarry.co.uk`.

**Files to Deploy:**
- `backend/routes/auth.js` (2 modifications: login + logout)

**No other changes needed.**
