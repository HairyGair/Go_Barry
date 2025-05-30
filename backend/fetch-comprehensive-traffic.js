// backend/fetch-comprehensive-traffic.js
// BARRY's Complete Traffic Intelligence System
// Integrates: Street Manager + National Highways + HERE + MapQuest
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log('🚦 BARRY Comprehensive Traffic System Loading...');
console.log('📊 Data Sources: Street Manager + National Highways + HERE + MapQuest');

// Enhanced API configurations
const TRAFFIC_APIS = {
  // HERE Traffic API (1,000 transactions/month free)
  here: {
    baseUrl: 'https://data.traffic.hereapi.com/v7',
    apiKey: process.env.HERE_API_KEY, // Your key: kw-aCK-LeVViMkZh9C_bK-Km-GjUtv_303waROHLL5Q
    enabled: !!process.env.HERE_API_KEY,
    endpoints: {
      flow: '/flow',
      incidents: '/incidents'
    },
    features: ['traffic_flow', 'incidents', 'lane_level_precision', 'jam_factor'],
    updateFrequency: 'every_minute',
    limit: '1,000 transactions/month'
  },
  
  // MapQuest Traffic API (15,000 transactions/month free)
  mapquest: {
    baseUrl: 'https://www.mapquestapi.com/traffic/v2',
    apiKey: process.env.MAPQUEST_API_KEY, // Register at developer.mapquest.com
    enabled: !!process.env.MAPQUEST_API_KEY,
    endpoints: {
      incidents: '/incidents',
      markets: '/markets'
    },
    features: ['traffic_incidents', 'market_coverage', 'detailed_descriptions'],
    updateFrequency: 'real_time',
    limit: '15,000 transactions/month'
  },
  
  // National Highways (Unlimited free - existing)
  nationalHighways: {
    baseUrl: 'https://api.data.nationalhighways.co.uk',
    apiKey: process.env.NATIONAL_HIGHWAYS_API_KEY,
    enabled: !!process.env.NATIONAL_HIGHWAYS_API_KEY,
    endpoints: {
      closures: '/roads/v2.0/closures',
      incidents: '/roads/v2.0/incidents'
    },
    features: ['major_road_incidents', 'planned_closures', 'roadworks'],
    updateFrequency: 'every_5_minutes',
    limit: 'unlimited'
  }
};

// North East England monitoring zones optimized for all APIs
const NORTH_EAST_TRAFFIC_ZONES = {
  // Zone 1: Newcastle City Centre & A1 North
  newcastle_central: {
    center: { lat: 54.9783, lng: -1.6178 },
    radius: 3000, // 3km
    description: 'Newcastle City Centre & Central Motorway',
    priority: 'critical',
    routes: ['Q1', 'Q2', 'Q3', 'QUAYSIDE', '10', '11', '12', '39', '40'],
    roads: ['A1', 'A167', 'A189', 'Central Motorway'],
    mapquestBbox: '54.955,-1.635,55.001,-1.600' // min_lat,min_lng,max_lat,max_lng
  },
  
  // Zone 2: A1 Newcastle Corridor  
  a1_newcastle_corridor: {
    center: { lat: 54.9500, lng: -1.6000 },
    radius: 5000, // 5km
    description: 'A1 Newcastle to Gateshead Corridor',
    priority: 'critical',
    routes: ['X9', 'X10', '21', 'X21', '43', '44', '45', '25', '28', '29'],
    roads: ['A1', 'A184', 'A692'],
    mapquestBbox: '54.920,-1.630,54.980,-1.570'
  },
  
  // Zone 3: A19 & Tyne Tunnel
  tyne_tunnel_a19: {
    center: { lat: 54.9857, lng: -1.4618 },
    radius: 4000, // 4km  
    description: 'A19 Tyne Tunnel Approaches',
    priority: 'critical',
    routes: ['1', '2', '308', '309', '311', '317', '19', '41', '42'],
    roads: ['A19', 'A1058', 'Coast Road'],
    mapquestBbox: '54.965,-1.485,55.006,-1.438'
  },
  
  // Zone 4: Sunderland & A19 South
  sunderland_a19_south: {
    center: { lat: 54.8340, lng: -1.4200 },
    radius: 4000, // 4km
    description: 'Sunderland City & A19 Southern Approaches', 
    priority: 'high',
    routes: ['16', '18', '20', '61', '62', '63', '64', '65', '35', '36'],
    roads: ['A19', 'A183', 'A690'],
    mapquestBbox: '54.810,-1.445,54.858,-1.395'
  },
  
  // Zone 5: Durham Road A167 Corridor
  durham_road_a167: {
    center: { lat: 54.8951, lng: -1.5418 },
    radius: 3000, // 3km
    description: 'A167 Durham Road Corridor',
    priority: 'high', 
    routes: ['21', '22', 'X21', '50', '6', '7', '13', '14'],
    roads: ['A167', 'A691', 'B6532'],
    mapquestBbox: '54.875,-1.565,54.915,-1.518'
  },
  
  // Zone 6: Coast Road A1058
  coast_road_a1058: {
    center: { lat: 55.0500, lng: -1.4500 },
    radius: 3000, // 3km
    description: 'A1058 Coast Road',
    priority: 'medium',
    routes: ['1', '2', '308', '309', '311', '317', '41', '42'],
    roads: ['A1058', 'A191', 'B1322'],
    mapquestBbox: '55.030,-1.475,55.070,-1.425'
  }
};

// HERE Traffic API Integration
async function fetchHereTrafficData() {
  if (!TRAFFIC_APIS.here.enabled) {
    console.warn('⚠️ HERE API not configured');
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🗺️ Fetching HERE Traffic data (flow + incidents)...');
    const alerts = [];
    let apiCallCount = 0;

    for (const [zoneId, zone] of Object.entries(NORTH_EAST_TRAFFIC_ZONES)) {
      if (zone.priority === 'critical' || zone.priority === 'high') {
        try {
          // Traffic Flow Data
          const flowResponse = await axios.get(`${TRAFFIC_APIS.here.baseUrl}/flow`, {
            params: {
              locationReferencing: 'shape',
              in: `circle:${zone.center.lat},${zone.center.lng};r=${zone.radius}`,
              apiKey: TRAFFIC_APIS.here.apiKey
            },
            timeout: 10000
          });
          apiCallCount++;

          // Process flow data for congestion alerts
          if (flowResponse.data.results) {
            flowResponse.data.results.forEach(result => {
              const jamFactor = result.currentFlow?.jamFactor || 0;
              if (jamFactor > 0.3) { // Significant congestion
                alerts.push({
                  id: `here_flow_${zoneId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                  type: 'congestion',
                  title: `Traffic Congestion - ${result.location?.description || zone.description}`,
                  description: `Heavy traffic detected. Current: ${Math.round(result.currentFlow.speed || 0)}km/h, Normal: ${Math.round(result.currentFlow.freeFlow || 0)}km/h`,
                  location: result.location?.description || zone.description,
                  coordinates: result.location?.shape?.links?.[0]?.points?.[0] ? 
                    [result.location.shape.links[0].points[0].lat, result.location.shape.links[0].points[0].lng] : 
                    [zone.center.lat, zone.center.lng],
                  severity: jamFactor > 0.7 ? 'High' : jamFactor > 0.4 ? 'Medium' : 'Low',
                  status: jamFactor > 0.6 ? 'red' : 'amber',
                  source: 'here',
                  
                  // HERE-specific traffic data
                  congestionLevel: Math.round(jamFactor * 10), // 0-10 scale
                  currentSpeed: Math.round(result.currentFlow.speed || 0),
                  freeFlowSpeed: Math.round(result.currentFlow.freeFlow || 0),
                  jamFactor: jamFactor,
                  confidence: result.currentFlow.confidence || 0.5,
                  traversability: result.currentFlow.traversability || 'unknown',
                  delayMinutes: calculateDelayFromJamFactor(jamFactor, result.location?.length || 1000),
                  
                  affectsRoutes: zone.routes,
                  affectedRoads: zone.roads,
                  lastUpdated: new Date().toISOString(),
                  dataSource: 'HERE Traffic API v7',
                  updateFrequency: 'every_minute'
                });
              }
            });
          }

          // Traffic Incidents Data  
          const incidentsResponse = await axios.get(`${TRAFFIC_APIS.here.baseUrl}/incidents`, {
            params: {
              locationReferencing: 'shape',
              in: `circle:${zone.center.lat},${zone.center.lng};r=${zone.radius}`,
              apiKey: TRAFFIC_APIS.here.apiKey
            },
            timeout: 10000
          });
          apiCallCount++;

          // Process incidents
          if (incidentsResponse.data.results) {
            incidentsResponse.data.results.forEach(result => {
              const incident = result.incidentDetails;
              alerts.push({
                id: `here_incident_${incident.id}`,
                type: 'incident',
                title: `${capitalizeFirst(incident.type)} - ${result.location?.description || zone.description}`,
                description: incident.description?.value || 'Traffic incident reported by HERE',
                location: result.location?.description || zone.description,
                coordinates: result.location?.shape?.links?.[0]?.points?.[0] ?
                  [result.location.shape.links[0].points[0].lat, result.location.shape.links[0].points[0].lng] :
                  [zone.center.lat, zone.center.lng],
                severity: mapHereCriticality(incident.criticality),
                status: incident.roadClosed ? 'red' : 'amber',
                source: 'here',
                
                // HERE incident-specific data
                incidentType: incident.type,
                criticality: incident.criticality,
                roadClosed: incident.roadClosed,
                startTime: incident.startTime,
                endTime: incident.endTime,
                entryTime: incident.entryTime,
                codes: incident.codes || [],
                
                affectsRoutes: zone.routes,
                affectedRoads: zone.roads,
                lastUpdated: new Date().toISOString(),
                dataSource: 'HERE Traffic API v7'
              });
            });
          }

          // Rate limiting for free tier
          await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (zoneError) {
          console.warn(`⚠️ HERE API error for zone ${zoneId}:`, zoneError.message);
        }
      }
    }

    console.log(`✅ HERE: ${alerts.length} traffic alerts from ${apiCallCount} API calls`);
    return { success: true, data: alerts, apiCalls: apiCallCount };

  } catch (error) {
    console.error('❌ HERE Traffic API failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

// MapQuest Traffic API Integration
async function fetchMapQuestTrafficData() {
  if (!TRAFFIC_APIS.mapquest.enabled) {
    console.warn('⚠️ MapQuest API not configured');
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🗺️ Fetching MapQuest Traffic data (incidents)...');
    const alerts = [];
    let apiCallCount = 0;

    for (const [zoneId, zone] of Object.entries(NORTH_EAST_TRAFFIC_ZONES)) {
      try {
        // MapQuest Incidents API
        const incidentsResponse = await axios.get(`${TRAFFIC_APIS.mapquest.baseUrl}/incidents`, {
          params: {
            key: TRAFFIC_APIS.mapquest.apiKey,
            boundingBox: zone.mapquestBbox,
            filters: 'incidents,construction,events'
          },
          timeout: 10000
        });
        apiCallCount++;

        // Process MapQuest incidents
        if (incidentsResponse.data.incidents) {
          incidentsResponse.data.incidents.forEach(incident => {
            alerts.push({
              id: `mapquest_${incident.id || Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              type: mapQuestTypeToBarryType(incident.type),
              title: `${incident.shortDesc || 'Traffic Incident'} - ${zone.description}`,
              description: incident.fullDesc || incident.shortDesc || 'Traffic incident reported by MapQuest',
              location: `${incident.street || 'Unknown Road'} - ${zone.description}`,
              coordinates: incident.lat && incident.lng ? [incident.lat, incident.lng] : [zone.center.lat, zone.center.lng],
              severity: mapQuestSeverityToBarry(incident.severity || incident.impact),
              status: incident.endTime ? 'amber' : 'red',
              source: 'mapquest',
              
              // MapQuest-specific data
              mapquestType: incident.type,
              mapquestSeverity: incident.severity,
              impact: incident.impact,
              startTime: incident.startTime || new Date().toISOString(),
              endTime: incident.endTime,
              street: incident.street,
              distance: incident.distance,
              delay: incident.delay,
              
              affectsRoutes: zone.routes,
              affectedRoads: zone.roads,
              lastUpdated: new Date().toISOString(),
              dataSource: 'MapQuest Traffic API v2'
            });
          });
        }

        // Rate limiting for free tier
        await new Promise(resolve => setTimeout(resolve, 800));

      } catch (zoneError) {
        console.warn(`⚠️ MapQuest API error for zone ${zoneId}:`, zoneError.message);
      }
    }

    console.log(`✅ MapQuest: ${alerts.length} traffic alerts from ${apiCallCount} API calls`);
    return { success: true, data: alerts, apiCalls: apiCallCount };

  } catch (error) {
    console.error('❌ MapQuest Traffic API failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

// Enhanced National Highways integration (existing + traffic extensions)
async function fetchEnhancedNationalHighways() {
  if (!TRAFFIC_APIS.nationalHighways.enabled) {
    console.warn('⚠️ National Highways API not configured');
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🛣️ Fetching Enhanced National Highways data...');
    const alerts = [];

    // Your existing National Highways closures + enhanced incidents
    const endpoints = [
      { url: `${TRAFFIC_APIS.nationalHighways.baseUrl}/roads/v2.0/closures`, type: 'closures' },
      { url: `${TRAFFIC_APIS.nationalHighways.baseUrl}/roads/v2.0/incidents`, type: 'incidents' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint.url, {
          headers: {
            'Ocp-Apim-Subscription-Key': TRAFFIC_APIS.nationalHighways.apiKey,
            'Accept': 'application/json'
          },
          timeout: 15000
        });

        // Process National Highways data (your existing logic + enhancements)
        if (response.data.features) {
          response.data.features.forEach(feature => {
            const props = feature.properties;
            
            // Filter for North East region
            if (isInNorthEast(props.location || props.description || '')) {
              alerts.push({
                id: `nh_${endpoint.type}_${props.id || Date.now()}`,
                type: endpoint.type === 'incidents' ? 'incident' : 'roadwork',
                title: props.title || props.description || `National Highways ${endpoint.type}`,
                description: props.description || props.comment || 'National Highways reported issue',
                location: props.location || 'Major Road Network',
                coordinates: feature.geometry?.coordinates ? 
                  [feature.geometry.coordinates[1], feature.geometry.coordinates[0]] : null,
                severity: classifyNHSeverity(props),
                status: classifyNHStatus(props),
                source: 'national_highways',
                
                // National Highways specific
                roadName: props.roadName,
                routeName: props.routeName, 
                category: props.category,
                subCategory: props.subCategory,
                startDate: props.startDate,
                endDate: props.endDate,
                
                affectsRoutes: matchRoutesToNHLocation(props.location, props.routeName),
                lastUpdated: new Date().toISOString(),
                dataSource: 'National Highways DATEX II API'
              });
            }
          });
        }

      } catch (endpointError) {
        console.warn(`⚠️ National Highways ${endpoint.type} failed:`, endpointError.message);
      }
    }

    console.log(`✅ National Highways: ${alerts.length} alerts processed`);
    return { success: true, data: alerts };

  } catch (error) {
    console.error('❌ National Highways enhanced fetch failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

// Helper functions
function calculateDelayFromJamFactor(jamFactor, segmentLength) {
  // Estimate delay based on jam factor and segment length
  const normalSpeed = 50; // km/h assumption
  const reducedSpeed = normalSpeed * (1 - jamFactor);
  const timeNormal = (segmentLength / 1000) / normalSpeed * 60; // minutes
  const timeActual = (segmentLength / 1000) / reducedSpeed * 60; // minutes
  return Math.max(0, Math.round(timeActual - timeNormal));
}

function mapHereCriticality(criticality) {
  switch (criticality?.toLowerCase()) {
    case 'critical': return 'High';
    case 'major': return 'High';
    case 'minor': return 'Medium';
    default: return 'Low';
  }
}

function mapQuestTypeToBarryType(type) {
  switch (type?.toLowerCase()) {
    case 'accident':
    case 'incident': 
      return 'incident';
    case 'construction':
    case 'roadwork':
      return 'roadwork';
    default:
      return 'incident';
  }
}

function mapQuestSeverityToBarry(severity) {
  if (typeof severity === 'number') {
    if (severity >= 3) return 'High';
    if (severity >= 2) return 'Medium';
    return 'Low';
  }
  
  switch (severity?.toLowerCase()) {
    case 'high':
    case 'severe':
      return 'High';
    case 'medium':
    case 'moderate':
      return 'Medium';
    default:
      return 'Low';
  }
}

function capitalizeFirst(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
}

function classifyNHSeverity(props) {
  // Your existing National Highways severity classification
  if (props.category?.toLowerCase().includes('closure') || props.roadClosed) return 'High';
  if (props.category?.toLowerCase().includes('restriction')) return 'Medium';
  return 'Low';
}

function classifyNHStatus(props) {
  // Your existing National Highways status classification
  const now = new Date();
  if (props.startDate && props.endDate) {
    const start = new Date(props.startDate);
    const end = new Date(props.endDate);
    if (start <= now && end >= now) return 'red';
    if (start > now) return 'amber';
  }
  return 'green';
}

function matchRoutesToNHLocation(location, routeName) {
  // Your existing route matching logic enhanced for National Highways
  const routes = new Set();
  const text = `${location} ${routeName}`.toLowerCase();
  
  // Enhanced A-road to bus route mapping
  const roadMappings = {
    'a1': ['X9', 'X10', '21', 'X21', '43', '44', '45'],
    'a19': ['1', '2', '308', '309', '19', '35', '36'],
    'a167': ['21', '22', 'X21', '50', '6', '7'],
    'a1058': ['1', '2', '308', '309', '311', '317'],
    'a184': ['25', '28', '29', '93', '94'],
    'a690': ['61', '62', '63', '64', '65']
  };
  
  for (const [road, routeList] of Object.entries(roadMappings)) {
    if (text.includes(road)) {
      routeList.forEach(route => routes.add(route));
    }
  }
  
  return Array.from(routes).sort();
}

function isInNorthEast(location) {
  // Your existing North East filtering
  const text = location.toUpperCase();
  const keywords = [
    'A1', 'A19', 'A69', 'A167', 'A1058', 'A183', 'A184', 'A690',
    'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM', 'TYNE', 'WEAR'
  ];
  return keywords.some(keyword => text.includes(keyword));
}

// MAIN: Comprehensive Traffic Data Fetcher
export async function fetchComprehensiveTrafficData() {
  console.log('🚦 BARRY Comprehensive Traffic Intelligence System Starting...');
  console.log('📊 Fetching from: Street Manager + National Highways + HERE + MapQuest');
  
  const startTime = Date.now();
  
  // Fetch from all traffic APIs in parallel (keeping existing Street Manager + National Highways)
  const [hereResult, mapquestResult, nationalHighwaysResult] = await Promise.allSettled([
    fetchHereTrafficData(),
    fetchMapQuestTrafficData(), 
    fetchEnhancedNationalHighways()
  ]);
  
  // Combine results
  const allTrafficAlerts = [];
  let totalApiCalls = 0;
  const sourceStatus = {};
  
  // HERE results
  if (hereResult.status === 'fulfilled' && hereResult.value.success) {
    allTrafficAlerts.push(...hereResult.value.data);
    totalApiCalls += hereResult.value.apiCalls || 0;
    sourceStatus.here = { success: true, count: hereResult.value.data.length, apiCalls: hereResult.value.apiCalls };
  } else {
    sourceStatus.here = { success: false, count: 0, error: hereResult.reason?.message || 'Failed' };
  }
  
  // MapQuest results
  if (mapquestResult.status === 'fulfilled' && mapquestResult.value.success) {
    allTrafficAlerts.push(...mapquestResult.value.data);
    totalApiCalls += mapquestResult.value.apiCalls || 0;
    sourceStatus.mapquest = { success: true, count: mapquestResult.value.data.length, apiCalls: mapquestResult.value.apiCalls };
  } else {
    sourceStatus.mapquest = { success: false, count: 0, error: mapquestResult.reason?.message || 'Failed' };
  }
  
  // National Highways results
  if (nationalHighwaysResult.status === 'fulfilled' && nationalHighwaysResult.value.success) {
    allTrafficAlerts.push(...nationalHighwaysResult.value.data);
    sourceStatus.nationalHighways = { success: true, count: nationalHighwaysResult.value.data.length };
  } else {
    sourceStatus.nationalHighways = { success: false, count: 0, error: nationalHighwaysResult.reason?.message || 'Failed' };
  }
  
  // Remove duplicates and sort by priority
  const uniqueAlerts = removeDuplicateAlerts(allTrafficAlerts);
  const sortedAlerts = sortAlertsByPriority(uniqueAlerts);
  
  const processingTime = Date.now() - startTime;
  
  // Save comprehensive traffic data
  await saveTrafficData(sortedAlerts, 'comprehensive-traffic-data.json');
  
  const successfulSources = Object.values(sourceStatus).filter(s => s.success).length;
  
  console.log(`🎯 Comprehensive Traffic Summary:`);
  console.log(`   📊 Total Alerts: ${sortedAlerts.length}`);
  console.log(`   ✅ Successful Sources: ${successfulSources}/3`);
  console.log(`   📞 Total API Calls: ${totalApiCalls}`);
  console.log(`   ⏱️ Processing Time: ${processingTime}ms`);
  
  return {
    success: successfulSources > 0,
    alerts: sortedAlerts,
    metadata: {
      totalAlerts: sortedAlerts.length,
      sources: {
        here: {
          method: 'HERE Traffic API v7',
          features: ['traffic_flow', 'incidents', 'lane_precision', 'jam_factor'],
          ...sourceStatus.here
        },
        mapquest: {
          method: 'MapQuest Traffic API v2', 
          features: ['traffic_incidents', 'detailed_descriptions', 'market_coverage'],
          ...sourceStatus.mapquest
        },
        nationalHighways: {
          method: 'National Highways DATEX II API',
          features: ['major_road_incidents', 'planned_closures', 'roadworks'],
          ...sourceStatus.nationalHighways
        },
        // Note: Street Manager data integrated via existing loadStreetManagerData()
        streetManager: {
          method: 'AWS SNS Webhooks + Stored Files',
          features: ['local_authority_roadworks', 'street_works'],
          note: 'Integrated via existing fetchUnifiedAlertsData()'
        }
      },
      statistics: {
        totalIncidents: sortedAlerts.filter(a => a.type === 'incident').length,
        totalCongestion: sortedAlerts.filter(a => a.type === 'congestion').length,
        totalRoadworks: sortedAlerts.filter(a => a.type === 'roadwork').length,
        activeAlerts: sortedAlerts.filter(a => a.status === 'red').length,
        upcomingAlerts: sortedAlerts.filter(a => a.status === 'amber').length,
        highSeverity: sortedAlerts.filter(a => a.severity === 'High').length,
        
        // Traffic-specific statistics
        severeTraffic: sortedAlerts.filter(a => a.congestionLevel >= 8).length,
        moderateTraffic: sortedAlerts.filter(a => a.congestionLevel >= 5 && a.congestionLevel < 8).length,
        averageDelay: Math.round(
          sortedAlerts
            .filter(a => a.delayMinutes && a.delayMinutes > 0)
            .reduce((sum, a) => sum + a.delayMinutes, 0) / 
          sortedAlerts.filter(a => a.delayMinutes && a.delayMinutes > 0).length || 0
        ),
        
        // API usage tracking
        totalApiCalls: totalApiCalls,
        hereApiCalls: sourceStatus.here.apiCalls || 0,
        mapquestApiCalls: sourceStatus.mapquest.apiCalls || 0
      },
      apiUsage: {
        here: {
          used: sourceStatus.here.apiCalls || 0,
          limit: 1000, // monthly
          percentage: Math.round(((sourceStatus.here.apiCalls || 0) / 1000) * 100)
        },
        mapquest: {
          used: sourceStatus.mapquest.apiCalls || 0,
          limit: 15000, // monthly
          percentage: Math.round(((sourceStatus.mapquest.apiCalls || 0) / 15000) * 100)
        }
      },
      processingTime: `${processingTime}ms`,
      lastUpdated: new Date().toISOString()
    }
  };
}

function removeDuplicateAlerts(alerts) {
  const seen = new Map();
  return alerts.filter(alert => {
    // Create unique key based on location, type, and description
    const key = `${alert.type}_${alert.location}_${alert.title}`.toLowerCase().replace(/\s+/g, '_');
    if (seen.has(key)) {
      return false;
    }
    seen.set(key, true);
    return true;
  });
}

function sortAlertsByPriority(alerts) {
  return alerts.sort((a, b) => {
    // Priority: incidents > congestion > roadworks
    const typePriority = { incident: 4, congestion: 3, roadwork: 2, unknown: 1 };
    const statusPriority = { red: 3, amber: 2, green: 1 };
    const severityPriority = { High: 3, Medium: 2, Low: 1 };
    
    const aTypeScore = typePriority[a.type] || 1;
    const bTypeScore = typePriority[b.type] || 1;
    
    if (aTypeScore !== bTypeScore) return bTypeScore - aTypeScore;
    
    const aStatusScore = statusPriority[a.status] || 0;
    const bStatusScore = statusPriority[b.status] || 0;
    
    if (aStatusScore !== bStatusScore) return bStatusScore - aStatusScore;
    
    const aSeverityScore = severityPriority[a.severity] || 0;
    const bSeverityScore = severityPriority[b.severity] || 0;
    
    if (aSeverityScore !== bSeverityScore) return bSeverityScore - aSeverityScore;
    
    // Final sort by congestion level or delay
    const aCongestion = a.congestionLevel || 0;
    const bCongestion = b.congestionLevel || 0;
    
    return bCongestion - aCongestion;
  });
}

async function saveTrafficData(alerts, filename = 'traffic-data.json') {
  try {
    const dataDir = path.join(__dirname, 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    const filePath = path.join(dataDir, filename);
    await fs.writeFile(filePath, JSON.stringify(alerts, null, 2));
    
    console.log(`💾 Saved ${alerts.length} traffic alerts to ${filename}`);
  } catch (error) {
    console.warn('⚠️ Could not save traffic data:', error.message);
  }
}

export default fetchComprehensiveTrafficData;