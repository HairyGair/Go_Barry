# QUICK FIX: Deploy Diagnostic Endpoint

## What We've Discovered

✅ **The good news:**
- The API IS running and responding (health endpoint works!)
- It IS using your latest code (confirmed by health check format)
- DNS is pointing correctly to cPanel server
- Render.com is properly suspended

❌ **The problem:**
- MySQL supervisor queries are FAILING
- We need to see WHY they're failing

## The Solution: Diagnostic Endpoint

I've added a diagnostic endpoint that will tell us EXACTLY what's wrong with the MySQL connection.

## Deployment Steps (5 minutes)

### Step 1: Upload New Files via Cyberduck

Upload these 2 files to `~/api/`:

1. **diagnostic-endpoint.js** (new file)
   - From: `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/diagnostic-endpoint.js`
   - To: `~/api/diagnostic-endpoint.js`

2. **server.js** (updated file - includes diagnostic import)
   - From: `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/server.js`
   - To: `~/api/server.js` (overwrite existing)

### Step 2: Restart the App

In Cyberduck:
1. Navigate to `~/api/tmp/`
2. Delete `restart.txt` if it exists
3. Right-click → New File → name it `restart.txt`
4. Wait 10 seconds

### Step 3: Test the Diagnostic Endpoint

Open in your browser or use curl:

```bash
curl https://api.breakdowns.gobarry.co.uk/api/diagnostics
```

This will return JSON showing:
- ✅ or ❌ MySQL connection status
- ✅ or ❌ Supervisors table accessibility
- ✅ or ❌ Specific supervisor lookup (AG003)
- ✅ or ❌ Breakdowns table accessibility
- Database configuration (host, user, database name)
- Exact error messages if anything fails

## What to Look For

The diagnostic response will tell us:

### If MySQL Connection Fails:
- Check `database.host` - should be `85.234.151.224` or `localhost`
- Check `database.user` - should be `gobarryco_Gair`
- Check `database.database` - should be `gobarryco_breakdowns`
- Error message will say "Access denied" or "Unknown database"

### If Table Not Found:
- Error: "Table 'supervisors' doesn't exist"
- Means database name is wrong or table not created

### If Everything Passes:
- Then the issue is in the routes/supervisors.js file logic
- Not a connection problem

## Example Diagnostic Response

**Good Response:**
```json
{
  "timestamp": "2025-10-21T16:00:00.000Z",
  "server": {
    "nodeVersion": "v18.17.0",
    "platform": "linux",
    "cwd": "/home/gobarryco/api",
    "env": "production"
  },
  "database": {
    "host": "85.234.151.224",
    "port": "3306",
    "user": "gobarryco_Gair",
    "database": "gobarryco_breakdowns",
    "passwordSet": true
  },
  "tests": {
    "mysqlConnection": "✅ Connected",
    "supervisorsTable": "✅ 9 supervisors found",
    "supervisorAG003": "✅ Found: Anthony Gair",
    "breakdownsTable": "✅ 45 breakdowns found"
  }
}
```

**Bad Response (Connection Failed):**
```json
{
  ...
  "tests": {
    "mysqlConnection": "❌ Access denied for user 'gobarryco_Gair'@'localhost'",
    "supervisorsTable": "❌ Cannot read properties of undefined",
    ...
  }
}
```

## After Running Diagnostics

1. **Screenshot the response** or copy the JSON
2. **Share it with me** and I'll tell you exactly what to fix
3. **Or send it to Pixelish support** if it's a hosting configuration issue

---

## Why This Will Work

Unlike previous debugging attempts, this diagnostic endpoint:
- ✅ Runs INSIDE the actual Node.js process
- ✅ Uses the SAME MySQL connection as your routes
- ✅ Tests each component individually
- ✅ Returns clear error messages
- ✅ No caching (it's a new endpoint!)

This will finally tell us if it's:
- MySQL connection credentials
- Database name typo
- Table permissions
- Network/firewall issue
- Or something else entirely

---

## Troubleshooting the Diagnostic Endpoint Itself

**If /api/diagnostics returns 404:**
- Server hasn't restarted yet (wait 30 seconds, try again)
- `diagnostic-endpoint.js` wasn't uploaded
- `server.js` wasn't overwritten

**If /api/diagnostics returns 500:**
- Check the error message in the response
- Syntax error in diagnostic-endpoint.js (unlikely)
- Import path issue (check file was uploaded to `~/api/` not subdirectory)

**If /api/diagnostics times out:**
- MySQL is unreachable (network/firewall)
- Need Pixelish support to check MySQL service

---

**Next Steps:** Deploy these 2 files and run the diagnostic. We'll know the exact problem within 2 minutes!
