# Go BARRY - cPanel Production Deployment Guide

## 🚀 Direct to Production Deployment

**Time Required:** 30-45 minutes
**Status:** All code ready, just needs upload and configuration

---

## 📦 STEP 1: Upload Backend Files to cPanel (15 minutes)

### Files to Upload

**Via cPanel File Manager or FTP, upload these to your backend directory:**

#### **New Services Folder** (`backend/services/`)
```
services/
├── database.js              ← NEW FILE
├── logger.js                ← NEW FILE
├── tokenBlacklist.js        ← NEW FILE
└── auditLogger.js           ← NEW FILE
```

#### **New Middleware Folder** (`backend/middleware/`)
```
middleware/
├── validation.js            ← NEW FILE
└── rateLimiting.js          ← NEW FILE
```

#### **New Route** (`backend/routes/`)
```
routes/
└── authSecure.js            ← NEW FILE
```

#### **Modified Files**
```
backend/
├── server.js                ← MODIFIED (now uses authSecure)
├── .env                     ← MODIFIED (added JWT secrets)
└── package.json             ← MODIFIED (new dependencies)
```

#### **Database Migrations** (`backend/migrations/`)
```
migrations/
├── verify-supervisors-table.sql
├── add-security-indexes.sql
├── create-audit-logs.sql
└── add-refresh-tokens.sql
```

#### **Scripts** (`backend/scripts/`)
```
scripts/
└── run-migrations.js        ← NEW FILE
```

---

## ⚙️ STEP 2: Update Environment Variables (5 minutes)

### In cPanel File Manager:

1. Navigate to your backend directory
2. Edit `.env` file
3. **Add these new variables:**

```bash
# JWT Configuration (REQUIRED - COPY THESE EXACTLY)
JWT_ACCESS_SECRET=hPa0aPbwhqdtG6EIW1AWkSGmz2gfHV6QlAWObk6Yx+M=
JWT_REFRESH_SECRET=6mjSuVtkevNfbesTa8/WtJAF3Jl915RxQZSMgyvaKcg=
JWT_ISSUER=go-barry-api
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Database Configuration (VERIFY THESE)
DB_HOST=localhost
DB_USER=gobarryco
DB_PASSWORD=Turnip1105!!!!!
DB_NAME=gobarryco_breakdowns

# Keep all your existing variables as well
```

4. Save and close

---

## 💾 STEP 3: Install New Dependencies (5 minutes)

### Via cPanel Terminal (or SSH):

```bash
cd /path/to/your/backend/directory
npm install
```

This will install:
- express-rate-limit
- express-validator
- winston
- winston-daily-rotate-file

**OR via cPanel Node.js App Manager:**
1. Go to "Setup Node.js App"
2. Click your backend app
3. Click "Run NPM Install"

---

## 🗄️ STEP 4: Run Database Migrations (10 minutes)

You have **3 options** - choose the easiest for you:

### **Option A: Via phpMyAdmin** (Recommended - Easiest)

1. Log into cPanel → phpMyAdmin
2. Select database: `gobarryco_breakdowns`
3. Click "SQL" tab
4. **Run these files ONE AT A TIME in order:**

   **File 1:** `migrations/verify-supervisors-table.sql`
   - Copy entire contents
   - Paste in SQL window
   - Click "Go"
   - Should say "Query OK"

   **File 2:** `migrations/add-security-indexes.sql`
   - Copy entire contents
   - Paste in SQL window
   - Click "Go"
   - Should show ~27 indexes created

   **File 3:** `migrations/create-audit-logs.sql`
   - Copy entire contents
   - Paste in SQL window
   - Click "Go"
   - Should create audit_logs table

   **File 4:** `migrations/add-refresh-tokens.sql`
   - Copy entire contents
   - Paste in SQL window
   - Click "Go"
   - Should create refresh_tokens table

### **Option B: Via cPanel Terminal** (If you have command line access)

```bash
cd /path/to/backend
node scripts/run-migrations.js
```

### **Option C: Via MySQL Command Line** (If you have SSH)

```bash
mysql -u gobarryco -p'Turnip1105!!!!!' gobarryco_breakdowns < migrations/verify-supervisors-table.sql
mysql -u gobarryco -p'Turnip1105!!!!!' gobarryco_breakdowns < migrations/add-security-indexes.sql
mysql -u gobarryco -p'Turnip1105!!!!!' gobarryco_breakdowns < migrations/create-audit-logs.sql
mysql -u gobarryco -p'Turnip1105!!!!!' gobarryco_breakdowns < migrations/add-refresh-tokens.sql
```

### **Verify Migrations Succeeded:**

Run this SQL in phpMyAdmin:
```sql
-- Should return 3 tables
SHOW TABLES;

-- Should show many indexes
SHOW INDEX FROM supervisors;

-- Should return 0 rows (empty table)
SELECT COUNT(*) FROM audit_logs;
SELECT COUNT(*) FROM refresh_tokens;
```

---

## 📁 STEP 5: Create Logs Directory (1 minute)

### Via cPanel File Manager:
1. Navigate to your backend directory
2. Click "New Folder"
3. Name it: `logs`
4. Click "Create"

### Via Terminal:
```bash
cd /path/to/backend
mkdir logs
chmod 755 logs
```

---

## 🔄 STEP 6: Restart Backend Server (2 minutes)

Choose your method:

### **Option A: PM2** (Most common)
```bash
pm2 restart backend
pm2 logs backend --lines 50
```

### **Option B: cPanel Node.js App Manager**
1. Go to "Setup Node.js App"
2. Find your backend app
3. Click "Restart"
4. Click "Open logs" to verify no errors

### **Option C: Manual Restart**
```bash
cd /path/to/backend
pkill -f "node.*server.js"
npm start
```

### **Verify Backend Started:**

Check logs for these messages:
```
✅ MySQL database connection verified
✅ Server ready with secure authentication
🚀 Server running on port 3001
```

**If you see errors:**
- Check `.env` file has all JWT secrets
- Verify database credentials
- Check that migrations ran successfully

---

## 🎨 STEP 7: Upload Frontend Files to cPanel (5 minutes)

### Files to Upload:

**Upload to your Go_BARRY directory:**

#### **New Files:**
```
Go_BARRY/
├── components/hooks/
│   └── useApi.js                                ← NEW FILE
└── utils/
    └── tokenManager.js                          ← NEW FILE
```

#### **Modified Files:**
```
Go_BARRY/
└── components/hooks/
    └── useSupervisorSessionOptimized.js         ← MODIFIED
```

### **If using Expo build:**

Rebuild your frontend:
```bash
cd Go_BARRY
npm run build:web
# or
npm run build:cpanel
```

Then upload the `dist/` or `build/` directory to cPanel.

---

## 🧪 STEP 8: Test Authentication on Production (10 minutes)

### Test 1: Health Check

```bash
curl https://gobarry.co.uk/api/auth/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-26T..."
}
```

### Test 2: Login

```bash
curl -X POST https://gobarry.co.uk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"badge":"AG001","password":"GoNorthEast2025!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbG...",
  "user": {
    "id": 1,
    "badge": "AG001",
    "name": "Anthony Gair",
    "role": "admin"
  }
}
```

### Test 3: Frontend Login

1. Open https://gobarry.co.uk in browser
2. Login screen should appear **instantly** (< 1 second, no Convex delay)
3. Enter badge: **AG001**
4. Enter password: **GoNorthEast2025!**
5. Click Login
6. Should load dashboard in < 1 second
7. Try refreshing browser (F5) - session should persist
8. Try logging out - should redirect to login

### Test 4: Rate Limiting

Try logging in with wrong password 6 times rapidly - 6th attempt should get rate limited.

### Test 5: All Supervisor Badges

Test with different badges (all use same password):
- AG003 (Admin)
- BP009 (Admin)
- CW001 (Regular)

---

## ✅ Post-Deployment Checklist

- [ ] Backend uploaded to cPanel
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` updated with JWT secrets
- [ ] Database migrations run (4 files)
- [ ] `logs/` directory created
- [ ] Backend restarted successfully
- [ ] Backend logs show no errors
- [ ] Frontend files uploaded
- [ ] Health check endpoint responds
- [ ] Login works with correct credentials
- [ ] Login fails with wrong credentials
- [ ] Rate limiting activates after 5 attempts
- [ ] Session persists on browser refresh
- [ ] Logout clears session
- [ ] App startup is noticeably faster

---

## 🔍 Troubleshooting

### Issue: "Cannot find module 'express-rate-limit'"

**Solution:**
```bash
cd /path/to/backend
npm install
pm2 restart backend
```

### Issue: "JWT_ACCESS_SECRET must be set"

**Check `.env` file has:**
```bash
JWT_ACCESS_SECRET=hPa0aPbwhqdtG6EIW1AWkSGmz2gfHV6QlAWObk6Yx+M=
JWT_REFRESH_SECRET=6mjSuVtkevNfbesTa8/WtJAF3Jl915RxQZSMgyvaKcg=
```

### Issue: "MySQL connection failed"

**Check:**
1. `.env` has: `DB_HOST=localhost` (not gobarry.co.uk)
2. Database credentials are correct
3. Database `gobarryco_breakdowns` exists

**Test:**
```bash
mysql -u gobarryco -p'Turnip1105!!!!!' gobarryco_breakdowns -e "SELECT 1;"
```

### Issue: "Table audit_logs doesn't exist"

**Solution:** Run database migrations via phpMyAdmin (Step 4)

### Issue: Frontend - Network request failed

**Check:**
1. Backend is running
2. `.env` in frontend has correct API URL
3. CORS is configured

### Issue: Backend logs show errors

**View logs:**
```bash
pm2 logs backend
# or
tail -f /path/to/backend/logs/error.log
```

---

## 📊 Monitor After Deployment

### Check Logs

```bash
# All logs
tail -f backend/logs/combined.log

# Errors only
tail -f backend/logs/error.log

# PM2 logs
pm2 logs backend
```

### Check Audit Logs (phpMyAdmin)

```sql
-- Recent logins
SELECT * FROM audit_logs
WHERE event_type = 'login_attempt'
ORDER BY created_at DESC
LIMIT 20;

-- Failed logins
SELECT badge_number, COUNT(*) as failures
FROM audit_logs
WHERE event_type = 'login_attempt' AND success = false
GROUP BY badge_number
ORDER BY failures DESC;
```

### Monitor Performance

- App should start in < 1.5 seconds
- Logins should complete in < 1 second
- No errors in browser console
- Sessions should persist on refresh

---

## 🎉 Success Indicators

You'll know deployment was successful when:

✅ Backend starts without errors
✅ Health check returns `{"status":"healthy"}`
✅ Login with AG001/GoNorthEast2025! works
✅ App loads instantly (no Convex delay)
✅ Session persists on browser refresh
✅ Rate limiting blocks after 5 attempts
✅ Logout clears session properly
✅ All 16 supervisors can log in

---

## 📞 Need Help?

1. **Check logs first:** `pm2 logs backend` or `tail -f logs/error.log`
2. **Verify database:** Run verification queries in phpMyAdmin
3. **Check documentation:** See `COMPLETE_SECURITY_IMPLEMENTATION.md`

---

## 🔄 Rollback Plan (If Needed)

If something goes wrong, you can quickly rollback:

### Quick Rollback

1. In server.js, change line 159 back to:
   ```javascript
   import authOptimizedRouter from './routes/authOptimized.js';
   ```

2. Change line 173 back to:
   ```javascript
   app.use('/api/auth', rateLimitLogin, authOptimizedRouter);
   ```

3. Restart backend

**Note:** Supervisor passwords remain `GoNorthEast2025!` - they're in the database.

---

## 📚 Additional Documentation

- **Complete Guide:** `COMPLETE_SECURITY_IMPLEMENTATION.md`
- **Security Architecture:** `backend/SECURITY_ARCHITECTURE.md`
- **API Documentation:** `backend/SECURITY_IMPLEMENTATION_GUIDE.md`
- **Frontend Integration:** `Go_BARRY/AUTH_IMPLEMENTATION_GUIDE.md`

---

**Deployment Time:** 30-45 minutes
**Difficulty:** Easy (mostly file uploads and SQL execution)
**Risk:** Low (can rollback in < 5 minutes if needed)

Good luck with your deployment! 🚀
