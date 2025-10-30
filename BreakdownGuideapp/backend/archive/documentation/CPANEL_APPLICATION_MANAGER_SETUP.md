# cPanel Setup via Application Manager & Terminal

## Your cPanel has Application Manager (not Setup Node.js App)

This is a different interface - let's use the **Terminal** to set everything up properly.

---

## 🚀 Quick Setup via Terminal (Recommended)

### Step 1: Open Terminal in cPanel

1. Login to cPanel: **https://gobarry.co.uk:2083**
2. Find and click: **"Terminal"**
3. A terminal window will open

---

### Step 2: Run These Commands in Terminal

Copy and paste these commands one by one:

```bash
# Navigate to backend directory
cd ~/backend

# Verify files are there
ls -la

# You should see: server.js, package.json, routes/, etc.
```

**Expected output:**
```
server.js
package.json
app.js
.htaccess
routes/
middleware/
services/
...
```

---

### Step 3: Create .env File

```bash
# Copy production environment
cp .env.production .env

# Verify it was created
cat .env
```

**Expected output:**
```
NODE_ENV=production
PORT=3001
DB_HOST=localhost
...
```

---

### Step 4: Install Dependencies

```bash
# Install Node.js packages
npm install --production

# This may take 2-3 minutes
# You should see progress of packages being installed
```

**Expected output:**
```
added 150 packages in 2m
```

---

### Step 5: Test the Server Manually

```bash
# Try to start the server
node server.js
```

**If you see:**
```
✅ MySQL database connection configured
Server running on port 3001
```

**Great! The app works. Press Ctrl+C to stop it.**

**If you see errors**, copy them and send them to me.

---

### Step 6: Set Up Automatic Startup via Application Manager

Now let's use Application Manager to keep it running:

1. **In cPanel**, find **"Application Manager"**
2. Click **"Register Application"** or **"Create"**
3. Configure:

```
Application Name: Go BARRY Backend
Application Type: Node.js
Application Path: /home/gobarryco/backend
Startup Command: node server.js
Port: 3001
```

4. Click **"Save"** or **"Create"**
5. Click **"Start"** button

---

## 🔧 Alternative: Use PM2 (Process Manager)

If Application Manager doesn't work well, we can use PM2 instead:

### Install PM2

```bash
# In Terminal
npm install -g pm2

# Start the backend with PM2
cd ~/backend
pm2 start server.js --name "gobarry-backend"

# Set it to restart on reboot
pm2 startup
pm2 save

# Check status
pm2 status
```

**Expected output:**
```
┌─────┬──────────────────┬─────┬────────┬──────┐
│ id  │ name             │ mode│ status │ cpu  │
├─────┼──────────────────┼─────┼────────┼──────┤
│ 0   │ gobarry-backend  │ fork│ online │ 0%   │
└─────┴──────────────────┴─────┴────────┴──────┘
```

### PM2 Commands Reference

```bash
# Status
pm2 status

# View logs
pm2 logs gobarry-backend

# Restart
pm2 restart gobarry-backend

# Stop
pm2 stop gobarry-backend

# Start
pm2 start gobarry-backend
```

---

## 🔧 Apache Configuration for Reverse Proxy

The `.htaccess` file should already be in place, but let's verify:

```bash
# Check if .htaccess exists
cat ~/backend/.htaccess
```

**Should contain:**
```apache
PassengerEnabled on
PassengerAppType node
PassengerStartupFile server.js
...
```

---

## 🧪 Test the Deployment

### Test 1: From Terminal (on server)

```bash
# Test locally
curl http://localhost:3001/health
```

**Expected:**
```json
{"status":"ok","timestamp":"...","database":"connected"}
```

### Test 2: From Browser (public)

Open: **https://api.breakdowns.gobarry.co.uk/health**

**Expected:**
```json
{"status":"ok","timestamp":"...","database":"connected"}
```

---

## 📋 Complete Terminal Setup Script

Run this all at once (copy entire block):

```bash
#!/bin/bash
echo "🚀 Setting up Go BARRY Backend..."
cd ~/backend

echo "📝 Creating .env file..."
cp .env.production .env

echo "📦 Installing dependencies..."
npm install --production

echo "🧪 Testing server..."
timeout 5 node server.js &
sleep 3

echo "✅ Testing health endpoint..."
curl http://localhost:3001/health

echo ""
echo "🔧 Installing PM2..."
npm install -g pm2

echo "🚀 Starting with PM2..."
pm2 start server.js --name "gobarry-backend"
pm2 save
pm2 startup

echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Check status:"
echo "   pm2 status"
echo ""
echo "🧪 Test endpoint:"
echo "   curl https://api.breakdowns.gobarry.co.uk/health"
echo ""
```

---

## ⚠️ Troubleshooting

### Issue: "npm: command not found"

The Node.js version needs to be set. Find available versions:

```bash
# List available Node.js versions
ls /opt/cpanel/ea-nodejs*/bin/node

# Use specific version (e.g., Node.js 20)
/opt/cpanel/ea-nodejs20/bin/npm install --production
/opt/cpanel/ea-nodejs20/bin/node server.js
```

### Issue: "Permission denied"

```bash
# Fix permissions
chmod 755 ~/backend
chmod 644 ~/backend/server.js
```

### Issue: "Port 3001 already in use"

```bash
# Find what's using the port
lsof -i :3001

# Kill the process
kill -9 [PID]
```

### Issue: Database connection error

```bash
# Test MySQL connection
mysql -h localhost -u gobarryco_Gair -p gobarryco_breakdown
# Password: Turnip1105!!!!!

# Inside MySQL:
SHOW TABLES;
SELECT COUNT(*) FROM supervisors;
EXIT;
```

---

## 🎯 Quick Commands Reference

### Start Backend
```bash
cd ~/backend
pm2 start server.js --name "gobarry-backend"
```

### Stop Backend
```bash
pm2 stop gobarry-backend
```

### Restart Backend
```bash
pm2 restart gobarry-backend
```

### View Logs
```bash
pm2 logs gobarry-backend --lines 100
```

### Check Status
```bash
pm2 status
curl http://localhost:3001/health
```

---

## ✅ Success Indicators

You'll know it's working when:

- [ ] `pm2 status` shows **"online"** in green
- [ ] `curl http://localhost:3001/health` returns JSON
- [ ] Browser shows https://api.breakdowns.gobarry.co.uk/health returns JSON
- [ ] No errors in: `pm2 logs`

---

## 📞 Access Information

**Terminal Commands:**
```bash
ssh gobarryco@gobarry.co.uk
# Password: juvwyh-1nuJdu-gyqrut
```

**Backend Directory:**
```bash
cd ~/backend
```

**Quick Health Check:**
```bash
curl http://localhost:3001/health
```

---

Would you like me to walk through any specific step?
