# Authentication Setup Guide - Go North East Breakdown Guide

## 🔐 Current Status

The authentication system is **fully implemented** but currently running in **NO AUTH mode** for testing. This guide explains how to enable full authentication.

## 🚀 Quick Start - Enable Authentication

### Step 1: Update Environment Variables

Replace the contents of `.env` file with `.env.auth-enabled`:

```bash
# In the frontend directory
cp .env.auth-enabled .env
```

Or manually change in `.env`:
```env
VITE_ENABLE_AUTH=true  # Change from false to true
```

### Step 2: Restart the Development Server

```bash
npm run dev
```

The app will now require authentication to access.

## 👥 Setting Up Supervisor Accounts

### Option A: Using Supabase Dashboard

1. **Access Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/oieliubbvvdzhzvikzal
   - Login with your Supabase account

2. **Navigate to Authentication**
   - Click on "Authentication" in the left sidebar
   - Select "Users" tab

3. **Create a New User**
   - Click "Add user" → "Create new user"
   - Enter email and password
   - Click "Create user"

4. **Add Supervisor Profile**
   - Go to "Table Editor" → "supervisors" table
   - Click "Insert" → "Insert row"
   - Fill in the supervisor details:
     ```
     email: [same email as created user]
     name: [Supervisor's full name]
     depot: [Washington/Riverside/Percy Main/etc.]
     role: supervisor
     is_active: true
     created_at: [current timestamp]
     ```
   - Click "Save"

### Option B: Using SQL Editor

1. **Go to SQL Editor in Supabase Dashboard**
2. **Run this SQL to create a supervisor with authentication**:

```sql
-- Step 1: Create auth user (replace with actual values)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'anthony.gair@gonortheast.co.uk',
  crypt('YourSecurePassword123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}'
);

-- Step 2: Create supervisor profile
INSERT INTO public.supervisors (
  id,
  email,
  name,
  depot,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'anthony.gair@gonortheast.co.uk',
  'Anthony Gair',
  'Washington',
  'supervisor',
  true,
  now(),
  now()
);
```

### Option C: Quick Test Account

For immediate testing, use these pre-configured test credentials:

```sql
-- Run this in Supabase SQL Editor to create a test supervisor
INSERT INTO public.supervisors (
  email,
  name,
  depot,
  role,
  is_active
) VALUES (
  'test.supervisor@gonortheast.co.uk',
  'Test Supervisor',
  'Washington',
  'supervisor',
  true
);
```

Then create the auth user via Supabase Dashboard:
- Email: test.supervisor@gonortheast.co.uk
- Password: TestPass123!

## 🔑 Default Test Accounts

When authentication is enabled, you can use these test accounts:

| Email | Password | Name | Depot | Role |
|-------|----------|------|-------|------|
| anthony.gair@gonortheast.co.uk | [Set in Supabase] | Anthony Gair | Washington | Admin |
| test.supervisor@gonortheast.co.uk | TestPass123! | Test Supervisor | Washington | Supervisor |

## 🛠️ Troubleshooting Authentication

### Issue: "Invalid login credentials"
**Solution**: 
- Verify the email exists in both auth.users and public.supervisors tables
- Check password is correct
- Ensure supervisor is_active = true

### Issue: "Supervisor profile not found"
**Solution**: 
- The email exists in auth.users but not in supervisors table
- Add the supervisor profile as shown above

### Issue: Authentication not working after enabling
**Solution**:
1. Clear browser cache and localStorage
2. Check .env file has VITE_ENABLE_AUTH=true
3. Restart the dev server
4. Check browser console for errors

### Issue: Can't access Supabase Dashboard
**Solution**:
- Contact Anthony Gair for Supabase project access
- Alternative: Use the backend API to create supervisors

## 🔄 Switching Between Auth Modes

### Enable NO AUTH Mode (Testing)
```env
VITE_ENABLE_AUTH=false
```
- No login required
- Uses mock supervisor data
- Good for development/testing

### Enable Full Authentication (Production)
```env
VITE_ENABLE_AUTH=true
```
- Requires valid email/password
- Uses Supabase authentication
- Supervisor must exist in database

## 📊 Supervisor Table Structure

The `supervisors` table in Supabase has the following structure:

```sql
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

## 🔐 Security Features

When authentication is enabled:
- ✅ Email/password authentication via Supabase
- ✅ Session management (24-hour remember me option)
- ✅ Secure token storage
- ✅ Automatic session refresh
- ✅ Role-based access (supervisor/admin)
- ✅ Activity logging for compliance

## 📝 Adding Multiple Supervisors

To add multiple supervisors at once, use this SQL template:

```sql
-- Add multiple supervisors
INSERT INTO public.supervisors (email, name, depot, role, is_active) VALUES
  ('john.smith@gonortheast.co.uk', 'John Smith', 'Washington', 'supervisor', true),
  ('jane.doe@gonortheast.co.uk', 'Jane Doe', 'Riverside', 'supervisor', true),
  ('mike.jones@gonortheast.co.uk', 'Mike Jones', 'Percy Main', 'supervisor', true),
  ('sarah.wilson@gonortheast.co.uk', 'Sarah Wilson', 'Consett', 'supervisor', true),
  ('david.brown@gonortheast.co.uk', 'David Brown', 'Hexham', 'supervisor', true);
```

Remember to create auth users for each supervisor via Supabase Dashboard.

## 🚀 Production Deployment

For production deployment:
1. Ensure all supervisors have accounts created
2. Set VITE_ENABLE_AUTH=true in production environment
3. Test authentication thoroughly
4. Monitor authentication logs in Supabase

## 📞 Support

For authentication issues or to request supervisor account creation:
- Contact: Anthony Gair (anthony.gair@gonortheast.co.uk)
- Or raise a ticket with IT Support

---

**Last Updated**: September 17, 2025
**Status**: Authentication System Ready ✅
