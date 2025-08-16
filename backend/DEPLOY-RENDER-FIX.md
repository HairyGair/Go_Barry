# 🚀 Deploy/Fix Go BARRY Backend on Render

## Current Issue
Your backend at `https://go-barry.onrender.com` is returning 503 errors.

## Quick Fix Steps

### 1. Check Render Dashboard
Go to: https://dashboard.render.com

Look for your **go-barry** service. Check its status:
- ✅ **Running** → Skip to step 4
- ⚠️ **Suspended** → Check billing/payment
- ❌ **Failed** → Check logs and redeploy
- 🚫 **Not Found** → Service was deleted, continue to step 2

### 2. If Service Was Deleted - Create New Service

#### Option A: Connect via GitHub (Recommended)
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your backend repository
4. Use these settings:
   - **Name:** `go-barry`
   - **Region:** Oregon (US West)
   - **Branch:** main (or master)
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Starter ($7/month)

#### Option B: Deploy via Git
```bash
cd /Users/anthony/Go BARRY App/backend

# Add Render as a remote
git remote add render https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to Render
git push render main
```

### 3. Set Environment Variables
In Render Dashboard → Your Service → Environment:

Add these variables:
```
NODE_ENV = production
PORT = 3001
SUPABASE_URL = https://haountnghecfrsoniubq.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3VudG5naGVjZnJzb25pdWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NzgxNDksImV4cCI6MjA2MzI1NDE0OX0.xtjxeGkxG3cx67IvpI4XxEpWewLG9Bh6bfyQenfTILs
SUPABASE_SERVICE_KEY = [Add your service key from .env file]
WHAT3WORDS_API_KEY = UA0764K8
GOOGLE_ROADS_API_KEY = AIzaSyBhBN_kVOnIRTKXYhzrDwpr8kvb0Uy0IY8
```

### 4. Verify Deployment

After deployment (takes 3-5 minutes), test these endpoints:

1. **Health Check:**
   ```
   https://go-barry.onrender.com/api/health-extended
   ```
   Should return JSON with server status

2. **Breakdowns API:**
   ```
   https://go-barry.onrender.com/api/breakdowns/live
   ```
   Should return breakdown data

### 5. If Still Having Issues

Check the Render logs:
1. Go to your service in Render
2. Click on "Logs" tab
3. Look for error messages

Common issues:
- **"Cannot find module"** → Build failed, check package.json
- **"Port already in use"** → Change PORT env variable
- **"Database connection failed"** → Check Supabase credentials
- **Memory issues** → Service may need upgrade

## Alternative: Use Render Blueprint

I've created a `render.yaml` file in your backend folder. You can:

1. Push this file to your GitHub repo
2. In Render: New → Blueprint
3. Connect your repo
4. Render will auto-configure everything

## Testing After Deployment

Once deployed, test your dashboard:
1. Open `/tests/test-dashboard-connection.html`
2. Click "Test Backend Connection"
3. Should show "✅ Backend is ONLINE"

## Need to Change Backend URL?

If you deploy to a different URL, update these files:
- `/dashboard/breakdown-dashboard-enhanced.html` - Line 423: `const BACKEND_URL = 'https://YOUR-NEW-URL.onrender.com';`
- `/tests/test-dashboard-connection.html` - Line 113: `const BACKEND_URL = 'https://YOUR-NEW-URL.onrender.com';`

## Support

If deployment fails, check:
1. Render service logs
2. Supabase connection (test credentials)
3. Memory limits (may need paid plan upgrade)
