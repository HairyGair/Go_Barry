/**
 * Data Enhancement Patch for SDC Dashboard
 * Normalizes and enhances breakdown data from various sources
 */

let googleApiKeyWarningShown = false;

// Enhanced breakdown data processing with fleet database integration
export const enhanceBreakdownDataInline = async (breakdown) => {
  if (!breakdown) return breakdown;

  console.log('🔧 Enhancing breakdown data:', breakdown.breakdown_id, breakdown);

  // Get Google Maps API key
  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  if (!googleApiKey && !googleApiKeyWarningShown) {
    console.warn('Google Maps API key not found in environment variables');
    googleApiKeyWarningShown = true;
  }

  // Extract fleet number from various possible fields
  const fleetNumber = breakdown.fleet_no || 
                     breakdown.fleet_number || 
                     breakdown.fleetNumber ||
                     breakdown.vehicle?.fleetNumber ||
                     breakdown.vehicle?.fleet_number ||
                     null;

  // Try to get vehicle data from fleet database if we have a fleet number
  let enhancedVehicleData = null;
  if (fleetNumber) {
    try {
      console.log('🔍 Looking up fleet number in database:', fleetNumber);
      enhancedVehicleData = await lookupFleetData(fleetNumber);
      console.log('📊 Fleet database result:', enhancedVehicleData);
    } catch (error) {
      console.warn('⚠️ Fleet database lookup failed:', error);
    }
  }

  // Enhance location data with geocoding if needed
  let enhancedLocation = breakdown.location;
  const coordinates = breakdown.coordinates || 
                     breakdown.location_coords ||
                     breakdown.coords ||
                     (breakdown.latitude && breakdown.longitude ? 
                      `${breakdown.latitude}, ${breakdown.longitude}` : null);

  // If we have coordinates but no readable location, try to geocode
  if (coordinates && !enhancedLocation && googleApiKey) {
    try {
      enhancedLocation = await reverseGeocode(coordinates, googleApiKey);
    } catch (error) {
      console.warn('⚠️ Geocoding failed:', error);
      enhancedLocation = coordinates; // Fallback to coordinates
    }
  }

  // Build enhanced breakdown object
  const enhancedBreakdown = {
    ...breakdown, // Keep all original fields
    
    // Normalize fleet number fields
    fleet_no: fleetNumber || 'Unknown',
    fleet_number: fleetNumber || 'Unknown',
    fleetNumber: fleetNumber || 'Unknown',
    
    // Enhanced vehicle data from fleet database
    ...(enhancedVehicleData && {
      vehicle_type: enhancedVehicleData.vehicleType,
      vehicleType: enhancedVehicleData.vehicleType,
      depot: enhancedVehicleData.depot,
      depot_id: enhancedVehicleData.depot,
      depot_name: enhancedVehicleData.depot,
      registration: enhancedVehicleData.regNo,
      regNo: enhancedVehicleData.regNo,
      
      // Enhanced vehicle object
      vehicle: {
        ...breakdown.vehicle,
        fleetNumber: fleetNumber,
        fleet_number: fleetNumber,
        vehicleType: enhancedVehicleData.vehicleType,
        type: enhancedVehicleData.vehicleType,
        depot: enhancedVehicleData.depot,
        registration: enhancedVehicleData.regNo,
        regNo: enhancedVehicleData.regNo
      }
    }),

    // Enhanced location
    location: enhancedLocation || breakdown.location || 'Unknown Location',
    
    // Normalize other common fields
    issue_type: breakdown.issue_type || 
               breakdown.wizard_type?.replace('Wizard', '').trim() || 
               'General',
    
    severity: breakdown.severity || 
             breakdown.wizard_decision || 
             breakdown.decision || 
             'PENDING',

    supervisor_name: breakdown.supervisor_name || 
                    breakdown.supervisor?.name || 
                    'Unknown Supervisor',

    supervisor_badge: breakdown.supervisor_badge || 
                     breakdown.supervisor?.badge || 
                     breakdown.supervisor?.supervisorId || 
                     '',

    // Ensure timestamps are properly formatted
    created_at: breakdown.created_at || new Date().toISOString(),
    
    // Add enhancement metadata
    enhanced: true,
    enhanced_at: new Date().toISOString(),
    enhancement_source: 'dataEnhancementPatch'
  };

  console.log('✅ Enhanced breakdown data:', enhancedBreakdown.breakdown_id, {
    fleet_no: enhancedBreakdown.fleet_no,
    depot: enhancedBreakdown.depot,
    vehicle_type: enhancedBreakdown.vehicle_type,
    location: enhancedBreakdown.location
  });

  return enhancedBreakdown;
};

// Fleet database lookup function
let fleetDataCache = null;
const lookupFleetData = async (fleetNumber) => {
  // Load fleet database if not cached
  if (!fleetDataCache) {
    try {
      const response = await fetch('/gne-fleet-database.json');
      if (response.ok) {
        fleetDataCache = await response.json();
        console.log('📚 Fleet database loaded:', fleetDataCache.totalVehicles, 'vehicles');
      } else {
        throw new Error('Failed to load fleet database');
      }
    } catch (error) {
      console.error('❌ Fleet database load error:', error);
      return null;
    }
  }

  // Find vehicle in database
  const vehicle = fleetDataCache.fleet?.find(v => 
    v.fleetNumber === fleetNumber || 
    v.fleetNumber === fleetNumber.toString()
  );

  if (vehicle) {
    console.log('✅ Found vehicle in database:', vehicle);
    return vehicle;
  } else {
    console.warn('⚠️ Vehicle not found in database:', fleetNumber);
    return null;
  }
};

// Reverse geocoding function
const reverseGeocode = async (coordinates, apiKey) => {
  // Parse coordinates
  const coordMatch = coordinates.match(/(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)/);
  if (!coordMatch) {
    throw new Error('Invalid coordinates format');
  }

  const [, lat, lng] = coordMatch;
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
    }
    
    throw new Error('No geocoding results');
  } catch (error) {
    console.warn('Geocoding failed:', error);
    return coordinates; // Fallback to coordinates
  }
};

export default enhanceBreakdownDataInline;