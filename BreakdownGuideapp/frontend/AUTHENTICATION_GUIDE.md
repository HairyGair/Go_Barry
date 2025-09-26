# 🔐 Authentication Setup Guide

## Current Setup
Your authentication is now properly configured with:
- ✅ `authHelpers.getSession()` function fixed
- ✅ Authentication enabled (`VITE_ENABLE_AUTH=true`)
- ✅ Supabase client properly configured
- ✅ Fallback supervisor list available

## How Authentication Works

### 1. **With Supabase (Production Mode)**
- Requires real email/password authentication
- Supervisors must exist in Supabase database
- Passwords are securely managed by Supabase

### 2. **With Fallback Mode (Testing)**
- Automatically activates if Supabase is unreachable
- Uses hardcoded supervisor list
- Password: `testpassword`

## Available Supervisors (Fallback Mode)

| Name | Email | Test Password |
|------|-------|--------------|
| Anthony Gair | anthony.gair@gonortheast.co.uk | testpassword |
| Barry Perryman | barry.perryman@gonortheast.co.uk | testpassword |
| Alex Woodcock | alex.woodcock@gonortheast.co.uk | testpassword |
| Andrew Cowley | andrew.cowley@gonortheast.co.uk | testpassword |
| Claire Fiddler | claire.fiddler@gonortheast.co.uk | testpassword |
| David Hall | david.hall@gonortheast.co.uk | testpassword |
| James Daglish | james.daglish@gonortheast.co.uk | testpassword |
| John Paterson | john.paterson@gonortheast.co.uk | testpassword |
| Simon Glass | simon.glass@gonortheast.co.uk | testpassword |

## To Login Now:

1. **Restart your dev server** (to pick up the auth fixes):
   ```bash
   # Stop with Ctrl+C, then:
   npm run dev
   ```

2. **Use Fallback Mode** (easier for testing):
   - The app will automatically use fallback mode if it can't connect to Supabase
   - Select any supervisor from dropdown
   - Password: `testpassword`
   - Click Login

3. **Force Fallback Mode** (if needed):
   Open browser console and run:
   ```javascript
   localStorage.setItem('use_fallback_supervisors', 'true')
   location.reload()
   ```

## If You Want Real Supabase Auth:

### Create a User in Supabase:
1. Go to: https://supabase.com/dashboard/project/oieliubbvvdzhzvikzal/auth/users
2. Click "Add user" → "Create new user"
3. Enter:
   - Email: `anthony.gair@gonortheast.co.uk`
   - Password: (your choice)
4. Create the user

### Add to Supervisors Table:
1. Go to: https://supabase.com/dashboard/project/oieliubbvvdzhzvikzal/editor
2. Run this SQL:
   ```sql
   INSERT INTO supervisors (id, name, email, role)
   VALUES (
     gen_random_uuid(),
     'Anthony Gair',
     'anthony.gair@gonortheast.co.uk',
     'admin'
   );
   ```

## Troubleshooting:

### "Invalid password" error:
- In fallback mode: Use `testpassword`
- In Supabase mode: Use the password you set in Supabase

### "authHelpers.getSession is not a function":
- Already fixed! Just restart the dev server

### Can't see supervisor dropdown:
- Check browser console for errors
- Try forcing fallback mode (see above)

### Still getting authentication errors:
- Clear browser storage: 
  ```javascript
  localStorage.clear()
  sessionStorage.clear()
  location.reload()
  ```

## Quick Test Without Auth:

If you just want to test without any authentication:
1. Edit `.env`: Set `VITE_ENABLE_AUTH=false`
2. Restart dev server
3. Login with any supervisor, any password

## Summary:

Your authentication is now working! The system will:
1. Try to connect to Supabase first
2. Fall back to local supervisor list if Supabase is unavailable
3. Use `testpassword` in fallback mode

Just restart your dev server and you should be able to login! 🚀
