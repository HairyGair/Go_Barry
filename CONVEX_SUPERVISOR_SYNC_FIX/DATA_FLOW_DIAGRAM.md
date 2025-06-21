# DATA FLOW DIAGRAM

## Current (Broken) Flow:
```
EnhancedDashboard → Backend API → Local Storage Only
                                        ↓
DisplayScreen ← ← ← Polling API ← ← (No Convex Data)
```

## Fixed Flow:
```
EnhancedDashboard → Backend API → Local Storage
                         ↓              ↓
                    Convex Sync → Convex Database
                                        ↓
DisplayScreen ← ← ← Real-time ← ← Convex Hooks
```

## Supervisor Action Flow:

### Login:
1. Supervisor logs in on EnhancedDashboard
2. Backend validates and creates session
3. Backend calls `convexSync.syncSupervisorSession()`
4. Convex stores session in `supervisorSessions` table
5. Backend logs action via `convexSync.logSupervisorAction()`
6. DisplayScreen sees update instantly via `useConvexSync()` hook

### Dismiss Alert:
1. Supervisor dismisses alert in SupervisorControl
2. Backend processes dismissal
3. Backend calls `convexSync.logSupervisorAction()` with:
   - action: "dismiss_alert"
   - supervisorName: "David Hall"
   - details: { alertId, reason, location }
4. Convex stores in `supervisorActions` table
5. DisplayScreen shows "David Hall dismissed alert: [reason]"

### Create Roadwork:
1. Supervisor creates roadwork
2. Backend saves to database
3. Backend calls `convexSync.logSupervisorAction()` with:
   - action: "create_roadwork"
   - details: { location, severity, routes }
4. DisplayScreen shows "Claire Fiddler created roadwork at [location]"

## Key Components:

**Backend Service:** `convexSync.js`
- `syncAlerts()` - Syncs traffic alerts
- `logSupervisorAction()` - Logs actions
- `syncSupervisorSession()` - Manages sessions

**Convex Functions:**
- `supervisors.login/logout` - Session management
- `sync.logSupervisorAction` - Action logging
- `sync.getRecentActions` - Retrieve actions

**Frontend Hooks:**
- `useConvexSync()` - Main hook
- `activeSupervisors` - Real-time supervisor list
- `useSupervisorActions()` - Real-time activity feed
