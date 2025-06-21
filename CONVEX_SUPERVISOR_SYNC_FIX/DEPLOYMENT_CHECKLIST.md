# ✅ DEPLOYMENT CHECKLIST

## Pre-deployment Checks:
- [ ] Currently in `CONVEX_SUPERVISOR_SYNC_FIX` folder
- [ ] Backend is on Git and can push to Render
- [ ] Have access to cPanel for frontend deployment
- [ ] Convex CLI is installed (`npm install -g convex`)

## Step 1: Backend CORS Fix (5 min)
- [ ] Navigate to backend: `cd ../backend`
- [ ] Git add: `git add .`
- [ ] Git commit: `git commit -m "Fix: Add cache-control to CORS headers"`
- [ ] Git push: `git push`
- [ ] Wait for Render deployment (~2-3 min)
- [ ] Verify at: https://go-barry.onrender.com/api/health

## Step 2: Update Frontend Files (3 min)
- [ ] Copy DisplayScreen: `cp CONVEX_SUPERVISOR_SYNC_FIX/DisplayScreen_FIXED.jsx Go_BARRY/components/DisplayScreen.jsx`
- [ ] Add logSupervisorAction to sync.ts (copy from ADD_TO_sync.ts)
- [ ] Copy convexIntegration.js: `cp CONVEX_SUPERVISOR_SYNC_FIX/convexIntegration.js Go_BARRY/services/`

## Step 3: Deploy Convex Functions (2 min)
- [ ] Navigate to frontend: `cd Go_BARRY`
- [ ] Deploy Convex: `npx convex deploy`
- [ ] Verify at: https://dashboard.convex.dev/d/standing-octopus-908

## Step 4: Update Backend Convex Service (2 min)
- [ ] Copy service: `cp ../CONVEX_SUPERVISOR_SYNC_FIX/convexSync_FIXED.js ../backend/services/convexSync.js`

## Step 5: Deploy Backend Again (5 min)
- [ ] Navigate to backend: `cd ../backend`
- [ ] Git add: `git add .`
- [ ] Git commit: `git commit -m "Add: Convex supervisor action logging"`
- [ ] Git push: `git push`
- [ ] Wait for Render deployment

## Step 6: Add CONVEX_URL to Render (2 min)
- [ ] Go to Render Dashboard
- [ ] Add environment variable: `CONVEX_URL=https://standing-octopus-908.convex.cloud`
- [ ] Manual deploy or restart service

## Step 7: Build & Deploy Frontend (10 min)
- [ ] Navigate to frontend: `cd ../Go_BARRY`
- [ ] Build: `npm run build:web`
- [ ] Upload `web-build` folder contents to cPanel public_html

## Post-deployment Testing:
- [ ] Clear browser cache and cookies
- [ ] Login as supervisor on dashboard
- [ ] Check Display Screen shows supervisor
- [ ] Dismiss an alert
- [ ] Check activity appears on Display Screen
- [ ] Check Convex Dashboard for data

## Success Indicators:
✅ No CORS errors in console
✅ Display shows "CONVEX SYNC" (green)
✅ Active supervisors list populated
✅ Activity feed shows recent actions
✅ Actions appear instantly (no delay)

## If Issues:
- Check browser console for errors
- Check Render logs for backend errors
- Verify all files were copied correctly
- Ensure CONVEX_URL is set on Render
- Try hard refresh (Ctrl+Shift+R)

## Total Time: ~30 minutes
