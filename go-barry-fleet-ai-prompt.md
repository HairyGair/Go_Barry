# Go BARRY Fleet Database Integration - AI Context Prompt

## Overview
I have a transportation management system called "Go BARRY" with a fleet database of 559 vehicles from Go North East (GNE). The fleet database has been integrated with three core systems: Breakdown Guide, Breakdown Tracker, and Breakdown Analytics.

## Fleet Database Details
- **Location**: `/gne-fleet-database.json`
- **Total Vehicles**: 559
- **Active Depots**: Washington, Hexham, Riverside, Percy Main, Deptford, Consett
- **Structure**: Each vehicle has:
  - `fleetNumber`: String (e.g., "5401")
  - `regNo`: Registration number (e.g., "NK15ENO")
  - `vehicleType`: Full vehicle description (e.g., "Wrightbus Streetlite DF Streetlite ISBe5...")

## Integration Architecture

### 1. Fleet Database Service
- **File**: `backend/services/fleetDatabaseService.js`
- **Purpose**: Core service that loads and manages fleet data
- **Key Methods**:
  - `getByFleetNumber(fleetNumber)` - Lookup by fleet number
  - `getByRegNumber(regNo)` - Lookup by registration
  - `getDepotFromFleetNumber(fleetNumber)` - Get depot assignment
  - `getVehicleTypeCategory(vehicleType)` - Categorize vehicle type
  - `searchVehicles(query)` - Search vehicles
  - `getFleetStats()` - Get fleet statistics

### 2. Breakdown Tracker Integration
- **File**: `backend/routes/breakdownTrackerAPI.js`
- **Enhanced Endpoints**:
  - `GET /api/breakdown-tracker/vehicles/search?q=XXX` - Search vehicles
  - `GET /api/breakdown-tracker/vehicles/:fleetNumber` - Get vehicle details
- **Features**: Automatic depot assignment, vehicle validation, metadata enrichment

### 3. Breakdown Analytics Integration
- **File**: `backend/routes/breakdownAnalyticsAPI.js`
- **Enhanced Endpoints**:
  - `GET /api/breakdown-analytics/fleet-health` - Fleet statistics
  - `GET /api/breakdown-analytics/fleet-composition` - Fleet composition
- **Features**: Fleet health dashboard, depot statistics, vehicle type analysis

### 4. Frontend Component
- **File**: `Go_BARRY/public/breakdown-guide/fleetLookupComponent.js`
- **Purpose**: Vehicle search UI for breakdown guide
- **Features**: Auto-complete search, vehicle info display, common issues by type

## Depot Fleet Ranges (Approximate)
- Hexham: 600-699 (Solo vehicles)
- Washington: 5200-5499
- Riverside: 5500-5799, 8300-8399
- Percy Main: 6000-6299
- Consett: 6300-6599
- Deptford: 6900-7199

## Vehicle Fleet Composition
- Wrightbus Streetlite DF: 140 vehicles
- Volvo B9TL Eclipse: 136 vehicles
- ADL Enviro 400: 58 vehicles
- Wrightbus Streetdeck: 48 vehicles
- Optare Solo SR: 44 vehicles

## File Structure
```
Go BARRY App/
├── gne-fleet-database.json                    # Fleet database
├── backend/
│   ├── services/
│   │   └── fleetDatabaseService.js           # Core fleet service
│   ├── routes/
│   │   ├── breakdownTrackerAPI.js            # Enhanced with fleet lookup
│   │   └── breakdownAnalyticsAPI.js          # Enhanced with fleet stats
│   └── integration/                           # (Original integration files, not actively used)
└── Go_BARRY/
    └── public/
        └── breakdown-guide/
            └── fleetLookupComponent.js       # Frontend vehicle search
```

## Important Notes
1. The fleet database is loaded into memory on server start
2. Vehicle lookups are case-insensitive for registrations
3. The integration was done by directly modifying the route files
4. All 559 vehicles are from active depots only
5. The system validates vehicles exist before creating breakdowns

## Testing
Test the integration with:
```bash
node test-fleet-integration.mjs
```

Expected endpoints to work:
- `/api/breakdown-tracker/vehicles/search?q=540`
- `/api/breakdown-tracker/vehicles/5401`
- `/api/breakdown-analytics/fleet-health`
- `/api/breakdown-analytics/fleet-composition`

## Common Tasks
- **Update fleet database**: Run `node generate-gne-fleet-json.mjs` with new Excel file
- **Re-integrate after changes**: Run `node integrate-fleet-database.mjs`
- **Test integration**: Run `node test-fleet-integration.mjs`

## Context for AI
When working on this system, remember:
- The fleet database provides real vehicle data for all breakdown operations
- Vehicle validation happens automatically on breakdown creation
- Depot assignment is based on fleet number ranges
- The frontend component auto-initializes on breakdown guide pages
- All vehicle types are categorized for analytics (Streetlite, Volvo B9TL, etc.)
