# FIX: Login Screen Disappearing

## Problem
The login screen flashes briefly then disappears immediately in dev mode.

## Cause
Old supervisor sessions from before the password system are being detected, causing the modal to auto-close even though the sessions aren't valid with the new password requirements.

## Quick Fix

### Option 1: Use the Session Manager Tool
1. Open `PASSWORD_SYSTEM_UPDATE/clear-sessions.html` in your browser
2. Click "Clear Supervisor Sessions"
3. Refresh the Go BARRY app
4. The login screen should now stay visible

### Option 2: Browser Console
Open browser console (F12) and run:
```javascript
// Clear old sessions
localStorage.removeItem('barry_supervisor_session');
localStorage.removeItem('convex_session_id');
```

### Option 3: Clear Everything (Nuclear Option)
```javascript
// Clear all Go BARRY data
Object.keys(localStorage).forEach(key => {
    if (key.includes('barry') || key.includes('supervisor')) {
        localStorage.removeItem(key);
    }
});
```

## What Was Fixed

The updated SupervisorLogin component now:
1. Uses `isLoggedIn` flag instead of just checking for session presence
2. Validates that the session has a proper duty assigned
3. Only auto-closes when there's a truly valid session

```javascript
// Old (problematic)
if (supervisorSession && visible) {
    onClose();
}

// New (fixed)
if (isLoggedIn && visible && supervisorSession?.supervisor?.duty) {
    console.log('✅ Valid session detected, closing login modal');
    onClose();
}
```

## Testing After Fix

1. Clear sessions using one of the methods above
2. Refresh the app
3. Click "Supervisor Login"
4. The modal should stay open
5. Select supervisor, duty, and enter password
6. First-time users (not Barry) will see password setup
7. Barry can use "Barry123"

## Prevention

To prevent this in the future, the session validation now checks:
- Session exists
- User is properly logged in (`isLoggedIn` flag)
- Session has required fields (duty)
- Session hasn't expired

## Debug Commands

Check what's in localStorage:
```javascript
// See all Barry-related storage
Object.keys(localStorage).filter(k => k.includes('barry')).forEach(k => {
    console.log(k, ':', localStorage.getItem(k));
});
```

Check current session:
```javascript
// View current session
const session = localStorage.getItem('barry_supervisor_session');
if (session) {
    console.log('Current session:', JSON.parse(session));
} else {
    console.log('No session found');
}
```

## Still Having Issues?

1. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Incognito mode**: Test in a private/incognito window
3. **Check console**: Look for any JavaScript errors
4. **Verify files**: Ensure all password system files were copied correctly

The login screen should now work properly with the password system!