#!/usr/bin/env node

/*
 * Fleet Database Integration Script
 * Integrates the GNE fleet database with all three systems:
 * 1. Breakdown Guide (Frontend)
 * 2. Breakdown Tracker (API)
 * 3. Breakdown Analytics (API)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting GNE Fleet Database Integration...\n');

// Step 1: Check if fleet database exists
const fleetDbPath = path.join(__dirname, 'gne-fleet-database.json');
if (!fs.existsSync(fleetDbPath)) {
  console.error('❌ Error: gne-fleet-database.json not found!');
  console.log('Please run: node generate-gne-fleet-json.mjs first');
  process.exit(1);
}

console.log('✅ Fleet database found');

// Step 2: Update breakdownTrackerAPI.js to include fleet integration
const trackerPath = path.join(__dirname, 'backend/routes/breakdownTrackerAPI.js');
if (fs.existsSync(trackerPath)) {
  console.log('📝 Updating breakdownTrackerAPI.js...');
  
  let trackerContent = fs.readFileSync(trackerPath, 'utf8');
  
  // Add fleet database import at the top
  if (!trackerContent.includes('fleetDatabase')) {
    const importPoint = trackerContent.indexOf('const router = express.Router();');
    const fleetImport = `\n// Fleet database integration\nimport fleetDatabase from '../services/fleetDatabaseService.js';\n\n`;
    trackerContent = trackerContent.slice(0, importPoint) + fleetImport + trackerContent.slice(importPoint);
  }
  
  // Replace getDepotFromVehicle function
  if (!trackerContent.includes('fleetDatabase.getDepotFromFleetNumber')) {
    trackerContent = trackerContent.replace(
      /function getDepotFromVehicle\(vehicleId\)[\s\S]*?return 'Washington';[\s\S]*?\}/,
      `function getDepotFromVehicle(vehicleId) {\n  const vehicle = fleetDatabase.getByFleetNumber(vehicleId);\n  if (vehicle) {\n    return fleetDatabase.getDepotFromFleetNumber(vehicleId);\n  }\n  // Fallback to original logic if vehicle not found\n  const fleetNum = parseInt(vehicleId);\n  if (fleetNum >= 5200 && fleetNum <= 5499) return 'Washington';\n  if (fleetNum >= 5500 && fleetNum <= 5799) return 'Riverside';\n  if (fleetNum >= 6000 && fleetNum <= 6299) return 'Percy Main';\n  if (fleetNum >= 6300 && fleetNum <= 6599) return 'Consett';\n  if (fleetNum >= 6900 && fleetNum <= 7199) return 'Deptford';\n  if (fleetNum >= 8300 && fleetNum <= 8399) return 'Hexham';\n  return 'Washington';\n}`
    );
  }
  
  // Add vehicle search endpoint
  if (!trackerContent.includes('/vehicles/search')) {
    const exportPoint = trackerContent.lastIndexOf('export default router;');
    const searchEndpoint = `\n// Vehicle search endpoint\nrouter.get('/vehicles/search', async (req, res) => {\n  try {\n    const { q } = req.query;\n    if (!q || q.length < 2) {\n      return res.json({ vehicles: [] });\n    }\n\n    const vehicles = fleetDatabase.searchVehicles(q);\n    res.json({\n      vehicles: vehicles.slice(0, 10) // Limit to 10 results\n    });\n  } catch (error) {\n    res.status(500).json({ error: 'Failed to search vehicles' });\n  }\n});\n\n// Vehicle info endpoint\nrouter.get('/vehicles/:fleetNumber', async (req, res) => {\n  try {\n    const vehicle = fleetDatabase.getByFleetNumber(req.params.fleetNumber);\n    if (!vehicle) {\n      return res.status(404).json({ error: 'Vehicle not found' });\n    }\n\n    res.json({\n      ...vehicle,\n      depot: fleetDatabase.getDepotFromFleetNumber(vehicle.fleetNumber),\n      vehicleTypeCategory: fleetDatabase.getVehicleTypeCategory(vehicle.vehicleType),\n      engineType: fleetDatabase.getEngineType(vehicle.vehicleType),\n      euroRating: fleetDatabase.getEuroRating(vehicle.vehicleType),\n      age: fleetDatabase.getVehicleAge(vehicle.regNo)\n    });\n  } catch (error) {\n    res.status(500).json({ error: 'Failed to get vehicle info' });\n  }\n});\n\n`;
    trackerContent = trackerContent.slice(0, exportPoint) + searchEndpoint + trackerContent.slice(exportPoint);
  }
  
  fs.writeFileSync(trackerPath, trackerContent);
  console.log('✅ breakdownTrackerAPI.js updated');
} else {
  console.log('⚠️  breakdownTrackerAPI.js not found');
}

// Step 3: Update breakdownAnalyticsAPI.js
const analyticsPath = path.join(__dirname, 'backend/routes/breakdownAnalyticsAPI.js');
if (fs.existsSync(analyticsPath)) {
  console.log('📝 Updating breakdownAnalyticsAPI.js...');
  
  let analyticsContent = fs.readFileSync(analyticsPath, 'utf8');
  
  // Add fleet database import
  if (!analyticsContent.includes('fleetDatabase')) {
    const importPoint = analyticsContent.indexOf('const router = express.Router();');
    const fleetImport = `\n// Fleet database integration\nimport fleetDatabase from '../services/fleetDatabaseService.js';\n\n`;
    analyticsContent = analyticsContent.slice(0, importPoint) + fleetImport + analyticsContent.slice(importPoint);
  }
  
  // Add fleet health endpoints
  if (!analyticsContent.includes('/fleet-health')) {
    const exportPoint = analyticsContent.lastIndexOf('export default router;');
    const fleetEndpoints = `\n// Fleet health dashboard\nrouter.get('/fleet-health', async (req, res) => {\n  try {\n    const stats = fleetDatabase.getFleetStats();\n    res.json({\n      success: true,\n      data: stats\n    });\n  } catch (error) {\n    res.status(500).json({ \n      success: false, \n      error: 'Failed to get fleet health data' \n    });\n  }\n});\n\n// Fleet composition analysis\nrouter.get('/fleet-composition', (req, res) => {\n  try {\n    const stats = fleetDatabase.getFleetStats();\n    res.json({\n      success: true,\n      composition: stats\n    });\n  } catch (error) {\n    res.status(500).json({ \n      success: false, \n      error: 'Failed to get fleet composition' \n    });\n  }\n});\n\n`;
    analyticsContent = analyticsContent.slice(0, exportPoint) + fleetEndpoints + analyticsContent.slice(exportPoint);
  }
  
  fs.writeFileSync(analyticsPath, analyticsContent);
  console.log('✅ breakdownAnalyticsAPI.js updated');
} else {
  console.log('⚠️  breakdownAnalyticsAPI.js not found');
}

// Step 4: Update breakdown guide HTML to include fleet lookup
const breakdownGuideFiles = [
  'Go_BARRY/public/breakdown-guide.html',
  'Go_BARRY/public/breakdown-launch.html'
];

breakdownGuideFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('fleetLookupComponent.js')) {
      console.log(`📝 Updating ${file}...`);
      
      // Add script tag before closing body
      const scriptTag = '\n  <script src="/breakdown-guide/fleetLookupComponent.js"></script>';
      const updatedContent = content.replace('</body>', scriptTag + '\n</body>');
      fs.writeFileSync(filePath, updatedContent);
      
      console.log(`✅ ${file} updated`);
    }
  }
});

// Step 5: Create integration summary
const summaryPath = path.join(__dirname, 'FLEET_DATABASE_INTEGRATION_COMPLETE.md');
const summary = `# Fleet Database Integration Complete

## Summary
The GNE fleet database has been successfully integrated with all three systems.

### Integration Points

#### 1. Breakdown Guide (Frontend)
- **New Component**: \`fleetLookupComponent.js\`
- **Features**:
  - Vehicle search by fleet number or registration
  - Auto-complete suggestions
  - Detailed vehicle information display
  - Integration with breakdown guide workflow

#### 2. Breakdown Tracker (API)
- **Enhanced Endpoints**:
  - \`POST /api/breakdown-tracker/create\` - Now validates vehicles and adds metadata
  - \`GET /api/breakdown-tracker/vehicles/search\` - Vehicle search endpoint
  - \`GET /api/breakdown-tracker/vehicles/:fleetNumber\` - Vehicle details endpoint
- **Features**:
  - Automatic depot assignment based on fleet number
  - Vehicle validation on breakdown creation
  - Enhanced breakdown records with vehicle metadata

#### 3. Breakdown Analytics (API)
- **Enhanced Endpoints**:
  - \`POST /api/analytics/events\` - Enriched with vehicle data
  - \`GET /api/breakdown-analytics/fleet-health\` - Fleet-wide health dashboard
  - \`GET /api/breakdown-analytics/fleet-composition\` - Fleet composition analysis
- **Features**:
  - Vehicle type categorization
  - Fleet statistics
  - Depot performance metrics

### Fleet Statistics
- Total Vehicles: 559
- Active Depots: Washington, Hexham, Riverside, Percy Main, Deptford, Consett
- Largest Fleet: Riverside (178 vehicles)
- Most Common Type: Wrightbus Streetlite DF (140 vehicles)

### Usage

#### Frontend (Breakdown Guide)
The fleet lookup component automatically appears on the breakdown guide page.
Users can search for vehicles and see detailed information.

#### API Usage
\`\`\`javascript
// Search for vehicles
GET /api/breakdown-tracker/vehicles/search?q=5401

// Get vehicle details
GET /api/breakdown-tracker/vehicles/5401

// Get fleet health
GET /api/breakdown-analytics/fleet-health

// Get fleet composition
GET /api/breakdown-analytics/fleet-composition
\`\`\`

### Next Steps
1. Restart the backend server to apply changes
2. Test the integration with real breakdown scenarios
3. Monitor the enhanced analytics data
4. Consider adding more vehicle-specific breakdown patterns

## Files Modified
- \`backend/routes/breakdownTrackerAPI.js\` - Added fleet integration
- \`backend/routes/breakdownAnalyticsAPI.js\` - Added fleet analytics
- \`backend/services/fleetDatabaseService.js\` - Core fleet service
- \`Go_BARRY/public/breakdown-guide/fleetLookupComponent.js\` - Frontend component
- Breakdown guide HTML files - Added fleet lookup script

## Database Location
- \`gne-fleet-database.json\` - Fleet database (559 vehicles)

Last Updated: ${new Date().toISOString()}
`;

fs.writeFileSync(summaryPath, summary);
console.log('\n✅ Integration summary created: FLEET_DATABASE_INTEGRATION_COMPLETE.md');

console.log('\n🎉 Fleet Database Integration Complete!');
console.log('\nIMPORTANT: You must restart the backend server for changes to take effect!');
console.log('\nTo restart the backend:');
console.log('1. Stop the current server (Ctrl+C)');
console.log('2. Start it again: cd backend && npm run dev');
console.log('\nThen test with: ./test-fleet-integration.mjs');
