# URL Configuration Decision Guide

**Purpose:** Help determine which URL architecture to use for production deployment
**Last Updated:** October 27, 2025

---

## ⚠️ Critical Decision Required

Your codebase currently has **TWO different URL patterns**. You must choose one before deployment.

---

## 🔀 Two URL Patterns Found

### Pattern A: Path-Based Routing (RECOMMENDED)
```
Frontend:  https://breakdowns.gobarry.co.uk
Backend:   https://breakdowns.gobarry.co.uk/api
WebSocket: wss://breakdowns.gobarry.co.uk/ws
```

**Files using this pattern:**
- ✅ `backend/.env` (currently configured)
- ✅ `frontend/.env` (currently configured)
- ✅ `CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md`
- ✅ `backend/server.js` (ALLOWED_ORIGINS)

### Pattern B: Subdomain Architecture
```
Frontend:  https://breakdowns.gobarry.co.uk
Backend:   https://api.breakdowns.gobarry.co.uk
WebSocket: wss://api.breakdowns.gobarry.co.uk
```

**Files mentioning this pattern:**
- ⚠️ `frontend/.env.example` (line 8: VITE_API_URL)
- ⚠️ `NEW_LOGIN_DEPLOYMENT.md`
- ⚠️ `frontend/src/services/api-client.js` (hardcoded default)

---

## 📊 Comparison Matrix

| Factor | Path-Based (A) | Subdomain (B) |
|--------|----------------|---------------|
| **DNS Records** | 1 A record | 2 A records |
| **SSL Certificates** | 1 certificate | 2 certificates (or wildcard) |
| **Apache Config** | ProxyPass in .htaccess | Separate subdomain config |
| **CORS Complexity** | Simple (same origin) | More complex (cross-origin) |
| **cPanel Setup** | Easy | Moderate |
| **URL Aesthetics** | `/api` in URL visible | Cleaner separation |
| **Scalability** | Good | Better (can move API later) |
| **Current Code** | ✅ 90% ready | ⚠️ 30% ready |
| **Deployment Time** | 30 minutes | 60 minutes |
| **Maintenance** | Easier | More moving parts |

---

## ✅ Recommendation: Path-Based Routing (Pattern A)

### Why?

1. **Already Configured:** 90% of your code uses this pattern
2. **Simpler for cPanel:** Single domain, single SSL certificate
3. **Faster Deployment:** Less DNS and SSL setup
4. **Proven Working:** Your current `.env` files use this
5. **Single Point of Management:** One domain to monitor

### What Needs to Change?

Only **3 files** need updates to be consistent:

#### 1. Fix `frontend/.env.example`
**Change line 8:**
```bash
# ❌ OLD
VITE_API_URL=https://api.breakdowns.gobarry.co.uk

# ✅ NEW
VITE_API_URL=https://breakdowns.gobarry.co.uk
```

#### 2. Fix `frontend/src/services/api-client.js`
**Change line 7:**
```javascript
// ❌ OLD
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

// ✅ NEW
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://breakdowns.gobarry.co.uk';
```

#### 3. Update any documentation references
Search and replace in all `.md` files:
```bash
# Find
api.breakdowns.gobarry.co.uk

# Replace with
breakdowns.gobarry.co.uk/api
```

---

## 🔧 Implementation Checklist

### If Choosing Path-Based (Recommended)

- [ ] Update `frontend/.env.example` (line 8)
- [ ] Update `frontend/src/services/api-client.js` (line 7)
- [ ] Rebuild frontend with corrected `.env`
- [ ] Verify `backend/.env` uses:
  ```
  API_BASE_URL=https://breakdowns.gobarry.co.uk/api
  ALLOWED_ORIGINS=https://breakdowns.gobarry.co.uk
  ```
- [ ] Deploy frontend to `/public_html/breakdowns/`
- [ ] Deploy backend to `/home/username/backend/`
- [ ] Configure `.htaccess` for ProxyPass
- [ ] Test all endpoints

### If Choosing Subdomain (Advanced)

- [ ] Create DNS A record for `api.breakdowns`
- [ ] Setup SSL for both domains
- [ ] Create subdomain in cPanel
- [ ] Update ALL `.env` files to use subdomain
- [ ] Update `api-client.js` default URL
- [ ] Configure CORS for cross-origin
- [ ] Deploy and test

---

## 🧪 Testing Both Patterns

### Test Pattern A (Path-Based)

```bash
# 1. Update frontend .env
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/frontend
cat > .env << EOF
VITE_API_URL=https://breakdowns.gobarry.co.uk
VITE_API_BASE_URL=https://breakdowns.gobarry.co.uk/api
VITE_WS_URL=wss://breakdowns.gobarry.co.uk/ws
EOF

# 2. Rebuild
npm run build:cpanel

# 3. Check built files for correct URLs
grep -r "breakdowns.gobarry.co.uk" dist/

# 4. Should NOT find: api.breakdowns.gobarry.co.uk
```

### Test Pattern B (Subdomain)

```bash
# 1. Update frontend .env
cat > .env << EOF
VITE_API_URL=https://api.breakdowns.gobarry.co.uk
VITE_API_BASE_URL=https://api.breakdowns.gobarry.co.uk/api
VITE_WS_URL=wss://api.breakdowns.gobarry.co.uk
EOF

# 2. Rebuild
npm run build:cpanel

# 3. Check built files
grep -r "api.breakdowns.gobarry.co.uk" dist/
```

---

## 🎯 Final URL Configuration (Path-Based)

### Production URLs

```bash
# Main Application
https://breakdowns.gobarry.co.uk/

# Authentication
https://breakdowns.gobarry.co.uk/login
https://breakdowns.gobarry.co.uk/api/auth/login
https://breakdowns.gobarry.co.uk/api/auth/supervisors

# Dashboards
https://breakdowns.gobarry.co.uk/breakdown-guide
https://breakdowns.gobarry.co.uk/engineering
https://breakdowns.gobarry.co.uk/dashboards/control-room-display.html

# API Endpoints
https://breakdowns.gobarry.co.uk/api/health
https://breakdowns.gobarry.co.uk/api/breakdowns
https://breakdowns.gobarry.co.uk/api/fleet

# WebSocket
wss://breakdowns.gobarry.co.uk/ws
```

### Backend Environment Variables

```bash
NODE_ENV=production
PORT=3001
API_BASE_URL=https://breakdowns.gobarry.co.uk/api
APP_URL=https://breakdowns.gobarry.co.uk
ALLOWED_ORIGINS=https://breakdowns.gobarry.co.uk,https://gobarry.co.uk
```

### Frontend Environment Variables

```bash
VITE_API_URL=https://breakdowns.gobarry.co.uk
VITE_API_BASE_URL=https://breakdowns.gobarry.co.uk/api
VITE_WS_URL=wss://breakdowns.gobarry.co.uk/ws
VITE_APP_URL=https://breakdowns.gobarry.co.uk
```

---

## 🚨 Inconsistencies to Fix NOW

### High Priority (MUST FIX)

1. **`frontend/src/services/api-client.js` line 7**
   - Currently: `https://api.breakdowns.gobarry.co.uk`
   - Should be: `https://breakdowns.gobarry.co.uk`
   - **Impact:** API calls will fail if `.env` is missing

2. **`frontend/.env.example` line 8**
   - Currently: `https://api.breakdowns.gobarry.co.uk`
   - Should be: `https://breakdowns.gobarry.co.uk`
   - **Impact:** Developers copying example will use wrong URL

### Medium Priority (Should Fix)

3. **Documentation files** mentioning subdomain
   - Search: `api.breakdowns.gobarry.co.uk`
   - Replace: `breakdowns.gobarry.co.uk/api` or `breakdowns.gobarry.co.uk`
   - **Files affected:** `NEW_LOGIN_DEPLOYMENT.md`, `PASSENGER_DEPLOYMENT_COMPLETE.md`

### Low Priority (Nice to Have)

4. **Comment clarity** in config files
   - Add comments explaining path-based routing choice
   - Document why subdomain was not chosen

---

## 🔍 Verification Commands

After fixing inconsistencies:

```bash
# 1. Search for old subdomain pattern
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp
grep -r "api\.breakdowns\.gobarry\.co\.uk" --include="*.js" --include="*.env*"

# Expected: Only in .md documentation files (acceptable)
# Not expected: In .js or .env files (MUST FIX)

# 2. Verify frontend build
cd frontend
npm run build:cpanel
grep -r "api\.breakdowns" dist/

# Expected: No matches (good)
# If found: Check .env file and rebuild

# 3. Verify backend config
cd ../backend
grep "API_BASE_URL" .env

# Expected: https://breakdowns.gobarry.co.uk/api
```

---

## 📋 Quick Fix Script

Save this to fix inconsistencies:

```bash
#!/bin/bash
# fix-url-inconsistencies.sh

echo "🔧 Fixing URL inconsistencies..."

# 1. Fix api-client.js
sed -i.bak "s|https://api\.breakdowns\.gobarry\.co\.uk|https://breakdowns.gobarry.co.uk|g" \
  frontend/src/services/api-client.js

# 2. Fix .env.example
sed -i.bak "s|https://api\.breakdowns\.gobarry\.co\.uk|https://breakdowns.gobarry.co.uk|g" \
  frontend/.env.example

# 3. Update documentation (optional)
sed -i.bak "s|https://api\.breakdowns\.gobarry\.co\.uk|https://breakdowns.gobarry.co.uk/api|g" \
  NEW_LOGIN_DEPLOYMENT.md

echo "✅ Fixed! Backup files saved as *.bak"
echo "📝 Review changes before committing"

# Verify
echo ""
echo "🔍 Verifying fixes..."
grep -n "api\.breakdowns" frontend/src/services/api-client.js frontend/.env.example

if [ $? -eq 0 ]; then
  echo "⚠️ Still found 'api.breakdowns' - manual review needed"
else
  echo "✅ All instances fixed!"
fi
```

**Run with:**
```bash
chmod +x fix-url-inconsistencies.sh
./fix-url-inconsistencies.sh
```

---

## ✅ Final Decision Checklist

Before deploying, confirm:

- [ ] Chosen URL pattern: **Path-Based Routing**
- [ ] All `.env` files use consistent URLs
- [ ] `api-client.js` default URL matches pattern
- [ ] Backend `ALLOWED_ORIGINS` includes frontend URL
- [ ] Frontend build uses correct `.env`
- [ ] Documentation updated (or notes added about inconsistencies)
- [ ] DNS records planned (1 A record for `breakdowns`)
- [ ] SSL certificate planned (1 cert for `breakdowns.gobarry.co.uk`)
- [ ] Apache `.htaccess` ready with ProxyPass rules
- [ ] Team informed of final URL structure

---

**Recommended Action:** Run the fix script above, then proceed with [CPANEL_PRODUCTION_URLS.md](./CPANEL_PRODUCTION_URLS.md)

**Status:** Ready for deployment after fixing 3 inconsistencies ✅
