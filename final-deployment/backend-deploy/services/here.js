// services/here.js  
// HERE Traffic API Integration
import axios from 'axios';

// Simple route matching helper (we'll organize this later)
function matchRoutes(location, description = '') {
  const routes = [];
  const text = `${location} ${description}`.toLowerCase();
  
  if (text.includes('a1')) routes.push('21', 'X21');
  if (text.includes('a19')) routes.push('1', '2');
  if (text.includes('newcastle')) routes.push('Q3', '10', '12');
  if (text.includes('gateshead')) routes.push('21', '27', '28');
  if (text.includes('sunderland')) routes.push('16', '20', '56');
  
  return routes;
}

async function fetchHERETraffic() {
  const apiKey = process.env.HERE_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ HERE API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }
  try {
    console.log('📡 Fetching HERE traffic data...');
    const lat = 54.9783;
    const lng = -1.6178;
    const radius = 20000;
    const response = await axios.get('https://data.traffic.hereapi.com/v7/incidents', {
      params: {
        apikey: apiKey,
        in: `circle:${lat},${lng};r=${radius}`,
        locationReferencing: 'olr'
      },
      timeout: 15000
    });
    console.log(`✅ HERE: HTTP ${response.status}`);
    if (!response.data || !response.data.results) {
      console.log('📊 HERE: No incidents found');
      return { success: true, data: [], count: 0 };
    }
    const incidents = response.data.results;
    console.log(`📊 HERE: ${incidents.length} incidents found`);
    // Enhanced location extraction
    const alerts = incidents.map(incident => {
      // Try to extract a plausible location string
      let location = null;
      // Prefer location description if present and not generic
      if (incident.location?.description?.value && incident.location.description.value.trim().length > 0) {
        location = incident.location.description.value;
      }
      // If not, try to extract from summary or description
      if (!location || location.toLowerCase().includes('reported location')) {
        const desc = (incident.summary?.value || incident.description?.value || '');
        const match = desc.match(/\b([AM][0-9]{1,4}|B[0-9]{1,4}|Junction \d+|[A-Z][a-z]+ (Road|Street|Lane|Way|Avenue|Drive|Boulevard|Bypass)|Coast Road|Central Motorway)\b/);
        if (match) {
          location = match[0];
        } else if (desc.trim().length > 0) {
          location = desc.substring(0, 50);
        } else {
          location = 'HERE reported location';
        }
      }
      const summary = incident.summary?.value || 'Traffic incident';
      const description = incident.description?.value || summary;
      const routes = matchRoutes(location, description);
      return {
        id: `here_${incident.id || Date.now()}`,
        type: 'incident',
        title: summary,
        description: description,
        location: location,
        authority: 'HERE Traffic',
        source: 'here',
        severity: incident.criticality >= 2 ? 'High' : 'Medium',
        status: 'red',
        affectsRoutes: routes,
        lastUpdated: new Date().toISOString(),
        dataSource: 'HERE Traffic API'
      };
    });
    console.log(`✅ HERE: ${alerts.length} alerts processed`);
    return { success: true, data: alerts, count: alerts.length };
  } catch (error) {
    console.error('❌ HERE API error:', error.message);
    if (error.response) {
      console.error(`📡 HERE response status: ${error.response.status}`);
      console.error(`📡 HERE response data:`, error.response.data);
    }
    return { success: false, data: [], error: error.message };
  }
}

export { fetchHERETraffic };
export default { fetchHERETraffic };