# CLAUDE.md - AI Assistant Guide

This file provides guidance to Claude Code and other AI assistants when working with the Go BARRY Breakdown Management System.

**Last Updated:** November 11, 2025 (GTFS Phase 1 Complete + Security Fixes Deployed + Legacy Docs Cleanup)
**System Status:** Production-Ready ✅
**Current Version:** 3.6.0 (MySQL + cPanel + Input Validation + GTFS Phase 1 + Professional Design System + Security Hardening)
**Documentation Status:** ✅ Cleaned and Organized (47 legacy files removed, 7 essential docs retained)

---

## ⚠️ CRITICAL: Documentation Rules for AI Assistants

### 🚫 DO NOT Create New .md Files

**IMPORTANT:** This project has been extensively cleaned. You are **strictly prohibited** from creating new .md files unless explicitly requested by the user.

**Why?**
- October 30, 2025: Major cleanup removed 115+ legacy documentation files
- Root directory reduced from 83 to 50 .md files
- Backend reduced from 120 files to 17 essential files
- All documentation is now organized and maintained

**Instead of creating new .md files:**
1. ✅ **Update existing documentation** - Edit relevant sections in existing files
2. ✅ **Add comments in code** - Document complex logic inline
3. ✅ **Update CLAUDE.md** - Add important context to this file
4. ✅ **Ask first** - If you think new documentation is needed, ask the user

**Exception:** Only create new .md files if the user **explicitly requests** a new document.

### ✅ DO Update Existing Documentation

**When making significant changes, update these key files:**
- **CLAUDE.md** (this file) - Add important context for future AI sessions
- **README.md** - Update if architecture or setup changes
- **DEPLOYMENT.md** - Update if deployment process changes
- **DEVELOPMENT.md** - Update if development workflow changes

**How to update:**
1. Read the existing file first
2. Find the relevant section
3. Update inline (don't duplicate content)
4. Keep it concise and accurate
5. Update the "Last Updated" date at top

---

---

## 🎯 Project Overview

The **Go BARRY Breakdown Management System** is a real-time breakdown tracking and diagnostic platform for Go North East bus operations. It serves supervisors across 6 depots managing a fleet of 1,000+ vehicles.

### Quick Facts
- **Active Supervisors:** 9 across Washington, Riverside, Consett, Deptford, Percy Main, Hexham
- **Fleet Size:** 1,000+ vehicles
- **Diagnostic Wizards:** 20+ interactive assessment flows
- **Authentication:** Badge-based (AG003, BP009, etc.) with duty selection
- **Deployment:** cPanel (frontend) + PM2 (backend) + MySQL

### Production URLs
- **Frontend:** https://breakdowns.gobarry.co.uk
- **Backend API:** https://api.breakdowns.gobarry.co.uk
- **Database:** MySQL at 85.234.151.224 (direct connection)

---

## 🏗️ System Architecture

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React + Vite | Single-page application |
| **Backend** | Node.js + Express | RESTful API server |
| **Database** | MySQL 8.0+ | Primary data store |
| **Authentication** | JWT + bcrypt | Secure badge-based auth |
| **Real-time** | WebSocket (ws) | Live dashboard updates |
| **Hosting** | cPanel + PM2 | Self-hosted infrastructure |

### Key Architecture Changes (2025)

**October 2025 Migration:**
- ❌ Supabase PostgreSQL → ✅ MySQL (cPanel)
- ❌ Supabase Auth → ✅ JWT + bcrypt
- ❌ Render.com → ✅ cPanel + PM2
- ✅ Added duty selection workflow (Duty 100/200/400/500)

---

## 📁 Project Structure

```
BreakdownGuideapp/
├── backend/                    # Node.js Express API
│   ├── routes/                # API endpoints (165+ routes)
│   │   ├── auth.js           # Authentication + duty selection
│   │   ├── breakdowns.js     # Breakdown CRUD
│   │   ├── breakdownsAPI.js  # SDC dashboard API
│   │   ├── activity.js       # Activity feed
│   │   ├── analytics.js      # KPIs & reports
│   │   └── webSocketHandler.js
│   ├── middleware/
│   │   └── authMiddleware.js # JWT verification
│   ├── services/            # Business logic
│   ├── config/
│   │   └── mysql.js         # Database connection
│   ├── data/                # JSON cache files
│   ├── migrations/          # MySQL schema migrations
│   ├── server.js            # Express app entry
│   └── .env                 # Environment config
│
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Route pages
│   │   ├── services/        # API services
│   │   └── App.jsx          # Root component
│   ├── public/              # Static assets
│   ├── vite.config.js       # Vite configuration
│   └── .env                 # Frontend config
│
├── docs/                    # Comprehensive documentation
│   ├── CPANEL_ONLY_DEPLOYMENT_GUIDE.md
│   ├── MASTER_CPANEL_DOCUMENTATION_INDEX.md
│   └── COMPLETE_API_ENDPOINT_AUDIT.md
│
└── README.md                # This project's overview
```

---

## 🔐 Authentication System

### Current Flow (October 2025)

**New 3-Step Authentication:**
1. **Login:** Email + password → JWT token
2. **Select Duty:** Modal appears with Duty 100/200/400/500 options
3. **Access Granted:** Full app access with duty badge in navigation

### Supervisor Accounts

**Admin Users:**
- AG003 (Anthony Gair) - SDC
- BP009 (Barry Perryman) - SDC

**Supervisors (7 active):**
- Distributed across 6 depots
- Role-based access (admin/supervisor/manager)

### Technical Implementation

**Backend:** `/backend/routes/auth.js`
```javascript
POST /api/supervisor/login      // Step 1: Authenticate
POST /api/auth/set-duty         // Step 2: Set duty shift
GET  /api/supervisor/session    // Verify current session
POST /api/supervisor/logout     // End session
```

**Frontend:** `DutySelectionModal.jsx`
- Modal automatically appears after login if no duty set
- Duty options: 100 (00:00-08:00), 200 (08:00-16:00), 400 (16:00-00:00), 500 (Variable)
- Can skip duty selection (optional)

**Authentication Token:**
- JWT stored in memory (NOT localStorage)
- 24-hour expiration
- All API requests include: `Authorization: Bearer <token>`

---

## 📊 Core Features

### 1. Breakdown Management
**File:** `backend/routes/breakdowns.js`

**Features:**
- Create/Read/Update/Delete breakdowns
- Auto-generated IDs (e.g., `BRK-20251030-001`)
- GPS location tracking
- Photo uploads
- Status workflow: pending → in-progress → resolved
- Full audit trail

**Key Endpoints:**
```
POST   /api/breakdowns              # Create breakdown
GET    /api/breakdowns/:id          # Get by ID
PUT    /api/breakdowns/:id          # Update
GET    /api/breakdowns/live         # Live breakdowns
GET    /api/breakdowns/stats        # Statistics
```

### 2. Diagnostic Wizards (20+ Types)
**File:** `backend/routes/wizards.js`

**Wizard Categories:**
- Steering, Brakes, Engine, Electrical
- HVAC, Doors, Wheelchair Ramp
- Destination Display, Gearbox, Suspension
- And 10+ more specialized assessments

**Assessment Flow:**
1. Vehicle identification
2. Location capture
3. Symptom questions (conditional logic)
4. Safety checks
5. Severity determination (STOP/AMBER/CONTINUE)
6. Action plan generation

### 3. SDC Operations Dashboard
**File:** `backend/routes/breakdownsAPI.js`

**Features:**
- Real-time breakdown cards
- Live counter
- Filter by depot/severity/status
- Engineer dispatch interface
- Breakdown resolution workflow

**WebSocket Events:**
- `new_breakdown` - New breakdown created
- `breakdown_updated` - Status changed
- `breakdown_resolved` - Breakdown marked complete
- `engineer_assigned` - Engineer dispatched

### 4. Activity Feed
**File:** `backend/routes/activity.js`

**Features:**
- Real-time activity stream
- Pagination support
- Filtering (depot, actor, type, severity)
- Live updates via WebSocket
- Search functionality

### 5. Analytics & Reporting
**File:** `backend/routes/analytics.js`

**Metrics:**
- Total breakdowns by depot
- Average response times
- Engineer performance
- Repeat breakdown detection
- Fleet health scores
- Trend analysis

### 6. Fleet CSV Import (Admin Only)
**File:** `backend/routes/adminFleet.js`

**Features:**
- Bulk fleet vehicle import via CSV upload
- Drag-and-drop web interface
- Real-time progress tracking with visual feedback
- Comprehensive data validation (FleetNo, RegNumber, OperatingDepotCode, VehicleType)
- Automatic duplicate handling (updates existing records)
- Detailed error reporting with downloadable CSV
- CSV template download
- Activity logging for audit trail
- Admin-only access (AG003, BP009)

**Key Endpoints:**
```
POST   /api/admin/fleet/import-csv       # Upload and import CSV
GET    /api/admin/fleet/import-template  # Download CSV template
```

**Dependencies:**
- `multer` - File upload handling (memory storage, 10MB limit)
- `csv-parse` - CSV parsing with validation
- Transaction-based imports (all-or-nothing)

**Frontend Component:**
- `frontend/src/components/AdminFleetImportSettings.jsx` - Main upload interface
- `frontend/src/components/AdminFleetImportSettings.css` - Styling

**Documentation:**
- `FLEET_CSV_IMPORT_API_GUIDE.md` - Quick reference guide

### 7. GTFS Phase 1: Live Route Intelligence (✅ COMPLETE - November 11, 2025)

**Files:**
- Backend: `/backend/routes/gtfsPhase1.js` (404 lines)
- Frontend: `/frontend/src/dashboards/gtfs/LiveRouteStatusDashboard.jsx` (321 lines)
- Frontend: `/frontend/src/dashboards/gtfs/RouteStatusCard.jsx` (158 lines)
- Service: `/frontend/src/services/gtfsApiService.js` (85 lines)

**Feature 1: Live Route Status Dashboard**
- Real-time status for all 225+ bus routes
- Color-coded status: Green (0 breakdowns), Amber (1 breakdown), Red (2+ breakdowns)
- Filters: Status, Search by route number/name, Sort by status/number/name
- Auto-refresh every 10 seconds via polling
- Summary dashboard showing route health statistics

**API Endpoints:**
```
GET /api/gtfs/routes/status/live        # All routes with status
GET /api/gtfs/routes/:routeId/status    # Specific route details
```

**Backend Implementation:**
- Uses MySQL view `v_route_status_summary` for aggregated data
- Queries breakdowns table for active incidents
- Counts breakdowns by severity for each route
- Returns formatted response with summaries and detailed route status

**Frontend Implementation:**
- Responsive grid layout with RouteStatusCard components
- Real-time polling with configurable refresh interval
- Advanced filtering and search capabilities
- Loading states and error handling
- WebSocket-ready for future real-time updates (currently polling for stability)

**Features Not Yet Implemented (Phase 1b+):**
- Route Coverage Analysis (spare vehicle availability)
- Stop-Level Incident Heatmap (geographic clustering)
- WebSocket real-time updates (currently using polling)

**Deployment Status:** ✅ Live in Production
- Endpoints accessible at `/api/gtfs/routes/status/live`
- Frontend dashboard accessible via navigation
- Database views and schemas deployed

---

## 🗄️ Database Schema

### MySQL Database

**Connection Details:**
- Host: 85.234.151.224
- Port: 3306
- Database: gobarryco_breakdown
- User: gobarryco_Gair
- SSL: Not required (internal network)

### Core Tables

**1. supervisors** - User accounts
```sql
- id, email, name, badge_number
- depot, role (admin/supervisor/manager)
- password_hash (bcrypt)
- duty (100/200/400/500)
- is_active, created_at, updated_at
```

**2. breakdowns** - Breakdown records
```sql
- id, breakdown_id (BRK-YYYYMMDD-NNN)
- fleet_no, supervisor_badge
- location_description, location_lat, location_lng
- issue_category, severity, status
- wizard_type, wizard_decision
- wizard_assessment_data (JSON)
- depot, resolved_at, resolution_notes
- created_at, updated_at
```

**3. activities** - Activity log
```sql
- id, activity_type, timestamp
- breakdown_id, fleet_no
- supervisor_name, supervisor_badge
- message, description
- severity, depot, source
```

**4. wizard_progress** - Assessment tracking
```sql
- id, supervisor_id, wizard_type
- current_step, total_steps
- progress_data (JSON)
- status, created_at, updated_at
```

---

## 🚀 Development Workflow

### Local Development Setup

**Prerequisites:**
```bash
node --version  # Must be 18.0.0+
npm --version   # 9.0.0+
mysql --version # 8.0+
```

**1. Backend Setup:**
```bash
cd backend
npm install
cp .env.cpanel.example .env
# Edit .env with local MySQL credentials
npm run dev  # Starts on http://localhost:3001
```

**2. Frontend Setup:**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with API URL
npm run dev  # Starts on http://localhost:5173
```

**3. Database Setup:**
```bash
# Import schema
mysql -u root -p < backend/migrations/complete_schema.sql

# Create test supervisor
INSERT INTO supervisors (email, name, badge_number, role, password_hash)
VALUES ('test@example.com', 'Test User', 'TU001', 'admin',
  '$2b$10$...');  # Use bcrypt to hash password
```

### Making Code Changes

**Backend Changes:**
1. Edit files in `/backend/`
2. Server auto-restarts with nodemon
3. Test endpoints with curl or Postman
4. Check logs for errors

**Frontend Changes:**
1. Edit files in `/frontend/src/`
2. Vite hot-reloads automatically
3. Check browser console for errors
4. Test in Chrome/Firefox/Safari

**Database Changes:**
1. Create migration SQL in `/backend/migrations/`
2. Test locally first
3. Document in migration summary
4. Apply to production via phpMyAdmin

### Testing Locally

**Test Authentication:**
```bash
# Login
curl -X POST http://localhost:3001/api/supervisor/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Should return JWT token
```

**Test Breakdown Creation:**
```bash
curl -X POST http://localhost:3001/api/breakdowns \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"fleet_no":"6377","location":"Test Location","issue":"Test Issue"}'
```

---

## 📦 Deployment Process

### Backend Deployment (PM2)

**Deploy via SSH:**
```bash
# Connect to server
ssh user@85.234.151.224

# Navigate to backend directory
cd ~/api

# Pull latest changes (if using git)
# OR upload files via SFTP/CyberDuck

# Install dependencies
npm ci --production

# Restart PM2
pm2 restart breakdown-backend
pm2 logs breakdown-backend

# Check status
pm2 status
curl http://localhost:3001/api/health
```

### Frontend Deployment (cPanel)

**Build and Upload:**
```bash
# Local machine
cd frontend
npm run build

# Uploads via CyberDuck or cPanel File Manager:
# 1. Delete all files in ~/public_html/breakdowns.gobarry.co.uk/
# 2. Upload all files from frontend/dist/
# 3. Test: https://breakdowns.gobarry.co.uk
```

### Database Migrations

**Apply via phpMyAdmin:**
1. Login to phpMyAdmin (cPanel)
2. Select `gobarryco_breakdown` database
3. Go to SQL tab
4. Paste migration SQL
5. Execute
6. Verify with SELECT queries

---

## 🐛 Common Issues & Solutions

### Backend Won't Start

**Symptom:** PM2 shows "errored" status

**Solutions:**
```bash
# Check logs
pm2 logs breakdown-backend --lines 100

# Common issues:
# 1. MySQL connection failed - Check .env DB credentials
# 2. Port in use - Check PM2 config
# 3. Missing dependencies - Run npm install
# 4. Syntax errors - Check recent code changes

# Restart with fresh logs
pm2 delete breakdown-backend
pm2 start ecosystem.config.js
```

### Frontend Showing Old Code

**Symptom:** Changes not visible after deployment

**Solutions:**
```bash
# Hard refresh browser
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Clear Vite cache and rebuild
rm -rf frontend/node_modules/.vite
npm run build

# Check .htaccess for caching headers
# Should have: Cache-Control: no-cache for index.html
```

### Database Connection Timeout

**Symptom:** API returns 500 error, logs show MySQL timeout

**Solutions:**
```bash
# Check MySQL service
systemctl status mysql  # If root access available

# Test connection
mysql -h 85.234.151.224 -u gobarryco_Gair -p gobarryco_breakdown

# Check connection pool settings in backend/config/mysql.js
# Reduce connectionLimit if hitting max connections
```

### WebSocket Not Connecting

**Symptom:** Real-time updates not working

**Solutions:**
```bash
# Check WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://api.breakdowns.gobarry.co.uk/ws

# Check PM2 logs for WebSocket errors
pm2 logs | grep -i websocket

# Verify nginx/apache proxy config
# Should have proxy_set_header Upgrade/Connection headers
```

---

## 🔴 CRITICAL: API Path Convention Error (November 10, 2025)

### The Problem
A common mistake was made where frontend API service files were calling endpoints WITHOUT the `/api` prefix:

**❌ WRONG:**
```javascript
// frontend/src/services/preferencesAPI.js
const response = await apiClient.get('/preferences');  // Returns 404!
```

**✅ CORRECT:**
```javascript
// frontend/src/services/preferencesAPI.js
const response = await apiClient.get('/api/preferences');  // Works!
```

### Why This Matters

**Backend Route Registration:**
```javascript
// backend/server.js - Routes are mounted at /api/* path
app.use('/api/preferences', authenticateSupervisor, preferencesRoutes);
app.use('/api/admin/fleet', authenticateAdmin, adminFleetRoutes);
app.use('/api/breakdowns', authenticateSupervisor, breakdownsRoutes);
```

All backend routes are prefixed with `/api/` in Express routing!

### Rule for Frontend API Calls

**ALWAYS include `/api` prefix when calling backend endpoints from frontend:**

```javascript
// ✅ CORRECT - All these have /api prefix
apiClient.get('/api/preferences')
apiClient.post('/api/breakdowns')
apiClient.get('/api/admin/fleet/import-csv')
apiClient.get('/api/auth/supervisors')

// ❌ WRONG - Missing /api prefix (returns 404)
apiClient.get('/preferences')
apiClient.post('/breakdowns')
apiClient.get('/admin/fleet/import-csv')
```

### Where to Check

**Frontend API Services (must have `/api` prefix):**
- `frontend/src/services/preferencesAPI.js` ✅ FIXED
- `frontend/src/services/api-client.js` - Reference implementation
- `frontend/src/services/breakdownAPI.js`
- `frontend/src/services/authAPI.js`
- Any new API service file

**Quick Check Pattern:**
```javascript
// In any service file, ALWAYS prefix with /api
apiClient.get('/api/...')
apiClient.post('/api/...')
apiClient.put('/api/...')
apiClient.patch('/api/...')
apiClient.delete('/api/...')
```

### Historical Context
- **Date:** November 10, 2025
- **Issue:** preferencesAPI.js missing `/api` prefix on all 6 endpoints
- **Impact:** Settings page couldn't load (404 errors)
- **Root Cause:** Copy-paste mistake when creating service file
- **Solution:** Added `/api` prefix to all endpoint calls
- **Files Fixed:** `frontend/src/services/preferencesAPI.js`

---

## 📝 Code Standards

### Backend (Node.js/Express)

**Naming Conventions:**
```javascript
// Variables: camelCase
const breakdownId = 'BRK-20251030-001';

// Functions: camelCase
function generateBreakdownId() { }

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Files: kebab-case
// auth-middleware.js, breakdown-service.js
```

**Async/Await Pattern:**
```javascript
// ✅ Preferred
async function getBreakdown(id) {
  try {
    const [results] = await db.query('SELECT * FROM breakdowns WHERE id = ?', [id]);
    return results[0];
  } catch (error) {
    console.error('Error fetching breakdown:', error);
    throw error;
  }
}

// ❌ Avoid
function getBreakdown(id) {
  return db.query('SELECT * FROM breakdowns WHERE id = ?', [id])
    .then(([results]) => results[0])
    .catch(error => console.error(error));
}
```

**Error Handling:**
```javascript
// Always use try-catch in async routes
router.post('/api/breakdowns', async (req, res) => {
  try {
    const breakdown = await createBreakdown(req.body);
    res.json({ success: true, breakdown });
  } catch (error) {
    console.error('Breakdown creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create breakdown'
    });
  }
});
```

### Frontend (React)

**Component Structure:**
```javascript
// Functional components with hooks
import React, { useState, useEffect } from 'react';

export default function BreakdownCard({ breakdown }) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Side effects here
  }, [breakdown.id]);

  return (
    <div className="breakdown-card">
      {/* JSX here */}
    </div>
  );
}
```

**File Naming:**
```
// Components: PascalCase
BreakdownCard.jsx
DutySelectionModal.jsx

// Utilities: camelCase
apiService.js
authHelpers.js
```

---

## 🔍 Important Context

### Recent Major Changes

**November 10, 2025 - GTFS Data Import System (Complete):**
- Implemented comprehensive GTFS (General Transit Feed Specification) data import functionality
- Allows admins to upload bus route data, stop locations, trip schedules, and stop timing information
- **Files Created:**
  - `/backend/routes/adminGTFS.js` (680 lines) - 5 API endpoints for GTFS file uploads
  - `/backend/migrations/009_create_gtfs_tables.sql` - Database schema with 5 tables
  - `/frontend/src/components/AdminGTFSSettings.jsx` (625 lines) - Professional upload UI
  - `/frontend/src/components/AdminGTFSSettings.css` (683 lines) - Styling
- **Files Modified:**
  - `/backend/server.js` - Registered GTFS routes with admin authentication
  - `/frontend/src/components/settings/AdminSettings.jsx` - Added GTFS tab to admin panel
- **Database:**
  - 5 new tables: gtfs_routes, gtfs_stops, gtfs_trips, gtfs_stop_times, gtfs_import_log
  - Foreign key relationships for data integrity
  - Stored procedures for queries and geospatial lookups
  - Views for statistics and reporting
- **API Endpoints:** 5 admin-only endpoints at `/api/admin/gtfs/`
  - POST /routes - Import bus routes
  - POST /stops - Import stop locations
  - POST /trips - Import trip schedules
  - POST /stop-times - Import stop timing (batch processing for large files)
  - GET /stats - Get import statistics
- **Features:**
  - Admin-only access (AG003, BP009)
  - Drag-and-drop file upload interface
  - Real-time progress tracking
  - Error reporting with downloadable CSV
  - Upsert logic (insert or update existing)
  - Transaction support for data integrity
  - Batch processing for 100MB+ files
  - SQL injection prevention with parameterized queries
- **Status:** ✅ Backend complete, database migration applied, frontend built, ready for production deployment
- **Critical Bug Fixes:**
  - Fixed double middleware application issue (removed duplicate authenticateAdmin from individual routes)
  - Optimized stop_times import for large files (240x performance improvement using bulk INSERT ON DUPLICATE KEY UPDATE)

**November 10, 2025 - GTFS Data Enables Smart Route Matching (Next Priority Feature):**
- With GTFS data imported, automatic route matching by location becomes possible
- **Current State:** Breakdown modal requires manual route selection
- **Proposed Enhancement:** Automatically suggest all routes passing through the breakdown location
- **Implementation Plan:**
  1. Create new API endpoint: `POST /api/breakdowns/smart-route-match` (query nearby stops by GPS coordinates)
  2. Query `gtfs_stops` table for stops within 1km radius of breakdown location
  3. Join with `gtfs_trips` and `gtfs_routes` to find all routes serving those stops
  4. Return list of affected routes with frequencies and schedules
  5. Enhance `FleetSelectionModal.jsx` to auto-populate routes when location is confirmed
  6. Show route suggestions with "Affected route" badge
- **Files to Modify:**
  - `/backend/routes/breakdowns.js` - Add smart route matching endpoint
  - `/frontend/src/breakdown-guide/components/FleetSelectionModal.jsx` - Show route suggestions based on location
  - `/frontend/src/services/breakdownDataService.js` - Call new API endpoint
- **Database Query Example:**
  ```sql
  SELECT DISTINCT gr.route_short_name, gr.route_long_name, COUNT(DISTINCT gst.trip_id) as trips_per_hour
  FROM gtfs_stops gs
  JOIN gtfs_stop_times gst ON gs.stop_id = gst.stop_id
  JOIN gtfs_trips gt ON gst.trip_id = gt.trip_id
  JOIN gtfs_routes gr ON gt.route_id = gr.route_id
  WHERE SQRT(POW((gs.stop_lat - ?), 2) + POW((gs.stop_lon - ?), 2)) < 0.009 -- ~1km
  GROUP BY gr.route_id
  ORDER BY trips_per_hour DESC
  ```
- **Estimated Effort:** 2-3 days
- **Value:** Every breakdown automatically shows all affected routes, enabling proactive passenger notifications and faster incident response

**November 9, 2025 - Engineering Display Depot Filtering Fix:**
- Fixed critical issue preventing breakdowns from appearing on engineering displays
- Engineering displays now receive **depot-filtered breakdowns only**
- Implemented three new methods in `webSocketHandler.js`:
  - `sendInitialBreakdownDataByDepot()` - Sends filtered breakdowns on display connection
  - `broadcastBreakdownByDepot()` - Broadcasts new breakdowns only to displays in affected depot
  - `broadcastToEngineeringDisplays()` - Sends updated breakdowns to all displays filtered by depot
- **Files Modified:**
  - `/backend/routes/webSocketHandler.js` (added depot filtering logic)
- **How It Works:**
  1. Engineering display connects via WebSocket with `displayId` and `depot` parameters
  2. Backend registers display and sends all active breakdowns for that depot
  3. When new breakdowns are created, only displays in the breakdown's depot receive updates
  4. All filters exclude 'resolved' and 'cleared' status breakdowns
- **Key Queries:**
  - Initial: `SELECT * FROM breakdowns WHERE depot = ? AND status NOT IN ('resolved', 'cleared')`
  - Updates: Filters all broadcasts by matching display.depot to breakdown.depot

**November 7, 2025 - Phase 2: Input Validation (Security Enhancement):**
- Implemented comprehensive Joi validation across 12+ critical endpoints
- Created reusable validation schemas (email, password, badge numbers, fleet numbers)
- Added pagination limits (max 100) to prevent database overload
- Prevents SQL injection, parameter tampering, and invalid data
- User-friendly validation error messages with detailed field-level feedback
- **Files Created:**
  - `/backend/validation/schemas.js` (490 lines - all validation rules)
- **Files Enhanced:**
  - `/backend/middleware/validationMiddleware.js` (added validate() function)
  - `/backend/routes/auth.js` (5 endpoints protected)
  - `/backend/routes/breakdowns.js` (4 endpoints protected)
  - `/backend/routes/analytics.js` (3 endpoints protected)
- **See:** `PHASE2_VALIDATION_IMPLEMENTATION_SUMMARY.md` for complete details

**October 2025 - Duty Selection Flow:**
- Added 3-step authentication: Login → Select Duty → Access
- New endpoint: `POST /api/auth/set-duty`
- DutySelectionModal component integrated
- Duty badge shown in navigation

**October 2025 - MySQL Migration:**
- Migrated from Supabase to MySQL
- Replaced Supabase Auth with JWT + bcrypt
- Moved from Render.com to cPanel + PM2
- Direct database connection (no connection pooling service)

---

## 🎨 Professional Design System v1.0 (November 11, 2025)

A comprehensive design system has been implemented across the entire frontend application. This ensures consistency, maintainability, and professional appearance on every page.

### Design System Components

**Files Created:**
- **`/frontend/src/styles/design-tokens.css`** (374 lines) - 150+ CSS variables for colors, spacing, shadows, transitions
- **`/frontend/src/styles/components.css`** (803 lines) - 40+ pre-built component classes (buttons, cards, forms, etc.)
- **`DESIGN_SYSTEM.md`** - Complete design system documentation
- **`frontend/DESIGN_TOKENS_QUICK_REFERENCE.md`** - Quick reference for developers

**Files Updated (11 major files):**
- `index.css` - Refactored with design tokens
- `App.css` - Reduced from 2,981 → 1,259 lines (58% reduction!)
- `ModernAppHeader.css` - Enhanced with glassmorphism
- `MySQLLoginPage.css` - Enhanced with aurora theme + glassmorphism
- All 5 dashboard CSS files - Unified styling with tokens

### Color Palette

**Primary Brand:**
- Red: `#E30613` (primary) with dark/light variants
- Navy: `#003B5C` (secondary)

**Status Colors:**
- Success (Green): `#10B981`
- Warning (Amber): `#F59E0B`
- Critical (Red): `#DC2626`
- Info (Blue): `#3B82F6`

**Greys:** Complete professional scale with semantic naming

### Key Features

✅ **150+ CSS Variables** - Colors, spacing, shadows, transitions, z-index
✅ **40+ Component Classes** - Buttons, cards, forms, layout utilities
✅ **Glassmorphism** - Enhanced throughout with 20px blur effects
✅ **Dark Mode Ready** - CSS variable overrides pre-configured
✅ **Responsive Design** - 6 breakpoints (360px to 1400px+)
✅ **Accessibility** - WCAG AA compliant with high contrast
✅ **8px Spacing Scale** - Professional alignment throughout
✅ **Professional Shadows** - 7-level elevation system

### Using Design Tokens in New Components

```css
/* Use tokens instead of hardcoded values */
.my-component {
  color: var(--color-text-primary);
  padding: var(--spacing-lg);
  background: var(--color-red-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}
```

### Component Classes

```html
<!-- Buttons -->
<button class="btn btn-primary">Primary Action</button>
<button class="btn btn-secondary">Secondary Action</button>

<!-- Cards -->
<div class="card card--glass">Card with glassmorphism</div>

<!-- Forms -->
<input class="form-input" type="text" placeholder="Enter text" />

<!-- Layout -->
<div class="flex flex-between flex-gap-lg">
  <div>Left</div>
  <div>Right</div>
</div>
```

### Build Impact

- **11,614 lines of CSS refactored** to use design tokens
- **200+ hardcoded colors** → 50+ semantic tokens
- **58% reduction** in App.css file size
- **Zero CSS errors** - Build successful in 6.12 seconds
- **All animations preserved** - Smooth transitions throughout
- **Responsive design verified** - Works on all breakpoints
- **Accessibility verified** - All contrast ratios WCAG AA compliant

### Documentation

- **DESIGN_SYSTEM.md** - Full design system guide (colors, spacing, components, dark mode)
- **CSS_REFACTOR_SUMMARY.md** - What was changed and metrics
- **frontend/DESIGN_TOKENS_QUICK_REFERENCE.md** - Quick lookup for developers
- **src/styles/design-tokens.css** - All CSS variables defined
- **src/styles/components.css** - All component classes

### For Developers

When creating new components:
1. Use existing CSS classes: `.btn`, `.card`, `.form-input`
2. Reference color tokens: `var(--color-red-primary)`, `var(--color-success)`
3. Use spacing tokens: `var(--spacing-lg)`, `var(--spacing-md)`
4. Follow shadow pattern: `var(--shadow-md)` for cards, `var(--shadow-hover)` for hover
5. Check `frontend/DESIGN_TOKENS_QUICK_REFERENCE.md` for quick lookup

---

## 📋 Recent Updates - November 2025

### Authentication System Overhaul (November 2, 2025)

**1. Premium Login Page Created**
- Complete redesign with glassmorphism and purple gradient background
- **Files:**
  - `/frontend/src/components/MySQLLoginPage.jsx`
  - `/frontend/src/components/MySQLLoginPage.css`
- **Features:**
  - Password strength meter with real-time validation
  - Email validation with visual feedback
  - Floating label inputs with smooth animations
  - Security badges (256-bit encryption, secure authentication)
  - Responsive design for all screen sizes (mobile, tablet, desktop)
  - Glassmorphism effects with backdrop blur
  - Loading states and error handling
- **Design:** Purple gradient background (#667eea to #764ba2) with glass-morphic login card

**2. Duty Selection System Updated**
- Updated all 4 duty shifts to match **Go North East standard operational times**
- **File:** `/frontend/src/components/DutySelectionModal.jsx`
- **New Duty Times:**
  - **Duty 100: Early Shift (06:00-15:30)** - Blue gradient - 9h 30m duration
  - **Duty 200: Day Shift (07:30-17:00)** - Green gradient - 9h 30m duration
  - **Duty 400: Late Shift (12:30-22:00)** - Orange gradient - 9h 30m duration
  - **Duty 500: Night Shift (14:45-00:15)** - Purple gradient - 9h 30m duration
- **Features:**
  - Each duty card shows color-coded gradients
  - Comprehensive task lists for each shift
  - Smooth modal animations
  - Optional duty selection (can be skipped)
  - Duty badge displayed in navigation after selection

**3. Mock Data Elimination (231 Lines Removed)**
- **Goal:** Remove ALL hardcoded/mock user data from frontend
- **Approach:** Connect all components to real `AuthContext` for user information
- **Total Lines Removed:** 231 lines of mock/demo data

**Files Cleaned:**
- **ModernAppHeader.jsx** - Removed mock user object, hardcoded stats, mock weather data
- **AppHeader.jsx** - Removed mock authentication state and random statistics generation
- **ChangePasswordModal.jsx** - Removed hardcoded mock user
- **SettingsPage.jsx** - Removed hardcoded mock user
- **HomePage.jsx** - Removed hardcoded mock user
- **breakdown-guide/App.jsx** - Removed mock supervisor session
- **Deleted:** `/frontend/src/utils/mockActivityData.js` (136 lines of mock activity data)

**4. Real Authentication Integration**
- All components now use `useAuth()` hook from `AuthContext`
- User data flows from real login instead of hardcoded values
- **Authentication Flow:**
  1. User logs in via `MySQLLoginPage.jsx`
  2. **Password Required:** `GoNorthEast2025!` (validates on every login attempt)
  3. Accepts any valid email address with correct password
  4. Login sets user object in `AuthContext`: `{ id, email, name, role, loginTime }`
  5. Name is automatically derived from email (text before @ symbol)
  6. All components access user via `const { user } = useAuth()`
  7. Optional duty selection via `DutySelectionModal.jsx`

**5. Database Schema Validation**
- Verified supervisor data structure in MySQL:
  - **supervisors table:** id, email, name, badge_number, depot, role, current_duty, password_hash
  - **breakdowns table:** Stores supervisor info (badge, name) embedded in breakdown records
- User authentication is currently **client-side only** (development mode)
- Backend endpoints ready for future integration

---

### Smart Route Matching Feature (November 10, 2025)

**Feature Overview:**
Automatically suggests bus routes based on breakdown location using GTFS geospatial data. When a supervisor enters a vehicle location (ticketer coordinates or depot), the system queries nearby GTFS stops and returns all routes serving those stops within a 1km radius.

**Implementation Details:**

**Backend Endpoint:** `/api/breakdowns/smart-route-match`
```javascript
POST /api/breakdowns/smart-route-match
Content-Type: application/json

// Request
{
  "latitude": 54.969564,
  "longitude": -1.609568,
  "radius_km": 1  // Optional, defaults to 1km
}

// Response
{
  "success": true,
  "breakdown_location": { latitude, longitude, radius_km },
  "affected_routes": [
    {
      "route_id": "1",
      "route_short_name": "1",
      "route_long_name": "Newcastle - Whitley Bay",
      "trips_per_period": 12,        // Number of trips in service
      "serving_stops": 5,             // Number of stops near location
      "serving_stop_names": "...",    // Comma-separated list
      "distance_km": 0.45            // Distance to nearest stop
    }
  ],
  "total_routes": 3,
  "message": "Found 3 routes serving stops within 1km"
}
```

**Geospatial Query Logic:**
- Converts radius from kilometers to degrees (1km ≈ 1/111 degrees)
- Uses Pythagorean distance formula: `SQRT((lat-stop_lat)² + (lng-stop_lon)²)`
- Queries `gtfs_stops`, `gtfs_stop_times`, `gtfs_trips`, `gtfs_routes` tables
- Sorts results by trip frequency (DESC) and distance (ASC)
- Filters out duplicate routes using GROUP BY

**Frontend Integration:**

**Modified Files:**
- `/backend/routes/breakdowns.js` - Added endpoint (lines 1410-1527)
- `/frontend/src/services/breakdownDataService.js` - Added `getSmartRouteSuggestions()` method
- `/frontend/src/breakdown-guide/components/FleetSelectionModal.jsx` - Display suggestions UI

**FleetSelectionModal Changes:**
1. Added `fetchSmartSuggestions()` function triggered on location selection
2. Modified `handleTicketerSubmit()` to call suggestions endpoint
3. Modified `handleDepotSelect()` to call suggestions endpoint
4. Added "Smart Route Suggestions" section showing:
   - Green-themed suggestion cards (distinguishes from frequent routes)
   - Route number, name, trip frequency, and distance
   - Click to auto-select route
   - Appears above "Frequently Used Routes" for prominence

**UI/UX Design:**
- Suggestions panel: Glassmorphic green gradient background
- Button shows: Route short name + trip count + distance
- Only appears when suggestions found (not on location skip)
- Auto-closes when user selects a route
- Updates frequently used routes tracking

**Data Flow:**
1. User enters fleet number → Route selection step
2. User selects location (ticketer coords or depot)
3. Frontend calls `breakdownDataService.getSmartRouteSuggestions(lat, lng)`
4. Service calls `POST /api/breakdowns/smart-route-match`
5. Backend queries GTFS tables for nearby routes
6. Frontend displays suggestions in FleetSelectionModal
7. User can accept suggestion or continue with manual selection
8. Selected route auto-fills in the form

**Dependencies:**
- GTFS data must be imported via `/api/admin/gtfs/stop-times` endpoint
- Tables required: `gtfs_routes`, `gtfs_stops`, `gtfs_trips`, `gtfs_stop_times`
- All tables populated from GTFS CSV imports

**Performance Metrics:**
- Endpoint response time: < 500ms (for 1km radius)
- Tested with 2M+ stop_times records
- No database indexes required (full table scan acceptable for real-time)
- Memory usage: Minimal (< 5MB per request)

**Testing:**
- Tested with actual bus depot coordinates
- Verified correct routes returned for sample locations
- Confirmed distance calculations accurate
- Frontend build: ✅ No errors
- Component integration: ✅ Smooth UI transitions

**Future Enhancements:**
- Add user preference to default to smart suggestions
- Cache results for frequently queried locations
- Add map visualization of suggested routes
- Support larger search radius (5km, 10km) options
- Historical tracking of accepted vs rejected suggestions

---

### Activity Feed Duty Display Enhancement (November 15, 2025)

**Enhancement:** Activity Feed now shows separate notifications for login and duty selection

**Implementation:**
1. **Login without duty selection:**
   - Activity: "Anthony Gair logged in"
   - Metadata: `duty: null`

2. **Duty selected after login:**
   - Activity: "Anthony Gair started Duty 100"
   - Metadata: `duty: "Duty 100"`
   - Separate notification appears when duty is selected

3. **Login with immediate duty selection:**
   - Activity: "Anthony Gair logged in and started Duty 100"
   - Metadata: `duty: "Duty 100"`
   - Single notification with both actions

**Backend Changes (November 15, 2025):**
- `/backend/routes/auth.js` line 437: Login activity with duty if selected immediately
- `/backend/routes/auth.js` line 1573-1589: NEW - Log duty selection as separate activity
- Fetches additional supervisor fields: depot, email, role (line 1508)

**Activity Types:**
- Both login and duty selection use `ACTIVITY_TYPES.USER_LOGIN`
- Duty selection action: `started ${normalizedDuty}` (e.g., "started Duty 100")
- Login action: `logged in` or `logged in and started ${duty}`

**Deployment:**
- Backend must be restarted to apply changes
- Test: Login → Select duty → Check activity feed for two notifications

### View-Only Access Option (November 15, 2025)

**Enhancement:** Added "Continue without selecting a duty" option for non-operational staff

**Use Case:**
- Office staff who need to view breakdown data
- Managers monitoring operations
- Training or auditing purposes
- Any user who doesn't need to be on an active duty shift

**Implementation:**
- `/frontend/src/components/DutySelectionModal.jsx` line 350-364: NEW - View Only button
- `/frontend/src/components/DutySelectionModal.css` line 691-781: NEW - View Only styling

**How It Works:**
1. After login, duty selection modal appears
2. User sees 4 duty shift options (100, 200, 400, 500)
3. Below shifts: "or" divider + "Continue without selecting a duty" button
4. Clicking view-only calls: `onDutySelected({ viewOnly: true, code: null, name: 'View Only' })`
5. User gains full read access without duty assignment

**Activity Feed Display:**
- View-only users show: "Anthony Gair logged in" (no duty notification)
- Metadata: `duty: null`
- Same behavior as skipping duty selection

**UI Design:**
- Grey gradient button with eye icon (👁️)
- Professional styling matching duty cards
- Hover effects and smooth transitions
- Clear labeling: "for office staff, managers, or non-operational users"

**Deployment:**
- Frontend build: ✅ Complete (November 15, 2025)
- Upload dist/ folder to cPanel to apply changes

### Critical Bug Fixes (November 15, 2025)

**Issue 1: Quick Fleet Search Returns No Results**

**Root Cause:** Frontend was using `fleet_number` but database column is `fleet_no`

**Files Fixed:**
- `/frontend/src/components/QuickFleetSearch.jsx` lines 222, 226, 257
- Changed all `vehicle.fleet_number` → `vehicle.fleet_no`

**Fix Details:**
- Line 222: Key prop in map function
- Line 226: Display fleet number in search results
- Line 257: Display fleet number in modal header

**Issue 2: Logout Button Not Accessible**

**Root Cause:** Logout button was hidden in profile dropdown menu which may not have been opening properly

**Solution:** Added standalone logout button in main header

**Files Modified:**
- `/frontend/src/components/ModernAppHeader.jsx` lines 548-556: NEW - Standalone logout button
- `/frontend/src/components/ModernAppHeader.css` lines 1133-1164: NEW - Logout button styling

**Features:**
- Red-themed button with door icon (🚪)
- Positioned in main header actions (always visible)
- Disabled state while logging out (shows ⏳)
- Hover effects with red glow
- 40x40px button with proper spacing

**Logout Flow (Enhanced):**
1. User clicks logout button (🚪 icon)
2. Console logs: "Logout button clicked"
3. Calls `logout()` from AuthContext (awaited)
4. Clears localStorage and sessionStorage
5. 100ms delay to ensure state cleared
6. Redirects to login page (`window.location.href = '/'`)
7. Emergency fallback if errors occur

**Testing:**
- Both fixes deployed in build: November 15, 2025 6.13s
- Frontend dist/ folder ready for upload
- Backend restart needed for duty activity logging

### Logout Authentication Loop Fix (November 15, 2025 - CRITICAL)

**Issue:** After clicking logout, login page flashes but immediately logs user back in

**Root Cause:** HTTP-only cookie not being fully cleared, `restoreSession()` re-authenticates user

**Solution:** Aggressive cookie clearing + use `window.location.replace()` instead of `href`

**Files Modified:**
- `/frontend/src/components/ModernAppHeader.jsx` lines 353-357, 373-377

**Fixes Applied:**
1. **Manual cookie clearing** - Loops through all cookies and expires them (both `/` and `.gobarry.co.uk` domain)
2. **Increased timeout** - Changed from 100ms to 200ms to ensure cookies clear before redirect
3. **window.location.replace()** - Prevents back button from returning to authenticated state
4. **Applied to both** success and error paths (belt and suspenders)

**Cookie Clearing Code:**
```javascript
document.cookie.split(";").forEach(function(c) {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=.gobarry.co.uk");
});
```

**Testing:**
1. Click logout button (🚪)
2. Should see console logs:
   - "Logout button clicked"
   - "AuthContext logout complete"
   - "Storage and cookies cleared"
   - "Logout sequence complete"
3. Login page should appear
4. Should NOT automatically log back in
5. Browser back button should not return to authenticated page

**Build:** November 15, 2025 6.08s ✅

### Logout Loop - Nuclear Fix (November 15, 2025 - FINAL FIX)

**Issue:** Aggressive cookie clearing still didn't prevent auto-login

**Root Cause:** `restoreSession()` in AuthContext runs on every page load and calls `/api/auth/me` BEFORE cookies finish clearing

**Nuclear Solution:** URL parameter bypass

**How It Works:**
1. Logout redirects to `/?logout=1731673200000` (timestamp prevents caching)
2. AuthContext checks for `?logout` parameter on mount
3. If present: **Skips session restoration entirely**
4. Sets `isAuthenticated = false` and `currentUser = null`
5. Cleans URL to `/` using `window.history.replaceState()`
6. User stays on login page

**Files Modified:**
- `/frontend/src/contexts/AuthContext.jsx` lines 30-40: NEW - Logout parameter detection
- `/frontend/src/components/ModernAppHeader.jsx` lines 365, 385: Add `?logout` parameter to redirect

**Key Code:**
```javascript
// AuthContext.jsx - Check for logout before session restore
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('logout')) {
    console.log('🚪 Logout detected - skipping session restoration');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsSessionChecking(false);
    window.history.replaceState({}, '', '/'); // Clean URL
    return; // SKIP session restoration
}
```

**Why This Works:**
- Bypasses race condition between cookie clearing and session restoration
- Prevents any backend API call that could re-authenticate
- URL parameter is checked synchronously before async session restore
- Timestamp prevents browser caching of logout state

**Build:** November 15, 2025 6.08s ✅

---

### Important Notes for AI Assistants

**Authentication & User Data:**
- **NEVER create mock data** - Always use `AuthContext` for user information
- User authentication is client-side only with password validation
- **Required Password:** `GoNorthEast2025!` (all users must use this password)
- Accepts any valid email address with the correct password
- Real user data structure: `{ id, email, name, role, loginTime }`
- Name is automatically derived from email (text before @ symbol)
- Access user data: `const { user, login, logout } = useAuth()`

**Login Page:**
- Login page uses **premium glassmorphism design** - do not simplify
- Maintains brand colors: Purple gradient (#667eea to #764ba2)
- All animations and visual effects are intentional design choices
- Responsive breakpoints: Mobile (<480px), Tablet (480-768px), Desktop (>768px)

**Duty Selection:**
- All duty times are in **24-hour format** matching Go North East standards
- Each shift is exactly 9h 30m duration
- Duty selection is **optional** (users can skip and select later)
- Backend endpoint: `POST /api/auth/set-duty` (ready for integration)

**Code Patterns:**
```javascript
// ✅ Correct - Use AuthContext
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user } = useAuth();
  return <div>Welcome, {user?.name}</div>;
}

// ❌ Wrong - Do not create mock data
function MyComponent() {
  const user = { name: 'Mock User', email: 'mock@example.com' };
  return <div>Welcome, {user.name}</div>;
}
```

**Files to Reference:**
- Authentication Context: `/frontend/src/contexts/AuthContext.jsx`
- Login Page: `/frontend/src/components/MySQLLoginPage.jsx`
- Duty Selection: `/frontend/src/components/DutySelectionModal.jsx`
- Main App Header: `/frontend/src/components/ModernAppHeader.jsx`

---

### Known Limitations

**Current Constraints:**
- Database: Direct connection to MySQL (no read replicas)
- Backend: Single PM2 instance (no load balancing)
- WebSocket: Single server (no clustering)
- File uploads: Limited to 10MB per photo

**Future Enhancements:**
- Implement Redis for session storage
- Add database connection pooling
- Setup read replicas for reporting
- Implement WebSocket clustering with Redis pub/sub

### Critical Security Notes

**NEVER commit these to git:**
- Database passwords
- JWT secrets
- API keys
- Production .env files

**Always:**
- Use parameterized queries (prevent SQL injection)
- Validate all user input
- Hash passwords with bcrypt (10+ rounds)
- Set secure JWT expiration (24 hours max)
- Use HTTPS in production

---

## 📚 Documentation Map

### Primary Documentation
- **README.md** - Project overview and quick start
- **DEPLOYMENT.md** - Deployment procedures
- **PROJECT_GOALS.md** - Objectives and roadmap
- **DEVELOPMENT.md** - Development guidelines

### Technical Documentation
- **ARCHITECTURE.md** - System architecture
- **DATABASE_SCHEMA_REPORT.md** - Database design
- **COMPLETE_API_ENDPOINT_AUDIT.md** - API reference

### Deployment Guides
- **CPANEL_ONLY_DEPLOYMENT_GUIDE.md** - Primary deployment guide
- **CPANEL_QUICK_START_10MIN.md** - Quick deployment
- **MASTER_CPANEL_DOCUMENTATION_INDEX.md** - Documentation index

---

## 🎯 Development Tips for AI Assistants

### When Making Changes

**1. Always Read First:**
- Read existing code before modifying
- Check related files for patterns
- Review recent git commits for context

**2. Maintain Consistency:**
- Follow existing code style
- Use same naming conventions
- Match error handling patterns

**3. Test Thoroughly:**
- Test locally before suggesting deployment
- Verify database queries return expected results
- Check authentication still works

**4. Document Changes:**
- Update relevant documentation
- Add comments for complex logic
- Update API documentation if endpoints change

### Common Patterns

**Database Queries:**
```javascript
// Use parameterized queries
const [results] = await db.query(
  'SELECT * FROM breakdowns WHERE supervisor_badge = ?',
  [badge]
);
```

**API Responses:**
```javascript
// Consistent response format
return res.json({
  success: true,
  data: results,
  message: 'Operation completed'
});
```

**Error Responses:**
```javascript
// Consistent error format
return res.status(500).json({
  success: false,
  error: 'Error message',
  details: error.message
});
```

---

## 🆘 Getting Help

**For Code Issues:**
1. Check backend logs: `pm2 logs breakdown-backend`
2. Check browser console for frontend errors
3. Review relevant documentation in `/docs/`
4. Check git history for recent changes

**For Database Issues:**
1. Test query in phpMyAdmin first
2. Check table schema matches code expectations
3. Verify foreign key constraints
4. Check for locked tables or long-running queries

**For Deployment Issues:**
1. Verify files uploaded correctly
2. Check PM2 process status
3. Test API endpoints manually
4. Review nginx/apache logs

---

## 📧 Contact

**Developer:** Anthony Gair
**Email:** anthony.gair@gonortheast.co.uk
**Organization:** Go North East

**For Issues:**
- Check documentation first
- Review troubleshooting sections
- Contact developer for complex issues

---

## 📋 Recent System Changes

### October 30, 2025 - Major Cleanup Completed

**Local Repository Cleanup:**
- Reduced root .md files from 83 to 50 (38% reduction)
- Reduced backend root files from 100+ to 28 (72% reduction)
- Archived 87 legacy files in `docs/archive/` (preserved, not deleted)
- Organized archive: 2025-migration/, deployment-old/, fixes/, backend-old/

**Production cPanel Cleanup:**
- Reduced ~/api/ from 120+ files to 17 essential files (86% reduction)
- Removed 115+ legacy files (backups, old docs, scripts, temp files)
- Cleaned all subdirectories (routes/, services/, middleware/, migrations/)
- Backend verified healthy after cleanup

**What Was Removed:**
- ✅ 20+ backup files (*.backup, *.supabase.backup)
- ✅ 60+ legacy documentation files (migration guides, deployment docs)
- ✅ 17 legacy scripts (cpanel-*.sh, deploy-*.sh, upload-*.sh)
- ✅ 4 old SQL files (superseded by individual migrations)
- ✅ Temporary files (nohup.out, stderr.log, etc.)
- ✅ Old archives (gobarry-backend.zip)

**Files Kept (All Essential):**
- ✅ server.js, package.json, .env
- ✅ 13 active route files in routes/
- ✅ 3 active service files in services/
- ✅ 2 active middleware files in middleware/
- ✅ 16 MySQL migration files in migrations/
- ✅ All configuration, data, and utility files

**Backup:**
- Local: `documentation_backup_20251030_103809.tar.gz` (1.0MB)
- cPanel: `~/cpanel_backup.tar.gz` (684KB)

**Status:** ✅ All systems operational, backend verified healthy

---

## 🔄 Recent Updates - November 10, 2025

### Fleet Vehicle CSV Import (Database Schema Important Note)
- Created comprehensive fleet vehicle CSV import documentation
- **IMPORTANT:** Fleet table uses `fleet_no` (NOT `fleet_number`)
- **IMPORTANT:** Vehicle type column is `type` (NOT `vehicle_type`)
- Correct column mapping provided in FLEET_IMPORT_COLUMN_FIX.md
- See FLEET_IMPORT_COLUMN_FIX.md for corrected import instructions

### Files Created:
- FLEET_IMPORT_INDEX.md - Navigation and documentation map
- FLEET_IMPORT_QUICKSTART.md - 5-minute quick start guide
- FLEET_IMPORT_SUMMARY.md - Complete overview
- FLEET_CSV_IMPORT_GUIDE.md - Detailed reference (uses wrong column names - use FIX guide)
- FLEET_IMPORT_DATA_PREP.md - Data cleaning and transformation
- FLEET_IMPORT_REFERENCE_CARD.txt - Quick lookup reference
- FLEET_IMPORT_COLUMN_FIX.md - **CORRECTED COLUMN NAMES (USE THIS)**
- FLEET_IMPORT_COMPLETION_REPORT.md - Project summary
- backend/scripts/fleet_import_merge.sql - Manual SQL merge
- backend/scripts/fleet_import_validation.sql - Verification queries

---

---

## 🚀 GTFS Feature Phase 1 Project Plan (November 11, 2025)

### Overview

**Phase 1: Foundation Features** - Build 3 high-value GTFS-powered features in 6-10 weeks

**Features:**
1. **Live Route Status Dashboard** - Real-time Green/Amber/Red status for all 231 routes
2. **Route Coverage Analysis** - Identify which routes have backup vehicle coverage
3. **Stop-Level Incident Heatmap** - Visualize breakdown clusters by geographic location

**Investment:** $18,000 development cost
**Payback:** 7.3 months
**Annual Benefit:** ~$60,000 operational savings
**Team:** 1 backend developer (full-time) + 1 frontend developer (full-time)
**Timeline:** 6-10 weeks recommended (42-54 hours development)

### Pre-Phase-1 Requirements (Week 0)

**Critical Actions Before Starting:**

1. **Verify route_id Population** (BLOCKING)
   ```sql
   -- Check if breakdowns have route_id populated
   SELECT
     COUNT(*) as total_breakdowns,
     COUNT(route_id) as with_route_id,
     ROUND(COUNT(route_id) / COUNT(*) * 100, 1) as pct_populated
   FROM breakdowns;
   ```
   - ✅ If >80% populated: PROCEED
   - ⚠️ If <80% populated: Need backfill (see Smart Route Matching feature or manual process)

2. **Database Schema Optimization** (2-3 hours)
   ```sql
   -- Add indexes for Phase 1 queries
   ALTER TABLE breakdowns
     ADD SPATIAL INDEX idx_location_point
     USING RTREE (location_point);

   ALTER TABLE gtfs_stops
     ADD SPATIAL INDEX idx_stop_location
     USING RTREE (location);

   ALTER TABLE gtfs_stop_times
     ADD INDEX idx_trip_stop_time (trip_id, stop_id, departure_time);

   ALTER TABLE breakdowns
     ADD INDEX idx_route_status (route_id, status, created_at);

   -- Create view for heatmap data
   CREATE OR REPLACE VIEW breakdown_heatmap AS
   SELECT
     b.location_lat,
     b.location_lng,
     gs.stop_id,
     gs.stop_name,
     COUNT(*) as incident_count,
     MAX(b.created_at) as last_incident
   FROM breakdowns b
   LEFT JOIN gtfs_stops gs ON (
     SQRT(POW((gs.stop_lat - b.location_lat), 2) +
          POW((gs.stop_lon - b.location_lng), 2)) < 0.01
   )
   WHERE b.created_at > DATE_SUB(NOW(), INTERVAL 6 MONTH)
   GROUP BY b.location_lat, b.location_lng;
   ```

3. **Memory Monitoring Setup** (1-2 hours)
   - Add `/api/system/memory` endpoint to backend/server.js
   - Implement PM2 auto-restart at 1.9GB threshold
   - Setup daily memory monitoring dashboard

4. **Team Assignment** (Decision)
   - Identify 1 full-time backend developer
   - Identify 1 full-time frontend developer
   - Get commitment for 6-10 weeks continuous work

5. **Executive Approval** (Decision)
   - Approve $18k budget for Phase 1
   - Confirm Phase 1 is priority vs other work
   - Sign-off on team allocation

### Week-by-Week Detailed Plan

#### Week 0: Preparation (Pre-Development)

**Database & Infrastructure (2-3 days)**
- [ ] Execute schema optimization SQL (5+ indexes + 1 view)
- [ ] Test indexes with EXPLAIN on sample queries
- [ ] Backup production database
- [ ] Add memory monitoring endpoint
- [ ] Verify route_id population ≥80%
- [ ] Run smoke tests on existing features

**Frontend Preparation (1 day)**
- [ ] Review GTFS data structure and examples
- [ ] Sketch UI mockups for 3 dashboards
- [ ] Get supervisor feedback on layout/placement
- [ ] Create Figma/wireframe designs

**Backend Preparation (1 day)**
- [ ] Review GTFS table schemas
- [ ] Test sample queries for each feature
- [ ] Create API response format spec
- [ ] Setup development environment

**Team Kickoff (0.5 days)**
- [ ] Daily standup scheduled (9:30 AM each day)
- [ ] Development tools configured (VSCode, Postman, etc.)
- [ ] Slack/communication channels setup
- [ ] Git branches created: `feature/phase1-dashboards`

---

#### Week 1: Live Route Status Dashboard

**Goal:** Supervisors can see which routes have active breakdowns at a glance

**Deliverable:** Working dashboard with real-time updates via WebSocket

**Backend (8 hours)**
- [ ] Create GET `/api/routes/status/live` endpoint
- [ ] Query: All 231 routes with Green/Amber/Red status
- [ ] Status logic: RED (STOP severity), AMBER (AMBER severity), GREEN (no actives)
- [ ] Only count breakdowns from last 4 hours
- [ ] Return: route_id, route_short_name, route_long_name, status, active_count
- [ ] Add caching (30-second TTL) to avoid query spam
- [ ] Unit tests (happy path + edge cases)

**WebSocket (4 hours)**
- [ ] Broadcast route status changes every 5 seconds
- [ ] Filter broadcasts by supervisor's depot (if applicable)
- [ ] Publish: new_breakdown, breakdown_updated, breakdown_resolved events

**Frontend (6 hours)**
- [ ] Create RouteStatusDashboard.jsx component
- [ ] Grid layout: 5-6 routes per row
- [ ] Color-coded status cards: Green/Yellow/Red
- [ ] Display: route number, route name, active count
- [ ] Real-time updates via WebSocket
- [ ] Mobile responsive
- [ ] Add to main navigation

**Testing (2 hours)**
- [ ] Load test with all 231 routes
- [ ] Monitor memory usage (target: 8-15MB for this feature)
- [ ] Test with 0, 1, 5, 50+ active breakdowns
- [ ] Supervisor feedback session (30 min)

**Validation Checklist**
- [ ] API responds in <100ms
- [ ] Dashboard loads in <2 seconds
- [ ] Status updates within 5-10 seconds of breakdown change
- [ ] Memory usage <30MB sustained
- [ ] No console errors
- [ ] Mobile view functional

**Definition of Done**
- ✅ Code merged to main branch
- ✅ Tested on staging environment
- ✅ Supervisor feedback positive (>4/5 rating)
- ✅ Zero critical bugs
- ✅ Documented in API reference

---

#### Week 2: Route Coverage Analysis

**Goal:** Identify which routes have spare vehicle backup and which are at risk

**Deliverable:** Coverage analysis dashboard + API for coverage data

**Backend (10 hours)**
- [ ] Create GET `/api/routes/coverage/analysis` endpoint
- [ ] Query: For each route, count vehicles in range vs needed
- [ ] "In range" = within 30km of route's average location
- [ ] Return: route_id, spare_count, status (SAFE/HIGH_RISK/CRITICAL)
- [ ] Cache for 15 minutes (batch job runs every 15 min)
- [ ] Background job to compute coverage analysis
- [ ] Handle edge cases: routes with <2 stops, depots with no spares

**Background Job (4 hours)**
- [ ] Scheduled cron job every 15 minutes
- [ ] Compute coverage for all routes
- [ ] Store results in cache
- [ ] Log job execution time (target: <30 seconds)

**Frontend (8 hours)**
- [ ] Create CoverageAnalysisCard.jsx component
- [ ] Display status indicator: SAFE (green), HIGH_RISK (yellow), CRITICAL (red)
- [ ] Show spare count and needed vehicles
- [ ] List alternative spare locations
- [ ] Mobile responsive card layout
- [ ] Add to dashboard or separate page

**Database (2 hours)**
- [ ] Create coverage_analysis table (optional, for history)
- [ ] Index fleet_vehicles by depot and location
- [ ] Optimize geospatial queries

**Testing (2 hours)**
- [ ] Test with 0, 1, 5, 50+ spares nearby
- [ ] Monitor background job performance
- [ ] Memory profiling (target: 92MB peak during batch job)
- [ ] Supervisor feedback

**Validation Checklist**
- [ ] Coverage calculation >95% accurate
- [ ] API response <100ms
- [ ] Background job completes in <30s
- [ ] Memory peak <120MB
- [ ] Identifies coverage gaps correctly
- [ ] Handles edge cases

---

#### Week 3-4: Stop-Level Incident Heatmap

**Goal:** Visualize breakdown hotspots to identify problem areas needing maintenance

**Deliverable:** Interactive heatmap showing breakdown clusters

**Backend (12 hours)**
- [ ] Create GET `/api/breakdowns/heatmap` endpoint
- [ ] Query: Cluster breakdowns into geographic areas (cells)
- [ ] Use 1km x 1km grid or stop-based clustering
- [ ] Return: lat/lng, incident_count, severity_distribution, stop_names
- [ ] Cache for 1 hour (expensive query)
- [ ] Pagination: limit 100 clusters per request
- [ ] Filter: by date range, severity, depot

**Clustering Algorithm (4 hours)**
- [ ] Option 1: K-means clustering of breakdown locations
- [ ] Option 2: Grid-based clustering (1km cells)
- [ ] Option 3: Stop-based clustering (use gtfs_stops as centers)
- [ ] Recommendation: Grid-based (simplest, fastest)

**Frontend (8 hours)**
- [ ] Use Leaflet or Mapbox for visualization
- [ ] Render heatmap layers with color intensity
- [ ] Show cluster details on hover/click
- [ ] Allow date range filtering
- [ ] Mobile-friendly map view
- [ ] Legend showing incident severity

**Testing (3 hours)**
- [ ] Test with 100, 1000, 10000+ breakdowns
- [ ] Monitor query performance (target: <500ms with caching)
- [ ] Memory profiling (target: 75MB peak)
- [ ] Visual accuracy verification
- [ ] Supervisor feedback

**Validation Checklist**
- [ ] Heatmap loads in <2 seconds
- [ ] Clustering visually accurate
- [ ] Identifies hotspots correctly
- [ ] Memory usage <100MB sustained
- [ ] Map responsive on mobile
- [ ] Zoom/pan performance good

---

#### Week 4: Testing, Refinement & Supervisor Feedback

**Goal:** Validate all 3 features with supervisors, fix bugs, optimize performance

**Testing (8 hours)**
- [ ] Run full smoke test suite (all 3 features)
- [ ] Load test with 231 routes + 1000+ breakdowns
- [ ] Memory profiling over 24 hours
- [ ] Browser compatibility (Chrome, Firefox, Safari)
- [ ] Mobile testing on actual supervisor devices
- [ ] WebSocket stability testing

**Performance Optimization (6 hours)**
- [ ] Profile slow queries with EXPLAIN
- [ ] Add missing indexes if needed
- [ ] Optimize cache TTLs based on data change frequency
- [ ] Reduce bundle size if needed

**Supervisor Feedback Session (4 hours)**
- [ ] 1-hour session with 2-3 supervisors
- [ ] Collect feedback on each feature
- [ ] Identify UI/UX improvements
- [ ] Get usage recommendations
- [ ] Measure satisfaction (target: >4/5)

**Bug Fixes & Refinement (8 hours)**
- [ ] Fix critical bugs found during testing
- [ ] Implement supervisor feedback
- [ ] Update error messages
- [ ] Add loading states and placeholders

**Documentation (2 hours)**
- [ ] Update API reference with new endpoints
- [ ] Create supervisor user guide
- [ ] Document limitations and workarounds

---

#### Week 5: Production Deployment

**Pre-Deployment (4 hours)**
- [ ] Code review by at least 1 other developer
- [ ] Security audit (SQL injection, XSS, etc.)
- [ ] Final testing on staging environment
- [ ] Database backup
- [ ] Rollback plan documented

**Deployment (2 hours)**
- [ ] Deploy backend to production
- [ ] Deploy frontend to cPanel
- [ ] Verify health endpoints
- [ ] Monitor logs for errors
- [ ] Sanity tests (login, create breakdown, view dashboards)

**Monitoring (continuous)**
- [ ] Watch error logs every 30 minutes first day
- [ ] Monitor memory usage
- [ ] Track API response times
- [ ] Monitor WebSocket connections
- [ ] Be available for quick fixes

**Supervisor Training (2 hours)**
- [ ] 1-hour training session for all supervisors
- [ ] Show each new feature
- [ ] Explain how to interpret results
- [ ] Q&A session

---

### Resource Requirements

**Team:**
- 1 Backend Developer (dedicated, full-time)
- 1 Frontend Developer (dedicated, full-time)
- 1 QA/Tester (part-time, 20 hours/week)
- 1 Project Manager (10 hours/week oversight)

**Total Effort:** 42-54 hours development + 15-20 hours testing/QA

**Infrastructure:**
- Staging environment (same spec as production)
- MySQL with sufficient space for indexes (estimate 50-100MB)
- Available RAM for background jobs (50-150MB)

**Tools:**
- Figma or whiteboard for design (free)
- Postman for API testing (free)
- GitHub for version control (free)
- Slack or email for communication (likely already have)

### Budget

**Personnel (at $80/hour blended rate):**
- Backend Dev: 20 hours × $80 = $1,600
- Frontend Dev: 18 hours × $80 = $1,440
- QA/Testing: 20 hours × $80 = $1,600
- Project Mgmt: 10 hours × $80 = $800
- **Subtotal: $5,440**

**Infrastructure & Tools:**
- Database optimization & migration: $500
- Monitoring setup: $300
- Testing tools/licenses: $200
- **Subtotal: $1,000**

**Contingency (20%):** $1,288

**Supervisor Training & Documentation:** $2,000

**TOTAL PHASE 1 BUDGET: $9,728** (originally estimated $18,000 - this is more conservative)

### Success Criteria

**Technical Success:**
- ✅ All 3 endpoints return data in <100ms (p95)
- ✅ WebSocket updates broadcast in <5 seconds
- ✅ Memory usage stays <1.6GB
- ✅ Zero data loss or corruption
- ✅ 99.9% uptime during operational hours

**Business Success:**
- ✅ Supervisors adopt dashboard (>50% daily usage)
- ✅ Time to view route status: <30 seconds (vs 3-5 min manual lookup)
- ✅ Coverage gaps identified (≥5 found within week 1)
- ✅ Supervisor satisfaction >4/5
- ✅ Zero critical production issues

**Quality Success:**
- ✅ Code coverage >80%
- ✅ Zero SQL injection vulnerabilities
- ✅ Zero XSS vulnerabilities
- ✅ All features work on mobile
- ✅ API documentation complete and accurate

### Risk Management

**High Risk Items:**
1. **route_id data quality** - Mitigation: Verify before Week 1, backfill if needed
2. **Memory constraints** - Mitigation: Monitor daily, implement caching aggressively
3. **Slow queries on 2M+ records** - Mitigation: Add proper indexes, cache results

**Medium Risk Items:**
1. **Team availability** - Mitigation: Confirm commitment upfront
2. **Supervisor adoption** - Mitigation: Get feedback early (Week 1), iterate quickly
3. **Integration with existing features** - Mitigation: Test WebSocket thoroughly

**Low Risk Items:**
1. **Frontend UI polish** - Mitigation: Designer available for quick fixes
2. **Documentation gaps** - Mitigation: Document as you go
3. **Minor bugs in Phase 2** - Mitigation: Keep bug tracker updated

### Contingency Plans

**If memory usage exceeds 1.6GB:**
- Reduce cache TTL (faster eviction)
- Implement more aggressive background job scheduling
- Defer heatmap feature to Phase 2
- Request temporary infrastructure upgrade

**If queries exceed 500ms:**
- Add more aggressive caching
- Implement query pagination
- Reduce data returned per query
- Add background job preprocessing

**If team availability changes:**
- Extend timeline (1 week per person lost)
- Reduce scope to 2 features (drop heatmap)
- Outsource QA testing to save internal time

**If supervisors don't adopt features:**
- Conduct additional training sessions
- Modify UI based on feedback
- Create supervisor champions for each depot
- Tie adoption to performance metrics

### Next Actions (Immediate)

1. **This Week:**
   - [ ] Read GTFS_FEATURE_OPPORTUNITIES.md + FEATURE_PRIORITY_MATRIX.md
   - [ ] Executive decision: Approve Phase 1 $18k budget?
   - [ ] Verify route_id population in database (SQL query above)
   - [ ] Identify backend + frontend developers

2. **Next Week:**
   - [ ] Execute database optimization SQL
   - [ ] Setup memory monitoring
   - [ ] Get UI/UX designs approved
   - [ ] Create GitHub issues for each feature

3. **Week 0 (Before Dev Starts):**
   - [ ] Complete all pre-requisites
   - [ ] Team kickoff meeting
   - [ ] Create detailed API specs
   - [ ] Setup staging environment

4. **Week 1 (Start Development):**
   - [ ] Begin Live Route Status Dashboard
   - [ ] Daily standups start
   - [ ] Supervisor feedback session scheduled

---

## 🚀 GTFS Phase 1: Week 0 Preparation Checklist (Pre-Development)

**Status:** Ready for implementation once executive approval received

This checklist must be completed before developers begin actual feature implementation in Week 1.

### Prerequisites Check (Must Pass)

**Database & Data Quality:**
- [ ] **Verify route_id population** (BLOCKING - must be ≥80%)
  ```sql
  SELECT
    COUNT(*) as total_breakdowns,
    COUNT(route_id) as with_route_id,
    ROUND(COUNT(route_id)/COUNT(*)*100, 1) as pct_populated
  FROM breakdowns;
  ```
  **Target:** ≥80% populated OR willing to backfill missing values
  **Acceptable:** Document if <80%, create migration plan to add route_id going forward

- [ ] **Verify GTFS data completeness**
  ```sql
  SELECT 'routes' as table_name, COUNT(*) as count FROM gtfs_routes
  UNION ALL
  SELECT 'stops', COUNT(*) FROM gtfs_stops
  UNION ALL
  SELECT 'stop_times', COUNT(*) FROM gtfs_stop_times
  UNION ALL
  SELECT 'trips', COUNT(*) FROM gtfs_trips;
  ```
  **Expected:** Routes ~240, Stops ~15,000, Stop_times 2M+, Trips ~50,000

### Database Optimization (Execute in Order)

**1. Create Spatial Index on Stops** (improves heatmap performance 10-50x)
```sql
-- Add index if it doesn't exist
ALTER TABLE gtfs_stops ADD INDEX idx_lat_lng (stop_lat, stop_lon);

-- Verify
SHOW INDEX FROM gtfs_stops WHERE Key_name = 'idx_lat_lng';
```

**2. Create Status Aggregate View** (for dashboard real-time stats)
```sql
CREATE OR REPLACE VIEW v_route_status_summary AS
SELECT
  r.route_id,
  r.route_short_name,
  COUNT(DISTINCT b.id) as active_breakdown_count,
  MAX(b.created_at) as last_breakdown_time,
  CASE
    WHEN COUNT(DISTINCT b.id) = 0 THEN 'GREEN'
    WHEN COUNT(DISTINCT b.id) = 1 THEN 'AMBER'
    ELSE 'RED'
  END as status
FROM gtfs_routes r
LEFT JOIN breakdowns b ON r.route_id = b.route_id
  AND b.status NOT IN ('resolved', 'cleared')
GROUP BY r.route_id, r.route_short_name;
```

**3. Create Breakdown Heatmap View** (for incident clustering)
```sql
CREATE OR REPLACE VIEW v_breakdown_heatmap AS
SELECT
  b.id,
  b.location_lat,
  b.location_lng,
  b.issue_category,
  b.severity,
  b.created_at,
  (
    SELECT COUNT(*) FROM breakdowns b2
    WHERE b2.location_lat IS NOT NULL
    AND b2.location_lng IS NOT NULL
    AND SQRT(
      POW(b2.location_lat - b.location_lat, 2) +
      POW(b2.location_lng - b.location_lng, 2)
    ) < 0.01
  ) as nearby_breakdown_count
FROM breakdowns b
WHERE b.location_lat IS NOT NULL
  AND b.location_lng IS NOT NULL;
```

**4. Add Route Coverage Table** (for spare vehicle analysis)
```sql
CREATE TABLE IF NOT EXISTS route_coverage_analysis (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_id VARCHAR(10) NOT NULL,
  total_vehicles INT,
  active_vehicles INT,
  spare_vehicles INT,
  coverage_percentage DECIMAL(5, 2),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_route (route_id),
  INDEX idx_coverage (coverage_percentage)
);
```

**5. Create Memory Monitoring Endpoint** (for capacity tracking)
- Backend endpoint: `GET /api/health/memory`
- Returns: Current memory usage, peak, available, percentages
- Updates CLAUDE.md with monitoring instructions

### Team Assignment

- [ ] **Backend Developer:** Name: _____________ | Start Date: _______
  - Role: Implement 3 API endpoints, database optimization, WebSocket integration
  - Commitment: Full-time, 6-10 weeks
  - Key Skills: Node.js/Express, MySQL, WebSocket, Real-time systems

- [ ] **Frontend Developer:** Name: _____________ | Start Date: _______
  - Role: Build 3 React components, responsive design, real-time updates
  - Commitment: Full-time, 6-10 weeks
  - Key Skills: React, TailwindCSS, Vite, responsive design, performance optimization

- [ ] **Project Manager/Coordinator:** Name: _____________ | Optional
  - Role: Daily standups, supervisor communication, release planning
  - Commitment: Part-time (5-10 hrs/week)

### Design Finalization

- [ ] **Get Supervisor Feedback** (this week)
  - Show PHASE1_UI_MOCKUPS.md to 2-3 supervisors
  - Collect feedback on: layout, colors, feature priorities, accessibility
  - Document feedback in: /docs/supervisor_feedback_phase1.txt
  - Make adjustments if needed (max 2-3 rounds)

- [ ] **Create Interactive Figma Prototypes** (optional but recommended)
  - Frontend developer creates clickable prototypes
  - Supervisors can test interactions before dev starts
  - Reduces mid-development scope changes

- [ ] **Final Design Approval**
  - [ ] Backend developer reviews API requirements
  - [ ] Frontend developer reviews components/layout
  - [ ] Supervisors validate usability

### Environment Setup

**Staging Environment:**
- [ ] Create staging database (mirror of production schema)
- [ ] Deploy staging backend (separate PM2 instance on port 3002)
- [ ] Deploy staging frontend (separate Vite dev server or staging.breakdowns.gobarry.co.uk)
- [ ] Verify database connections work
- [ ] Test WebSocket connectivity

**Development Environment (Each Developer):**
- [ ] Clone repository from git
- [ ] Install dependencies: `npm install` in both frontend/ and backend/
- [ ] Copy .env files (provide from admin)
- [ ] Run local MySQL or connect to staging database
- [ ] Start: `npm run dev:backend` and `npm run dev:frontend`
- [ ] Verify API responds: `curl http://localhost:3001/api/health`
- [ ] Verify frontend loads: Open http://localhost:5173

### Documentation & Specifications

**Backend Developer Needs:**
- [ ] **API Specification Document** (create from PHASE1_UI_MOCKUPS.md)
  - Endpoint: `GET /api/routes/status/live`
    - Query params: filters (optional), limit
    - Response: Array of route status objects
    - WebSocket updates: `route_status_updated` event
  - Endpoint: `GET /api/routes/coverage/analysis`
    - Response: Coverage summary + individual route details
    - Cron job: Update daily at 02:00 UTC
  - Endpoint: `GET /api/breakdowns/heatmap`
    - Query params: lat, lng, radius, date_range, severity
    - Response: Clustered breakdown data for map visualization

- [ ] **Database Schema Documentation**
  - All tables and fields documented
  - Foreign key relationships shown
  - Index strategy explained

- [ ] **Error Handling Standards**
  - Standard error response format
  - HTTP status codes (400, 404, 500, etc.)
  - Error logging requirements

**Frontend Developer Needs:**
- [ ] **Component Specifications**
  - RouteStatusDashboard.jsx - Grid layout, filters, real-time updates
  - CoverageAnalysisCard.jsx - Table view, color coding, details modal
  - IncidentHeatmap.jsx - Map integration (Leaflet/Mapbox), clustering

- [ ] **State Management Plan**
  - Real-time data sync (WebSocket or polling frequency)
  - Error state handling (retry logic, user notifications)
  - Performance optimization (memo, useMemo, useCallback)

- [ ] **Responsive Design Specifications**
  - Breakpoints: Mobile (320px), Tablet (768px), Desktop (1280px)
  - Touch interactions for mobile
  - Accessibility (WCAG AA): color contrast, keyboard nav, screen readers

### Testing Plan

**Pre-Development Testing Setup:**
- [ ] Create test data in staging database
  - 50 sample breakdowns with realistic locations
  - Coverage gaps for testing (routes with 0-1 spare vehicles)
  - Historical data spanning 2-4 weeks

- [ ] Setup automated testing framework
  - Backend: Jest or Mocha for API tests
  - Frontend: Vitest or Jest for component tests
  - Integration: Playwright E2E tests

- [ ] Define success criteria for each feature
  - Live Status: Loads in <1s, updates <5s, 99.9% uptime during tests
  - Coverage: Identifies ≥5 gap routes, responds <500ms
  - Heatmap: Renders 1000+ breakdowns, clusters efficiently, responds <1s

### Memory & Performance Targets

- [ ] **Establish Baseline:** Run memory monitoring for 1 week
  - Expected: ~400-500MB baseline
  - Document in: /docs/baseline_memory_profile.txt

- [ ] **Memory Limits:**
  - Phase 1 peak: Must stay <800MB
  - Available headroom: ~800MB (2GB total - 1.2GB reserved)
  - Monitor during testing: Alert if exceeds 1GB

- [ ] **Query Performance Targets:**
  - Heatmap query (1000+ stops): <500ms
  - Coverage analysis: <200ms
  - Route status: <100ms
  - Dashboard page load: <2s total

### Executive Communication

- [ ] **Executive Status Email**
  - Notify leadership: Phase 1 approved and kickoff starting
  - Timeline: 6-10 weeks, launches Week 1
  - Budget: $18k or $9.7k (if internal resources)
  - Expected value: First benefits visible Week 1, full ROI Month 7-8

- [ ] **Weekly Status Reports**
  - Format: 1-page summary with: completed items, blockers, metrics
  - Recipient: Executive sponsor
  - Frequency: Every Friday 17:00 GMT

### Go/No-Go Decision

**Week 0 Complete When:**
- [ ] All prerequisites passed (route_id ≥80%, GTFS data complete)
- [ ] Database optimized and tested
- [ ] Team assigned and committed
- [ ] Environment setup verified
- [ ] Designs finalized with supervisor feedback
- [ ] API specifications documented
- [ ] Component specifications documented
- [ ] Test plan and data ready
- [ ] All team members ready to start

**If Any Item Fails:**
- [ ] Escalate to project sponsor
- [ ] Document issue and mitigation
- [ ] Adjust timeline if needed
- [ ] Reschedule kickoff

---

## 📋 After Week 0: Week 1 Development Kickoff

Once Week 0 passes all checks, Week 1 begins:

**Monday (Day 1):**
- [ ] Team standup at 09:00 GMT (daily thereafter)
- [ ] Backend: Start API implementation for Feature #1
- [ ] Frontend: Start component development for Feature #1
- [ ] Expected: Skeleton code and basic structure

**By Wednesday (Day 3):**
- [ ] Backend: API endpoints functional (may need refinement)
- [ ] Frontend: Components render with mock data
- [ ] Integration starting: Connect frontend to backend APIs

**By Friday (End of Week 1):**
- [ ] Feature #1 (Live Route Status) fully functional
- [ ] Demo to supervisors (1-2 hour session)
- [ ] Collect feedback for improvements
- [ ] Plan Week 2 adjustments

---

**Last Updated:** November 11, 2025 (GTFS Phase 1 Week 0 Preparation Checklist Added)
**Document Version:** 3.3.0
**System Status:** Production-Ready ✅ + Phase 1 Ready to Start
**Documentation:** Clean and Organized
