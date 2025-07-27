# StreetManager Notifications Table

This document describes the `streetmanager_notifications` table created for the Go BARRY webhook integration with UK StreetManager system.

## Overview

The `streetmanager_notifications` table stores comprehensive webhook data from the UK StreetManager system, designed specifically for Go BARRY's traffic management needs. It handles roadworks notifications affecting 231+ bus routes across Newcastle, Gateshead, Sunderland, Durham, North Tyneside, and Northumberland.

## Table Schema

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `notification_id` | VARCHAR(255) PRIMARY KEY | Unique notification identifier |
| `webhook_received_at` | TIMESTAMP WITH TIME ZONE | When webhook was received |
| `raw_webhook_data` | JSONB | Complete webhook payload for audit |
| `processing_status` | VARCHAR(50) | 'pending', 'completed', 'failed' |

### UK-Specific Location Fields

| Field | Type | Description |
|-------|------|-------------|
| `permit_reference_number` | VARCHAR(100) | UK permit reference |
| `street_name` | TEXT | Street name |
| `area` | VARCHAR(100) | Area/district |
| `town` | VARCHAR(100) | Town/city |
| `postcode` | VARCHAR(10) | UK postcode |
| `coordinates` | JSONB | `{lat: number, lng: number}` |

### Work Management Fields

| Field | Type | Description |
|-------|------|-------------|
| `work_category` | VARCHAR(50) | 'major', 'standard', 'minor', 'immediate' |
| `work_status` | VARCHAR(50) | 'proposed', 'planned', 'in_progress', 'completed' |
| `traffic_management_type` | VARCHAR(100) | Traffic management description |
| `is_emergency_works` | BOOLEAN | Emergency roadworks flag |
| `start_date` / `end_date` | TIMESTAMP WITH TIME ZONE | Work dates |

### Bus Route Impact Fields

| Field | Type | Description |
|-------|------|-------------|
| `affected_routes` | TEXT[] | Array of bus route numbers |
| `route_impact_score` | INTEGER | Calculated impact score |
| `severity` | VARCHAR(20) | 'Low', 'Medium', 'High' |
| `alert_status` | VARCHAR(20) | 'red', 'amber', 'green' |

## Performance Indexes

The table includes optimized indexes for common webhook query patterns:

### Primary Indexes
- `idx_streetmanager_webhook_received_at` - For time-based queries
- `idx_streetmanager_permit_reference` - For permit lookups
- `idx_streetmanager_status_date` - For status filtering
- `idx_streetmanager_work_status` - For work status queries

### Advanced Indexes
- `idx_streetmanager_raw_data_gin` - GIN index for JSONB queries
- `idx_streetmanager_route_impacts` - GIN index for route array queries
- `idx_streetmanager_cleanup_date` - For automated cleanup

## Row Level Security (RLS)

RLS is enabled with policies allowing:
- **Read**: All authenticated users can read notifications
- **Insert**: Webhook system can insert new notifications  
- **Update**: System can update processing status
- **Delete**: Automated cleanup of expired records

## Automated Features

### 1. Cleanup Date Calculation
```sql
-- Automatically calculates cleanup_date as end_date + 7 days
NEW.cleanup_date = NEW.end_date + INTERVAL '7 days';
```

### 2. Updated Timestamp Trigger
```sql
-- Automatically updates updated_at on record changes
NEW.updated_at = NOW();
```

### 3. Duplicate Detection
- Generates hash from key fields to prevent duplicates
- Hash includes: permit_reference + street_name + start_date + organisation

## Useful Views

### Active Notifications View
```sql
SELECT * FROM active_streetmanager_notifications
WHERE town = 'Newcastle upon Tyne';
```

### High Impact Notifications View  
```sql
SELECT * FROM high_impact_streetmanager_notifications
ORDER BY route_impact_score DESC;
```

## Setup Instructions

### Method 1: Node.js Script (Recommended)
```bash
cd backend
node scripts/create-streetmanager-notifications-table.js
```

### Method 2: Direct SQL (Fallback)
1. Go to Supabase SQL Editor
2. Copy contents of `sql/create_streetmanager_notifications_simple.sql`
3. Execute the SQL

### Method 3: Full Featured Setup
1. Copy contents of `sql/streetmanager_notifications_schema.sql`
2. Execute in Supabase SQL Editor
3. Includes all advanced features and policies

## Testing

Run the test suite to verify table functionality:
```bash
node scripts/test-streetmanager-table.js
```

Tests include:
- ✅ Table accessibility
- ✅ Data insertion/retrieval
- ✅ JSONB queries
- ✅ Route array filtering
- ✅ View functionality  
- ✅ Update operations

## Integration with Go BARRY Webhook

### Webhook Handler Integration
```javascript
// In streetManagerWebhook.js
const { data, error } = await supabase
  .from('streetmanager_notifications')
  .insert({
    notification_id: `sm_${notificationData.event_reference}_${snsMessage.MessageId}`,
    webhook_received_at: new Date().toISOString(),
    raw_webhook_data: notificationData,
    permit_reference_number: notificationData.permit_reference,
    street_name: notificationData.street_name,
    town: extractTown(notificationData),
    work_status: notificationData.work_status_ref,
    affected_routes: await calculateAffectedRoutes(notificationData),
    // ... other fields
  });
```

### Query Examples

#### Find active roadworks affecting specific routes
```javascript
const { data } = await supabase
  .from('streetmanager_notifications')
  .select('*')
  .contains('affected_routes', ['1', '39'])
  .in('work_status', ['in_progress', 'planned']);
```

#### Get high-impact notifications for dashboard
```javascript
const { data } = await supabase
  .from('high_impact_streetmanager_notifications')
  .select('*')
  .limit(10);
```

#### Search by location
```javascript
const { data } = await supabase
  .from('streetmanager_notifications')
  .select('*')
  .ilike('street_name', '%Northumberland%')
  .eq('town', 'Newcastle upon Tyne');
```

## Maintenance

### Cleanup Old Records
```javascript
// Manual cleanup
const deletedCount = await supabase.rpc('cleanup_old_streetmanager_notifications');

// Or use the automated cleanup date system
```

### Monitor Performance
```sql
-- Check index usage
SELECT * FROM pg_stat_user_indexes 
WHERE relname = 'streetmanager_notifications';

-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('streetmanager_notifications'));
```

## Troubleshooting

### Common Issues

1. **Permission Errors**
   - Ensure SUPABASE_SERVICE_KEY is set in environment
   - Check RLS policies are correctly configured

2. **JSONB Query Issues**  
   - Use `->` for JSON object access
   - Use `->>` for text extraction
   - Ensure GIN index exists for performance

3. **Array Query Problems**
   - Use `@>` operator for array contains
   - Use `&&` operator for array overlap
   - Ensure GIN index on array columns

### Performance Tips

1. **Large Datasets**
   - Consider partitioning by month for >100k records
   - Monitor index usage and adjust as needed
   - Use EXPLAIN ANALYZE for slow queries

2. **Memory Optimization**
   - Raw webhook data in JSONB can be large
   - Consider archiving old notifications
   - Use connection pooling for high traffic

## Related Files

- `/backend/sql/streetmanager_notifications_schema.sql` - Full schema
- `/backend/sql/create_streetmanager_notifications_simple.sql` - Basic setup
- `/backend/scripts/create-streetmanager-notifications-table.js` - Setup script
- `/backend/scripts/test-streetmanager-table.js` - Test suite

## Support

For Go BARRY specific issues:
- Check existing webhook handler in `/backend/routes/streetManagerWebhook.js`
- Review hybrid storage system in `/backend/services/hybridStreetManagerStorage.js`
- Monitor backend logs for webhook processing errors

The table is designed to work alongside the existing hybrid storage system while providing comprehensive webhook data storage for the Go BARRY traffic management platform.