# Go BARRY AI Assistant Context Prompt

You are helping with **Go BARRY**, a sophisticated traffic intelligence platform for Go North East bus operations. This is a production-ready system serving real bus operations in Newcastle, England.

## 🎯 Core Understanding

**Primary Purpose:** Help Go North East bus supervisors proactively manage traffic disruptions that impact bus services across Newcastle, Gateshead, Sunderland, Durham, and surrounding areas.

**System Scale:**
- 231 active bus routes with GTFS integration
- 9 active supervisors with accountability system
- 6+ traffic data APIs (TomTom, HERE, National Highways, etc.)
- 20+ backend services + 25+ frontend components
- Production deployment: Render.com backend + cPanel frontend
- Thousands of alerts processed daily

## 🏗️ Architecture Knowledge

**Backend** (`/backend/`):
- **Main entry:** `index.js` (production-optimized, 2GB memory limit)
- **Key services:** `intelligenceEngine.js` (ML), `supervisorManager.js` (auth), `tomtom.js`/`here.js` (traffic APIs), `enhancedGTFSMatcher.js` (route matching)
- **Routes:** `supervisorAPI.js`, `intelligenceAPI.js`, `gtfsAPI.js`, etc.
- **Data:** GTFS files, dismissed-alerts.json, supervisor data

**Frontend** (`/Go_BARRY/`):
- **Framework:** React Native with Expo Router (cross-platform)
- **Key components:** `EnhancedDashboard.jsx` (main), `DisplayScreen.jsx` (24/7), `SupervisorControl.jsx` (management)
- **Interfaces:** Main dashboard, control room display, supervisor tools, mobile apps

**Key APIs:**
- **Primary:** `GET /api/alerts-enhanced` (main traffic alerts with ML)
- **Supervisor:** `POST /api/supervisor/login`, `POST /api/supervisor/dismiss-alert`
- **Intelligence:** `POST /api/intelligence/predict/severity`, route impact analysis
- **GTFS:** `POST /api/gtfs/match/enhanced` (80-90% route matching accuracy)

## 🚌 Go North East Integration

**Route Coverage:** 231 active bus routes across North East England
**Major corridors:** A1 (routes 21, X21), A19 (routes 1, 2, 307), Newcastle city center (Q3, 10, 12, 21)
**Matching accuracy:** 80-90% using Enhanced GTFS with spatial indexing

## 👥 Supervisor System

**9 Active supervisors** with badge-based authentication
**Full accountability:** All alert dismissals tracked with audit trails
**Real-time sync:** WebSocket updates across all interfaces
**Session management:** Auto-timeout, activity logging, permission-based access

## 📊 Current Performance

- **Response times:** <2 seconds (including ML processing)
- **Route matching:** <100ms with 80-90% accuracy
- **Memory usage:** <1.8GB (optimized for 2GB production limit)
- **Uptime:** 99%+ on Render.com
- **Data sources:** 4/6 operational (TomTom, HERE, National Highways, StreetManager)

## 🔧 Recent Major Improvements (June 2025)

✅ **Advanced alert deduplication** - Hash-based system preventing duplicate incidents
✅ **Automatic alert expiration** - Alerts expire after 2-8 hours based on severity
✅ **Persistent dismissal storage** - Dismissed alerts survive server restarts
✅ **Enhanced route matching** - Improved accuracy with spatial indexing
✅ **Memory optimization** - Better performance within 2GB constraints

## ⚠️ Current Challenges & Priorities

**Active Issues:**
- MapQuest API authentication needs fixing
- Elgin traffic management integration in progress
- SCOOT system integration ongoing

**Development Focus:**
- Maintain system stability and performance
- Complete remaining API integrations
- Enhance ML prediction accuracy
- Preserve supervisor accountability features

## 🛠️ Development Guidelines

**When helping with Go BARRY:**

1. **Consider production constraints** - 2GB memory limit on Render.com
2. **Maintain compatibility** - Don't break existing supervisor workflows
3. **Preserve audit trails** - All supervisor actions must be logged
4. **Test thoroughly** - Use existing testing framework (40+ test scripts)
5. **Follow architecture** - Use established component and service patterns

**Common directories:**
- Backend services: `/backend/services/`
- Frontend components: `/Go_BARRY/components/`
- API routes: `/backend/routes/`
- Testing: Root directory test scripts
- Deployment: 50+ deployment scripts in root

**Key files to understand:**
- `/backend/index.js` - Main server with CORS, rate limiting, memory optimization
- `/Go_BARRY/components/EnhancedDashboard.jsx` - Primary user interface
- `/backend/services/intelligenceEngine.js` - ML prediction engine
- `/backend/services/supervisorManager.js` - Authentication and accountability

## 🎯 Expected User Workflows

1. **Traffic incident detected** via APIs → System enhances location & matches routes → ML predicts severity → Displays on dashboards → Supervisors review/dismiss → Audit trail maintained

2. **Supervisor login** → Badge authentication → Session created → Access management tools → Dismiss alerts with reasons → Activity logged → Auto-logout after 10 min

3. **24/7 monitoring** → Display screen auto-refreshes → High-priority alerts highlighted → Real-time updates via WebSocket → Minimal interaction required

## 🚀 Success Indicators

**System working well when:**
- API responses under 2 seconds
- Route matching above 80% accuracy  
- No duplicate alert reports
- Supervisors actively using dismissal system
- 99%+ uptime maintained
- Memory usage staying under 1.8GB

**Business impact goals:**
- Reduced passenger disruption
- Improved bus punctuality
- Enhanced supervisor decision-making
- Complete operational accountability

---

**Remember:** This is a live production system affecting real bus operations. Changes should be tested thoroughly and maintain system stability. The supervisors depend on this system for daily operations, so reliability is paramount.
