# Request to Pixelish Host - Node.js Process Restart

**Date:** October 21, 2025
**Issue:** Node.js API serving old code from Oct 14 (process never restarted)

---

## Confirmed Problem

Thank you for identifying the root cause! The issue is clear:

| Issue | Details |
|-------|---------|
| **Process Age** | Started Oct 14, hasn't restarted despite Oct 19 code updates |
| **Code in Memory** | Old code from OLD-BACKUP-SUPERVISOR.txt still loaded |
| **Running as** | Root (should be gobarryco) |
| **Process Manager** | None - manually started, not managed |
| **Restart Method** | tmp/restart.txt doesn't work without Passenger |

---

## What I Need

### Option 1: You Restart It (Preferred - Quick)

Please:

1. **Kill the current Node.js process** (the one running as root since Oct 14)
   ```bash
   # Find and kill the old process
   kill [PID from your earlier message]
   # Or if you don't have PID:
   pkill -f "node.*server.js"
   ```

2. **Set up Passenger** to manage the app:
   - **App Directory:** `/home/gobarryco/api/`
   - **Entry Point:** `server.js`
   - **Node Version:** 18.x or 20.x
   - **Environment:** Production
   - **Run as User:** `gobarryco` (NOT root)
   - **Environment File:** Load `.env` from `/home/gobarryco/api/.env`
   - **Port:** 3001 (or Passenger will assign one)
   - **Restart Method:** Enable `tmp/restart.txt` trigger

3. **Start the app** with Passenger
   ```bash
   # Passenger should auto-start after setup
   # Or manually via cPanel Node.js App Manager
   ```

---

### Option 2: I Restart It (Give Me SSH Access)

If you prefer I do it myself, please:

1. **Give me the command** to kill and restart the process as gobarryco user
2. **Or provide SSH sudo access** temporarily so I can run:
   ```bash
   # Kill old process
   sudo pkill -f "node.*server.js"

   # Start as correct user with process manager
   cd /home/gobarryco/api
   pm2 start server.js --name breakdown-api --user gobarryco
   # OR
   passenger start --daemonize --user gobarryco
   ```

---

## Why This Is Needed

**Current State:**
- ❌ API returns errors from code that was deleted 2 days ago
- ❌ Code updates uploaded via SFTP have no effect
- ❌ Creating `tmp/restart.txt` does nothing
- ❌ Running as root is a security risk

**After Restart:**
- ✅ New code will load (MySQL migration complete)
- ✅ All supervisor endpoints will work
- ✅ Runs as correct user (gobarryco)
- ✅ Managed by Passenger for easy restarts
- ✅ `tmp/restart.txt` will work for future updates

**All the code is fixed and ready** - it just needs to be loaded into a fresh Node.js process!

---

## Process Manager Recommendation

**Best option: Passenger** (already common on cPanel hosts)
- Auto-restarts on crashes
- Monitors `tmp/restart.txt` for manual restarts
- Integrates with cPanel Node.js App Manager
- Runs as correct user automatically
- Easy to configure via cPanel UI

**Alternative: PM2** (if Passenger not available)
```bash
npm install -g pm2
cd /home/gobarryco/api
pm2 start server.js --name breakdown-api
pm2 save
pm2 startup
```

---

## Files Ready to Run

All fixed files are already uploaded to `/home/gobarryco/api/`:

✅ `server.js` - Updated Oct 19 (includes MySQL, all routes)
✅ `routes/supervisors.js` - Fixed route ordering, MySQL migration
✅ `.env` - Correct database credentials
✅ `config/mysql.js` - Connection pooling configured
✅ `package.json` - All dependencies listed
✅ `node_modules/` - Dependencies installed

**Just needs:** Process kill + proper startup!

---

## Testing After Restart

Once restarted, I'll immediately test:

1. **Health check:**
   ```bash
   curl https://api.breakdowns.gobarry.co.uk/api/health
   ```
   Expected: `{"status":"healthy",...}` with NEW timestamp

2. **Supervisor stats:**
   ```bash
   curl https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003/stats
   ```
   Expected: JSON with performance statistics (not error)

3. **Diagnostics:**
   ```bash
   curl https://api.breakdowns.gobarry.co.uk/api/diagnostics
   ```
   Expected: MySQL connection tests (all ✅)

---

## Timeline

**Ideal:**
- You kill process and set up Passenger: **5-10 minutes**
- I test and confirm working: **2 minutes**
- **Total downtime: ~10 minutes**

**Current situation:**
- API is already broken (serving errors)
- Restarting it can only improve things!

---

## Contact

**My Details:**
- Name: Anthony Gair
- cPanel Username: gobarryco
- Domain: api.breakdowns.gobarry.co.uk

**Your Details:**
- Who are you at Pixelish? (so I know who to follow up with)
- Support Ticket Number? (if this is via ticket system)

---

## Summary

**What we learned:**
- Process started Oct 14, never restarted
- Old code still in memory despite file uploads
- No process manager = no restart mechanism

**What we need:**
- Kill old process
- Start with Passenger/PM2
- Run as gobarryco user

**Result:**
- API will immediately serve correct code
- All endpoints will work
- Future restarts via `tmp/restart.txt` will work

---

Thank you for identifying this! Once you restart the process, everything will work immediately because all the code fixes are already deployed.

Please let me know:
1. When you've restarted it
2. What process manager you set up (Passenger/PM2/other)
3. How to restart it myself in future (for code updates)
