# Operations Centre Deployment Troubleshooting
## Issue: Operations page doesn't open from home page after deployment

### 🔍 Problem Analysis

The Operations Centre route isn't working in production, even though it works locally. This is a common issue with Expo Router in production builds.

### 🛠️ Quick Fixes Applied

1. **Created fallback route** (`/app/operations-centre.jsx`)
   - Direct export to ensure route registration

2. **Updated redirect logic** (`/app/operations.jsx`)
   - Added error handling and loading state
   - Changed from `router.replace()` to `router.push()`

3. **Created deployment fix script**
   - Verifies all required files exist
   - Creates missing utility files
   - Updates build configuration

### 📋 Step-by-Step Fix

1. **Run the fix script:**
   ```bash
   cd Go_BARRY
   node scripts/fix-operations-deployment.js
   ```

2. **Clear build cache:**
   ```bash
   npm run reset
   rm -rf dist/
   rm -rf .expo/
   ```

3. **Rebuild for production:**
   ```bash
   npm run build:web:production
   ```

4. **Test locally before deploying:**
   ```bash
   npm run serve
   ```
   Visit http://localhost:3000 and test the Operations link

5. **Deploy to Render:**
   - Commit all changes
   - Push to main branch
   - Render will auto-deploy

### 🔧 Manual Verification

Check these files exist:
- ✅ `/app/operations.jsx` - Redirect handler
- ✅ `/app/operations-centre.jsx` - Direct route export
- ✅ `/app/operations-centre/index.jsx` - Main component
- ✅ `/app/operations-centre/_layout.jsx` - Layout wrapper

### 🚨 Common Issues & Solutions

**Issue 1: Route not found in production**
- Solution: The new `operations-centre.jsx` file at app root ensures the route is registered

**Issue 2: Authentication redirect loop**
- Solution: Updated logic to show loading state instead of immediate redirect

**Issue 3: Missing dependencies**
- Solution: Fix script creates any missing utility files

**Issue 4: Build optimization removing routes**
- Solution: Added explicit imports and exports

### 📝 Testing Checklist

After deployment, test:
- [ ] Home page loads
- [ ] Operations card is visible
- [ ] Login works
- [ ] Clicking Operations shows loading state
- [ ] Operations Centre loads after login
- [ ] All 6 operation cards are visible
- [ ] Navigation back to home works

### 🆘 If Still Not Working

1. **Check browser console for errors**
   - Open DevTools (F12)
   - Look for route-related errors

2. **Verify route in production build:**
   ```bash
   # Check if operations-centre files are in build
   ls -la dist/_expo/static/js/web/
   ```

3. **Try direct URL access:**
   - Navigate to: `https://gobarry.co.uk/operations-centre`
   - If this works but button doesn't, it's a navigation issue

4. **Emergency workaround:**
   Update HomePageWithLogin.jsx to use direct navigation:
   ```javascript
   window.location.href = '/operations-centre';
   ```

### 🎯 Root Cause

The issue is likely due to:
1. Expo Router not properly registering nested routes in production
2. Build optimization removing "unused" routes
3. Different behavior between development and production routing

The fixes applied should resolve these issues by:
- Creating explicit route exports
- Adding fallback navigation
- Ensuring all files are included in build

---

**Status:** Fixes applied, awaiting deployment test  
**Last Updated:** June 30, 2025
