# Go BARRY Breakdown Management System

> Real-time breakdown tracking and diagnostic platform for Go North East bus operations

[![Production](https://img.shields.io/badge/status-production-brightgreen)](https://breakdowns.gobarry.co.uk)
[![Version](https://img.shields.io/badge/version-3.2.1-blue)]()
[![Database](https://img.shields.io/badge/database-MySQL-orange)]()
[![Documentation](https://img.shields.io/badge/docs-clean%20%26%20organized-success)]()

**Last Updated:** November 10, 2025 (API Path Convention Fix)

**Production URLs:**
- **Frontend:** https://breakdowns.gobarry.co.uk
- **Backend API:** https://api.breakdowns.gobarry.co.uk

**📚 Documentation:**
- **[CLAUDE.md](./CLAUDE.md)** - Complete guide for AI assistants
- **[DOCUMENTATION_STANDARDS.md](./DOCUMENTATION_STANDARDS.md)** - Documentation rules (READ THIS FIRST for AIs)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment procedures
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guide

⚠️ **For AI Assistants:** Read [DOCUMENTATION_STANDARDS.md](./DOCUMENTATION_STANDARDS.md) before creating ANY new files.

---

## Overview

The Go BARRY Breakdown Management System is a production-ready web application serving 9 active supervisors across 6 depots, managing breakdown operations for a fleet of 1,000+ vehicles. The system provides real-time breakdown tracking, 20+ interactive diagnostic wizards, and comprehensive operational dashboards.

### Key Features

- **Badge-Based Authentication** - Secure login with duty shift selection (100/200/400/500)
- **Real-Time Tracking** - WebSocket-powered live dashboard updates
- **Diagnostic Wizards** - 20+ guided assessment flows for common breakdown scenarios
- **GPS Location Tracking** - Precise breakdown location capture and mapping
- **SDC Operations Dashboard** - Real-time breakdown monitoring and resolution
- **Activity Feed** - Unified activity stream with live updates
- **Analytics & Reporting** - Comprehensive KPIs and trend analysis
- **Mobile-Optimized** - Responsive design works on phones, tablets, and desktops

### Built For

- **9 Active Supervisors** across Washington, Riverside, Consett, Deptford, Percy Main, Hexham
- **1,000+ Vehicles** in the Go North East fleet
- **24/7 Operations** with duty shift tracking
- **Real-Time Coordination** between supervisors, engineers, and SDC operators

---

## Quick Start

### Prerequisites

- Node.js 18.0.0+ ([Download](https://nodejs.org/))
- MySQL 8.0+ ([Download](https://dev.mysql.com/downloads/))
- npm 9.0.0+ (included with Node.js)
- Git ([Download](https://git-scm.com/))

### Installation

**1. Clone Repository:**
```bash
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp"
```

**2. Backend Setup:**
```bash
cd backend
npm install
cp .env.cpanel.example .env
# Edit .env with your MySQL credentials
npm run dev
```

**3. Frontend Setup:**
```bash
cd ../frontend
npm install
cp .env.example .env
# Edit .env with API URL
npm run dev
```

**4. Database Setup:**
```bash
# Import schema
mysql -u root -p < backend/migrations/complete_schema.sql

# Create initial supervisor (use bcrypt to hash password)
INSERT INTO supervisors (email, name, badge_number, role, password_hash)
VALUES ('admin@example.com', 'Admin User', 'AD001', 'admin', '<bcrypt_hash>');
```

**5. Access Application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/api/health

---

## 🔴 CRITICAL: Frontend API Path Convention

### ⚠️ IMPORTANT RULE

All frontend API calls **MUST** include the `/api` prefix:

```javascript
// ✅ CORRECT - All frontend service files must use /api prefix
apiClient.get('/api/preferences')
apiClient.post('/api/breakdowns')
apiClient.get('/api/admin/fleet/import-csv')

// ❌ WRONG - Missing /api prefix (causes 404 errors)
apiClient.get('/preferences')          // 404 - Route not found!
apiClient.post('/breakdowns')          // 404 - Route not found!
```

### Why?

Backend routes are registered with `/api` prefix in Express:

```javascript
// backend/server.js
app.use('/api/preferences', authenticateSupervisor, preferencesRoutes);
app.use('/api/admin/fleet', authenticateAdmin, adminFleetRoutes);
```

Frontend service files must call the **full path** including `/api`:

**Template for any new API service:**
```javascript
// ✅ Correct Template
export const myAPI = {
  getAll: () => apiClient.get('/api/my-endpoint'),
  create: (data) => apiClient.post('/api/my-endpoint', data),
  update: (id, data) => apiClient.put(`/api/my-endpoint/${id}`, data),
  delete: (id) => apiClient.delete(`/api/my-endpoint/${id}`)
};
```

---

## Technology Stack

### Frontend
- **React 18.2** - UI framework
- **Vite 5.0** - Build tool and dev server
- **TailwindCSS 3.x** - Utility-first CSS
- **Axios** - HTTP client
- **React Router** - Client-side routing
- **Lucide React** - Icon library
- **Leaflet** - Interactive maps

### Backend
- **Node.js 18+** - Runtime environment
- **Express 4.18** - Web framework
- **MySQL 8.0+** - Primary database
- **JWT + bcrypt** - Authentication
- **WebSocket (ws)** - Real-time communication
- **cors** - Cross-origin resource sharing
- **helmet** - Security headers

### Infrastructure
- **cPanel** - Frontend hosting
- **PM2** - Backend process manager
- **MySQL** - Database (85.234.151.224)
- **HTTPS** - Secure connections

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────┐
│              React Frontend (Vite)                   │
│  - Dashboard UI                                      │
│  - Diagnostic Wizards                                │
│  - Activity Feed                                     │
│  - Real-time Updates                                 │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS REST API + WebSocket
┌───────────────────┴─────────────────────────────────┐
│           Node.js + Express Backend                  │
│  - Authentication (JWT)                              │
│  - Breakdown Management                              │
│  - WebSocket Handler                                 │
│  - Activity Logger                                   │
└───────────────────┬─────────────────────────────────┘
                    │ MySQL Protocol
┌───────────────────┴─────────────────────────────────┐
│              MySQL Database                          │
│  - supervisors, breakdowns                           │
│  - activities, wizard_progress                       │
│  - fleet_vehicles                                    │
└─────────────────────────────────────────────────────┘
```

### Key Components

**Frontend (`/frontend/`):**
- `src/components/` - Reusable UI components
- `src/pages/` - Route-level page components
- `src/services/` - API communication layer
- `src/App.jsx` - Root application component

**Backend (`/backend/`):**
- `routes/` - API endpoint handlers (165+ routes)
- `middleware/` - Authentication and validation
- `services/` - Business logic
- `config/` - Database and app configuration
- `migrations/` - Database schema versions

---

## Authentication

### Login Flow (October 2025)

The system uses a 3-step authentication process:

**Step 1: Login**
- Enter email and password
- System validates credentials with bcrypt
- Returns JWT token (24-hour expiration)

**Step 2: Select Duty**
- Modal appears with duty options:
  - **Duty 100** (00:00 - 08:00) - Night Shift
  - **Duty 200** (08:00 - 16:00) - Morning Shift
  - **Duty 400** (16:00 - 00:00) - Evening Shift
  - **Duty 500** - Variable Shift
- Can skip if not on active duty

**Step 3: Access Granted**
- Full application access
- Duty badge shown in navigation
- All actions logged with duty information

### Supervisor Roles

**Admin Users:**
- Full system access
- User management capabilities
- Analytics and reporting access
- Example: AG003 (Anthony Gair), BP009 (Barry Perryman)

**Supervisor Users:**
- Create and manage breakdowns
- Complete diagnostic wizards
- View activity feed
- Access depot-specific data

**Manager Users:**
- Read-only access to dashboards
- Analytics and reporting
- No breakdown creation/modification

---

## Core Features

### 1. Breakdown Management

**Create Breakdowns:**
- Auto-generated IDs (format: `BRK-YYYYMMDD-NNN`)
- GPS location capture
- Fleet number lookup
- Issue categorization
- Photo uploads (future enhancement)

**Track Breakdowns:**
- Real-time status updates
- Timeline view of all events
- Engineer assignment tracking
- Resolution workflow
- Audit trail

**Statuses:**
- `pending` - Initial report
- `in-progress` - Assessment underway
- `acknowledged` - SDC acknowledged
- `dispatched` - Engineer dispatched
- `on_site` - Engineer arrived
- `resolved` - Breakdown resolved

### 2. Diagnostic Wizards (20+ Types)

**Available Wizards:**
- Steering Issues
- Brake Problems
- Non-Starter
- Battery Issues
- Engine Warnings
- Cooling System
- Gearbox Problems
- Door Malfunctions
- Wheelchair Ramp
- Destination Display
- Interior/Exterior Lights
- Wipers & Screenwash
- Demister/Heaters
- Wing Mirrors
- Puncture
- Suspension
- And more...

**Wizard Flow:**
1. Select vehicle (fleet number)
2. Confirm location
3. Answer symptom questions (conditional logic)
4. Complete safety checks
5. Receive severity assessment (STOP/AMBER/CONTINUE)
6. Get action recommendations
7. Generate breakdown record

### 3. SDC Operations Dashboard

**Features:**
- Real-time breakdown cards
- Live breakdown counter
- Filter by depot, severity, status
- Quick action panels
- Engineer dispatch interface
- Breakdown resolution workflow

**Real-Time Updates:**
- New breakdowns appear instantly
- Status changes broadcast to all users
- Activity feed updates automatically
- Assessment progress tracking

### 4. Activity Feed

**Features:**
- Unified activity stream
- Real-time updates via WebSocket
- Pagination support
- Filtering (depot, actor, type, severity)
- Search functionality

**Activity Types:**
- Breakdown reported
- Wizard started/completed
- Status updated
- Engineer assigned/dispatched
- Resolution logged
- Comments added

### 5. Analytics & Reporting

**Available Metrics:**
- Total breakdowns by depot
- Average response times
- Engineer performance
- Repeat breakdown detection
- Fleet health scores
- Hourly/daily/weekly trends
- Depot comparisons
- Cost analysis

---

## API Reference

### Base URLs

**Local Development:**
```
Backend:  http://localhost:3001
Frontend: http://localhost:5173
```

**Production:**
```
Backend:  https://api.breakdowns.gobarry.co.uk
Frontend: https://breakdowns.gobarry.co.uk
```

### Authentication Endpoints

```bash
# Login
POST /api/supervisor/login
Body: { "email": "user@example.com", "password": "password" }
Response: { "token": "jwt_token", "user": {...} }

# Set Duty
POST /api/auth/set-duty
Headers: { "Authorization": "Bearer <token>" }
Body: { "duty": "100" }
Response: { "success": true, "duty": "100" }

# Get Session
GET /api/supervisor/session
Headers: { "Authorization": "Bearer <token>" }
Response: { "user": {...}, "duty": "100" }

# Logout
POST /api/supervisor/logout
Headers: { "Authorization": "Bearer <token>" }
Response: { "success": true }
```

### Breakdown Endpoints

```bash
# Create Breakdown
POST /api/breakdowns
Headers: { "Authorization": "Bearer <token>" }
Body: { "fleet_no": "6377", "location": "...", "issue": "..." }

# Get All Live Breakdowns
GET /api/breakdowns/live
Headers: { "Authorization": "Bearer <token>" }

# Get Breakdown by ID
GET /api/breakdowns/:id
Headers: { "Authorization": "Bearer <token>" }

# Update Breakdown
PUT /api/breakdowns/:id
Headers: { "Authorization": "Bearer <token>" }
Body: { "status": "resolved", "notes": "..." }

# Get Statistics
GET /api/breakdowns/stats
Headers: { "Authorization": "Bearer <token>" }
```

### Activity Endpoints

```bash
# Get Activity Feed
GET /api/activity/feed?limit=50&offset=0
Headers: { "Authorization": "Bearer <token>" }

# Get Live Activities (last 5 minutes)
GET /api/activity/live
Headers: { "Authorization": "Bearer <token>" }

# Search Activities
GET /api/activity/search?q=6377
Headers: { "Authorization": "Bearer <token>" }
```

### WebSocket Connection

```javascript
// Connect to WebSocket
const ws = new WebSocket('wss://api.breakdowns.gobarry.co.uk/ws');

// Subscribe to channel
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'breakdowns',
  token: 'jwt_token'
}));

// Receive messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle: new_breakdown, breakdown_updated, breakdown_resolved, etc.
};
```

**See `docs/COMPLETE_API_ENDPOINT_AUDIT.md` for complete API documentation (165+ endpoints).**

---

## Database Schema

### Core Tables

**supervisors** - User accounts
```sql
id, email, name, badge_number, depot, role,
password_hash, duty, is_active, created_at, updated_at
```

**breakdowns** - Breakdown records
```sql
id, breakdown_id, fleet_no, supervisor_badge,
location_description, location_lat, location_lng,
issue_category, severity, status, wizard_type,
wizard_decision, wizard_assessment_data, depot,
resolved_at, resolution_notes, created_at, updated_at
```

**activities** - Activity log
```sql
id, activity_type, timestamp, breakdown_id, fleet_no,
supervisor_name, supervisor_badge, message,
description, severity, depot, source
```

**wizard_progress** - Assessment tracking
```sql
id, supervisor_id, wizard_type, current_step,
total_steps, progress_data, status, created_at, updated_at
```

**fleet_vehicles** - Fleet data (optional)
```sql
id, fleet_no, vehicle_type, depot, make, model,
year, registration, is_active, created_at, updated_at
```

**See `docs/DATABASE_SCHEMA_REPORT.md` for complete schema documentation.**

---

## Deployment

### Backend Deployment (PM2)

**Via SSH:**
```bash
ssh user@85.234.151.224
cd ~/api
npm ci --production
pm2 restart breakdown-backend
pm2 logs breakdown-backend
```

### Frontend Deployment (cPanel)

**Build and Upload:**
```bash
# Local machine
cd frontend
npm run build

# Upload via SFTP/CyberDuck:
# Delete all files in: ~/public_html/breakdowns.gobarry.co.uk/
# Upload all files from: frontend/dist/
```

### Database Migrations

**Apply via phpMyAdmin:**
1. Login to phpMyAdmin (cPanel)
2. Select `gobarryco_breakdown` database
3. Go to SQL tab
4. Paste migration SQL from `/backend/migrations/`
5. Execute and verify

**See `docs/CPANEL_ONLY_DEPLOYMENT_GUIDE.md` for complete deployment instructions.**

---

## Development

### Project Structure

```
BreakdownGuideapp/
├── backend/           # Node.js Express API
├── frontend/          # React SPA
├── docs/             # Documentation
├── CLAUDE.md         # AI assistant guide
├── README.md         # This file
├── PROJECT_GOALS.md  # Project objectives
└── DEVELOPMENT.md    # Development guidelines
```

### Code Standards

**Backend (Node.js):**
- ES6 modules (import/export)
- Async/await for async operations
- Parameterized SQL queries
- Try-catch error handling
- Consistent API response format

**Frontend (React):**
- Functional components with hooks
- PascalCase for component files
- camelCase for utility functions
- Props validation (future: PropTypes)

### Git Workflow

```bash
# Work from main branch
git checkout main
git pull origin main

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to repository
git push origin main

# Deploy manually (see deployment guide)
```

---

## Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Login with valid credentials
- [ ] Duty selection modal appears
- [ ] Select duty and verify badge in nav
- [ ] Logout and verify session ended

**Breakdown Management:**
- [ ] Create new breakdown
- [ ] Verify auto-generated ID
- [ ] Check breakdown appears in dashboard
- [ ] Update breakdown status
- [ ] Resolve breakdown
- [ ] Verify activity feed updated

**Real-Time Updates:**
- [ ] Open dashboard in two browsers
- [ ] Create breakdown in browser A
- [ ] Verify appears in browser B instantly
- [ ] Update status in browser B
- [ ] Verify updates in browser A

### API Testing

**Using curl:**
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/supervisor/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  | jq -r '.token')

# Get breakdowns
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/breakdowns/live | jq
```

---

## Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check logs
pm2 logs breakdown-backend --lines 100

# Common causes:
# - MySQL connection failed (check .env)
# - Port in use (change PORT in .env)
# - Missing dependencies (run npm install)
```

**Frontend showing blank page:**
```bash
# Check browser console for errors
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Rebuild frontend
cd frontend
rm -rf dist node_modules/.vite
npm install
npm run build
```

**Database connection timeout:**
```bash
# Test MySQL connection
mysql -h 85.234.151.224 -u gobarryco_Gair -p gobarryco_breakdown

# Check MySQL service status
systemctl status mysql  # If root access available
```

**WebSocket not connecting:**
```bash
# Test WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://api.breakdowns.gobarry.co.uk/ws

# Check PM2 logs for WebSocket errors
pm2 logs | grep -i websocket
```

---

## Documentation

### Available Guides

**Getting Started:**
- `README.md` - This file (project overview)
- `CLAUDE.md` - AI assistant guide
- `PROJECT_GOALS.md` - Objectives and roadmap
- `DEVELOPMENT.md` - Development guidelines

**Technical Documentation:**
- `docs/CPANEL_ONLY_DEPLOYMENT_GUIDE.md` - Deployment guide
- `docs/COMPLETE_API_ENDPOINT_AUDIT.md` - API reference
- `docs/DATABASE_SCHEMA_REPORT.md` - Database design
- `docs/MASTER_CPANEL_DOCUMENTATION_INDEX.md` - Documentation index

**System Information:**
- `SYSTEM_STATUS.md` - Current system status
- `NEW_AUTH_FLOW.md` - Authentication changes
- `ARCHITECTURE.md` - System architecture (legacy)

---

## Contributing

### Development Process

1. **Check Documentation** - Read relevant docs before making changes
2. **Test Locally** - Verify changes work in local development
3. **Follow Code Standards** - Match existing patterns and conventions
4. **Update Documentation** - Keep docs in sync with code changes
5. **Test in Production** - Verify deployment after going live

### Code Review Checklist

- [ ] Code follows project standards
- [ ] All console.log statements removed (use proper logging)
- [ ] Error handling implemented
- [ ] SQL queries use parameterized statements
- [ ] API responses use consistent format
- [ ] Documentation updated if needed
- [ ] Tested locally before deployment

---

## License

**Copyright © 2025 Anthony Gair. All Rights Reserved.**

This software is proprietary and confidential. Unauthorized copying, distribution, modification, or use is strictly prohibited without explicit written permission from the author.

Licensed exclusively to Go North East for internal breakdown management operations.

---

## Support

**Developer:** Anthony Gair
**Email:** anthony.gair@gonortheast.co.uk
**Organization:** Go North East

**For Issues:**
- Check troubleshooting section above
- Review relevant documentation
- Contact developer for assistance

---

## Recent Updates

**October 30, 2025 - Documentation Overhaul**
- Created comprehensive CLAUDE.md for AI assistants
- Updated README with current system architecture
- Added PROJECT_GOALS.md with roadmap
- Created DEVELOPMENT.md with dev guidelines

**October 2025 - Duty Selection Flow**
- Implemented 3-step authentication (Login → Select Duty → Access)
- Added DutySelectionModal component
- New endpoint: POST /api/auth/set-duty
- Duty badge displayed in navigation

**October 2025 - MySQL Migration Complete**
- Migrated from Supabase to MySQL
- Replaced Supabase Auth with JWT + bcrypt
- Moved from Render.com to cPanel + PM2
- Created comprehensive deployment documentation

---

**Last Updated:** October 30, 2025
**Version:** 3.0.0
**Status:** Production-Ready ✅
