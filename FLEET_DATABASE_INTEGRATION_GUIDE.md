# 🚗 Fleet Database Integration Guide

## Overview
This guide shows how to integrate your Fleet Master Excel spreadsheet into the Go BARRY Breakdown Guide app using a JSON database approach.

## 🎯 Benefits
- **Fast lookups** - Instant vehicle information retrieval
- **Auto-population** - Automatically fills registration when fleet number is entered
- **Validation** - Ensures only valid fleet numbers are used
- **Offline capability** - Works without internet connection
- **Easy updates** - Simple JSON file to maintain

## 📁 File Structure
```
/backend/data/
  └── fleet-database.json    # Your fleet data in JSON format

/backend/routes/
  └── fleetDatabaseAPI.js    # API endpoint for fleet data

/public/breakdown-guide/services/
  └── fleetDatabase.js       # Frontend service for fleet lookups
```

## 🔧 Step 1: Convert Your Excel to JSON

### Option A: Manual Entry
Edit `/backend/data/fleet-database.json` directly:

```json
{
  "5301": {
    "fleetNumber": "5301",
    "registration": "NX70ABC",
    "busType": "Wright Streetlite",
    "depot": "Washington",
    "capacity": 44,
    "yearOfManufacture": 2020
  },
  "5302": {
    "fleetNumber": "5302",
    "registration": "NX70DEF",
    "busType": "Wright Streetlite",
    "depot": "Washington",
    "capacity": 44,
    "yearOfManufacture": 2020
  }
}
```

### Option B: Use Conversion Script
1. Install xlsx package:
   ```bash
   cd "/Users/anthony/Go BARRY App"
   npm install xlsx
   ```

2. Run conversion:
   ```bash
   node convert-fleet-excel.mjs /path/to/your/fleet-master.xlsx
   ```

## 🔌 Step 2: Add to Backend

In `/backend/index.js`, add this route registration:

```javascript
// Add after other route registrations
await routeManager.registerRoute(app, '/api/fleet-database', './routes/fleetDatabaseAPI.js', 'Fleet Database API');
```

## 🖥️ Step 3: Add to Frontend

In `/public/breakdown-guide/index.html`, add after the breakdownLogger script:

```html
<!-- Load fleet database service -->
<script>
    // Fleet Database Service
    (function() {
        'use strict';
        
        class FleetDatabaseService {
            constructor() {
                this.fleetData = null;
                this.loadFleetDatabase();
            }
            
            async loadFleetDatabase() {
                try {
                    const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
                    const response = await fetch(`${apiBase}/api/fleet-database`);
                    const result = await response.json();
                    if (result.success) {
                        this.fleetData = result.data;
                        console.log('✅ Fleet database loaded:', Object.keys(this.fleetData).length, 'vehicles');
                    }
                } catch (error) {
                    console.error('❌ Failed to load fleet database:', error);
                    this.fleetData = {};
                }
            }
            
            getByFleetNumber(fleetNumber) {
                return this.fleetData[fleetNumber] || null;
            }
            
            formatVehicleInfo(fleetNumber) {
                const vehicle = this.getByFleetNumber(fleetNumber);
                if (!vehicle) return null;
                return `Fleet ${vehicle.fleetNumber} - ${vehicle.registration} (${vehicle.busType})`;
            }
        }
        
        window.fleetDatabase = new FleetDatabaseService();
    })();
</script>
```

## 📝 Step 4: Use in BreakdownInfoStep

Update `/public/breakdown-guide/components/common/BreakdownInfoStep.js`:

```javascript
// In the fleet number input's onChange handler
onChange={(e) => {
    const fleetNo = e.target.value;
    updateBreakdownInfo({ fleetNo });
    
    // Auto-populate registration if fleet number is valid
    if (window.fleetDatabase) {
        const vehicle = window.fleetDatabase.getByFleetNumber(fleetNo);
        if (vehicle) {
            updateBreakdownInfo({ 
                fleetNo: vehicle.fleetNumber,
                vehicleReg: vehicle.registration 
            });
            console.log('✅ Auto-populated:', vehicle);
        }
    }
}}
```

## 🧪 Testing

1. **Check if fleet database loads:**
   ```javascript
   // In browser console
   window.fleetDatabase.getByFleetNumber('5301')
   ```

2. **Test auto-population:**
   - Enter a fleet number in the Breakdown Guide
   - Registration should auto-fill

3. **Test API directly:**
   ```
   http://localhost:3001/api/fleet-database
   http://localhost:3001/api/fleet-database/5301
   http://localhost:3001/api/fleet-database/search/wright
   ```

## 📊 Fleet Data Format

Your Excel columns should map to:
- `Fleet Number` → fleetNumber
- `Registration` → registration  
- `Bus Type` → busType
- `Depot` → depot (auto-detected from fleet number)
- `Capacity` → capacity
- `Year` → yearOfManufacture

## 🔄 Updating Fleet Data

### Option 1: Manual Update
1. Edit `/backend/data/fleet-database.json`
2. Restart backend server

### Option 2: API Update
```javascript
fetch('http://localhost:3001/api/fleet-database/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fleetData: updatedFleetData })
})
```

## 🎯 Next Steps

1. **Add to all wizards** - Include vehicle info display
2. **Add validation** - Prevent invalid fleet numbers
3. **Add search** - Allow searching by registration
4. **Add admin UI** - Web interface for fleet updates

## 📈 Example Integration

When a supervisor enters fleet number "5301":
1. System looks up in fleet database
2. Finds: `{ registration: "NX70ABC", busType: "Wright Streetlite", depot: "Washington" }`
3. Auto-fills registration field
4. Shows: "Fleet 5301 - NX70ABC (Wright Streetlite)"
5. When breakdown is logged, includes all vehicle details

This creates a seamless experience where supervisors only need to enter the fleet number!
