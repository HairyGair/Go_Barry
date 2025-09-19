# 🔐 Authentication System - Complete Documentation

## Executive Summary

The Go North East Breakdown Guide has a **fully functional authentication system** integrated with Supabase. It's currently disabled (NO AUTH mode) for testing but can be activated immediately by changing one environment variable.

## 🎯 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Supabase Integration | ✅ Complete | Connected and configured |
| Login UI | ✅ Complete | Email/password form with validation |
| Session Management | ✅ Complete | 24-hour remember me option |
| Authorization | ✅ Complete | Supervisor role checking |
| Sign Out | ✅ Complete | Clears session properly |
| Backend API | ✅ Ready | Auth endpoints configured |
| Documentation | ✅ Complete | Full setup guides provided |

## 🚦 How to Enable Authentication

### Option 1: Quick Enable (Recommended)
1. Edit `/frontend/.env`
2. Change `VITE_ENABLE_AUTH=false` to `VITE_ENABLE_AUTH=true`
3. Restart the app with `npm run dev`

### Option 2: Use Pre-configured File
```bash
cd frontend
cp .env.auth-enabled .env
npm run dev
```

## 🔑 Authentication Flow

### When Enabled (VITE_ENABLE_AUTH=true)
1. User visits app → sees login screen
2. Enters email and password
3. System verifies against Supabase Auth
4. Checks supervisor profile exists
5. Creates session (optional 24-hour persistence)
6. Grants access to app

### When Disabled (VITE_ENABLE_AUTH=false)
1. User visits app → automatically logged in
2. Uses mock supervisor data (Anthony Gair)
3. No database connection required
4. Perfect for testing/development

## 👥 User Management

### Create New Supervisor Account

#### Method 1: Supabase Dashboard (Easiest)
1. Go to: https://supabase.com/dashboard/project/oieliubbvvdzhzvikzal
2. Create user in Authentication → Users
3. Add profile in Table Editor → supervisors

#### Method 2: SQL Script
```sql
-- Add to supervisors table
INSERT INTO public.supervisors (
  email, name, depot, role, is_active
) VALUES (
  'john.smith@gonortheast.co.uk',
  'John Smith',
  'Washington',
  'supervisor',
  true
);
```
Then create auth user with same email in dashboard.

### Test Account Available
- **Email**: test@gonortheast.co.uk
- **Password**: Test123!
- **Name**: Test Supervisor
- **Depot**: Washington

## 🏗️ Technical Architecture

### Frontend Components
- `/src/breakdown-guide/components/SupervisorLogin.jsx` - Login UI
- `/src/services/supabase-client.js` - Auth helpers
- `/src/breakdown-guide/App.jsx` - Auth state management

### Environment Variables
```env
VITE_SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
VITE_SUPABASE_ANON_KEY=[key_configured]
VITE_ENABLE_AUTH=false  # Change to true to enable
```

### Database Schema
```sql
-- supervisors table
CREATE TABLE supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  depot TEXT NOT NULL,
  role TEXT DEFAULT 'supervisor',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

## 🧪 Testing Authentication

### Test Script Provided
```bash
# Run authentication test
node test-auth.js
```
This will verify:
- Supabase connection
- Login functionality
- Supervisor profiles

### Manual Testing
1. Enable auth: `VITE_ENABLE_AUTH=true`
2. Start app: `npm run dev`
3. Try logging in with test account
4. Verify session persists
5. Test sign out

## 📊 Authentication States

### Logged Out
- Shows login form
- No access to app features
- Can't view dashboards

### Logged In
- Full app access
- Name/depot displayed
- Can perform assessments
- Access to dashboards
- Sign out button available

### Session Expired
- Automatic redirect to login
- Previous URL preserved
- Can use "Remember me" to extend

## 🔒 Security Features

- ✅ **Encrypted passwords** - Handled by Supabase Auth
- ✅ **Session tokens** - JWT-based authentication
- ✅ **HTTPS only** - Secure transmission
- ✅ **Role checking** - Supervisor verification
- ✅ **Activity logging** - All actions tracked
- ✅ **Auto logout** - After 24 hours (configurable)

## 🚨 Common Issues & Solutions

### "Invalid login credentials"
- Verify email exists in Authentication → Users
- Check password is correct
- Ensure supervisor profile exists

### "Supervisor profile not found"
- User authenticated but no supervisor record
- Add profile to supervisors table

### "Cannot connect to Supabase"
- Check internet connection
- Verify environment variables
- Check Supabase project status

## 📱 Multi-Device Support

- Sessions persist per device
- "Remember me" works across browser restarts
- Mobile-friendly login form
- Supports password managers

## 🎯 Next Steps

### To Deploy with Authentication
1. Create all supervisor accounts in Supabase
2. Set `VITE_ENABLE_AUTH=true` in production
3. Test all supervisor logins
4. Monitor auth logs in Supabase

### To Keep Testing Without Auth
1. Leave `VITE_ENABLE_AUTH=false`
2. Continue using mock data
3. No Supabase connection needed

## 📚 Related Documentation

- `ENABLE_AUTH_QUICK.md` - Quick setup guide
- `AUTHENTICATION_GUIDE.md` - Detailed instructions
- `test-auth.js` - Test script
- `.env.auth-enabled` - Pre-configured environment

## 📞 Support Contacts

- **Technical**: Anthony Gair (anthony@gobarry.co.uk)
- **Supabase Access**: Request from Anthony
- **Account Creation**: IT Support team

---

**Status**: ✅ Authentication System Ready  
**Default Mode**: NO AUTH (for testing)  
**To Enable**: Change one environment variable  
**Last Updated**: September 17, 2025
