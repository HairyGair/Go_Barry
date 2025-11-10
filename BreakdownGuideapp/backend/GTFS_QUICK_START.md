# GTFS Import - Quick Start Guide

## 1. Run Database Migration

```bash
mysql -u gobarryco_Gair -p gobarryco_breakdown < backend/migrations/009_create_gtfs_tables.sql
```

Or via phpMyAdmin:
1. Login to phpMyAdmin
2. Select database: `gobarryco_breakdown`
3. Go to SQL tab
4. Paste contents of `009_create_gtfs_tables.sql`
5. Click "Go"

## 2. Verify Tables Created

```sql
SHOW TABLES LIKE 'gtfs_%';

-- Should show:
-- gtfs_routes
-- gtfs_stops
-- gtfs_trips
-- gtfs_stop_times
-- gtfs_import_log
```

## 3. Test API Endpoints

### Get Admin Token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "anthony.gair@gonortheast.co.uk",
    "password": "YOUR_PASSWORD"
  }'
```

Save the token from response.

### Import Routes
```bash
curl -X POST http://localhost:3001/api/admin/gtfs/routes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "csvFile=@routes.txt"
```

### Import Stops
```bash
curl -X POST http://localhost:3001/api/admin/gtfs/stops \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "csvFile=@stops.txt"
```

### Import Trips
```bash
curl -X POST http://localhost:3001/api/admin/gtfs/trips \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "csvFile=@trips.txt"
```

### Import Stop Times (Takes 5-10 minutes)
```bash
curl -X POST http://localhost:3001/api/admin/gtfs/stop-times \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "csvFile=@stop_times.txt"
```

### Get Import Statistics
```bash
curl -X GET http://localhost:3001/api/admin/gtfs/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 4. Verify Data

```sql
-- Count records
SELECT COUNT(*) FROM gtfs_routes;
SELECT COUNT(*) FROM gtfs_stops;
SELECT COUNT(*) FROM gtfs_trips;
SELECT COUNT(*) FROM gtfs_stop_times;

-- Sample data
SELECT * FROM gtfs_routes LIMIT 5;
SELECT * FROM gtfs_stops LIMIT 5;

-- Test stored procedures
CALL sp_get_routes_by_name('21');
CALL sp_find_nearest_stops(54.9005, -1.5169, 5);

-- View statistics
SELECT * FROM v_gtfs_route_stats;
```

## 5. Expected Results

| Table | Expected Record Count |
|-------|----------------------|
| gtfs_routes | 150-300 |
| gtfs_stops | 3,000-6,000 |
| gtfs_trips | 10,000-20,000 |
| gtfs_stop_times | 400,000-600,000 |

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Routes imported successfully",
  "totalRows": 150,
  "successCount": 145,
  "updateCount": 5,
  "failureCount": 0,
  "errors": []
}
```

### Error Response
```json
{
  "success": false,
  "error": "Invalid GTFS format",
  "message": "Missing required columns: route_id",
  "details": "Ensure file contains: route_id, agency_id, route_short_name"
}
```

## Troubleshooting

**Problem:** Authentication error
**Solution:** Use admin account (AG003 or BP009) to login

**Problem:** Foreign key error on trips import
**Solution:** Import routes.txt first

**Problem:** Foreign key error on stop_times import
**Solution:** Import routes.txt and stops.txt first

**Problem:** File too large error
**Solution:** Max file size is 100MB, split into smaller files if needed

**Problem:** Import taking too long
**Solution:** stop_times.txt can take 5-10 minutes for large datasets (normal)

## Files Location

- **Migration:** `/backend/migrations/009_create_gtfs_tables.sql`
- **Routes:** `/backend/routes/adminGTFS.js`
- **Server Config:** `/backend/server.js` (lines 200, 612)
- **Documentation:** `/backend/GTFS_IMPLEMENTATION_SUMMARY.md`
- **This Guide:** `/backend/GTFS_QUICK_START.md`

## Next Steps

After successful import:
1. Update API documentation with GTFS endpoints
2. Create frontend UI for GTFS management
3. Integrate GTFS data with breakdown location matching
4. Add route visualization features
5. Connect to GTFS-Realtime feeds (optional)

---

**Status:** Ready for Testing
**Date:** November 10, 2025
