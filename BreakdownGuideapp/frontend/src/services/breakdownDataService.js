// Enhanced data service for better breakdown data integration
// This service ensures proper data flow from assessments to dashboard

import { apiConfig } from '../../breakdown-guide/components/common/constants';

// Google Maps Geocoding (free up to 40,000 requests/month with billing enabled, or 2,500/day without)
const GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Depot mapping based on location/fleet ranges
const DEPOT_MAPPINGS = {
  'Washington': {
    fleetRanges: [[5400, 5499], [6200, 6299]],
    postcodes: ['NE37', 'NE38', 'DH4', 'DH5'],
    areas: ['Washington', 'Sunderland', 'Houghton']
  },
  'Riverside': {
    fleetRanges: [[5500, 5599], [6300, 6399]],
    postcodes: ['NE1', 'NE2', 'NE3', 'NE4', 'NE5', 'NE6', 'NE7'],
    areas: ['Newcastle', 'Gateshead', 'Byker']
  },
  'Percy Main': {
    fleetRanges: [[5600, 5699], [6400, 6499]],
    postcodes: ['NE28', 'NE29', 'NE30', 'NE33', 'NE34'],
    areas: ['North Shields', 'South Shields', 'Whitley Bay']
  },
  'Deptford': {
    fleetRanges: [[5700, 5799], [6500, 6599]],
    postcodes: ['SR1', 'SR2', 'SR3', 'SR4', 'SR5', 'SR6'],
    areas: ['Sunderland', 'Deptford', 'Roker']
  },
  'Chester-le-Street': {
    fleetRanges: [[5800, 5899], [6600, 6699]],
    postcodes: ['DH1', 'DH2', 'DH3', 'DH6', 'DH7', 'DH8', 'DH9'],
    areas: ['Chester-le-Street', 'Durham', 'Stanley']
  },
  'Consett': {
    fleetRanges: [[5900, 5999], [6700, 6799]],
    postcodes: ['DH8', 'DH9', 'NE16', 'NE17'],
    areas: ['Consett', 'Stanley', 'Lanchester']
  }
};

// Priority routes for Go North East
const PRIORITY_ROUTES = {
  'X10': { priority: 'high', description: 'Newcastle - Middlesbrough Express' },
  'X21': { priority: 'high', description: 'Newcastle - Durham Express' },
  '21': { priority: 'high', description: 'Newcastle - Durham - Bishop Auckland' },
  '56': { priority: 'high', description: 'Newcastle - Sunderland' },
  '1': { priority: 'high', description: 'Newcastle - Whitley Bay' },
  '309': { priority: 'medium', description: 'Newcastle - Blyth' },
  '310': { priority: 'medium', description: 'Newcastle - North Shields' },
  'Q3': { priority: 'medium', description: 'Great Park - St Peters' }
};

class BreakdownDataService {
  constructor() {
    this.geocodeCache = new Map();
    this.fleetDataCache = new Map();
  }

  // Determine depot from fleet number
  determineDepot(fleetNumber) {
    if (!fleetNumber || fleetNumber === 'Unknown') return 'Unknown';
    
    const fleetNum = parseInt(fleetNumber);
    if (isNaN(fleetNum)) return 'Unknown';

    for (const [depot, config] of Object.entries(DEPOT_MAPPINGS)) {
      for (const [min, max] of config.fleetRanges) {
        if (fleetNum >= min && fleetNum <= max) {
          return depot;
        }
      }
    }

    return 'Unknown';
  }

  // Determine depot from location/postcode
  determineDepotFromLocation(location) {
    if (!location || typeof location !== 'string') return null;

    const locationUpper = location.toUpperCase();
    
    for (const [depot, config] of Object.entries(DEPOT_MAPPINGS)) {
      // Check postcodes
      for (const postcode of config.postcodes) {
        if (locationUpper.includes(postcode)) {
          return depot;
        }
      }
      
      // Check area names
      for (const area of config.areas) {
        if (locationUpper.includes(area.toUpperCase())) {
          return depot;
        }
      }
    }

    return null;
  }

  // Geocode coordinates to human-readable address using Google Maps
  async geocodeCoordinates(lat, lng) {
    const cacheKey = `${lat},${lng}`;
    
    // Check cache first
    if (this.geocodeCache.has(cacheKey)) {
      return this.geocodeCache.get(cacheKey);
    }

    try {
      // If no Google Maps API key, use fallback
      if (!GOOGLE_MAPS_API_KEY) {
        return this.geocodeWithFallback(lat, lng);
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          
          // Extract useful components
          const components = result.address_components;
          let street = '';
          let area = '';
          let postcode = '';

          for (const component of components) {
            if (component.types.includes('route')) {
              street = component.long_name;
            }
            if (component.types.includes('locality')) {
              area = component.long_name;
            }
            if (component.types.includes('postal_code')) {
              postcode = component.long_name;
            }
          }

          const formattedAddress = result.formatted_address.split(',')[0] + ', ' + area;
          
          const locationData = {
            formatted: formattedAddress,
            street,
            area,
            postcode,
            full: result.formatted_address
          };

          this.geocodeCache.set(cacheKey, locationData);
          return locationData;
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }

    // Fallback to basic geocoding
    return this.geocodeWithFallback(lat, lng);
  }

  // Free fallback geocoding using OpenStreetMap Nominatim
  async geocodeWithFallback(lat, lng) {
    const cacheKey = `osm-${lat},${lng}`;
    
    if (this.geocodeCache.has(cacheKey)) {
      return this.geocodeCache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Go-North-East-Breakdown-System/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        const locationData = {
          formatted: data.display_name?.split(',').slice(0, 2).join(', ') || 'Unknown Location',
          street: data.address?.road || '',
          area: data.address?.city || data.address?.town || data.address?.village || '',
          postcode: data.address?.postcode || '',
          full: data.display_name || 'Unknown Location'
        };

        this.geocodeCache.set(cacheKey, locationData);
        return locationData;
      }
    } catch (error) {
      console.error('OSM geocoding error:', error);
    }

    // Final fallback
    return {
      formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      street: '',
      area: '',
      postcode: '',
      full: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
    };
  }

  // Parse location string that might contain coordinates
  async parseLocation(locationString) {
    if (!locationString) return null;

    // Check if it's coordinates (format: "54.990453, -1.537170" or similar)
    const coordMatch = locationString.match(/^(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      return await this.geocodeCoordinates(lat, lng);
    }

    // Return as-is if it's already a readable location
    return {
      formatted: locationString,
      street: '',
      area: '',
      postcode: '',
      full: locationString
    };
  }

  // Calculate elapsed time properly
  calculateElapsed(createdAt) {
    if (!createdAt) return 0;
    
    const created = new Date(createdAt);
    const now = new Date();
    const elapsedMs = now - created;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    
    return elapsedMinutes;
  }

  // Get route priority
  getRoutePriority(routeId) {
    if (!routeId) return { priority: 'normal', description: 'Standard route' };
    
    const route = PRIORITY_ROUTES[routeId];
    if (route) return route;
    
    // Check if route contains priority route number
    for (const [key, value] of Object.entries(PRIORITY_ROUTES)) {
      if (routeId.includes(key)) {
        return value;
      }
    }
    
    return { priority: 'normal', description: 'Standard route' };
  }

  // Enhance breakdown data with all missing information
  async enhanceBreakdownData(breakdown) {
    const enhanced = { ...breakdown };

    // 1. Handle fleet number properly
    if (!enhanced.fleet_no || enhanced.fleet_no === 'Unknown') {
      enhanced.fleet_no = breakdown.fleet_number || 
                          breakdown.vehicle?.fleetNumber || 
                          breakdown.vehicle?.fleet_number ||
                          'Unknown';
    }

    // 2. Determine depot from fleet number or location
    if (!enhanced.depot_id || enhanced.depot_id === 'Unknown') {
      enhanced.depot_id = this.determineDepot(enhanced.fleet_no);
      
      // If still unknown, try from location
      if (enhanced.depot_id === 'Unknown' && enhanced.location) {
        const depotFromLocation = this.determineDepotFromLocation(enhanced.location);
        if (depotFromLocation) {
          enhanced.depot_id = depotFromLocation;
        }
      }
    }

    // 3. Parse and geocode location
    if (enhanced.location) {
      const locationData = await this.parseLocation(enhanced.location);
      if (locationData) {
        enhanced.location = locationData.formatted;
        enhanced.locationDetails = locationData;
        
        // Try to determine depot from parsed location if still unknown
        if (enhanced.depot_id === 'Unknown') {
          const depotFromParsed = this.determineDepotFromLocation(locationData.full);
          if (depotFromParsed) {
            enhanced.depot_id = depotFromParsed;
          }
        }
      }
    }

    // 4. Fix issue type
    if (!enhanced.issue_type || enhanced.issue_type === 'General') {
      enhanced.issue_type = breakdown.wizard_type?.replace('Wizard', '') ||
                           breakdown.issue_category ||
                           breakdown.assessmentType ||
                           'General';
    }

    // 5. Calculate proper elapsed time
    enhanced.elapsed = this.calculateElapsed(breakdown.created_at);

    // 6. Determine route priority
    if (enhanced.route_id) {
      const routePriority = this.getRoutePriority(enhanced.route_id);
      enhanced.routePriority = routePriority.priority;
      enhanced.routeDescription = routePriority.description;
      enhanced.isPriority = routePriority.priority === 'high';
    }

    // 7. Fix supervisor information
    if (!enhanced.supervisor_name || enhanced.supervisor_name === 'Unknown') {
      enhanced.supervisor_name = breakdown.supervisor?.name ||
                                 breakdown.reported_by ||
                                 breakdown.assessor_name ||
                                 'Unassigned';
    }

    // 8. Determine current stage for timeline
    if (!enhanced.currentStage) {
      if (breakdown.engineer_assigned) {
        enhanced.currentStage = 'engineering';
      } else if (breakdown.decision || breakdown.severity) {
        enhanced.currentStage = 'decision';
      } else if (breakdown.acknowledged_at) {
        enhanced.currentStage = 'acknowledged';
      } else {
        enhanced.currentStage = 'received';
      }
    }

    // 9. Calculate SLA status
    const slaMinutes = enhanced.isPriority ? 30 : 45;
    const warningMinutes = enhanced.isPriority ? 20 : 30;
    
    if (enhanced.elapsed >= slaMinutes) {
      enhanced.slaStatus = 'breached';
    } else if (enhanced.elapsed >= warningMinutes) {
      enhanced.slaStatus = 'warning';
    } else {
      enhanced.slaStatus = 'ok';
    }

    return enhanced;
  }

  // Batch enhance multiple breakdowns
  async enhanceBreakdowns(breakdowns) {
    const enhanced = await Promise.all(
      breakdowns.map(breakdown => this.enhanceBreakdownData(breakdown))
    );
    return enhanced;
  }

  // Store assessment data locally for better integration
  storeAssessmentData(assessmentData) {
    try {
      const key = `assessment_${assessmentData.breakdown_id || Date.now()}`;
      const data = {
        ...assessmentData,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(key, JSON.stringify(data));
      
      // Also store in session for quick access
      sessionStorage.setItem('latest_assessment', JSON.stringify(data));
      
      return true;
    } catch (error) {
      console.error('Error storing assessment data:', error);
      return false;
    }
  }

  // Retrieve assessment data
  getAssessmentData(breakdownId) {
    try {
      const key = `assessment_${breakdownId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving assessment data:', error);
      return null;
    }
  }

  // Get all recent assessments
  getRecentAssessments(limit = 10) {
    const assessments = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('assessment_')) {
          const data = JSON.parse(localStorage.getItem(key));
          if (data) {
            assessments.push(data);
          }
        }
      }
      
      // Sort by timestamp and limit
      assessments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return assessments.slice(0, limit);
      
    } catch (error) {
      console.error('Error getting recent assessments:', error);
      return [];
    }
  }
}

// Create singleton instance
const breakdownDataService = new BreakdownDataService();

export default breakdownDataService;

// Export individual functions for convenience
export {
  breakdownDataService,
  DEPOT_MAPPINGS,
  PRIORITY_ROUTES
};
