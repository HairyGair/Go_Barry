# CORS Fix for Breakdown Dashboard
**Date**: January 2025
**Issue**: Dashboard at https://breakdowns.gobarry.co.uk unable to access API at https://go-barry.onrender.com

## 🚨 Problem Identified

The breakdown dashboard at `https://breakdowns.gobarry.co.uk/dashboard/` was getting CORS errors when trying to fetch data from the API:

```
Access to fetch at 'https://go-barry.onrender.com/api/breakdowns/live' 
from origin 'https://breakdowns.gobarry.co.uk' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ Solution Applied

### 1. Backend CORS Configuration Updated

**File**: `/backend/render-startup.js`

Added `https://breakdowns.gobarry.co.uk` to the allowed origins in TWO places:

#### First CORS Configuration (cors library):
```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://www.gobarry.co.uk',
      'https://gobarry.co.uk',
      'https://breakdowns.gobarry.co.uk',  // ✅ ADDED
      'http://www.gobarry.co.uk',
      'http://gobarry.co.uk',
      'http://breakdowns.gobarry.co.uk',   // ✅ ADDED (for dev)
      // ... other origins
    ];
```

#### Second CORS Configuration (manual middleware):
```javascript
app.use((req, res, next) => {
  const allowedOrigins = process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',') : 
    [
      'https://gobarry.co.uk', 
      'https://www.gobarry.co.uk', 
      'https://breakdowns.gobarry.co.uk',  // ✅ ADDED
      'https://go-barry.onrender.com',
      // ... other origins
    ];
```

## 🔄 Deployment Steps

### 1. Deploy Backend Changes

```bash
# From the backend directory
cd /Users/anthony/Go\ BARRY\ App/backend

# Commit the CORS fix
git add render-startup.js
git commit -m "Add breakdowns.gobarry.co.uk to CORS allowed origins"
git push

# The backend will auto-deploy on Render.com
```

### 2. Verify the Fix

Once deployed (takes ~5 minutes on Render), test the dashboard:

1. Open https://breakdowns.gobarry.co.uk/dashboard/
2. Open browser DevTools (F12)
3. Check Network tab - API calls should succeed
4. Check Console - no CORS errors should appear

## 📊 API Endpoints Available

The dashboard can now access these endpoints:

- `GET /api/breakdowns/live` - Get active breakdowns
- `GET /api/breakdowns/today` - Today's breakdowns  
- `POST /api/breakdowns/start` - Start new breakdown
- `POST /api/breakdowns/step` - Log wizard step
- `POST /api/breakdowns/diagnose` - Mark diagnosed
- `PUT /api/breakdowns/:id/resolve` - Resolve breakdown
- `GET /api/breakdowns/fleet/:number/history` - 7-day history
- `DELETE /api/breakdowns/:id` - Admin delete

## 🔍 Testing Checklist

- [ ] Backend deployed with CORS fix
- [ ] Dashboard loads without CORS errors
- [ ] Live breakdowns display correctly
- [ ] Filters work (My breakdowns, Critical only, etc.)
- [ ] Resolution process works
- [ ] Auto-refresh every 5 seconds works

## 🚀 Next Steps

1. **Monitor Performance**: Check if dashboard loads quickly
2. **Add Error Handling**: Graceful fallback if API is down
3. **Add Authentication**: Secure the dashboard with supervisor login
4. **Add WebSocket**: Real-time updates instead of polling

## 📝 Notes

- The breakdown subdomain serves static files from cPanel
- The API backend runs on Render.com at go-barry.onrender.com
- Both need to be properly configured for CORS to work
- Consider adding environment variable for dynamic CORS origins

## 🔒 Security Considerations

- Only allow specific origins (no wildcard *)
- Keep credentials flag set to true for auth cookies
- Monitor for unauthorized access attempts
- Consider rate limiting on sensitive endpoints

---

**Status**: ✅ CORS configuration updated, ready for deployment
**Priority**: HIGH - Dashboard functionality blocked until deployed
