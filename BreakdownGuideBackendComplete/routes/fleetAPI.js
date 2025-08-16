// Fleet Database API
import { Router } from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// Get fleet database
router.get('/', (req, res) => {
  try {
    const fleetDatabasePath = path.join(__dirname, '..', 'data', 'fleet-database.json');
    const fleetData = JSON.parse(readFileSync(fleetDatabasePath, 'utf8'));
    
    res.json({
      success: true,
      data: fleetData,
      count: Object.keys(fleetData).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Fleet database error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load fleet database',
      details: error.message
    });
  }
});

// Get specific fleet vehicle
router.get('/:fleetNumber', (req, res) => {
  try {
    const { fleetNumber } = req.params;
    const fleetDatabasePath = path.join(__dirname, '..', 'data', 'fleet-database.json');
    const fleetData = JSON.parse(readFileSync(fleetDatabasePath, 'utf8'));
    
    const vehicle = fleetData[fleetNumber];
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: `Fleet number ${fleetNumber} not found`
      });
    }
    
    res.json({
      success: true,
      data: vehicle,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Fleet lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lookup fleet vehicle',
      details: error.message
    });
  }
});

export default router;