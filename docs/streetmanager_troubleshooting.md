# StreetManager Webhook Troubleshooting

## Error: "Failed to save notification"

Based on the notification data you provided, here's how to fix the issue:

### 1. Quick Fix - Run this SQL in Supabase

```sql
-- Ensure the table exists with minimal structure
CREATE TABLE IF NOT EXISTS streetmanager_notifications (
  notification_id TEXT PRIMARY KEY,
  webhook_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_webhook_data JSONB
);

-- Add any missing columns
ALTER TABLE streetmanager_notifications 
  ADD COLUMN IF NOT EXISTS coordinates JSONB;
```

### 2. Test the Specific Webhook Data

Use this curl command to test processing of your specific notification:

```bash
curl -X POST https://go-barry.onrender.com/api/streetmanager/test-webhook-data \
  -H "Content-Type: application/json" \
  -d '{
    "notificationData": {
      "event_reference": 128587307,
      "event_type": "PERMIT_ALTERATION_GRANTED",
      "object_type": "PERMIT",
      "object_reference": "LC10620213165-01",
      "event_time": "2025-06-27T17:26:01.809Z",
      "version": 1,
      "object_data": {
        "work_reference_number": "LC10620213165",
        "permit_reference_number": "LC10620213165-01",
        "promoter_swa_code": "4420",
        "promoter_organisation": "SHEFFIELD CITY COUNCIL",
        "highway_authority": "SHEFFIELD CITY COUNCIL",
        "works_location_coordinates": "POINT(433674.488 380502.109)",
        "street_name": "LOWEDGES ROAD",
        "area_name": "",
        "work_category": "Major",
        "traffic_management_type": "Stop/go boards",
        "proposed_start_date": "2025-06-15T23:00:00.000Z",
        "proposed_end_date": "2025-07-04T22:59:00.000Z",
        "actual_start_date_time": "2025-06-16T06:47:17.000Z",
        "work_status": "Works in progress",
        "usrn": "34409447",
        "permit_status": "granted",
        "town": "SHEFFIELD"
      }
    }
  }'
```

### 3. Check Debug Endpoints

```bash
# Check table structure
curl https://go-barry.onrender.com/api/streetmanager/debug-table

# Test Supabase connection
curl https://go-barry.onrender.com/api/streetmanager/test-supabase
```

### 4. Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Missing columns | Run the SQL script above |
| Coordinate parsing fails | Check BNG conversion is working |
| JSONB fields error | Ensure `coordinates` and `raw_webhook_data` columns are JSONB type |
| Permission denied | Check Supabase RLS policies |

### 5. Full Table Creation (if needed)

If the table doesn't exist at all, run:

```sql
-- Drop and recreate (CAUTION: loses data)
DROP TABLE IF EXISTS streetmanager_notifications;

-- Create with all fields
CREATE TABLE streetmanager_notifications (
  notification_id TEXT PRIMARY KEY,
  webhook_received_at TIMESTAMPTZ NOT NULL,
  raw_webhook_data JSONB,
  coordinates JSONB,
  permit_reference_number TEXT,
  street_name TEXT,
  town TEXT,
  severity TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. Monitor Logs

The enhanced error logging will show:
- Full error details from Supabase
- The exact record being saved
- Which fields might be causing issues

Look for these log lines:
```
💾 Attempting to save webhook record to Supabase...
🔍 Record fields: [list of fields]
❌ Failed to save to Supabase: [error]
🔥 Full error details: [detailed error]
📄 Attempted record: [record data]
```

### 7. Manual Workaround

If webhooks continue to fail, use the polling endpoint:
```bash
curl -X POST https://go-barry.onrender.com/api/streetmanager/poll
```

This will fetch data directly from StreetManager API and save to the roadworks table.
