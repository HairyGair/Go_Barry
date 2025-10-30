# Go BARRY - cPanel Deployment Documentation Index

**Last Updated**: October 27, 2025
**Deployment Platform**: cPanel (100% - No External Hosting)
**Production URL**: https://breakdowns.gobarry.co.uk

---

## Quick Links

### Updated Documentation (cPanel-Only)
All files with `_CPANEL_ONLY` suffix have been updated to remove Render.com references and use cPanel-only deployment.

1. **[CPANEL_INTEGRATION_GUIDE_FIXED_CPANEL_ONLY.md](./CPANEL_INTEGRATION_GUIDE_FIXED_CPANEL_ONLY.md)**
   - Complete cPanel integration and WebSocket architecture
   - Apache configuration with WebSocket proxy
   - PM2 process manager setup
   - Database configuration (MySQL)
   - **Lines**: 2,082

2. **[QUICK_REFERENCE_V2_CPANEL_ONLY.md](./QUICK_REFERENCE_V2_CPANEL_ONLY.md)**
   - Quick developer reference
   - All 165+ API endpoints
   - 5 WebSocket channels
   - Authentication guide
   - Common operations
   - **Lines**: 1,284

3. **[API_INTEGRATION_ROADMAP_V2_CPANEL_ONLY.md](./API_INTEGRATION_ROADMAP_V2_CPANEL_ONLY.md)**
   - Complete API implementation roadmap
   - cPanel deployment guide
   - ES6 module system setup
   - MySQL database configuration
   - WebSocket setup instructions
   - **Lines**: 1,498

4. **[CPANEL_MANUAL_DEPLOYMENT_CHECKLIST_CPANEL_ONLY.md](./CPANEL_MANUAL_DEPLOYMENT_CHECKLIST_CPANEL_ONLY.md)**
   - Step-by-step deployment checklist
   - Pre-deployment verification
   - Backend deployment steps
   - Frontend deployment steps
   - Apache configuration
   - Post-deployment testing
   - **Lines**: 3,054

5. **[COMPLETE_API_ENDPOINT_AUDIT_CPANEL_ONLY.md](./COMPLETE_API_ENDPOINT_AUDIT_CPANEL_ONLY.md)**
   - Complete audit of all 165+ API endpoints
   - Organized by category (10 categories)
   - Request/response examples
   - Authentication requirements
   - Usage documentation
   - **Lines**: 1,041

6. **[SCREEN_TO_SCREEN_DATA_FLOW_CPANEL_ONLY.md](./SCREEN_TO_SCREEN_DATA_FLOW_CPANEL_ONLY.md)**
   - Complete data flow documentation
   - Authentication flow
   - Breakdown creation flow
   - Assessment wizard flow
   - Real-time update flows
   - **Lines**: 2,184

---

## Support Documents

### Update Information
- **[CPANEL_DEPLOYMENT_UPDATE_SUMMARY.md](./CPANEL_DEPLOYMENT_UPDATE_SUMMARY.md)** - Summary of changes from Render.com to cPanel
- **[CPANEL_ONLY_VERIFICATION_REPORT.md](./CPANEL_ONLY_VERIFICATION_REPORT.md)** - Verification report with quality assurance
- **[update-to-cpanel-only.sh](./update-to-cpanel-only.sh)** - Automated update script

### Backup Location
- **Backup Directory**: `documentation_backup_20251027_200431/`
- Contains original versions of all updated files

---

## Production Configuration

### URLs
```
Frontend:  https://breakdowns.gobarry.co.uk
API:       https://breakdowns.gobarry.co.uk/api
           https://api.breakdowns.gobarry.co.uk (alternate)
WebSocket: wss://breakdowns.gobarry.co.uk/ws
Health:    https://breakdowns.gobarry.co.uk/api/health
```

### Database
```
Host:     localhost
Port:     3306
Database: gobarryco_breakdown
User:     gobarryco_Gair
```

### Hosting Platform
```
Provider: Pixelish (cPanel)
Domain:   gobarry.co.uk
Memory:   512MB-1GB (shared) or 2GB+ (dedicated)
Node.js:  18.20.0 or higher
MySQL:    8.0 or higher
```

---

## Documentation Categories

### Deployment & Setup
1. **CPANEL_INTEGRATION_GUIDE_FIXED_CPANEL_ONLY.md** - Primary integration guide
2. **CPANEL_MANUAL_DEPLOYMENT_CHECKLIST_CPANEL_ONLY.md** - Deployment checklist
3. **API_INTEGRATION_ROADMAP_V2_CPANEL_ONLY.md** - API implementation roadmap

### API Reference
1. **QUICK_REFERENCE_V2_CPANEL_ONLY.md** - Quick API reference
2. **COMPLETE_API_ENDPOINT_AUDIT_CPANEL_ONLY.md** - Complete endpoint documentation

### System Architecture
1. **SCREEN_TO_SCREEN_DATA_FLOW_CPANEL_ONLY.md** - Data flow documentation

---

## Start Here

### For New Developers
1. Read **QUICK_REFERENCE_V2_CPANEL_ONLY.md** for overview
2. Follow **CPANEL_INTEGRATION_GUIDE_FIXED_CPANEL_ONLY.md** for setup
3. Reference **COMPLETE_API_ENDPOINT_AUDIT_CPANEL_ONLY.md** for API details

### For Deployment
1. Review **CPANEL_MANUAL_DEPLOYMENT_CHECKLIST_CPANEL_ONLY.md**
2. Follow **API_INTEGRATION_ROADMAP_V2_CPANEL_ONLY.md** Phase 5 (Deployment)
3. Verify with **CPANEL_ONLY_VERIFICATION_REPORT.md**

### For API Integration
1. Start with **QUICK_REFERENCE_V2_CPANEL_ONLY.md** Section 3 (All API Endpoints)
2. Detailed info in **COMPLETE_API_ENDPOINT_AUDIT_CPANEL_ONLY.md**
3. Data flow in **SCREEN_TO_SCREEN_DATA_FLOW_CPANEL_ONLY.md**

---

## System Overview

### Technology Stack
- **Frontend**: React 18 + Vite (static build)
- **Backend**: Node.js 18+ with Express.js
- **Database**: MySQL 8.0+ (cPanel localhost)
- **Real-Time**: Native WebSocket (ws library)
- **Authentication**: JWT with bcrypt
- **Hosting**: cPanel shared or dedicated hosting

### Key Features
- 165+ REST API endpoints
- 5 WebSocket channels for real-time updates
- 13 active supervisors with badge-based auth
- 231+ bus routes tracked
- 4 primary database tables + supporting tables
- Mobile-responsive React frontend
- Control room display dashboard

---

## Quick Commands

### Health Check
```bash
curl https://breakdowns.gobarry.co.uk/api/health
```

### Test Login
```bash
curl -X POST https://breakdowns.gobarry.co.uk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"supervisor@gobarry.co.uk","password":"password"}'
```

### Test WebSocket
```bash
wscat -c "wss://breakdowns.gobarry.co.uk/ws?channel=control-room"
```

### Deploy Backend (cPanel)
```bash
# Via FTP/SFTP
scp -r backend/* user@gobarry.co.uk:~/app/backend/

# Via SSH
ssh user@gobarry.co.uk
cd ~/app/backend
git pull origin main
npm install --production
pm2 restart breakdown-guide
```

### Deploy Frontend (cPanel)
```bash
# Build locally
cd frontend
npm run build:cpanel

# Upload to cPanel
scp -r dist/* user@gobarry.co.uk:~/public_html/
```

---

## Environment Files

### Backend (.env)
```env
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_USER=gobarryco_Gair
DB_PASSWORD=<secure_password>
DB_NAME=gobarryco_breakdown
JWT_SECRET=<generated_secret>
ALLOWED_ORIGINS=https://gobarry.co.uk,https://breakdowns.gobarry.co.uk
```

### Frontend (.env.production)
```env
VITE_API_URL=https://breakdowns.gobarry.co.uk
VITE_API_BASE_URL=https://breakdowns.gobarry.co.uk/api
VITE_WS_URL=wss://breakdowns.gobarry.co.uk
VITE_APP_URL=https://breakdowns.gobarry.co.uk
```

---

## Version History

### Version 2.0 (October 27, 2025)
- Removed all Render.com references
- Standardized on cPanel-only deployment
- Updated all production URLs
- Clarified memory/resource constraints
- Expanded cPanel deployment instructions

### Version 1.0 (Previous)
- Mixed Render.com and cPanel documentation
- External hosting references

---

## Support & Contact

### Hosting Provider
- **Provider**: Pixelish
- **Domain**: gobarry.co.uk
- **Support Ticket**: See `backend/PIXELISH_SUPPORT_TICKET.md`

### Client
- **Company**: Go North East
- **System**: Breakdown Management System
- **Users**: 13 active supervisors

### Developer
- **Developer**: Anthony Gair
- **Email**: anthony@gobarry.co.uk (if configured)

---

## Additional Resources

### Related Documentation (Root Directory)
- **README.md** - Project overview
- **DEPLOYMENT.md** - General deployment guide
- **SYSTEM_STATUS.md** - Current system status
- **CLAUDE.md** - AI assistant project context

### Backend Documentation (backend/)
- **backend/README.md** - Backend-specific documentation
- **backend/PIXELISH_SUPPORT_TICKET.md** - Hosting provider support request

### Frontend Documentation (frontend/)
- **frontend/README.md** - Frontend-specific documentation

---

## File Sizes & Stats

| File | Lines | Size | Category |
|------|-------|------|----------|
| CPANEL_INTEGRATION_GUIDE_FIXED_CPANEL_ONLY.md | 2,082 | ~150KB | Setup Guide |
| CPANEL_MANUAL_DEPLOYMENT_CHECKLIST_CPANEL_ONLY.md | 3,054 | ~200KB | Deployment |
| SCREEN_TO_SCREEN_DATA_FLOW_CPANEL_ONLY.md | 2,184 | ~180KB | Architecture |
| API_INTEGRATION_ROADMAP_V2_CPANEL_ONLY.md | 1,498 | ~120KB | Integration |
| QUICK_REFERENCE_V2_CPANEL_ONLY.md | 1,284 | ~95KB | Reference |
| COMPLETE_API_ENDPOINT_AUDIT_CPANEL_ONLY.md | 1,041 | ~85KB | API Docs |
| **Total** | **11,143** | **~830KB** | **6 Files** |

---

## Verification Status

- ✅ All Render.com references removed
- ✅ Production URLs updated to breakdowns.gobarry.co.uk
- ✅ WebSocket URLs updated
- ✅ Memory constraints clarified (cPanel-specific)
- ✅ Deployment methods changed to cPanel
- ✅ Database configuration updated (localhost MySQL)
- ✅ CORS origins exclude external domains
- ✅ All code examples tested
- ✅ No broken links
- ✅ Backup created successfully

**Verification Report**: CPANEL_ONLY_VERIFICATION_REPORT.md

---

## License & Copyright

**System**: Go BARRY (Bus Alerts and Roadworks Reporting for You)
**Client**: Go North East
**Year**: 2025
**License**: Proprietary

---

**Index Version**: 1.0
**Last Updated**: October 27, 2025
**Status**: Complete - Ready for Production Use

**All documentation files are now 100% cPanel-focused with no external hosting dependencies.**
