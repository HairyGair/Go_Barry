# Fix Guide: Supervisor Login & Display Connection Issues

## The Problems:
1. **CORS blocking connections** - "User-Agent" header not allowed
2. **Hardcoded supervisor ID** - Everyone appears as "Alex Woodcock"
3. **WebSocket not authenticating** - Session info not passed correctly

## Solution Steps:

### 1. First, fix CORS (if not already done):
```bash
bash deploy-cors-fix.sh
```
Wait 3-5 minutes for Render to rebuild.

### 2. Then fix supervisor authentication:
```bash
bash fix-supervisor-auth.sh
```
Wait another 3-5 minutes.

### 3. Clear browser data:
- Clear cookies/cache for gobarry.co.uk
- Or use incognito/private browsing

### 4. Test the fix:
1. Open Display: https://gobarry.co.uk/display
2. Open Supervisor: https://gobarry.co.uk/browser-main
3. Login as "Anthony Gair" (not Alex)
4. Click "Supervisor Control"
5. Check Display screen - should show "Anthony Gair" connected

### 5. Debug if still not working:
Open `test-supervisor-auth.html` in your browser to:
- Test backend authentication
- Test WebSocket connection
- See detailed logs

## What was fixed:
- Removed hardcoded "supervisor001" fallback
- Properly pass supervisor ID and session to WebSocket
- Added better logging to track authentication flow
- Fixed supervisor session data structure

## Expected behavior after fix:
- Each supervisor logs in with their own name
- Display screen shows correct supervisor names
- Actions sync between supervisor and display screens
- WebSocket maintains stable connection

## If issues persist:
1. Check browser console for errors
2. Use test-supervisor-auth.html to debug
3. Add WebSocketDebugPanel to screens (see WEBSOCKET_DEBUG_INSTRUCTIONS.md)
