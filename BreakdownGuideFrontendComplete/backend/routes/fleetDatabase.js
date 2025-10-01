/*
 * Fleet Database Routes
 * Vehicle information lookup and management
 */

import express from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load fleet data
let fleetData = {};
try {
  const dataPath = path.join(__dirname, '../../gne-fleet-database.json');
  const rawData = readFileSync(dataPath, 'utf8');
  const jsonData = JSON.parse(rawData);
  
  // Transform to indexed format
  if (jsonData.fleet && Array.isArray(jsonData.fleet)) {
    jsonData.fleet.forEach(vehicle => {
      fleetData[vehicle.fleetNumber] = {
        fleetNumber: vehicle.fleetNumber,
        registration: vehicle.regNo || 'Unknown',
        vehicleType: vehicle.vehicleType,
        depot: vehicle.depot,
        busType: extractBusType(vehicle.vehicleType || '')
      };
    });
  }
  console.log(`✅ Fleet database loaded: ${Object.keys(fleetData).length} vehicles`);
} catch (error) {
  console.error('❌ Failed to load fleet database:', error);
  // Continue with empty database
}

function extractBusType(vehicleTypeStr) {
  if (!vehicleTypeStr) return 'Unknown';
  
  const lower = vehicleTypeStr.toLowerCase();
  if (lower.includes('solo')) return 'Solo';
  if (lower.includes('streetlite')) return 'Streetlite';
  if (lower.includes('streetdeck')) return 'Streetdeck';
  if (lower.includes('enviro 400')) return 'Enviro 400';
  if (lower.includes('versa')) return 'Versa';
  if (lower.includes('b9tl')) return 'Volvo B9TL';
  
  return vehicleTypeStr.split(' ').slice(0, 2).join(' ');
}

// Search vehicles
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query required'
      });
    }
    
    const searchTerm = q.toString().toLowerCase();
    const results = Object.values(fleetData).filter(vehicle =>
      vehicle.fleetNumber.toString().includes(searchTerm) ||
      vehicle.registration.toLowerCase().includes(searchTerm) ||
      (vehicle.busType && vehicle.busType.toLowerCase().includes(searchTerm)) ||
      (vehicle.depot && vehicle.depot.toLowerCase().includes(searchTerm))
    );
    
    // Limit results
    const limitedResults = results.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      vehicles: limitedResults,
      count: limitedResults.length,
      total: results.length
    });
  } catch (error) {
    console.error('Error searching vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search vehicles'
    });
  }
});

// Get vehicle by fleet number
router.get('/vehicle/:number', async (req, res) => {
  try {
    const { number } = req.params;
    const vehicle = fleetData[number];
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }
    
    res.json({
      success: true,
      vehicle
    });
  } catch (error) {
    console.error('Error getting vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get vehicle'
    });
  }
});

// Get vehicles by depot
router.get('/depot/:depot', async (req, res) => {
  try {
    const { depot } = req.params;
    const { limit = 100 } = req.query;
    
    const vehicles = Object.values(fleetData)
      .filter(v => v.depot && v.depot.toLowerCase() === depot.toLowerCase())
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      depot,
      vehicles,
      count: vehicles.length
    });
  } catch (error) {
    console.error('Error getting depot vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get depot vehicles'
    });
  }
});

// Get all vehicles
router.get('/all', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const allVehicles = Object.values(fleetData);
    const vehicles = allVehicles.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );
    
    res.json({
      success: true,
      vehicles,
      total: allVehicles.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error getting all vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get vehicles'
    });
  }
});

// Get fleet statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      total: Object.keys(fleetData).length,
      byDepot: {},
      byType: {}
    };
    
    Object.values(fleetData).forEach(vehicle => {
      // Count by depot
      if (vehicle.depot) {
        if (!stats.byDepot[vehicle.depot]) {
          stats.byDepot[vehicle.depot] = 0;
        }
        stats.byDepot[vehicle.depot]++;
      }
      
      // Count by type
      if (vehicle.busType) {
        if (!stats.byType[vehicle.busType]) {
          stats.byType[vehicle.busType] = 0;
        }
        stats.byType[vehicle.busType]++;
      }
    });
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting fleet stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get fleet statistics'
    });
  }
});

export default router;
