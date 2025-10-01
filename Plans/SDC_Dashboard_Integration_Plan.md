# SDC Dashboard Integration Plan
## Go North East Breakdown Management System

**Created**: January 2025  
**Author**: Integration Team  
**Status**: Ready for Implementation

---

## 🎯 Project Overview

Seamlessly integrate the Breakdown Assessment Guide with the SDC Operations Dashboard V2 to create a unified, real-time breakdown management experience with full audit trail capabilities.

### Key Objectives
1. ✅ Automatic redirect from assessment completion to dashboard
2. ✅ Real-time progress tracking during assessments
3. ✅ Full edit capability with audit trail
4. ✅ WebSocket implementation with polling fallback
5. ✅ Enhanced decision display and supervisor context

---

## 📋 Implementation Stages

### Stage 1: Core Integration (Day 1-2)
**Priority: CRITICAL**

#### 1.1 Database Enhancements
- [ ] Add `decision_details` JSON column to breakdowns table
- [ ] Create `breakdown_edits` audit table
- [ ] Add `wizard_responses` JSON column for full step tracking
- [ ] Create indexes for performance optimization
- [ ] Add triggers for automatic audit logging

#### 1.2 Dashboard Updates
- [ ] Update `sdc-operations-dashboard-v2.html` with new layout
- [ ] Add decision display (STOP/AMBER/CONTINUE)
- [ ] Implement breakdown focus on redirect
- [ ] Add "My Breakdowns" filter
- [ ] Display outstanding breakdown count in header

#### 1.3 Breakdown Guide Integration
- [ ] Add redirect logic after assessment completion
- [ ] Pass breakdown ID and supervisor context
- [ ] Implement session persistence
- [ ] Add "View on Dashboard" fallback button

### Stage 2: Real-Time Features (Day 2-3)
**Priority: HIGH**

#### 2.1 WebSocket Setup
- [ ] Configure WebSocket server in backend
- [ ] Implement connection management
- [ ] Add heartbeat/ping mechanism
- [ ] Create event broadcasting system

#### 2.2 Live Progress Tracking
- [ ] Emit events for each wizard step
- [ ] Update dashboard in real-time
- [ ] Show current step indicator
- [ ] Display supervisor activity

#### 2.3 Polling Fallback
- [ ] Implement 5-second polling as fallback
- [ ] Auto-detect WebSocket failure
- [ ] Seamless switchover mechanism
- [ ] Connection status indicator

### Stage 3: Edit Capability (Day 3-4)
**Priority: HIGH**

#### 3.1 Edit Assessment Flow
- [ ] Add "Edit Assessment" button to dashboard
- [ ] Navigate back to wizard with pre-filled data
- [ ] Load previous responses from database
- [ ] Maintain breakdown ID continuity

#### 3.2 Audit Trail Implementation
- [ ] Log all edits with timestamp
- [ ] Track supervisor making changes
- [ ] Store before/after values
- [ ] Display edit history on dashboard

#### 3.3 Validation & Conflict Resolution
- [ ] Prevent concurrent edits
- [ ] Lock mechanism during editing
- [ ] Notification of changes to other supervisors
- [ ] Conflict resolution UI

### Stage 4: Enhanced Features (Day 4-5)
**Priority: MEDIUM**

#### 4.1 Supervisor Context
- [ ] Personalized dashboard view
- [ ] Supervisor performance metrics
- [ ] Recent activity history
- [ ] Quick actions menu

#### 4.2 Auto-Escalation
- [ ] Implement STOP decision alerts
- [ ] Manager notification system
- [ ] Time-based escalation (30+ minutes)
- [ ] Priority route escalation

#### 4.3 Handover Notes
- [ ] Add notes field to breakdowns
- [ ] Shared visibility for all supervisors
- [ ] Timestamp and author tracking
- [ ] Quick note templates

---

## 🗂️ File Changes Required

### Frontend Files to Update

1. **`/frontend/dashboard/sdc-operations-dashboard-v2.html`**
   - Add decision display components
   - Implement WebSocket connection
   - Add edit buttons and filters
   - Update layout for focus view

2. **`/frontend/breakdown-guide/App.js`**
   - Add redirect logic after completion
   - Pass breakdown context to dashboard
   - Maintain session state

3. **`/frontend/breakdown-guide/supervisorBreakdownLogger.js`**
   - Emit WebSocket events for progress
   - Store detailed wizard responses
   - Handle edit mode initialization

### Backend Files to Update

4. **`/backend/routes/breakdownTrackerV3.js`**
   - Add endpoints for editing
   - Implement audit logging
   - Return detailed responses

5. **`/backend/websocket-server.js`**
   - Set up event broadcasting
   - Handle connection management
   - Implement room-based updates

### New Files to Create

6. **`/backend/migrations/add_audit_trail.sql`**
   - Database schema updates
   - Audit tables and triggers

7. **`/frontend/shared/WebSocketManager.js`**
   - Centralized WebSocket handling
   - Fallback mechanism
   - Event management

---

## 📊 Database Schema Updates

### New Columns for `breakdowns` table:
```sql
- decision_details JSONB
- wizard_responses JSONB
- last_edited_at TIMESTAMP
- last_edited_by VARCHAR(50)
- edit_count INTEGER DEFAULT 0
```

### New `breakdown_edits` table:
```sql
- edit_id SERIAL PRIMARY KEY
- breakdown_id VARCHAR(50)
- supervisor_badge VARCHAR(50)
- supervisor_name VARCHAR(100)
- edited_at TIMESTAMP
- field_changed VARCHAR(100)
- old_value TEXT
- new_value TEXT
- edit_reason TEXT
```

---

## 🔄 Data Flow

### Assessment → Dashboard Flow:
```
1. Supervisor completes wizard
2. Decision logged to database
3. WebSocket emits completion event
4. Auto-redirect to dashboard
5. Dashboard focuses on new breakdown
6. Other supervisors see real-time update
```

### Edit Flow:
```
1. Supervisor clicks "Edit Assessment"
2. System checks for concurrent edits
3. Loads wizard with previous responses
4. Supervisor makes changes
5. Changes logged to audit table
6. WebSocket broadcasts update
7. Dashboard refreshes with new data
```

---

## 🔌 WebSocket Events

### Events to Implement:
```javascript
// From Breakdown Guide
'assessment:started'    - New assessment begins
'assessment:step'       - Progress through wizard
'assessment:completed'  - Assessment finished
'assessment:editing'    - Edit mode entered

// From Dashboard
'breakdown:update'      - Any breakdown change
'breakdown:resolved'    - Breakdown cleared
'supervisor:active'     - Supervisor activity

// System Events
'connection:established'
'connection:lost'
'connection:restored'
```

---

## ✅ Success Criteria

1. **Performance**
   - Dashboard loads in < 2 seconds
   - Real-time updates within 500ms
   - Edit mode loads in < 1 second

2. **Reliability**
   - WebSocket maintains 99% uptime
   - Polling fallback activates within 5 seconds
   - No data loss during connection issues

3. **User Experience**
   - Seamless navigation between guide and dashboard
   - Clear visual feedback for all actions
   - Intuitive edit workflow

4. **Audit Compliance**
   - 100% of changes logged
   - Complete audit trail for DVSA
   - Supervisor accountability maintained

---

## 🚀 Testing Checklist

### Functional Testing:
- [ ] Assessment completes and redirects
- [ ] Dashboard shows correct decision
- [ ] Edit button loads wizard correctly
- [ ] Changes are saved and logged
- [ ] WebSocket updates work
- [ ] Polling fallback activates
- [ ] Filters work correctly
- [ ] Supervisor context maintained

### Edge Cases:
- [ ] Multiple simultaneous edits
- [ ] Connection loss during assessment
- [ ] Browser refresh handling
- [ ] Session timeout scenarios
- [ ] Large number of active breakdowns

### Performance Testing:
- [ ] 50+ concurrent supervisors
- [ ] 100+ active breakdowns
- [ ] Rapid assessment submissions
- [ ] WebSocket under load

---

## 📝 Notes

- All times in UTC for consistency
- Sequential IDs (BD-2025-XXXXX) must be maintained
- DVSA compliance is critical - no data loss
- Supervisor badges are primary identifiers
- Priority routes need special handling

---

## 🎯 Next Steps

1. **Immediate**: Create database migration scripts
2. **Today**: Begin Stage 1 implementation
3. **Tomorrow**: Test WebSocket integration
4. **This Week**: Complete all stages
5. **Next Week**: Production deployment

---

**Questions?** Contact the development team
**Issues?** Log in the project tracker
**Updates?** Check this plan daily for progress

---

*Last Updated: January 2025*
*Version: 1.0*