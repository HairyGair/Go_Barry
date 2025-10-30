# Authentication Setup Instructions

---

## ⚠️ **LEGACY DOCUMENTATION - OUTDATED** ⚠️

**This document describes outdated deployment using Supabase/Render.com.**

**Current Deployment:**
- ✅ Platform: cPanel (self-hosted)
- ✅ Database: MySQL (cPanel)
- ✅ See: `docs/CPANEL_ONLY_DEPLOYMENT_GUIDE.md`
- ✅ Quick: `docs/CPANEL_QUICK_START_10MIN.md`

**Last Updated:** October 27, 2025

---

## Quick Start

The authentication system is configured to use Supabase. To get started:

### 1. Test Account (Already Created)

Use the test page to create and test authentication:

1. Open the test page: `frontend/test-supabase-auth.html`
2. Create a test user with:
   - Email: `test@test.com`
   - Password: `Test123456!`
3. Sign in with these credentials

### 2. Creating Your Own Account

Use the test page (`test-supabase-auth.html`) to:

1. Enter your email (e.g., `anthony.gair@gonortheast.co.uk`)
2. Use a secure password (min 6 characters)
3. Click "Create User"
4. Then sign in with the same credentials

### 3. Production Setup

For production deployment, ensure these users are created in Supabase:

```javascript
// Primary Admin Users
{
    email: 'anthony.gair@gonortheast.co.uk',
    password: '[secure password]',
    role: 'admin'
}

// Additional supervisors can be added as needed
```

### 4. Environment Variables

The `.env` file is already configured with:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### 5. Database Tables

Ensure these tables exist in Supabase:

1. **supervisors** table:
   ```sql
   CREATE TABLE supervisors (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       email TEXT UNIQUE NOT NULL,
       name TEXT NOT NULL,
       depot TEXT,
       role TEXT CHECK (role IN ('admin', 'supervisor', 'manager')),
       badge_number TEXT,
       is_active BOOLEAN DEFAULT true,
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **breakdowns** table (for logging):
   ```sql
   CREATE TABLE breakdowns (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       fleet_no TEXT NOT NULL,
       supervisor_id TEXT,
       supervisor_email TEXT,
       status TEXT DEFAULT 'active',
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

### 6. Testing Authentication

1. Start the frontend: `npm run dev`
2. Navigate to http://localhost:3002
3. Use the quick login buttons (in development mode) or enter credentials manually
4. Verify you can sign in successfully

### 7. Troubleshooting

If authentication fails:

1. **Check Supabase Connection**: Open the test page and verify "Connected to Supabase successfully"
2. **Verify User Exists**: Use Supabase dashboard to check if the user exists in Authentication > Users
3. **Check Browser Console**: Look for specific error messages
4. **Clear Browser Data**: Clear localStorage and cookies, then try again

### 8. Security Notes

- Never commit real passwords to the repository
- Use environment variables for sensitive configuration
- Enable Row Level Security (RLS) on all tables in production
- Use secure passwords (min 8 characters, mixed case, numbers, symbols)

### 9. Quick Commands

```bash
# Start frontend
cd frontend
npm run dev

# Open test page
open test-supabase-auth.html

# Check logs
# Browser: Open Developer Console (F12)
# Look for authentication-related messages
```

## Contact

For issues with authentication setup, ensure:
1. Supabase project is active
2. Authentication is enabled in Supabase dashboard
3. Email provider is configured (if using email confirmation)