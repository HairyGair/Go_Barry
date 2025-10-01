# System Architecture - Breakdown Management System

**Document Version:** 1.0
**Last Updated:** October 1, 2025
**Author:** Anthony Gair

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Details](#component-details)
4. [Data Flow](#data-flow)
5. [Authentication Flow](#authentication-flow)
6. [Database Design](#database-design)
7. [API Design](#api-design)
8. [Security Architecture](#security-architecture)
9. [Scalability Considerations](#scalability-considerations)

---

## System Overview

The Breakdown Management System is a **three-tier web application** following a modern client-server architecture with real-time capabilities.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React SPA (Vite)                                     │   │
│  │  - UI Components (Tailwind)                           │   │
│  │  - State Management (React Hooks)                     │   │
│  │  - API Client (Axios)                                 │   │
│  │  - Supabase Client (Auth + Real-time)                │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     │ REST API + WebSocket
┌────────────────────┴────────────────────────────────────────┐
│                      SERVER LAYER                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Node.js + Express                                    │   │
│  │  - Route Handlers (6,500+ LOC)                        │   │
│  │  - Middleware (Auth, CORS, Rate Limiting)             │   │
│  │  - Business Logic Services                            │   │
│  │  - WebSocket Handler                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ PostgreSQL Wire Protocol
                     │ Supabase REST API
┌────────────────────┴────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Supabase PostgreSQL                                  │   │
│  │  - Auth Schema (users, sessions)                      │   │
│  │  - Public Schema (app tables)                         │   │
│  │  - Row Level Security (RLS)                           │   │
│  │  - Real-time Subscriptions                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Choices & Rationale

| Technology | Rationale |
|-----------|----------|
| **React 18** | Industry standard, large ecosystem, hooks-based state management |
| **Vite** | Fast HMR, modern build tool, smaller bundle size vs webpack |
| **TailwindCSS** | Utility-first CSS, rapid prototyping, consistent design system |
| **Express.js** | Lightweight, flexible routing, large middleware ecosystem |
| **Supabase** | Managed PostgreSQL, built-in auth, real-time subscriptions, free tier |
| **WebSocket** | Bidirectional communication for live dashboard updates |
| **JWT** | Stateless authentication, scalable, industry standard |

---

## Architecture Diagram

### Component Interaction Flow

```
┌──────────────┐
│   Browser    │
│  (React SPA) │
└──────┬───────┘
       │
       │ 1. User Login
       ├──────────────────────────────────────┐
       │                                       │
       v                                       v
┌──────────────┐                      ┌──────────────┐
│  Supabase    │                      │   Express    │
│  Auth API    │                      │   Backend    │
│              │                      │              │
│ POST /auth/v1│                      │ POST /api/   │
│ /token       │                      │ auth/login   │
└──────┬───────┘                      └──────┬───────┘
       │                                       │
       │ 2. JWT Token                         │
       │                                       │
       v                                       │
┌──────────────┐                              │
│  localStorage│                              │
│  {token}     │                              │
└──────┬───────┘                              │
       │                                       │
       │ 3. API Requests with Bearer Token    │
       ├───────────────────────────────────────┤
       │                                       │
       v                                       v
┌──────────────────────────────────────────────────┐
│            Auth Middleware                        │
│  1. Extract token from Authorization header      │
│  2. Verify with Supabase                         │
│  3. Attach user to req.user                      │
└──────┬───────────────────────────────────────────┘
       │
       │ 4. Authorized Request
       v
┌──────────────────────────────────────────────────┐
│            Route Handler                          │
│  - breakdowns.js                                  │
│  - activity.js                                    │
│  - analytics.js                                   │
└──────┬───────────────────────────────────────────┘
       │
       │ 5. Database Query
       v
┌──────────────────────────────────────────────────┐
│            Supabase PostgreSQL                    │
│  - supervisors table                              │
│  - breakdowns table                               │
│  - activities table                               │
└──────┬───────────────────────────────────────────┘
       │
       │ 6. Query Results
       v
┌──────────────────────────────────────────────────┐
│            JSON Response                          │
│  { success: true, data: [...] }                  │
└───────────────────────────────────────────────────┘
```

---

## Component Details

### Frontend Architecture

**File Structure:**
```
frontend/src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components (buttons, inputs, etc.)
│   ├── layout/         # Layout components (header, sidebar, footer)
│   └── features/       # Feature-specific components
├── pages/              # Route-level page components
├── services/           # API communication layer
├── hooks/              # Custom React hooks
├── utils/              # Helper functions
├── constants/          # App constants
└── styles/             # Global styles
```

**Key Components:**

1. **ModernAppHeader** (`components/ModernAppHeader.jsx`)
   - Navigation menu
   - Notification bell with badge
   - User profile dropdown
   - Command palette (Cmd+K)
   - Responsive mobile menu

2. **HeaderLogin** (`components/HeaderLogin.jsx`)
   - Login modal
   - Form validation
   - Supabase authentication
   - Session management

3. **ActivityFeed** (`components/ActivityFeed.jsx`)
   - Real-time activity stream
   - Infinite scroll pagination
   - Filtering by type/severity
   - WebSocket updates

4. **Dashboard** (`pages/Dashboard.jsx`)
   - Live breakdown map
   - KPI cards (active breakdowns, response time, etc.)
   - Recent activity feed
   - Quick actions

### Backend Architecture

**File Structure:**
```
backend/
├── routes/             # Express route handlers
│   ├── auth.js        # Authentication (login, password reset)
│   ├── breakdowns.js  # Breakdown CRUD operations
│   ├── activity.js    # Activity feed endpoints
│   ├── analytics.js   # Analytics & reporting
│   ├── engineering.js # Engineering team management
│   ├── fleet.js       # Fleet/vehicle data
│   ├── wizards.js     # Diagnostic wizards
│   ├── supervisors.js # Supervisor management
│   └── webSocketHandler.js # WebSocket connections
├── middleware/
│   └── authMiddleware.js # JWT verification, rate limiting
├── services/
│   └── activityLogger.js # Activity logging business logic
├── data/              # JSON data files
└── server.js          # Express app entry point
```

**Middleware Chain:**

```javascript
Request → CORS → Helmet → JSON Parser → Morgan (Logging)
   → Rate Limiter (auth only)
   → Auth Middleware (protected routes)
   → Route Handler
   → Error Handler
   → Response
```

**Key Middleware:**

1. **authMiddleware.verifyToken()**
   - Extracts JWT from Authorization header
   - Verifies with Supabase Auth API
   - Attaches user to `req.user`
   - Returns 401 if invalid

2. **authMiddleware.rateLimitLogin()**
   - Limits login attempts to 5 per 15 minutes
   - Uses in-memory map (IP + User-Agent)
   - Returns 429 if limit exceeded

---

## Data Flow

### Example: Creating a Breakdown

```
┌────────────────────────────────────────────────────────────┐
│ Step 1: User fills out breakdown form                      │
│ - Fleet number: 6377                                       │
│ - Location: "Washington Depot"                             │
│ - Issue: "Steering"                                        │
└────────────────────────┬───────────────────────────────────┘
                         │
                         v
┌────────────────────────────────────────────────────────────┐
│ Step 2: Frontend validation                                │
│ - Check required fields                                    │
│ - Validate fleet number format                             │
│ - Get GPS coordinates (if available)                       │
└────────────────────────┬───────────────────────────────────┘
                         │
                         v
┌────────────────────────────────────────────────────────────┐
│ Step 3: API Request                                        │
│ POST /api/breakdowns                                       │
│ Headers: { Authorization: "Bearer <token>" }               │
│ Body: { fleet_no, location_description, issue_category }  │
└────────────────────────┬───────────────────────────────────┘
                         │
                         v
┌────────────────────────────────────────────────────────────┐
│ Step 4: Auth Middleware                                    │
│ - Verify JWT token with Supabase                          │
│ - Lookup supervisor by auth_user_id                       │
│ - Attach to req.user                                       │
└────────────────────────┬───────────────────────────────────┘
                         │
                         v
┌────────────────────────────────────────────────────────────┐
│ Step 5: Route Handler (breakdowns.js)                     │
│ - Generate breakdown_id (BRK-20250101-001)                │
│ - Validate data                                            │
│ - Prepare database record                                  │
└────────────────────────┬───────────────────────────────────┘
                         │
                         v
┌────────────────────────────────────────────────────────────┐
│ Step 6: Database Insert                                    │
│ INSERT INTO breakdowns (                                   │
│   breakdown_id, fleet_no, location_description,           │
│   supervisor_badge, created_at                             │
│ ) VALUES (...)                                             │
└────────────────────────┬───────────────────────────────────┘
                         │
                         v
┌────────────────────────────────────────────────────────────┐
│ Step 7: Activity Logging                                   │
│ activityLogger.logActivity({                               │
│   activityType: 'breakdown_created',                       │
│   actorId: supervisor_badge,                               │
│   entityId: breakdown_id                                   │
│ })                                                          │
└────────────────────────┬───────────────────────────────────┘
                         │
                         v
┌────────────────────────────────────────────────────────────┐
│ Step 8: WebSocket Broadcast                                │
│ webSocketHandler.broadcast('sdc-dashboard', {             │
│   type: 'new_breakdown',                                   │
│   data: breakdown                                          │
│ })                                                          │
└────────────────────────┬───────────────────────────────────┘
                         │
                         v
┌────────────────────────────────────────────────────────────┐
│ Step 9: Response                                            │
│ { success: true, breakdown: {...}, breakdown_id: "..." }   │
└────────────────────────┬───────────────────────────────────┘
                         │
                         v
┌────────────────────────────────────────────────────────────┐
│ Step 10: Frontend Update                                   │
│ - Add breakdown to local state                             │
│ - Show success notification                                │
│ - Redirect to breakdown detail page                        │
│ - Activity feed updates in real-time                       │
└────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

### Login Sequence

```
1. User enters email + password
   ↓
2. Frontend sends POST /api/auth/login
   ↓
3. Backend validates with Supabase Auth
   POST https://oieliubbvvdzhzvikzal.supabase.co/auth/v1/token
   Body: { email, password, grant_type: 'password' }
   ↓
4. Supabase returns JWT token (if valid)
   {
     access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     token_type: "bearer",
     expires_in: 3600,
     refresh_token: "...",
     user: { id, email, ... }
   }
   ↓
5. Backend looks up supervisor record
   SELECT * FROM supervisors WHERE auth_user_id = user.id
   ↓
6. Backend returns combined response
   {
     success: true,
     session: { access_token, ... },
     supervisor: { badge_number, name, depot, role }
   }
   ↓
7. Frontend stores in localStorage
   localStorage.setItem('auth_token', access_token)
   localStorage.setItem('user', JSON.stringify(supervisor))
   ↓
8. Frontend redirects to dashboard
   All subsequent requests include:
   Authorization: Bearer <access_token>
```

### Token Verification (Per Request)

```
1. Request arrives with Authorization header
   ↓
2. authMiddleware.verifyToken() extracts token
   ↓
3. Verify with Supabase:
   const { data: user } = await supabase.auth.getUser(token)
   ↓
4. Check expiration (JWT exp claim)
   ↓
5. Attach to request object:
   req.user = { id, email, role, badge_number }
   ↓
6. Proceed to route handler
```

---

## Database Design

### Entity-Relationship Diagram

```
┌─────────────────────────┐
│    auth.users           │
│  (Supabase Managed)     │
│─────────────────────────│
│  id (PK)                │
│  email (unique)         │
│  encrypted_password     │
│  created_at             │
└──────────┬──────────────┘
           │
           │ 1:1
           │
┌──────────┴──────────────┐
│    supervisors          │
│─────────────────────────│
│  id (PK)                │
│  auth_user_id (FK) ───  │ References auth.users(id)
│  email (unique)         │
│  name                   │
│  badge_number (unique)  │
│  depot                  │
│  role                   │
│  is_active              │
│  pending_approval       │
│  approved_date          │
│  created_at             │
└──────────┬──────────────┘
           │
           │ 1:∞
           │
┌──────────┴──────────────┐
│    breakdowns           │
│─────────────────────────│
│  id (PK)                │
│  breakdown_id (unique)  │
│  fleet_no               │
│  supervisor_badge (FK) ─│ References supervisors(badge_number)
│  supervisor_name        │
│  location_description   │
│  location (geography)   │
│  issue_category         │
│  severity               │
│  status                 │
│  wizard_type            │
│  wizard_decision        │
│  wizard_assessment_data │
│  depot                  │
│  breakdown_source       │
│  created_at             │
│  updated_at             │
└──────────┬──────────────┘
           │
           │ 1:∞
           │
┌──────────┴──────────────┐       ┌─────────────────────────┐
│  breakdown_events       │       │    activities           │
│─────────────────────────│       │─────────────────────────│
│  id (PK)                │       │  id (PK)                │
│  breakdown_id (FK) ─────│───┐   │  activity_type          │
│  event_type             │   │   │  action                 │
│  event_data (jsonb)     │   │   │  actor_type             │
│  created_by             │   │   │  actor_id               │
│  created_at             │   │   │  actor_name             │
└─────────────────────────┘   │   │  entity_type            │
                              └───│  entity_id (FK)         │
                                  │  entity_details (jsonb) │
                                  │  severity               │
                                  │  priority               │
                                  │  depot                  │
                                  │  metadata (jsonb)       │
                                  │  created_at             │
                                  └─────────────────────────┘
```

### Key Indexes

```sql
-- supervisors table
CREATE INDEX idx_supervisors_email ON supervisors(email);
CREATE INDEX idx_supervisors_badge ON supervisors(badge_number);
CREATE INDEX idx_supervisors_auth_user ON supervisors(auth_user_id);

-- breakdowns table
CREATE INDEX idx_breakdowns_id ON breakdowns(breakdown_id);
CREATE INDEX idx_breakdowns_supervisor ON breakdowns(supervisor_badge);
CREATE INDEX idx_breakdowns_status ON breakdowns(status);
CREATE INDEX idx_breakdowns_created ON breakdowns(created_at DESC);
CREATE INDEX idx_breakdowns_depot ON breakdowns(depot);

-- activities table
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_actor ON activities(actor_id);
CREATE INDEX idx_activities_entity ON activities(entity_id);
CREATE INDEX idx_activities_created ON activities(created_at DESC);
CREATE INDEX idx_activities_depot ON activities(depot);
```

---

## API Design

### RESTful Principles

- **Resource-based URLs:** `/api/breakdowns`, `/api/supervisors`
- **HTTP Methods:** GET (read), POST (create), PUT (update), DELETE (delete)
- **Status Codes:** 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)
- **JSON Responses:** All responses in JSON format with consistent structure

### Standard Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2025-10-01T19:00:00.000Z"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... },
  "timestamp": "2025-10-01T19:00:00.000Z"
}
```

### API Versioning

Currently **v1** (implicit, no version in URL). Future versions will use `/api/v2/` prefix if breaking changes are needed.

---

## Security Architecture

### Defense in Depth

**Layer 1: Network**
- HTTPS only (TLS 1.2+)
- CORS configured for specific origins only
- Rate limiting on auth endpoints

**Layer 2: Application**
- JWT token verification on all protected routes
- Input validation and sanitization
- SQL injection prevention (parameterized queries via Supabase client)
- XSS prevention (React auto-escapes output)

**Layer 3: Database**
- Row Level Security (RLS) policies
- Service role vs anon key separation
- Encrypted at rest (Supabase)

**Layer 4: Authentication**
- Bcrypt password hashing (Supabase Auth)
- JWT with expiration (1 hour)
- Refresh token rotation
- Account lockout after failed attempts

### Current Security Limitations

⚠️ **Auth Bypass Active (Temporary):**
- Development auth bypass is enabled in production (backend/middleware/authMiddleware.js line 94)
- All requests without tokens are accepted with mock user
- **TODO:** Remove bypass once frontend properly implements JWT auth

---

## Scalability Considerations

### Current Limitations (Free Tier)

- **Render:** 2GB RAM, CPU throttling, sleeps after inactivity
- **Supabase:** 500MB database, 2GB bandwidth/month, 50K rows/table
- **WebSocket:** Single server instance (no clustering)

### Scaling Strategy (Future)

**Horizontal Scaling:**
1. Add load balancer (Render paid tier or Cloudflare)
2. Multiple backend instances with shared PostgreSQL
3. Redis for shared session storage
4. Redis Pub/Sub for WebSocket clustering

**Vertical Scaling:**
1. Upgrade Render to Standard (2+ GB RAM)
2. Upgrade Supabase to Pro (8GB+ database)

**Database Optimization:**
1. Add database indexes on common queries
2. Implement query result caching (Redis)
3. Archive old breakdowns to separate table
4. Implement read replicas (Supabase Pro feature)

**Frontend Optimization:**
1. Code splitting with React.lazy()
2. Image optimization and lazy loading
3. Service Worker for offline capability
4. CDN for static assets

---

**Document End**

For questions or clarifications, contact: anthony.gair@gonortheast.co.uk
