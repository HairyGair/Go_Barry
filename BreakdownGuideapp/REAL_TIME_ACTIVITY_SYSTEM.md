# Real-Time Activity System

This document describes the comprehensive real-time activity tracking system implemented for the Go BARRY Breakdown Management System.

## Overview

The real-time activity system provides instant updates of all user actions and system events across the application, ensuring supervisors see activities as they happen rather than waiting for 30-second polling intervals.

## Architecture

### Components

1. **Activities Table** (`/backend/migrations/create_activities_table.sql`)
   - Unified PostgreSQL table for all activities
   - Real-time enabled with Supabase
   - Full-text search capabilities
   - Indexed for performance

2. **Activity Logger Service** (`/backend/services/activityLogger.js`)
   - Centralized logging for all activity types
   - Batch processing capabilities
   - Retry mechanisms and error handling
   - Convenience methods for common activities

3. **Activity API Routes** (`/backend/routes/activity.js`)
   - REST endpoints for activity management
   - Real-time and polling endpoints
   - Search and statistics endpoints

4. **Real-Time Service** (`/frontend/src/services/activityRealtimeService.js`)
   - Supabase real-time subscriptions
   - Connection monitoring and reconnection
   - Event buffering and deduplication

5. **Enhanced Activity Feed** (`/frontend/src/components/LiveActivityFeed.jsx`)
   - Real-time updates with fallback polling
   - Visual indicators for real-time vs polling data
   - Connection status monitoring

## Features

### ✅ Real-Time Updates
- **Instant visibility**: Activities appear immediately across all screens
- **Supabase real-time**: PostgreSQL triggers for instant push notifications
- **Fallback polling**: Automatic fallback if real-time connection fails
- **Connection monitoring**: Visual indicators of real-time status

### ✅ Comprehensive Activity Tracking
- **Breakdown reporting**: When supervisors report breakdowns
- **Wizard completion**: Assessment results and decisions
- **Engineer assignments**: When engineers are assigned to breakdowns
- **SDC decisions**: Priority changes and dispatch decisions
- **System events**: Logins, errors, and system changes

### ✅ Advanced Features
- **Full-text search**: Search across all activity data
- **Activity filtering**: By depot, supervisor, type, severity
- **Activity statistics**: Usage patterns and trends
- **Batch operations**: Efficient bulk activity logging
- **Offline support**: Queue activities when offline

## Activity Types

### Breakdown Activities
- `breakdown_reported` - Supervisor reports a breakdown
- `breakdown_updated` - Breakdown status or details change
- `breakdown_resolved` - Breakdown is resolved

### Wizard Activities
- `wizard_started` - Supervisor starts assessment wizard
- `wizard_completed` - Assessment wizard completed with decision
- `wizard_decision` - Specific decision made (STOP/AMBER/CONTINUE)

### Engineering Activities
- `engineer_assigned` - Engineer assigned to breakdown
- `engineer_dispatched` - Engineer dispatched to location
- `engineer_on_site` - Engineer arrives at breakdown location
- `engineer_completed` - Engineering work completed

### SDC Operations
- `sdc_priority_change` - Priority level changed by SDC
- `sdc_decision` - SDC operational decision made
- `sdc_escalation` - Issue escalated to higher priority

### System Events
- `user_login` - User authentication events
- `user_logout` - User session ends
- `system_error` - System errors and exceptions
- `data_sync` - Data synchronization events

## API Endpoints

### Activity Management
```
GET  /api/activity/feed          - Get paginated activity feed
GET  /api/activity/live          - Get recent activities (polling)
POST /api/activity/log           - Log single activity
POST /api/activity/batch         - Log multiple activities
GET  /api/activity/search        - Search activities
GET  /api/activity/stats         - Get activity statistics
```

### Filter Parameters
- `depot` - Filter by depot
- `actor_id` - Filter by supervisor/engineer
- `activity_type` - Filter by activity type
- `severity` - Filter by severity level
- `source` - Filter by source system

## Usage Examples

### Frontend - Subscribe to Real-Time Activities
```javascript
import { activityRealtimeService } from '../services/activityRealtimeService.js';

// Subscribe to all activities
const subscriptionId = activityRealtimeService.subscribeToActivities(
  (activityEvent) => {
    console.log('New activity:', activityEvent.activity);
    updateActivityFeed(activityEvent.activity);
  },
  {
    filter: { depot: 'Washington' },
    bufferUpdates: true
  }
);

// Unsubscribe when component unmounts
activityRealtimeService.unsubscribe(subscriptionId);
```

### Frontend - Log Activities
```javascript
import { logActivity } from '../api/activityAggregator.js';

// Log breakdown completion
await logActivity({
  activityType: 'wizard_completed',
  action: 'completed brakes assessment - STOP',
  actorType: 'supervisor',
  actorId: 'AG003',
  actorName: 'Anthony Gair',
  entityType: 'breakdown',
  entityId: 'BRK-12345',
  entityDetails: {
    fleetNo: '6098',
    wizardType: 'brakes',
    decision: 'STOP'
  },
  depot: 'Washington',
  severity: 'critical',
  source: 'breakdown_guide'
});
```

### Backend - Log Activities
```javascript
import { activityLogger } from '../services/activityLogger.js';

// Log engineer assignment
await activityLogger.logEngineerAssigned({
  engineerId: 'ENG001',
  engineerName: 'John Smith',
  breakdownId: 'BRK-12345',
  fleetNo: '6098',
  assignedBy: 'SDC_SYSTEM',
  estimatedArrival: '14:30',
  depot: 'Washington'
});
```

## Database Schema

### Activities Table Structure
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Activity classification
  activity_type TEXT NOT NULL,
  action TEXT NOT NULL,

  -- Actor (who did it)
  actor_type TEXT NOT NULL, -- 'supervisor', 'engineer', 'system', 'admin'
  actor_id TEXT,
  actor_name TEXT,

  -- Entity (what was acted on)
  entity_type TEXT,
  entity_id TEXT,
  entity_details JSONB DEFAULT '{}',

  -- Context
  depot TEXT,
  severity TEXT,
  priority INTEGER DEFAULT 5,
  source TEXT,
  metadata JSONB DEFAULT '{}',

  -- Display
  icon TEXT,
  message TEXT,

  -- Search
  search_vector tsvector
);
```

## Setup Instructions

### 1. Database Migration
```bash
# Run the migration to create activities table
psql -h your-supabase-host -U postgres -d postgres -f backend/migrations/create_activities_table.sql
```

### 2. Enable Real-Time
In Supabase Dashboard:
- Go to Database → Replication
- Enable replication for `activities` table
- Verify RLS policies are set correctly

### 3. Environment Variables
```bash
# Ensure these are set in backend/.env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key # Optional, for admin operations
```

### 4. Start Services
```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm run dev
```

### 5. Test the System
```bash
# Run the test script
cd backend
node test-activity-system.js
```

## Testing

### Test Script
The `backend/test-activity-system.js` script tests:
- Activities table existence
- Activity logging service
- API endpoints functionality
- Real-time subscriptions
- Search capabilities

### Manual Testing
1. **Start a breakdown assessment** - Should see "wizard_started" activity
2. **Complete assessment** - Should see "wizard_completed" activity
3. **Assign engineer** (in dashboard) - Should see "engineer_assigned" activity
4. **Check real-time updates** - Activities should appear instantly without page refresh

## Monitoring

### Connection Status
- Real-time connection status visible in Activity Feed header
- Green dot (🟢) = Connected, Red dot (🔴) = Disconnected

### Performance Metrics
- Activity counts by type/severity/depot
- Real-time subscription status
- API response times
- Buffer sizes and error rates

## Troubleshooting

### Common Issues

1. **Activities not appearing in real-time**
   - Check Supabase real-time is enabled for activities table
   - Verify WebSocket connection in browser dev tools
   - Check for JavaScript errors in console

2. **Activities table missing**
   - Run migration: `backend/migrations/create_activities_table.sql`
   - Check database permissions
   - Verify Supabase configuration

3. **API endpoints returning errors**
   - Check backend server is running
   - Verify environment variables are set
   - Check network connectivity

4. **Real-time subscriptions failing**
   - Check browser WebSocket support
   - Verify CORS configuration
   - Check Supabase project settings

### Debug Mode
Enable debug logging:
```javascript
// In browser console
localStorage.setItem('debug', 'activity:*');
```

## Future Enhancements

### Planned Features
- **Activity webhooks** - Send critical activities to external systems
- **Activity analytics dashboard** - Trends and patterns analysis
- **Smart notifications** - Intelligent filtering and routing
- **Activity templates** - Pre-configured activity types
- **Bulk operations** - Mass activity management tools

### Performance Optimizations
- **Activity archiving** - Move old activities to separate table
- **Index optimization** - Additional indexes for common queries
- **Caching layer** - Redis cache for frequently accessed data
- **Connection pooling** - Optimize database connections

## Security

### Data Protection
- All activities logged with supervisor authentication
- Sensitive data filtered from activity messages
- RLS policies prevent unauthorized access
- Activity retention policies for compliance

### Access Control
- Role-based activity visibility
- Depot-based filtering for supervisors
- Admin-only access to system activities
- Audit trail for all activity operations

---

**Last Updated**: September 2025
**Version**: 1.0
**Author**: Go BARRY Development Team