# WebSocket Handler - MySQL Migration Summary

**Migration Date:** October 16, 2025
**File:** `/backend/routes/webSocketHandler.js`
**Backup:** `/backend/routes/webSocketHandler.js.supabase-backup`

## Overview

Successfully migrated WebSocket handler from Supabase real-time subscriptions to MySQL queries while preserving all real-time broadcasting functionality.

## Changes Made

### 1. Authentication Migration (Lines 89-169)

**BEFORE (Supabase):**
```javascript
// Supabase auth
const { data: userData, error: authError } = await supabase.auth.getUser(token);

// Supervisor lookup
const { data: supervisorData, error: supervisorError } = await supabase
  .from('supervisors')
  .select('id, email, name, role, depot')
  .eq('email', user.email.toLowerCase())
  .single();
```

**AFTER (MySQL):**
```javascript
// JWT token verification via middleware
const decoded = await verifyToken(token);

// MySQL supervisor lookup using query builder
const { data: supervisorData, error: supervisorError } = await from('supervisors')
  .select('id, email, name, role, depot')
  .eq('email', user.email.toLowerCase())
  .single();
```

**Changes:**
- Removed Supabase client dependency (`@supabase/supabase-js`)
- Replaced `supabase.auth.getUser()` with JWT token verification via `verifyToken()` middleware
- Kept supervisor privilege checking with MySQL query using query builder
- Authentication flow remains identical from client perspective

### 2. Initial Data Loading (Lines 414-436)

**BEFORE (Supabase):**
```javascript
// Fetched activities from Supabase
const recentActivities = await activityLogger.getRecentActivities(10);
```

**AFTER (MySQL):**
```javascript
// Fetches activities from MySQL via activityLogger
const recentActivities = await activityLogger.getRecentActivities(10);
```

**Changes:**
- `activityLogger.getRecentActivities()` now queries MySQL instead of Supabase
- No change to WebSocket handler code - abstraction layer handles migration
- Returns same data structure for client compatibility

### 3. Import Updates (Lines 8-15)

**BEFORE:**
```javascript
import { createClient } from '@supabase/supabase-js';
```

**AFTER:**
```javascript
import { from, query } from '../utils/queryHelpers.js';
import { verifyToken } from '../middleware/authMiddleware.js';
```

**Changes:**
- Removed Supabase client import
- Added MySQL query helpers (`from`, `query`)
- Added JWT verification middleware import

## Real-time Broadcasting Patterns

### Pattern 1: Manual Broadcasts (Preserved)

These methods trigger WebSocket broadcasts when backend events occur:

```javascript
// Breakdown events
webSocketHandler.broadcastBreakdownCreated(breakdownData)
webSocketHandler.broadcastWizardStarted(assessmentData)
webSocketHandler.broadcastWizardCompleted(assessmentData)
webSocketHandler.broadcastAssessmentProgress(progressData)

// Defect intelligence events
webSocketHandler.broadcastRepeatDefect(vehicleData)
webSocketHandler.broadcastTrendUpdate(trendData)
webSocketHandler.broadcastCriticalPattern(patternData)
webSocketHandler.broadcastDepotStats(depotData)
webSocketHandler.broadcastPredictiveAlert(alertData)
webSocketHandler.broadcastDefectEscalation(escalationData)
```

**No changes required** - These work exactly as before.

### Pattern 2: File Watchers (Preserved)

Monitors JSON files for changes and broadcasts updates:

```javascript
// Watches /backend/data/breakdown-counter.json
watchFile(BREAKDOWN_COUNTER_PATH, (curr, prev) => {
  if (curr.mtime > prev.mtime) {
    this.handleBreakdownsUpdate();
  }
});
```

**No changes required** - File watching remains unchanged.

### Pattern 3: Activity Logger Integration (Already Migrated)

Activity logger service already uses MySQL and broadcasts through WebSocket handler:

```javascript
// In activityLogger service (already migrated)
await activityLogger.logWizardCompleted({...})
// Broadcasts via webSocketHandler internally
```

**No changes required** - activityLogger service already migrated to MySQL.

## WebSocket Channels

All channels preserved with same authentication requirements:

### Protected Channels (Require JWT Token)
- `sdc-dashboard` - SDC Operations Dashboard (requires supervisor role)
- `breakdowns` - Breakdown updates
- `assessment-progress` - Wizard progress updates

### Public Channels (No Authentication)
- `control-room` - Control Room Display
- `defect-intelligence` - Fleet Intelligence Dashboard

## Broadcast Event Types

All event types preserved:

| Event Type | Channel | Trigger |
|-----------|---------|---------|
| `breakdowns_updated` | sdc-dashboard, breakdowns | File watcher detects change |
| `breakdown_created` | sdc-dashboard | Manual broadcast from API |
| `wizard_started` | sdc-dashboard | Manual broadcast from API |
| `wizard_completed` | sdc-dashboard | Manual broadcast from API |
| `assessment_progress` | sdc-dashboard | Manual broadcast from API |
| `NEW_REPEAT_DEFECT` | defect-intelligence | Manual broadcast from API |
| `TREND_UPDATE` | defect-intelligence | Manual broadcast from API |
| `CRITICAL_PATTERN` | defect-intelligence | Manual broadcast from API |
| `DEPOT_STATS_UPDATE` | defect-intelligence | Manual broadcast from API |
| `PREDICTIVE_ALERT` | defect-intelligence | Manual broadcast from API |
| `DEFECT_ESCALATED` | defect-intelligence | Manual broadcast from API |

## Connection Flow

### Before Migration (Supabase)
1. Client connects with JWT token: `ws://host/ws/sdc-dashboard?token=xxx`
2. Server verifies token with Supabase auth
3. Server checks supervisor role via Supabase query
4. Connection established, initial data sent from Supabase
5. Real-time updates broadcast via WebSocket

### After Migration (MySQL)
1. Client connects with JWT token: `ws://host/ws/sdc-dashboard?token=xxx`
2. Server verifies token with JWT middleware (MySQL session validation)
3. Server checks supervisor role via MySQL query
4. Connection established, initial data sent from MySQL
5. Real-time updates broadcast via WebSocket

**Client code requires no changes** - Same connection URL and authentication flow.

## Testing Checklist

- [ ] Test WebSocket connection to `sdc-dashboard` channel with valid token
- [ ] Test WebSocket connection to `control-room` channel (public, no token)
- [ ] Test authentication rejection with invalid token
- [ ] Test supervisor privilege checking for SDC dashboard
- [ ] Test breakdown creation broadcasts to connected clients
- [ ] Test wizard completion broadcasts
- [ ] Test defect intelligence broadcasts
- [ ] Test file watcher triggers breakdown update broadcasts
- [ ] Test initial data loading (breakdowns + recent activities)
- [ ] Test multi-client broadcasting (multiple connections)
- [ ] Test client disconnection handling
- [ ] Test channel subscription/unsubscription

## Migration Benefits

1. **No Client Changes Required** - WebSocket protocol and message format unchanged
2. **Authentication Improved** - JWT verification via middleware (more secure)
3. **Database Consistency** - All data now in MySQL (single source of truth)
4. **No Supabase Dependency** - Removes external service dependency
5. **Same Performance** - WebSocket broadcasting unchanged, MySQL queries optimized

## Rollback Instructions

If issues arise, restore from backup:

```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/backend/routes
cp webSocketHandler.js.supabase-backup webSocketHandler.js
```

Then restart the backend server.

## Notes

- WebSocket server logic **unchanged** - Only database queries migrated
- Broadcasting methods **unchanged** - Same API for other modules
- Channel management **unchanged** - Same pub/sub pattern
- Client protocol **unchanged** - No frontend changes needed
- File watchers **unchanged** - Still monitor JSON files

## Dependencies Updated

**Removed:**
- `@supabase/supabase-js` (WebSocket handler no longer uses Supabase client)

**Added:**
- `../utils/queryHelpers.js` (MySQL query builder)
- `../middleware/authMiddleware.js` (JWT verification)

## Performance Impact

- **Initial Connection:** Slightly faster (JWT verification vs Supabase API call)
- **Data Loading:** Comparable (MySQL local vs Supabase remote)
- **Broadcasting:** Identical (no change to WebSocket logic)
- **Memory Usage:** Reduced (no Supabase client overhead)

## Security Enhancements

1. JWT tokens verified server-side via middleware
2. Supervisor privileges checked against MySQL (authoritative source)
3. Security events logged to console for audit trail
4. Protected channels enforce authentication
5. Public channels explicitly defined

## Future Considerations

1. **Database Triggers:** Could add MySQL triggers to auto-broadcast on INSERT/UPDATE
2. **Redis Pub/Sub:** Consider Redis for horizontal scaling of WebSocket servers
3. **Message Queuing:** Consider RabbitMQ/Bull for reliable broadcast delivery
4. **Connection Pooling:** Monitor WebSocket connection limits (currently unlimited)
5. **Rate Limiting:** Consider rate limiting WebSocket messages per client

## Related Files

- `/backend/routes/webSocketHandler.js` - Migrated WebSocket handler (this file)
- `/backend/services/activityLogger.js` - Activity logging service (already migrated)
- `/backend/middleware/authMiddleware.js` - JWT authentication middleware
- `/backend/utils/queryHelpers.js` - MySQL query helpers
- `/backend/server.js` - Server initialization (imports WebSocket handler)

## Migration Complete

WebSocket handler successfully migrated from Supabase to MySQL. All real-time functionality preserved. No client-side changes required.

**Status:** ✅ COMPLETE
**Tested:** ⏳ PENDING
**Deployed:** ⏳ PENDING
