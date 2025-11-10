# GTFS Data Import Implementation Summary

**Date:** November 10, 2025
**Author:** Claude (AI Assistant)
**Status:** ✅ Complete and Ready for Testing

---

## Overview

Implemented a comprehensive GTFS (General Transit Feed Specification) data import system for the Go BARRY Breakdown Management System. This enables importing bus route data, stop locations, trip schedules, and stop times from standard GTFS transit data files.

---

## Files Created

### 1. Database Migration
**File:** `/backend/migrations/009_create_gtfs_tables.sql`

**Created Tables:**
- `gtfs_routes` - Bus route definitions (route_id, route_short_name, route_long_name, colors, etc.)
- `gtfs_stops` - Bus stop locations with GPS coordinates
- `gtfs_trips` - Trip schedules linking routes to services
- `gtfs_stop_times` - Departure/arrival times for each stop on each trip
- `gtfs_import_log` - Audit log tracking all GTFS imports

**Stored Procedures Created:**
- `sp_get_routes_by_name(route_name)` - Search routes by short name
- `sp_find_nearest_stops(lat, lon, limit)` - Find nearest stops using Haversine distance
- `sp_get_trip_details(trip_id)` - Get complete trip information with all stops

**Views Created:**
- `v_gtfs_route_stats` - Route statistics (total trips, stops, first/last departure)
- `v_gtfs_import_summary` - Import summary with success/failure counts

**Indexes Created:**
- Primary keys on all tables (auto-increment INT)
- Unique indexes on route_id, stop_id, trip_id
- Composite index on (trip_id, stop_id, stop_sequence) for stop_times
- Foreign keys linking trips to routes and stop_times to trips/stops
- Performance indexes on frequently queried columns

---

## Files Modified

### 1. Server Configuration
**File:** `/backend/server.js`

**Changes:**
- Added import: `import adminGTFSRoutes from './routes/adminGTFS.js';`
- Registered routes: `app.use('/api/admin/gtfs', authenticateAdmin, adminGTFSRoutes);`
- Routes require admin authentication (AG003, BP009 only)

---

## API Endpoints

All endpoints require admin authentication (JWT token with admin role).

### 1. POST `/api/admin/gtfs/routes`
**Purpose:** Import bus routes from GTFS `routes.txt` file

**Required Columns:**
- route_id (unique identifier)
- agency_id
- route_short_name (e.g., "1", "21", "X10")

**Optional Columns:**
- route_long_name
- route_desc
- route_type (bus type code)
- route_url
- route_color (hex color without #)
- route_text_color (hex color without #)

**Request:**
```bash
curl -X POST http://localhost:3001/api/admin/gtfs/routes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "csvFile=@routes.txt"
```

**Response:**
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

**Features:**
- Upsert logic (insert new, update existing)
- Transaction support (all or nothing)
- Batch processing
- Error tracking with details

---

### 2. POST `/api/admin/gtfs/stops`
**Purpose:** Import bus stops from GTFS `stops.txt` file

**Required Columns:**
- stop_id (unique identifier)
- stop_name
- stop_lat (decimal degrees)
- stop_lon (decimal degrees)

**Optional Columns:**
- stop_code
- stop_desc
- zone_id
- wheelchair_boarding (0=no info, 1=accessible, 2=not accessible)

**Request:**
```bash
curl -X POST http://localhost:3001/api/admin/gtfs/stops \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "csvFile=@stops.txt"
```

**Response:**
```json
{
  "success": true,
  "message": "Stops imported successfully",
  "totalRows": 5234,
  "successCount": 5230,
  "updateCount": 4,
  "failureCount": 0,
  "errors": []
}
```

**Features:**
- GPS coordinate validation
- Spatial indexing for location queries
- Wheelchair accessibility tracking

---

### 3. POST `/api/admin/gtfs/trips`
**Purpose:** Import trips from GTFS `trips.txt` file

**Required Columns:**
- trip_id (unique identifier)
- route_id (references gtfs_routes.route_id)
- service_id (service pattern identifier)

**Optional Columns:**
- trip_headsign (destination display)
- direction_id (0 or 1)

**Request:**
```bash
curl -X POST http://localhost:3001/api/admin/gtfs/trips \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "csvFile=@trips.txt"
```

**Response:**
```json
{
  "success": true,
  "message": "Trips imported successfully",
  "totalRows": 12540,
  "successCount": 12540,
  "updateCount": 0,
  "failureCount": 0,
  "errors": []
}
```

**Features:**
- Foreign key validation (route_id must exist)
- Direction tracking (inbound/outbound)
- Service pattern linking

---

### 4. POST `/api/admin/gtfs/stop-times`
**Purpose:** Import stop times from GTFS `stop_times.txt` file

**Warning:** This is typically the largest GTFS file (46MB+). Import may take several minutes.

**Required Columns:**
- trip_id (references gtfs_trips.trip_id)
- stop_id (references gtfs_stops.stop_id)
- stop_sequence (integer, order of stops)
- arrival_time (HH:MM:SS format, can exceed 24:00:00)
- departure_time (HH:MM:SS format)

**Optional Columns:**
- stop_headsign
- pickup_type (0=regular, 1=none, 2=phone, 3=driver)
- drop_off_type (0=regular, 1=none, 2=phone, 3=driver)

**Request:**
```bash
curl -X POST http://localhost:3001/api/admin/gtfs/stop-times \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "csvFile=@stop_times.txt"
```

**Response:**
```json
{
  "success": true,
  "message": "Stop times imported successfully",
  "totalRows": 489230,
  "successCount": 489230,
  "updateCount": 0,
  "failureCount": 0,
  "errors": [],
  "note": "Large stop times imports may take several minutes to complete"
}
```

**Features:**
- Batch processing (1000 records per transaction)
- Progress logging every 10,000 records
- Foreign key validation (trip_id and stop_id must exist)
- Unique constraint on (trip_id, stop_id, stop_sequence)

**Performance:**
- 100MB file size limit
- Memory-efficient streaming
- Transaction batching for speed

---

### 5. GET `/api/admin/gtfs/stats`
**Purpose:** Get statistics on imported GTFS data

**Request:**
```bash
curl -X GET http://localhost:3001/api/admin/gtfs/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "routes": 150,
    "stops": 5234,
    "trips": 12540,
    "stopTimes": 489230,
    "routesLastUpdated": "2025-11-10T14:30:00.000Z",
    "stopsLastUpdated": "2025-11-10T14:32:00.000Z",
    "tripsLastUpdated": "2025-11-10T14:35:00.000Z",
    "stopTimesLastUpdated": "2025-11-10T14:55:00.000Z"
  },
  "message": "GTFS data statistics"
}
```

---

## Database Schema Details

### Table: gtfs_routes
```sql
- id INT PRIMARY KEY AUTO_INCREMENT
- route_id VARCHAR(100) UNIQUE NOT NULL
- agency_id VARCHAR(100)
- route_short_name VARCHAR(50)
- route_long_name VARCHAR(255)
- route_desc TEXT
- route_type INT
- route_url VARCHAR(500)
- route_color VARCHAR(6)
- route_text_color VARCHAR(6)
- created_at TIMESTAMP
- updated_at TIMESTAMP
```

**Indexes:**
- idx_route_id (route_id)
- idx_route_short_name (route_short_name)
- idx_agency_id (agency_id)
- idx_route_type (route_type)

---

### Table: gtfs_stops
```sql
- id INT PRIMARY KEY AUTO_INCREMENT
- stop_id VARCHAR(100) UNIQUE NOT NULL
- stop_code VARCHAR(50)
- stop_name VARCHAR(255) NOT NULL
- stop_lat DECIMAL(10, 8) NOT NULL
- stop_lon DECIMAL(11, 8) NOT NULL
- stop_desc TEXT
- zone_id VARCHAR(50)
- wheelchair_boarding INT DEFAULT 0
- created_at TIMESTAMP
- updated_at TIMESTAMP
```

**Indexes:**
- idx_stop_id (stop_id)
- idx_stop_code (stop_code)
- idx_stop_name (stop_name)
- idx_stop_location (stop_lat, stop_lon)
- idx_zone_id (zone_id)

---

### Table: gtfs_trips
```sql
- id INT PRIMARY KEY AUTO_INCREMENT
- trip_id VARCHAR(100) UNIQUE NOT NULL
- route_id VARCHAR(100) NOT NULL [FK → gtfs_routes.route_id]
- service_id VARCHAR(100) NOT NULL
- trip_headsign VARCHAR(255)
- direction_id INT
- created_at TIMESTAMP
- updated_at TIMESTAMP
```

**Indexes:**
- idx_trip_id (trip_id)
- idx_route_id (route_id)
- idx_service_id (service_id)
- idx_direction_id (direction_id)

**Foreign Keys:**
- route_id → gtfs_routes.route_id (CASCADE)

---

### Table: gtfs_stop_times
```sql
- id INT PRIMARY KEY AUTO_INCREMENT
- trip_id VARCHAR(100) NOT NULL [FK → gtfs_trips.trip_id]
- stop_id VARCHAR(100) NOT NULL [FK → gtfs_stops.stop_id]
- stop_sequence INT NOT NULL
- arrival_time VARCHAR(8)
- departure_time VARCHAR(8)
- stop_headsign VARCHAR(255)
- pickup_type INT DEFAULT 0
- drop_off_type INT DEFAULT 0
- created_at TIMESTAMP
- updated_at TIMESTAMP
```

**Indexes:**
- idx_trip_id (trip_id)
- idx_stop_id (stop_id)
- idx_stop_sequence (stop_sequence)
- idx_arrival_time (arrival_time)
- idx_departure_time (departure_time)
- unique_trip_stop_sequence (trip_id, stop_id, stop_sequence)

**Foreign Keys:**
- trip_id → gtfs_trips.trip_id (CASCADE)
- stop_id → gtfs_stops.stop_id (CASCADE)

---

### Table: gtfs_import_log
```sql
- id INT PRIMARY KEY AUTO_INCREMENT
- import_type ENUM('routes', 'stops', 'trips', 'stop_times')
- file_name VARCHAR(255)
- records_processed INT
- records_successful INT
- records_failed INT
- error_details JSON
- imported_by VARCHAR(100)
- import_status ENUM('in_progress', 'completed', 'failed')
- started_at TIMESTAMP
- completed_at TIMESTAMP
- duration_seconds INT
```

---

## Usage Examples

### Example 1: Import Complete GTFS Dataset
```bash
# Login as admin first
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"anthony.gair@gonortheast.co.uk","password":"YOUR_PASSWORD"}' \
  | jq -r '.token')

# 1. Import routes
curl -X POST http://localhost:3001/api/admin/gtfs/routes \
  -H "Authorization: Bearer $TOKEN" \
  -F "csvFile=@routes.txt"

# 2. Import stops
curl -X POST http://localhost:3001/api/admin/gtfs/stops \
  -H "Authorization: Bearer $TOKEN" \
  -F "csvFile=@stops.txt"

# 3. Import trips
curl -X POST http://localhost:3001/api/admin/gtfs/trips \
  -H "Authorization: Bearer $TOKEN" \
  -F "csvFile=@trips.txt"

# 4. Import stop times (this takes longest)
curl -X POST http://localhost:3001/api/admin/gtfs/stop-times \
  -H "Authorization: Bearer $TOKEN" \
  -F "csvFile=@stop_times.txt"

# 5. Verify import
curl -X GET http://localhost:3001/api/admin/gtfs/stats \
  -H "Authorization: Bearer $TOKEN"
```

---

### Example 2: Find Nearest Stops to Breakdown Location
```sql
-- Find 5 nearest stops to breakdown location (54.9005, -1.5169)
CALL sp_find_nearest_stops(54.9005, -1.5169, 5);

-- Returns:
-- stop_id, stop_name, stop_lat, stop_lon, distance_km
```

---

### Example 3: Get Route Information
```sql
-- Search for route 21
CALL sp_get_routes_by_name('21');

-- Get all trips for route 21
SELECT * FROM gtfs_trips WHERE route_id = 'GNE_21';
```

---

### Example 4: Get Complete Trip Details
```sql
-- Get all stops for a specific trip
CALL sp_get_trip_details('GNE_21_20251110_0800');

-- Returns: trip info, route name, all stops with times
```

---

### Example 5: Query Route Statistics
```sql
-- View route statistics
SELECT * FROM v_gtfs_route_stats
WHERE route_short_name IN ('1', '21', 'X10', 'Q3')
ORDER BY total_trips DESC;
```

---

## Testing Checklist

### Database Migration
- [ ] Run migration: `mysql -u root -p < backend/migrations/009_create_gtfs_tables.sql`
- [ ] Verify tables exist: `SHOW TABLES LIKE 'gtfs_%';`
- [ ] Verify indexes: `SHOW INDEX FROM gtfs_routes;`
- [ ] Verify foreign keys: `SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'gtfs_trips';`
- [ ] Test stored procedures: `CALL sp_get_routes_by_name('21');`
- [ ] Test views: `SELECT * FROM v_gtfs_route_stats LIMIT 5;`

### API Endpoints
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Test health check: `curl http://localhost:3001/health`
- [ ] Login as admin: `POST /api/auth/login`
- [ ] Test routes import: `POST /api/admin/gtfs/routes`
- [ ] Test stops import: `POST /api/admin/gtfs/stops`
- [ ] Test trips import: `POST /api/admin/gtfs/trips`
- [ ] Test stop_times import: `POST /api/admin/gtfs/stop-times`
- [ ] Test stats endpoint: `GET /api/admin/gtfs/stats`
- [ ] Verify unauthorized access is blocked (test without admin token)

### Data Validation
- [ ] Verify routes imported correctly: `SELECT COUNT(*) FROM gtfs_routes;`
- [ ] Verify stops imported correctly: `SELECT COUNT(*) FROM gtfs_stops;`
- [ ] Verify trips imported correctly: `SELECT COUNT(*) FROM gtfs_trips;`
- [ ] Verify stop_times imported correctly: `SELECT COUNT(*) FROM gtfs_stop_times;`
- [ ] Check for duplicate route_ids: `SELECT route_id, COUNT(*) FROM gtfs_routes GROUP BY route_id HAVING COUNT(*) > 1;`
- [ ] Verify foreign key relationships: `SELECT COUNT(*) FROM gtfs_trips t LEFT JOIN gtfs_routes r ON t.route_id = r.route_id WHERE r.route_id IS NULL;`
- [ ] Test nearest stop query: `CALL sp_find_nearest_stops(54.9005, -1.5169, 5);`

### Error Handling
- [ ] Test with invalid CSV format
- [ ] Test with missing required columns
- [ ] Test with duplicate IDs
- [ ] Test with invalid foreign keys
- [ ] Test file size limit (100MB)
- [ ] Test without authentication
- [ ] Test with non-admin user

---

## File Upload Limits

**Multer Configuration:**
- Max file size: 100MB (100 * 1024 * 1024 bytes)
- Accepted file types: .csv, .txt
- Max files per upload: 1
- Storage: Memory (buffer)

**Recommended File Sizes:**
- routes.txt: 10KB - 500KB
- stops.txt: 500KB - 5MB
- trips.txt: 1MB - 10MB
- stop_times.txt: 10MB - 100MB (largest file)

---

## Performance Considerations

### Import Speed Estimates (based on typical GTFS datasets):
- **routes.txt** (150 routes): 1-2 seconds
- **stops.txt** (5,234 stops): 10-15 seconds
- **trips.txt** (12,540 trips): 30-45 seconds
- **stop_times.txt** (489,230 records): 5-10 minutes

### Optimization Features:
- Transaction batching (1000 records per batch)
- Upsert logic (INSERT or UPDATE based on existence)
- Prepared statements for SQL injection prevention
- Foreign key validation before insert
- Progress logging for large imports
- Connection pooling (10 connections max)

---

## Security Features

### Authentication & Authorization:
- Admin-only routes (requires role='admin')
- JWT token validation
- Badge-based authentication (AG003, BP009)

### Input Validation:
- CSV parsing with error handling
- File type validation (.csv, .txt only)
- File size limits (100MB max)
- Column validation (required fields)
- SQL injection prevention (parameterized queries)

### Error Handling:
- Graceful error responses
- Detailed error logging
- Transaction rollback on failure
- First 10 errors returned in response

---

## Future Enhancements

### Potential Features:
1. **Incremental Updates** - Update only changed records
2. **Calendar Integration** - Import calendar.txt and calendar_dates.txt
3. **Shape Data** - Import shapes.txt for route visualization
4. **Realtime Integration** - Connect to GTFS-Realtime feeds
5. **Route Matching** - Match breakdowns to affected routes
6. **Stop Proximity Alerts** - Alert supervisors of nearby stops
7. **Schedule Integration** - Show affected trips during breakdowns
8. **Data Validation** - Additional GTFS specification validation

---

## Troubleshooting

### Common Issues:

**Issue:** "Missing required columns" error
**Solution:** Ensure CSV has correct headers matching GTFS specification

**Issue:** Foreign key constraint failure on trips import
**Solution:** Import routes.txt before trips.txt

**Issue:** Foreign key constraint failure on stop_times import
**Solution:** Import both routes.txt and stops.txt before stop_times.txt

**Issue:** Import taking too long (>15 minutes)
**Solution:** Check database connection speed, increase batch size, or optimize indexes

**Issue:** "No file provided" error
**Solution:** Ensure multipart/form-data request with field name "csvFile"

**Issue:** Authentication error
**Solution:** Login with admin credentials (AG003 or BP009) and use JWT token

---

## Documentation Updates

### Files Modified:
- [x] `/backend/server.js` - Added GTFS routes registration
- [x] `/backend/migrations/009_create_gtfs_tables.sql` - Created
- [x] `/backend/GTFS_IMPLEMENTATION_SUMMARY.md` - Created (this file)

### Files to Update Later:
- [ ] `/backend/README.md` - Add GTFS import documentation
- [ ] `/docs/API_DOCUMENTATION.md` - Add GTFS endpoints
- [ ] `/docs/DATABASE_SCHEMA_REPORT.md` - Add GTFS tables
- [ ] `/backend/DEPLOYMENT.md` - Add GTFS migration instructions

---

## Contact

**Developer:** Anthony Gair
**Organization:** Go North East
**System:** Go BARRY Breakdown Management System

For issues or questions about the GTFS import system, refer to this document or contact the development team.

---

**Implementation Date:** November 10, 2025
**Status:** ✅ Complete and Ready for Testing
**Version:** 1.0.0
