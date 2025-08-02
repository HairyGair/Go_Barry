# Dismissed Alerts Cleanup Implementation

## Overview

This document describes the automated cleanup system for dismissed alerts in the Go BARRY platform. The system is designed to prevent database bloat, optimize memory usage, and maintain system performance within the 2GB RAM constraint on Render.com.

## Architecture

### Core Components

1. **DismissedAlertsCleanupService** (`services/dismissedAlertsCleanupService.js`)
   - Configurable retention periods for different dismissal reasons
   - Batch processing for memory-efficient cleanup
   - Comprehensive statistics and monitoring
   - Dry run capabilities for testing

2. **CleanupScheduler** (`services/cleanupScheduler.js`)
   - Cron-based scheduling (daily, weekly, monthly)
   - Manual trigger capabilities
   - Job status monitoring and error handling
   - Configurable schedules via environment variables

3. **Cleanup API** (`routes/cleanupAPI.js`)
   - RESTful endpoints for cleanup management
   - Admin authentication required for destructive operations
   - Statistics and monitoring endpoints
   - Test and dry-run capabilities

## Retention Periods

### Default Configuration

| Dismissal Reason | Retention Period | Rationale |
|------------------|------------------|-----------|
| Data error/duplicate | 7 days | Quick cleanup for obvious errors |
| Not affecting routes | 30 days | Moderate retention for operational decisions |
| Work completed early | 30 days | Moderate retention for planning verification |
| Supervisor override | 90 days | Longer retention for audit purposes |
| Default (others) | 60 days | Balanced retention for general cases |

### Environment Variable Override

```bash
# Customize retention periods (in days)
CLEANUP_RETENTION_DATA_ERROR_DAYS=7
CLEANUP_RETENTION_DUPLICATE_DAYS=7
CLEANUP_RETENTION_NOT_AFFECTING_ROUTES_DAYS=30
CLEANUP_RETENTION_WORK_COMPLETED_EARLY_DAYS=30
CLEANUP_RETENTION_SUPERVISOR_OVERRIDE_DAYS=90
CLEANUP_RETENTION_DEFAULT_DAYS=60
```

## Scheduling Configuration

### Default Schedules (UTC)

- **Daily Cleanup**: 2:00 AM (low traffic time)
- **Weekly Deep Cleanup**: Sundays at 3:00 AM
- **Monthly Maintenance**: 1st of month at 4:00 AM

### Environment Variables

```bash
# Enable/disable scheduled jobs
CLEANUP_DAILY_ENABLED=true
CLEANUP_WEEKLY_ENABLED=true
CLEANUP_MONTHLY_ENABLED=true

# Customize schedules (cron expressions)
CLEANUP_DAILY_SCHEDULE=0 2 * * *
CLEANUP_WEEKLY_SCHEDULE=0 3 * * 0
CLEANUP_MONTHLY_SCHEDULE=0 4 1 * *

# Performance limits
CLEANUP_BATCH_SIZE=100
CLEANUP_MAX_TIME_MS=30000
CLEANUP_DRY_RUN=false
```

## Database Schema

### Affected Tables

1. **dismissed_alerts** - Audit log of dismissed alerts
2. **streetworks** - Street Manager data (dismissed via `is_dismissed` flag)
3. **manual_incidents** - Manual incidents (dismissed via `status` field)

### Cleanup Logs Table

```sql
CREATE TABLE cleanup_logs (
    id VARCHAR(100) PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL DEFAULT 'dismissed_alerts_cleanup',
    initiated_by VARCHAR(100) NOT NULL,
    execution_time_ms INTEGER NOT NULL DEFAULT 0,
    deleted_count INTEGER NOT NULL DEFAULT 0,
    processed_tables JSONB DEFAULT '[]'::jsonb,
    errors JSONB DEFAULT '[]'::jsonb,
    dry_run BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    retention_config JSONB DEFAULT '{}'::jsonb
);
```

## API Endpoints

### Public Endpoints

- `GET /api/cleanup/dismissed-alerts/stats` - Get cleanup statistics
- `GET /api/cleanup/scheduler/status` - Get scheduler status
- `GET /api/cleanup/config` - Get current configuration

### Admin-Only Endpoints (Requires AG003 or BP009 badge)

- `GET /api/cleanup/dismissed-alerts/eligible` - List records eligible for cleanup
- `POST /api/cleanup/dismissed-alerts/run` - Manually trigger cleanup
- `POST /api/cleanup/scheduler/start` - Start cleanup scheduler
- `POST /api/cleanup/scheduler/stop` - Stop cleanup scheduler
- `POST /api/cleanup/test` - Test cleanup functionality (dry run only)

### Example API Usage

```bash
# Get cleanup statistics
curl "https://go-barry.onrender.com/api/cleanup/dismissed-alerts/stats"

# Test cleanup functionality (admin only)
curl -X POST "https://go-barry.onrender.com/api/cleanup/test" \
  -H "Content-Type: application/json" \
  -d '{"supervisorToken": "your-admin-token"}'

# Manually trigger cleanup (admin only)
curl -X POST "https://go-barry.onrender.com/api/cleanup/dismissed-alerts/run" \
  -H "Content-Type: application/json" \
  -d '{
    "supervisorToken": "your-admin-token",
    "cleanup_type": "daily",
    "dry_run": false
  }'
```

## Memory Optimization Features

### Batch Processing
- Configurable batch sizes (default: 100 records)
- Time-limited operations (default: 30 seconds)
- Automatic garbage collection between batches

### Circuit Breaker Pattern
- Stops processing if operations take too long
- Prevents memory exhaustion
- Graceful degradation under load

### Lazy Loading
- Services loaded on-demand
- Minimal memory footprint at startup
- Dynamic import cleanup

## Monitoring and Logging

### Cleanup Statistics

The system tracks:
- Total dismissed records by age groups (0-7d, 8-30d, 31-60d, 61-90d, 90d+)
- Records eligible for cleanup
- Cleanup operation results
- Performance metrics (execution time, deleted count)

### Supervisor Activity Logging

All cleanup operations are logged with:
- Supervisor who initiated the action
- Timestamp and duration
- Records processed and deleted
- Any errors encountered

### Automated Alerts

The system provides:
- Warnings when cleanup operations fail
- Statistics on database growth
- Memory usage monitoring
- Performance recommendations

## Testing

### Test Script

Run the comprehensive test suite:

```bash
cd backend
node test-cleanup-functionality.js
```

### Test Coverage

- Configuration loading and validation
- Statistics retrieval
- Eligible record detection
- Dry run cleanup operations
- Retention period logic
- Memory usage monitoring
- Scheduler functionality

## Deployment

### Automatic Startup

The cleanup scheduler automatically starts when the backend initializes. Check the startup logs for:

```
✅ Dismissed alerts cleanup scheduler started (3 jobs)
🧹 Automated cleanup will prevent database bloat and optimize memory usage
```

### Manual Management

Start/stop the scheduler via API or directly:

```javascript
import { cleanupScheduler } from './services/cleanupScheduler.js';

// Start scheduler
const result = await cleanupScheduler.startScheduler();

// Stop scheduler
cleanupScheduler.stopScheduler();
```

## Performance Impact

### Memory Usage
- Minimal overhead when idle
- Batch processing prevents memory spikes
- Automatic cleanup of processed data

### Database Impact
- Operations run during low-traffic hours
- Batch processing reduces database load
- Indexes optimize query performance

### Network Impact
- No external API calls required
- Local database operations only
- Minimal bandwidth usage

## Troubleshooting

### Common Issues

1. **Scheduler Not Starting**
   - Check environment variables
   - Verify cron expressions
   - Check database connectivity

2. **Cleanup Operations Failing**
   - Verify Supabase permissions
   - Check batch size limits
   - Monitor memory usage

3. **Records Not Being Cleaned**
   - Verify retention periods
   - Check dismissal timestamps
   - Ensure records meet age criteria

### Debug Commands

```bash
# Test cleanup functionality
node test-cleanup-functionality.js

# Check scheduler status
curl "http://localhost:3001/api/cleanup/scheduler/status"

# Get cleanup statistics
curl "http://localhost:3001/api/cleanup/dismissed-alerts/stats"

# Test dry run cleanup
curl -X POST "http://localhost:3001/api/cleanup/test" \
  -H "Content-Type: application/json" \
  -d '{"supervisorToken": "AG003-token"}'
```

## Security Considerations

### Authentication
- Admin privileges required for destructive operations
- Token-based authentication
- Activity logging for audit trails

### Data Protection
- Dry run mode for testing
- Batch processing limits
- Comprehensive error handling
- Audit trails maintained

### Access Control
- Only AG003 and BP009 badges have admin access
- API endpoints protected by middleware
- Supervisor activity logged

## Future Enhancements

### Planned Features
1. Advanced retention policies based on alert severity
2. Automatic database optimization after cleanup
3. Email notifications for cleanup results
4. Dashboard for cleanup monitoring
5. Bulk cleanup tools for emergency situations

### Configuration Improvements
1. Web-based configuration interface
2. Real-time retention period updates
3. Custom cleanup schedules per table
4. Performance tuning recommendations

## Conclusion

The dismissed alerts cleanup system provides automated, memory-efficient database maintenance that prevents bloat while maintaining audit capabilities. The system is designed to operate within the 2GB RAM constraint of Render.com while providing comprehensive monitoring and management capabilities.

For questions or issues, contact the development team or check the API documentation at `/api/cleanup/config` for current system status.