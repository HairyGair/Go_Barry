# Go BARRY Codebase - START HERE

Welcome! You've been provided with a comprehensive exploration of the Go BARRY codebase. This file will guide you to the right documentation for your needs.

---

## In 30 Seconds

**Go BARRY** is a production-ready React + Node.js application for managing bus breakdowns. It has:
- **248 frontend files** with 42 diagnostic wizards
- **44 backend files** serving 50+ API endpoints
- **13 active supervisor users** across 6 depots
- **Real-time dashboards** with WebSocket updates
- **Full authentication** with JWT tokens

---

## Choose Your Path

### I want a quick overview (5 min read)
→ Read **CODEBASE_QUICK_REFERENCE.md**

### I want comprehensive technical details (30 min read)
→ Read **CODEBASE_EXPLORATION_REPORT.md**

### I want an executive summary (10 min read)
→ Read **EXPLORATION_SUMMARY.txt**

### I want to start coding right now
→ Jump to: [Quick Start](#quick-start) section below

### I'm trying to understand the architecture
→ Read **ARCHITECTURE.md** (existing project doc)

### I need to deploy or configure something
→ Read **DEPLOYMENT_GUIDE.md** (existing project doc)

---

## Document Overview

### CODEBASE_QUICK_REFERENCE.md (8.6 KB)
**Best For:** Quick navigation and common questions

Contains:
- Quick statistics (files, wizards, endpoints)
- Where to find specific features
- Technology stack overview
- Common tasks and commands
- Testing checklist

**Read Time:** 5-10 minutes

### CODEBASE_EXPLORATION_REPORT.md (38 KB)
**Best For:** Deep technical understanding

Contains:
- Complete directory structures with descriptions
- All API endpoints documented
- Database schema details
- Integration documentation (Supabase, MySQL, WebSocket, etc.)
- Component categorization (42 wizards, dashboards, etc.)
- Security features and middleware
- Known issues and recommendations
- Technology dependencies (60+ packages)

**Read Time:** 30-45 minutes

### EXPLORATION_SUMMARY.txt (16 KB)
**Best For:** Project status and statistics

Contains:
- Project overview and purpose
- Codebase statistics
- Key features summary
- Active users and depots
- Directory structure summary
- External integrations
- Database schema overview
- Known issues and recommendations
- Deployment information
- Important files
- Quick start guide

**Read Time:** 10-15 minutes

---

## Quick Start

### For Developers

1. **Understand the structure:**
   ```
   frontend/     - React UI (167 components + 26 CSS files)
   backend/      - Node.js API (19 routes + middleware)
   database/     - SQL migrations
   ```

2. **Setup your environment:**
   ```bash
   # Frontend
   cd frontend
   npm install
   cp .env.example .env
   npm run dev

   # Backend (in another terminal)
   cd backend
   npm install
   cp .env.example .env
   npm run dev
   ```

3. **Login with a test supervisor:**
   - Badge: AG003 (or BP009)
   - Check `/backend/config/mysql.js` for password details

4. **Key entry points:**
   - Frontend: `/frontend/src/App.jsx`
   - Backend: `/backend/server.js`
   - Database: `/backend/config/mysql.js`

### For Operations/DevOps

1. **Frontend deployment:**
   ```bash
   cd frontend
   npm run build:cpanel
   # Upload dist/ to cPanel
   ```

2. **Backend deployment:**
   ```bash
   cd backend
   npm start
   # Or use Render.com auto-deploy
   ```

3. **Database:**
   - Primary: MySQL @ 85.234.151.224:3306
   - Migrations: Apply from `/backend/migrations/*.sql`

### For Product/Management

- **Features:** 42 diagnostic wizards, multiple dashboards, real-time activity
- **Users:** 13 supervisors across 6 depots
- **Uptime:** Production-ready, actively used
- **Status:** All core features working

---

## Project at a Glance

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React + Vite | 18.2 / 5.0 |
| **Backend** | Node.js + Express | 18+ / 4.18 |
| **Database** | MySQL (primary) | 2.3 |
| **Auth** | JWT + Bcrypt | 9.0 / 6.0 |
| **Real-time** | WebSocket | 8.18 |
| **Styling** | TailwindCSS | 3.4 |

### Key Features

- **Breakdown Management:** Auto-ID generation, status tracking, GPS + What3Words
- **42 Wizards:** Interactive diagnostic assessment flows for different issues
- **Dashboards:** Management, Control Room, SDC Operations, Engineering
- **Real-time:** WebSocket events, activity feed, live counters
- **Analytics:** KPIs, trends, performance metrics, repeat detection
- **Authentication:** JWT tokens, role-based access, rate limiting
- **Engineering:** Auto-assignment, skill-based matching, ETA tracking

### Active Users

- **Admins:** AG003 (Anthony Gair), BP009 (Barry Perryman)
- **Supervisors:** 13 total across 6 depots
- **Depots:** Washington, Riverside, Consett, Deptford, Percy Main, Hexham

---

## Common Questions

### How do I add a new wizard?
1. Create file: `/frontend/src/breakdown-guide/components/wizards/MyWizard.js`
2. Follow structure of existing wizard
3. Register in wizard list

See **CODEBASE_EXPLORATION_REPORT.md** Part 6 for full details.

### How do I add an API endpoint?
1. Create route file: `/backend/routes/myroute.js`
2. Import in `/backend/server.js`
3. Use query helpers for database access

See **CODEBASE_EXPLORATION_REPORT.md** Part 10 for examples.

### Where is the database?
Primary: MySQL @ cPanel (85.234.151.224:3306)
Legacy: Supabase PostgreSQL (being phased out)
Config: `/backend/config/mysql.js`

### How is authentication handled?
Login → JWT Token → localStorage → Authorization header → Middleware validates

See **CODEBASE_EXPLORATION_REPORT.md** Part 8 for complete flow.

### What's the deployment process?
Frontend: Build with `npm run build:cpanel`, upload dist/ to cPanel
Backend: Push to Git for Render.com auto-deploy, or use cPanel App Manager

See **DEPLOYMENT_GUIDE.md** for complete instructions.

---

## Known Issues

**HIGH PRIORITY:**
- Database migration from Supabase to MySQL (still has backup files)
- Clean up legacy code artifacts

**MEDIUM PRIORITY:**
- Add test coverage
- Consolidate engineering routes

See **CODEBASE_EXPLORATION_REPORT.md** Part 11 for full list.

---

## Useful Documentation Files

In this repository you'll find:

**Exploration Documents (new):**
- `CODEBASE_EXPLORATION_REPORT.md` - Comprehensive analysis
- `CODEBASE_QUICK_REFERENCE.md` - Quick navigation
- `EXPLORATION_SUMMARY.txt` - Statistics and overview
- `START_HERE.md` - This file

**Existing Project Documentation:**
- `README.md` - Project overview
- `SYSTEM_STATUS.md` - Current deployment status
- `ARCHITECTURE.md` - System design
- `API_REFERENCE.md` - API documentation
- `DEPLOYMENT_GUIDE.md` - Deployment instructions

**Database Documentation:**
- `DATABASE_ANALYSIS_REPORT.md` - Schema details
- `/backend/migrations/*.sql` - Schema definitions

---

## Getting Help

### For Technical Questions
1. Check the comprehensive **CODEBASE_EXPLORATION_REPORT.md**
2. Review the specific section (e.g., Part 3 for API, Part 6 for wizards)
3. Look at existing code examples in the same directory

### For Architecture Questions
1. Read **ARCHITECTURE.md** (existing project doc)
2. Review **CODEBASE_EXPLORATION_REPORT.md** Part 1-5

### For Deployment Questions
1. Check **DEPLOYMENT_GUIDE.md** (existing project doc)
2. Review deployment section in exploration documents

### For Database Questions
1. Check **DATABASE_ANALYSIS_REPORT.md** (existing project doc)
2. Review **CODEBASE_EXPLORATION_REPORT.md** Part 5

---

## File Locations

**Frontend Code:**
- Components: `/frontend/src/breakdown-guide/components/`
- Wizards: `/frontend/src/breakdown-guide/components/wizards/` (42 files)
- Dashboards: `/frontend/src/dashboards/`
- Services: `/frontend/src/services/`
- Styles: `/frontend/src/styles/` (26 CSS files)

**Backend Code:**
- Routes: `/backend/routes/` (19 files)
- Middleware: `/backend/middleware/`
- Services: `/backend/services/`
- Config: `/backend/config/`
- Database: `/backend/config/mysql.js`
- Migrations: `/backend/migrations/`

**Configuration:**
- Root: `.env` (root level)
- Frontend: `/frontend/.env`
- Backend: `/backend/.env`

---

## Next Steps

1. **Choose your documentation:**
   - For quick overview: Read CODEBASE_QUICK_REFERENCE.md
   - For deep dive: Read CODEBASE_EXPLORATION_REPORT.md
   - For executive summary: Read EXPLORATION_SUMMARY.txt

2. **Start exploring the code:**
   - Begin with `/frontend/src/App.jsx`
   - Then `/backend/server.js`
   - Then specific feature areas

3. **Setup your environment:**
   - Copy .env files
   - Run `npm install`
   - Start development servers

4. **Test the application:**
   - Login with test supervisor
   - Create a breakdown
   - Run a wizard
   - Check real-time updates

---

## Summary

You now have access to:
- **Complete codebase exploration** (1,341 lines across 3 documents)
- **Technical documentation** (38 KB detailed report)
- **Quick reference guide** (8.6 KB navigation guide)
- **Executive summary** (16 KB overview)

Everything is organized and ready to help you understand, develop, and deploy the Go BARRY system.

**Status:** Production-Ready ✅

---

**Generated:** October 27, 2025
**For:** Go North East Breakdown Management System
**All documents in:** `/Users/anthony/Go BARRY App/BreakdownGuideapp/`
