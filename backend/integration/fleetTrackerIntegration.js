// Fleet Database Integration for Breakdown Tracker
// Updates the breakdownTrackerAPI.js to use real fleet data

import fleetDatabase from '../services/fleetDatabaseService.js';

// Export the integration functions
export const fleetIntegration = {
  // Get depot from vehicle using fleet database
  getDepotFromVehicle(vehicleId) {
    const vehicle = fleetDatabase.getByFleetNumber(vehicleId);
    if (vehicle) {
      return fleetDatabase.getDepotFromFleetNumber(vehicleId);
    }
    // Fallback to original logic if vehicle not found
    return getDepotFromVehicleOriginal(vehicleId);
  },

  // Enhance breakdown record with fleet data
  enhanceBreakdownRecord(breakdownData) {
    const vehicle = fleetDatabase.getByFleetNumber(breakdownData.vehicle_id);
    
    if (vehicle) {
      return {
        ...breakdownData,
        vehicle_reg: vehicle.regNo,
        vehicle_type: fleetDatabase.getVehicleTypeCategory(vehicle.vehicleType),
        vehicle_full_type: vehicle.vehicleType,
        engine_type: fleetDatabase.getEngineType(vehicle.vehicleType),
        euro_rating: fleetDatabase.getEuroRating(vehicle.vehicleType),
        vehicle_age: fleetDatabase.getVehicleAge(vehicle.regNo),
        depot_id: breakdownData.depot_id || fleetDatabase.getDepotFromFleetNumber(vehicle.fleetNumber)
      };
    }
    
    return breakdownData;
  },

  // Validate vehicle exists in fleet
  validateVehicle(vehicleId) {
    const vehicle = fleetDatabase.getByFleetNumber(vehicleId);
    if (!vehicle) {
      return {
        valid: false,
        error: `Vehicle ${vehicleId} not found in fleet database`
      };
    }
    return {
      valid: true,
      vehicle
    };
  },

  // Get vehicle suggestions for autocomplete
  getVehicleSuggestions(query) {
    return fleetDatabase.searchVehicles(query);
  }
};

// Original function for fallback
function getDepotFromVehicleOriginal(vehicleId) {
  const fleetNum = parseInt(vehicleId);
  if (fleetNum >= 5200 && fleetNum <= 5499) return 'Washington';
  if (fleetNum >= 5500 && fleetNum <= 5799) return 'Riverside';
  if (fleetNum >= 6000 && fleetNum <= 6299) return 'Percy Main';
  if (fleetNum >= 6300 && fleetNum <= 6599) return 'Consett';
  if (fleetNum >= 6900 && fleetNum <= 7199) return 'Deptford';
  if (fleetNum >= 8300 && fleetNum <= 8399) return 'Hexham';
  return 'Washington';
}

// Integration patch for existing route
export function patchBreakdownTrackerAPI(router) {
  // Find and replace the create endpoint
  const createRoute = router.stack.find(layer => 
    layer.route && layer.route.path === '/create' && layer.route.methods.post
  );

  if (createRoute) {
    const originalHandler = createRoute.route.stack[0].handle;
    
    // Replace with enhanced handler
    createRoute.route.stack[0].handle = async (req, res) => {
      // Validate vehicle exists
      const validation = fleetIntegration.validateVehicle(req.body.vehicle_id);
      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error,
          suggestion: 'Please check the fleet number and try again'
        });
      }

      // Enhance the breakdown data
      req.body = fleetIntegration.enhanceBreakdownRecord(req.body);
      
      // Call original handler
      return originalHandler(req, res);
    };
  }

  // Add new endpoint for vehicle search
  router.get('/vehicles/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || q.length < 2) {
        return res.json({ vehicles: [] });
      }

      const vehicles = fleetDatabase.searchVehicles(q);
      res.json({
        vehicles: vehicles.slice(0, 10) // Limit to 10 results
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to search vehicles' });
    }
  });

  // Add endpoint for vehicle info
  router.get('/vehicles/:fleetNumber', async (req, res) => {
    try {
      const vehicle = fleetDatabase.getByFleetNumber(req.params.fleetNumber);
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      res.json({
        ...vehicle,
        depot: fleetDatabase.getDepotFromFleetNumber(vehicle.fleetNumber),
        vehicleTypeCategory: fleetDatabase.getVehicleTypeCategory(vehicle.vehicleType),
        engineType: fleetDatabase.getEngineType(vehicle.vehicleType),
        euroRating: fleetDatabase.getEuroRating(vehicle.vehicleType),
        age: fleetDatabase.getVehicleAge(vehicle.regNo)
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get vehicle info' });
    }
  });

  console.log('✅ Fleet database integrated with Breakdown Tracker API');
}
