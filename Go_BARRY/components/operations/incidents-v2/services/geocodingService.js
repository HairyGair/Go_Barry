/*
 * Go Barry - Geocoding Service with Caching
 * Enhanced location accuracy using Mapbox Geocoding API with local caching
 */

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGFpcnlnYWlyMDAiLCJhIjoiY21iZ29hOHJsMDB4djJtc2I5c2trbXA3dSJ9.1WxDF7rvXOycZyC5EwNS0A';
const MAPBOX_GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

// North East England bounding box
const NORTH_EAST_BBOX = [-3.0, 54.0, -0.5, 56.0]; // [west, south, east, north]

// Simple in-memory cache to reduce API calls
const geocodeCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Common location shortcuts to avoid API calls
const commonLocations = {
  // Major roads and junctions
  'a1 junction 65': { lat: 54.914, lng: -1.585, name: 'A1 Junction 65, Birtley' },
  'a1 junction 66': { lat: 54.934, lng: -1.568, name: 'A1 Junction 66, Eighton Lodge' },
  'a1 junction 67': { lat: 54.951, lng: -1.552, name: 'A1 Junction 67, Coal House' },
  'a19 tyne tunnel': { lat: 55.003, lng: -1.456, name: 'A19 Tyne Tunnel' },
  'a19 silverlink': { lat: 55.010, lng: -1.481, name: 'A19 Silverlink Roundabout' },
  
  // Key locations
  'newcastle central station': { lat: 54.9683, lng: -1.6178, name: 'Newcastle Central Station' },
  'monument metro': { lat: 54.9738, lng: -1.6132, name: 'Monument Metro Station' },
  'gateshead interchange': { lat: 54.9626, lng: -1.6014, name: 'Gateshead Interchange' },
  'metrocentre': { lat: 54.9588, lng: -1.6657, name: 'Metrocentre' },
  'newcastle airport': { lat: 55.0375, lng: -1.6917, name: 'Newcastle International Airport' },
  'sunderland city centre': { lat: 54.9069, lng: -1.3838, name: 'Sunderland City Centre' },
  'durham bus station': { lat: 54.7753, lng: -1.5849, name: 'Durham Bus Station' },
  
  // Common abbreviations
  'ncl': { lat: 54.9783, lng: -1.6178, name: 'Newcastle upon Tyne' },
  'central': { lat: 54.9683, lng: -1.6178, name: 'Newcastle Central Station' },
  'airport': { lat: 55.0375, lng: -1.6917, name: 'Newcastle International Airport' }
};

// Check cache first
const getCachedResult = (query) => {
  const cached = geocodeCache.get(query.toLowerCase());
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('📦 Using cached geocoding result for:', query);
    return cached.data;
  }
  return null;
};

// Store in cache
const setCachedResult = (query, data) => {
  geocodeCache.set(query.toLowerCase(), {
    data,
    timestamp: Date.now()
  });
  
  // Limit cache size to prevent memory issues
  if (geocodeCache.size > 1000) {
    const firstKey = geocodeCache.keys().next().value;
    geocodeCache.delete(firstKey);
  }
};

// Geocode a location string to get coordinates using Mapbox
export const geocodeLocation = async (locationString, baseUrl) => {
  try {
    // First, check for coordinates in the string
    const coordPattern = /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/;
    const coordMatch = locationString.match(coordPattern);
    
    if (coordMatch) {
      return {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2]),
        display_name: locationString,
        confidence: 100
      };
    }

    const normalizedQuery = locationString.toLowerCase().trim();
    
    // Check common locations first (no API call)
    const commonLocation = commonLocations[normalizedQuery];
    if (commonLocation) {
      console.log('✅ Found in common locations:', commonLocation.name);
      return {
        lat: commonLocation.lat,
        lng: commonLocation.lng,
        display_name: commonLocation.name,
        confidence: 95,
        source: 'local'
      };
    }

    // Check cache
    const cached = getCachedResult(locationString);
    if (cached) {
      return cached;
    }

    // Use Mapbox Geocoding API (counts against quota)
    try {
      const searchQuery = encodeURIComponent(locationString);
      const bbox = NORTH_EAST_BBOX.join(',');
      
      // Add UK bias and limit to North East region
      const url = `${MAPBOX_GEOCODING_URL}/${searchQuery}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `country=gb&` +
        `bbox=${bbox}&` +
        `limit=1&` + // Reduce from 5 to 1 to save API calls
        `types=place,postcode,address,poi,neighborhood,locality`;

      console.log('🗺️ Mapbox API call for:', locationString);
      
      // Track API usage
      if (typeof window !== 'undefined' && window.trackMapboxUsage) {
        window.trackMapboxUsage('geocoding');
      }
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const bestMatch = data.features[0];
          const [lng, lat] = bestMatch.center;
          
          // Check if within North East bounds
          const inBounds = lat >= NORTH_EAST_BBOX[1] && lat <= NORTH_EAST_BBOX[3] &&
                          lng >= NORTH_EAST_BBOX[0] && lng <= NORTH_EAST_BBOX[2];
          
          const confidence = Math.round(bestMatch.relevance * (inBounds ? 100 : 70));
          
          const result = {
            lat: lat,
            lng: lng,
            display_name: bestMatch.place_name,
            confidence: confidence,
            source: 'mapbox',
            place_type: bestMatch.place_type[0]
          };
          
          // Cache the result
          setCachedResult(locationString, result);
          
          console.log(`✅ Mapbox found: ${bestMatch.place_name} (${confidence}% confidence)`);
          return result;
        }
      }
    } catch (error) {
      console.warn('Mapbox geocoding failed:', error);
    }

    // Fallback to backend geocoding API (doesn't use Mapbox quota)
    try {
      const encodedLocation = encodeURIComponent(locationString);
      const response = await fetch(`${baseUrl}/api/geocode?location=${encodedLocation}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.coordinates) {
          const result = {
            lat: data.coordinates.lat,
            lng: data.coordinates.lng,
            display_name: data.display_name || locationString,
            confidence: data.confidence || 60,
            source: 'backend_api'
          };
          
          // Cache backend results too
          setCachedResult(locationString, result);
          
          return result;
        }
      }
    } catch (error) {
      console.warn('Backend geocoding API failed:', error);
    }

    // Ultimate fallback: Newcastle city center
    return {
      lat: 54.978,
      lng: -1.617,
      display_name: locationString + ' (approximate)',
      confidence: 10,
      source: 'fallback'
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Reverse geocode with caching
export const reverseGeocode = async (lat, lng, baseUrl) => {
  const cacheKey = `reverse_${lat.toFixed(6)}_${lng.toFixed(6)}`;
  
  // Check cache first
  const cached = getCachedResult(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Use backend first to save Mapbox API calls
    try {
      const response = await fetch(`${baseUrl}/api/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.location) {
          setCachedResult(cacheKey, data.location);
          return data.location;
        }
      }
    } catch (error) {
      console.warn('Backend reverse geocoding failed:', error);
    }

    // Only use Mapbox if backend fails
    const url = `${MAPBOX_GEOCODING_URL}/${lng},${lat}.json?` +
      `access_token=${MAPBOX_TOKEN}&` +
      `types=place,postcode,address,poi,neighborhood,locality&` +
      `limit=1`;
    
    console.log('🗺️ Mapbox reverse geocode API call');
    
    // Track API usage
    if (typeof window !== 'undefined' && window.trackMapboxUsage) {
      window.trackMapboxUsage('geocoding');
    }
    
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const parts = feature.place_name.split(',').map(p => p.trim());
        const relevantParts = parts.filter(part => 
          !part.includes('United Kingdom') && 
          !part.includes('England')
        ).slice(0, 3);
        
        const location = relevantParts.join(', ');
        setCachedResult(cacheKey, location);
        
        return location;
      }
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }

  return `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

// Debounced search for autocomplete (reduce API calls)
let searchTimeout = null;
let lastSearchQuery = '';

export const searchLocations = async (query, options = {}) => {
  // Don't search for very short queries
  if (!query || query.length < 3) {
    return [];
  }

  // Check if query hasn't changed significantly
  if (query.startsWith(lastSearchQuery) && lastSearchQuery.length >= 3) {
    // User is still typing the same location, use cached results
    const cached = getCachedResult(`search_${lastSearchQuery}`);
    if (cached) {
      return cached;
    }
  }

  lastSearchQuery = query;

  try {
    const searchQuery = encodeURIComponent(query);
    const bbox = NORTH_EAST_BBOX.join(',');
    
    const url = `${MAPBOX_GEOCODING_URL}/${searchQuery}.json?` +
      `access_token=${MAPBOX_TOKEN}&` +
      `country=gb&` +
      `bbox=${bbox}&` +
      `limit=${options.limit || 3}&` + // Reduce default from 5 to 3
      `types=${options.types || 'place,postcode,address,poi,neighborhood,locality'}&` +
      `autocomplete=true`;
    
    console.log('🔍 Mapbox search API call for:', query);
    
    // Track API usage
    if (typeof window !== 'undefined' && window.trackMapboxUsage) {
      window.trackMapboxUsage('geocoding');
    }
    
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.features) {
        const results = data.features.map(feature => ({
          id: feature.id,
          name: feature.text,
          display_name: feature.place_name,
          coordinates: {
            lat: feature.center[1],
            lng: feature.center[0]
          },
          type: feature.place_type[0],
          relevance: feature.relevance
        }));
        
        // Cache search results
        setCachedResult(`search_${query}`, results);
        
        return results;
      }
    }
    
    return [];
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
};

// Enhanced incident location with batching
export const enhanceIncidentLocation = async (incident, baseUrl) => {
  // If already has valid coordinates, just ensure correct format
  if (incident.coordinates) {
    const coords = incident.coordinates;
    
    // Handle different coordinate formats
    if (coords.latitude && coords.longitude) {
      return {
        ...incident,
        coordinates: {
          lat: coords.latitude,
          lng: coords.longitude
        }
      };
    } else if (coords.lat && coords.lng) {
      return incident; // Already in correct format
    } else if (coords.lat && coords.lon) {
      return {
        ...incident,
        coordinates: {
          lat: coords.lat,
          lng: coords.lon
        }
      };
    }
  }

  // Try to geocode the location string
  if (incident.location && incident.location !== 'Unknown Location') {
    const geocoded = await geocodeLocation(incident.location, baseUrl);
    if (geocoded && geocoded.confidence > 0) {
      return {
        ...incident,
        coordinates: {
          lat: geocoded.lat,
          lng: geocoded.lng
        },
        locationDisplay: geocoded.display_name,
        locationConfidence: geocoded.confidence,
        locationSource: geocoded.source
      };
    }
  }

  return incident;
};

// Batch enhance with rate limiting
export const enhanceIncidentsLocations = async (incidents, baseUrl) => {
  // Process in smaller batches to avoid rate limits
  const batchSize = 5;
  const results = [];
  
  for (let i = 0; i < incidents.length; i += batchSize) {
    const batch = incidents.slice(i, i + batchSize);
    const enhancedBatch = await Promise.all(
      batch.map(incident => enhanceIncidentLocation(incident, baseUrl))
    );
    results.push(...enhancedBatch);
    
    // Small delay between batches to avoid rate limits
    if (i + batchSize < incidents.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
};

// Get API usage stats
export const getGeocodeStats = () => {
  return {
    cacheSize: geocodeCache.size,
    cacheHitRate: 'Not tracked', // Could implement hit/miss tracking
    commonLocationsCount: Object.keys(commonLocations).length
  };
};

// Clear cache if needed
export const clearGeocodeCache = () => {
  geocodeCache.clear();
  console.log('🧹 Geocode cache cleared');
};

// Remaining exports unchanged...
export const validateCoordinates = (coords) => {
  if (!coords) return false;
  
  const lat = coords.lat || coords.latitude;
  const lng = coords.lng || coords.longitude || coords.lon;
  
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  
  // Check if in North East England region
  if (lat < NORTH_EAST_BBOX[1] || lat > NORTH_EAST_BBOX[3]) return false;
  if (lng < NORTH_EAST_BBOX[0] || lng > NORTH_EAST_BBOX[2]) return false;
  
  return true;
};

export const formatCoordinates = (coords) => {
  if (!coords) return '';
  
  const lat = coords.lat || coords.latitude;
  const lng = coords.lng || coords.longitude || coords.lon;
  
  if (!lat || !lng) return '';
  
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

export const getDistance = (coords1, coords2) => {
  const lat1 = coords1.lat || coords1.latitude;
  const lng1 = coords1.lng || coords1.longitude;
  const lat2 = coords2.lat || coords2.latitude;
  const lng2 = coords2.lng || coords2.longitude;
  
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
};
