# cPanel Setup Checklist - Required Steps

## Current Status: 503 Error

The files are deployed, but the Node.js application needs to be configured in cPanel to start running.

---

## 🔧 Step-by-Step Setup in cPanel

### Step 1: Login to cPanel
1. Go to: **https://gobarry.co.uk:2083**
2. Username: `gobarryco`
3. Password: `juvwyh-1nuJdu-gyqrut`

---

### Step 2: Configure Node.js Application

1. **Find "Setup Node.js App"**
   - In cPanel search bar, type: "Node.js"
   - Click on **"Setup Node.js App"**

2. **Create or Edit Application**

   **If app exists** (click "Edit"):
   - Update the settings below

   **If no app exists** (click "Create Application"):
   - Fill in the following settings:

---

### Step 3: Application Settings

Configure with these **exact** values:

```
┌─────────────────────────────────────────────────┐
│ Node.js Version:                                │
│ ▼ 20.x (or latest available)                   │
├─────────────────────────────────────────────────┤
│ Application Mode:                               │
│ ○ Development  ● Production                     │
├─────────────────────────────────────────────────┤
│ Application Root:                               │
│ backend                                         │
├─────────────────────────────────────────────────┤
│ Application URL:                                │
│ api.breakdowns.gobarry.co.uk                    │
├─────────────────────────────────────────────────┤
│ Application Startup File:                       │
│ server.js                                       │
├─────────────────────────────────────────────────┤
│ Passenger log file:                             │
│ (leave default)                                 │
└─────────────────────────────────────────────────┘
```

---

### Step 4: Environment Variables

Still in the Node.js App setup, scroll down to **"Environment variables"**.

Click **"Add Variable"** for each of these:

```
Name: NODE_ENV
Value: production

Name: PORT
Value: 3001

Name: DB_HOST
Value: localhost

Name: DB_USER
Value: gobarryco_Gair

Name: DB_PASSWORD
Value: Turnip1105!!!!!

Name: DB_NAME
Value: gobarryco_breakdown

Name: JWT_SECRET
Value: 9fa4f0f326a2f2b997ebe6450b6ae5a236c8229cc43137462505b810c5c27bd792e6f97f058297758f0bc425ae36026e4cbdba91b10fef256541f3425ddd611a

Name: ALLOWED_ORIGINS
Value: https://gobarry.co.uk,https://www.gobarry.co.uk,https://breakdowns.gobarry.co.uk
```

---

### Step 5: Save and Start

1. Click **"Create"** (or **"Update"** if editing)
2. Wait for the message: **"Application created/updated successfully"**
3. The app should now show as **"Running"** with a green indicator

---

### Step 6: Verify It's Running

You should see in cPanel:

```
✓ Application is running
  Status: Running
  PID: [some number]

  Commands to run in your application:
  - Run npm install command: [Copy button]
  - Enter to virtual environment: [Copy button]
```

---

## 🧪 Test the Deployment

### Test 1: Health Check
Open in browser or run:
```bash
curl https://api.breakdowns.gobarry.co.uk/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-21T...",
  "database": "connected"
}
```

### Test 2: Supervisors Endpoint
```bash
curl https://api.breakdowns.gobarry.co.uk/api/supervisors
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "badge": "AG003",
    "name": "Anthony Gair",
    ...
  },
  ...
]
```

---

## ⚠️ If Still Getting 503 Error

### Option A: Check Application Logs

In cPanel:
1. Go to **"Setup Node.js App"**
2. Find your application
3. Click **"Logs"** button
4. Look for error messages

### Option B: SSH Troubleshooting

```bash
# Connect to server
ssh gobarryco@gobarry.co.uk

# Check if Node.js is running
ps aux | grep node

# Check logs
tail -f ~/logs/stderr.log

# Manually start to see errors
cd ~/backend
/opt/cpanel/ea-nodejs20/bin/node server.js
```

### Option C: Restart Application

In cPanel:
1. Go to **"Setup Node.js App"**
2. Click **"Stop App"**
3. Wait 5 seconds
4. Click **"Start App"**

OR via SSH:
```bash
ssh gobarryco@gobarry.co.uk
touch ~/backend/tmp/restart.txt
```

---

## 🔍 Common Issues

### Issue: "Application not found"
**Solution**: Create the application in cPanel as described in Step 2-3

### Issue: "Module not found"
**Solution**: Install dependencies
```bash
ssh gobarryco@gobarry.co.uk
cd ~/backend
/opt/cpanel/ea-nodejs20/bin/npm install --production
touch tmp/restart.txt
```

### Issue: "Database connection error"
**Solution**: Verify environment variables in cPanel match Step 4

### Issue: "Port 3001 already in use"
**Solution**:
- Check if old process is running: `ps aux | grep node`
- Kill it: `kill -9 [PID]`
- Restart app in cPanel

---

## ✅ Success Checklist

Once working, you should have:

- [ ] cPanel shows app status as **"Running"**
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Supervisors endpoint returns array of supervisors
- [ ] No errors in logs (`~/logs/stderr.log`)
- [ ] Frontend can connect to backend

---

## 📞 Quick Reference

**cPanel Access:**
- URL: https://gobarry.co.uk:2083
- User: gobarryco
- Password: juvwyh-1nuJdu-gyqrut

**SSH Access:**
```bash
ssh gobarryco@gobarry.co.uk
# Password: juvwyh-1nuJdu-gyqrut
```

**Backend Directory:**
```bash
cd ~/backend
```

**Restart Command:**
```bash
touch ~/backend/tmp/restart.txt
```

**Check Status:**
```bash
curl https://api.breakdowns.gobarry.co.uk/health
```

---

## 🎯 Next Steps After Setup

Once the backend is running (200 OK on health check):

1. **Test all endpoints** - See test commands above
2. **Test frontend login** - Go to https://breakdowns.gobarry.co.uk
3. **Monitor logs** - Check for any errors in production
4. **Update documentation** - Mark migration as complete

---

**Need Help?**
- Check logs in cPanel under Node.js App → Logs
- SSH in and run: `tail -f ~/logs/stderr.log`
- Contact: anthony@gobarry.co.uk
