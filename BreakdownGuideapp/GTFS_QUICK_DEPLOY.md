# GTFS Feature - Quick Deployment Guide

**Status:** ✅ Ready to Deploy  
**Database:** ✅ Migration completed and tables created  
**Backend:** ✅ Fully implemented and verified  
**Frontend:** ✅ Built successfully  

---

## What's New

New "🗺️ GTFS Data" admin tab for uploading:
- routes.txt (bus routes)
- stops.txt (bus stop locations)
- trips.txt (trip schedules)
- stop_times.txt (departure/arrival times)

---

## Next Steps (Admin Only - AG003 or BP009)

### Step 1: Deploy Frontend ⏳
```bash
# On your local machine, copy built files:
# Upload contents of /frontend/dist/ to:
# ~/public_html/breakdowns.gobarry.co.uk/
```

### Step 2: Test the Feature
1. Visit https://breakdowns.gobarry.co.uk
2. Login with email and password: `GoNorthEast2025!`
3. Go to Settings → Admin Controls
4. Click "🗺️ GTFS Data" tab
5. Upload your GTFS files (in order: routes → stops → trips → stop_times)

### Step 3: Monitor Imports
- Watch progress bars during upload
- Review error reports if imports fail
- Check statistics at bottom of screen showing:
  - Total rows processed
  - Successfully imported
  - Failed records

---

## Import Order (Important!)

1. **routes.txt** - First (other data references this)
2. **stops.txt** - Second
3. **trips.txt** - Third (references routes)
4. **stop_times.txt** - Last (references both trips and stops)

If you import them out of order, foreign key constraints will fail.

---

## File Requirements

### Routes File (routes.txt)
```
route_id, agency_id, route_short_name, route_long_name
GNE_1, GNE, 1, Hexham - Gateshead
```

### Stops File (stops.txt)
```
stop_id, stop_name, stop_lat, stop_lon
1, Hexham Bus Station, 54.9611, -2.1194
```

### Trips File (trips.txt)
```
trip_id, route_id, service_id
GNE_1_0, GNE_1, WD
```

### Stop Times File (stop_times.txt)
```
trip_id, stop_id, stop_sequence, arrival_time, departure_time
GNE_1_0, 1, 1, 07:00:00, 07:00:00
```

---

## Endpoints (For API Testing)

All require admin authentication (JWT token with admin role):

```bash
# Import routes
POST /api/admin/gtfs/routes
Field: csvFile (multipart/form-data)

# Import stops
POST /api/admin/gtfs/stops
Field: csvFile (multipart/form-data)

# Import trips
POST /api/admin/gtfs/trips
Field: csvFile (multipart/form-data)

# Import stop times
POST /api/admin/gtfs/stop-times
Field: csvFile (multipart/form-data)

# Get statistics
GET /api/admin/gtfs/stats
```

---

## Database Tables

Tables automatically created during migration:
- **gtfs_routes** - 150+ routes (typically)
- **gtfs_stops** - 5,000+ stops (typically)
- **gtfs_trips** - 10,000+ trips (typically)
- **gtfs_stop_times** - 400,000+ records (largest file)
- **gtfs_import_log** - Audit trail

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Missing required columns" | Check CSV headers match GTFS spec |
| "Foreign key constraint failed" | Import files in correct order |
| "File too large" | Max 100MB - split large files |
| "Authentication required" | Login with admin account (AG003/BP009) |
| "Import timing out" | stop_times.txt can take 5-10 minutes |

---

## Performance Notes

- **routes.txt**: 1-2 seconds
- **stops.txt**: 10-15 seconds
- **trips.txt**: 30-45 seconds
- **stop_times.txt**: 5-10 minutes (largest file, batch processed)

---

## Verification

After importing, verify in database:
```sql
SELECT COUNT(*) FROM gtfs_routes;      -- Should have data
SELECT COUNT(*) FROM gtfs_stops;       -- Should have data
SELECT COUNT(*) FROM gtfs_trips;       -- Should have data
SELECT COUNT(*) FROM gtfs_stop_times;  -- Should have data
```

---

## That's It! 🎉

The GTFS feature is ready to use. Just deploy the frontend, login as admin, and upload your transit data files.

