# Roadworks Escalation System - Implementation Plan

## Overview
Complete implementation plan for the Go BARRY Roadworks Escalation System, integrating supervisor alerts with Display Screen and Disruption Database, including route deviation calculations and comprehensive audit trails.

**Last Updated:** December 2024  
**Author:** Go BARRY Development Team  
**Status:** Ready for Implementation

---

## 📊 Progress Tracker

### Overall Progress: 5/25 Tasks Complete (20%)

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Core Escalation | ✅ Complete | 5/5 |
| Phase 2: Disruption Database | ⏳ Not Started | 0/5 |
| Phase 3: Diversion Data | ⏳ Not Started | 0/5 |
| Phase 4: Google API Integration | ⏳ Not Started | 0/5 |
| Phase 5: Polish & Testing | ⏳ Not Started | 0/5 |

---

## 🎯 System Goals

1. **Seamless Escalation Flow**: One-click push from alerts to Display Screen
2. **Automatic Disruption Tracking**: All escalated alerts create disruption records
3. **Intelligent Route Deviations**: Pre-calculated mileage impacts from Excel data
4. **Complete Audit Trail**: Every action logged for accountability
5. **Reactivation Management**: Handle recurring roadworks efficiently
6. **De-duplication**: Prevent duplicate entries across systems

---

## 🏗️ Architecture Overview

```
Roadworks Alert → Escalate Button → Push to Display → Auto-create Disruption Record
                                 ↓                  ↓
                        Display Screen Queue    Disruption Database
                                 ↓                  ↓
                        Map Auto-zoom        Mileage Tracking
                                              ↓
                                     Excel Export/Sync
```

---

## 📋 Core Features

### 1. Escalation Button Enhancement

**Location:** `RoadworksManagerDashboard.jsx`

**Implementation:**
```javascript
const handleEscalate = async (alert) => {
  // Show confirmation modal
  const confirmed = await showModal({
    title: "Push to Control Room Display?",
    message: `This will display the alert on the control room screen.`,
    buttons: ["Cancel", "Push to Display"]
  });
  
  if (confirmed) {
    // Push to display via Convex
    await pushToDisplay(alert);
    
    // Create disruption record
    await createDisruptionRecord(alert);
    
    // Log action
    await logSupervisorAction({
      action: 'ESCALATE_TO_DISPLAY',
      alertId: alert.id,
      supervisor: currentSupervisor.badge,
      timestamp: new Date()
    });
    
    // Remove from roadworks dashboard
    removeFromDashboard(alert.id);
  }
};
```

### 2. Display Screen Integration

**Updates Required:** `DisplayScreen.jsx`

**New Features:**
- Alerts join regular rotation queue
- Small text showing "Pushed by [Badge] at [Time]"
- Auto-zoom map when coordinates available
- Duration counter showing time on display

**Data Structure:**
```javascript
{
  ...originalAlert,
  displayMetadata: {
    pushedBy: 'AW001',
    pushedAt: '2024-12-08T14:32:00Z',
    source: 'supervisor_escalation',
    durationOnDisplay: 0 // increments every minute
  }
}
```

### 3. Disruption Database Integration

**New Table Schema:**
```sql
CREATE TABLE disruptions (
  id UUID PRIMARY KEY,
  alert_id UUID REFERENCES alerts(id),
  status VARCHAR(50), -- 'Active', 'Ended', 'Reactivated', 'Completed'
  location TEXT,
  affected_routes TEXT[],
  normal_mileage DECIMAL,
  diversion_mileage DECIMAL,
  mileage_difference DECIMAL,
  pushed_by VARCHAR(10),
  created_at TIMESTAMP,
  ended_at TIMESTAMP,
  reactivation_count INTEGER DEFAULT 0,
  reactivation_history JSONB,
  notes TEXT
);
```

**Auto-Population Flow:**
1. Escalate button clicked
2. Disruption record created with status 'Active'
3. Route matching runs to identify affected services
4. Mileage data pulled from diversion database
5. Record appears in Disruption Database immediately

### 4. Reactivation Features

**UI Elements:**
- Status badges: "Reactivated 3 times"
- Quick reactivate button on ended disruptions
- History timeline showing pattern

**Implementation:**
```javascript
const reactivateDisruption = async (disruptionId) => {
  const disruption = await getDisruption(disruptionId);
  
  // Update disruption record
  await updateDisruption(disruptionId, {
    status: 'Reactivated',
    reactivation_count: disruption.reactivation_count + 1,
    reactivation_history: [
      ...disruption.reactivation_history,
      {
        timestamp: new Date(),
        supervisor: currentSupervisor.badge,
        reason: 'Works resumed'
      }
    ]
  });
  
  // Push back to display
  await pushToDisplay(disruption.alert);
};
```

### 5. Route Deviation System

**Phase 1: Excel Data Integration**

**Import Process:**
```javascript
// Load regular diversions from Excel
const importDiversions = async () => {
  const diversions = await parseExcel('NEW Diversion Mileage.xlsx');
  
  // Store in database
  for (const diversion of diversions) {
    await createDiversionTemplate({
      from: diversion.From,
      via: diversion.Via,
      omit: diversion.Omit,
      to: diversion.To,
      service: diversion.Service,
      normalMileage: diversion['Normal Mileage'],
      diversionMileage: diversion['Diversion Mileage'],
      difference: diversion.Difference,
      lowBridge: diversion['Low Bridge on Diversion?'],
      driverMessage: diversion['Diversion Message']
    });
  }
};
```

**Matching Algorithm:**
```javascript
const matchDiversion = (roadworkLocation) => {
  // Smart fuzzy matching
  const matches = diversionTemplates.filter(template => {
    const locationLower = roadworkLocation.toLowerCase();
    const fromLower = template.from.toLowerCase();
    const toLower = template.to.toLowerCase();
    
    return locationLower.includes(fromLower) || 
           locationLower.includes(toLower) ||
           fuzzyMatch(locationLower, fromLower) > 0.8;
  });
  
  return matches;
};
```

**Phase 2: Google Directions API Integration**

```javascript
const calculateNewDiversion = async (roadwork, affectedRoutes) => {
  const results = [];
  
  for (const route of affectedRoutes) {
    // Get route stops from GTFS
    const stops = await getRouteStops(route);
    
    // Find stops before and after roadwork
    const [beforeStop, afterStop] = findAffectedSegment(stops, roadwork.coordinates);
    
    // Calculate normal route
    const normalRoute = await googleDirections({
      origin: beforeStop.coordinates,
      destination: afterStop.coordinates,
      waypoints: getIntermediateStops(beforeStop, afterStop)
    });
    
    // Calculate diversion avoiding roadwork
    const diversionRoute = await googleDirections({
      origin: beforeStop.coordinates,
      destination: afterStop.coordinates,
      avoid: roadwork.coordinates,
      mode: 'driving'
    });
    
    results.push({
      service: route,
      normalMileage: normalRoute.distance,
      diversionMileage: diversionRoute.distance,
      difference: diversionRoute.distance - normalRoute.distance,
      diversionPath: diversionRoute.path
    });
  }
  
  return results;
};
```

### 6. Audit Trail System

**Comprehensive Logging:**
```javascript
const auditActions = {
  PUSH_TO_DISPLAY: 'Alert pushed to display screen',
  END_DISPLAY: 'Alert removed from display screen',
  CREATE_DISRUPTION: 'Disruption record created',
  UPDATE_DISRUPTION: 'Disruption details updated',
  REACTIVATE: 'Disruption reactivated',
  COMPLETE: 'Disruption marked complete',
  EXPORT_DATA: 'Data exported to Excel'
};

const logAction = async (action, details) => {
  await convexClient.mutation(api.audit.log, {
    action,
    supervisor: currentSupervisor.badge,
    timestamp: new Date(),
    details,
    ip: getUserIP(),
    sessionId: getSessionId()
  });
};
```

### 7. De-duplication Flow

**Prevention Logic:**
```javascript
const checkDuplication = async (alert) => {
  // Check if already in disruption database
  const existing = await findDisruption({
    location: alert.location,
    status: ['Active', 'Reactivated']
  });
  
  if (existing) {
    return {
      isDuplicate: true,
      existingId: existing.id,
      message: 'This roadwork is already in the Disruption Database'
    };
  }
  
  return { isDuplicate: false };
};
```

**Visual Indicators:**
- Alerts already escalated show "In Disruption Database" badge
- Escalate button disabled with tooltip explanation
- Search function shows all instances (active and historical)

---

## 🎨 UI/UX Enhancements

### Display Screen Layout (55" Screen)

```
┌─────────────────────────────────────────────────────────┐
│                    GO BARRY CONTROL ROOM                 │
├─────────────────┬────────────────────┬──────────────────┤
│                 │                      │                  │
│  ACTIVE ALERTS  │    TRAFFIC MAP      │   SUPERVISOR     │
│                 │                      │    ACTIVITY      │
│  ┌───────────┐  │   [Interactive      │                  │
│  │ Alert 1   │  │    TomTom Map       │  AW001: Pushed   │
│  │ Pushed by │  │    with alerts]     │   alert 14:32    │
│  │ AC002     │  │                     │                  │
│  └───────────┘  │                     │  CF004: Ended    │
│                 │                     │   alert 14:45    │
│  ┌───────────┐  │                     │                  │
│  │ Alert 2   │  │                     │  JP007: Created  │
│  │ 45 mins   │  │                     │   disruption     │
│  └───────────┘  │                     │                  │
│                 │                     │                  │
└─────────────────┴────────────────────┴──────────────────┘
```

### Polish Features

**Animations:**
- Smooth slide-in when alert pushed
- Fade-out when alert ended
- Pulse effect on new escalations

**Keyboard Shortcuts:**
- `Ctrl+P` - Push to display
- `Ctrl+E` - End display
- `Ctrl+R` - Reactivate
- `Ctrl+D` - View disruption details

**Sound Effects:**
- Subtle chime on new escalation
- Different tone for ended alerts
- Configurable volume/mute

**Smart Features:**
- Auto-complete location names
- Previous disruption suggestions
- Pattern detection alerts

---

## 🔧 Implementation Steps

### Phase 1: Core Escalation (Week 1) ✅ COMPLETE
1. [x] Add escalation modal to RoadworksManagerDashboard
2. [x] Implement Convex mutations for display queue  
3. [x] Add supervisor badge labels
4. [x] Update DisplayScreen to show pushed alerts
5. [x] Implement "End Display" functionality

**Phase 1 Completion Summary (December 2024):**
- ✓ Supervisors can push roadworks to Control Room Display with one click
- ✓ Escalation modal captures optional reason for pushing to display
- ✓ DisplayScreen shows pushed roadworks in rotation with other alerts
- ✓ Supervisor badge shown on display for accountability
- ✓ "End Display" button allows removal from display when no longer needed
- ✓ Real-time sync via Convex ensures all screens update instantly
- ✓ Full audit trail logs all escalation and end display actions

### Phase 2: Disruption Database (Week 2)
1. [ ] Create disruption table schema
2. [ ] Auto-create records on escalation
3. [ ] Build disruption management UI
4. [ ] Implement reactivation flow
5. [ ] Add audit logging

### Phase 3: Diversion Data (Week 3)
1. [ ] Import Excel diversion templates
2. [ ] Build location matching algorithm
3. [ ] Create diversion suggestion UI
4. [ ] Calculate mileage impacts
5. [ ] Add driver message templates

### Phase 4: Google API Integration (Week 4)
1. [ ] Set up Google Directions API
2. [ ] Implement route calculation
3. [ ] Build GTFS integration
4. [ ] Test accuracy with known routes
5. [ ] Add fallback for API failures

### Phase 5: Polish & Testing (Week 5)
1. [ ] Add animations and transitions
2. [ ] Implement keyboard shortcuts
3. [ ] Add sound effects (optional)
4. [ ] Comprehensive testing
5. [ ] Supervisor training materials

---

## 🗄️ Database Changes

### New Tables
- `display_queue` - Alerts currently on display
- `disruptions` - Main disruption records
- `diversion_templates` - Pre-calculated diversions
- `audit_log` - Comprehensive action logging

### Modified Tables
- `alerts` - Add `in_disruption_db` flag
- `supervisor_sessions` - Track escalation permissions

---

## 🔌 API Endpoints

### New Endpoints
- `POST /api/alerts/push-to-display`
- `POST /api/alerts/end-display`
- `POST /api/disruptions/create`
- `POST /api/disruptions/reactivate`
- `GET /api/diversions/match/:location`
- `POST /api/diversions/calculate`
- `GET /api/audit/actions/:supervisorId`

### Modified Endpoints
- `GET /api/alerts/unified` - Exclude escalated alerts
- `GET /api/display/queue` - Include pushed alerts

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] Escalate button creates disruption record
- [ ] Alerts appear on Display Screen
- [ ] Supervisor badge shows correctly
- [ ] End Display removes from screen
- [ ] Reactivation maintains history
- [ ] De-duplication prevents doubles
- [ ] Audit trail captures all actions

### Integration Tests
- [ ] Convex real-time sync works
- [ ] Excel data imports correctly
- [ ] Google API returns valid routes
- [ ] GTFS matching is accurate
- [ ] Export matches Excel format

### Performance Tests
- [ ] Display Screen handles 50+ alerts
- [ ] Map zooming is smooth
- [ ] API responses < 200ms
- [ ] No memory leaks

---

## 🚨 Error Handling

### Network Failures
```javascript
try {
  await pushToDisplay(alert);
} catch (error) {
  // Queue for retry
  await queueForRetry({
    action: 'PUSH_TO_DISPLAY',
    data: alert,
    attempts: 0
  });
  
  showToast('Network issue - will retry automatically');
}
```

### API Limits
- Google Directions: 2,500 requests/day
- Implement caching for common routes
- Fallback to templates if limit reached

### Data Validation
- Validate all user inputs
- Sanitize location strings
- Verify coordinate formats
- Check mileage calculations

---

## 📈 Success Metrics

1. **Adoption Rate**: 80%+ supervisors using escalation
2. **Response Time**: < 5 mins from alert to display
3. **Accuracy**: 90%+ correct route matches
4. **Uptime**: 99.9% Display Screen availability
5. **Data Quality**: 100% audit trail completeness

---

## 🎓 Training Requirements

### Supervisor Training
1. How to escalate alerts
2. When to escalate vs dismiss
3. Understanding mileage impacts
4. Using reactivation features
5. Reading audit reports

### Control Room Training
1. Understanding pushed alerts
2. Responding to escalations
3. Using the enhanced display
4. Shift handover process

---

## 🔮 Future Enhancements

1. **Machine Learning**: Predict which alerts need escalation
2. **Integration**: Direct bus driver notifications
3. **Analytics**: Disruption pattern analysis
4. **Automation**: Auto-escalate severe impacts
5. **Mobile**: Supervisor app for field updates

---

## 📝 Notes

- All times in UTC, display in local time
- Mileage in miles (not kilometers)
- Services include lettered variants (10A, 10B)
- Low bridge warnings are critical
- BIRS integration planned for Phase 6

---

## ✅ Master Checklist - Key Deliverables

### Frontend Components
- [ ] Escalation modal in RoadworksManagerDashboard
- [ ] Updated DisplayScreen with pushed alerts
- [ ] Disruption Database UI
- [ ] Reactivation interface
- [ ] Diversion suggestion UI
- [ ] "End Display" functionality

### Backend/API
- [ ] Convex mutations for display queue
- [ ] Disruption table schema
- [ ] Excel import functionality
- [ ] Location matching algorithm
- [ ] Google Directions integration
- [ ] Audit logging system
- [ ] All 7 new API endpoints

### Data Integration
- [ ] Import 115 Excel diversion templates
- [ ] GTFS route matching
- [ ] Mileage calculations
- [ ] Driver message templates

### Testing & Documentation
- [ ] All functional tests passing
- [ ] Performance benchmarks met
- [ ] Supervisor training materials
- [ ] Control room procedures

---

**End of Implementation Plan**