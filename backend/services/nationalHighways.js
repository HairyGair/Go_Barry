// services/nationalHighways.js
// National Highways RSS Feed Integration (Fixed for XML/RSS response)
import axios from 'axios';
import { enhancedTextOnlyRouteMatching } from '../utils/enhancedRouteMatching.js';
import { findAffectedRoutesEnhanced, findRoutesByLocation, isGTFSReady } from '../utils/gtfsRouteMatching.js';

// Enhanced route matching using GTFS or fallback
async function matchRoutes(location, description = '', coordinates = null) {
  console.log(`🗺️ Enhanced National Highways route matching for: "${location}"`);
  
  let routes = [];
  
  // Use GTFS route matching if available and we have coordinates
  if (isGTFSReady() && coordinates && coordinates[0] && coordinates[1]) {
    try {
      routes = await findAffectedRoutesEnhanced(coordinates[0], coordinates[1], location, 500);
      console.log(`✅ GTFS found ${routes.length} routes for National Highways incident`);
    } catch (error) {
      console.warn('⚠️ GTFS route matching failed, using fallback');
      routes = enhancedTextOnlyRouteMatching(location, description);
    }
  } else {
    // Fallback to text-based matching
    if (isGTFSReady()) {
      routes = findRoutesByLocation(location + ' ' + description);
    } else {
      routes = enhancedTextOnlyRouteMatching(location, description);
    }
  }
  
  console.log(`✅ Found ${routes.length} matching routes: ${routes.join(', ')}`);
  return routes;
}

// Parse RSS item to extract traffic alert data
function parseRSSItem(itemText) {
  const extractField = (field) => {
    const regex = new RegExp(`<${field}><!\\[CDATA\\[([^\\]]+)\\]\\]></${field}>`);
    const match = itemText.match(regex);
    return match ? match[1].trim() : '';
  };
  
  const extractSimpleField = (field) => {
    const regex = new RegExp(`<${field}>([^<]+)</${field}>`);
    const match = itemText.match(regex);
    return match ? match[1].trim() : '';
  };

  return {
    title: extractField('title') || extractSimpleField('title'),
    description: extractField('description') || extractSimpleField('description'),
    category: extractField('category') || extractSimpleField('category'),
    road: extractField('road') || extractSimpleField('road'),
    county: extractField('county') || extractSimpleField('county'),
    region: extractField('region') || extractSimpleField('region'),
    latitude: parseFloat(extractSimpleField('latitude')) || null,
    longitude: parseFloat(extractSimpleField('longitude')) || null,
    overallStart: extractSimpleField('overallStart'),
    overallEnd: extractSimpleField('overallEnd'),
    publishDate: extractSimpleField('pubDate')
  };
}

// Check if alert is relevant to Go North East operations (expanded coverage)
function isNorthEastAlert(alert) {
  const relevantCounties = [
    // Core North East
    'northumberland', 'tyne and wear', 'durham', 'tyne & wear',
    'newcastle', 'gateshead', 'sunderland', 'north tyneside', 'south tyneside',
    // Adjacent regions with major routes
    'yorkshire', 'north yorkshire', 'west yorkshire', 'lancashire', 'cumbria'
  ];
  
  const majorRoads = [
    // Major highways through/near North East
    'A1', 'A19', 'A69', 'A167', 'A194', 'A1058', 'A184', 'A690',
    'M1', 'A1(M)', 'M62', 'M74', 'A66', 'A68'
  ];
  
  // Check county
  if (alert.county) {
    const county = alert.county.toLowerCase();
    if (relevantCounties.some(county_name => county.includes(county_name))) {
      return true;
    }
  }
  
  // Check region
  if (alert.region) {
    const region = alert.region.toLowerCase();
    if (region.includes('north east') || region.includes('yorkshire') || region.includes('north west')) {
      return true;
    }
  }
  
  // Check road (more comprehensive)
  if (alert.road) {
    const road = alert.road.toUpperCase();
    if (majorRoads.some(major_road => road.includes(major_road))) {
      return true;
    }
  }
  
  // Check title/description for major routes
  const fullText = `${alert.title || ''} ${alert.description || ''}`.toUpperCase();
  if (majorRoads.some(road => fullText.includes(road))) {
    return true;
  }
  
  // Expanded coordinates (covers more of North England)
  if (alert.latitude && alert.longitude) {
    return alert.latitude >= 53.5 && alert.latitude <= 56.0 && 
           alert.longitude >= -3.5 && alert.longitude <= -0.5;
  }
  
  return false;
}

async function fetchNationalHighways() {
  try {
    console.log('🛣️ Fetching National Highways RSS feed...');
    
    // Use the comprehensive RSS feed with all events (3,310+ items vs 6 unplanned)
    // Note: This provides much better coverage of incidents
    const response = await axios.get('https://m.highwaysengland.co.uk/feeds/rss/AllEvents.xml', {
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0',
        'Accept': 'application/xml, text/xml'
      },
      timeout: 15000
    });
    
    console.log(`✅ National Highways RSS: HTTP ${response.status}`);
    
    if (!response.data || typeof response.data !== 'string') {
      console.warn('⚠️ Invalid RSS response from National Highways');
      return { success: false, data: [], error: 'Invalid RSS response' };
    }
    
    // Parse RSS items
    const itemMatches = response.data.match(/<item>[\s\S]*?<\/item>/g) || [];
    console.log(`📊 Total RSS items from National Highways: ${itemMatches.length}`);
    
    if (itemMatches.length === 0) {
      console.log('📝 No current events from National Highways');
      return { success: true, data: [], count: 0 };
    }
    
    // Process each item
    const allAlerts = await Promise.all(itemMatches.map(async (itemXml, index) => {
      const item = parseRSSItem(itemXml);
      
      const location = [item.road, item.county].filter(Boolean).join(', ') || 'National Highways Network';
      const coordinates = (item.latitude && item.longitude) ? [item.latitude, item.longitude] : null;
      const routes = await matchRoutes(location, item.description, coordinates);
      
      // Determine severity based on description
      let severity = 'Medium';
      const desc = (item.description || '').toLowerCase();
      if (desc.includes('closed') || desc.includes('severe')) {
        severity = 'High';
      } else if (desc.includes('slow') || desc.includes('delay')) {
        severity = 'Low';
      }
      
      return {
        id: `nh_${Date.now()}_${index}`,
        type: 'incident',
        title: item.title || 'National Highways Incident',
        description: item.description || 'Traffic incident reported',
        location: location,
        authority: 'National Highways',
        source: 'national_highways',
        severity: severity,
        status: 'red', // Active incidents
        category: item.category,
        road: item.road,
        county: item.county,
        region: item.region,
        coordinates: (item.latitude && item.longitude) ? [item.latitude, item.longitude] : null,
        startDate: item.overallStart || item.publishDate,
        endDate: item.overallEnd,
        affectsRoutes: routes,
        lastUpdated: new Date().toISOString(),
        dataSource: 'National Highways RSS Feed'
      };
    }));
    
    // Filter for North East alerts
    const northEastAlerts = allAlerts.filter(isNorthEastAlert);
    
    console.log(`✅ Processed ${northEastAlerts.length} relevant alerts from ${allAlerts.length} total events`);
    return { 
      success: true, 
      data: northEastAlerts, 
      count: northEastAlerts.length,
      method: 'RSS Feed (All Events - Enhanced Coverage)'
    };
    
  } catch (error) {
    console.error('❌ National Highways RSS error:', error.message);
    if (error.response) {
      console.error(`📡 Response status: ${error.response.status}`);
    }
    return { success: false, data: [], error: error.message };
  }
}

export { fetchNationalHighways };
export default { fetchNationalHighways };
