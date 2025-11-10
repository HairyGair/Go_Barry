# System Architecture - Go BARRY Breakdown Management System

**Document Version:** 2.0
**Last Updated:** November 2025
**System Status:** Production-Ready ✅

---

## Overview

The Go BARRY Breakdown Management System is a **three-tier web application** providing real-time breakdown tracking and diagnostic capabilities for Go North East bus operations.

### System Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React 18 + Vite | Single-page application at breakdowns.gobarry.co.uk |
| **Backend** | Node.js + Express | REST API at api.breakdowns.gobarry.co.uk |
| **Database** | MySQL 8.0+ | Persistent data storage at 85.234.151.224 |
| **Authentication** | JWT + bcrypt | Secure user authentication |
| **Real-time** | WebSocket (ws) | Live dashboard updates |
| **Process Manager** | PM2 | Production process management |
| **Hosting** | cPanel | Self-hosted infrastructure |

---

## Architecture Diagram

```
┌─────────────────────────────────────┐
│  React 18 SPA (Vite)                │
│  Frontend: breakdowns.gobarry.co.uk │
└──────────────┬──────────────────────┘
               │ HTTPS (443)
               │ REST + WebSocket
┌──────────────┴──────────────────────┐
│  Node.js + Express + PM2            │
│  Backend: api.breakdowns.gobarry.co.uk
└──────────────┬──────────────────────┘
               │ MySQL Protocol (3306)
┌──────────────┴──────────────────────┐
│  MySQL 8.0+                         │
│  Database: 85.234.151.224           │
│  (10+ tables, 1000+ records)        │
└─────────────────────────────────────┘
```

---

## Frontend Architecture

### Structure
```
frontend/
├── src/
│   ├── components/      # UI components
│   ├── pages/          # Route pages
│   ├── contexts/       # React Context (AuthContext)
│   ├── services/       # API services
│   ├── hooks/          # Custom hooks
│   └── utils/          # Helpers
├── public/             # Static assets
└── vite.config.js     # Build config
```

### Key Technologies
- **React 18:** Component-based UI
- **Vite:** Fast build tooling
- **Tailwind CSS:** Utility-first styling
- **React Router:** Client-side routing
- **WebSocket (native):** Real-time communication

### State Management
- **React Context:** Authentication state (AuthContext)
- **React Hooks:** Local component state
- **No Redux:** Kept simple for current scale

---

## Backend Architecture

### Structure
```
backend/
├── routes/             # API endpoints (165+)
│   ├── auth.js        # Authentication
│   ├── breakdowns.js  # Breakdown CRUD
│   ├── activity.js    # Activity feed
│   ├── analytics.js   # Reports & KPIs
│   ├── wizards.js     # Diagnostic wizards
│   └── webSocketHandler.js # WebSocket
├── middleware/         # Middleware stack
├── services/          # Business logic
├── config/            # Configuration
├── validation/        # Joi schemas
├── migrations/        # DB migrations
└── server.js         # Express app
```

### Middleware Stack
1. **CORS** - Cross-origin resource sharing
2. **Helmet** - Security headers
3. **JSON Parser** - Body parsing
4. **Cookie Parser** - JWT extraction
5. **Morgan** - Request logging
6. **Rate Limiter** - Auth endpoint protection
7. **Input Validation** - Joi schemas (Phase 2)
8. **JWT Verification** - Auth check
9. **Route Handlers** - Business logic
10. **Error Handler** - Error responses

---

## Database Architecture

### Connection
```javascript
MySQL 8.0+
Host: 85.234.151.224
Port: 3306
Database: gobarryco_breakdown
User: gobarryco_Gair
Connection: Direct (no pooling service)
```

### Core Tables

**supervisors**
- User accounts and authentication
- Fields: id, email, name, badge_number, role, depot, password_hash
- Active Records: 9

**breakdowns**
- Breakdown records and history
- Fields: id, breakdown_id, fleet_no, location, severity, status, wizard_data
- Active Records: 500+

**activities**
- Activity log and audit trail
- Fields: id, activity_type, breakdown_id, timestamp, description
- Active Records: 2000+

**fleet**
- Vehicle inventory
- Fields: id, fleet_no, registration, depot, make, model
- Active Records: 1000+

**user_preferences**
- User-specific settings
- Retention: 1 per user

---

## API Design

### CRITICAL: API Path Convention

**ALL endpoints MUST use `/api` prefix**

```javascript
// ✅ CORRECT
POST   /api/auth/login
GET    /api/breakdowns
PUT    /api/breakdowns/:id

// ❌ WRONG (will return 404)
POST   /auth/login
GET    /breakdowns
```

### Key Endpoints

**Authentication (8 endpoints)**
```
POST   /api/auth/login              # Email + password
POST   /api/auth/set-duty           # Select duty shift
GET    /api/auth/session            # Verify session
POST   /api/auth/logout             # End session
```

**Breakdowns (25 endpoints)**
```
POST   /api/breakdowns              # Create
GET    /api/breakdowns/:id          # Get by ID
PUT    /api/breakdowns/:id          # Update
DELETE /api/breakdowns/:id          # Delete
GET    /api/breakdowns/live         # Live list
GET    /api/breakdowns/stats        # Statistics
```

**Activity Feed (8 endpoints)**
```
GET    /api/activity                # Activity stream
GET    /api/activity/:id            # Get by ID
```

**Analytics (15 endpoints)**
```
GET    /api/analytics/overview      # KPIs
GET    /api/analytics/depot/:name   # Depot stats
GET    /api/analytics/trends        # Trends
```

### Response Format
```javascript
{
  "success": true,
  "data": { /* resource */ },
  "message": "Operation completed",
  "timestamp": "2025-11-10T12:00:00.000Z"
}
```

---

## Authentication Flow

### 3-Step Login Process

```
1. Email + Password
   ↓
2. Validate credentials against MySQL
   Generate JWT (24h expiration)
   Set HTTP-only cookie
   ↓
3. Select Duty (100/200/400/500)
   Store in database
   ↓
4. All requests include cookie
   Backend verifies JWT on each request
```

### Token Structure
```javascript
{
  "userId": 1,
  "email": "user@example.com",
  "badge": "AG003",
  "role": "admin",
  "duty": "200",
  "iat": 1699632000,
  "exp": 1699718400
}
```

---

## Real-time Communication

### WebSocket Events

**Breakdown Events**
- `new_breakdown` - New breakdown reported
- `breakdown_updated` - Status changed
- `breakdown_resolved` - Marked complete

**Activity Events**
- `activity_created` - New activity logged

**System Events**
- `user_connected` - User logged in
- `user_disconnected` - User logged out

### Broadcast Patterns
- **Depot-specific:** Only displays in affected depot
- **Role-based:** Admins vs supervisors
- **SDC Dashboard:** Real-time updates

---

## Security Architecture

### Layers

**Layer 1: Network**
- HTTPS enforced (TLS 1.2+)
- CORS configured
- Rate limiting (5 attempts/15 min)

**Layer 2: Application**
- Helmet security headers
- CORS origin validation

**Layer 3: Authentication**
- JWT tokens (24h expiration)
- HTTP-only cookies
- bcrypt password hashing (10 rounds)
- Role-based access control

**Layer 4: Data Protection**
- Joi input validation (Phase 2)
- Parameterized SQL queries (100% coverage)
- No string concatenation in queries

---

## Data Flow Example

### Creating a Breakdown

```
1. User fills form (fleet, location, issue, severity)
   ↓
2. Frontend validation + Joi schema
   ↓
3. POST /api/breakdowns with JWT cookie
   ↓
4. Backend:
   - Verify JWT
   - Validate input (Joi)
   - Generate ID (BRK-YYYYMMDD-NNN)
   ↓
5. Database transaction:
   - INSERT breakdowns
   - INSERT activities (audit log)
   - UPDATE fleet status
   ↓
6. WebSocket broadcast:
   - new_breakdown event
   - Notify SDC dashboard
   ↓
7. Response to frontend:
   - Success message
   - Updated breakdown object
   ↓
8. Frontend updates:
   - Add to state
   - Show notification
   - Real-time sync
```

---

## Scalability

### Current Limitations
- Single PM2 instance (no clustering)
- Direct MySQL connection (no pooling service)
- 10MB file upload limit
- 512MB memory allocation
- Supports ~50-100 concurrent users

### Future Improvements
- **Phase 1:** Database optimization, caching
- **Phase 2:** Vertical scaling (more RAM/connections)
- **Phase 3:** Horizontal scaling (load balancer, multiple backends)
- **Phase 4:** Redis for sessions, read replicas

---

## Key Integration Points

### CSV Fleet Import
- Admin-only feature
- Multer file upload
- CSV parsing and validation
- Transaction-based (all-or-nothing)
- Duplicate detection and updates

### Preferences System
- User-specific settings (theme, notifications, defaults)
- Database-backed
- CRUD endpoints

### Analytics
- Real-time KPI calculation
- Trends and historical analysis
- Engineer performance metrics
- Fleet health scoring

---

**For detailed information, see:**
- DEPLOYMENT.md - Deployment procedures
- SYSTEM_STATUS.md - Current status
- DEVELOPMENT.md - Development guidelines
- CLAUDE.md - AI assistant guide

Contact: anthony.gair@gonortheast.co.uk
