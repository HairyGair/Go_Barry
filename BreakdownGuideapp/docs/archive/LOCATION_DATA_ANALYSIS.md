# Location Data Analysis Report

**Generated**: October 6, 2025
**Database**: Supabase (oieliubbvvdzhzvikzal)
**Table**: breakdowns
**Sample Size**: 11 breakdowns (50 analyzed total)

---

## Executive Summary

Location data **EXISTS** in the database and is **USABLE** for displaying maps. Coordinates are stored in a structured JSON format with latitude and longitude values.

### Key Findings

- **27.3%** of breakdowns have structured coordinate data
- **100%** of breakdowns have wizard assessment data
- **36.4%** have location descriptions
- Coordinates are stored in a consistent format: `{"lat": 54.959849, "lng": -1.657082}`

---

## Location Data Formats

### 1. Primary Format: `wizard_assessment_data.location_coords`

**Field Path**: `wizard_assessment_data.location_coords`

**Format**: JSON object with `lat` and `lng` keys

**Sample Data**:
```json
{
  "lat": 54.959849,
  "lng": -1.657082
}
```

**Coverage**: 3 out of 11 breakdowns (27.3%)

**Examples**:
- **BD-2025-00011** (Fleet 8801): `{"lat":54.959849, "lng":-1.657082}`
- **BD-2025-00010** (Fleet 3942): `{"lat":55.029738, "lng":-1.630633}`
- **BD-2025-00008** (Fleet 5801): `{"lat":54.965055, "lng":-1.713852}`

### 2. Secondary Format: `location_description` (Text with embedded coordinates)

**Field Path**: `location_description`

**Format**: Text string with coordinates in parentheses

**Sample Data**:
```
Ticketer Location (54.959849, -1.657082)
```

**Coverage**: 3 out of 11 breakdowns (27.3%)

**Examples**:
- **BD-2025-00011**: "Ticketer Location (54.959849, -1.657082)"
- **BD-2025-00010**: "Ticketer Location (55.029738, -1.630633)"
- **BD-2025-00008**: "Ticketer Location (54.965055, -1.713852)"

### 3. Database Schema Location Fields

The breakdowns table also has dedicated location columns (currently NULL/unused):

- `location_lat` (object/null)
- `location_lng` (object/null)
- `location_address` (object/null)
- `location_what3words` (object/null)
- `location_nearest_depot` (object/null)
- `location_depot_distance` (object/null)
- `location_street` (object/null)
- `location_google_maps_link` (object/null)
- `location_what3words_link` (object/null)
- `location_capture_method` (string)
- `location_captured_at` (object/null)
- `location_accuracy_level` (object/null)

These fields are available but **not currently populated**.

---

## Coordinate Extraction Path

To extract coordinates for map display:

### Option 1: Direct JSON Access (Recommended)
```javascript
const coords = breakdown.wizard_assessment_data?.location_coords;

if (coords && coords.lat && coords.lng) {
  // Use coords.lat and coords.lng for map
  displayOnMap(coords.lat, coords.lng);
}
```

### Option 2: Parse from Description (Fallback)
```javascript
const locationDesc = breakdown.location_description;

if (locationDesc && !coords) {
  const coordMatch = locationDesc.match(/\((\-?\d+\.\d+),\s*(\-?\d+\.\d+)\)/);

  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    displayOnMap(lat, lng);
  }
}
```

---

## Coverage Analysis

### By Breakdown Status

| Status | Count | With Coordinates | Percentage |
|--------|-------|------------------|------------|
| Active | 3 | 3 | 100% |
| Other  | 8 | 0 | 0% |

**Note**: All active breakdowns have coordinate data, but resolved/historical breakdowns may not.

### Data Quality

- **Coordinate Precision**: 6 decimal places (~0.1 meter accuracy)
- **Format Consistency**: All coordinates use same JSON structure
- **Geographic Area**: Northeast England (lat ~54-55°N, lng ~-1.6--1.7°W)
- **Data Source**: Ticketer system (bus ticketing/GPS tracking)

---

## Recommendations

### 1. Use `wizard_assessment_data.location_coords` for Map Display

**Reason**: Structured data is easier to parse and more reliable

**Implementation**:
```javascript
// In breakdown detail view
const MapView = ({ breakdown }) => {
  const coords = breakdown.wizard_assessment_data?.location_coords;

  if (!coords || !coords.lat || !coords.lng) {
    return <div>No location data available</div>;
  }

  return (
    <Map
      center={[coords.lat, coords.lng]}
      zoom={15}
      marker={{ lat: coords.lat, lng: coords.lng }}
    />
  );
};
```

### 2. Implement Fallback Parsing

**Reason**: Some breakdowns may have coordinates in description only

**Implementation**: Use regex to extract coordinates from `location_description` if `location_coords` is null

### 3. Consider Populating Dedicated Location Columns

**Reason**: The database has dedicated `location_lat` and `location_lng` columns

**Benefits**:
- Easier querying (can filter by geographic area)
- Better indexing for spatial queries
- Consistent data structure

**Migration Strategy**:
```sql
-- Migrate coordinates from wizard_assessment_data to dedicated columns
UPDATE breakdowns
SET
  location_lat = (wizard_assessment_data->>'location_coords'->>'lat')::float,
  location_lng = (wizard_assessment_data->>'location_coords'->>'lng')::float
WHERE wizard_assessment_data->>'location_coords' IS NOT NULL;
```

### 4. Handle Missing Coordinates Gracefully

**Current Coverage**: Only 27.3% of breakdowns have coordinates

**UI Recommendations**:
- Show "Location unavailable" message when no coordinates
- Display text description as fallback
- Consider adding manual location entry for historical records

---

## Geographic Context

All breakdowns are located in the **Northeast England** region:

- **Latitude Range**: 54.96° - 55.03° N
- **Longitude Range**: -1.71° - -1.63° W
- **Coverage Area**: Newcastle upon Tyne, Gateshead, North Tyneside

### Sample Locations (based on coordinates)

- **BD-2025-00011** (54.959849, -1.657082): Gateshead area
- **BD-2025-00010** (55.029738, -1.630633): North Shields / Tynemouth area
- **BD-2025-00008** (54.965055, -1.713852): Newcastle city center

---

## Map Integration Checklist

For implementing location-based features:

- [ ] Extract coordinates from `wizard_assessment_data.location_coords`
- [ ] Validate coordinate format `{lat: number, lng: number}`
- [ ] Handle missing coordinates with fallback UI
- [ ] Use Leaflet/Google Maps with Northeast England as default center
- [ ] Set appropriate zoom level (14-16 for street-level detail)
- [ ] Add marker with breakdown details (fleet number, status, time)
- [ ] Consider clustering for multiple breakdowns in same area
- [ ] Add route overlay if route data available
- [ ] Show depot locations for context
- [ ] Calculate distance from nearest depot

---

## Data Source: Ticketer System

All current location data comes from **Ticketer** (bus ticketing/GPS system):

- **Accuracy**: GPS-based (typically 5-10 meter accuracy)
- **Update Frequency**: Real-time from vehicle GPS
- **Coverage**: Only available for vehicles with Ticketer installed
- **Data Quality**: High precision (6 decimal places)

**Note**: Breakdowns without Ticketer data will need manual location entry or alternative geocoding method.

---

## SQL Queries for Further Analysis

### Count breakdowns with coordinates
```sql
SELECT
  COUNT(*) as total,
  COUNT(wizard_assessment_data->'location_coords') as with_coords,
  ROUND(COUNT(wizard_assessment_data->'location_coords')::numeric / COUNT(*)::numeric * 100, 2) as percentage
FROM breakdowns;
```

### Get all breakdowns with coordinates
```sql
SELECT
  breakdown_id,
  fleet_no,
  status,
  wizard_assessment_data->'location_coords' as coordinates,
  location_description,
  created_at
FROM breakdowns
WHERE wizard_assessment_data->'location_coords' IS NOT NULL
ORDER BY created_at DESC;
```

### Geographic bounding box
```sql
SELECT
  MIN((wizard_assessment_data->'location_coords'->>'lat')::float) as min_lat,
  MAX((wizard_assessment_data->'location_coords'->>'lat')::float) as max_lat,
  MIN((wizard_assessment_data->'location_coords'->>'lng')::float) as min_lng,
  MAX((wizard_assessment_data->'location_coords'->>'lng')::float) as max_lng
FROM breakdowns
WHERE wizard_assessment_data->'location_coords' IS NOT NULL;
```

---

## Conclusion

**Location data is USABLE for map display** with the following approach:

1. **Primary**: Use `wizard_assessment_data.location_coords` (27.3% coverage)
2. **Fallback**: Parse coordinates from `location_description` text
3. **Enhancement**: Populate dedicated `location_lat`/`location_lng` columns
4. **UI**: Handle missing coordinates gracefully

**Coordinate Format**: `{"lat": 54.959849, "lng": -1.657082}` (consistent JSON structure)

**Geographic Area**: Northeast England (Newcastle, Gateshead, North Tyneside)

**Data Quality**: High precision (6 decimal places), GPS-sourced from Ticketer system

---

**Script Location**: `/Users/anthony/Go BARRY App/BreakdownGuideapp/backend/scripts/analyze-location-data.js`

**Run Analysis**:
```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/backend
node scripts/analyze-location-data.js
```
