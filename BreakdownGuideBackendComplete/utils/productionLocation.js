// utils/productionLocation.js
// Production-optimized location processing to avoid timeouts

import axios from 'axios';

const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;

// PRECISE coordinate-to-area mapping with accurate boundaries
function getQuickLocation(lat, lng) {
  // Define precise neighborhood boundaries
  const neighborhoods = [
    // Newcastle neighborhoods - VERY SPECIFIC
    { name: "Westerhope, Newcastle", bounds: { north: 55.002, south: 54.985, east: -1.655, west: -1.695 } },
    { name: "Chapel House, Newcastle", bounds: { north: 54.995, south: 54.980, east: -1.640, west: -1.670 } },
    { name: "Denton, Newcastle", bounds: { north: 54.985, south: 54.970, east: -1.640, west: -1.670 } },
    { name: "Lemington, Newcastle", bounds: { north: 54.982, south: 54.967, east: -1.665, west: -1.690 } },
    { name: "Scotswood, Newcastle", bounds: { north: 54.975, south: 54.965, east: -1.650, west: -1.680 } },
    { name: "Benwell, Newcastle", bounds: { north: 54.975, south: 54.965, east: -1.635, west: -1.665 } },
    { name: "Fenham, Newcastle", bounds: { north: 54.990, south: 54.975, east: -1.620, west: -1.650 } },
    { name: "Gosforth, Newcastle", bounds: { north: 55.010, south: 54.990, east: -1.590, west: -1.630 } },
    { name: "Jesmond, Newcastle", bounds: { north: 54.995, south: 54.975, east: -1.590, west: -1.615 } },
    { name: "Heaton, Newcastle", bounds: { north: 54.990, south: 54.970, east: -1.570, west: -1.600 } },
    { name: "Walker, Newcastle", bounds: { north: 54.975, south: 54.960, east: -1.540, west: -1.570 } },
    { name: "Byker, Newcastle", bounds: { north: 54.975, south: 54.965, east: -1.565, west: -1.585 } },
    { name: "Newcastle City Centre", bounds: { north: 54.978, south: 54.968, east: -1.600, west: -1.620 } },
    { name: "Kingston Park, Newcastle", bounds: { north: 55.015, south: 54.995, east: -1.640, west: -1.680 } },
    { name: "Kenton, Newcastle", bounds: { north: 55.008, south: 54.990, east: -1.630, west: -1.660 } },
    
    // Gateshead neighborhoods
    { name: "Whickham, Gateshead", bounds: { north: 54.960, south: 54.935, east: -1.735, west: -1.775 } },
    { name: "Dunston, Gateshead", bounds: { north: 54.955, south: 54.940, east: -1.650, west: -1.680 } },
    { name: "Teams, Gateshead", bounds: { north: 54.960, south: 54.945, east: -1.640, west: -1.670 } },
    { name: "Bensham, Gateshead", bounds: { north: 54.965, south: 54.950, east: -1.610, west: -1.640 } },
    { name: "Gateshead Town Centre", bounds: { north: 54.965, south: 54.955, east: -1.595, west: -1.615 } },
    { name: "Felling, Gateshead", bounds: { north: 54.955, south: 54.935, east: -1.570, west: -1.600 } },
    { name: "Low Fell, Gateshead", bounds: { north: 54.950, south: 54.930, east: -1.590, west: -1.620 } },
    { name: "Sheriff Hill, Gateshead", bounds: { north: 54.945, south: 54.925, east: -1.580, west: -1.610 } },
    { name: "Birtley, Gateshead", bounds: { north: 54.915, south: 54.885, east: -1.550, west: -1.590 } },
    { name: "Blaydon, Gateshead", bounds: { north: 54.970, south: 54.955, east: -1.700, west: -1.730 } },
    { name: "Ryton, Gateshead", bounds: { north: 54.975, south: 54.960, east: -1.730, west: -1.770 } },
    
    // North Tyneside
    { name: "Wallsend, North Tyneside", bounds: { north: 54.995, south: 54.975, east: -1.510, west: -1.540 } },
    { name: "North Shields, North Tyneside", bounds: { north: 55.020, south: 55.000, east: -1.430, west: -1.460 } },
    { name: "Tynemouth, North Tyneside", bounds: { north: 55.025, south: 55.005, east: -1.415, west: -1.435 } },
    { name: "Whitley Bay, North Tyneside", bounds: { north: 55.050, south: 55.030, east: -1.430, west: -1.455 } },
    { name: "Killingworth, North Tyneside", bounds: { north: 55.035, south: 55.015, east: -1.550, west: -1.580 } },
    { name: "Longbenton, North Tyneside", bounds: { north: 55.010, south: 54.990, east: -1.560, west: -1.590 } },
    
    // South Tyneside
    { name: "South Shields, South Tyneside", bounds: { north: 54.995, south: 54.975, east: -1.425, west: -1.445 } },
    { name: "Jarrow, South Tyneside", bounds: { north: 54.985, south: 54.970, east: -1.470, west: -1.500 } },
    { name: "Hebburn, South Tyneside", bounds: { north: 54.975, south: 54.960, east: -1.500, west: -1.530 } },
    { name: "Boldon, South Tyneside", bounds: { north: 54.955, south: 54.935, east: -1.440, west: -1.470 } },
    
    // Sunderland areas
    { name: "Sunderland City Centre", bounds: { north: 54.915, south: 54.900, east: -1.375, west: -1.390 } },
    { name: "Roker, Sunderland", bounds: { north: 54.925, south: 54.910, east: -1.360, west: -1.375 } },
    { name: "Seaburn, Sunderland", bounds: { north: 54.935, south: 54.920, east: -1.360, west: -1.375 } },
    { name: "Fulwell, Sunderland", bounds: { north: 54.935, south: 54.920, east: -1.375, west: -1.390 } },
    { name: "Southwick, Sunderland", bounds: { north: 54.920, south: 54.905, east: -1.390, west: -1.410 } },
    { name: "Washington, Sunderland", bounds: { north: 54.920, south: 54.880, east: -1.500, west: -1.550 } },
    { name: "Houghton le Spring, Sunderland", bounds: { north: 54.855, south: 54.835, east: -1.450, west: -1.480 } },
    
    // Durham areas
    { name: "Durham City Centre", bounds: { north: 54.785, south: 54.770, east: -1.570, west: -1.585 } },
    { name: "Chester-le-Street, Durham", bounds: { north: 54.865, south: 54.845, east: -1.560, west: -1.580 } },
    { name: "Stanley, Durham", bounds: { north: 54.875, south: 54.855, east: -1.690, west: -1.720 } },
    { name: "Consett, Durham", bounds: { north: 54.865, south: 54.845, east: -1.820, west: -1.850 } },
    
    // Major road corridors (catch-all for main roads)
    { name: "A1 Western Bypass", bounds: { north: 55.040, south: 54.920, east: -1.630, west: -1.650 } },
    { name: "A19 Corridor", bounds: { north: 55.040, south: 54.900, east: -1.550, west: -1.570 } },
    { name: "A167 Durham Road", bounds: { north: 54.970, south: 54.850, east: -1.570, west: -1.590 } },
    { name: "A184 Felling Bypass", bounds: { north: 54.960, south: 54.940, east: -1.550, west: -1.600 } },
    { name: "A1058 Coast Road", bounds: { north: 55.010, south: 54.990, east: -1.440, west: -1.580 } }
  ];
  
  // Check each neighborhood boundary
  for (const area of neighborhoods) {
    if (lat >= area.bounds.south && lat <= area.bounds.north &&
        lng >= area.bounds.west && lng <= area.bounds.east) {
      return area.name;
    }
  }
  
  // Broader regional fallbacks if no specific match
  if (lat >= 54.960 && lat <= 55.050 && lng >= -1.700 && lng <= -1.500) {
    return "Newcastle upon Tyne";
  }
  if (lat >= 54.920 && lat <= 54.970 && lng >= -1.800 && lng <= -1.550) {
    return "Gateshead";
  }
  if (lat >= 54.880 && lat <= 54.940 && lng >= -1.450 && lng <= -1.350) {
    return "Sunderland";
  }
  if (lat >= 54.750 && lat <= 54.880 && lng >= -1.650 && lng <= -1.500) {
    return "County Durham";
  }
  
  // Default
  return "North East England";
}

// Enhanced location processing with production optimization
export async function getEnhancedLocationWithFallbacks(lat, lng, defaultLocation, context) {
  // Production: Use fast coordinate mapping
  if (isProduction) {
    console.log(`🚀 Production mode: Using fast coordinate mapping for ${lat}, ${lng}`);
    const quickLocation = getQuickLocation(lat, lng);
    console.log(`✅ Production location: ${lat}, ${lng} → ${quickLocation}`);
    return quickLocation;
  }
  
  // Development: Full geocoding with timeout
  try {
    console.log(`🗺️ Development mode: Full geocoding for ${lat}, ${lng}...`);
    
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        lat: lat,
        lon: lng,
        format: 'json',
        addressdetails: 1
      },
      timeout: 5000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0'
      }
    });
    
    if (response.data?.display_name) {
      const parts = response.data.display_name.split(',');
      const location = parts.slice(0, 3).join(', ').trim();
      console.log(`✅ OSM Geocoding success: ${lat}, ${lng} → ${location}`);
      return location;
    }
  } catch (error) {
    console.warn(`⚠️ Geocoding failed for ${lat}, ${lng}: ${error.message}`);
  }
  
  // Fallback to quick location
  const fallbackLocation = getQuickLocation(lat, lng);
  console.log(`🔄 Fallback location: ${lat}, ${lng} → ${fallbackLocation}`);
  return fallbackLocation;
}

// Compatibility exports for existing code
export const getLocationNameWithTimeout = getEnhancedLocationWithFallbacks;
export const getLocationName = getEnhancedLocationWithFallbacks;
export const getRegionFromCoordinates = getEnhancedLocationWithFallbacks;
export const getCoordinateDescription = getEnhancedLocationWithFallbacks;

export {
  getQuickLocation
};

export default {
  getEnhancedLocationWithFallbacks,
  getLocationNameWithTimeout,
  getLocationName,
  getRegionFromCoordinates,
  getCoordinateDescription,
  getQuickLocation
};
