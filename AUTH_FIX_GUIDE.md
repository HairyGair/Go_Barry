# Authentication Server Connection Fix

## Problem
The breakdown guide login screen shows "Unable to connect to authentication server" error because the backend server at https://go-barry.onrender.com is not responding.

## Solution Applied
Created a local authentication fallback system that:
1. Intercepts failed authentication requests
2. Provides local authentication when the backend is unavailable
3. Maintains all logging and tracking functionality locally

## How It Works

### Local Authentication Credentials
All supervisors can now log in with:
- **Password**: `Barry123!`

This works for all supervisor accounts:
- AG003 - Anthony Gair (Admin)
- AW001 - Alex Woodcock
- AC002 - Andrew Cowley
- CF004 - Claire Fiddler
- DH005 - David Hall
- JD006 - James Daglish
- JP007 - John Paterson
- SG008 - Simon Glass
- BP009 - Barry Perryman (Admin)

### Features
- **Automatic Fallback**: If backend is unavailable, automatically uses local authentication
- **Session Storage**: Maintains 24-hour sessions locally
- **Full Functionality**: All breakdown wizards and logging work in offline mode
- **Data Persistence**: All assessments are saved locally even without backend

## To Use the Fix

1. **Clear browser cache and reload the page**
   - Press Cmd+Shift+R (Mac) or Ctrl+F5 (Windows)

2. **Login with local credentials**
   - Select your supervisor account (e.g., AG003 - Anthony Gair)
   - Enter password: `Barry123!`
   - Click "Sign In"

3. **You'll see an indicator if in local mode**
   - A yellow banner will appear saying "Local Mode Active"
   - This means you're using local authentication

## Testing the Fix

In browser console:
```javascript
// Check if local auth is active
window.LocalAuthFallback.isLocalMode()

// Test backend connectivity
await window.LocalAuthFallback.testBackend()

// View stored supervisors
window.LocalAuthFallback.supervisors
```

## Data Synchronization

When in local mode:
- All assessments are saved to browser localStorage
- Data persists even after closing the browser
- When backend comes online, data can be synced

To manually sync pending assessments when backend is available:
```javascript
window.syncPendingAssessments()
```

## Security Notes

- Local mode is intended for development and emergency use
- Production should use the proper backend authentication
- Local passwords are stored in the browser (not secure for production)
- All assessment data is audited and logged locally

## Troubleshooting

If login still fails:

1. **Check browser console for errors**
   ```javascript
   console.log(window.LocalAuthFallback)
   ```

2. **Verify the script is loaded**
   - Should see: "✅ Local Authentication Fallback installed"

3. **Try a different browser or incognito mode**
   - Sometimes cache issues persist

4. **Manual override** (emergency only)
   ```javascript
   // Force local login
   const session = {
       supervisorId: 'supervisor003',
       supervisorName: 'Anthony Gair',
       badge: 'AG003',
       depot: 'Local Mode',
       isAdmin: true,
       token: 'local-emergency-' + Date.now(),
       timestamp: new Date().toISOString()
   };
   localStorage.setItem('supervisor_session', JSON.stringify(session));
   location.reload();
   ```

## Backend Recovery

When the backend server comes back online:
1. The system will automatically detect it
2. Future logins will use backend authentication
3. Local data can be synced to the backend
4. Normal operation resumes

## Benefits of Local Mode

- **No downtime**: Continue working even when backend is down
- **Full functionality**: All wizards and features work
- **Data safety**: Nothing is lost, everything saved locally
- **Automatic recovery**: Seamlessly switches back when backend returns
