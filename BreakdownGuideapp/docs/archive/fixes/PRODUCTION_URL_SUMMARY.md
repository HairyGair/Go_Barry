# Production URL Configuration - Quick Reference

**Last Updated:** October 27, 2025
**Status:** ✅ Ready for Deployment

---

## ⚡ Quick Facts

### Production URLs (CONFIRMED)
```
Main Application:  https://breakdowns.gobarry.co.uk
API Endpoints:     https://breakdowns.gobarry.co.uk/api
WebSocket:         wss://breakdowns.gobarry.co.uk/ws
```

### Architecture Pattern
**Path-Based Routing** (Single Domain)
- Simpler for cPanel hosting
- Single SSL certificate required
- Apache ProxyPass for `/api` and `/ws` paths

---

## 📋 Deployment Checklist

### 1. DNS Setup (5 minutes)
```bash
# Add A record in cPanel DNS Zone Editor:
Type: A
Name: breakdowns
Points to: <your_server_ip>
TTL: 3600
```

### 2. SSL Certificate (2 minutes)
```bash
# In cPanel:
1. Navigate to SSL/TLS Status
2. Select "breakdowns.gobarry.co.uk"
3. Click "Run AutoSSL"
4. Wait for completion
```

### 3. Environment Variables

**Backend (.env):**
```bash
NODE_ENV=production
PORT=3001
API_BASE_URL=https://breakdowns.gobarry.co.uk/api
APP_URL=https://breakdowns.gobarry.co.uk
ALLOWED_ORIGINS=https://breakdowns.gobarry.co.uk,https://gobarry.co.uk
```

**Frontend (.env):**
```bash
VITE_API_URL=https://breakdowns.gobarry.co.uk
VITE_API_BASE_URL=https://breakdowns.gobarry.co.uk/api
VITE_WS_URL=wss://breakdowns.gobarry.co.uk/ws
VITE_APP_URL=https://breakdowns.gobarry.co.uk
```

### 4. Build & Deploy

**Frontend:**
```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/frontend
npm run build:cpanel
# Upload dist/ folder to: /home/username/public_html/breakdowns/
```

**Backend:**
```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/backend
# Upload entire backend folder to: /home/username/backend/
# Setup Node.js app in cPanel Application Manager
```

---

## 🧪 Testing Commands

### Test Frontend
```bash
curl -I https://breakdowns.gobarry.co.uk
# Expected: HTTP/2 200
```

### Test Backend API
```bash
curl https://breakdowns.gobarry.co.uk/api/health
# Expected: {"status":"healthy",...}
```

### Test Authentication
```bash
curl https://breakdowns.gobarry.co.uk/api/auth/supervisors
# Expected: JSON array of supervisors
```

### Test WebSocket (Browser Console)
```javascript
const ws = new WebSocket('wss://breakdowns.gobarry.co.uk/ws');
ws.onopen = () => console.log('✅ Connected');
```

---

## 🔐 Security Configuration

### Required Headers (.htaccess)
```apache
Header set X-Frame-Options "SAMEORIGIN"
Header set X-Content-Type-Options "nosniff"
Header set X-XSS-Protection "1; mode=block"
```

### CORS Configuration
```javascript
ALLOWED_ORIGINS=https://breakdowns.gobarry.co.uk,https://gobarry.co.uk
```

### SSL Requirements
- ✅ HTTPS enforced (HTTP → HTTPS redirect)
- ✅ Valid SSL certificate from Let's Encrypt or AutoSSL
- ✅ WebSocket uses WSS (secure WebSocket)

---

## 📊 System Requirements

### Frontend
- **Type:** Static React build (Vite)
- **Size:** ~2-5 MB (minified)
- **Requirements:** Apache with mod_rewrite

### Backend
- **Runtime:** Node.js 18+
- **Memory:** 512 MB minimum
- **Port:** 3001 (internal)
- **Database:** MySQL 8.0+

---

## 🚨 Common Issues & Fixes

### Issue: CORS Errors
**Fix:** Add frontend domain to `ALLOWED_ORIGINS` in backend `.env`

### Issue: API 502 Error
**Fix:** Backend not running. Check Node.js app in cPanel or restart with PM2

### Issue: WebSocket Won't Connect
**Fix:** Verify Apache ProxyPass rules in `.htaccess` for `/ws` path

### Issue: React Router 404s
**Fix:** Ensure `.htaccess` has RewriteRule to serve `index.html` for all routes

---

## 📚 Full Documentation

For complete setup instructions, see:
- **[CPANEL_PRODUCTION_URLS.md](./CPANEL_PRODUCTION_URLS.md)** - Complete deployment guide
- **[CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md](./CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - General deployment overview

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Frontend loads at `https://breakdowns.gobarry.co.uk`
- [ ] Login page accessible
- [ ] API health endpoint responds: `/api/health`
- [ ] Authentication works (test login)
- [ ] Dashboard loads after login
- [ ] WebSocket connects (check browser console)
- [ ] SSL certificate shows as valid (green padlock)
- [ ] No CORS errors in browser console
- [ ] Mobile responsive (test on phone)

---

**Status:** Production Ready ✅
**Next Steps:** Follow [CPANEL_PRODUCTION_URLS.md](./CPANEL_PRODUCTION_URLS.md) for deployment
