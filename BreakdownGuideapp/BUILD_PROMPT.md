# Go North East Breakdown Guide App - Master Build Prompt
**Last Updated**: January 2, 2025
**Current Phase**: Integration In Progress - Directory Structure Ready
**Production URL**: https://breakdowns.gobarry.co.uk
**Status**: Awaiting file placement in src/breakdown-guide

## 📅 Recent Updates (December 2024)

### Important System Changes
1. **Defect Tracking System**: Migrated from Go-Check to **Tranzaura**
   - All references to Go-Check have been updated
   - Defect logging now uses Tranzaura System

2. **Assessment Summary Feature**: Added comprehensive summary for Tracerit reporting
   - Appears at end of each wizard assessment
   - Includes all information needed for Tracerit forms
   - Copy to clipboard functionality
   - Print and email options
   - Decision-specific guidance and actions

3. **BrakesWizard Enhancements**
   - Fully aligned with SDC Guide v1.3 and DVSA standards
   - Added "Dangerous defects" classification references
   - Removed location input (now handled by map insert)
   - Enhanced safety warnings and PG9 prohibition mentions

4. **Dashboard UI Overhaul**
   - Integrated Go North East logo in header
   - Added professional dashboard statistics (Active Breakdowns, Today's Assessments, Avg Response Time)
   - Enhanced assessment cards with PNG icons from `/public/icons/`
   - Implemented modern dark theme with red accent colours
   - Added hover effects and animations
   - Fully responsive design

5. **Icon System**
   - Using PNG icons from `/public/icons/` directory
   - 21 custom icons implemented (including new ABS Light icon)
   - Emoji fallbacks for 9 missing icons (to be created)
   - Icons include: brakes.png, steering.png, oil_warning.png, ABS_light.png, etc.

### Missing Icons (Using Emoji Fallbacks)
- Cooling System (🌡️)
- Low Water (💧)
- Excessive Smoke (💨)
- Wipers/Screenwash (🌧️)
- Suspension (🚙)
- Warning Lights (⚠️)
- Speedo (🏁)
- Interior/Exterior Damage (⚠️)
- Buzzers (🔔)

## 📅 Recent Updates (September 2025)

### Road Traffic Incidents Wizard Enhanced
1. **Restructured Flow**
   - Reordered steps to match TraceRit incident form
   - Step 1: Basic Details (Brand, Depot, Type, Category)
   - Step 2: Safety Assessment (Injuries, Police)
   - Step 3: Location Information (Auto-captured)
   - Step 4: Vehicle Damage Assessment
   - Final: Summary and Completion

2. **Smart Features**
   - Auto-generates incident numbers (RTI-YYYYMMDD-HHMM)
   - Pre-populates brand as "Go North East"
   - Auto-fills supervisor's depot
   - Captures current date/time automatically
   - Quick action buttons for common scenarios

3. **Integration Improvements**
   - Direct link to TraceRit external form
   - Location auto-capture from breakdown coordinates
   - Reverse geocoding for address details
   - OpenStreetMap integration for visualization

4. **Known Issues**
   - Button click problems in Step 2 (fix notes provided)
   - CCTV status field not yet implemented
   - Fire/Environmental section pending
   - Full incident description textarea to be added

## 📅 Recent Updates (January 2025)

### Critical Updates
1. **ABSLightWizard Compliance Update** (2025-01-08)
   - Complete rewrite to align with SDC Engineering Issues Guide v1.3
   - Removed EBS references (SDC Guide only covers ABS)
   - Fixed "Complete Assessment" button functionality
   - Removed Tracerit reporting for ABS assessments

2. **Assessment Completion Fix**
   - All wizards now properly pass decision and notes to onComplete
   - Decision values: 'STOP', 'AMBER', 'CONTINUE'
   - AssessmentSummary conditionally shows/hides Tracerit requirements

## 🎯 Project Overview

### Purpose
Building a production-ready vehicle breakdown management system for Go North East bus company (900+ vehicles, 6 depots). The system helps supervisors make safety decisions when buses break down, tracks response times, and provides fleet intelligence.

### Key Business Requirements
- **Safety First**: STOP/AMBER/CONTINUE decision framework from SDC Guide
- **Compliance**: DVSA reporting and audit trail
- **Speed**: 3-minute assessment target
- **Cost Tracking**: £8.50/min base revenue loss, multipliers for peak/priority routes
- **Real-time**: Live tracking and escalation of breakdowns

## 🏗️ Technical Architecture

### Infrastructure
- **Frontend**: React + Vite, hosted on cPanel at breakdowns.gobarry.co.uk (static files)
- **Backend**: Express.js API at https://breakdown-guide.onrender.com (existing)
- **Database**: Supabase PostgreSQL (Project: oieliubbvvdzhzvikzal)
- **Defect Tracking**: Tranzaura (replaced Go-Check)
- **Project Location**: `/Users/anthony/Go BARRY App/BreakdownGuideapp/`

### Core Features Required
0. **Enhanced UI/UX** ✅ COMPLETE
   - Professional dashboard with Go North East branding
   - PNG icon system for assessments
   - Modern dark theme with animations
1. **33 Assessment Wizards** (all SDC compliant) ✅ TRANSFERRED
2. **Breakdown Tracking** (Format: BD-2025-00001, daily reset)
3. **Fleet Intelligence** (cost tracking, vehicle health)
4. **Dashboards** (SDC Operations, Engineering Live, Management) ✅ TRANSFERRED
5. **Mobile/PWA** Support ✅ FILES TRANSFERRED
6. **Offline Capability** ✅ SERVICE WORKER TRANSFERRED
7. **Real-time Updates** ✅ COMPONENTS TRANSFERRED
8. **Photo Documentation** ✅ CAMERA COMPONENTS TRANSFERRED

## 📁 Current Project Structure

```
/Users/anthony/Go BARRY App/BreakdownGuideapp/
├── frontend/
│   ├── src/
│   │   ├── breakdown-guide/        # ✅ Main app & supervisorBreakdownLogger.js
│   │   │   ├── components/         # ✅ All components transferred
│   │   │   │   ├── wizards/        # ✅ 33 wizards
│   │   │   │   └── common/         # ✅ Shared components
│   │   │   ├── data/               # ✅ Diagnostic flows
│   │   │   └── services/           # ✅ Fleet database
│   │   ├── dashboards/             # ✅ 4 dashboard HTML files
│   │   ├── data/                   # ✅ gne-fleet-database.json
│   │   ├── services/               # ✅ supabase-integration-service.js
│   │   └── App.jsx                 # 🔄 Needs integration
│   ├── public/                     # ✅ PWA files (sw.js, manifest.json)
│   └── package.json
├── backend/                        # Ready for API implementation
├── database/
│   └── migrations/                 # ✅ SQL schemas transferred
└── BUILD_PROMPT.md                # This file
```

## 🔧 Implementation Progress

### ✅ Completed
- [x] Created project directory structure
- [x] Created BUILD_PROMPT.md and documentation
- [x] Created backend structure with Express server
- [x] Created complete Supabase database schema
- [x] Built initial production-ready frontend with placeholders
- [x] **Transferred Priority 1**: Core Breakdown Guide System
  - All 33 wizards
  - supervisorBreakdownLogger.js
  - All components (Mobile, PWA, Camera, Real-time)
  - Diagnostic flow data
  - Fleet database service
- [x] **Transferred Priority 2**: All Dashboards
  - engineering-dashboard-live.html
  - management-overview-dashboard.html
  - sdc-operations-dashboard.html
  - breakdown-dashboard-enhanced.html
- [x] **Transferred Priority 3**: Supporting Files
  - Fleet database JSON
  - Database schemas
  - PWA files
  - Integration services

### 🚧 In Progress - Integration Tasks
- [x] Configure Vite aliases ✓
- [x] Wire up breakdown-guide/App.js to main App.jsx ✓
- [x] Create directory structure for breakdown-guide ✓
- [ ] Move files to correct locations (see FILE_TRANSFER_MAP.md)
- [ ] Update all import paths in transferred files
- [ ] Update API endpoints to new backend URL
- [ ] Configure Supabase connection
- [ ] Test wizard functionality
- [ ] Convert HTML dashboards to React components

### 📋 Todo List

#### Phase 2: Integration & Updates 🚧 CURRENT PHASE
1. **Fix Import Paths**
   - Update relative imports in all JS files
   - Set up Vite aliases for cleaner imports
   
2. **Main App Integration**
   - Connect breakdown-guide/App.js to App.jsx router
   - Set up proper routing structure
   
3. **Dashboard Conversion**
   - Convert 4 HTML dashboards to React components
   - Create shared dashboard layout
   - Wire up data fetching
   
4. **API Configuration**
   - Update all API calls to use Render URL
   - Configure Supabase client
   - Test breakdown ID generation

#### Phase 3: Testing & Deployment 📋 NEXT
- [ ] Test complete breakdown flow
- [ ] Verify all dashboards work
- [ ] Test offline functionality
- [ ] Build production bundle
- [ ] Deploy to cPanel
- [ ] Production testing

## 🗂️ Transferred Files Reference

### ✅ Core Files Location
- **Main App**: `frontend/src/breakdown-guide/App.js`
- **Core Logic**: `frontend/src/breakdown-guide/supervisorBreakdownLogger.js`
- **Wizards**: `frontend/src/breakdown-guide/components/wizards/` (33 files)
- **Components**: `frontend/src/breakdown-guide/components/` (15+ files)
- **Data**: `frontend/src/breakdown-guide/data/diagnostic-flows-*.js`
- **Dashboards**: `frontend/src/dashboards/*.html` (4 files)
- **PWA**: `frontend/public/sw.js`, `manifest.json`, `offline.html`

### 🔄 Integration Requirements
1. **Import Path Updates**: All files need path corrections
2. **API Endpoint Updates**: Change to https://breakdown-guide.onrender.com
3. **React Router Integration**: Wire up routes
4. **State Management**: Connect supervisorBreakdownLogger
5. **Dashboard Conversion**: HTML to JSX components

## 🔑 API Endpoints Needed

```javascript
// Breakdown Management
POST   /api/breakdowns/v3/start
POST   /api/breakdowns/v3/step
POST   /api/breakdowns/v3/complete
GET    /api/breakdowns/live
GET    /api/breakdowns/today

// Fleet & Analytics
GET    /api/fleet
GET    /api/fleet/:fleetNumber
GET    /api/analytics/depot-performance
GET    /api/fleet-intelligence/*
```

## 💾 Database Schema (Supabase)

### Core Tables (schemas transferred)
- `breakdowns` - Main breakdown records
- `breakdown_events` - Timestamped status changes
- `vehicles` - Fleet database (759+ vehicles)
- `supervisors` - User management
- `assessment_logs` - Wizard step tracking
- `priority_services` - X10, X21, 307, 1

## 🎯 Immediate Integration Actions

### 1. Update Import Paths 🔧
```javascript
// Example fixes needed in all files:
// OLD: import { something } from '../../../components/common/constants';
// NEW: import { something } from '@/components/common/constants';
```

### 2. Wire Up Router 🔌
```javascript
// In frontend/src/App.jsx:
import BreakdownGuide from './breakdown-guide/App.js';

// Add to routes:
<Route path="/breakdown-guide/*" element={<BreakdownGuide />} />
```

### 3. Configure Environment 🔑
```bash
# frontend/.env.production
VITE_SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=https://breakdown-guide.onrender.com
```

### 4. Convert First Dashboard 📊
Start with `engineering-dashboard-live.html`:
- Create `EngineeringDashboard.jsx`
- Convert HTML to JSX syntax
- Replace inline scripts with React hooks
- Add to router

### 5. Test & Deploy 🚀
```bash
cd frontend
npm install
npm run dev   # Test locally
npm run build # Build for production
# Upload dist/ to cPanel
```

## 📝 Integration Decisions Needed

- [ ] Import path strategy → Use Vite '@/' alias for clean imports
- [ ] Dashboard routing → `/dashboards/[name]` structure
- [ ] State management → Use supervisorBreakdownLogger as central store
- [ ] API configuration → Environment variables for all endpoints
- [ ] Error handling → Global error boundary + toast notifications

---

## 🎉 Current Status Summary

**✅ WINS:**
- All core files successfully transferred
- 33 wizards ready for integration
- Complete dashboard suite available
- PWA/offline capabilities included
- Real-time components ready

**🚧 NEXT STEPS:**
1. Fix import paths (1-2 hours)
2. Wire up main app routing (30 mins)
3. Convert first dashboard (1 hour)
4. Test core functionality (1 hour)
5. Deploy to production (30 mins)

**📅 Estimated Time to Production: 4-5 hours of focussed work**

---

**Remember to update this file after completing each integration step!**
