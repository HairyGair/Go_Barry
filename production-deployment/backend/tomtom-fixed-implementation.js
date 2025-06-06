// backend/tomtom-fixed-implementation.js
// Complete working TomTom implementation with correct GeoJSON format


import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Process TomTom GeoJSON response format
function processTomTomGeoJSON(data) {
  const alerts = [];
  
  if (data.incidents && Array.isArray(data.incidents)) {
    data.incidents.forEach((feature, index) => {
      try {
        // Extract coordinates from geometry
        let lat = null, lng = null;
        if (feature.geometry && feature.geometry.coordinates) {
          if (feature.geometry.type === 'Point') {
            [lng, lat] = feature.geometry.coordinates;
          } else if (feature.geometry.type === 'LineString' && feature.geometry.coordinates.length > 0) {
            // Use first point of the line
            [lng, lat] = feature.geometry.coordinates[0];
          }
        }
        
        // Extract properties
        const props = feature.properties || {};
        
        // Build location description
        let location = 'Traffic Location';
        if (props.roadName) {
          location = props.roadName;
        } else if (props.description) {
          location = props.description;
        } else if (lat && lng) {
          location = `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
        
        // Map iconCategory to incident type and severity
        const getIncidentInfo = (iconCategory) => {
          const categoryMap = {
            1: { type: 'incident', severity: 'High', desc: 'Accident' },
            2: { type: 'incident', severity: 'Medium', desc: 'Dangerous Conditions' },
            3: { type: 'incident', severity: 'Low', desc: 'Weather' },
            4: { type: 'incident', severity: 'Medium', desc: 'Road Hazard' },
            5: { type: 'incident', severity: 'Low', desc: 'Vehicle Breakdown' },
            6: { type: 'roadwork', severity: 'Medium', desc: 'Road Closure' },
            7: { type: 'roadwork', severity: 'High', desc: 'Road Works' },
            8: { type: 'incident', severity: 'Low', desc: 'Mass Transit' },
            9: { type: 'incident', severity: 'Medium', desc: 'Miscellaneous' },
            14: { type: 'incident', severity: 'Medium', desc: 'Broken Down Vehicle' }
          };
          return categoryMap[iconCategory] || { type: 'incident', severity: 'Low', desc: 'Traffic Incident' };
        };
        
        const incidentInfo = getIncidentInfo(props.iconCategory);
        
        // Enhanced location with GTFS if available
        let enhancedLocation = location;
        if (typeof enhanceLocationWithGTFSOptimized === 'function' && lat && lng) {
          enhancedLocation = enhanceLocationWithGTFSOptimized(lat, lng, location);
        }
        
        // Simple route matching based on location
        const affectedRoutes = matchRoutesToLocation(location);
        
        const alert = {
          id: `tomtom_geojson_${Date.now()}_${index}`,
          type: incidentInfo.type,
          title: `${incidentInfo.desc} - ${location}`,
          description: props.description || props.roadName || incidentInfo.desc,
          location: enhancedLocation,
          coordinates: lat && lng ? [lat, lng] : null,
          severity: incidentInfo.severity,
          status: 'red',
          source: 'tomtom',
          
          // TomTom specific data
          iconCategory: props.iconCategory,
          roadName: props.roadName,
          affectsRoutes: affectedRoutes,
          
          lastUpdated: new Date().toISOString(),
          dataSource: 'TomTom Traffic API v5 (GeoJSON Format)'
        };
        
        alerts.push(alert);
        
      } catch (error) {
        console.warn(`⚠️ Error processing TomTom incident ${index}:`, error.message);
      }
    });
  }
  
  return alerts;
}

// Simple route matching function
function matchRoutesToLocation(location) {
  if (!location) return [];
  
  const text = location.toLowerCase();
  const routePatterns = {
    'a1': ['21', 'X21', '10', '11'],
    'a19': ['1', '2', '308', '309'],
    'a167': ['21', '22', 'X21', '6', '7'],
    'a1058': ['1', '2', '308', '309', '317'],
    'coast road': ['1', '2', '308', '309', '317'],
    'newcastle': ['Q1', 'Q2', 'Q3', '10', '11', '12'],
    'gateshead': ['21', '25', '28', '29'],
    'sunderland': ['16', '18', '20', '61', '62'],
    'durham': ['21', '22', 'X21', '6', '7'],
    'tyne tunnel': ['1', '2', '308', '309'],
    'washington': ['61', '62', '63', '64', '65']
  };
  
  const matchedRoutes = [];
  for (const [pattern, routes] of Object.entries(routePatterns)) {
    if (text.includes(pattern)) {
      matchedRoutes.push(...routes);
    }
  }
  
  return [...new Set(matchedRoutes)].sort();
}

// Main TomTom fetcher with correct format
export async function fetchTomTomTrafficGeoJSON() {
  if (!process.env.TOMTOM_API_KEY) {
    console.warn('⚠️ TomTom API key not configured');
    return { success: false, data: [], error: 'API key missing' };
  }
  
  try {
    console.log('🚗 Fetching TomTom traffic (GeoJSON format)...');
    
    // Newcastle area (confirmed working)
    const response = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails', {
      params: {
        key: process.env.TOMTOM_API_KEY,
        bbox: '-1.8,54.8,-1.4,55.1', // Newcastle area
        zoom: 10
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0-GeoJSON',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 TomTom GeoJSON API: ${response.status}, incidents: ${response.data?.incidents?.length || 0}`);
    
    // Process the GeoJSON format
    const alerts = processTomTomGeoJSON(response.data);
    
    // Log sample for debugging
    if (alerts.length > 0) {
      console.log(`✨ Sample TomTom alert: ${alerts[0].location}`);
    }
    
    console.log(`✅ TomTom GeoJSON: ${alerts.length} alerts processed from Newcastle area`);
    
    return { 
      success: true, 
      data: alerts, 
      source: 'TomTom Traffic API v5 (GeoJSON)',
      area: 'Newcastle',
      rawIncidents: response.data?.incidents?.length || 0
    };
    
  } catch (error) {
    console.error('❌ TomTom GeoJSON fetch failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

export default fetchTomTomTrafficGeoJSON;