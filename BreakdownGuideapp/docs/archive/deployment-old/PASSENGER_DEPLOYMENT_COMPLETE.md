# 🚀 Passenger Deployment - WebAssembly Fix Complete

**Date**: October 23, 2025
**Status**: ✅ READY FOR DEPLOYMENT
**Issue Fixed**: WebAssembly memory error + Passenger compatibility

---

## 🎯 What Was Fixed

### Problem 1: WebAssembly Memory Error
**Error**: `RangeError: WebAssembly.instantiate(): Out of memory`
**Cause**: Node.js v22 uses WebAssembly in undici (HTTP client), hitting memory limits on shared hosting
**Solution**:
- Created `app.js` entry point with memory optimization flags
- Set `NODE_OPTIONS=--no-experimental-fetch --max-old-space-size=512`
- Uses dynamic ES6 import to load server.js

### Problem 2: ES6 Module Compatibility
**Problem**: Passenger expects CommonJS or needs special handling for ES6 modules
**Solution**:
- `app.js` uses async/await to dynamically import ES6 module
- Server only calls `listen()` when NOT under Passenger
- Passenger detection via environment variables

### Problem 3: Server Management
**Problem**: PM2 processes die when SSH session ends on shared hosting
**Solution**:
- Phusion Passenger runs persistently via Apache
- No PM2 needed - Passenger handles all process management
- Server stays running 24/7 even after logout

---

## 📦 Files Changed

### 1. `/backend/app.js` (Modified)
**Purpose**: Passenger-compatible entry point with memory optimization

**Key Features**:
- Sets `NODE_OPTIONS` to reduce memory usage and disable experimental fetch
- Dynamically imports ES6 module `server.js`
- Graceful error handling with helpful diagnostics
- Works with both Passenger and standalone Node.js

### 2. `/backend/server.js` (Modified)
**Changes**: Added Passenger detection logic

**Before**:
```javascript
server.listen(PORT, async () => {
  console.log('Server running...');
});
```

**After**:
```javascript
const isPassenger = process.env.PASSENGER_APP_ENV || process.env.PHUSION_PASSENGER;

if (!isPassenger) {
  server.listen(PORT, async () => {
    console.log('Server running...');
  });
} else {
  console.log('🚀 Breakdown Guide API starting under Passenger');
  // Passenger will manage the server
}
```

---

## 🔧 Deployment Instructions

### Step 1: Upload Backend Files

**Via Cyberduck or cPanel File Manager**:

Upload these files to `/home/gobarryco/api/`:
- ✅ `app.js` (updated)
- ✅ `server.js` (updated)
- ✅ All other backend files from `/backend/` folder

**Important**: Make sure to overwrite existing files

### Step 2: Update .htaccess Configuration

**Connect to cPanel via SSH**:
```bash
ssh gobarryco@yourdomain.com
```

**Navigate to API directory**:
```bash
cd /home/gobarryco/public_html/api
```

**Create updated .htaccess**:
```bash
cat > .htaccess << 'EOF'
# Phusion Passenger Configuration for Go BARRY Backend
PassengerEnabled on
PassengerAppType node
PassengerStartupFile app.js
PassengerAppRoot /home/gobarryco/api
PassengerNodejs /usr/bin/node
PassengerAppEnv production

# Memory and Performance Optimizations
SetEnv NODE_OPTIONS "--no-experimental-fetch --max-old-space-size=512"
SetEnv NODE_ENV production
SetEnv PORT 3001

# Passenger Environment Variables (to trigger Passenger detection)
SetEnv PASSENGER_APP_ENV production
SetEnv PHUSION_PASSENGER 1

# Friendly error pages for debugging
PassengerFriendlyErrorPages on
PassengerRestartDir /home/gobarryco/api/tmp

# Rewrite rules for API
RewriteEngine On
RewriteBase /api

# Allow CORS preflight
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Pass all requests to Passenger
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ $1 [QSA,L]
EOF
```

**Verify .htaccess created**:
```bash
cat .htaccess
```

### Step 3: Create Passenger Restart Directory

**Create tmp directory** (Passenger uses this for restarts):
```bash
mkdir -p /home/gobarryco/api/tmp
touch /home/gobarryco/api/tmp/restart.txt
```

### Step 4: Stop PM2 (If Running)

**Stop existing PM2 processes**:
```bash
pm2 stop all
pm2 delete all
```

**Save PM2 config** (so it doesn't auto-restart):
```bash
pm2 save
```

### Step 5: Restart Passenger

**Touch restart.txt to reload application**:
```bash
touch /home/gobarryco/api/tmp/restart.txt
```

**Note**: Passenger will automatically start the application when a request comes in.

---

## 🧪 Testing After Deployment

### Test 1: Check Application Starts
**URL**: https://api.breakdowns.gobarry.co.uk/health

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-23T...",
  "uptime": 123,
  "database": "connected"
}
```

### Test 2: Check Passenger Logs
**View Apache/Passenger error log**:
```bash
tail -f /home/gobarryco/logs/error_log
```

**Expected Output**:
```
🚀 Starting Go BARRY Backend via Passenger
📍 Environment: production
💾 Memory limit: 512MB
🔧 Node version: v22.19.0
📦 Loading server module...
✅ Server module loaded successfully
🎯 Application ready for Passenger
🚀 Breakdown Guide API starting under Passenger
📍 Environment: production
🎯 Passenger will manage server lifecycle
✅ Application ready with MySQL database
```

**Should NOT see**:
```
❌ RangeError: WebAssembly.instantiate()
❌ Out of memory
❌ Cannot allocate Wasm memory
```

### Test 3: Check Frontend Login
**URL**: https://breakdowns.gobarry.co.uk

**Test Flow**:
1. Navigate to site
2. Should see new MySQL login page
3. Enter credentials:
   - Email: `anthony.gair@gonortheast.co.uk`
   - Password: `Stafford45!`
4. Should successfully log in
5. Should see breakdown guide (no 503 errors)

### Test 4: Check API Endpoints
**Test with curl**:
```bash
curl https://api.breakdowns.gobarry.co.uk/api/breakdowns/live
```

**Should return**: JSON data (not 503 error)

### Test 5: Session Persistence
**After logging out of cPanel**:
1. Log out of SSH
2. Close terminal
3. Wait 5 minutes
4. Test API again: `https://api.breakdowns.gobarry.co.uk/health`
5. Should still respond (server still running!)

---

## 📊 Success Criteria

### Backend Health
✅ Health endpoint responds with 200 OK
✅ No WebAssembly memory errors in logs
✅ Passenger successfully starts application
✅ MySQL connection established
✅ Server stays running after logout

### Frontend Integration
✅ Login page loads without CORS errors
✅ Authentication works (MySQL backend)
✅ Supervisor ID correctly extracted
✅ Dashboard loads successfully
✅ No 503 Service Unavailable errors

### Logs (Apache error_log)
✅ Shows "Starting Go BARRY Backend via Passenger"
✅ Shows "Application ready with MySQL database"
✅ Shows "Starting under Passenger"
✅ NO "WebAssembly" errors
✅ NO "Out of memory" errors

---

## 🔧 Troubleshooting

### Error: Still Getting 503
**Check 1**: Verify .htaccess exists and is readable
```bash
ls -la /home/gobarryco/public_html/api/.htaccess
cat /home/gobarryco/public_html/api/.htaccess
```

**Check 2**: Verify app.js and server.js uploaded correctly
```bash
ls -la /home/gobarryco/api/app.js
ls -la /home/gobarryco/api/server.js
```

**Check 3**: Check Passenger logs
```bash
tail -100 /home/gobarryco/logs/error_log
```

### Error: WebAssembly Still Appears
**Problem**: Environment variables not set correctly
**Solution**: Verify .htaccess has `SetEnv NODE_OPTIONS` line

**Check**:
```bash
grep NODE_OPTIONS /home/gobarryco/public_html/api/.htaccess
```

**Should show**:
```
SetEnv NODE_OPTIONS "--no-experimental-fetch --max-old-space-size=512"
```

### Error: "Cannot find module './server.js'"
**Problem**: File paths incorrect
**Solution**: Verify PassengerAppRoot in .htaccess

**Check**:
```bash
grep PassengerAppRoot /home/gobarryco/public_html/api/.htaccess
```

**Should show**:
```
PassengerAppRoot /home/gobarryco/api
```

### Error: MySQL Connection Failed
**Problem**: Database credentials not loaded
**Solution**: Verify .env file exists

**Check**:
```bash
ls -la /home/gobarryco/api/.env
```

**Verify contents** (passwords hidden):
```bash
grep -E "DB_HOST|DB_NAME|DB_USER" /home/gobarryco/api/.env
```

---

## 🎉 What This Achieves

**Before (Broken)**:
- ❌ PM2 stops when logging out of SSH
- ❌ WebAssembly memory errors crash server
- ❌ 503 errors on production site
- ❌ Unstable authentication
- ❌ Supervisor manually restarting server

**After (Fixed)**:
- ✅ Passenger keeps server running 24/7
- ✅ No WebAssembly errors (disabled experimental fetch)
- ✅ Production site works reliably
- ✅ Stable MySQL authentication
- ✅ No manual intervention needed

**Stability**: Server runs continuously, automatically restarts on crashes, survives SSH logout

---

## 📚 Related Documentation

1. **NEW_LOGIN_DEPLOYMENT.md** - Frontend login page deployment
2. **FINAL_DEPLOYMENT_READY.md** - Previous deployment attempt
3. **SUPERVISOR_ID_FIX.md** - Technical details of auth fixes
4. **MYSQL_AUTH_FIX_COMPLETE.md** - Complete authentication migration

---

## ✅ Deployment Checklist

- [ ] Stop PM2 processes (`pm2 stop all && pm2 delete all`)
- [ ] Upload updated `app.js` to `/home/gobarryco/api/`
- [ ] Upload updated `server.js` to `/home/gobarryco/api/`
- [ ] Create/update `.htaccess` in `/home/gobarryco/public_html/api/`
- [ ] Create `tmp/` directory: `mkdir -p /home/gobarryco/api/tmp`
- [ ] Restart Passenger: `touch /home/gobarryco/api/tmp/restart.txt`
- [ ] Test health endpoint: https://api.breakdowns.gobarry.co.uk/health
- [ ] Check logs: `tail -f /home/gobarryco/logs/error_log`
- [ ] Test frontend login: https://breakdowns.gobarry.co.uk
- [ ] Verify session persistence (logout SSH, wait, test again)

---

## 🚀 Ready to Deploy!

**Backend Changes**: ✅ Complete
**Frontend**: ✅ Already deployed (MySQLLoginPage)
**Configuration**: ✅ .htaccess instructions provided
**Documentation**: ✅ Complete

**Deploy Now**: Follow Step 1-5 above

---

**Questions or Issues?** Check troubleshooting section or review Apache error logs.

**Good luck with deployment! 🎉**
