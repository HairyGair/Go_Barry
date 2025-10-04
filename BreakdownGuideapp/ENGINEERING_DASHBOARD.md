# Engineering Dashboard - Complete Implementation Guide

## 🎯 Overview

The Engineering Dashboard is a comprehensive real-time job management system for Go North East bus breakdown engineers. It processes breakdown data from supervisors and the SDC Operations Dashboard, providing engineers with actionable job assignments, detailed assessment information, and complete workflow tracking.

**Production URL**: https://breakdowns.gobarry.co.uk/engineering

---

## 📋 Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Deployment](#deployment)
4. [Engineer Workflow](#engineer-workflow)
5. [API Reference](#api-reference)
6. [WebSocket Events](#websocket-events)
7. [Database Schema](#database-schema)
8. [Troubleshooting](#troubleshooting)

---

## ✨ Features

### For Engineers

- **Job Queue Management**
  - View all unassigned breakdowns
  - Filter by: All Jobs, My Jobs, Unassigned, Dispatched, On Site, Priority Routes, SLA Risk
  - Real-time job updates via WebSocket

- **Job Assignment**
  - Accept jobs with ETA input
  - Auto-assignment based on location/availability
  - View complete breakdown assessment from supervisor wizards

- **Status Tracking**
  - Update job status: Dispatched → On Site → Fixing → Testing → Complete
  - Add engineer notes at each stage
  - Track time on site and total elapsed time

- **Job Completion**
  - 5 resolution types: Fixed, Changeover, Workshop Required, Deemed Safe, Escalated
  - Parts tracking (part number, description, quantity)
  - Labor hours recording
  - Root cause analysis
  - Return to service status

### For Management

- **Performance Metrics**
  - Total jobs, unassigned queue, SLA compliance
  - Average response time
  - Engineers on site
  - SLA risk alerts

- **Depot Statistics**
  - Active breakdowns per depot
  - Engineer availability
  - Average wait time
  - Depot SLA compliance

---

## 🏗️ Architecture

### Technology Stack

**Backend**:
- Node.js + Express (ES6 modules)
- Supabase PostgreSQL database
- WebSocket (ws library) for real-time updates
- Port: 3002 (production)

**Frontend**:
- React + Vite
- WebSocket client for real-time sync
- LocalStorage for engineer session persistence

### Component Structure

```
frontend/src/dashboards/engineering/
├── EngineeringDashboard.jsx         # Main dashboard with WebSocket
├── EngineeringCardEnhanced.jsx      # Job card with all actions
├── JobDetailsModal.jsx              # 4-tab assessment viewer
├── StatusUpdatePanel.jsx            # Status transition UI
├── ResolutionDialog.jsx             # Job completion form
├── DepotStats.jsx                   # Depot performance grid
└── components/                      # Shared components
```

```
backend/routes/
├── engineering.js                   # Engineering API endpoints + WebSocket broadcast
├── breakdownsAPI.js                 # Breakdown data integration
└── webSocketHandler.js              # WebSocket connection manager
```

---

## 🚀 Deployment

### Step 1: Database Migration

Run the SQL migration to add engineering tracking columns:

```bash
cd backend/migrations
psql $DATABASE_URL -f add_engineering_tracking_columns.sql
```

**Migration includes**:
- Engineering timestamp columns (accepted_at, on_site_at, fixing_at, completed_at)
- Engineer data fields (notes, parts_used, labor_hours, repair_category, root_cause)
- Engineers table with skills and availability
- 5 sample engineers (ENG001-ENG005)
- Proper indexes for performance

### Step 2: Backend Deployment

**Render.com Deployment**:

1. Push to breakdown remote:
   ```bash
   git add .
   git commit -m "Add Engineering Dashboard"
   git push breakdown main
   ```

2. Render auto-deploys in 2-3 minutes

3. Verify deployment:
   ```bash
   curl https://breakdown-guide.onrender.com/api/engineering/jobs
   ```

**Environment Variables** (already configured on Render):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `PORT=3002`
- `NODE_ENV=production`

### Step 3: Frontend Deployment

**Option A: Render.com** (recommended):
- Auto-deploys from breakdown remote
- Served at https://breakdowns.gobarry.co.uk

**Option B: cPanel**:
```bash
cd frontend
npm run build:cpanel
# Upload dist/ contents to cPanel public_html/engineering/
```

### Step 4: WebSocket Configuration

**WebSocket URL**: Set in frontend `.env`:
```
VITE_WS_URL=wss://breakdown-guide.onrender.com
```

**WebSocket Channels**:
- `engineering` - Engineering job updates
- `breakdowns` - General breakdown events
- `sdc-dashboard` - SDC operations events

---

## 👷 Engineer Workflow

### 1. Engineer Login

**First Time**:
1. Open https://breakdowns.gobarry.co.uk/engineering
2. Click "👷 Engineer Login"
3. Enter badge number (e.g., ENG001)
4. Enter name
5. Credentials saved to localStorage

**Sample Engineer Credentials**:
- ENG001 - John Smith (Washington)
- ENG002 - Sarah Johnson (Riverside)
- ENG003 - Mike Williams (Consett)
- ENG004 - Emma Brown (Washington)
- ENG005 - David Wilson (Deptford)

### 2. View Jobs

**Filter Options**:
- **All Jobs** - Complete job queue
- **My Jobs** - Jobs assigned to me
- **Unassigned** - Awaiting engineer assignment
- **Dispatched** - Engineers en route
- **On Site** - Engineers at breakdown location
- **Priority Routes** - X10, X21, 21, 56, Route 1
- **SLA Risk** - Over 60 minutes elapsed

### 3. Accept Job

1. Review breakdown card:
   - Fleet number, location, depot
   - Issue category and severity
   - Supervisor who reported it
   - Time elapsed since breakdown created

2. Click "✓ Accept Job"
3. Enter ETA in minutes
4. Status changes to "Dispatched"
5. Job appears in "My Jobs" filter

### 4. View Full Assessment

Click "📋 View Details" to see:

**Overview Tab**:
- Key breakdown information
- Assessment summary from supervisor
- Safety concerns (if any)
- Recommended actions

**Assessment Tab**:
- Complete wizard responses
- All diagnostic data entered by supervisor
- Symptom checklist

**Timeline Tab**:
- Visual timeline with timestamps
- Duration calculations
- Total elapsed time

**Notes Tab**:
- All engineer notes chronologically
- Status when note was added
- Engineer who added note

### 5. Update Status

Click "📍 Update Status":

**Status Progression**:
1. **Dispatched** - En route (requires ETA)
2. **On Site** - Arrived at location
3. **Fixing** - Repair work started
4. **Testing** - Testing repair before completion

**At Each Stage**:
- Add optional notes
- Timestamp automatically recorded
- WebSocket broadcast to all dashboards

### 6. Complete Job

Click "✅ Complete":

**Resolution Types**:
- **Fixed on Site** - Repaired and returned to service
- **Changeover Required** - Replacement vehicle needed
- **Workshop Required** - Requires depot repair
- **Deemed Safe to Continue** - Issue not critical
- **Escalated** - Needs manager/specialist

**Required Information**:
- Resolution notes (required)
- Parts used (optional):
  - Part number
  - Description
  - Quantity
- Labor hours (decimal, e.g., 1.5)
- Repair category (Electrical, Mechanical, etc.)
- Root cause analysis
- Returned to service checkbox

---

## 📡 API Reference

### Engineering Endpoints

#### GET /api/engineering/jobs
Get engineering jobs queue with optional filtering.

**Query Parameters**:
- `filter` - all, unassigned, my_jobs, dispatched, on_site, priority
- `engineer_badge` - Required for my_jobs filter

**Response**:
```json
{
  "success": true,
  "jobs": [
    {
      "breakdown_id": "BRK-2025-001",
      "fleet_number": "6377",
      "depot": "Washington",
      "location": "Newcastle upon Tyne",
      "issue_category": "Power Steering",
      "severity": "AMBER",
      "status": "active",
      "created_at": "2025-10-04T10:30:00Z",
      "elapsed_minutes": 23,
      "is_overdue": false,
      "sla_status": "normal",
      "engineer_id": null,
      "supervisor_name": "Anthony Gair"
    }
  ],
  "count": 1,
  "filter": "all",
  "timestamp": "2025-10-04T10:53:00Z"
}
```

#### GET /api/engineering/job/:breakdown_id
Get complete job details including assessment data.

**Response**:
```json
{
  "success": true,
  "job": {
    "breakdown_id": "BRK-2025-001",
    "fleet_number": "6377",
    "wizard_responses": {...},
    "assessment_summary": {
      "issue_type": "Power Steering",
      "severity": "AMBER",
      "key_symptoms": ["Heavy steering", "Pulling left"],
      "safety_concerns": [],
      "recommended_actions": ["Check power steering pump"]
    },
    "timeline": {
      "created_at": "2025-10-04T10:30:00Z",
      "accepted_at": null,
      "on_site_at": null,
      "fixing_at": null,
      "completed_at": null,
      "time_to_accept": null,
      "time_to_site": null,
      "time_on_site": null,
      "total_elapsed": 23
    }
  }
}
```

#### POST /api/engineering/accept-job
Engineer accepts a breakdown job.

**Request**:
```json
{
  "breakdown_id": "BRK-2025-001",
  "engineer_badge": "ENG001",
  "engineer_name": "John Smith",
  "eta_minutes": 15
}
```

**Response**:
```json
{
  "success": true,
  "breakdown": {
    "breakdown_id": "BRK-2025-001",
    "engineer_badge": "ENG001",
    "engineer_name": "John Smith",
    "status": "dispatched",
    "accepted_at": "2025-10-04T10:55:00Z",
    "eta_minutes": 15
  }
}
```

**WebSocket Broadcast**:
```json
{
  "type": "job_accepted",
  "breakdown_id": "BRK-2025-001",
  "engineer_badge": "ENG001",
  "engineer_name": "John Smith",
  "breakdown": {...},
  "timestamp": "2025-10-04T10:55:00Z"
}
```

#### PUT /api/engineering/update-status
Update job status with optional notes.

**Request**:
```json
{
  "breakdown_id": "BRK-2025-001",
  "status": "on_site",
  "engineer_badge": "ENG001",
  "notes": "Arrived on site. Inspecting vehicle."
}
```

**Valid Statuses**: `dispatched`, `on_site`, `fixing`, `testing`

**Response**:
```json
{
  "success": true,
  "breakdown": {
    "breakdown_id": "BRK-2025-001",
    "status": "on_site",
    "updated_at": "2025-10-04T11:10:00Z"
  }
}
```

**WebSocket Broadcast**:
```json
{
  "type": "status_updated",
  "breakdown_id": "BRK-2025-001",
  "status": "on_site",
  "engineer_badge": "ENG001",
  "breakdown": {...},
  "timestamp": "2025-10-04T11:10:00Z"
}
```

#### POST /api/engineering/complete-job
Complete a breakdown job with resolution details.

**Request**:
```json
{
  "breakdown_id": "BRK-2025-001",
  "engineer_badge": "ENG001",
  "resolution_type": "fixed",
  "resolution_notes": "Replaced power steering pump. Tested and returned to service.",
  "parts_used": [
    {
      "partNumber": "PS-12345",
      "description": "Power Steering Pump",
      "quantity": 1
    }
  ],
  "labor_hours": 0.75,
  "repair_category": "Hydraulics",
  "root_cause": "Power steering pump seal failure due to age",
  "returned_to_service": true
}
```

**Valid Resolution Types**: `fixed`, `changeover`, `workshop_required`, `escalated`, `deem_safe`

**Response**:
```json
{
  "success": true,
  "completion": {
    "breakdown_id": "BRK-2025-001",
    "engineer_badge": "ENG001",
    "resolution_type": "fixed",
    "completed_at": "2025-10-04T11:55:00Z",
    "labor_hours": 0.75,
    "returned_to_service": true
  }
}
```

**WebSocket Broadcast**:
```json
{
  "type": "job_completed",
  "breakdown_id": "BRK-2025-001",
  "engineer_badge": "ENG001",
  "engineer_name": "John Smith",
  "resolution_type": "fixed",
  "breakdown": {...},
  "timestamp": "2025-10-04T11:55:00Z"
}
```

---

## 🔌 WebSocket Events

### Connection

```javascript
const ws = new WebSocket('wss://breakdown-guide.onrender.com');

ws.onopen = () => {
  // Subscribe to engineering channel
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'engineering'
  }));
};
```

### Event Types

**job_accepted** - Engineer accepted a job
**status_updated** - Job status changed
**job_completed** - Job marked as complete
**new_breakdown** - New breakdown created (from supervisors)

### Event Handling

```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'job_accepted':
      console.log(`${data.engineer_name} accepted ${data.breakdown_id}`);
      break;
    case 'status_updated':
      console.log(`${data.breakdown_id} status: ${data.status}`);
      break;
    case 'job_completed':
      console.log(`${data.breakdown_id} completed: ${data.resolution_type}`);
      break;
  }
};
```

---

## 🗄️ Database Schema

### New Columns in `breakdowns` Table

```sql
-- Engineering workflow timestamps
engineer_accepted_at TIMESTAMPTZ
engineer_on_site_at TIMESTAMPTZ
engineer_fixing_at TIMESTAMPTZ
engineer_completed_at TIMESTAMPTZ

-- Engineer assignment
engineer_id VARCHAR(50)
engineer_name VARCHAR(100)
engineer_badge VARCHAR(20)
engineer_eta_minutes INTEGER

-- Engineering data
engineer_notes JSONB DEFAULT '[]'::jsonb
parts_used JSONB
labor_hours DECIMAL(5,2)
repair_category VARCHAR(100)
root_cause TEXT
```

### New `engineers` Table

```sql
CREATE TABLE engineers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  depot VARCHAR(50) NOT NULL,
  skills JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'available',
  current_location GEOGRAPHY(POINT, 4326),
  current_breakdown_id VARCHAR(50),
  shift_start TIME,
  shift_end TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🐛 Troubleshooting

### Engineer Login Not Persisting

**Issue**: Engineer badge not saved after login.

**Solution**: Check browser localStorage:
```javascript
localStorage.getItem('engineer_badge');
localStorage.getItem('engineer_name');
```

Clear and re-login if needed:
```javascript
localStorage.clear();
```

### WebSocket Not Connecting

**Issue**: Red "Offline" indicator.

**Check**:
1. Verify WebSocket URL in `.env`:
   ```
   VITE_WS_URL=wss://breakdown-guide.onrender.com
   ```

2. Test WebSocket connection:
   ```javascript
   const ws = new WebSocket('wss://breakdown-guide.onrender.com');
   ws.onopen = () => console.log('Connected');
   ws.onerror = (e) => console.error('Error:', e);
   ```

3. Check backend logs on Render:
   ```
   Render Dashboard > breakdown-guide > Logs
   ```

### Jobs Not Loading

**Issue**: "No jobs matching the selected filter" message.

**Debug**:
1. Check API response:
   ```bash
   curl https://breakdown-guide.onrender.com/api/engineering/jobs
   ```

2. Verify Supabase connection:
   - Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` env vars
   - Test database connection in Render logs

3. Check for active breakdowns in Supabase:
   ```sql
   SELECT * FROM breakdowns WHERE status != 'resolved' ORDER BY created_at DESC;
   ```

### Status Update Failing

**Issue**: Status doesn't change when clicking update.

**Debug**:
1. Check browser console for errors
2. Verify engineer_badge is set
3. Test API directly:
   ```bash
   curl -X PUT https://breakdown-guide.onrender.com/api/engineering/update-status \
     -H "Content-Type: application/json" \
     -d '{
       "breakdown_id": "BRK-2025-001",
       "status": "on_site",
       "engineer_badge": "ENG001"
     }'
   ```

### Parts Tracking Not Saving

**Issue**: Parts used not showing in completion.

**Solution**: Ensure parts array has valid entries:
```json
{
  "parts_used": [
    {
      "partNumber": "PS-12345",  // Required
      "description": "Power Steering Pump",  // Required
      "quantity": 1  // Required, integer
    }
  ]
}
```

Empty part rows are automatically filtered out.

---

## 📊 Metrics & Analytics

### SLA Targets

- **STOP severity**: 30 minutes response
- **AMBER severity**: 60 minutes response
- **CONTINUE severity**: 120 minutes response

### Performance KPIs

- **First Time Fix Rate**: Jobs fixed on site without changeover
- **Average Response Time**: Time from breakdown to engineer on site
- **Average Repair Time**: Time from on site to completion
- **SLA Compliance**: % of jobs meeting SLA targets
- **Engineer Utilization**: % of shift time on jobs

### Access Metrics

```bash
GET /api/engineering/metrics?period=today
GET /api/engineering/metrics?period=week
GET /api/engineering/performance?depot=Washington
GET /api/engineering/sla?period=month
```

---

## 🔐 Security

### Authentication

- Engineers: Badge-based login with localStorage persistence
- API: Supabase JWT authentication for protected routes
- WebSocket: Token-based authentication (development mode bypasses)

### Data Access

- Engineers can only update jobs assigned to them
- All engineering routes require valid engineer badge
- WebSocket messages filtered by channel subscription

---

## 📞 Support

**Technical Issues**: Anthony Gair (AG003)
**Database**: Supabase Project `oieliubbvvdzhzvikzal`
**Backend**: Render.com (breakdown-guide)
**Frontend**: Render.com / cPanel

**GitHub Repository**: https://github.com/HairyGair/Breakdown_Guide

---

**Last Updated**: October 4, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
