# CLAUDE.md - AI Assistant Guide

**Last Updated:** January 2026
**System Status:** Production-Ready
**Version:** 3.6.0

---

## Rules for AI Assistants

**DO NOT create new .md files** unless explicitly requested. Update existing docs instead.

---

## Project Overview

**Go BARRY Breakdown Management System** - Real-time breakdown tracking for Go North East bus operations.

- **Supervisors:** 9 across 6 depots (Washington, Riverside, Consett, Deptford, Percy Main, Hexham)
- **Fleet:** 1,000+ vehicles
- **Wizards:** 20+ diagnostic assessment flows

### Production URLs
- **Frontend:** https://breakdowns.gobarry.co.uk
- **Backend API:** https://api.breakdowns.gobarry.co.uk

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MySQL 8.0+ |
| Auth | JWT + bcrypt |
| Real-time | WebSocket (ws) |
| Hosting | cPanel + PM2 |

---

## Project Structure

```
BreakdownGuideapp/
├── backend/
│   ├── routes/           # API endpoints
│   │   ├── auth.js       # Authentication + duty selection
│   │   ├── breakdowns.js # Breakdown CRUD
│   │   ├── breakdownsAPI.js # SDC dashboard
│   │   ├── activity.js   # Activity feed
│   │   ├── analytics.js  # KPIs & reports
│   │   ├── gtfsPhase1.js # GTFS route status
│   │   └── webSocketHandler.js
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
id, email, name, badge_number, depot, role, password_hash, duty, is_active

-- breakdowns
id, breakdown_id (BRK-YYYYMMDD-NNN), fleet_no, supervisor_badge,
location_description, location_lat, location_lng, issue_category,
severity, status, wizard_type, wizard_decision, depot

-- activities
id, activity_type, timestamp, breakdown_id, fleet_no,
supervisor_name, supervisor_badge, message, severity, depot

-- GTFS tables
gtfs_routes, gtfs_stops, gtfs_trips, gtfs_stop_times
```

### Critical Column Names
- Fleet table: `fleet_no` (NOT `fleet_number`)
- Vehicle type: `type` (NOT `vehicle_type`)

---

## Authentication

### Flow
1. Login: Email + password → JWT token
2. Select Duty: Modal with Duty 100/200/400/500
3. Access Granted

### Admin Users
- AG003 (Anthony Gair), BP009 (Barry Perryman)

### Endpoints
```
POST /api/supervisor/login
POST /api/auth/set-duty
GET  /api/supervisor/session
POST /api/supervisor/logout
```

### Technical Details
- JWT stored in memory (NOT localStorage)
- 24-hour expiration
- All requests: `Authorization: Bearer <token>`

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
GET    /api/breakdowns/live      # Live breakdowns
GET    /api/breakdowns/stats     # Statistics
POST   /api/breakdowns/smart-route-match  # GTFS route suggestions
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

### Backend (PM2)
```bash
ssh user@85.234.151.224
cd ~/api
npm ci --production
pm2 restart breakdown-backend
pm2 logs breakdown-backend
```

### Frontend (cPanel)
```bash
cd frontend
npm run build
# Upload dist/ to ~/public_html/breakdowns.gobarry.co.uk/
```

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
--color-red-primary: #E30613;
--color-navy: #003B5C;
--color-success: #10B981;
--color-warning: #F59E0B;
--color-critical: #DC2626;
--color-info: #3B82F6;
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

**Times (Go North East standard):**
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

## WebSocket - Engineering Displays

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

**Always:**
- Parameterized queries (prevent SQL injection)
- Validate all user input
- bcrypt for passwords (10+ rounds)
- HTTPS in production

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Auth context | `/frontend/src/contexts/AuthContext.jsx` |
| Login page | `/frontend/src/components/MySQLLoginPage.jsx` |
| Duty selection | `/frontend/src/components/DutySelectionModal.jsx` |
| Main header | `/frontend/src/components/ModernAppHeader.jsx` |
| Breakdown modal | `/frontend/src/breakdown-guide/components/FleetSelectionModal.jsx` |
| API client | `/frontend/src/services/api-client.js` |
| Design tokens | `/frontend/src/styles/design-tokens.css` |
| Backend entry | `/backend/server.js` |
| DB config | `/backend/config/mysql.js` |
| Validation schemas | `/backend/validation/schemas.js` |

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
- `gtfs_stop_times` - Stop timing (2M+)
- `gtfs_import_log` - Import history

View for route status: `v_route_status_summary`

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

**Developer:** Anthony Gair (anthony.gair@gonortheast.co.uk)
