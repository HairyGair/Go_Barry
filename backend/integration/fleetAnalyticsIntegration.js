// Fleet Database Integration for Breakdown Analytics
// Enhances analytics with real vehicle and fleet data

import fleetDatabase from '../services/fleetDatabaseService.js';

// Analytics enhancement functions
export const analyticsIntegration = {
  // Enhance breakdown event with fleet data
  enhanceBreakdownEvent(eventData) {
    const vehicle = fleetDatabase.getByFleetNumber(eventData.fleet_number);
    
    if (vehicle) {
      return {
        ...eventData,
        // Vehicle details
        registration: vehicle.regNo,
        vehicle_type: fleetDatabase.getVehicleTypeCategory(vehicle.vehicleType),
        vehicle_full_type: vehicle.vehicleType,
        engine_type: fleetDatabase.getEngineType(vehicle.vehicleType),
        euro_rating: fleetDatabase.getEuroRating(vehicle.vehicleType),
        vehicle_age: fleetDatabase.getVehicleAge(vehicle.regNo),
        
        // Depot info
        depot: eventData.depot || fleetDatabase.getDepotFromFleetNumber(vehicle.fleetNumber),
        
        // Additional metadata for analytics
        vehicle_metadata: {
          manufacturer: vehicle.vehicleType.split(' ')[0],
          model: vehicle.vehicleType.split(' ').slice(1, 3).join(' '),
          capacity: extractCapacity(vehicle.vehicleType)
        }
      };
    }
    
    return eventData;
  },

  // Get fleet-wide breakdown patterns
  async getFleetPatterns(timeframe = '30d') {
    const fleetStats = fleetDatabase.getFleetStats();
    
    return {
      fleet_composition: fleetStats,
      breakdown_prone_types: await this.getBreakdownProneTypes(timeframe),
      age_correlation: await this.getAgeBreakdownCorrelation(timeframe),
      depot_performance: await this.getDepotPerformance(timeframe)
    };
  },

  // Identify vehicle types with high breakdown rates
  async getBreakdownProneTypes(timeframe) {
    // This would query the breakdown_events table
    // For now, return structure
    return {
      high_risk: [],
      medium_risk: [],
      low_risk: []
    };
  },

  // Analyze correlation between vehicle age and breakdowns
  async getAgeBreakdownCorrelation(timeframe) {
    const ageGroups = {
      '0-2 years': { total: 0, breakdowns: 0 },
      '3-5 years': { total: 0, breakdowns: 0 },
      '6-8 years': { total: 0, breakdowns: 0 },
      '9+ years': { total: 0, breakdowns: 0 }
    };

    // Calculate age distribution
    fleetDatabase.fleetData.fleet.forEach(vehicle => {
      const age = fleetDatabase.getVehicleAge(vehicle.regNo);
      if (age !== null) {
        if (age <= 2) ageGroups['0-2 years'].total++;
        else if (age <= 5) ageGroups['3-5 years'].total++;
        else if (age <= 8) ageGroups['6-8 years'].total++;
        else ageGroups['9+ years'].total++;
      }
    });

    return ageGroups;
  },

  // Get depot performance metrics
  async getDepotPerformance(timeframe) {
    const depotStats = {};
    
    fleetDatabase.fleetData.activeDepots.forEach(depot => {
      depotStats[depot] = {
        fleet_size: 0,
        breakdown_count: 0,
        mtbf: 0, // Mean Time Between Failures
        common_issues: []
      };
    });

    // Calculate fleet size per depot
    fleetDatabase.fleetData.fleet.forEach(vehicle => {
      const depot = fleetDatabase.getDepotFromFleetNumber(vehicle.fleetNumber);
      if (depotStats[depot]) {
        depotStats[depot].fleet_size++;
      }
    });

    return depotStats;
  },

  // Generate vehicle health score
  calculateVehicleHealthScore(fleetNumber, breakdownHistory) {
    const vehicle = fleetDatabase.getByFleetNumber(fleetNumber);
    if (!vehicle) return null;

    const age = fleetDatabase.getVehicleAge(vehicle.regNo) || 0;
    const typeReliability = getTypeReliabilityScore(vehicle.vehicleType);
    const breakdownFrequency = breakdownHistory.length;
    const lastBreakdown = breakdownHistory[0]?.reported_date;
    
    // Calculate days since last breakdown
    const daysSinceLastBreakdown = lastBreakdown 
      ? Math.floor((Date.now() - new Date(lastBreakdown).getTime()) / (1000 * 60 * 60 * 24))
      : 365;

    // Score calculation (0-100)
    let score = 100;
    score -= age * 2; // -2 points per year
    score -= breakdownFrequency * 5; // -5 points per breakdown
    score += Math.min(daysSinceLastBreakdown / 10, 20); // Up to +20 for reliability
    score *= typeReliability; // Multiply by type reliability factor

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      factors: {
        age,
        breakdownCount: breakdownFrequency,
        daysSinceLastBreakdown,
        vehicleTypeReliability: typeReliability
      }
    };
  }
};

// Helper functions
function extractCapacity(vehicleType) {
  // Extract passenger capacity from vehicle type string
  const match = vehicleType.match(/(\d+)\s*\d*$/);
  return match ? parseInt(match[1]) : null;
}

function getTypeReliabilityScore(vehicleType) {
  // Based on general reliability of different vehicle types
  const type = vehicleType.toLowerCase();
  
  if (type.includes('enviro 400')) return 0.95;
  if (type.includes('streetdeck')) return 0.93;
  if (type.includes('streetlite')) return 0.90;
  if (type.includes('volvo b9tl')) return 0.92;
  if (type.includes('solo')) return 0.85;
  if (type.includes('versa')) return 0.88;
  
  return 0.90; // Default
}

// Integration patch for existing analytics API
export function patchBreakdownAnalyticsAPI(router) {
  // Find and enhance the events endpoint
  const eventsRoute = router.stack.find(layer => 
    layer.route && layer.route.path === '/events' && layer.route.methods.post
  );

  if (eventsRoute) {
    const originalHandler = eventsRoute.route.stack[0].handle;
    
    // Replace with enhanced handler
    eventsRoute.route.stack[0].handle = async (req, res) => {
      // Enhance the breakdown event data
      req.body = analyticsIntegration.enhanceBreakdownEvent(req.body);
      
      // Call original handler
      return originalHandler(req, res);
    };
  }

  // Add new analytics endpoints
  
  // Fleet health dashboard
  router.get('/fleet-health', async (req, res) => {
    try {
      const { timeframe = '30d' } = req.query;
      const patterns = await analyticsIntegration.getFleetPatterns(timeframe);
      
      res.json({
        success: true,
        data: patterns
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get fleet health data' 
      });
    }
  });

  // Vehicle health score
  router.get('/vehicle-health/:fleetNumber', async (req, res) => {
    try {
      const { fleetNumber } = req.params;
      
      // This would fetch actual breakdown history from database
      const breakdownHistory = []; // Placeholder
      
      const healthScore = analyticsIntegration.calculateVehicleHealthScore(
        fleetNumber, 
        breakdownHistory
      );
      
      if (!healthScore) {
        return res.status(404).json({ 
          success: false, 
          error: 'Vehicle not found' 
        });
      }

      res.json({
        success: true,
        fleetNumber,
        healthScore
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to calculate vehicle health' 
      });
    }
  });

  // Fleet composition analysis
  router.get('/fleet-composition', (req, res) => {
    try {
      const stats = fleetDatabase.getFleetStats();
      
      res.json({
        success: true,
        composition: stats
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get fleet composition' 
      });
    }
  });

  console.log('✅ Fleet database integrated with Breakdown Analytics API');
}
