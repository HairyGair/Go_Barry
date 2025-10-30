# Go BARRY Codebase - Comprehensive Exploration Report

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
**Project:** Go North East Breakdown Management System
**Status:** Production-Ready
**Repository Location:** `/Users/anthony/Go BARRY App/BreakdownGuideapp`

---

## Executive Summary

Go BARRY is a **full-stack React + Node.js + MySQL/Supabase web application** for managing bus breakdowns and fleet operations at Go North East. The system is production-deployed and actively used by 13 supervisors across 6 depots.

**Key Metrics:**
- **248 Frontend files** (React/JSX components)
- **44 Backend files** (Node.js routes + services)
- **42 Diagnostic wizards** for breakdown assessment
- **50+ API endpoints**
- **Multiple deployment targets** (Render, cPanel)
- **Database Migration:** Supabase PostgreSQL → MySQL (in transition)

---

## Part 1: Directory Structure Overview

### Root Level (`/Users/anthony/Go BARRY App/BreakdownGuideapp`)

```
BreakdownGuideapp/
├── frontend/                  # React SPA (Vite)
├── backend/                   # Node.js Express API
├── database/                  # Database schemas & migrations
├── docs/                      # Documentation
├── tests/                     # Test files
├── .env                       # Root environment config
├── package.json               # Root dependencies (if monorepo)
├── README.md                  # Project overview
├── SYSTEM_STATUS.md           # Current deployment status
└── [60+ .md documentation files]
```

### Frontend Structure (`/frontend`)

**Technology Stack:**
- React 18.2.0
- Vite 5.0.8 (build tool)
- TailwindCSS 3.4.0
- React Router DOM 6.21.0
- Supabase JS client 2.39.0

**Directory Map:**

```
frontend/
├── src/
│   ├── App.jsx                          # Root application component
│   ├── main.jsx                         # Entry point
│   ├── index.css & styles/              # Global styles (26 CSS files)
│   │   ├── global-theme.css             # Color scheme definitions
│   │   ├── integrated-layout.css        # Layout improvements
│   │   └── activity-feed-override.css   # Widget overrides
│   │
│   ├── breakdown-guide/                 # Main feature modules
│   │   ├── components/                  # 29 wizard + UI components
│   │   │   ├── common/                  # Shared components
│   │   │   ├── wizards/                 # 42 diagnostic wizards
│   │   │   │   ├── SteeringWizard.js
│   │   │   │   ├── BrakesWizard.js
│   │   │   │   ├── EngineFaultWizard.js
│   │   │   │   ├── GearboxWizard.js
│   │   │   │   ├── SuspensionWizard.js
│   │   │   │   ├── ElectricalWizard.js
│   │   │   │   ├── HVACWizard.js (demister, cooling, heating)
│   │   │   │   ├── DoorsWizard.js
│   │   │   │   ├── WheelchairRampWizard.js
│   │   │   │   ├── DestinationDisplayWizard.js
│   │   │   │   ├── BatteryWizard.js
│   │   │   │   ├── PunctureWizard.js
│   │   │   │   └── [32 more wizards]...
│   │   │   ├── map/                     # Map components
│   │   │   └── FleetSelectionModal.jsx  # Fleet selection (49KB)
│   │   ├── auth/                        # Authentication components
│   │   │   ├── SupervisorLogin.jsx
│   │   │   ├── SupabaseLogin.jsx
│   │   │   └── SimpleLogin.jsx
│   │   └── styles/                      # Wizard-specific styles
│   │
│   ├── dashboards/                      # Multi-user dashboards
│   │   ├── DashboardRouter.jsx          # Dashboard routing logic
│   │   ├── TestDashboard.jsx
│   │   ├── management/                  # Management view
│   │   │   ├── ManagementDashboard.jsx
│   │   │   ├── DepotComparison.jsx
│   │   │   ├── PerformanceTrends.jsx
│   │   │   ├── FleetHealth.jsx
│   │   │   ├── ExportPanel.jsx
│   │   │   └── ExecutiveKPIs.jsx
│   │   ├── control-room/                # Control room display
│   │   │   └── ControlRoomDisplay.jsx   # Real-time breakdown view
│   │   ├── sdc/                         # SDC Operations Dashboard
│   │   │   ├── SDCDashboard.jsx
│   │   │   ├── PriorityAlerts.jsx
│   │   │   ├── RecentDecisions.jsx
│   │   │   ├── EngineeringTimerAlert.jsx
│   │   │   ├── components/              # SDC UI components
│   │   │   └── utils/                   # SDC utilities
│   │   ├── engineering/                 # Engineering dashboard
│   │   │   └── utils/
│   │   └── components/
│   │       ├── DashboardLayout.jsx
│   │       ├── StatsCard.jsx
│   │       ├── FilterBar.jsx
│   │       └── LiveIndicator.jsx
│   │
│   ├── components/                      # Shared UI components
│   │   ├── ModernAppHeader.jsx
│   │   ├── HeaderLogin.jsx
│   │   ├── ChangePasswordModal.jsx
│   │   ├── ActivityFeed.jsx             # Real-time activity stream
│   │   ├── SDC/                         # SDC-specific components
│   │   ├── notifications/               # Notification system
│   │   ├── debug/                       # Debug helpers
│   │   ├── examples/                    # Example components
│   │   ├── settings/                    # Settings panels
│   │   └── testing/                     # Testing utilities
│   │
│   ├── services/                        # API integration
│   │   ├── secureApiClient.js           # API client with auth
│   │   ├── supabaseClient.js            # Supabase integration
│   │   ├── activities/                  # Activity feed services
│   │   └── [...more services]
│   │
│   ├── contexts/                        # React Context providers
│   ├── hooks/                           # Custom React hooks
│   ├── utils/                           # Utilities & helpers
│   │   ├── pollingManager.js            # Real-time polling
│   │   ├── secureApiClient.js
│   │   ├── fix/                         # Bug fixes & patches
│   │   └── [...more utilities]
│   │
│   ├── types/                           # TypeScript type definitions
│   ├── constants/                       # App constants
│   ├── shared/                          # Shared code
│   ├── tests/                           # Test files
│   ├── data/                            # Local data files
│   │   └── gtfs/                        # GTFS data
│   ├── assets/                          # Images, logos
│   └── debug/                           # Debug utilities
│
├── public/                              # Static assets
│   ├── index.html
│   ├── manifest.json
│   └── [icons & images]
│
├── dist/                                # Build output (26 subdirs)
├── node_modules/                        # Dependencies
├── .env                                 # Development env vars
├── .env.example
├── .env.development
├── .env.production
├── vite.config.js                       # Build configuration
├── package.json                         # Dependencies spec
├── package-lock.json
├── index.html                           # HTML template
└── [deployment scripts]

**Total Files:** 167 JSX/JS files + 26 CSS files = 193 frontend source files
```

### Backend Structure (`/backend`)

**Technology Stack:**
- Node.js 18+ with Express.js 4.18.2
- MySQL 2.3.3 (via cPanel)
- Supabase PostgreSQL (legacy, being phased out)
- JWT authentication
- WebSocket (ws 8.18.3)
- Rate limiting, CORS, Helmet security

**Directory Map:**

```
backend/
├── server.js                            # Main Express app entry point
├── app.js                               # Alternative app config
│
├── config/
│   ├── mysql.js                         # MySQL connection pool
│   └── [connection configs]
│
├── routes/                              # API endpoints (19 route files)
│   ├── auth.js                          # Authentication (login, password reset)
│   ├── breakdowns.js                    # CRUD for breakdowns
│   ├── breakdownsAPI.js                 # SDC dashboard API (alternative)
│   ├── activity.js                      # Activity feed & logging
│   ├── analytics.js                     # KPIs, trends, reports
│   ├── engineering.js                   # Engineer assignment & tracking
│   ├── fleet.js                         # Vehicle/fleet data
│   ├── wizards.js                       # Diagnostic wizard logic
│   ├── supervisors.js                   # Supervisor management
│   ├── preferences.js                   # User preferences
│   ├── public.js                        # Public endpoints
│   ├── defects.js                       # Defect tracking
│   ├── webSocketHandler.js              # WebSocket event handling
│   ├── engineering/                     # Engineering-specific routes
│   │   └── [...engineering endpoints]
│   ├── [backup files: *.supabase.backup, *.backup]
│   └── [documentation: *.md]
│
├── middleware/                          # Express middleware (3 files)
│   ├── authMiddleware.js                # JWT verification, rate limiting
│   │   ├── rateLimitLogin()             # 5 attempts per 15 mins
│   │   ├── rateLimitSDC()               # 100 ops per 15 mins per user
│   │   ├── verifyToken()                # JWT validation
│   │   ├── requireSupervisor()
│   │   ├── requireAdmin()
│   │   └── healthCheck()
│   ├── validationMiddleware.js
│   └── [...other middleware]
│
├── services/                            # Business logic (3 main files)
│   ├── activityLogger.js                # Activity tracking service
│   │   ├── logActivity()                # Log to MySQL
│   │   ├── getActivities()              # Query with filters
│   │   ├── Activity types:
│   │   │   - breakdown_created
│   │   │   - assessment_completed
│   │   │   - engineer_assigned
│   │   │   - status_updated
│   │   │   - resolved
│   │   │   - password_changed
│   │   │   - etc.
│   │   └── Storage: /data/activities.json (JSON fallback)
│   ├── breakdownIdGenerator.js          # ID generation service
│   └── [queryHelpers.js, etc.]
│
├── utils/
│   └── queryHelpers.js                  # MySQL query utilities
│       ├── from(table)                  # SELECT
│       ├── insert(table, data)          # INSERT
│       ├── update(table, data, where)   # UPDATE
│       └── remove(table, where)         # DELETE
│
├── data/                                # JSON data files (4 files)
│   ├── breakdown-counter.json           # Breakdown ID counter
│   ├── fleet-database.json              # Fleet vehicle data (7.5KB)
│   ├── activities.json                  # Activity log (fallback)
│   └── audit-log.json                   # Security audit trail
│
├── migrations/                          # Database schema migrations
│   ├── 001_user_preferences.sql
│   ├── 002_fix_varchar_lengths.sql
│   ├── 003_add_password_hash.sql
│   ├── 005_wizard_progress_mysql.sql
│   ├── 006_create_engineering_tables.sql
│   ├── add_engineering_tracking_columns.sql
│   ├── add_secured_mileage_column.sql
│   ├── add_resolution_columns.sql
│   ├── fix_resolution_constraint.sql
│   └── create_cleanup_job.sql
│
├── scripts/                             # Utility scripts
│   ├── migrations/
│   └── [setup scripts]
│
├── docs/                                # API documentation
│   └── [API reference docs]
│
├── tests/                               # Test files
│   └── [test files]
│
├── middleware/
│   └── [additional middleware]
│
├── .env                                 # Production env vars
├── .env.example
├── .env.production
├── .htaccess                            # Apache configuration
├── .cpanelignore                        # cPanel deployment config
├── package.json                         # Node dependencies
├── package-lock.json
├── server.js                            # App entry
├── render.yaml                          # Render.com deployment config
└── [deployment scripts]

**Total Files:** 44 JS files (routes + services + config)
```

### Database Structure (`/database`)

```
database/
└── migrations/                          # Schema evolution files
```

---

## Part 2: Configuration Files

### Root Level Configs

#### `.env` - Root Environment
```
NODE_ENV=development
PORT=3001
SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
SUPABASE_ANON_KEY=[JWT key]
API_BASE_URL=https://breakdown-guide.onrender.com
APP_URL=https://breakdowns.gobarry.co.uk
ALLOWED_ORIGINS=https://gobarry.co.uk,https://www.gobarry.co.uk,...
ENABLE_AUTH=true
ENABLE_MOCK_DATA=false
SESSION_SECRET=breakdown_guide_production_secret_2025
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### Backend Configs

#### `backend/.env` - Production Database
```
# MySQL Configuration (PRIMARY - cPanel)
DB_HOST=85.234.151.224
DB_PORT=3306
DB_USER=gobarryco_Gair
DB_PASSWORD=[password]
DB_NAME=gobarryco_breakdown
MYSQL_CONNECTION_LIMIT=10

# JWT
JWT_SECRET=[long secret key]
JWT_EXPIRATION=24h

# Supabase (Legacy fallback)
SUPABASE_URL=[url]
SUPABASE_ANON_KEY=[key]
SUPABASE_SERVICE_KEY=[key]
```

#### `backend/package.json` - Dependencies
```json
{
  "name": "breakdown-guide-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "dependencies": {
    "@supabase/supabase-js": "^2.38.4",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "bcrypt": "^6.0.0",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "mysql2": "^2.3.3",
    "ws": "^8.18.3",
    "express-rate-limit": "^7.1.5",
    "morgan": "^1.10.0",
    "joi": "^18.0.1",
    "node-fetch": "^3.3.2",
    "pg": "^8.16.3"
  }
}
```

### Frontend Configs

#### `frontend/.env` - Frontend Config
```
VITE_SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
VITE_SUPABASE_ANON_KEY=[JWT key]
VITE_API_URL=https://api.breakdowns.gobarry.co.uk
VITE_WS_URL=wss://api.breakdowns.gobarry.co.uk
VITE_APP_URL=https://breakdowns.gobarry.co.uk
VITE_ENABLE_AUTH=true
VITE_ENABLE_MOCK_DATA=false
VITE_APP_NAME=Go North East Breakdown Guide
VITE_GOOGLE_MAPS_KEY=[API key]
VITE_WEATHER_API_KEY=21c611301aff245720d1e3f5771f4536
```

#### `frontend/package.json` - Key Dependencies
```json
{
  "name": "gne-breakdown-management-system",
  "version": "1.5.4",
  "type": "module",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.39.0",
    "react-router-dom": "^6.21.0",
    "axios": "^1.6.0",
    "socket.io-client": "^4.6.0",
    "react-hook-form": "^7.48.0",
    "react-select": "^5.8.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "recharts": "^2.10.0",
    "date-fns": "^3.0.0",
    "lucide-react": "^0.544.0",
    "react-icons": "^4.12.0",
    "react-hot-toast": "^2.4.1",
    "framer-motion": "^10.18.0",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.8",
    "vite-plugin-pwa": "^0.17.0"
  }
}
```

---

## Part 3: API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Purpose | Auth | Status |
|--------|----------|---------|------|--------|
| POST | `/api/auth/login` | Supervisor login | None | ✅ |
| POST | `/api/auth/logout` | Logout session | JWT | ✅ |
| POST | `/api/auth/change-password` | Change password | JWT | ✅ |
| POST | `/api/auth/reset-password` | Password reset | Admin | ✅ |
| GET | `/api/auth/me` | Current user info | JWT | ✅ |

### Breakdown Management (`/api/breakdowns`)

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/api/breakdowns` | Create breakdown | ✅ |
| GET | `/api/breakdowns` | List breakdowns | ✅ |
| GET | `/api/breakdowns/:id` | Get breakdown details | ✅ |
| PATCH | `/api/breakdowns/:id` | Update breakdown | ✅ |
| DELETE | `/api/breakdowns/:id` | Delete breakdown | ✅ |
| GET | `/api/breakdowns/:id/history` | Breakdown history | ✅ |

### Analytics (`/api/analytics`)

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/analytics/breakdowns` | Breakdown stats | ✅ |
| GET | `/api/analytics/trends` | Trend analysis | ✅ |
| GET | `/api/analytics/depot-comparison` | Depot metrics | ✅ |
| GET | `/api/analytics/engineer-performance` | Engineer stats | ✅ |
| GET | `/api/analytics/repeat-offenders` | Repeat breakdowns | ✅ |
| GET | `/api/analytics/kpis` | KPI dashboard | ✅ |

### Engineering Management (`/api/engineering`)

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/engineering/engineers` | List engineers | ✅ |
| POST | `/api/engineering/assign` | Assign engineer | ✅ |
| GET | `/api/engineering/assignments` | Engineer assignments | ✅ |
| PATCH | `/api/engineering/:id/eta` | Update ETA | ✅ |

### Activity Feed (`/api/activity`)

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/activity` | Get activity stream | ✅ |
| POST | `/api/activity/log` | Log activity | ✅ |
| GET | `/api/activity/search` | Search activities | ✅ |

### Wizards (`/api/wizards`)

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/wizards` | List available wizards | ✅ |
| POST | `/api/wizards/:id/start` | Start wizard | ✅ |
| PATCH | `/api/wizards/:id/progress` | Update wizard progress | ✅ |
| POST | `/api/wizards/:id/complete` | Complete wizard | ✅ |

### SDC Dashboard (`/api/sdc`)

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/sdc/breakdowns` | Current breakdowns | ✅ |
| GET | `/api/sdc/breakdown-count` | Breakdown counter | ✅ |
| POST | `/api/sdc/resolve` | Resolve breakdown | ✅ |
| GET | `/api/sdc/stats` | Dashboard stats | ✅ |

### Fleet Management (`/api/fleet`)

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/fleet/vehicles` | List vehicles | ✅ |
| GET | `/api/fleet/:id` | Vehicle details | ✅ |
| PATCH | `/api/fleet/:id` | Update vehicle | ✅ |

### Supervisor Management (`/api/supervisors`)

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/supervisors` | List supervisors | ✅ |
| GET | `/api/supervisors/:id` | Supervisor details | ✅ |
| PATCH | `/api/supervisors/:id` | Update supervisor | ✅ |

---

## Part 4: Key Integrations & External APIs

### 1. Supabase (Primary Database - Being Migrated)

**Status:** Legacy - being phased out for MySQL
**URL:** https://oieliubbvvdzhzvikzal.supabase.co
**Purpose:** PostgreSQL database, Authentication, Real-time subscriptions
**Integration Points:**
- `backend/config/supabase.js` (if exists)
- `frontend/services/supabaseClient.js`
- Authentication: JWT tokens
- Tables: supervisors, breakdowns, activities, wizard_progress

### 2. MySQL Database (Primary - Current)

**Status:** Active - Production database
**Host:** 85.234.151.224 (cPanel)
**Database:** gobarryco_breakdown
**Configuration:** `backend/config/mysql.js`
**Features:**
- Connection pooling (10 connections)
- Query helpers in `backend/utils/queryHelpers.js`
- Support for transactions
- Memory-efficient streaming

**Main Tables:**
```sql
supervisors - Authentication & user data
breakdowns - Breakdown records
activities - Activity audit trail
wizard_progress - Wizard state tracking
fleet_vehicles - Vehicle database
engineering_assignments - Engineer tracking
user_preferences - User settings
```

### 3. WebSocket (Real-time Communication)

**Library:** ws 8.18.3
**Implementation:** `backend/routes/webSocketHandler.js`
**Channels:**
- `/ws` - General updates
- `/ws/sdc-dashboard` - SDC dashboard real-time
**Events:**
- `new_breakdown` - New breakdown created
- `breakdown_updated` - Status change
- `breakdown_resolved` - Completed
- `activity_logged` - New activity
- `engineer_assigned` - Engineer dispatch

### 4. Google Maps

**API Key:** Present in `.env`
**Purpose:** Location mapping, route visualization
**Frontend:** Leaflet.js with React-Leaflet

### 5. OpenWeatherMap

**API Key:** 21c611301aff245720d1e3f5771f4536
**Purpose:** Weather integration for routing

### 6. What3Words

**Purpose:** Location encoding/decoding
**Integration:** Mentioned in docs, likely in location services

---

## Part 5: Database Schema

### Core Tables

#### `supervisors`
```sql
id (PK)
badge_number (UNIQUE)
name
email
password_hash (bcrypt)
role (admin, supervisor, manager)
depot
created_at
updated_at
last_login
is_active
```

#### `breakdowns`
```sql
id (PK) - Format: BRK-YYYYMMDD-NNN
supervisor_id (FK)
vehicle_id
location
what3words
latitude
longitude
description
status (created, assessment_started, in_progress, resolved, cleared)
severity (STOP, AMBER, CONTINUE)
wizard_type
wizard_data (JSON)
engineer_id (FK)
assigned_at
resolved_at
resolved_by
resolution_type
resolution_notes
created_at
updated_at
```

#### `activities`
```sql
id (PK)
actor_id (FK)
actor_name
actor_type (supervisor, system, engineer)
action_type (breakdown_created, assessed, assigned, resolved, etc.)
subject_id (breakdown_id, etc.)
subject_type
message
metadata (JSON)
severity (info, warning, error)
created_at
depot
```

#### `wizard_progress`
```sql
id (PK)
breakdown_id (FK)
wizard_type
current_step
responses (JSON)
status (in_progress, completed)
created_at
updated_at
```

#### `fleet_vehicles`
```sql
id (PK)
registration
fleet_number
model
type
depot
status
last_location
mileage
next_service_date
```

---

## Part 6: Frontend Components by Category

### Authentication Components
- SupervisorLogin.jsx - Badge-based login
- SupabaseLogin.jsx - Alternative auth
- SimpleLogin.jsx - Basic login form
- HeaderLogin.jsx - Top-bar login widget

### Main Wizards (42 total)

**Steering & Control:**
- SteeringWizard.js (enhanced version with logging)
- OfflineSteeringWizard.js
- EnhancedSteeringWizard.js

**Brake System:**
- BrakesWizard.js
- MobileBrakesWizard.js

**Gearbox & Transmission:**
- GearboxWizard.js
- GearSelectionWizard.js
- CuttingOutFuelWizard.js

**Electrical:**
- ExteriorLightsWizard.js
- InteriorLightsWizard.js (+ improved variant)
- WarningLightsWizard.js
- OilWarningLightWizard.js
- ABSLightWizard.js
- DestinationDisplayWizard.js
- BuzzersWizard.js

**Engine & Cooling:**
- NonStarterWizard.js
- ExcessiveSmokeWizard.js
- CoolingSystemWizard.js
- LowWaterWizard.js

**HVAC System:**
- DemistersHeatersWizard.js

**Suspension & Chassis:**
- SuspensionWizard.js
- LooseWheelNutsWizard.js

**Physical Damage:**
- BrokenWindowsWizard.js
- InteriorExteriorDamageWizard.js
- WingMirrorsWizard.js

**Mechanical:**
- PunctureWizard.js
- BatteryWizard.js
- WipersScreenwashWizard.js

**Safety & Specialized:**
- WheelchairRampWizard.js
- RepeatDefectsWizard.js
- RoadTrafficIncidentsWizard.js
- CameraEnhancedAssessmentWizard.js
- MobileGeneralAssessmentWizard.js
- RealTimeEnhancedWizard.js
- TracerItHelperWizard.js

### Dashboard Components

**Management Dashboard:**
- ManagementDashboard.jsx
- DepotComparison.jsx
- PerformanceTrends.jsx
- FleetHealth.jsx
- ExportPanel.jsx
- ExecutiveKPIs.jsx

**Control Room Display:**
- ControlRoomDisplay.jsx - Large format display

**SDC Dashboard:**
- SDCDashboard.jsx - Main operations view
- PriorityAlerts.jsx
- RecentDecisions.jsx
- EngineeringTimerAlert.jsx
- [SDC components in subdirectory]

**Engineering Dashboard:**
- Various engineering assignment components

### Supporting Components

**Common/Shared:**
- LocationDisplay.jsx (with map integration)
- LocationModal.jsx
- FleetSelectionModal.jsx (49KB - complex)
- BreakdownTracker.jsx
- ActivityFeed.jsx

**Notifications:**
- PushNotificationManager.jsx

**Testing/Debug:**
- SupabaseDebug.jsx
- Testing utilities

---

## Part 7: Real-Time Communication

### WebSocket Implementation

**Handler:** `backend/routes/webSocketHandler.js`
**Library:** ws 8.18.3

**Event Types:**
```javascript
{
  type: 'new_breakdown',
  data: { breakdown_id, ...details }
}

{
  type: 'breakdown_updated',
  data: { breakdown_id, status, ...changes }
}

{
  type: 'breakdown_resolved',
  data: { breakdown_id, resolution_type, ...details }
}

{
  type: 'activity_logged',
  data: { activity_id, actor, action, ...metadata }
}

{
  type: 'engineer_assigned',
  data: { breakdown_id, engineer_id, eta, ...details }
}
```

### Real-Time Polling

**Implementation:** `frontend/src/utils/pollingManager.js`
- Configurable polling intervals
- DEBUG_POLLING flag for development
- Activity feed auto-refresh
- Breakdown counter updates

---

## Part 8: Authentication Architecture

### Login Flow

```
User Input (Badge)
    ↓
POST /api/auth/login
    ↓
Database Lookup (MySQL supervisors table)
    ↓
Bcrypt Password Verification
    ↓
JWT Token Generation
    ↓
Send Token in Response
    ↓
Frontend stores in localStorage
    ↓
Include in Authorization header for all requests
    ↓
Middleware validates token signature
    ↓
Attach user info to req.user
```

### Active Supervisors

**Admin Users (2):**
- AG003 - Anthony Gair (Lead Developer)
- BP009 - Barry Perryman (Operations Manager)

**Supervisor Count:** 13 active accounts total
**Depots:** Washington, Riverside, Consett, Deptford, Percy Main, Hexham (6 locations)

### JWT Configuration

**Secret:** Stored in `JWT_SECRET` env var
**Expiration:** 24 hours
**Algorithm:** HS256
**Payload:**
```json
{
  "sub": "user_id",
  "id": "user_id",
  "email": "email",
  "name": "name",
  "role": "supervisor|admin|manager",
  "depot": "depot_name",
  "badge_number": "AG003",
  "aud": "authenticated",
  "iat": 1234567890,
  "exp": 1234654290
}
```

---

## Part 9: Middleware & Security

### Authentication Middleware (`backend/middleware/authMiddleware.js`)

**Functions:**
```javascript
rateLimitLogin()           // 5 attempts per 15 mins per IP:UserAgent
rateLimitSDC()             // 100 ops per 15 mins per user
clearLoginAttempts()       // Reset rate limit on success
verifyToken()              // Extract & verify JWT
requireSupervisor()        // Enforce supervisor role
requireAdmin()             // Enforce admin role
authenticateUser()         // Verify user exists
authenticateSupervisor()   // Generic supervisor auth
authenticateAdmin()        // Generic admin auth
authenticateSDC()          // SDC-specific auth
healthCheck()              // System health endpoint
logSecurityEvent()         // Security audit logging
```

### Security Features

- **Helmet.js** - HTTP header hardening
- **CORS** - Configured for specific origins only
- **Rate Limiting** - IP-based for login, user-based for operations
- **JWT** - Stateless authentication
- **Bcrypt** - Password hashing (10 salt rounds)
- **SQL Injection Prevention** - Parameterized queries
- **Session Management** - 24-hour expiration

### CORS Configuration

**Allowed Origins:**
- https://gobarry.co.uk
- https://www.gobarry.co.uk
- https://breakdowns.gobarry.co.uk
- http://localhost:5173 (dev)
- http://localhost:3000 (dev)

---

## Part 10: Services & Utilities

### Activity Logger Service (`backend/services/activityLogger.js`)

**Purpose:** Unified activity tracking across the system

**Methods:**
```javascript
logActivity(activityData)     // Log single activity
logActivities(activities)     // Batch log
getActivities(filters)        // Query with filters, pagination
searchActivities(query)       // Full-text search
```

**Storage:** MySQL + JSON fallback

**Activity Types:**
- breakdown_created
- assessment_completed
- assessment_started
- engineer_assigned
- status_updated
- resolved
- password_changed
- supervisor_login
- data_exported
- etc.

### Breakdown ID Generator (`backend/services/breakdownIdGenerator.js`)

**Format:** BRK-YYYYMMDD-NNN
**Example:** BRK-20251027-001

**Features:**
- Date-based partitioning
- Sequential numbering per day
- Duplicate prevention
- MySQL storage

### Query Helpers (`backend/utils/queryHelpers.js`)

**Functions:**
```javascript
from(table)                           // SELECT builder
insert(table, data)                   // INSERT builder
update(table, data, whereClause)      // UPDATE builder
remove(table, whereClause)            // DELETE builder
```

**Features:**
- Parameter binding (prevents SQL injection)
- Connection pooling
- Error handling
- Promise-based async/await

---

## Part 11: Known Issues & TODOs

### Identified Issues

1. **Database Migration Status**
   - Status: In Transition
   - From: Supabase PostgreSQL
   - To: MySQL (cPanel)
   - Issue: Multiple backup files indicate incomplete migration
   - Affected Files:
     - `routes/*.supabase.backup`
     - `routes/*.js.backup`
   - Recommendation: Complete migration, remove old files

2. **Legacy Code Artifacts**
   - Multiple old versions of routes (*.supabase-backup)
   - Engineering routes directory is empty
   - Backup files suggest partial rewrites

3. **Memory Management**
   - Note in docs about 2GB RAM limit awareness
   - Consider for scaling

4. **Testing Coverage**
   - `test-defects.js` appears to be test file in routes/
   - Should be moved to tests/ directory

5. **Engineering Integration**
   - `backend/routes/engineering/` exists but is empty
   - Engineering logic in main `engineering.js` instead

### Debug & Incomplete Features

**Found in Frontend:**
```javascript
// LocationDisplay.jsx
<p>DEBUG: LocationDisplay is rendering</p>

// pollingManager.js
if (window.DEBUG_POLLING) { /* debug code */ }

// SDCDashboard-OLD.jsx
// TODO: Implement API call
```

**Found in Backend:**
- Supabase fallback configuration still present
- Service worker implementation mentioned but legacy

---

## Part 12: Deployment Architecture

### Current Deployment

**Frontend:**
- Host: cPanel (breakdowns.gobarry.co.uk)
- Build: `npm run build:cpanel`
- Deployment: Manual via FTP/cPanel
- Config: `/frontend/.htaccess`

**Backend:**
- Host: Render.com (breakdown-guide.onrender.com) - OR -
- Host: cPanel (api.breakdowns.gobarry.co.uk)
- Node version: 18+
- Process: `npm start` or `node server.js`
- Config: `render.yaml` (legacy, for Render.com)

**Database:**
- Primary: MySQL @ 85.234.151.224:3306
- Legacy: Supabase PostgreSQL (phased out)

### Environment Management

**Development:**
- `.env.development` - Local config
- `ENABLE_AUTH=true`
- `ENABLE_MOCK_DATA=false`

**Production:**
- `.env` (root) - Root level config
- `backend/.env.production` - Backend config
- `frontend/.env.production` - Frontend config

### Deployment Scripts

**Frontend:**
```bash
npm run build:cpanel          # Build for cPanel
./deploy-cpanel.sh            # Deploy to cPanel
./deploy-cpanel-simple.sh     # Simple deploy script
./deploy-now.sh               # Quick deploy
```

**Backend:**
```bash
npm start                      # Production start
npm run dev                    # Development with nodemon
./start-server.sh              # Shell start script
```

---

## Part 13: Documentation Files

### Key Reference Documents

1. **README.md** (19KB) - Project overview
2. **SYSTEM_STATUS.md** - Current deployment status
3. **ARCHITECTURE.md** - System design & patterns
4. **API_REFERENCE.md** - API documentation
5. **DEPLOYMENT_GUIDE.md** - Deployment instructions
6. **DEVELOPMENT_GUIDE.md** - Developer setup
7. **REPOSITORY_STRUCTURE.md** - File organization
8. **DATABASE_ANALYSIS_REPORT.md** - DB schema analysis

### Migration Documentation

- MIGRATION_GUIDE.md - Supabase → MySQL migration
- MIGRATION_INSTRUCTIONS.md - Step-by-step guide
- MYSQL_CPANEL_MIGRATION.sql - SQL migration script
- SUPERVISORS_MIGRATION_SUMMARY.md - User data migration

### Feature Documentation

- DEFECT_INTELLIGENCE_IMPLEMENTATION.md
- FLEET_INTELLIGENCE_README.md
- ENGINEERING_DASHBOARD.md
- SDC_ANALYTICS_OPPORTUNITIES.md
- SECURED_MILEAGE_FEATURE.md

### Security Documentation

- AUTHENTICATION_SECURITY_STRATEGY.md
- SECURITY_FIXES_OCT_2025.md
- AUTH_FLOW_DIAGRAM.md

### Deployment Guides

- CPANEL_DEPLOYMENT_INSTRUCTIONS.md
- CPANEL_COMPLETE_DEPLOYMENT.md
- QUICK_DEPLOY_GUIDE.md

---

## Part 14: File Statistics & Code Metrics

### Frontend Code

| Category | Count | Size |
|----------|-------|------|
| JSX Components | 167 | ~500 KB |
| CSS Files | 26 | ~100 KB |
| Utility JS | 30+ | ~100 KB |
| Total Frontend | ~250 files | ~700 KB |

### Backend Code

| Category | Count | LOC | Size |
|----------|-------|-----|------|
| Routes | 19 | 6,500+ | ~250 KB |
| Middleware | 3 | 500+ | ~25 KB |
| Services | 3 | 800+ | ~30 KB |
| Utilities | 5+ | 300+ | ~15 KB |
| Total Backend | 44 files | 8,000+ | ~320 KB |

### Wizard Components

- **Total Wizards:** 42 diagnostic flows
- **Largest Wizard:** FleetSelectionModal.jsx (49 KB)
- **Average Size:** ~5-10 KB per wizard

### Documentation

- **Total MD Files:** 60+
- **Total SQL Files:** 20+
- **Total Configuration:** 15+ env/config files

---

## Part 15: Technology Dependencies Summary

### Frontend Stack

**Core:**
- React 18.2.0
- React-DOM 18.2.0
- React-Router-DOM 6.21.0
- Vite 5.0.8

**API & State:**
- Axios 1.6.0
- Supabase-JS 2.39.0
- Socket.IO-Client 4.6.0
- React-Query 3.39.3

**UI & Styling:**
- TailwindCSS 3.4.0
- Lucide-React 0.544.0
- React-Icons 4.12.0
- Framer-Motion 10.18.0
- React-Hot-Toast 2.4.1
- React-Modal 3.16.1

**Forms & Validation:**
- React-Hook-Form 7.48.0
- @hookform/resolvers 3.3.0
- Yup 1.3.0
- Joi (backend)

**Maps & Location:**
- Leaflet 1.9.4
- React-Leaflet 4.2.1

**Tables & Data:**
- @tanstack/react-table 8.11.0
- Recharts 2.10.0
- Date-FNS 3.0.0

**Other:**
- React-Dropzone 14.2.3
- React-Helmet-Async 2.0.4
- React-Intersection-Observer 9.5.3
- React-Datepicker 4.25.0
- React-Select 5.8.0
- React-Tooltip 5.25.0
- React-Use 17.4.2
- UUID 9.0.1
- Web-Push 3.6.6
- Workbox-Window 7.0.0

**Build Tools:**
- Vite-Bundle-Visualizer 1.0.0
- Vite-Plugin-PWA 0.17.0
- Vite-Plugin-Imagemin 0.6.1

### Backend Stack

**Core:**
- Express 4.18.2
- Node.js 18+

**Database:**
- MySQL2 2.3.3
- Pg 8.16.3 (PostgreSQL)
- @supabase/supabase-js 2.38.4

**Authentication:**
- JWT 9.0.2
- Bcrypt 6.0.0

**Security & Middleware:**
- Helmet 7.1.0
- CORS 2.8.5
- Express-Rate-Limit 7.1.5
- Morgan 1.10.0 (logging)

**Utilities:**
- Dotenv 16.3.1
- Node-Fetch 3.3.2
- Joi 18.0.1 (validation)
- WS 8.18.3 (WebSocket)

### Development Tools

**Frontend DevDeps:**
- Vitest 1.0.4 (testing)
- @vitest/ui 1.0.4
- ESLint 8.55.0
- Prettier 3.1.1
- Storybook 7.6.0
- Husky 8.0.3 (git hooks)
- TypeScript 5.3.3

**Backend DevDeps:**
- Nodemon 3.0.1

---

## Part 16: Codebase Health Assessment

### Strengths

1. **Clean Architecture**
   - Clear separation: Frontend, Backend, Database
   - Organized route handlers
   - Service-based business logic

2. **Authentication**
   - Proper JWT implementation
   - Rate limiting in place
   - Role-based access control

3. **Real-time Features**
   - WebSocket implementation
   - Activity streaming
   - Live dashboard updates

4. **Comprehensive Wizards**
   - 42 diagnostic assessment flows
   - Conditional logic implementation
   - Safety severity tracking

5. **Documentation**
   - Extensive markdown docs
   - Deployment guides
   - Architecture documentation

### Areas for Improvement

1. **Database Migration**
   - Still has Supabase fallback code
   - Multiple backup files should be cleaned
   - Complete MySQL transition needed

2. **Code Organization**
   - Some empty directories (engineering/)
   - Test files in wrong location
   - Mixed old and new implementations

3. **Frontend Testing**
   - No obvious test coverage visible
   - Debug code still in components

4. **Error Handling**
   - Need consistent error responses
   - Better error boundaries in React

5. **Monitoring**
   - No obvious monitoring/logging infrastructure
   - No APM integration visible
   - Health checks basic

---

## Part 17: Critical Files to Know

### Must-Read (Project Understanding)

1. `/backend/server.js` - Server initialization & middleware
2. `/backend/routes/auth.js` - Authentication logic
3. `/frontend/src/App.jsx` - Frontend root component
4. `/frontend/src/breakdown-guide/components/SupervisorLogin.jsx` - Login UI
5. `/backend/config/mysql.js` - Database configuration

### Must-Modify (for Development)

1. `.env` files - Configuration
2. `/backend/routes/*.js` - API endpoints
3. `/frontend/src/breakdown-guide/components/wizards/*.js` - Wizard logic
4. `/frontend/src/dashboards/*.jsx` - Dashboard views
5. `/backend/migrations/*.sql` - Database schema

### Must-Understand (Architecture)

1. `ARCHITECTURE.md` - System design
2. `SYSTEM_STATUS.md` - Current state
3. `README.md` - Project overview
4. `backend/middleware/authMiddleware.js` - Auth flow
5. `backend/services/activityLogger.js` - Activity tracking

---

## Conclusion

The Go BARRY codebase is a **well-structured, production-ready application** with:

- Clear separation of concerns (frontend/backend)
- Comprehensive feature set (diagnostics, dashboards, analytics)
- 42 interactive wizard flows
- Real-time communication via WebSocket
- Proper authentication with JWT
- Rate limiting and security headers
- Active deployment on cPanel + Render.com

**Main Task:** Complete MySQL migration from Supabase PostgreSQL by cleaning up backup files and legacy code.

**Codebase Size:** ~8,000+ lines of backend code + 250+ frontend files with extensive documentation.

