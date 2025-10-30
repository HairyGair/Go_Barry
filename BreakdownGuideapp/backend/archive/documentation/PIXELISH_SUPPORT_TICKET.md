# Support Ticket: Node.js API Not Serving Updated Code

**Account:** gobarry.co.uk (gobarryco)
**Issue:** API returning cached/old error responses despite uploading fixed code
**Priority:** High - Production API broken
**Date:** October 20, 2025

---

## Problem Summary

My Node.js API at `api.breakdowns.gobarry.co.uk` is returning error responses that don't exist in the current code. I've uploaded updated files to `~/api/` but changes are not taking effect, even after attempting to restart the application.

**Specific Issue:**
- Endpoint: `https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003/stats`
- Current Response: `{"success":false,"error":"Database error while fetching supervisor"}`
- Problem: This error message doesn't exist in any file in `~/api/routes/`
- Same ETag every time: `W/"44-xKOWWFcrl6l/igISyItv6krTt1I"` (suggests cached response)

---

## What I've Already Done

### ✅ Code Fixed and Uploaded
- Fixed all code issues in local development
- Uploaded corrected files to `~/api/` via SFTP (Cyberduck)
- Verified files are present and correct on server
- File: `~/api/routes/supervisors.js` (11,814 bytes, modified Oct 19 09:47)

### ✅ Configuration Checked
- Document root set to `api` in cPanel Domain Management
- `.env` file configured with correct MySQL credentials
- Database `gobarryco_breakdowns` is accessible and populated
- DNS records confirmed pointing to 85.234.151.224 (your server)

### ✅ Restart Attempts
- Created `~/api/tmp/restart.txt` multiple times
- Deleted and recreated restart.txt
- Result: No change in API responses

### ❌ What's NOT Working
- Code changes don't appear in API responses
- Custom headers added to code don't show up
- Error messages that don't exist in files keep appearing
- Application appears to be running from a different location

---

## Questions for Support

### 1. Where is the Node.js app actually running from?
I've uploaded code to `~/api/` but it seems the application may be:
- Running from a different directory
- Cached/proxied somewhere
- Still pointing to an external service (I recently suspended Render.com backend)

**Can you confirm which directory the Node.js process for `api.breakdowns.gobarry.co.uk` is actually using?**

### 2. Is there any caching in place?
Despite not having LiteSpeed Cache enabled, the API returns identical responses with the same ETag every time, suggesting caching somewhere:
- Server-level caching?
- CloudFlare or CDN?
- Apache mod_cache?
- Passenger caching?

**Can you check and clear any caches for `api.breakdowns.gobarry.co.uk`?**

### 3. How do I properly restart the Node.js application?
Creating `~/api/tmp/restart.txt` has no effect.

**Is there a Passenger configuration or different restart method I should use?**

### 4. Are there any proxy/redirect rules?
DNS points to your server (85.234.151.224), but responses suggest the app isn't running from my cPanel account.

**Can you check for:**
- Proxy rules in Apache virtual host
- Passenger configuration for this domain
- Any redirects to external services

---

## Technical Details

### DNS Configuration (Verified via dig)
```
api.breakdowns.gobarry.co.uk → A record → 85.234.151.224
breakdowns.gobarry.co.uk     → A record → 85.234.151.224
gobarry.co.uk                → A record → 85.234.151.224
```

### Node.js Application Details
- **Entry Point:** `~/api/server.js`
- **Port (intended):** 3001
- **Node Version:** 18+ required
- **Module Type:** ES6 (type: "module" in package.json)
- **Dependencies:** Installed in `~/api/node_modules/`

### Evidence Node.js Process Exists
When trying to start manually:
```bash
Error: listen EADDRINUSE: address already in use :::3001
```
This proves something is already running on port 3001, but:
- `ps aux | grep node` shows no processes (may be running as different user)
- Code changes to this process don't take effect

### MySQL Database (Working)
```
Host: localhost (85.234.151.224)
Database: gobarryco_breakdowns
User: gobarryco_Gair
Status: Connected successfully, data verified present
```

---

## What I Need From You

1. **Location of actual running Node.js process directory**
2. **Clear any caches** affecting `api.breakdowns.gobarry.co.uk`
3. **Restart the Node.js application** properly (or tell me how)
4. **Check for any proxy/redirect rules** I can't see from my account
5. **Confirm Passenger configuration** for this domain

---

## Testing After Resolution

Once you've made changes, I'll test:
```bash
curl -s "https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003/stats"
```

**Expected Response:** JSON with supervisor statistics (not an error)

The correct code DOES work - I just need it to actually be served instead of the cached/old version.

---

## Contact Information

**Name:** Anthony Gair
**Email:** [Your email address]
**cPanel Username:** gobarryco
**Domain:** gobarry.co.uk
**Best Time to Call:** [Your availability]

---

## Appendix: Files That Should Be Running

### ~/api/server.js (Main Entry Point)
- Imports and mounts routes
- Connects to MySQL database
- Listens on port 3001

### ~/api/routes/supervisors.js (Fixed File)
- Line 93: `router.get('/:id/stats', ...)` - Specific route
- Line 428: `router.get('/:id', ...)` - Generic route
- All endpoints migrated to MySQL
- Custom test header added: `X-Code-Version: CPANEL-FIXED-12345`

### ~/api/.env (Environment Variables)
```
DB_HOST=85.234.151.224
DB_PORT=3306
DB_USER=gobarryco_Gair
DB_PASSWORD=Turnip1105!!!!!
DB_NAME=gobarryco_breakdowns
PORT=3001
```

---

**Thank you for your assistance!** This is a production API used by Go North East supervisors for breakdown management, so getting it working on cPanel is critical.

If you need any additional information or access, please let me know.
