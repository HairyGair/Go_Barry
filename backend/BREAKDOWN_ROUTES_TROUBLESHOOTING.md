# Breakdown Logging System - Troubleshooting Guide

## Issue: Routes returning 404 errors

The server is running but the new breakdown routes aren't registered. This happens because the server was already running when we added the new routes.

## Solution Steps:

### 1. First, check server status:
```bash
node test-server-status.js
```

### 2. Restart the server:

**In the terminal running the server:**
1. Press `Ctrl+C` to stop the server
2. Run `npm start` to start it again

**Watch for these messages in the startup logs:**
```
✅ Breakdown Logger API registered for logging breakdown incidents
✅ Admin Breakdowns API registered for viewing breakdown logs at /api/admin-breakdowns
```

### 3. Wait for full startup:
The server uses lazy loading, so wait until you see:
```
🎆 GO BARRY BACKEND ULTRA-MEMORY-OPTIMIZED READY 🎆
```

### 4. Test again:
```bash
node test-breakdown-logging.js
```

## If still getting 404 errors:

### Check for import errors:
Look for error messages like:
- `Failed to register Breakdown Logger`
- `Failed to lazy import`

### Common fixes:
1. **Missing uuid package:**
   ```bash
   npm install uuid
   ```

2. **Syntax errors in route files:**
   Check that the route files were created correctly

3. **Wrong import path:**
   Verify the imports in breakdownLogger.js use the correct path for uuid

## Alternative Testing:

If the automated test isn't working, try manual testing:

```bash
# Test health endpoint first (should work)
curl http://localhost:3001/api/health

# Test breakdown logging
curl -X POST http://localhost:3001/api/breakdowns/log \
  -H "Content-Type: application/json" \
  -d '{
    "supervisorId": "TEST001",
    "vehicleReg": "ABC123",
    "fleetNo": "FL001",
    "breakdownType": "Steering"
  }'

# Test fetching logs
curl http://localhost:3001/api/admin-breakdowns
```

## Expected Server Startup Sequence:

1. Server starts and binds to port
2. Routes are registered (look for the ✅ messages)
3. Database connections are established
4. "READY" message appears

## Still having issues?

1. Check `backend/index.js` around line 205-210 to ensure the route registration code is there
2. Make sure both route files exist:
   - `/backend/routes/breakdownLogger.js`
   - `/backend/routes/adminBreakdowns.js`
3. Check for any error messages in the server console
4. Ensure Supabase environment variables are set in `.env`

## Contact for help:
If you're still having issues after following these steps, the problem might be:
- Missing environment variables
- Database connection issues
- File permission problems
