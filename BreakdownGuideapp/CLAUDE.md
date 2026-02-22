# CLAUDE.md - AI Assistant Guide

**Last Updated:** February 2026
**System Status:** Production-Ready
**Version:** 4.3.0

---

## Rules for AI Assistants

**DO NOT create new .md files** unless explicitly requested. Update existing docs instead.

**DO NOT add "Co-Authored-By" lines to git commits.** The developer takes full responsibility for all code.

---

## Project Overview

**Go BARRY Breakdown Management System** - Real-time breakdown tracking for bus operations.

- **Supervisors:** Multiple supervisors across depots
- **Fleet:** Large vehicle fleet
- **Wizards:** 31 diagnostic assessment flows

### Production URLs
- **Frontend:** https://breakdowns.gobarry.co.uk
- **Backend API:** https://api.breakdowns.gobarry.co.uk

---

## CRITICAL: User Context

### Who Uses This App
**SUPERVISORS use this app, NOT drivers.** This is a supervisor-facing desktop application.

- **Supervisors** sit at desktop screens in control rooms/offices
- **Supervisors** receive calls from drivers reporting breakdowns
- **Supervisors** use the diagnostic wizards to guide drivers through assessments
- **Supervisors** record breakdown incidents and coordinate responses

### Platform
- **Desktop screens** - This app is designed for desktop use, not mobile
- **Large monitors** - Optimised for supervisor workstations
- **Not a mobile app** - Do not add mobile-specific features or language

### Driver Interaction
- **Drivers call supervisors** to report issues
- **Drivers use their own handheld devices** for defect recording (separate system)
- **Supervisors instruct drivers** what to do and what to record
- When the app says "advise the driver to record on their handheld device", this means the supervisor tells the driver to use the driver's own defect reporting device

### Language Guidelines
- Use "the driver" not "you" when referring to driver actions (exception: "Suggested Script" dialog text read aloud to drivers)
- Use "advise the driver to..." for instructions meant for drivers
- Use "their handheld device" not "your device" (refers to the driver's device)
- Use "their reporting device" not bare "reporting device" (always include possessive)
- Use "the engineering team" not bare "engineering" when referring to contacting them
- Use "Record the defect" not "Record defect" (always include the article)
- Write from the supervisor's perspective, giving guidance TO drivers
- Avoid mobile-focused language (this is a desktop app)
- Avoid brand names for devices/systems - use generic terms like "handheld device" or "defect reporting system"

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MySQL 8.0+ |
| Auth | JWT + bcrypt |
| Real-time | WebSocket (ws) |
| Maps | Google Maps Platform + Leaflet |
| Hosting | cPanel + PM2 |

---

## Project Structure

```
BreakdownGuideapp/
├── backend/
│   ├── routes/           # API endpoints
│   │   ├── auth.js       # Authentication + duty selection
│   │   ├── breakdowns.js # Breakdown CRUD + replacement vehicles
│   │   ├── breakdownsAPI.js # Operations (SDC) dashboard
│   │   ├── engineerManagement.js # Engineer CRUD, shifts, dispatch
│   │   ├── engineering.js # Engineer dispatch + assignment
│   │   ├── public.js     # Unauthenticated endpoints (depot displays)
│   │   ├── activity.js   # Activity feed
│   │   ├── analytics.js  # KPIs & reports
│   │   ├── gtfsPhase1.js # GTFS route status
│   │   ├── gtfsPhase2.js # GTFS timetables, stops, trips
│   │   └── webSocketHandler.js
│   ├── services/
│   │   └── googleDirectionsService.js  # Road distance via Google Directions API
│   ├── middleware/authMiddleware.js
│   ├── config/mysql.js
│   ├── migrations/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/AuthContext.jsx
│   │   ├── dashboards/
│   │   │   ├── engineering/
│   │   │   │   ├── EngineeringDashboard.jsx
│   │   │   │   ├── EngineeringCardEnhanced.jsx
│   │   │   │   ├── EngineerManagementPage.jsx  # Engineer CRUD + shift management
│   │   │   │   ├── DispatchEngineerModal.jsx   # Named engineer dispatch
│   │   │   │   └── ShiftCheckInModal.jsx       # Daily shift check-in
│   │   │   ├── sdc/
│   │   │   │   ├── SDCDashboard.jsx            # Operations dashboard
│   │   │   │   └── components/
│   │   │   │       ├── DispatchReplacementModal.jsx  # BSOG replacement dispatch
│   │   │   │       └── ReturnToServiceModal.jsx      # Return-to-service tracking
│   │   │   ├── control-room/ControlRoomDisplay.jsx   # Display dashboard
│   │   │   └── gtfs/                                 # Route status, timetable, stop finder
│   │   ├── services/
│   │   └── styles/design-tokens.css
│   └── vite.config.js
```

---

## Database

**MySQL Connection:**
- Host: 85.234.151.224
- Port: 3306
- Database: gobarryco_breakdown
- User: gobarryco_Gair

### Core Tables

```sql
-- supervisors
id (CHAR(36) UUID), email, name, badge_number, depot, role, password_hash, duty, is_active

-- breakdowns
id, breakdown_id (BRK-YYYYMMDD-NNN), fleet_no, supervisor_badge,
location_description, location_lat, location_lng, issue_category,
severity, status, wizard_type, wizard_decision, depot

-- activities
id, activity_type, timestamp, breakdown_id, fleet_no,
supervisor_name, supervisor_badge, message, severity, depot

-- engineers
id (CHAR(36) UUID), name, badge_number, depot, home_depot_code, managed_by, is_active

-- replacement_vehicles (BSOG mileage tracking)
id, breakdown_id, replacement_fleet_no, sending_depot_code,
depot_lat/lng, breakdown_lat/lng, dead_miles, pickup_miles,
total_dead_miles, return_to_service_lat/lng, status

-- engineer_shift_templates
id, name, start_time, end_time, created_by, depot_code

-- engineer_daily_shifts
id, engineer_id, shift_date, shift_template_id, checked_in_by, depot_code, status

-- GTFS tables
gtfs_routes, gtfs_stops, gtfs_trips, gtfs_stop_times
```

### Critical Column Names
- Fleet table: `fleet_no` (NOT `fleet_number`)
- Vehicle type: `type` (NOT `vehicle_type`)
- Primary keys: `supervisors.id` and `engineers.id` are CHAR(36) UUIDs - never use `parseInt()` on them

---

## Authentication

### Flow
1. Login: Email + password → JWT token
2. Select Duty: Modal with Duty 100/200/400/500
3. Access Granted

### Roles (ENUM in DB)
- `supervisor` - Standard supervisor (default)
- `manager` - Manager privileges
- `admin` - Full admin access (AG003, BP009)
- `engineering_manager` - Engineering Manager (restricted to engineering dashboards only)

Admins can change any user's role via **Settings > Admin Controls > Supervisors > Change Role**.

### Admin Users
- AG003 (Anthony Gair), BP009 (Barry Perryman)

### Endpoints
```
POST /api/supervisor/login
POST /api/auth/set-duty
GET  /api/supervisor/session
POST /api/supervisor/logout
PUT  /api/auth/supervisor/:id    # Update supervisor (role, etc.) - admin only
```

### Technical Details
- JWT stored in **HTTP-only cookies** (XSS protection)
- User data stored in React state only (NOT localStorage)
- 24-hour expiration
- CSRF token required for POST/PUT/DELETE requests
- All requests include `credentials: 'include'` for cookie transmission

### Frontend Auth Pattern
```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();
  return <div>Welcome, {user?.name}</div>;
}
```

**NEVER create mock user data** - always use AuthContext.

---

## CRITICAL: API Path Convention

**All frontend API calls MUST include `/api` prefix:**

```javascript
// ✅ CORRECT
apiClient.get('/api/preferences')
apiClient.post('/api/breakdowns')
apiClient.get('/api/admin/fleet/import-csv')

// ❌ WRONG - Returns 404!
apiClient.get('/preferences')
apiClient.post('/breakdowns')
```

**Why:** Backend routes are mounted at `/api/*` in Express:
```javascript
app.use('/api/preferences', preferencesRoutes);
app.use('/api/breakdowns', breakdownsRoutes);
```

---

## Core Features & Key Endpoints

### Breakdowns
```
POST   /api/breakdowns           # Create
GET    /api/breakdowns/:id       # Get by ID
PUT    /api/breakdowns/:id       # Update
GET    /api/breakdowns/live      # Live breakdowns (includes replacement_vehicle data)
GET    /api/breakdowns/stats     # Statistics
POST   /api/breakdowns/smart-route-match  # GTFS route suggestions
```

### Replacement Vehicles (BSOG Mileage)
```
POST   /api/breakdowns/:id/replacement               # Dispatch replacement (calculates dead miles via Google Directions)
PUT    /api/breakdowns/:id/replacement/return-to-service  # Mark return-to-service (calculates pickup miles)
GET    /api/breakdowns/:id/replacement               # Get replacement status
GET    /api/breakdowns/:id/replacement/route-stops    # Nearby stops for return-to-service selection
```

### Engineer Management
```
GET    /api/engineer-management/engineers             # List engineers
POST   /api/engineer-management/engineers             # Create engineer
PUT    /api/engineer-management/engineers/:id         # Update engineer
GET    /api/engineer-management/shift-templates       # List shift templates
POST   /api/engineer-management/shift-templates       # Create shift template
GET    /api/engineer-management/on-shift              # Today's on-shift engineers
GET    /api/engineer-management/on-shift/:depotCode   # On-shift by depot
POST   /api/engineer-management/check-in              # Bulk check-in engineers for shift
```

### Engineering
```
POST   /api/engineering/assign         # Dispatch engineer (named or anonymous)
POST   /api/engineering/calculate-eta   # Auto-calculate road ETA from depot to breakdown
```

### Public (No Auth)
```
GET    /api/public/breakdowns    # Active breakdowns for depot displays
```

### Activity Feed
```
GET    /api/activities           # Get activities (paginated)
```

### Analytics
```
GET    /api/analytics/dashboard  # KPIs
GET    /api/analytics/trends     # Trend analysis
```

### GTFS Route Status
```
GET    /api/gtfs/routes/status/live      # All routes with status
GET    /api/gtfs/routes/:routeId/status  # Specific route
```

### Admin (AG003, BP009 only)
```
POST   /api/admin/fleet/import-csv
GET    /api/admin/fleet/import-template
POST   /api/admin/gtfs/routes
POST   /api/admin/gtfs/stops
POST   /api/admin/gtfs/trips
POST   /api/admin/gtfs/stop-times
```

### WebSocket Events
- `new_breakdown`, `breakdown_updated`, `breakdown_resolved`, `engineer_assigned`

---

## Development Commands

### Backend (localhost:3001)
```bash
cd backend
npm install
npm run dev    # nodemon
```

### Frontend (localhost:5173)
```bash
cd frontend
npm install
npm run dev    # Vite
npm run build  # Production build
```

---

## Deployment

### Frontend (cPanel)
```bash
cd frontend
npm run build
# Upload dist/ to ~/public_html/breakdowns.gobarry.co.uk/ via Cyberduck
```

### Backend (cPanel via Cyberduck)
```bash
cd backend
npm run build:deploy   # Creates backend/deploy/ folder with all needed files
# Upload contents of backend/deploy/ to ~/api/ on server via Cyberduck
# Then on server:
npm ci --production
pm2 restart breakdown-backend
```

The `build:deploy` script (`backend/scripts/build-deploy.sh`) packages server.js, routes/, middleware/, config/, services/, utils/, validation/, data/, migrations/, .htaccess, package.json, and package-lock.json. It excludes node_modules, .env, .DS_Store, and dev files. The `deploy/` folder is gitignored.

### Database Migrations
Apply via phpMyAdmin → SQL tab

---

## Code Patterns

### Backend - Database Queries
```javascript
// Always use parameterized queries
const [results] = await db.query(
  'SELECT * FROM breakdowns WHERE supervisor_badge = ?',
  [badge]
);
```

### Backend - API Responses
```javascript
// Success
res.json({ success: true, data: results, message: 'Done' });

// Error
res.status(500).json({ success: false, error: 'Failed', details: error.message });
```

### Backend - Async Routes
```javascript
router.post('/api/breakdowns', async (req, res) => {
  try {
    const breakdown = await createBreakdown(req.body);
    res.json({ success: true, breakdown });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Failed' });
  }
});
```

### Frontend - Component Structure
```javascript
import React, { useState, useEffect } from 'react';

export default function BreakdownCard({ breakdown }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="breakdown-card">
      {/* JSX */}
    </div>
  );
}
```

---

## Design System

**Files:**
- `frontend/src/styles/design-tokens.css` - 150+ CSS variables
- `frontend/src/styles/components.css` - 40+ component classes

### Color Tokens
```css
--color-primary: #0097A7;            /* Ocean Teal */
--color-primary-dark: #00838F;
--color-primary-darker: #006064;
--color-accent: #00BCD4;             /* Cyan highlight */
--color-success: #10B981;
--color-warning: #F59E0B;
--color-critical: #D32F2F;
--color-info: #1976D2;
```

### Usage
```css
.my-component {
  color: var(--color-text-primary);
  padding: var(--spacing-lg);
  background: var(--color-red-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

### Component Classes
```html
<button class="btn btn-primary">Action</button>
<div class="card card--glass">Content</div>
<input class="form-input" type="text" />
```

---

## Duty Selection

**Standard Duty Times:**
- Duty 100: Early (06:00-15:30)
- Duty 200: Day (07:30-17:00)
- Duty 400: Late (12:30-22:00)
- Duty 500: Night (14:45-00:15)

Optional - users can skip or select "View Only".

---

## Smart Route Matching

Automatically suggests routes based on breakdown GPS location.

```javascript
// Request
POST /api/breakdowns/smart-route-match
{ "latitude": 54.969564, "longitude": -1.609568, "radius_km": 1 }

// Response
{
  "success": true,
  "affected_routes": [
    { "route_short_name": "1", "route_long_name": "Newcastle - Whitley Bay", "trips_per_period": 12 }
  ]
}
```

Uses GTFS tables: `gtfs_stops`, `gtfs_stop_times`, `gtfs_trips`, `gtfs_routes`

---

## Engineering System

### Engineer Management Page
Path: `/dashboards/engineering/manage`

Features:
- **Engineer CRUD** - Add/edit/deactivate engineers with depot assignment and skills
- **Shift templates** - Define reusable shift patterns (name, start/end time, depot)
- **Daily shift check-in** - Bulk check-in engineers at start of shift
- **On-shift roster** - View who's currently on shift by depot
- **Dispatch modal** - Select on-shift engineer for breakdown dispatch with auto-calculated ETA
- **Live ETA countdown** - Real-time countdown badge on Engineering, Operations, and Display dashboards

Skills tracked: Electrical, Mechanical, HVAC, Body, EV/Hybrid, Diagnostics, Brakes, Transmission, Doors, Suspension

### Engineer Live ETA Countdown

When an engineer is dispatched, a live countdown timer shows time remaining until estimated arrival.

**Auto-ETA calculation:**
- Dispatch modal auto-calculates road ETA via `POST /api/engineering/calculate-eta`
- Uses Google Directions API (same `googleDirectionsService.js` as replacement vehicles)
- Fallback: straight-line distance with road factor if Google API unavailable
- Manual override always available

**Countdown component** (`frontend/src/components/EngineerEtaCountdown.jsx`):
- Ticks every second from `engineer_dispatched_at + engineer_eta_minutes`
- 4 urgency levels: teal (>10m) / yellow (5-10m) / orange (1-5m) / red pulsing (overdue)
- Compact mode (badge) and full mode
- Renders nothing when engineer is on site

**Visible on:**
- Engineering dashboard cards (compact badge)
- Operations (SDC) card header (compact badge)
- Display (Control Room) engineer section (full mode, replaces static "EN ROUTE")

**API fields** (returned by `/api/breakdowns/live` and `/api/public/breakdowns/live`):
- `engineer_dispatched_at` - ISO timestamp when engineer was dispatched
- `engineer_eta_minutes` - estimated travel time in minutes
- `engineer_name` - dispatched engineer's name
- `engineer_on_site_at` - ISO timestamp when engineer arrived (countdown stops)

### Depot Display URLs (Public - No Auth Required)
Engineers access depot-specific displays via:
```
/dashboards/engineering/display              # All depots
/dashboards/engineering/display?depot=Washington
/dashboards/engineering/display?depot=Riverside
/dashboards/engineering/display?depot=Consett
/dashboards/engineering/display?depot=Deptford
/dashboards/engineering/display?depot=Percy%20Main
/dashboards/engineering/display?depot=Hexham
```

These are accessible from the avatar menu under "Engineering" submenu.

### Role-Based Access: engineering_manager
Users with the `engineering_manager` role are restricted to engineering dashboards only:
- Can access: `/dashboards/engineering`, `/dashboards/engineering/manage`
- Cannot access: Operations, Display, GTFS, Fleet Defects dashboards
- "Report Breakdown" button hidden from menu
- Enforced by `EngineeringGuard` component in `DashboardRouter.jsx`

### WebSocket - Engineering Displays

Depot-filtered breakdowns:
```javascript
// Display connects with depot param
ws://api.breakdowns.gobarry.co.uk/ws?displayId=ENG1&depot=Washington

// Methods in webSocketHandler.js:
sendInitialBreakdownDataByDepot()
broadcastBreakdownByDepot()
broadcastToEngineeringDisplays()
```

---

## Replacement Vehicles (BSOG Dead Mileage)

Tracks non-revenue mileage when a replacement bus is dispatched to cover a broken-down vehicle.

**Flow:**
1. Supervisor dispatches replacement from Operations dashboard (selects fleet no + sending depot)
2. Backend calculates **dead miles** (depot -> breakdown location) via Google Directions API
3. When replacement enters service, supervisor marks "Return to Service" (selects a nearby stop or enters coords)
4. Backend calculates **pickup miles** (breakdown -> return-to-service point)
5. Total dead miles = dead miles + pickup miles (for BSOG reporting)

**Google Directions Service** (`backend/services/googleDirectionsService.js`):
- Uses Node.js `https` module (not fetch) for cPanel compatibility
- In-memory cache (500 entries, 3-decimal precision ~110m)
- Returns distance in miles + duration in minutes
- Requires `GOOGLE_DIRECTIONS_API_KEY` env var

**Frontend components:**
- `DispatchReplacementModal` - Select fleet no + depot, shows calculated dead miles
- `ReturnToServiceModal` - Pick nearby stop or enter coords, shows pickup miles

---

## Dashboard Naming

User-facing labels were renamed (internal filenames kept for stability):
- **SDC** -> **Operations** (user-facing label in `SDCDashboard.jsx`)
- **Control Room** -> **Display** (user-facing label in `ControlRoomDisplay.jsx`)

Route paths remain unchanged: `/dashboards/sdc`, `/dashboards/control-room`

---

## Common Issues

### Backend Won't Start
```bash
pm2 logs breakdown-backend --lines 100
# Check: MySQL credentials, port conflicts, dependencies
```

### Frontend Showing Old Code
```bash
Cmd+Shift+R  # Hard refresh
rm -rf frontend/node_modules/.vite && npm run build
```

### Database Connection Timeout
```bash
mysql -h 85.234.151.224 -u gobarryco_Gair -p gobarryco_breakdown
# Check connection pool in backend/config/mysql.js
```

### WebSocket Not Connecting
Check PM2 logs, verify nginx proxy headers for WebSocket upgrade.

---

## Security

**Never commit:**
- Database passwords
- JWT secrets
- API keys
- Production .env files
- Hardcoded user credentials

**Always:**
- Parameterized queries (prevent SQL injection)
- Validate all user input
- bcrypt for passwords (10+ rounds)
- HTTPS in production
- Use AuthContext for authentication (`auth-service.js` has been deleted)

### CSRF Protection
CSRF tokens are required for all POST/PUT/DELETE requests:
```javascript
// Frontend fetches CSRF token before login
const csrfResponse = await fetch(`${apiUrl}/api/auth/csrf-token`, {
  credentials: 'include'
});
const { csrfToken } = await csrfResponse.json();

// Include in request header
headers: { 'CSRF-Token': csrfToken }
```

**Cookie Settings (server.js):**
- Production: `secure: true`, `sameSite: 'none'`, `domain: '.gobarry.co.uk'`
- Development: `secure: false`, `sameSite: 'lax'`, no domain restriction

### SQL Injection Protection (QueryBuilder)
The `backend/utils/queryHelpers.js` includes:
- **Table whitelist** - Only allowed tables can be queried
- **Column validation** - Regex `/^[a-zA-Z_][a-zA-Z0-9_]*$/`
- **ORDER BY validation** - Only ASC/DESC allowed

### Security Audit (February 2026)
Fixed critical vulnerabilities:
- Deleted `auth-service.js` (contained hardcoded credentials) - use AuthContext instead
- Deleted `generate-password-sql.js` and `setup-supervisor-passwords.js` (contained plaintext passwords)
- Removed exposed password from `AuthContext.jsx` comments
- Added SQL injection protection to QueryBuilder
- Locked `/api/diagnostics` endpoint behind admin auth
- Removed stack trace from error responses

### Wizard Wording Audit (February 2026)
Audited all 30+ diagnostic wizards for text quality:
- Fixed wrong perspective ("you/your") to supervisor voice ("advise the driver to...")
- Fixed duplicate words ("procedures procedures"), grammar ("states" → "state")
- Added missing articles ("Record defect" → "Record the defect", "in reporting device" → "in their reporting device")
- Standardised "safety checks guidance/procedure" → "safety procedures" across all wizards
- Added "Advise the driver to..." framing to bare imperative instructions
- Fixed informal language ("steer clear" → "keep clear") and subjective phrasing

### Performance Optimisation (February 2026)
Code splitting with `React.lazy` reduced initial JS bundle from 2,639 kB to 412 kB (84%):
- **DashboardRouter.jsx** - All 9 dashboards lazy-loaded with `<Suspense>` fallback
- **App.jsx** - 5 heavy route components lazy-loaded (BreakdownGuideApp, FleetIntelligenceDashboard, EngineeringDisplay, HomePage, SettingsPage)
- **breakdown-guide/App.jsx** - All 31 wizard components lazy-loaded
- **dashboards/index.js** - Removed eager dashboard re-exports that defeated lazy loading
- **index.html** - TypeKit fonts loaded async via `<link rel="preload">` (eliminates 600ms render block)
- **.htaccess** - Aggressive caching (1 year for hashed assets, fonts, images), gzip for all text types

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Auth context | `/frontend/src/contexts/AuthContext.jsx` |
| Login page | `/frontend/src/components/MySQLLoginPage.jsx` |
| Duty selection | `/frontend/src/components/DutySelectionModal.jsx` |
| User menu (avatar) | `/frontend/src/components/MinimalUserMenu.jsx` |
| Main header | `/frontend/src/components/ModernAppHeader.jsx` |
| Breakdown modal | `/frontend/src/breakdown-guide/components/FleetSelectionModal.jsx` |
| API client | `/frontend/src/services/api-client.js` |
| Design tokens | `/frontend/src/styles/design-tokens.css` |
| Dashboard router | `/frontend/src/dashboards/DashboardRouter.jsx` |
| Backend entry | `/backend/server.js` |
| DB config | `/backend/config/mysql.js` |
| Query helpers | `/backend/utils/queryHelpers.js` |
| Validation schemas | `/backend/validation/schemas.js` |
| Engineer management routes | `/backend/routes/engineerManagement.js` |
| Engineer management page | `/frontend/src/dashboards/engineering/EngineerManagementPage.jsx` |
| Dispatch engineer modal | `/frontend/src/dashboards/engineering/DispatchEngineerModal.jsx` |
| Engineer ETA countdown | `/frontend/src/components/EngineerEtaCountdown.jsx` |
| Shift check-in modal | `/frontend/src/dashboards/engineering/ShiftCheckInModal.jsx` |
| Dispatch replacement modal | `/frontend/src/dashboards/sdc/components/DispatchReplacementModal.jsx` |
| Return to service modal | `/frontend/src/dashboards/sdc/components/ReturnToServiceModal.jsx` |
| Google Directions service | `/backend/services/googleDirectionsService.js` |
| Public API routes | `/backend/routes/public.js` |
| Engineering display | `/frontend/src/dashboards/engineering/EngineeringDisplay.jsx` |
| Route status dashboard | `/frontend/src/dashboards/gtfs/LiveRouteStatusDashboard.jsx` |
| Route status card | `/frontend/src/dashboards/gtfs/RouteStatusCard.jsx` |
| Go BARRY logo | `/frontend/src/components/GoBarryLogo.jsx` |
| Admin settings (roles) | `/frontend/src/components/settings/AdminSettings.jsx` |
| Backend deploy script | `/backend/scripts/build-deploy.sh` |
| Showcase page | `/frontend/public/showcase.html` |

---

## Validation (Joi)

Implemented on 12+ endpoints. Schemas in `/backend/validation/schemas.js`.

```javascript
// Example usage in routes
router.post('/api/breakdowns', validate(schemas.createBreakdown), async (req, res) => {
  // Handler
});
```

---

## GTFS Data

5 tables imported via admin panel:
- `gtfs_routes` - Bus routes (~240)
- `gtfs_stops` - Stop locations (~15,000)
- `gtfs_trips` - Trip schedules (~50,000)
- `gtfs_stop_times` - Stop timing (2M+) - has indexes on `(stop_id, departure_time)` and `(trip_id)`
- `gtfs_import_log` - Import history

View for route status: `v_route_status_summary`

### GTFS Service ID Day Codes
Service IDs encode the day of week: `...002MF260104...` where MF=Mon-Fri, SA=Saturday, SU=Sunday. The timetable viewer parses these to offer day-type tabs.

### Route Status Dashboard (v4.0.0)
Path: `/dashboards/gtfs/routes`

Features:
- **Collapsible status groups** - RED/AMBER/GREEN with counts, GREEN collapsed by default
- **Green routes hidden by default** - "Show Operational" toggle to reveal
- **Card/Table view toggle** - Dense table view for fast scanning of 225 routes
- **Route quick-jump** - Clickable index strip to filter by first character
- **View in Control Room** - Navigates to `/dashboards/control-room` with route filter
- Dark theme matching DashboardLayout, Ocean Teal colour scheme
- CSS classes prefixed `lrs-` (dashboard) and `rsc__` (card) to avoid collisions
- Auto-refreshes every 10 seconds

---

## Logout Flow

Uses URL parameter to prevent session restore race condition:

```javascript
// AuthContext checks for ?logout param
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('logout')) {
  setIsAuthenticated(false);
  setCurrentUser(null);
  window.history.replaceState({}, '', '/');
  return; // Skip session restoration
}
```

Logout redirects to `/?logout={timestamp}`.

---

## Documentation

- **README.md** - Project overview
- **DEPLOYMENT.md** - Deployment procedures
- **DEVELOPMENT.md** - Dev guidelines
- **docs/COMPLETE_API_ENDPOINT_AUDIT.md** - Full API reference
- **docs/CPANEL_ONLY_DEPLOYMENT_GUIDE.md** - cPanel deployment

---

## Contact

**Developer:** Anthony Gair
