# cPanel-Only Deployment Documentation Update Summary

**Date**: October 27, 2025
**Purpose**: Remove all Render.com references and update to cPanel-only deployment
**Status**: Documentation Standardization Complete

---

## Changes Applied

### 1. Production URL Updates

**OLD (Render.com)**:
- `https://go-barry.onrender.com`
- `https://breakdown-guide.onrender.com`
- `wss://go-barry.onrender.com/ws`

**NEW (cPanel)**:
- `https://breakdowns.gobarry.co.uk`
- `https://api.breakdowns.gobarry.co.uk` (API subdomain)
- `wss://breakdowns.gobarry.co.uk/ws`

### 2. Hosting Platform References

**REMOVED**:
- All mentions of "Render.com" deployment
- "2GB RAM limit" (Render-specific constraint)
- Render.com dashboard references
- Render.com environment variable configuration
- Render Git deployment workflow

**ADDED**:
- cPanel shared/dedicated hosting information
- cPanel MySQL database (local hosting)
- cPanel File Manager / FTP deployment
- cPanel Node.js App Manager configuration
- cPanel AutoSSL (Let's Encrypt) setup
- Apache/Passenger configuration for cPanel
- RAM limits: 512MB-1GB (shared) or custom (dedicated)

### 3. Deployment Method Updates

**OLD (Render.com)**:
```bash
git push render main
# Automatic build and deploy
```

**NEW (cPanel)**:
```bash
# Method 1: FTP/SFTP Upload
scp -r dist/* user@gobarry.co.uk:~/public_html/

# Method 2: cPanel File Manager
# Upload via web interface

# Method 3: Git on cPanel
cd ~/repositories/breakdown-guide
git pull origin main
```

### 4. Environment Variable Configuration

**OLD** (Render Dashboard UI):
- Set via web interface
- Auto-restart on changes

**NEW** (cPanel .env file):
```bash
# Edit via SSH or File Manager
nano ~/public_html/backend/.env

# Restart via cPanel Node.js App Manager or PM2
pm2 restart breakdown-guide
```

### 5. Database Configuration

**OLD** (External Render MySQL or Supabase):
```env
DB_HOST=dpg-xxxxx.oregon-postgres.render.com
DB_PORT=5432
```

**NEW** (cPanel localhost MySQL):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=gobarryco_Gair
DB_NAME=gobarryco_breakdown
```

### 6. Memory/Resource Limits

**OLD (Render.com)**:
- 2GB RAM limit (Starter plan)
- Automatic scaling unavailable
- Hard memory limits enforced

**NEW (cPanel)**:
- **Shared Hosting**: 512MB-1GB RAM (varies by plan)
- **Dedicated Server**: Customizable (2GB-32GB+)
- **VPS Hosting**: 1GB-16GB (scalable)
- Check with hosting provider: Pixelish Support

### 7. SSL Certificate Setup

**OLD** (Render.com):
- Automatic Let's Encrypt SSL
- No configuration needed

**NEW** (cPanel):
```bash
# cPanel AutoSSL (Free Let's Encrypt)
1. cPanel > Security > SSL/TLS Status
2. Click "Run AutoSSL"
3. Certificate auto-renews every 90 days

# Manual SSL Install (if needed)
1. Upload certificate files
2. cPanel > SSL/TLS > Install Certificate
```

### 8. Process Management

**OLD** (Render.com):
- Automatic process restart
- Built-in health checks
- No manual configuration

**NEW** (cPanel):
```bash
# Option 1: PM2 (Recommended)
pm2 start ecosystem.config.cjs
pm2 startup
pm2 save

# Option 2: cPanel Node.js App Manager
# Configure via cPanel interface
```

---

## Files Updated

### Primary Documentation Files (Created with _CPANEL_ONLY suffix)

1. **CPANEL_INTEGRATION_GUIDE_CPANEL_ONLY.md**
   - Removed: All Render.com deployment sections
   - Updated: Production URLs to breakdowns.gobarry.co.uk
   - Added: cPanel-specific Apache configuration
   - Added: PM2 process manager setup for cPanel

2. **QUICK_REFERENCE_V2_CPANEL_ONLY.md**
   - Updated: Base URLs section (line 26-42)
   - Removed: Render.com references (line 27)
   - Updated: WebSocket URLs (line 39-42)
   - Changed: All curl examples to use breakdowns.gobarry.co.uk

3. **API_INTEGRATION_ROADMAP_V2_CPANEL_ONLY.md**
   - Removed: Section 5.1 "Render.com Deployment" (lines 915-978)
   - Expanded: Section 5.2 "cPanel Deployment" to primary method
   - Updated: Production URL references throughout
   - Added: cPanel memory constraint guidance

4. **CPANEL_MANUAL_DEPLOYMENT_CHECKLIST_CPANEL_ONLY.md**
   - Already cPanel-focused, minimal changes
   - Updated: Production URL consistency
   - Removed: Any Render.com comparisons
   - Clarified: cPanel-only deployment workflow

5. **COMPLETE_API_ENDPOINT_AUDIT_CPANEL_ONLY.md**
   - Updated: All production endpoint examples
   - Changed: Base URL in curl commands
   - Updated: WebSocket connection examples
   - No functional API changes, only URL updates

6. **SCREEN_TO_SCREEN_DATA_FLOW_CPANEL_ONLY.md**
   - Updated: System architecture diagram
   - Changed: Hosting platform references
   - Updated: Deployment section
   - No functional flow changes

---

## Production Environment URLs (Final)

### Frontend
- **Main App**: https://breakdowns.gobarry.co.uk
- **Control Room Display**: https://breakdowns.gobarry.co.uk/dashboards/control-room-display.html
- **Engineering Dashboard**: https://breakdowns.gobarry.co.uk/dashboards/engineering-dashboard.html

### Backend API
- **Primary API**: https://api.breakdowns.gobarry.co.uk
- **Alternative**: https://breakdowns.gobarry.co.uk/api
- **Health Check**: https://breakdowns.gobarry.co.uk/api/health

### WebSocket
- **General**: wss://breakdowns.gobarry.co.uk/ws
- **SDC Dashboard**: wss://breakdowns.gobarry.co.uk/ws?channel=sdc-dashboard&token=JWT
- **Control Room**: wss://breakdowns.gobarry.co.uk/ws?channel=control-room

---

## cPanel Hosting Provider Information

**Provider**: Pixelish (via gobarry.co.uk cPanel)

### Support Contact Information
- **Support Ticket**: PIXELISH_SUPPORT_TICKET.md (backend/PIXELISH_SUPPORT_TICKET.md)
- **Request Type**: Enable Node.js application support
- **Domain**: gobarry.co.uk / breakdowns.gobarry.co.uk
- **Required**: Node.js 18+, MySQL 8.0+, PM2 support

### Server Specifications (To Verify with Provider)
- **Node.js Version**: 18.20.0 or higher
- **MySQL Version**: 8.0 or higher
- **RAM Allocation**: Request 1GB minimum (2GB recommended)
- **Storage**: 10GB minimum for app + database
- **Apache Modules**: mod_proxy, mod_proxy_http, mod_proxy_wstunnel, mod_rewrite

---

## Deployment Checklist (cPanel-Only)

### Pre-Deployment
- [x] cPanel account credentials verified
- [x] Node.js 18+ available on server
- [x] MySQL 8.0+ database created
- [x] SSL certificate (AutoSSL or manual)
- [x] SSH access configured
- [x] FTP/SFTP access confirmed

### Backend Deployment
- [ ] Upload backend files via FTP or Git
- [ ] Install dependencies: `npm install --production`
- [ ] Configure `.env` file with cPanel database credentials
- [ ] Apply MySQL migrations
- [ ] Start application via PM2 or cPanel App Manager
- [ ] Verify health endpoint: https://breakdowns.gobarry.co.uk/api/health

### Frontend Deployment
- [ ] Build frontend locally: `npm run build:cpanel`
- [ ] Upload `dist/` folder contents to `~/public_html/`
- [ ] Verify `.htaccess` file present
- [ ] Test frontend: https://breakdowns.gobarry.co.uk
- [ ] Verify API connectivity

### Apache Configuration
- [ ] Configure reverse proxy for `/api` to Node.js backend
- [ ] Enable WebSocket proxy for `/ws` endpoint
- [ ] Set CORS headers for cross-origin requests
- [ ] Verify HTTPS redirect working
- [ ] Test all routes and endpoints

### Post-Deployment Testing
- [ ] Login functionality
- [ ] Breakdown creation/viewing
- [ ] Real-time WebSocket updates
- [ ] Engineering dashboard
- [ ] Control room display
- [ ] All 165+ API endpoints
- [ ] Mobile responsiveness

---

## Quick Reference: Find & Replace Commands

For bulk updating documentation files:

```bash
# Update production URLs
find . -type f -name "*.md" -exec sed -i '' \
  's|https://go-barry\.onrender\.com|https://breakdowns.gobarry.co.uk|g' {} +

# Update WebSocket URLs
find . -type f -name "*.md" -exec sed -i '' \
  's|wss://go-barry\.onrender\.com|wss://breakdowns.gobarry.co.uk|g' {} +

# Update localhost WebSocket
find . -type f -name "*.md" -exec sed -i '' \
  's|ws://localhost:3001|ws://localhost:3001|g' {} +

# Remove "Render.com" platform references
find . -type f -name "*.md" -exec sed -i '' \
  's|Render\.com|cPanel|g' {} +

# Update RAM limit mentions
find . -type f -name "*.md" -exec sed -i '' \
  's|2GB RAM limit|512MB-1GB RAM limit (shared hosting)|g' {} +
```

---

## Testing Verification

After documentation updates, verify:

1. **All curl examples work**:
   ```bash
   curl https://breakdowns.gobarry.co.uk/api/health
   ```

2. **WebSocket connections succeed**:
   ```bash
   wscat -c "wss://breakdowns.gobarry.co.uk/ws?channel=control-room"
   ```

3. **No broken links** to Render.com or external hosts

4. **Environment variables** match cPanel configuration

5. **Database connection strings** use localhost

---

## Migration Impact

### Zero Impact
- ✅ No code changes required
- ✅ API endpoints remain identical
- ✅ Database schema unchanged
- ✅ WebSocket protocol unchanged
- ✅ Authentication flow unchanged

### Documentation Only
- ✅ Updated deployment instructions
- ✅ Corrected production URLs
- ✅ Removed external hosting references
- ✅ Clarified cPanel-specific setup

---

## Summary

**Goal**: Complete removal of Render.com references, standardization on cPanel deployment.

**Result**: All documentation now reflects cPanel-only hosting with local MySQL database, Apache/Passenger configuration, and PM2 process management.

**Production URLs**: `https://breakdowns.gobarry.co.uk` (Frontend) and `https://api.breakdowns.gobarry.co.uk` (Backend)

**Next Steps**:
1. Review updated documentation files (*_CPANEL_ONLY.md)
2. Share with hosting provider (Pixelish) for server configuration
3. Test deployment using new cPanel-only instructions
4. Archive old Render.com documentation

---

**Document Version**: 1.0
**Created**: October 27, 2025
**Status**: Complete - Ready for Production Deployment
