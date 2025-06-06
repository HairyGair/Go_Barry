// backend/tomtom-filtered.js
// Filter TomTom data to only include REAL traffic incidents

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function fetchRealTomTomIncidents() {
  if (!process.env.TOMTOM_API_KEY) {
    return { success: false, data: [], error: 'API key missing' };
  }
  
  try {
    console.log('🚗 Fetching REAL TomTom traffic incidents (filtered)...');
    
    const response = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails', {
      params: {
        key: process.env.TOMTOM_API_KEY,
        bbox: '-1.8,54.8,-1.4,55.1',
        zoom: 10
      },
      timeout: 15000
    });
    
    console.log(`📡 TomTom raw response: ${response.data?.incidents?.length || 0} total features`);
    
    const realIncidents = [];
    let filteredCount = 0;
    
    if (response.data?.incidents) {
      response.data.incidents.forEach((feature, index) => {
        const props = feature.properties || {};
        const iconCategory = props.iconCategory;
        
        // FILTER: Only include real traffic incidents
        const realTrafficCategories = {
          1: 'Accident',
          2: 'Dangerous Conditions', 
          3: 'Weather',
          4: 'Road Hazard',
          5: 'Vehicle Breakdown',
          6: 'Road Closure',
          7: 'Road Works',
          14: 'Broken Down Vehicle'
        };
        
        // Skip non-traffic categories
        if (!realTrafficCategories[iconCategory]) {
          filteredCount++;
          return; // Skip Mass Transit (8) and Miscellaneous (9)
        }
        
        // Extract coordinates
        let lat = null, lng = null;
        if (feature.geometry?.coordinates) {
          if (feature.geometry.type === 'Point') {
            [lng, lat] = feature.geometry.coordinates;
          } else if (feature.geometry.type === 'LineString' && feature.geometry.coordinates.length > 0) {
            [lng, lat] = feature.geometry.coordinates[0];
          }
        }
        
        if (!lat || !lng) return;
        
        // Enhanced location
        let location = `Newcastle Area (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        
        // Try to get road name from properties or geometry
        if (props.roadName) {
          location = props.roadName;
        } else if (props.description) {
          location = props.description;
        }
        
        // Simple route matching based on coordinates
        const affectedRoutes = getRoutesFromCoordinates(lat, lng);
        
        const incident = {
          id: `tomtom_real_${Date.now()}_${index}`,
          type: iconCategory === 6 || iconCategory === 7 ? 'roadwork' : 'incident',
          title: `${realTrafficCategories[iconCategory]} - ${location}`,
          description: realTrafficCategories[iconCategory],
          location: location,
          coordinates: [lat, lng],
          severity: iconCategory <= 2 ? 'High' : iconCategory <= 5 ? 'Medium' : 'Low',
          status: 'red',
          source: 'tomtom',
          affectsRoutes: affectedRoutes,
          iconCategory: iconCategory,
          lastUpdated: new Date().toISOString(),
          dataSource: 'TomTom Traffic API v5 (Real Incidents Only)'
        };
        
        realIncidents.push(incident);
      });
    }
    
    console.log(`✅ TomTom filtered results:`);
    console.log(`   📊 Total features: ${response.data?.incidents?.length || 0}`);
    console.log(`   ❌ Filtered out: ${filteredCount} (infrastructure/non-traffic)`);
    console.log(`   ✅ Real incidents: ${realIncidents.length}`);
    
    return { 
      success: true, 
      data: realIncidents,
      stats: {
        total: response.data?.incidents?.length || 0,
        filtered: filteredCount,
        realIncidents: realIncidents.length
      }
    };
    
  } catch (error) {
    console.error('❌ TomTom filtered fetch failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

function getRoutesFromCoordinates(lat, lng) {
  const routes = [];
  
  // A1 corridor
  if (lng >= -1.7 && lng <= -1.5 && lat >= 54.8 && lat <= 55.2) {
    routes.push('21', 'X21', '10', '11');
  }
  
  // A19 corridor  
  if (lng >= -1.5 && lng <= -1.3 && lat >= 54.9 && lat <= 55.1) {
    routes.push('1', '2', '308', '309');
  }
  
  // Newcastle city center
  if (lng >= -1.65 && lng <= -1.55 && lat >= 54.95 && lat <= 55.0) {
    routes.push('Q1', 'Q2', 'Q3');
  }
  
  return [...new Set(routes)].sort();
}