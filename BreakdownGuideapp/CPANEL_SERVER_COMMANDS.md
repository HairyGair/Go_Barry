# cPanel Server Commands - Run These Now

**You're logged in as:** `gobarryco@server` in `/home/gobarryco/api`

---

## 🔒 Step 1: Fix Security Vulnerability (2 minutes)

The mysql2 package needs updating. Run these commands:

```bash
# Update package.json to use secure mysql2 version
cd ~/api

# Option A: Edit manually (quick)
nano package.json
# Find line with "mysql2": "^2.3.3"
# Change to: "mysql2": "^3.15.3"
# Press Ctrl+X, then Y, then Enter to save

# Option B: Use sed command (automated)
sed -i 's/"mysql2": "\^2.3.3"/"mysql2": "^3.15.3"/' package.json

# Verify the change
grep mysql2 package.json
# Should show: "mysql2": "^3.15.3"
```

---

## 📦 Step 2: Reinstall with Secure Version

```bash
cd ~/api

# Remove old packages
rm -rf node_modules
rm package-lock.json

# Install with secure version
npm install --production

# Verify no critical vulnerabilities
npm audit --production
# Should show: 0 vulnerabilities (or only low/moderate)
```

---

## 🚀 Step 3: Start the Application

### Option A: Using cPanel Node.js App Manager (Recommended)

1. **Open cPanel in browser**
2. Go to **"Setup Node.js App"** or **"Application Manager"**
3. Find your app (likely named "api" or "breakdown-backend")
4. Click **"Restart"** button
5. Verify status shows **"Running"** with green indicator

### Option B: Using Command Line (If PM2 is installed)

```bash
# Start with PM2
pm2 start server.js --name breakdown-backend

# Or restart if already running
pm2 restart breakdown-backend

# Check status
pm2 status

# View logs
pm2 logs breakdown-backend --lines 50
```

### Option C: Manual Start (Testing)

```bash
cd ~/api

# Start directly (will run in foreground)
node server.js

# You should see:
# "Server running on port 3001"
# "Database connected successfully"

# Press Ctrl+C to stop when done testing
```

---

## ✅ Step 4: Verify It's Working

### Test Health Endpoint

```bash
# From server terminal
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","database":"connected","timestamp":"..."}
```

### Test From Browser

Open browser and visit:
```
https://breakdowns.gobarry.co.uk/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-10-28T..."
}
```

### Check MySQL Connection

```bash
# Test database connection directly
mysql -h 85.234.151.224 -u gobarryco_Gair -p'Turnip1105!!!!!' gobarryco_breakdown -e "SELECT COUNT(*) FROM supervisors;"

# Should return a number (e.g., 9 supervisors)
```

---

## 📊 Check App Status

### View Logs

```bash
# If using cPanel Node.js App
# Go to: Setup Node.js App → Click on your app → View Logs

# If using PM2
pm2 logs breakdown-backend --lines 50

# Check for errors
pm2 logs breakdown-backend --err --lines 20
```

### Check Process

```bash
# See if app is running
ps aux | grep "node.*server.js"

# Check port 3001 is listening
netstat -tuln | grep 3001
# Should show: tcp ... 0.0.0.0:3001 ... LISTEN
```

---

## 🔧 Troubleshooting

### Error: "Cannot find module 'mysql2'"

**Solution:**
```bash
cd ~/api
npm install mysql2@3.15.3
pm2 restart breakdown-backend  # or restart via cPanel
```

### Error: "Port 3001 already in use"

**Solution:**
```bash
# Find what's using port 3001
lsof -i :3001

# Kill old process
kill -9 <PID>

# Or change port in .env
nano .env
# Change: PORT=3002
# Save and restart app
```

### Error: "Cannot connect to MySQL"

**Solution:**
```bash
# Test MySQL connection
mysql -h 85.234.151.224 -u gobarryco_Gair -p gobarryco_breakdown

# If fails, check:
# 1. MySQL server is running
# 2. Firewall allows connection from your server
# 3. Credentials in .env are correct
cat .env | grep DB_
```

### App Keeps Stopping

**Solution:**
```bash
# Check logs for errors
cat ~/api/logs/error.log
# OR
pm2 logs breakdown-backend --err

# Common issues:
# - Syntax error in code (check with: node -c server.js)
# - Missing .env file (check: ls -la .env)
# - Database unreachable (test mysql command above)
```

---

## 📝 Quick Command Summary

```bash
# Fix vulnerability
cd ~/api
sed -i 's/"mysql2": "\^2.3.3"/"mysql2": "^3.15.3"/' package.json
rm -rf node_modules package-lock.json
npm install --production

# Start app (choose one)
# Method 1: cPanel interface (recommended)
# Method 2: PM2
pm2 start server.js --name breakdown-backend
pm2 save

# Method 3: Direct (testing)
node server.js

# Verify
curl http://localhost:3001/api/health
curl https://breakdowns.gobarry.co.uk/api/health

# Check status
pm2 status
pm2 logs breakdown-backend
```

---

## 🎯 What You Should See

### After Installing Packages:
```
added 137 packages in 766ms
0 vulnerabilities  ← This is what we want!
```

### After Starting App:
```
Server running on port 3001
Database connected successfully
WebSocket server initialized
```

### After Testing Health:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-10-28T09:30:45.123Z"
}
```

---

## ✅ Success Checklist

Once these are all done, you're ready:

- [ ] mysql2 updated to v3.15.3 in package.json
- [ ] `npm install --production` completed with 0 critical vulnerabilities
- [ ] Application started (via cPanel or PM2)
- [ ] Health endpoint returns 200 OK
- [ ] Database connection working
- [ ] Logs show no errors
- [ ] Browser can access: https://breakdowns.gobarry.co.uk/api/health

---

## 🚀 Next Step After Backend is Running

Once your backend is confirmed working, upload the **frontend**:

1. Use CyberDuck to upload `frontend/dist/` contents to `~/public_html/`
2. Ensure .htaccess is configured for React Router
3. Visit https://breakdowns.gobarry.co.uk
4. Test login with supervisor badge

---

**Current Location:** `/home/gobarryco/api`
**Package Manager:** npm v10.9.3 (consider updating to v11.6.2 later)
**Node.js:** v18+ (check with: `node --version`)
**Status:** ⏳ Waiting for security fix + app start
