# Go BARRY Codebase - Quick Reference Guide

---

## ⚠️ **LEGACY DOCUMENTATION - SUPABASE MIGRATION** ⚠️

**This document describes the OLD architecture using Supabase.**

**System Status:** ✅ **Migrated to MySQL (October 2025)**

**Current Information:**
- ✅ Database: MySQL (cPanel)
- ✅ Authentication: JWT + bcrypt
- ✅ Real-time: Native WebSocket (ws library)
- ✅ Deployment: cPanel self-hosted

**For current documentation, see:**
- Main Guide: `docs/CPANEL_ONLY_DEPLOYMENT_GUIDE.md`
- Quick Start: `docs/CPANEL_QUICK_START_10MIN.md`
- Master Index: `docs/MASTER_CPANEL_DOCUMENTATION_INDEX.md`

**Last Updated:** October 27, 2025 - Supabase fully removed

---

**Generated:** October 27, 2025
**For:** Rapid Project Understanding
**Read Time:** 5-10 minutes

---

## In a Nutshell

**Go BARRY** is a production-ready React + Node.js breakdown management system for Go North East bus operations. It has **42 diagnostic wizards**, real-time dashboards, and serves **13 active supervisors** across **6 depots**.

---

## Quick Stats

| Metric | Value |
|--------|-------|
| **Frontend Files** | 248 (JSX/CSS) |
| **Backend Files** | 44 (JavaScript) |
| **Diagnostic Wizards** | 42 interactive flows |
| **API Endpoints** | 50+ endpoints |
| **Active Supervisors** | 13 users |
| **Depots** | 6 locations |
| **Database** | MySQL (cPanel) + Supabase (legacy) |
| **Deployment** | cPanel + Render.com |
| **Documentation** | 60+ markdown files |

---

## Project Structure at a Glance

```
BreakdownGuideapp/
├── frontend/               React SPA (Vite)
│   └── src/               ~250 source files
│       ├── breakdown-guide/   Main feature (42 wizards)
│       ├── dashboards/        Management + SDC + Control Room
│       ├── components/        Shared UI components
│       └── services/          API integration
│
├── backend/               Node.js Express API
│   ├── routes/            19 API route files
│   ├── middleware/        Auth, validation, rate limiting
│   ├── services/          Business logic
│   ├── config/            Database connections
│   └── migrations/        Database schemas
│
└── database/              Schema definitions
```

---

## Key Technologies

### Frontend
- **React** 18.2 + Vite 5.0 (fast build)
- **TailwindCSS** 3.4 (utility-first styling)
- **Axios** + **Socket.IO** (API + real-time)
- **Leaflet** (maps)
- **React Hook Form** (form validation)

### Backend
- **Express.js** 4.18 (REST API)
- **MySQL** 2.3 (primary database)
- **JWT** (authentication)
- **WebSocket** (real-time events)
- **Bcrypt** (password hashing)

### Database
- **MySQL** @ cPanel (primary, active)
- **Supabase PostgreSQL** (legacy, phased out)

---

## Where To Find Things

### Wizards (42 Assessment Flows)
`/frontend/src/breakdown-guide/components/wizards/`

Examples:
- SteeringWizard.js
- BrakesWizard.js
- GearboxWizard.js
- DestinationDisplayWizard.js
- WheelchairRampWizard.js

### API Routes
`/backend/routes/`

Key routes:
- `auth.js` - Login, password reset
- `breakdowns.js` - Breakdown CRUD
- `analytics.js` - Dashboards, KPIs
- `engineering.js` - Engineer assignment
- `activity.js` - Activity feed

### Dashboards
`/frontend/src/dashboards/`

- **ManagementDashboard.jsx** - Executive view
- **ControlRoomDisplay.jsx** - Large format display
- **SDCDashboard.jsx** - Operations view
- **Engineering/** - Engineer assignments

### Authentication
- **Frontend:** `/frontend/src/breakdown-guide/auth/`
- **Backend:** `/backend/middleware/authMiddleware.js` + `/backend/routes/auth.js`

### Database Config
- **MySQL:** `/backend/config/mysql.js`
- **Environment:** `/backend/.env`

---

## Authentication Details

### Active Supervisors
- **Admin (2):** AG003 (Anthony Gair), BP009 (Barry Perryman)
- **Total:** 13 supervisors across 6 depots

### Login Flow
```
Badge Input → POST /api/auth/login → JWT Token → Stored in localStorage
→ Included in Authorization header on all requests
→ Middleware validates JWT → Access granted
```

### JWT Configuration
- **Secret:** `JWT_SECRET` env var
- **Expiration:** 24 hours
- **Algorithm:** HS256

---

## API Quick Reference

### Most Important Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/login` | Supervisor login |
| `GET /api/breakdowns` | List breakdowns |
| `POST /api/breakdowns` | Create breakdown |
| `PATCH /api/breakdowns/:id` | Update breakdown |
| `POST /api/sdc/resolve` | Resolve breakdown |
| `GET /api/analytics/*` | Dashboard data |
| `GET /api/activity` | Activity feed |
| `POST /api/engineering/assign` | Assign engineer |

---

## Environment Variables

### Frontend (`.env`)
```
VITE_SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
VITE_API_URL=https://api.breakdowns.gobarry.co.uk
VITE_ENABLE_AUTH=true
```

### Backend (`.env`)
```
DB_HOST=85.234.151.224
DB_USER=gobarryco_Gair
DB_PASSWORD=[secret]
DB_NAME=gobarryco_breakdown
JWT_SECRET=[long secret]
```

---

## Database Schema (Key Tables)

```sql
supervisors         -- Users with badges & roles
breakdowns          -- Incident records (BRK-YYYYMMDD-NNN)
activities          -- Audit trail & activity feed
wizard_progress     -- Diagnostic assessment state
fleet_vehicles      -- Bus vehicle inventory
engineering_assignments -- Engineer dispatch tracking
```

---

## Real-Time Communication

### WebSocket Events
```javascript
'new_breakdown'      -- New incident created
'breakdown_updated'  -- Status changed
'breakdown_resolved' -- Incident completed
'activity_logged'    -- New activity entry
'engineer_assigned'  -- Engineer dispatched
```

### Polling
- Real-time polling in `/frontend/src/utils/pollingManager.js`
- Used for activity feed auto-refresh

---

## Deployment

### Frontend
- **URL:** https://breakdowns.gobarry.co.uk
- **Host:** cPanel
- **Build:** `npm run build:cpanel`
- **Deploy:** `/frontend/deploy-cpanel.sh`

### Backend
- **URL:** https://api.breakdowns.gobarry.co.uk OR https://breakdown-guide.onrender.com
- **Host:** cPanel OR Render.com
- **Start:** `npm start`

### Database
- **Primary:** MySQL @ 85.234.151.224:3306
- **Migrations:** `/backend/migrations/*.sql`

---

## Common Tasks

### Add a New Wizard
1. Create file: `/frontend/src/breakdown-guide/components/wizards/MyWizard.js`
2. Follow structure of existing wizard
3. Register in wizard list/router

### Add an API Endpoint
1. Create in `/backend/routes/myroute.js`
2. Import in `/backend/server.js`
3. Add route: `app.use('/api/myroute', myRouteHandler)`

### Access Database
1. Use query helpers: `from()`, `insert()`, `update()`, `remove()`
2. In `/backend/utils/queryHelpers.js`
3. Gets MySQL connection from `/backend/config/mysql.js`

### Debug Frontend
- Check console for errors
- Use Redux/Context debugger
- Check Network tab for API calls
- Check `.env` VITE variables

### Debug Backend
- Check server logs for errors
- Use `console.log` (shows in PM2/shell)
- Check database connection in `/backend/config/mysql.js`
- Review auth middleware in `/backend/middleware/authMiddleware.js`

---

## Known Issues to Fix

1. **Database Migration** (HIGH PRIORITY)
   - Remove Supabase backup files
   - Complete MySQL migration
   - Update any legacy code

2. **Clean Up**
   - Remove `*.supabase.backup` files
   - Move test files from routes/ to tests/
   - Remove debug code from components

3. **Engineering Routes**
   - Directory `/backend/routes/engineering/` is empty
   - Logic is in `engineering.js` instead
   - Consider consolidating

---

## Security Features

- **Helmet.js** - HTTP header hardening
- **CORS** - Whitelist specific origins
- **Rate Limiting** - 5 login attempts per 15 mins
- **JWT** - Token-based auth
- **Bcrypt** - Password hashing
- **SQL Injection Prevention** - Parameterized queries

---

## Testing Checklist

- [ ] Login with supervisor badge
- [ ] Create breakdown
- [ ] Run wizard assessment
- [ ] View activity feed
- [ ] Check real-time updates
- [ ] Verify engineer assignment
- [ ] Test admin functions
- [ ] Check rate limiting

---

## Important Files

### Must Read First
1. `README.md` - Project overview
2. `SYSTEM_STATUS.md` - Current state
3. `ARCHITECTURE.md` - System design

### Must Modify For Dev
1. `.env` files - Config
2. `/backend/routes/*.js` - API logic
3. `/frontend/src/breakdown-guide/` - Features

### Must Understand
1. `/backend/server.js` - Entry point
2. `/backend/middleware/authMiddleware.js` - Auth
3. `/frontend/src/App.jsx` - Frontend root

---

## Quick Commands

```bash
# Frontend development
cd frontend && npm install && npm run dev

# Backend development
cd backend && npm install && npm run dev

# Build for production (frontend)
npm run build:cpanel

# Start production (backend)
npm start

# Check Node version
node --version

# Database migrations
# Apply in MySQL directly from /backend/migrations/
```

---

## Contact & References

**Organization:** Go North East
**Project:** Breakdown Management System
**Lead Developer:** Anthony Gair (AG003)
**Operations Manager:** Barry Perryman (BP009)
**Status:** Production-Ready ✅

**Full Documentation:**
- See `/CODEBASE_EXPLORATION_REPORT.md` for comprehensive analysis
- See `/ARCHITECTURE.md` for system design
- See `/API_REFERENCE.md` for endpoint details

---

**Last Updated:** October 27, 2025
**Maintained By:** Anthony Gair
**License:** Proprietary
