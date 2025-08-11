# Breakdown Tracking System - Implementation Plan
**Created**: January 2025  
**Project**: GO BARRY Fleet Breakdown Analytics  
**Author**: System Architecture Team

## 📋 Executive Summary
Implement a comprehensive breakdown tracking system that logs all interactions with the breakdown wizard, provides real-time monitoring via a live dashboard, and enables audit trails for management review.

## 🎯 Key Objectives
1. Track every breakdown from initial report to resolution
2. Provide real-time visibility of active breakdowns
3. Enable audit trails for compliance and analysis
4. Auto-escalate critical issues
5. Archive historical data for pattern analysis

## 🏗️ System Architecture

### 📌 EXISTING INFRASTRUCTURE (JANUARY 2025)

#### Current Supabase Table Structure
**Table**: `breakdowns` (Already exists with following columns):
- `id` (uuid) - Primary key
- `supervisor_id`, `supervisor_badge` - Supervisor tracking
- `vehicle_reg`, `fleet_no`, `vehicle_id` - Fleet identification
- `breakdown_type` - Fault classification
- `timestamp`, `created_at`, `updated_at`, `closed_at` - Time tracking
- `depot_id`, `route_id`, `service_number`, `location` - Location data
- `severity`, `status` - Current state
- `wizard_type`, `assessment_id` - Wizard tracking
- `total_duration_minutes` - Duration calculation

#### Existing Backend APIs
- **`/backend/routes/breakdownTrackerAPI.js`** - Main breakdown tracking (TO BE MODIFIED)
- **`/backend/routes/breakdownAssessmentAPI.js`** - Assessment logging with auth
- **`/backend/routes/breakdowns.js`** - Basic logging and analytics
- **`/backend/routes/breakdownAnalyticsAPI.js`** - Analytics endpoints

#### Existing Frontend Components
- **`/public/breakdown-guide/supervisorBreakdownLogger.js`** - Client-side logger
- **`/public/enhanced-breakdown-dashboard.html`** - Live dashboard (EXISTS)
- **`/public/breakdown-guide/guide.html`** - Main breakdown guide

### Database Structure
**Required Additions to existing `breakdowns` table**:

```sql
-- Migration script for missing columns
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS
  breakdown_id VARCHAR(20) UNIQUE, -- Format: BD-2025-00001
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS
  daily_id INTEGER
  
  -- (Already exist: fleet_no, depot_id, location, route_id)
  
  -- Additional timestamps needed
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS
  diagnosed_at TIMESTAMP;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS
  resolved_at TIMESTAMP;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS
  returned_to_service_at TIMESTAMP;
  
  -- (Already exist: supervisor_id, supervisor_badge)
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS
  resolving_supervisor VARCHAR(10);
  
  -- (Already exists: status)
  
  -- Step History (JSON)
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS
  wizard_steps JSONB DEFAULT '[]';
  
  -- Resolution Details
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS
  resolution_notes TEXT;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS
  passenger_cloud_used BOOLEAN DEFAULT FALSE;
  
  -- Flags
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS
  is_priority BOOLEAN DEFAULT FALSE;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS
  is_secured_service BOOLEAN DEFAULT FALSE;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS
  auto_escalated BOOLEAN DEFAULT FALSE;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS
  escalated_at TIMESTAMP;
  
  -- Pattern Detection
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS
  repeat_breakdown BOOLEAN DEFAULT FALSE;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS
  previous_breakdown_id VARCHAR(20);
  
  -- Archival
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS
  archived BOOLEAN DEFAULT FALSE;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS
  archived_at TIMESTAMP;

-- Indexes for performance
CREATE INDEX idx_breakdown_status ON breakdowns(status);
CREATE INDEX idx_breakdown_fleet ON breakdowns(fleet_number);
CREATE INDEX idx_breakdown_created ON breakdowns(created_at);
CREATE INDEX idx_breakdown_daily ON breakdowns(daily_id, created_at);
```

### Priority Services Configuration Table
```sql
CREATE TABLE priority_services (
  id SERIAL PRIMARY KEY,
  route_number VARCHAR(10) UNIQUE NOT NULL,
  priority_level VARCHAR(20), -- 'critical', 'secured', 'important'
  color_code VARCHAR(7),      -- Hex color for display
  created_by VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Default priority routes
INSERT INTO priority_services (route_number, priority_level, color_code) VALUES
  ('X10', 'critical', '#FF0000'),
  ('X21', 'critical', '#FF0000');
```

## 📐 Implementation Phases

### Phase 1: Backend Infrastructure (Week 1)

#### 1.1 API Endpoints
Create `/backend/routes/breakdowns.js`:

**Core Endpoints:**
- `POST /api/breakdowns/start` - Initialize new breakdown
- `POST /api/breakdowns/step` - Log wizard step
- `POST /api/breakdowns/diagnose` - Mark as diagnosed (start timer)
- `PUT /api/breakdowns/:id/resolve` - Mark as resolved
- `GET /api/breakdowns/live` - Get all active breakdowns
- `GET /api/breakdowns/today` - Get today's breakdowns (since 1am)
- `DELETE /api/breakdowns/:id` - Admin only deletion

**Supporting Endpoints:**
- `GET /api/breakdowns/fleet/:fleetNumber/history` - Last 7 days history
- `POST /api/breakdowns/:id/escalate` - Manual escalation
- `GET /api/priority-services` - Get priority routes list
- `POST /api/priority-services` - Admin: Add priority route

#### 1.2 Memory-Optimized Processing
```javascript
// Implement in breakdowns.js
const breakdownCache = new Map(); // Cache active breakdowns only
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Auto-archival job (runs daily at 2am)
schedule.scheduleJob('0 2 * * *', async () => {
  await archiveOldBreakdowns(); // Archive >30 days
  await resetDailyCounter();     // Reset daily_id counter
});
```

#### 1.3 Convex Integration
Create `/Go_BARRY/convex/breakdowns.ts`:
```typescript
// Real-time breakdown sync
export const liveBreakdowns = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("breakdowns")
      .filter(q => q.eq(q.field("status"), "active"))
      .collect();
  }
});
```

### Phase 2: Breakdown Wizard Modifications (Week 1-2)

#### 2.1 Modify Existing Wizard Files
Update `/public/breakdown-guide/` wizard files:

**Add to each wizard HTML:**
```javascript
// Breakdown tracking integration
const breakdownTracker = {
  sessionId: null,
  
  async init(fleetNumber) {
    const response = await fetch('/api/breakdowns/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fleet_number: fleetNumber,
        supervisor: getCurrentSupervisor(),
        location: getCurrentLocation()
      })
    });
    const data = await response.json();
    this.sessionId = data.breakdown_id;
  },
  
  async logStep(stepType, stepData) {
    if (!this.sessionId) return;
    
    await fetch('/api/breakdowns/step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        breakdown_id: this.sessionId,
        step_type: stepType,
        step_data: stepData,
        timestamp: new Date().toISOString()
      })
    });
  },
  
  async complete(resolution) {
    await fetch('/api/breakdowns/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        breakdown_id: this.sessionId,
        resolution: resolution
      })
    });
    
    // Show Passenger Cloud button
    showPassengerCloudOption();
  }
};
```

**Step Types to Track:**
- `wizard_opened` - Wizard selected
- `fleet_entered` - Fleet number input
- `location_set` - Location entered
- `fault_selected` - Fault type chosen
- `action_taken` - Each troubleshooting step
- `diagnosis_complete` - Final resolution

#### 2.2 Add Passenger Cloud Integration
```html
<!-- Add to wizard completion screen -->
<div id="passenger-cloud-section" style="display:none;">
  <h3>Journey Cancellation Required?</h3>
  <button onclick="openPassengerCloud()" class="btn-warning">
    Cancel Journey in Passenger Cloud
  </button>
  <button onclick="skipPassengerCloud()" class="btn-success">
    No Cancellation Needed
  </button>
</div>

<script>
function openPassengerCloud() {
  breakdownTracker.logStep('passenger_cloud_opened', {});
  window.open('https://gonortheast.passenger-app.com/network/journeys/cancellations', '_blank');
}
</script>
```

### Phase 3: Live Tracker Dashboard (Week 2)

#### 3.1 Update Enhanced Breakdown Dashboard
Modify `/public/enhanced-breakdown-dashboard.html`:

**Real-time Data Feed:**
```javascript
// Dual sync approach
const breakdownMonitor = {
  // Primary: Convex real-time
  convexClient: null,
  
  // Fallback: API polling
  pollInterval: null,
  
  async init() {
    // Try Convex first
    try {
      this.convexClient = new ConvexReactClient(CONVEX_URL);
      this.subscribeToConvex();
    } catch (e) {
      // Fallback to polling
      this.startPolling();
    }
  },
  
  subscribeToConvex() {
    this.convexClient.subscribe('liveBreakdowns', {}, (data) => {
      this.updateDashboard(data);
    });
  },
  
  startPolling() {
    this.pollInterval = setInterval(async () => {
      const response = await fetch('/api/breakdowns/live');
      const data = await response.json();
      this.updateDashboard(data.breakdowns);
    }, 5000); // Poll every 5 seconds
  },
  
  updateDashboard(breakdowns) {
    // Update UI with breakdown data
    renderActiveBreakdowns(breakdowns);
    updateStatistics(breakdowns);
    checkEscalations(breakdowns);
  }
};
```

**Dashboard Features:**
```javascript
// Timer display for each breakdown
function renderBreakdownCard(breakdown) {
  const timeSinceDiagnosis = Date.now() - new Date(breakdown.diagnosed_at);
  const isOverdue = timeSinceDiagnosis > 30 * 60 * 1000; // 30 mins
  
  return `
    <div class="breakdown-card ${breakdown.is_priority ? 'priority' : ''} 
                               ${isOverdue ? 'overdue' : ''}">
      <div class="header">
        <span class="fleet">${breakdown.fleet_number}</span>
        <span class="depot">${breakdown.depot}</span>
        ${breakdown.repeat_breakdown ? '<span class="repeat-flag">⚠️ REPEAT</span>' : ''}
      </div>
      <div class="timer">
        <span class="time">${formatDuration(timeSinceDiagnosis)}</span>
        <span class="status">${breakdown.status}</span>
      </div>
      <div class="actions">
        <button onclick="viewDetails('${breakdown.breakdown_id}')">Details</button>
        <button onclick="resolveBreakdown('${breakdown.breakdown_id}')">Resolve</button>
      </div>
    </div>
  `;
}

// Quick filters
const filters = {
  showAll: () => fetchBreakdowns(),
  showMine: () => fetchBreakdowns({ supervisor: getCurrentSupervisor() }),
  showCritical: () => fetchBreakdowns({ priority: true }),
  showOverdue: () => fetchBreakdowns({ overdue: true })
};
```

**Auto-escalation:**
```javascript
// Check for breakdowns needing escalation
function checkEscalations(breakdowns) {
  breakdowns.forEach(breakdown => {
    const timeSince = Date.now() - new Date(breakdown.diagnosed_at);
    
    if (timeSince > 30 * 60 * 1000 && !breakdown.auto_escalated) {
      escalateBreakdown(breakdown.breakdown_id);
      
      // Push to Control Room Display if priority
      if (breakdown.is_priority) {
        pushToControlRoom({
          type: 'BREAKDOWN_ESCALATION',
          fleet: breakdown.fleet_number,
          route: breakdown.route_number,
          duration: formatDuration(timeSince)
        });
      }
    }
  });
}
```

### Phase 4: Admin Controls & Analytics (Week 2-3)

#### 4.1 Admin Panel Integration
Add to `/Go_BARRY/app/admin/breakdowns.jsx`:

**Features:**
- View all breakdowns (with pagination)
- Delete erroneous entries
- Configure priority services
- View pattern analysis
- Export data for reports

```javascript
// Priority service configuration
const PriorityServiceManager = () => {
  const [services, setServices] = useState([]);
  
  const addPriorityService = async (route, level, color) => {
    await fetch('/api/priority-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ route_number: route, priority_level: level, color_code: color })
    });
    refreshServices();
  };
  
  return (
    <div className="priority-manager">
      <h3>Priority Service Configuration</h3>
      <table>
        <thead>
          <tr><th>Route</th><th>Priority</th><th>Color</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {services.map(service => (
            <tr key={service.route_number}>
              <td>{service.route_number}</td>
              <td>{service.priority_level}</td>
              <td><div style={{backgroundColor: service.color_code, width: 20, height: 20}} /></td>
              <td><button onClick={() => removeService(service.id)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

#### 4.2 Pattern Detection
```javascript
// Detect repeat breakdowns
async function checkBreakdownPatterns(fleetNumber) {
  const history = await fetch(`/api/breakdowns/fleet/${fleetNumber}/history`);
  const data = await history.json();
  
  if (data.breakdowns.length >= 3) {
    return {
      isRepeat: true,
      count: data.breakdowns.length,
      shouldFlag: true,
      message: `⚠️ Fleet ${fleetNumber} has broken down ${data.breakdowns.length} times in 7 days`
    };
  }
  
  return { isRepeat: data.breakdowns.length > 0, count: data.breakdowns.length };
}
```

### Phase 5: Control Room Display Integration (Week 3)

#### 5.1 Push Notifications
Update `/Go_BARRY/components/DisplayScreen.jsx`:

```javascript
// Add breakdown alerts to display
const BreakdownAlert = ({ breakdown }) => {
  if (!breakdown.is_priority) return null;
  
  return (
    <div className="breakdown-alert critical">
      <h3>🚨 PRIORITY BREAKDOWN</h3>
      <p>Fleet: {breakdown.fleet_number}</p>
      <p>Route: {breakdown.route_number}</p>
      <p>Location: {breakdown.location}</p>
      <p>Duration: {calculateDuration(breakdown.diagnosed_at)}</p>
    </div>
  );
};
```

## 🧪 Testing Strategy

### Unit Tests
- ID generation (sequential and daily reset)
- Timer calculations
- Pattern detection logic
- Escalation triggers

### Integration Tests
- Wizard → API → Database flow
- Real-time sync via Convex
- Archive job execution
- Admin deletion cascade

### User Acceptance Tests
- Supervisor workflow (start to finish)
- Live dashboard updates
- Filter functionality
- Resolution process

## 📊 Success Metrics

1. **Operational**
   - Average time to diagnosis < 10 mins
   - Average time to resolution < 45 mins
   - Pattern detection accuracy > 95%

2. **Technical**
   - API response time < 200ms
   - Dashboard update latency < 2s
   - Memory usage < 100MB

3. **Business**
   - Reduction in repeat breakdowns
   - Improved audit trail compliance
   - Faster vehicle return to service

## 🚀 Rollout Plan

**Week 1**: Backend setup, database schema, API endpoints  
**Week 2**: Wizard integration, live tracker updates  
**Week 3**: Admin controls, Control Room integration  
**Week 4**: Testing, refinement, documentation  
**Week 5**: Pilot with 2 supervisors  
**Week 6**: Full rollout to all supervisors

## 📝 Future Enhancements

1. **Phase 2 Features**
   - Cost tracking (tow charges, parts)
   - Engineering ticket auto-creation
   - Predictive maintenance alerts
   - Photo integration from Tranzaura

2. **Integration Opportunities**
   - Link to duty boards when available
   - SDC system integration
   - Automatic parts ordering
   - Insurance claim preparation

3. **Analytics Expansion**
   - Breakdown heatmaps by location
   - Depot performance comparisons
   - Seasonal pattern analysis
   - Manufacturer defect tracking

## 🔒 Security & Compliance

- Supervisor authentication required
- Admin-only deletion rights
- Full audit trail maintained
- Traffic Commissioner compliance preserved
- 30-day data retention with archival

## 📚 Documentation Requirements

1. Supervisor training guide
2. Admin configuration manual
3. API documentation
4. Troubleshooting guide
5. Compliance audit procedures

---

**Status**: Ready for Phase 1 implementation  
**Owner**: Control Room Team  
**Review Date**: February 2025