// services/nationalHighways.js
// National Highways RSS Feed Integration (Fixed for XML/RSS response)
import axios from 'axios';
import { enhancedTextOnlyRouteMatching } from '../utils/enhancedRouteMatching.js';

// Enhanced route matching using shared utility
function matchRoutes(location, description = '') {
  console.log(`🗺️ Enhanced National Highways route matching for: "${location}"`);
  const routes = enhancedTextOnlyRouteMatching(location, description);
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

// Check if alert is in North East region
function isNorthEastAlert(alert) {
  const northEastCounties = [
    'northumberland', 'tyne and wear', 'durham', 'tyne & wear',
    'newcastle', 'gateshead', 'sunderland', 'north tyneside', 'south tyneside'
  ];
  
  const northEastRoads = ['A1', 'A19', 'A69', 'A167', 'A194', 'A1058', 'A184', 'A690'];
  
  // Check county
  if (alert.county) {
    const county = alert.county.toLowerCase();
    if (northEastCounties.some(ne => county.includes(ne))) {
      return true;
    }
  }
  
  // Check region
  if (alert.region && alert.region.toLowerCase().includes('north east')) {
    return true;
  }
  
  // Check road
  if (alert.road) {
    return northEastRoads.some(road => alert.road.includes(road));
  }
  
  // Check coordinates (rough North East boundary)
  if (alert.latitude && alert.longitude) {
    return alert.latitude >= 54.5 && alert.latitude <= 55.5 && 
           alert.longitude >= -2.5 && alert.longitude <= -1.0;
  }
  
  return false;
}

async function fetchNationalHighways() {
  try {
    console.log('🛣️ Fetching National Highways RSS feed...');
    
    // Use the RSS feed that works without API key
    const response = await axios.get('https://m.highwaysengland.co.uk/feeds/rss/UnplannedEvents.xml', {
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
      console.log('📝 No current unplanned events from National Highways');
      return { success: true, data: [], count: 0 };
    }
    
    // Process each item
    const allAlerts = itemMatches.map((itemXml, index) => {
      const item = parseRSSItem(itemXml);
      
      const location = [item.road, item.county].filter(Boolean).join(', ') || 'National Highways Network';
      const routes = matchRoutes(location, item.description);
      
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
    });
    
    // Filter for North East alerts
    const northEastAlerts = allAlerts.filter(isNorthEastAlert);
    
    console.log(`✅ Processed ${northEastAlerts.length} North East alerts from ${allAlerts.length} total`);
    return { 
      success: true, 
      data: northEastAlerts, 
      count: northEastAlerts.length,
      method: 'RSS Feed (Unplanned Events)'
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
