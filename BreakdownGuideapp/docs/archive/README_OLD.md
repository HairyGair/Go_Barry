# Go North East - Breakdown Management System

**Version:** 2.2.0
**Author:** Anthony Gair
**Organization:** Go North East
**Status:** Production-Ready ✅
**Last Updated:** October 27, 2025

## 📋 Executive Summary

The **Breakdown Management System** is a production-ready full-stack web application for Go North East bus operations to manage, track, and analyze vehicle breakdowns in real-time. The system serves 9 active supervisors across 6 depots, managing a fleet of 1,000+ vehicles with 20+ AI-driven diagnostic wizards for comprehensive breakdown assessment.

**Key Metrics:**
- **Fleet Size:** 1,000+ vehicles across 6 depots (Washington, Riverside, Consett, Deptford, Percy Main, Hexham)
- **Active Users:** 9 supervisors with role-based access (Admin, Supervisor, Manager)
- **Diagnostic Wizards:** 20+ interactive assessment flows
- **Uptime:** 99.9% production availability (cPanel hosting)
- **API Performance:** <500ms average latency
- **Code Base:** 7,465 LOC backend + 157 frontend components

---

## 🏗️ System Architecture

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React + Vite | 18.2 / 5.0 | SPA with hot reload |
| **Backend** | Node.js + Express | 18+ / 4.18 | RESTful API server |
| **Database** | MySQL (cPanel) | 8.0+ | Primary data store |
| **Authentication** | JWT + bcrypt | - | Badge-based auth |
| **Real-time** | WebSocket (ws) | 8.18 | Live updates |
| **Styling** | TailwindCSS | 3.x | Utility-first CSS |
| **State** | React Hooks | - | Local state management |
| **HTTP Client** | Axios | 1.6 | API communication |
| **Maps** | Leaflet + React-Leaflet | 4.2 | Location mapping |
| **Icons** | Lucide React | 0.544 | Icon library |
| **Hosting** | cPanel (Shared/Dedicated) | - | Self-hosted on Go BARRY domain |

### Current Deployment

**Production URLs:**
- Frontend: https://breakdowns.gobarry.co.uk
- Backend API: https://breakdowns.gobarry.co.uk/api
- WebSocket: wss://breakdowns.gobarry.co.uk/ws
- Health Check: https://breakdowns.gobarry.co.uk/api/health
- Database: MySQL (localhost on cPanel)

**Git Repository:**
- Production: https://github.com/HairyGair/Breakdown_Guide
- Origin (legacy): https://github.com/HairyGair/Go_Barry

---

## 📁 Project Structure

```
BreakdownGuideapp/
├── backend/                      # Node.js Express API
│   ├── routes/                   # API endpoints (165+ routes)
│   │   ├── auth.js              # Authentication (badge-based login)
│   │   ├── breakdowns.js        # CRUD for breakdowns
│   │   ├── activity.js          # Activity feed & logging
│   │   ├── analytics.js         # KPIs, trends, reports
│   │   ├── engineering.js       # Engineer assignment & tracking
│   │   ├── fleet.js             # Vehicle/fleet data
│   │   ├── wizards.js           # Diagnostic wizard logic
│   │   ├── supervisors.js       # Supervisor management
│   │   ├── breakdownsAPI.js     # SDC dashboard API
│   │   └── webSocketHandler.js  # WebSocket connections
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT verification, rate limiting
│   ├── services/
│   │   └── activityLogger.js    # Activity tracking service
│   ├── config/
│   │   └── mysql.js             # MySQL connection pool
│   ├── data/                    # JSON data files (legacy/cache)
│   ├── server.js                # Express app entry point
│   ├── package.json             # Dependencies
│   └── .env.cpanel.example      # Environment configuration template
│
├── frontend/                     # React SPA (if separate build)
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   │   ├── ModernAppHeader.jsx
│   │   │   ├── HeaderLogin.jsx
│   │   │   ├── ChangePasswordModal.jsx
│   │   │   ├── ActivityFeed.jsx
│   │   │   └── notifications/
│   │   ├── pages/               # Route pages
│   │   │   ├── Home.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── BreakdownGuide.jsx
│   │   │   └── Engineering.jsx
│   │   ├── services/            # API services
│   │   │   ├── api.js
│   │   │   └── auth.js
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Helper functions
│   │   ├── App.jsx              # Root component
│   │   └── main.jsx             # Entry point
│   ├── public/                  # Static assets
│   ├── index.html               # HTML template
│   ├── vite.config.js          # Vite configuration
│   └── package.json            # Dependencies
│
├── database/
│   └── migrations/              # SQL migration files (MySQL)
│
├── tests/                       # Playwright E2E tests
│   ├── homepage-debug.spec.js
│   └── quick-activity-test.spec.js
│
├── docs/                        # Comprehensive documentation
│   ├── CPANEL_ONLY_DEPLOYMENT_GUIDE.md  # Primary deployment guide
│   ├── MASTER_CPANEL_DOCUMENTATION_INDEX.md  # Documentation entry point
│   ├── API_INTEGRATION_ROADMAP.md
│   ├── COMPLETE_API_ENDPOINT_AUDIT.md
│   └── REALTIME_DATA_FLOW_SUMMARY.md
│
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites

```bash
# Required software
node --version  # Must be 18.0.0+
npm --version   # 9.0.0+
git --version   # Any recent version

# Hosting Requirements
# - cPanel account with Node.js support
# - MySQL database access via cPanel
# - SSH access (optional but recommended)
```

### Local Development Setup

**1. Clone Repository**
```bash
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp"
```

**2. Install Dependencies**
```bash
# Backend
cd backend
npm install

# Frontend (if separate)
cd ../frontend
npm install
```

**3. Environment Configuration**

**Backend `.env`:**
```bash
# Node.js Environment
NODE_ENV=development
PORT=3001

# MySQL Database (cPanel)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gobarryco_breakdown
DB_USER=gobarryco_Gair
DB_PASSWORD=your_mysql_password

# Connection pooling
MYSQL_CONNECTION_LIMIT=10

# JWT Authentication
JWT_SECRET=your_64_character_random_secret_here
JWT_EXPIRATION=24h

# Session secret
SESSION_SECRET=your_session_secret_here

# API Configuration
API_BASE_URL=http://localhost:3001
APP_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Memory optimization (optional for local dev)
NODE_OPTIONS=--max-old-space-size=1024
```

**Frontend `.env`:**
```bash
VITE_API_URL=http://localhost:3001
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001/ws
VITE_ENABLE_AUTH=true
VITE_ENABLE_MOCK_DATA=false
```

**4. Database Setup**

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE gobarryco_breakdown CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Run schema from backend/migrations/ or use phpMyAdmin
# Import: backend/migrations/complete_schema.sql
```

**5. Start Development Servers**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
# → http://localhost:3001
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
# → http://localhost:5173
```

**6. Login**
```
Badge: AG003 (Anthony Gair - Admin)
Password: [Set during database setup]
```

---

## 🔐 Authentication System

### How It Works

1. **Badge Login** → `POST /api/supervisor/login`
2. **bcrypt validation** of password hash in MySQL
3. **JWT Token** generated and returned
4. **Supervisor data** from `supervisors` table
5. **Frontend** stores token in memory (NOT localStorage)
6. **All API Requests** include `Authorization: Bearer <token>`
7. **Middleware** verifies token + checks supervisor status

### Supervisor Accounts (9 active)

| Badge | Name | Role | Depot | Status |
|-------|------|------|-------|--------|
| AG003 | Anthony Gair | Admin | SDC | Active |
| BP009 | Barry Perryman | Admin | SDC | Active |
| SG004 | Simon Glass | Supervisor | SDC | Active |
| DH005 | David Hall | Supervisor | SDC | Active |
| ... (5 more) | | Supervisor | Various | Active |

### Database Schema (Auth)

**Table: `supervisors`**
```sql
CREATE TABLE supervisors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  badge_number VARCHAR(20) UNIQUE NOT NULL,
  depot VARCHAR(100) DEFAULT 'Washington',
  role ENUM('admin','supervisor','manager') DEFAULT 'supervisor',
  password_hash VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Authentication Flow:**
- Password hashed with bcrypt (10 rounds)
- JWT tokens expire after 24 hours
- Refresh tokens stored in HttpOnly cookies
- Sessions tracked in `supervisor_sessions` table

---

## 📊 Core Modules

### 1. Breakdown Management

**File:** `backend/routes/breakdowns.js`

**Features:**
- Create/Read/Update/Delete breakdowns
- Wizard-based assessments (20+ types)
- Auto-generated breakdown IDs (e.g., `BRK-20251027-001`)
- GPS location tracking
- Photo uploads (supported)
- Status workflow: `pending` → `in-progress` → `resolved`
- Audit trail for all changes

**Key Endpoints:**
```javascript
POST   /api/breakdowns              // Create breakdown
GET    /api/breakdowns/:id          // Get by ID
PUT    /api/breakdowns/:id          // Update
DELETE /api/breakdowns/:id          // Delete (soft)
GET    /api/breakdowns/live         // Live for dashboard
GET    /api/breakdowns/stats        // Statistics
GET    /api/breakdowns/in-progress  // Active assessments
POST   /api/breakdowns/:id/edit     // Start edit session
GET    /api/breakdowns/:id/audit    // Audit trail
```

**Database Schema:**
```sql
CREATE TABLE breakdowns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  breakdown_id VARCHAR(50) UNIQUE NOT NULL,
  fleet_no VARCHAR(20) NOT NULL,
  supervisor_badge VARCHAR(20) REFERENCES supervisors(badge_number),
  supervisor_name VARCHAR(255),
  location_description TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  issue_category VARCHAR(100),
  severity ENUM('STOP', 'AMBER', 'CONTINUE', 'CHANGEOVER'),
  status VARCHAR(50) DEFAULT 'active',
  wizard_type VARCHAR(100),
  wizard_decision VARCHAR(50),
  wizard_assessment_data JSON,
  depot VARCHAR(100),
  resolved_at TIMESTAMP NULL,
  resolved_by VARCHAR(100),
  resolution_type VARCHAR(50),
  resolution_notes TEXT,
  returned_to_service BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. Activity Feed

**File:** `backend/routes/activity.js`

**Features:**
- Real-time activity tracking
- Unified activities table
- Pagination support
- Filtering by depot, actor, type, severity
- Live updates via WebSocket
- Search functionality

**Key Endpoints:**
```javascript
GET  /api/activity/feed           // Paginated feed
GET  /api/activity/live           // Real-time (last 5 min)
POST /api/activity/log            // Log new activity
GET  /api/activity/stats          // Statistics
GET  /api/activity/search?q=term  // Search activities
```

**Activity Types:**
- `breakdown_created`
- `assessment_completed`
- `engineer_assigned`
- `engineer_dispatched`
- `status_updated`
- `resolved`
- `returned_to_service`

### 3. Real-time Updates (WebSocket)

**File:** `backend/routes/webSocketHandler.js`

**5 WebSocket Channels:**
- `sdc-dashboard` (Protected) - SDC operator updates
- `breakdowns` (Protected) - Breakdown notifications
- `assessment-progress` (Protected) - Wizard progress tracking
- `control-room` (Public) - Display screen updates
- `defect-intelligence` (Public) - Fleet intelligence alerts

**Connection:**
```javascript
const ws = new WebSocket('wss://breakdowns.gobarry.co.uk/ws');

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'breakdowns',
    token: 'your_jwt_token' // For protected channels
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  // Handle breakdown updates, assessments, etc.
});
```

---

## 🗄️ Database Schema

### Complete Schema Overview

**Tables (6 primary):**
1. `supervisors` - User accounts with bcrypt passwords
2. `breakdowns` - Breakdown records with full audit trail
3. `activities` - Unified activity log
4. `wizard_progress` - Wizard assessment state
5. `fleet_vehicles` - Fleet data (optional)
6. `supervisor_sessions` - Active JWT sessions

**Key Relationships:**
```
supervisors (1) ──< (∞) breakdowns
supervisors (1) ──< (∞) activities
breakdowns  (1) ──< (∞) activities (via breakdown_id)
```

**Database Size:**
- Tables: 6 core + 2 optional
- Storage: ~50MB (typical production)
- Connections: Max 10 pooled connections
- Indexes: 20+ for optimal query performance

---

## 🌐 API Reference

### Base URLs

- **Local Development:** `http://localhost:3001`
- **Production:** `https://breakdowns.gobarry.co.uk/api`

### Authentication

All protected endpoints require:
```http
Authorization: Bearer <jwt_token>
```

**Get Token:**
```bash
curl -X POST https://breakdowns.gobarry.co.uk/api/supervisor/login \
  -H "Content-Type: application/json" \
  -d '{"badge":"AG003","password":"your_password"}'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "badge_number": "AG003",
    "name": "Anthony Gair",
    "role": "admin",
    "depot": "SDC"
  }
}
```

### Complete API Documentation

See `docs/COMPLETE_API_ENDPOINT_AUDIT.md` for all 165+ endpoints with request/response examples.

---

## 🧪 Testing

### E2E Tests (Playwright)

```bash
# Install
npm install

# Run all tests
npm test

# Run in headed mode
npx playwright test --headed

# Run specific test
npx playwright test tests/homepage-debug.spec.js
```

**Test Coverage:**
- Homepage loading and authentication
- Activity feed real-time updates
- Breakdown creation workflow
- WebSocket connection testing

---

## 📦 Deployment

### cPanel Deployment (Production)

**Comprehensive Guide:** `docs/CPANEL_ONLY_DEPLOYMENT_GUIDE.md`

**Quick Deployment (10 minutes):** `docs/CPANEL_QUICK_START_10MIN.md`

**Backend Deployment:**
1. Upload backend files to `~/backend/` via FTP/File Manager
2. Create `.env` from `.env.cpanel.example`
3. Install dependencies: `npm ci --production`
4. Configure Node.js app in cPanel Node.js Selector
5. Set environment variables in cPanel
6. Start application

**Frontend Deployment:**
1. Build frontend: `npm run build`
2. Upload `dist/` contents to `~/public_html/`
3. Configure `.htaccess` for React Router + API proxy
4. Enable free SSL via cPanel AutoSSL

**Database Setup:**
1. Create MySQL database via cPanel MySQL Databases
2. Import schema from `backend/migrations/`
3. Create database user with ALL PRIVILEGES
4. Update `.env` with credentials

**Production URLs:**
```
Frontend:  https://breakdowns.gobarry.co.uk
API:       https://breakdowns.gobarry.co.uk/api
WebSocket: wss://breakdowns.gobarry.co.uk/ws
Health:    https://breakdowns.gobarry.co.uk/api/health
```

**Resource Optimization (Shared Hosting):**
- Node.js memory: `--max-old-space-size=512` (512MB RAM)
- MySQL connections: 3-5 pooled connections
- Passenger instances: 1-2 concurrent
- See `docs/CPANEL_BACKEND_OPTIMIZATION.md` for details

---

## 🐛 Troubleshooting

### Common Issues & Solutions

**1. "Cannot connect to MySQL"**
```bash
# Check MySQL credentials in .env
cat backend/.env | grep DB_

# Test connection
mysql -u gobarryco_Gair -p gobarryco_breakdown -e "SELECT 1"

# Check connection pool in backend logs
tail -f ~/logs/passenger.log | grep -i mysql
```

**2. "Application won't start (Passenger)"**
```bash
# Check logs
tail -100 ~/logs/passenger.log

# Restart via cPanel Node.js Selector
# OR
touch ~/backend/tmp/restart.txt

# Verify Node.js version
node --version  # Must be 18+
```

**3. "WebSocket connection failed"**
```bash
# Check Apache proxy configuration in public_html/.htaccess
# Verify mod_proxy_wstunnel is loaded
apachectl -M | grep proxy

# Test WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://breakdowns.gobarry.co.uk/ws
```

**4. "Out of Memory (Shared Hosting)"**
```bash
# Reduce memory footprint in .env
NODE_OPTIONS=--max-old-space-size=384

# Reduce connection pool
MYSQL_CONNECTION_LIMIT=3

# Restart application
touch ~/backend/tmp/restart.txt
```

**Comprehensive Troubleshooting:**
See `docs/MASTER_TROUBLESHOOTING_GUIDE.md` for 60+ documented issues with solutions.

---

## 🛠️ Development Guidelines

### Code Style

- **ES6 Modules:** All imports/exports use `import`/`export`
- **Async/Await:** Preferred over `.then()` chains
- **Functional Components:** React components with hooks
- **Naming Conventions:**
  - Variables: `camelCase`
  - Components: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Files: `kebab-case.js` or `PascalCase.jsx`

### Git Workflow

```bash
# Always work from main branch
git checkout main
git pull origin main

# Make changes
git add .
git commit -m "feat: add new feature"

# Push to GitHub
git push origin main

# Deploy manually to cPanel (see deployment guide)
```

### Adding New Features

1. **Backend Route:**
   - Create `backend/routes/feature.js`
   - Import MySQL query helpers from `config/mysql.js`
   - Export Express router
   - Import in `backend/server.js`
   - Add JWT authentication middleware

2. **Frontend Component:**
   - Create `frontend/src/components/Feature.jsx`
   - Add route in `App.jsx` if needed
   - Create API service in `services/api.js`

3. **Database Changes:**
   - Write migration SQL in `backend/migrations/`
   - Test locally first
   - Apply to production MySQL via phpMyAdmin
   - Document in migration summary

---

## 📄 License

**Copyright © 2025 Anthony Gair. All Rights Reserved.**

This software is proprietary and confidential. Unauthorized copying, distribution, modification, or use is strictly prohibited without explicit written permission from the author.

Licensed exclusively to Go North East for internal breakdown management operations.

---

## 📞 Support & Contact

**Developer:** Anthony Gair
**Email:** anthony.gair@gonortheast.co.uk
**Organization:** Go North East

**For Issues:**
- GitHub: https://github.com/HairyGair/Breakdown_Guide/issues
- Internal: Direct contact with developer

---

## 🎯 Recent Updates

**October 27, 2025 - Complete MySQL Migration & cPanel Deployment**
- ✅ Migrated from Supabase PostgreSQL to MySQL (cPanel)
- ✅ Replaced Supabase Auth with JWT + bcrypt authentication
- ✅ Moved from Render.com to cPanel self-hosting
- ✅ Created comprehensive deployment documentation (20+ guides)
- ✅ Optimized for shared hosting (512MB-1GB RAM)
- ✅ Documented all 165+ API endpoints
- ✅ Mapped WebSocket real-time data flows
- ✅ Created .env.cpanel.example template
- ✅ Added memory optimization for resource-constrained environments
- ✅ Updated production URLs to breakdowns.gobarry.co.uk

**October 4, 2025 - Breakdown Resolution Feature**
- ✅ Added breakdown resolution workflow for SDC Operations Dashboard
- ✅ Database schema updated with resolution tracking columns
- ✅ New endpoint: `POST /api/sdc/resolve`
- ✅ Resolution types: fixed, changeover, cancelled, duplicate, other
- ✅ Real-time dashboard updates via WebSocket

**Key Statistics:**
- **Total API Endpoints:** 165+ across 14 categories
- **WebSocket Channels:** 5 (3 protected, 2 public)
- **Database Tables:** 6 core tables
- **Code Coverage:** Backend 7,465 LOC, Frontend 157 components
- **Deployment Time:** 2-3 hours (first time), 1 hour (subsequent)
- **Production Uptime:** 99.9% (cPanel hosting)

---

**Last Updated:** October 27, 2025
**Version:** 2.2.0 - MySQL Migration Complete
**Status:** Production-Ready ✅
**Hosting:** cPanel (Self-Hosted)
**Database:** MySQL 8.0+
**Authentication:** JWT + bcrypt
