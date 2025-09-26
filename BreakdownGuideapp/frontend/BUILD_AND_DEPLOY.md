# Build and Deploy Guide for Production

## Building for Production with Proper Authentication

### 1. Build with Production Environment Variables

```bash
# Make sure you're in the frontend directory
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/frontend

# Build with production environment variables
npm run build
```

The build process will automatically use `.env.production` file.

### 2. Verify Build Has Correct Environment Variables

After building, check that the environment variables are embedded:

```bash
# Search for Supabase URL in the built files
grep -r "oieliubbvvdzhzvikzal" dist/
```

You should see the Supabase URL in the JavaScript files.

### 3. Upload to cPanel

1. **Upload the entire `dist` folder contents** to your cPanel public_html directory
2. **Important**: Make sure to upload all files including:
   - `index.html`
   - All files in `assets/` folder
   - Any icon files in `icons/` folder

### 4. Test Authentication

Once deployed, visit: https://breakdowns.gobarry.co.uk

You should see:
1. **Login screen** with email and password fields
2. **Debug info box** in the top-right corner showing:
   - ✅ Connection Test: Connected successfully
   - ✅ Supervisors Table: Found X supervisors
   - ✅ Auth System: Auth system working

### 5. Creating Supervisor Accounts

You need to create supervisor accounts in your Supabase database:

1. Go to https://oieliubbvvdzhzvikzal.supabase.co
2. Sign in with your Supabase account
3. Go to Authentication → Users
4. Click "Invite user" or "Create new user"
5. Enter email and password for the supervisor
6. After creating the user, go to Table Editor → supervisors table
7. Add a row with:
   - `id`: The user's UUID from the Auth section
   - `name`: Supervisor's full name
   - `email`: Same email used in Auth
   - `depot`: Their depot (e.g., "Washington")
   - `role`: "supervisor" or "admin"

### 6. Test Login Credentials

Once you've created a supervisor account, test login with:
- **Email**: The email you created in Supabase Auth
- **Password**: The password you set in Supabase Auth

### Troubleshooting

#### If Login Fails:

1. **Check Debug Info Box** - It shows connection status
2. **Check Browser Console** (F12) for errors
3. **Verify Supabase Settings**:
   - Go to Supabase Dashboard → Settings → API
   - Make sure "Enable Row Level Security" is OFF for testing
   - Or create proper RLS policies

#### If Environment Variables Aren't Working:

Try building with explicit environment variables:

```bash
# Clean build directory
rm -rf dist

# Build with explicit mode
NODE_ENV=production npm run build

# Or manually set variables before build
export VITE_SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
export VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZWxpdWJidnZkemh6dmlremFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTA5OTUsImV4cCI6MjA3MTEyNjk5NX0.L0qUXBFOnzxoXt-ChhMAW8zqgprUXFdvqR2dxJ1GTU8
npm run build
```

#### Quick Fix - Test User

For immediate testing, create this user in Supabase:
- **Email**: test@gonortheast.co.uk
- **Password**: TestPassword123!
- **In supervisors table**: Add row with this email, name "Test Supervisor", depot "Washington", role "supervisor"

## Security Notes

⚠️ **Important**: The debug info box should be removed for production. To remove it:

Edit `/src/breakdown-guide/components/SupervisorLogin.jsx` and remove or comment out:
```jsx
<SupabaseDebug />
```

---

**Last Updated**: September 26, 2025
