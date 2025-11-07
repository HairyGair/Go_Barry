# CLAUDE.md - AI Assistant Guide

This file provides guidance to Claude Code and other AI assistants when working with the Go BARRY Breakdown Management System.

**Last Updated:** November 7, 2025 (Phase 2: Input Validation Implementation)
**System Status:** Production-Ready ✅
**Current Version:** 3.2.0 (MySQL + cPanel + Input Validation)
**Documentation Status:** ✅ Cleaned and Organized (115+ legacy files removed, 231 lines mock data eliminated)

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

**Last Updated:** November 2, 2025 (Authentication System Overhaul)
**Document Version:** 3.2.0
**System Status:** Production-Ready ✅
**Documentation:** Clean and Organized
