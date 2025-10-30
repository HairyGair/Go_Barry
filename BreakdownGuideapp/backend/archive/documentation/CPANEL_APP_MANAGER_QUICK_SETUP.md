# Setup via cPanel Application Manager

## Using cPanel's Application Manager

Your cPanel has Application Manager - here's the exact setup:

---

## 🎯 Option 1: Terminal Setup (Fastest - 2 minutes)

### Use cPanel Terminal

1. **In cPanel**, click **"Terminal"**
2. **Copy and paste this entire block:**

```bash
# Navigate to backend
cd ~/backend

# Create environment file
cp .env.production .env

# Install dependencies (use the correct Node.js path)
/opt/cpanel/ea-nodejs20/bin/npm install --production

# Create PM2 ecosystem file for Application Manager
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'gobarry-backend',
    script: 'server.js',
    cwd: '/home/gobarryco/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
EOF

# Install PM2 globally
/opt/cpanel/ea-nodejs20/bin/npm install -g pm2

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup

echo ""
echo "✅ Backend is now running!"
echo ""
echo "Test it:"
echo "curl http://localhost:3001/health"
```

3. **Test it works:**
```bash
pm2 status
curl http://localhost:3001/health
```

**Expected output:**
```
┌─────┬──────────────────┬─────────┬─────────┬──────┐
│ id  │ name             │ status  │ restart │ cpu  │
├─────┼──────────────────┼─────────┼─────────┼──────┤
│ 0   │ gobarry-backend  │ online  │ 0       │ 0%   │
└─────┴──────────────────┴─────────┴─────────┴──────┘

{"status":"ok","timestamp":"...","database":"connected"}
```

**✅ If you see "online" and JSON response, you're done!**

---

## 🎯 Option 2: Application Manager Interface

If you prefer using the Application Manager GUI:

### Step 1: Prepare via Terminal First

```bash
# SSH or use Terminal in cPanel
cd ~/backend
cp .env.production .env
/opt/cpanel/ea-nodejs20/bin/npm install --production
```

### Step 2: Register in Application Manager

1. Go to **"Application Manager"** in cPanel
2. Click **"Register Application"**
3. Fill in:

```
Application Name: Go BARRY Backend
Domain: api.breakdowns.gobarry.co.uk
Base Application URL: / (root)
Deployment Mode: Production
```

4. Click **"Register"**

### Step 3: Configure Application

In the registered application settings:

```
Application Type: Node.js
Node Version: 20.x (or latest)
Application Root: /home/gobarryco/backend
Application Entry Point: server.js
Port: 3001
Environment Variables:
  - NODE_ENV=production
  - PORT=3001
  - DB_HOST=localhost
  - DB_USER=gobarryco_Gair
  - DB_PASSWORD=Turnip1105!!!!!
  - DB_NAME=gobarryco_breakdown
```

5. Click **"Save"**
6. Click **"Start Application"**

---

## 🧪 Verify It's Working

### Test 1: Check Application Manager
- Should show status: **"Running"** or **"Active"**
- Green indicator

### Test 2: Test Locally (via Terminal)
```bash
curl http://localhost:3001/health
```

### Test 3: Test Publicly (via Browser)
Open: **https://api.breakdowns.gobarry.co.uk/health**

**All should return:**
```json
{"status":"ok","timestamp":"2025-10-21T...","database":"connected"}
```

---

## 🔧 Managing the Application

### Via PM2 (Command Line - Recommended)

```bash
# View status
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

### Via Application Manager (GUI)

1. Go to **Application Manager**
2. Find **"Go BARRY Backend"**
3. Use buttons: **Start**, **Stop**, **Restart**

---

## ⚠️ Troubleshooting

### Issue: Can't find Node.js/npm

Find available Node.js versions:
```bash
ls /opt/cpanel/ea-nodejs*/bin/node
```

Use the full path:
```bash
/opt/cpanel/ea-nodejs20/bin/node --version
/opt/cpanel/ea-nodejs20/bin/npm install
```

### Issue: "Module not found"

```bash
cd ~/backend
/opt/cpanel/ea-nodejs20/bin/npm install --production
pm2 restart gobarry-backend
```

### Issue: Can't connect to database

Test connection:
```bash
mysql -h localhost -u gobarryco_Gair -p
# Password: Turnip1105!!!!!
```

Check .env file:
```bash
cat ~/backend/.env | grep DB_
```

### Issue: Port already in use

```bash
# Find process using port 3001
lsof -i :3001

# Kill it
kill -9 [PID]

# Restart PM2
pm2 restart gobarry-backend
```

---

## 📊 Quick Status Check

Run this to see everything at once:

```bash
echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== Local Health Check ==="
curl -s http://localhost:3001/health | jq .

echo ""
echo "=== Public Health Check ==="
curl -s https://api.breakdowns.gobarry.co.uk/health | jq .

echo ""
echo "=== Database Connection ==="
mysql -h localhost -u gobarryco_Gair -pTurnip1105!!!!! -e "SELECT COUNT(*) as supervisor_count FROM gobarryco_breakdown.supervisors;"
```

---

## ✅ Success Checklist

Once everything is working:

- [ ] PM2 shows status: **"online"** (green)
- [ ] `curl http://localhost:3001/health` returns JSON
- [ ] Browser test: https://api.breakdowns.gobarry.co.uk/health returns JSON
- [ ] Application Manager shows app as **"Running"**
- [ ] No errors in logs: `pm2 logs`
- [ ] Database connected: Response includes `"database":"connected"`

---

## 🚀 Next Steps

Once backend is running (all checkboxes above are ✅):

1. **Test API endpoints**
   ```bash
   curl https://api.breakdowns.gobarry.co.uk/api/supervisors
   ```

2. **Test frontend**
   - Go to: https://breakdowns.gobarry.co.uk
   - Try to login with supervisor credentials

3. **Monitor logs**
   ```bash
   pm2 logs gobarry-backend --lines 50
   ```

---

## 📞 Quick Reference

**Terminal Access:**
```bash
ssh gobarryco@gobarry.co.uk
# Password: juvwyh-1nuJdu-gyqrut
```

**Backend Location:**
```bash
cd ~/backend
```

**PM2 Commands:**
```bash
pm2 status              # Check status
pm2 logs                # View logs
pm2 restart all         # Restart
```

**Health Check:**
```bash
curl http://localhost:3001/health
```

---

**Ready to start?** Just open Terminal in cPanel and run the script from Option 1! 🚀
