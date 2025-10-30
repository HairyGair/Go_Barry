# Production URL Configuration - README

**Created:** October 27, 2025
**Status:** Complete and Ready for Deployment

---

## 📚 Documentation Overview

This directory contains **4 comprehensive documents** for cPanel deployment URL configuration:

### 1. **CPANEL_PRODUCTION_URLS.md** (PRIMARY GUIDE)
   - **Purpose:** Complete deployment guide with all technical details
   - **Length:** ~1000 lines
   - **Audience:** Developers, DevOps
   - **Contains:**
     - Full environment variable templates
     - DNS configuration steps
     - SSL certificate setup
     - CORS configuration
     - WebSocket setup
     - Apache virtual host configuration
     - Deployment verification checklist

### 2. **PRODUCTION_URL_SUMMARY.md** (QUICK START)
   - **Purpose:** Quick reference for common tasks
   - **Length:** ~200 lines
   - **Audience:** Anyone needing quick answers
   - **Contains:**
     - Production URLs (confirmed)
     - 5-minute deployment checklist
     - Common testing commands
     - Quick troubleshooting

### 3. **PRODUCTION_ARCHITECTURE_DIAGRAM.md** (VISUAL GUIDE)
   - **Purpose:** Understand system architecture visually
   - **Length:** ~500 lines
   - **Audience:** System architects, new team members
   - **Contains:**
     - Complete system architecture diagram
     - Request flow diagrams
     - File structure on server
     - Port configuration
     - Security layers
     - Data flow summary

### 4. **URL_CONFIGURATION_DECISION.md** (DECISION GUIDE)
   - **Purpose:** Resolve URL pattern inconsistencies
   - **Length:** ~400 lines
   - **Audience:** Technical lead, deployment manager
   - **Contains:**
     - Comparison of two URL patterns found in code
     - Recommendation: Path-based routing
     - Inconsistencies to fix (3 files)
     - Quick fix script
     - Verification commands

---

## 🎯 Quick Start: Which Document Do I Need?

### "I need to deploy NOW"
→ **Read:** [PRODUCTION_URL_SUMMARY.md](./PRODUCTION_URL_SUMMARY.md)
→ **Time:** 5 minutes

### "I want to understand the full system"
→ **Read:** [CPANEL_PRODUCTION_URLS.md](./CPANEL_PRODUCTION_URLS.md)
→ **Time:** 30 minutes

### "I want to see how it all connects"
→ **Read:** [PRODUCTION_ARCHITECTURE_DIAGRAM.md](./PRODUCTION_ARCHITECTURE_DIAGRAM.md)
→ **Time:** 15 minutes

### "I found inconsistent URLs in the code"
→ **Read:** [URL_CONFIGURATION_DECISION.md](./URL_CONFIGURATION_DECISION.md)
→ **Time:** 10 minutes + fixes

---

## ✅ Confirmed Production URLs

After analyzing the entire codebase, these are the **official production URLs**:

```
Main Application:  https://breakdowns.gobarry.co.uk
API Endpoints:     https://breakdowns.gobarry.co.uk/api
WebSocket:         wss://breakdowns.gobarry.co.uk/ws
Health Check:      https://breakdowns.gobarry.co.uk/api/health
```

**Architecture Pattern:** Path-Based Routing (single domain)
**Reasoning:** Simpler for cPanel, 90% of code already uses this pattern

---

## ⚠️ Action Required Before Deployment

### 3 Files Need Updating (10 minutes)

1. **frontend/src/services/api-client.js** (line 7)
   ```javascript
   // Change from:
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';
   
   // To:
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://breakdowns.gobarry.co.uk';
   ```

2. **frontend/.env.example** (line 8)
   ```bash
   # Change from:
   VITE_API_URL=https://api.breakdowns.gobarry.co.uk
   
   # To:
   VITE_API_URL=https://breakdowns.gobarry.co.uk
   ```

3. **Documentation files** (optional)
   - Update any references to `api.breakdowns.gobarry.co.uk`
   - Replace with `breakdowns.gobarry.co.uk/api`

**Quick Fix:** Run the script in [URL_CONFIGURATION_DECISION.md](./URL_CONFIGURATION_DECISION.md#quick-fix-script)

---

## 🚀 Deployment Sequence

### Step 1: Fix Inconsistencies (10 min)
```bash
# See URL_CONFIGURATION_DECISION.md for fix script
./fix-url-inconsistencies.sh
```

### Step 2: Configure DNS (5 min)
```bash
# In cPanel DNS Zone Editor:
Type: A
Name: breakdowns
Points to: <your_server_ip>
```

### Step 3: Install SSL (2 min)
```bash
# In cPanel SSL/TLS Status:
- Select: breakdowns.gobarry.co.uk
- Run AutoSSL
```

### Step 4: Deploy Backend (10 min)
```bash
# Upload backend/ folder to server
# Configure Node.js app in cPanel
# Set environment variables
# Start application
```

### Step 5: Deploy Frontend (10 min)
```bash
cd frontend
npm run build:cpanel
# Upload dist/ to public_html/breakdowns/
```

### Step 6: Test (5 min)
```bash
curl https://breakdowns.gobarry.co.uk/api/health
# Expected: {"status":"healthy"}
```

**Total Time:** ~40 minutes

---

## 📋 Environment Variables (Quick Reference)

### Backend (.env)
```bash
NODE_ENV=production
PORT=3001
API_BASE_URL=https://breakdowns.gobarry.co.uk/api
APP_URL=https://breakdowns.gobarry.co.uk
ALLOWED_ORIGINS=https://breakdowns.gobarry.co.uk,https://gobarry.co.uk
DB_HOST=localhost
DB_NAME=gobarryco_breakdowns
```

### Frontend (.env)
```bash
VITE_API_URL=https://breakdowns.gobarry.co.uk
VITE_API_BASE_URL=https://breakdowns.gobarry.co.uk/api
VITE_WS_URL=wss://breakdowns.gobarry.co.uk/ws
VITE_APP_URL=https://breakdowns.gobarry.co.uk
VITE_ENABLE_AUTH=true
```

---

## 🔍 Verification Checklist

After deployment:

- [ ] Frontend loads: `https://breakdowns.gobarry.co.uk`
- [ ] API responds: `https://breakdowns.gobarry.co.uk/api/health`
- [ ] Login works (test with supervisor credentials)
- [ ] WebSocket connects (check browser console)
- [ ] SSL certificate valid (green padlock)
- [ ] No CORS errors in browser console
- [ ] Dashboard loads after login
- [ ] Real-time updates work (WebSocket messages)

---

## 📞 Support

### Issues During Deployment?

1. **Check logs:**
   - Backend: `~/backend/logs/` or `pm2 logs`
   - Apache: cPanel → Errors

2. **Common fixes:**
   - CORS error → Check `ALLOWED_ORIGINS`
   - API 502 → Backend not running
   - WebSocket fails → Check Apache ProxyPass
   - SSL error → Reinstall certificate

3. **Review documentation:**
   - [CPANEL_PRODUCTION_URLS.md](./CPANEL_PRODUCTION_URLS.md) - Full troubleshooting section
   - [URL_CONFIGURATION_DECISION.md](./URL_CONFIGURATION_DECISION.md) - Verification commands

---

## 📊 Document Status

| Document | Status | Last Updated | Ready to Use |
|----------|--------|--------------|--------------|
| CPANEL_PRODUCTION_URLS.md | ✅ Complete | Oct 27, 2025 | Yes |
| PRODUCTION_URL_SUMMARY.md | ✅ Complete | Oct 27, 2025 | Yes |
| PRODUCTION_ARCHITECTURE_DIAGRAM.md | ✅ Complete | Oct 27, 2025 | Yes |
| URL_CONFIGURATION_DECISION.md | ✅ Complete | Oct 27, 2025 | Yes |

---

## 🎓 Additional Resources

### Related Documentation
- `CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment
- `DEPLOYMENT.md` - General deployment guide
- `CPANEL_INTEGRATION_GUIDE.md` - WebSocket integration

### External Links
- cPanel Documentation: https://docs.cpanel.net/
- Let's Encrypt: https://letsencrypt.org/
- Node.js on cPanel: https://docs.cpanel.net/cpanel/software/application-manager/

---

**Created by:** Claude (Anthropic AI)
**For:** Go BARRY Breakdown Management System
**Company:** Go North East
**Deployment Target:** cPanel Shared Hosting
**Production Domain:** breakdowns.gobarry.co.uk

---

## 🏁 Ready to Deploy?

1. Read [URL_CONFIGURATION_DECISION.md](./URL_CONFIGURATION_DECISION.md) → Fix 3 inconsistencies
2. Read [PRODUCTION_URL_SUMMARY.md](./PRODUCTION_URL_SUMMARY.md) → Quick deployment steps
3. Refer to [CPANEL_PRODUCTION_URLS.md](./CPANEL_PRODUCTION_URLS.md) → Complete reference
4. Deploy and verify ✅

**Good luck with your deployment! 🚀**
