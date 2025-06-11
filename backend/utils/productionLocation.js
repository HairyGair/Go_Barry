// utils/productionLocation.js
// Production-optimized location processing to avoid timeouts

import axios from 'axios';

const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;

// Quick coordinate-to-area mapping for production (no external API calls)
function getQuickLocation(lat, lng) {
  // Newcastle area
  if (lat >= 54.9 && lat <= 55.1 && lng >= -1.8 && lng <= -1.4) {
    // More specific Newcastle areas
    if (lat >= 54.95 && lng <= -1.65) return "Westerhope, Newcastle upon Tyne";
    if (lat >= 54.95 && lng >= -1.65) return "Lemington, Newcastle upon Tyne";
    if (lat <= 54.95 && lng <= -1.65) return "Newcastle upon Tyne";
    return "Newcastle upon Tyne";
  }
  
  // Gateshead area  
  if (lat >= 54.8 && lat <= 54.98 && lng >= -1.8 && lng <= -1.6) {
    // More specific Gateshead areas
    if (lng <= -1.75) return "High Spen, Gateshead";
    if (lng >= -1.72) return "Stella, Gateshead";
    return "Gateshead";
  }
  
  // County Durham area
  if (lat >= 54.7 && lat <= 54.9 && lng >= -1.8 && lng <= -1.4) {
    if (lng <= -1.7) return "Stanley, County Durham";
    if (lng >= -1.7) return "Durham, County Durham";  
    return "County Durham";
  }
  
  // Sunderland area
  if (lat >= 54.85 && lat <= 54.95 && lng >= -1.4 && lng <= -1.2) {
    return "Sunderland";
  }
  
  // Default North East
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

export default {
  getEnhancedLocationWithFallbacks,
  getLocationNameWithTimeout,
  getLocationName,
  getRegionFromCoordinates,
  getCoordinateDescription
};
