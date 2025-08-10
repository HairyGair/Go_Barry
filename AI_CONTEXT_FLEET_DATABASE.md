# Go BARRY Fleet Database - Quick AI Context

## What You Need to Know
I have a Go BARRY transportation app with an integrated GNE fleet database (559 vehicles). The fleet data is used by three systems: Breakdown Guide (UI), Breakdown Tracker (API), and Breakdown Analytics (API).

## Key Files & Locations
- **Fleet Database**: `/gne-fleet-database.json` (559 vehicles from 6 active depots)
- **Fleet Service**: `backend/services/fleetDatabaseService.js`
- **Modified APIs**: 
  - `backend/routes/breakdownTrackerAPI.js` (added vehicle search/lookup)
  - `backend/routes/breakdownAnalyticsAPI.js` (added fleet health/stats)
- **Frontend**: `Go_BARRY/public/breakdown-guide/fleetLookupComponent.js`

## API Endpoints Added
```
GET /api/breakdown-tracker/vehicles/search?q=XXX
GET /api/breakdown-tracker/vehicles/:fleetNumber
GET /api/breakdown-analytics/fleet-health
GET /api/breakdown-analytics/fleet-composition
```

## Fleet Details
- **Depots**: Washington, Hexham, Riverside, Percy Main, Deptford, Consett
- **Largest depot**: Riverside (178 vehicles)
- **Most common vehicle**: Wrightbus Streetlite DF (140 units)
- **Fleet ranges**: 600s (Hexham), 5200s (Washington), 5500s (Riverside), 6000s (Percy Main), 6300s (Consett), 6900s (Deptford)

## How It Works
1. Fleet database loads on server start into memory
2. Breakdown Tracker validates vehicles and auto-assigns depots
3. Analytics provides fleet health metrics and composition
4. Frontend has vehicle search with auto-complete

## To Test/Update
- Test integration: `node test-fleet-integration.mjs`
- Update fleet data: `node generate-gne-fleet-json.mjs [new-excel-file]`
- Re-integrate: `node integrate-fleet-database.mjs`

The integration enhances all breakdown operations with real vehicle data, automatic depot assignment, and fleet analytics.
