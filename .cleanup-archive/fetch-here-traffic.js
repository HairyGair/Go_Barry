// backend/fetch-here-traffic.js
import axios from 'axios';

const HERE_CONFIG = {
  apiKey: 'kw-aCK-LeVViMkZh9C_bK-Km-GjUtv_303waROHLL5Q',
  baseUrl: 'https://data.traffic.hereapi.com/v7',
  timeout: 10000
};

export async function fetchHereTrafficData() {
  const trafficData = [];
  
  for (const [locationId, point] of Object.entries(NORTH_EAST_MONITORING_POINTS)) {
    try {
      // Fetch traffic flow
      const flowResponse = await axios.get(`${HERE_CONFIG.baseUrl}/flow`, {
        params: {
          locationReferencing: 'shape',
          in: `circle:${point.lat},${point.lng};r=${point.radius}`,
          apiKey: HERE_CONFIG.apiKey
        },
        timeout: HERE_CONFIG.timeout
      });
      
      // Fetch incidents
      const incidentsResponse = await axios.get(`${HERE_CONFIG.baseUrl}/incidents`, {
        params: {
          locationReferencing: 'shape', 
          in: `circle:${point.lat},${point.lng};r=${point.radius}`,
          apiKey: HERE_CONFIG.apiKey
        },
        timeout: HERE_CONFIG.timeout
      });
      
      // Process flow data
      if (flowResponse.data.results) {
        flowResponse.data.results.forEach(result => {
          if (result.currentFlow && result.currentFlow.jamFactor > 0.3) {
            trafficData.push({
              id: `here_flow_${locationId}_${Date.now()}`,
              type: 'congestion',
              title: `Traffic Congestion - ${result.location.description || locationId}`,
              description: `Slow traffic. Speed: ${Math.round(result.currentFlow.speed || 0)}km/h, Normal: ${Math.round(result.currentFlow.freeFlow || 0)}km/h`,
              location: result.location.description || `${locationId} area`,
              coordinates: result.location.shape?.links?.[0]?.points?.[0] ? 
                [result.location.shape.links[0].points[0].lat, result.location.shape.links[0].points[0].lng] : null,
              severity: result.currentFlow.jamFactor > 0.7 ? 'High' : result.currentFlow.jamFactor > 0.4 ? 'Medium' : 'Low',
              status: result.currentFlow.jamFactor > 0.6 ? 'red' : 'amber',
              source: 'here',
              
              // HERE specific data
              congestionLevel: Math.round(result.currentFlow.jamFactor * 10), // 0-10 scale
              currentSpeed: Math.round(result.currentFlow.speed || 0),
              freeFlowSpeed: Math.round(result.currentFlow.freeFlow || 0),
              confidence: result.currentFlow.confidence,
              jamFactor: result.currentFlow.jamFactor,
              
              affectsRoutes: point.routes,
              lastUpdated: new Date().toISOString()
            });
          }
        });
      }
      
      // Process incidents
      if (incidentsResponse.data.results) {
        incidentsResponse.data.results.forEach(result => {
          trafficData.push({
            id: `here_incident_${result.incidentDetails.id}`,
            type: 'incident',
            title: `Traffic Incident - ${result.location.description || locationId}`,
            description: result.incidentDetails.description?.value || 'Traffic incident reported',
            location: result.location.description || `${locationId} area`,
            coordinates: result.location.shape?.links?.[0]?.points?.[0] ?
              [result.location.shape.links[0].points[0].lat, result.location.shape.links[0].points[0].lng] : null,
            severity: result.incidentDetails.criticality === 'critical' ? 'High' : 
                     result.incidentDetails.criticality === 'major' ? 'Medium' : 'Low',
            status: 'red',
            source: 'here',
            
            // HERE incident specific
            incidentType: result.incidentDetails.type,
            criticality: result.incidentDetails.criticality,
            roadClosed: result.incidentDetails.roadClosed,
            startTime: result.incidentDetails.startTime,
            endTime: result.incidentDetails.endTime,
            
            affectsRoutes: point.routes,
            lastUpdated: new Date().toISOString()
          });
        });
      }
      
      // Rate limiting - stay within free tier
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.warn(`⚠️ HERE API error for ${locationId}:`, error.message);
    }
  }
  
  return {
    success: true,
    data: trafficData,
    source: 'HERE Traffic API v7',
    count: trafficData.length
  };
}