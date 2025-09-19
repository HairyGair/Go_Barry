# 🔐 Enable Authentication - Quick Setup

## Current Status
The authentication system is **fully implemented** but currently in **NO AUTH mode** for testing.

## ⚡ Quick Enable (2 Steps)

### Step 1: Update Environment Variable
Edit `/frontend/.env` file and change:
```env
VITE_ENABLE_AUTH=false
```
to:
```env
VITE_ENABLE_AUTH=true
```

### Step 2: Restart the App
```bash
cd frontend
npm run dev
```

## 📧 Login with Supabase Authentication

The app uses **Supabase email/password authentication**. When enabled, you'll see a login screen requiring:
- Email address
- Password

## 🧪 Test Account Setup

### Quick Test - Create via Supabase Dashboard

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/oieliubbvvdzhzvikzal

2. **Create Auth User**:
   - Navigate to Authentication → Users
   - Click "Add user" → "Create new user"
   - Email: `test@gonortheast.co.uk`
   - Password: `Test123!`
   - Click "Create user"

3. **Create Supervisor Profile**:
   - Navigate to Table Editor → supervisors
   - Click "Insert row"
   - Fill in:
     ```
     email: test@gonortheast.co.uk
     name: Test Supervisor
     depot: Washington
     role: supervisor
     is_active: true
     ```
   - Click "Save"

4. **Login to App**:
   - Email: test@gonortheast.co.uk
   - Password: Test123!

## 👤 Create Your Own Account

### Via SQL (Fastest)
Run this in Supabase SQL Editor:

```sql
-- Create supervisor profile (change values as needed)
INSERT INTO public.supervisors (
  email,
  name,
  depot,
  role,
  is_active
) VALUES (
  'your.email@gonortheast.co.uk',  -- Your email
  'Your Name',                      -- Your name
  'Washington',                     -- Your depot
  'supervisor',                     -- Role
  true                             -- Active
);
```

Then create the auth user in Supabase Dashboard with the same email.

## 🏢 Available Depots
- Washington
- Riverside
- Percy Main
- Consett
- Hexham
- Deptford

## ⚡ Switch Between Modes

### Testing Mode (No Login)
```env
VITE_ENABLE_AUTH=false
```

### Production Mode (Requires Login)
```env
VITE_ENABLE_AUTH=true
```

## 🔧 Troubleshooting

### "Invalid login credentials"
- Check email exists in Authentication → Users
- Check supervisor exists in Table Editor → supervisors
- Verify password is correct

### "Supervisor profile not found"
- User exists but no supervisor profile
- Add profile in supervisors table with matching email

### Can't access Supabase Dashboard
- Contact Anthony Gair for access
- Email: anthony@gobarry.co.uk

## ✅ Authentication Features

When enabled, the system provides:
- 🔐 Secure email/password login
- 💾 24-hour "Remember me" option
- 🔄 Automatic session management
- 📝 Activity logging for compliance
- 🚪 Secure sign-out

## 📞 Support

Need help? Contact:
- Anthony Gair: anthony@gobarry.co.uk
- IT Support for account creation

---

**Status**: Ready to Enable ✅  
**Last Updated**: September 17, 2025
