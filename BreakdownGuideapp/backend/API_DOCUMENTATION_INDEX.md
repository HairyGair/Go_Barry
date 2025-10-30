# Go BARRY Backend - API Documentation Index

**Generated**: October 27, 2025  
**Scope**: Complete API, WebSocket, and Integration Analysis  
**Status**: COMPREHENSIVE EXPLORATION COMPLETE

---

## Documentation Files

### 1. **API_EXPLORATION_SUMMARY.md** (Start Here)
**Size**: ~12 KB  
**Purpose**: Executive summary of the entire exploration  
**Contains**:
- Overview of all findings
- Key statistics and metrics
- API category breakdown
- WebSocket channels summary
- Database schema overview
- cPanel compatibility assessment
- Security analysis summary
- Next steps and recommendations

**Best For**: Quick overview and decision-making

---

### 2. **API_WEBSOCKET_ANALYSIS.md** (Comprehensive Reference)
**Size**: ~35 KB, 852 lines  
**Purpose**: Exhaustive technical documentation  
**Contains**:

#### PART 1: API ENDPOINT MAPPING
- **Authentication Routes** (17 endpoints)
  - Login, signup, password management, admin functions
  - Rate limiting: 5 attempts / 15 minutes
  - Database: supervisors table
  
- **Breakdown Management** (20 endpoints)
  - Create, update, resolve breakdowns
  - Pattern detection (5+ vehicles, 3+ per vehicle, 25% spikes)
  - WebSocket broadcasting to sdc-dashboard
  - Database: breakdowns, breakdown_activity, fleet_vehicles
  
- **Fleet Management** (10 endpoints)
  - Vehicle search, health tracking, depot management
  - Pagination support
  - Database: fleet_vehicles, vehicle_health_scores
  
- **Analytics** (5 endpoints)
  - KPIs, trends, depot comparison, fleet health
  - Period filtering: today, week, month, year
  - Database: breakdowns, fleet_vehicles, supervisors
  
- **Fleet Intelligence / Defects** (8 endpoints)
  - Repeat defect analysis, trend analysis, predictive alerts
  - WebSocket: defect-intelligence channel broadcasts
  - Events: NEW_REPEAT_DEFECT, TREND_UPDATE, CRITICAL_PATTERN, etc.
  - Database: breakdowns, fleet_vehicles
  
- **SDC Dashboard API** (10 endpoints)
  - Real-time breakdown management
  - Assessment tracking and audit trails
  - Rate limiting: 100 operations / 15 minutes
  - Auth: SDC operator privileges required
  
- **Engineering Routes** (5 endpoints)
  - Engineer dispatch and assignment
  - Depot performance statistics
  - Database: engineers, engineer_jobs, depots, breakdowns
  
- **Activity Feed** (10 endpoints)
  - Audit trail, user actions, statistics
  - Batch operations support
  - Database: activity_logs, supervisors
  
- **Public Routes** (4 endpoints)
  - Control Room display endpoints (no auth required)
  - Cache-friendly
  
- **Support Routes**
  - Wizards (6 endpoints)
  - Preferences (6 endpoints)
  - Supervisors (8 endpoints)

#### PART 2: WebSocket Implementation
- **Architecture**
  - Library: ws 8.18.3
  - Singleton pattern
  - Channels: sdc-dashboard, breakdowns, assessment-progress, control-room, defect-intelligence
  
- **Authentication**
  - Protected channels: require JWT in URL query parameter
  - Public channels: no authentication
  - Token verification using same middleware as REST API
  
- **Message Types**
  - Client → Server: subscribe, unsubscribe, ping, get_status
  - Server → Client: connected, error, subscribed, initial_data, status_update
  - Broadcasts: wizard_started, wizard_completed, assessment_progress, breakdown_created, etc.
  
- **Defect Intelligence Events**
  - NEW_REPEAT_DEFECT (3+ defects)
  - TREND_UPDATE (15%+ change)
  - CRITICAL_PATTERN (5+ vehicles, same defect, 24h)
  - DEPOT_STATS_UPDATE (25% spike, 5+ defects)
  - PREDICTIVE_ALERT (ML detected)
  - DEFECT_ESCALATED (manual escalation)
  
- **Connection Management**
  - Client tracking with Map
  - Channel tracking with Set
  - Memory cleanup on disconnect
  - No heartbeat timeout (issue noted)

#### PART 3: API Dependencies & Data Flow
- **Flow Diagrams**
  - Login flow
  - Breakdown creation flow
  - Defect analysis flow
  - SDC Dashboard real-time flow
  - Supervisor statistics flow
  
- **Dependency Matrix**
  - Which APIs depend on which
  - Data sources for each API
  - Cross-API communication patterns

#### PART 4: External API Integrations
- **Current Status**: 0 active integrations
- **Ready for Implementation**:
  - Street Manager (roadworks)
  - National Highways (M1/A1(M) incidents)
  - TomTom (traffic flow, geocoding)
  - HERE / Google Maps (route visualization)
  - Weather services (incident correlation)
  - What3Words (location backup)
  
- **Rate Limiting Configuration**
  - Login: 5 attempts / 15 min
  - SDC operations: 100 / 15 min
  - No WebSocket rate limiting

#### PART 5: cPanel Compatibility Analysis
- **Server Configuration**
  - Node.js 18+ required
  - ES6 modules only
  - Port: 3001 (configurable)
  - Passenger support for auto-detection
  
- **MySQL Setup**
  - Local socket connection
  - Connection pool: 10 connections (optimized for 2GB RAM)
  - Connection limit, keep-alive, timeout settings
  
- **WebSocket on cPanel**
  - Requires Apache proxy pass
  - SSL/TLS passthrough needed
  - Some hosts disable WebSocket
  
- **Environment Variables**
  - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
  - JWT_SECRET (required)
  - NODE_ENV, PORT, ALLOWED_ORIGINS, LOG_LEVEL
  
- **Memory Optimization**
  - 2GB RAM limit on cPanel
  - Recommended: 512MB Node process
  - Connection pool optimized
  - JSON files loaded on-demand

#### PART 6: Security Analysis
- **Authentication**
  - JWT tokens (24h expiration)
  - MySQL database verification
  - Role-based access control
  - Rate limiting on login
  
- **CORS Configuration**
  - Allowed origins documented
  - localhost support
  - Render deployments
  - gobarry.co.uk domain
  
- **Data Validation**
  - Joi schema validation
  - Email regex validation
  - Password strength requirements
  - Input sanitization
  
- **Protected Endpoints**
  - All /api/breakdowns/* require supervisor auth
  - All /api/auth/admin/* require admin role
  - All protected WebSocket channels require JWT
  
- **Security Logging**
  - Failed login attempts
  - Unauthorized access attempts
  - SDC rate limit exceeded
  - Unauthorized WebSocket access
  - Admin actions
  
- **Database Security**
  - Parameterized queries
  - Connection pooling with timeouts
  - Password hashing (bcrypt, 10 rounds)
  - Active status verification

#### PART 7: Integration Issues & Recommendations
- **Current Issues**
  - WebSocket file watchers disabled
  - In-memory activity logger
  - No external API integration
  - Rate limiting not distributed
  
- **Recommendations**
  - Short-term (critical)
  - Medium-term (important)
  - Long-term (enhancement)
  
- **Performance Considerations**
  - Current bottlenecks identified
  - Optimization opportunities provided

**Best For**: Complete technical reference, implementation details

---

### 3. **QUICK_REFERENCE.md** (Lookup Guide)
**Size**: ~14 KB, 394 lines  
**Purpose**: Quick lookups and common queries  
**Contains**:
- Core statistics in table format
- API categories with example endpoints
- WebSocket channel quick reference
- Authentication flow summary
- Database tables overview
- Critical patterns explanation
- Common query examples
- Error codes and meanings
- Environment variables checklist
- cPanel deployment checklist
- Troubleshooting guide
- Performance tips
- Testing commands

**Best For**: Day-to-day reference, quick lookups, troubleshooting

---

## How to Use This Documentation

### For Developers Implementing Features
1. Start with **API_EXPLORATION_SUMMARY.md** for context
2. Reference **QUICK_REFERENCE.md** for specific endpoint details
3. Dive into **API_WEBSOCKET_ANALYSIS.md** PART 1 for complete endpoint specs

### For System Administrators
1. Review **API_EXPLORATION_SUMMARY.md** (cPanel Compatibility section)
2. Use **QUICK_REFERENCE.md** (cPanel Deployment section)
3. Check **API_WEBSOCKET_ANALYSIS.md** PART 5 for detailed setup

### For Security/Architecture Review
1. Read **API_EXPLORATION_SUMMARY.md** (Security Analysis section)
2. Review **API_WEBSOCKET_ANALYSIS.md** PART 6 (Security Analysis)
3. Reference **QUICK_REFERENCE.md** (Error Codes section)

### For Integration Work
1. Check **API_EXPLORATION_SUMMARY.md** (External API Integrations section)
2. Review **API_WEBSOCKET_ANALYSIS.md** PART 4 (External API Integrations)
3. Plan using recommendations provided

### For WebSocket Implementation
1. Overview in **QUICK_REFERENCE.md** (WebSocket Channels section)
2. Details in **API_WEBSOCKET_ANALYSIS.md** PART 2 (WebSocket Implementation)
3. Testing code in **QUICK_REFERENCE.md** (Testing section)

---

## Quick Facts

| Metric | Value |
|--------|-------|
| **Total REST Endpoints** | 85+ |
| **Protected Routes** | 75 |
| **Public Routes** | 10 |
| **WebSocket Channels** | 5 |
| **Database Tables** | 12+ |
| **Authentication Methods** | 3 (JWT, Rate Limit, Role-based) |
| **External APIs Integrated** | 0 (ready for implementation) |
| **Framework** | Express.js 4.18.2 |
| **Database** | MySQL 8.0+ |
| **WebSocket Library** | ws 8.18.3 |
| **Node.js Minimum** | 18.0.0 |
| **cPanel RAM Limit** | 2GB |

---

## API Endpoints at a Glance

### Authentication (`/api/auth`)
Login, signup, password management, admin functions

### Breakdown Management (`/api/breakdowns`)
Create, update, resolve breakdowns with pattern detection

### Fleet Management (`/api/fleet`)
Vehicle search, health tracking, depot management

### Analytics (`/api/analytics`)
KPIs, trends, depot comparison

### Fleet Intelligence (`/api/defects`)
Repeat defects, trending issues, predictive alerts

### SDC Dashboard (`/api/sdc/*`)
Real-time breakdown assessment and management

### Engineering (`/api/engineering`)
Engineer dispatch and job tracking

### Activity Feed (`/api/activity`)
Audit trail and user action logging

### Public APIs (`/api/public/*`)
Control Room display endpoints (no auth)

### Support Routes
- Wizards (`/api/wizards`) - 6 endpoints
- Preferences (`/api/preferences`) - 6 endpoints
- Supervisors (`/api/supervisors`) - 8 endpoints

---

## WebSocket Channels

### Protected (Require JWT)
- `sdc-dashboard` - SDC operator updates
- `breakdowns` - Breakdown notifications
- `assessment-progress` - Assessment tracking

### Public (No Auth)
- `control-room` - Display updates
- `defect-intelligence` - Fleet intelligence alerts

---

## File Structure

```
/backend/
├── API_DOCUMENTATION_INDEX.md (this file)
├── API_EXPLORATION_SUMMARY.md (start here)
├── API_WEBSOCKET_ANALYSIS.md (complete reference)
├── QUICK_REFERENCE.md (quick lookups)
├── server.js (main server)
├── package.json (dependencies)
├── .env (environment variables)
├── routes/
│   ├── auth.js (17 endpoints)
│   ├── breakdowns.js (20 endpoints)
│   ├── fleet.js (10 endpoints)
│   ├── analytics.js (5 endpoints)
│   ├── defects.js (8 endpoints)
│   ├── breakdownsAPI.js (10 endpoints for SDC)
│   ├── engineering.js (5 endpoints)
│   ├── activity.js (10 endpoints)
│   ├── public.js (4 endpoints)
│   ├── wizards.js (6 endpoints)
│   ├── preferences.js (6 endpoints)
│   ├── supervisors.js (8 endpoints)
│   └── webSocketHandler.js (WebSocket implementation)
├── middleware/
│   └── authMiddleware.js (JWT + rate limiting)
├── config/
│   └── mysql.js (MySQL configuration)
├── utils/
│   └── queryHelpers.js (Query builder utilities)
└── services/
    ├── activityLogger.js (Audit trail)
    └── breakdownIdGenerator.js (ID generation)
```

---

## Quick Start Checklist

- [ ] Read API_EXPLORATION_SUMMARY.md
- [ ] Review QUICK_REFERENCE.md for your use case
- [ ] Bookmark API_WEBSOCKET_ANALYSIS.md for detailed reference
- [ ] Check environment variables in QUICK_REFERENCE.md
- [ ] Review API endpoint specs in QUICK_REFERENCE.md
- [ ] Test with curl examples provided
- [ ] Set up WebSocket connection if needed
- [ ] Monitor database and memory usage
- [ ] Plan external API integrations

---

## Support & Updates

**Last Updated**: October 27, 2025  
**Backend Version**: 2.0.0 (MySQL Migration Complete)  
**Documentation Version**: 1.0  
**Total Documentation**: ~61 KB (852 + 394 + 12 + 12 KB)

---

## Contact & References

- **Deployment Guide**: See QUICK_REFERENCE.md (cPanel Deployment section)
- **Security Guide**: See API_WEBSOCKET_ANALYSIS.md PART 6
- **Troubleshooting**: See QUICK_REFERENCE.md (Troubleshooting section)
- **Testing**: See QUICK_REFERENCE.md (Testing section)

---

**Navigation**: Use this index to find the right documentation for your needs.  
**Recommended Reading Order**:
1. This file (API_DOCUMENTATION_INDEX.md)
2. API_EXPLORATION_SUMMARY.md
3. QUICK_REFERENCE.md
4. API_WEBSOCKET_ANALYSIS.md (as needed)

