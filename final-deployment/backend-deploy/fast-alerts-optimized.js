// Fast alerts optimization for display screen performance
// Add this to your backend/index.js

// PERFORMANCE OPTIMIZATIONS

// 1. Reduced cache timeout for faster updates
const FAST_CACHE_TIMEOUT = 1 * 60 * 1000; // 1 minute instead of 5

// 2. Optimized regional configuration (fewer regions, faster processing)
const FAST_REGIONS = [
  {
    name: 'Newcastle/Gateshead',
    bbox: '-1.8,54.8,-1.4,55.1',
    center: { lat: 54.9783, lng: -1.6178 },
    routes: ['Q3', 'Q3X', '10', '12', '21', '22', '28', '29', '47', '53', '54']
  },
  {
    name: 'North Tyneside/Coast',
    bbox: '-1.6,54.9,-1.2,55.2',
    center: { lat: 55.0174, lng: -1.4234 },
    routes: ['1', '2', '307', '309', '317']
  },
  {
    name: 'Sunderland/Durham',
    bbox: '-1.7,54.5,-1.2,55.0',
    center: { lat: 54.8500, lng: -1.4500 },
    routes: ['16', '20', '21', '22', '35', '36', '61', '62', '63']
  }
];

// 3. Fast location processing with aggressive timeouts
async function getFastLocation(lat, lng, fallbackName = '') {
  // Strategy 1: Use fallback if it looks good
  if (fallbackName && fallbackName.length > 5 && 
      !fallbackName.includes('coordinate') && 
      !fallbackName.includes('54.') && 
      !fallbackName.includes('55.')) {
    return fallbackName;
  }

  // Strategy 2: Quick geocoding with 1.5 second timeout
  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    try {
      const location = await getLocationNameFast(lat, lng, 1500);
      if (location && location.length > 3) {
        return location;
      }
    } catch (error) {
      // Fail fast, don't log to reduce processing time
    }

    // Strategy 3: Instant region detection
    const region = getRegionFromCoordinates(lat, lng);
    if (region) {
      return `${region} (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
    }
  }

  // Strategy 4: Instant fallback
  return fallbackName || 'North East England';
}

// 4. Ultra-fast OpenStreetMap with timeout
async function getLocationNameFast(lat, lng, timeout = 1500) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: lat,
        lon: lng,
        format: 'json',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'BARRY-FastMode/3.0'
      },
      timeout: timeout,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.data?.address) {
      const addr = response.data.address;
      let location = addr.road || addr.pedestrian || addr.neighbourhood || '';
      if (addr.suburb || addr.city) {
        location += location ? `, ${addr.suburb || addr.city}` : (addr.suburb || addr.city);
      }
      return location || null;
    }
    return null;
  } catch (error) {
    return null; // Fail silently for speed
  }
}

// 5. Fast GTFS route matching with early exit
async function findRoutesFast(lat, lon, maxDistanceMeters = 150) {
  try {
    // Quick coordinate-based matching first
    const coordRoutes = getCurrentRoutesFromCoordinates(lat, lon);
    if (coordRoutes.length > 0) {
      return coordRoutes; // Return immediately if coordinate match found
    }

    // Fast GTFS lookup with early termination
    const routeMap = await loadGtfsRouteMapping();
    const tripMap = await loadGtfsTripMapping();
    
    if (Object.keys(routeMap).length === 0) {
      return [];
    }

    const shapesPath = path.join(__dirname, 'data', 'shapes.txt');
    const content = await fs.readFile(shapesPath, 'utf8');
    const lines = content.split('\n');
    
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const shapeIdIndex = headers.indexOf('shape_id');
    const latIndex = headers.indexOf('shape_pt_lat');
    const lonIndex = headers.indexOf('shape_pt_lon');
    
    if (shapeIdIndex === -1 || latIndex === -1 || lonIndex === -1) return [];
    
    const nearbyShapes = new Set();
    const maxChecks = 100000; // Limit to first 100k points for speed
    
    for (let i = 1; i < Math.min(lines.length, maxChecks); i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const shapeId = values[shapeIdIndex];
        const shapeLat = parseFloat(values[latIndex]);
        const shapeLon = parseFloat(values[lonIndex]);
        
        if (!isNaN(shapeLat) && !isNaN(shapeLon) && shapeId) {
          const distance = calculateDistance(lat, lon, shapeLat, shapeLon);
          if (distance <= maxDistanceMeters) {
            nearbyShapes.add(shapeId);
            // Early exit if we find enough matches
            if (nearbyShapes.size >= 5) break;
          }
        }
      }
    }
    
    // Convert to routes
    const foundRoutes = new Set();
    for (const shapeId of nearbyShapes) {
      const routeIds = tripMap[shapeId] || [];
      for (const routeId of routeIds) {
        const routeName = routeMap[routeId];
        if (routeName) {
          foundRoutes.add(routeName);
          // Limit routes for speed
          if (foundRoutes.size >= 8) break;
        }
      }
      if (foundRoutes.size >= 8) break;
    }
    
    return Array.from(foundRoutes).sort();
  } catch (error) {
    return []; // Fail fast
  }
}

// 6. Fast TomTom with parallel processing and limits
async function fetchTomTomFast() {
  if (!process.env.TOMTOM_API_KEY) {
    return { success: false, data: [], error: 'API key missing' };
  }
  
  try {
    console.log('🚗 Fast TomTom fetch (3 regions, parallel)...');
    
    // Parallel fetch of top 3 regions only
    const regionPromises = FAST_REGIONS.map(async (region) => {
      try {
        const response = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails', {
          params: {
            key: process.env.TOMTOM_API_KEY,
            bbox: region.bbox,
            zoom: 10
          },
          timeout: 8000, // Reduced timeout
          headers: {
            'User-Agent': 'BARRY-Fast/3.0',
            'Accept': 'application/json'
          }
        });
        
        return { region, incidents: response.data?.incidents || [] };
      } catch (error) {
        console.warn(`⚠️ Fast TomTom ${region.name}: ${error.message}`);
        return { region, incidents: [] };
      }
    });
    
    const results = await Promise.all(regionPromises);
    const allAlerts = [];
    
    for (const { region, incidents } of results) {
      if (incidents.length === 0) continue;
      
      // Process max 4 incidents per region for speed
      const limitedIncidents = incidents.slice(0, 4);
      
      for (const [index, feature] of limitedIncidents.entries()) {
        const props = feature.properties || {};
        
        // Fast coordinate extraction
        let lat = null, lng = null;
        try {
          if (feature.geometry?.coordinates) {
            if (feature.geometry.type === 'Point') {
              [lng, lat] = feature.geometry.coordinates;
            } else if (feature.geometry.type === 'LineString' && feature.geometry.coordinates.length > 0) {
              [lng, lat] = feature.geometry.coordinates[0];
            }
          }
        } catch (coordError) {
          continue; // Skip if no coordinates
        }

        // Fast location processing
        const location = await getFastLocation(lat, lng, props.roadName || props.description || '');
        
        // Fast route matching
        const routes = await findRoutesFast(lat, lng, 200);
        
        // Simple incident categorization
        const severity = props.iconCategory <= 5 ? 'High' : 'Medium';
        const type = props.iconCategory >= 6 && props.iconCategory <= 7 ? 'roadwork' : 'incident';
        
        const alert = {
          id: `tomtom_fast_${region.name.replace(/\W/g, '_')}_${Date.now()}_${index}`,
          type: type,
          title: `Traffic ${type === 'roadwork' ? 'Roadwork' : 'Incident'} - ${location}`,
          description: props.description || `Traffic ${type}`,
          location: location,
          region: region.name,
          coordinates: [lat, lng],
          severity: severity,
          status: 'red',
          source: 'tomtom',
          affectsRoutes: routes,
          routeMatchMethod: routes.length > 0 ? 'Fast GTFS' : 'Coordinate',
          lastUpdated: new Date().toISOString(),
          startDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
          endDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          dataSource: 'TomTom Fast Mode'
        };
        
        allAlerts.push(alert);
      }
    }
    
    console.log(`✅ Fast TomTom: ${allAlerts.length} alerts in parallel`);
    return { success: true, data: allAlerts };
    
  } catch (error) {
    console.error('❌ Fast TomTom failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

// 7. Fast HERE with single call
async function fetchHEREFast() {
  const apiKey = process.env.HERE_API_KEY;
  if (!apiKey) {
    return { success: false, data: [], error: 'API key missing' };
  }
  
  try {
    console.log('📡 Fast HERE fetch (Newcastle center only)...');
    
    // Single call to Newcastle center with larger radius
    const response = await axios.get('https://data.traffic.hereapi.com/v7/incidents', {
      params: {
        apikey: apiKey,
        in: `circle:54.9783,-1.6178;r=25000`, // 25km radius from Newcastle
        locationReferencing: 'olr'
      },
      timeout: 8000
    });
    
    console.log(`✅ Fast HERE: ${response.data?.results?.length || 0} incidents`);
    
    const alerts = [];
    if (response.data?.results) {
      // Process max 6 incidents for speed
      const incidents = response.data.results.slice(0, 6);
      
      for (const [index, incident] of incidents.entries()) {
        const location = incident.location?.description?.value || 
                        incident.summary?.value || 
                        'North East England';
        
        const routes = getCurrentRoutesFromText(location, null);
        
        const alert = {
          id: `here_fast_${incident.id || Date.now()}_${index}`,
          type: 'incident',
          title: incident.summary?.value || 'Traffic Incident',
          description: incident.description?.value || 'Traffic incident',
          location: location,
          region: 'Newcastle/Gateshead',
          severity: incident.criticality >= 2 ? 'High' : 'Medium',
          status: 'red',
          source: 'here',
          affectsRoutes: routes,
          routeMatchMethod: 'Fast Pattern',
          lastUpdated: new Date().toISOString(),
          startDate: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
          dataSource: 'HERE Fast Mode'
        };
        
        alerts.push(alert);
      }
    }
    
    console.log(`✅ Fast HERE: ${alerts.length} alerts processed`);
    return { success: true, data: alerts };
    
  } catch (error) {
    console.error('❌ Fast HERE failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

// 8. Fast alerts endpoint for display screen
app.get('/api/alerts-fast', async (req, res) => {
  try {
    const now = Date.now();
    
    // Check fast cache (1 minute)
    if (cachedAlerts && lastFetchTime && (now - lastFetchTime) < FAST_CACHE_TIMEOUT) {
      console.log('⚡ Serving fast cached alerts');
      return res.json({
        success: true,
        alerts: cachedAlerts.alerts,
        metadata: {
          ...cachedAlerts.metadata,
          cached: true,
          fastMode: true,
          servedAt: new Date().toISOString()
        }
      });
    }
    
    console.log('⚡ Fast alerts fetch starting...');
    const startTime = Date.now();
    
    // Parallel fast fetch (much faster than sequential)
    const [tomtomResult, hereResult, nhResult] = await Promise.allSettled([
      fetchTomTomFast(),
      fetchHEREFast(),
      fetchNationalHighways() // Keep this as-is since it's already fast
    ]);
    
    const allAlerts = [];
    const sources = {};
    
    // Process results
    if (tomtomResult.status === 'fulfilled' && tomtomResult.value.success) {
      allAlerts.push(...tomtomResult.value.data);
      sources.tomtom = { success: true, count: tomtomResult.value.data.length, method: 'Fast Mode' };
    } else {
      sources.tomtom = { success: false, count: 0, error: 'Fast mode timeout' };
    }
    
    if (hereResult.status === 'fulfilled' && hereResult.value.success) {
      allAlerts.push(...hereResult.value.data);
      sources.here = { success: true, count: hereResult.value.data.length, method: 'Fast Mode' };
    } else {
      sources.here = { success: false, count: 0, error: 'Fast mode timeout' };
    }
    
    if (nhResult.status === 'fulfilled' && nhResult.value.success) {
      allAlerts.push(...nhResult.value.data);
      sources.nationalHighways = { success: true, count: nhResult.value.count, method: 'Standard' };
    } else {
      sources.nationalHighways = { success: false, count: 0, error: 'API timeout' };
    }
    
    // Fast filtering
    const filteredAlerts = allAlerts.filter(alert => 
      alertAffectsGTFSRoute(alert) && 
      alert.source !== 'test_data'
    );
    
    // Add acknowledgment data quickly
    for (const alert of filteredAlerts) {
      alert.acknowledged = acknowledgedAlerts[alert.id] || null;
      alert.notes = alertNotes[alert.id] || [];
    }
    
    const processingTime = Date.now() - startTime;
    
    // Cache fast results
    cachedAlerts = {
      alerts: filteredAlerts,
      metadata: {
        totalAlerts: filteredAlerts.length,
        sources,
        processingTimeMs: processingTime,
        fastMode: true,
        lastUpdated: new Date().toISOString()
      }
    };
    lastFetchTime = now;
    
    console.log(`⚡ Fast alerts complete: ${filteredAlerts.length} alerts in ${processingTime}ms`);
    
    res.json({
      success: true,
      alerts: filteredAlerts,
      metadata: cachedAlerts.metadata
    });
    
  } catch (error) {
    console.error('❌ Fast alerts error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: [],
      metadata: { fastMode: true, error: error.message }
    });
  }
});