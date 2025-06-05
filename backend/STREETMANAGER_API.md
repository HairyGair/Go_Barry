# StreetManager API Integration for BARRY

StreetManager is the UK government's official platform for managing roadworks permits and street activities. This integration provides BARRY with access to official, real-time roadworks data across North East England.

## 🚧 Overview

The StreetManager integration adds **official UK roadworks data** to BARRY's traffic intelligence platform, including:

- **Live roadworks activities** - Currently active roadworks
- **Planned permits** - Upcoming roadworks with permits
- **Official data source** - Government-verified information
- **North East focus** - Filtered for regional relevance

## 🔑 Getting StreetManager API Access

1. **Apply for API access** at: https://www.streetmanager.service.gov.uk/
2. **Complete the application process** (may require business verification)
3. **Receive your API key** from StreetManager
4. **Add to your `.env` file**: `STREET_MANAGER_API_KEY=your_api_key_here`

## 📊 API Endpoints

### 1. Activities Endpoint - Live Roadworks
```
GET /api/streetmanager/activities
```

Fetches currently active roadworks and street activities.

**Query Parameters:**
- `refresh=true` - Force cache refresh

**Response:**
```json
{
  "success": true,
  "activities": [
    {
      "id": "streetmanager_SM12345",
      "title": "Utility Works - Water Main Repair",
      "description": "Emergency water main repair on High Street",
      "location": "High Street, Newcastle upon Tyne",
      "coordinates": [54.9783, -1.6178],
      "status": "red",
      "severity": "High",
      "type": "roadwork",
      "source": "StreetManager",
      "authority": "Northumbrian Water",
      "permitReference": "SM12345",
      "workCategory": "utility_works",
      "isEmergency": true,
      "proposedStartDate": "2025-06-05T08:00:00Z",
      "proposedEndDate": "2025-06-07T18:00:00Z",
      "streetName": "High Street",
      "usrn": "12345678",
      "officialSource": true
    }
  ],
  "metadata": {
    "source": "StreetManager Activities",
    "totalActivities": 45,
    "northEastActivities": 12,
    "coverage": "North East England",
    "official": true
  }
}
```

### 2. Permits Endpoint - Planned Roadworks
```
GET /api/streetmanager/permits
```

Fetches planned roadworks permits.

**Query Parameters:**
- `refresh=true` - Force cache refresh

**Response:**
```json
{
  "success": true,
  "permits": [
    {
      "id": "streetmanager_permit_PM67890",
      "title": "Permit: Highway Maintenance - Granted",
      "description": "Roadworks permit PM67890",
      "location": "A1 Junction 65, Birtley",
      "coordinates": [54.8800, -1.5800],
      "status": "amber",
      "severity": "Medium",
      "type": "roadwork",
      "source": "StreetManager",
      "authority": "Gateshead Council",
      "permitReference": "PM67890",
      "permitStatus": "granted",
      "workCategory": "highway_maintenance",
      "proposedStartDate": "2025-06-10T07:00:00Z",
      "proposedEndDate": "2025-06-15T19:00:00Z",
      "usrn": "87654321",
      "officialSource": true,
      "permitType": true
    }
  ],
  "metadata": {
    "source": "StreetManager Permits",
    "totalPermits": 28,
    "northEastPermits": 8,
    "coverage": "North East England",
    "official": true
  }
}
```

### 3. Combined Endpoint - All StreetManager Data
```
GET /api/streetmanager/all
```

Fetches both activities and permits in a single request.

**Response:**
```json
{
  "success": true,
  "alerts": [...], // Combined activities and permits
  "metadata": {
    "totalAlerts": 20,
    "sources": {
      "activities": {
        "success": true,
        "count": 12,
        "lastUpdated": "2025-06-05T09:18:00Z"
      },
      "permits": {
        "success": true,
        "count": 8,
        "lastUpdated": "2025-06-05T09:18:00Z"
      }
    },
    "coverage": "North East England",
    "official": true
  }
}
```

### 4. Specific Permit Details
```
GET /api/streetmanager/permit/:permitReference
```

Fetch detailed information about a specific permit.

**Example:**
```
GET /api/streetmanager/permit/PM67890
```

### 5. Specific Activity Details
```
GET /api/streetmanager/activity/:activityReference
```

Fetch detailed information about a specific activity.

**Example:**
```
GET /api/streetmanager/activity/SM12345
```

### 6. StreetManager Status
```
GET /api/streetmanager/status
```

Check StreetManager API configuration and status.

**Response:**
```json
{
  "success": true,
  "status": {
    "configured": true,
    "apiKeySet": true,
    "cache": {
      "activities": 1,
      "permits": 1
    },
    "endpoints": {
      "activities": "/api/streetmanager/activities",
      "permits": "/api/streetmanager/permits",
      "combined": "/api/streetmanager/all"
    },
    "coverage": "North East England"
  }
}
```

### 7. Cache Management
```
POST /api/streetmanager/cache/clear
```

Clear StreetManager data cache to force fresh API calls.

## 🔧 Integration with Enhanced Alerts

StreetManager data is **automatically included** in the main enhanced alerts endpoint:

```
GET /api/alerts-enhanced
```

This endpoint now returns traffic data from:
- **TomTom** - Live traffic incidents
- **MapQuest** - Traffic congestion data  
- **StreetManager** - Official UK roadworks (NEW!)

## 📍 Geographic Filtering

All StreetManager data is **automatically filtered** for North East England:

**Bounding Box:**
- North: 55.3°
- South: 54.5°
- East: -1.0°
- West: -2.5°

**Included Areas:**
- Newcastle upon Tyne
- Gateshead
- Sunderland
- Durham
- Northumberland (southern)

## 🏗️ Data Transformation

StreetManager data is transformed to match BARRY's alert format:

**Status Mapping:**
- `in_progress` → `red` (High severity)
- `proposed/planned` → `amber` (Medium severity)
- `completed/cancelled` → `green` (Low severity)

**Emergency Works:**
- Automatically flagged as `red` status with `High` severity
- Takes priority in alert displays

## 💾 Caching

- **Cache Duration:** 10 minutes
- **Automatic Refresh:** Every API call checks cache age
- **Force Refresh:** Use `?refresh=true` parameter
- **Cache Clearing:** POST to `/api/streetmanager/cache/clear`

## 🚀 Testing the Integration

### 1. Check Status
```bash
curl https://go-barry.onrender.com/api/streetmanager/status
```

### 2. Test Activities
```bash
curl https://go-barry.onrender.com/api/streetmanager/activities
```

### 3. Test Permits
```bash
curl https://go-barry.onrender.com/api/streetmanager/permits
```

### 4. Test Enhanced Integration
```bash
curl https://go-barry.onrender.com/api/alerts-enhanced
```

## 🔍 Troubleshooting

### No API Key
If `STREET_MANAGER_API_KEY` is not set:
```json
{
  "success": false,
  "error": "StreetManager API key not configured",
  "activities": []
}
```

### Invalid API Key
```json
{
  "success": false,
  "error": "StreetManager API error: 401 Unauthorized",
  "activities": []
}
```

### No Data for North East
If no roadworks are found in the region:
```json
{
  "success": true,
  "activities": [],
  "metadata": {
    "totalActivities": 0,
    "northEastActivities": 0
  }
}
```

## 📱 Mobile App Integration

The mobile app **automatically receives** StreetManager data through the enhanced alerts endpoint. No additional configuration needed!

**StreetManager alerts will appear with:**
- 🚧 **Official source badge**
- 📋 **Permit reference numbers**
- 🏛️ **Highway authority information**
- 📅 **Detailed timing information**

## 🎯 Benefits

✅ **Official Data** - Government-verified roadworks information  
✅ **Real-time Updates** - Live activity status changes  
✅ **Comprehensive Coverage** - Both active and planned works  
✅ **Enhanced Accuracy** - Official coordinates and descriptions  
✅ **Regulatory Compliance** - Data directly from highway authorities  
✅ **Emergency Detection** - Automatic flagging of emergency works  

## 🔮 Future Enhancements

- **Route Impact Analysis** - Match permits to specific bus routes
- **Timeline Visualization** - Show roadworks progression over time
- **Authority Filtering** - Filter by specific highway authorities
- **Work Category Analysis** - Group by work types (utilities, maintenance, etc.)
- **Historical Data** - Archive completed works for analysis

---

**Ready to integrate StreetManager?** Add your API key to the `.env` file and start receiving official UK roadworks data in BARRY! 🚧📊
