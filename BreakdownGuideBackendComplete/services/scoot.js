// backend/services/scoot.js
// SCOOT Traffic Intelligence Integration for Go BARRY
// Provides real-time congestion, speed, and travel time data for North East England

import axios from 'axios';
import { getBoundsForAPI, getRegionForCoordinates, isWithinCoverage } from '../config/geographicBounds.js';

// SCOOT site mappings for Go North East coverage area
// These are the key SCOOT sites that monitor roads used by Go North East routes
const SCOOT_SITES_OF_INTEREST = {
  // Major A-roads and motorways affecting Go North East
  A1_GATESHEAD: ['N0501', 'N0502', 'N0503'],
  A19_SILVERLINK: ['N0511', 'N0512', 'N0513'], 
  A167_DURHAM_RD: ['N0521', 'N0522'],
  A184_FELLING_BYPASS: ['N0531', 'N0532'],
  A692_STANLEY: ['N0541', 'N0542'],
  TYNE_BRIDGE: ['N0551'],
  REDHEUGH_BRIDGE: ['N0552'],
  
  // City center monitoring points
  NEWCASTLE_CITY: ['N0561', 'N0562', 'N0563'],
  GATESHEAD_CENTER: ['N0571', 'N0572'],
  
  // Major bus route corridors
  COAST_ROAD_A1058: ['N0581', 'N0582'],
  GREAT_NORTH_RD: ['N0591', 'N0592']
};

// Flatten all site codes for API requests
const ALL_MONITORED_SITES = Object.values(SCOOT_SITES_OF_INTEREST).flat();

// Congestion severity thresholds
const CONGESTION_THRESHOLDS = {
  LOW: 15,     // 15% congestion
  MEDIUM: 30,  // 30% congestion  
  HIGH: 50,    // 50% congestion
  SEVERE: 70   // 70% congestion
};

// Speed thresholds (km/h)
const SPEED_THRESHOLDS = {
  SEVERE_DELAY: 10,    // Severe delays <10 km/h
  MAJOR_DELAY: 20,     // Major delays <20 km/h
  MINOR_DELAY: 30,     // Minor delays <30 km/h
  FREE_FLOW: 50        // Free flow >50 km/h
};

// Helper function to determine congestion severity
function getCongestionSeverity(congestionPercent) {
  if (congestionPercent >= CONGESTION_THRESHOLDS.SEVERE) return 'Severe';
  if (congestionPercent >= CONGESTION_THRESHOLDS.HIGH) return 'High';
  if (congestionPercent >= CONGESTION_THRESHOLDS.MEDIUM) return 'Medium';
  if (congestionPercent >= CONGESTION_THRESHOLDS.LOW) return 'Low';
  return 'Normal';
}

// Helper function to determine speed-based alert level
function getSpeedAlertLevel(averageSpeed) {
  if (averageSpeed <= SPEED_THRESHOLDS.SEVERE_DELAY) return 'Severe';
  if (averageSpeed <= SPEED_THRESHOLDS.MAJOR_DELAY) return 'High';
  if (averageSpeed <= SPEED_THRESHOLDS.MINOR_DELAY) return 'Medium';
  return 'Normal';
}

// Helper function to map SCOOT site to location name
function getSiteLocationName(systemCodeNumber) {
  // Map known SCOOT sites to readable location names
  const siteLocationMap = {
    'N0501': 'A1 Gateshead (Southbound)',
    'N0502': 'A1 Gateshead (Northbound)', 
    'N0511': 'A19 Silverlink Roundabout',
    'N0512': 'A19 Coast Road Junction',
    'N0521': 'A167 Durham Road (Newcastle)',
    'N0522': 'A167 Durham Road (Gateshead)',
    'N0531': 'A184 Felling Bypass',
    'N0532': 'A184 Heworth Roundabout',
    'N0541': 'A692 Stanley Road',
    'N0551': 'Tyne Bridge',
    'N0552': 'Redheugh Bridge',
    'N0561': 'Newcastle City Centre (Grey Street)',
    'N0562': 'Newcastle City Centre (Clayton Street)',
    'N0571': 'Gateshead High Street',
    'N0581': 'Coast Road A1058',
    'N0591': 'Great North Road'
  };
  
  return siteLocationMap[systemCodeNumber] || `SCOOT Site ${systemCodeNumber}`;
}

// Helper function to determine affected Go North East routes
function getAffectedRoutes(systemCodeNumber, severity) {
  // Map SCOOT sites to Go North East routes that use those roads
  const routeMapping = {
    'N0501': ['21', 'X21', '25', '28', '28B'], // A1 Gateshead
    'N0502': ['21', 'X21', '25', '28', '28B'],
    'N0511': ['1', '2', '307', '309', '317'],  // A19 Silverlink
    'N0512': ['1', '2', '307', '309'],
    'N0521': ['21', '22', 'X21', '6', '50'],   // A167 Durham Road
    'N0522': ['21', '22', 'X21', '6', '50'],
    'N0531': ['53', '54', '56', '57', '58'],   // A184 Felling
    'N0541': ['X30', 'X31', '74', '84', '85'], // A692 Stanley
    'N0551': ['Q3', 'Q3X', '10', '12', '21', '22'], // Tyne Bridge
    'N0552': ['Q3', 'Q3X', '10', '12'],       // Redheugh Bridge
    'N0561': ['Q3', 'Q3X', '10', '12', '21', '22', '56'], // Newcastle Centre
    'N0562': ['Q3', 'Q3X', '10', '12', '21', '22'],
    'N0571': ['10', '10A', '10B', '27', '28'], // Gateshead
    'N0581': ['1', '2', '307', '309'],         // Coast Road
    'N0591': ['43', '44', '45', '52']          // Great North Road
  };
  
  // Only return routes if congestion is significant enough to affect services
  if (severity === 'Normal' || severity === 'Low') {
    return [];
  }
  
  return routeMapping[systemCodeNumber] || [];
}

// Main function to fetch SCOOT dynamic traffic data
async function fetchSCOOTTrafficData() {
  try {
    console.log('🚦 [SCOOT] Fetching real-time traffic intelligence from SCOOT network...');
    
    // Note: Using demo endpoint format - replace with actual API when available
    const response = await axios.get('https://www.netraveldata.co.uk/api/v2/scoot/dynamic', {
      timeout: 15000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0-SCOOT',
        'Accept': 'application/json',
        // Add API key header when available
        // 'Authorization': `Bearer ${process.env.NE_TRAVEL_DATA_API_KEY}`
      }
    });
    
    console.log(`📡 [SCOOT] Response: ${response.status}, sites: ${response.data?.length || 0}`);
    
    if (!response.data || !Array.isArray(response.data)) {
      console.log('⚠️ SCOOT returned no data or invalid format');
      return { success: true, data: [], method: 'SCOOT API - No data available' };
    }
    
    const alerts = [];
    let processedSites = 0;
    
    // Process each SCOOT site
    for (const site of response.data) {
      try {
        const { systemCodeNumber, dynamics } = site;
        
        // Only process sites we're interested in (within Go North East coverage)
        if (!ALL_MONITORED_SITES.includes(systemCodeNumber) && dynamics && dynamics.length > 0) {
          continue;
        }
        
        // Process dynamics for this site
        for (const dynamic of dynamics) {
          const {
            congestionPercent,
            currentFlow,
            averageSpeed,
            linkStatus,
            linkTravelTime,
            lastUpdated
          } = dynamic;
          
          // Skip if data is too old (>30 minutes)
          const dataAge = new Date() - new Date(lastUpdated);
          if (dataAge > 30 * 60 * 1000) {
            continue;
          }
          
          // Skip if link status is suspect
          if (linkStatus === 1) {
            continue;
          }
          
          const congestionSeverity = getCongestionSeverity(congestionPercent);
          const speedSeverity = getSpeedAlertLevel(averageSpeed);
          const locationName = getSiteLocationName(systemCodeNumber);
          
          // Only create alerts for significant congestion or speed issues
          if (congestionSeverity !== 'Normal' || speedSeverity !== 'Normal') {
            const affectedRoutes = getAffectedRoutes(systemCodeNumber, congestionSeverity);
            
            // Determine overall alert severity
            let alertSeverity = 'Low';
            if (congestionSeverity === 'Severe' || speedSeverity === 'Severe') {
              alertSeverity = 'High';
            } else if (congestionSeverity === 'High' || speedSeverity === 'High') {
              alertSeverity = 'Medium';
            }
            
            // Create traffic intelligence alert
            const alert = {
              id: `scoot_${systemCodeNumber}_${Date.now()}`,
              type: 'congestion',
              title: `Traffic Congestion - ${locationName}`,
              description: `${congestionPercent}% congestion, average speed ${averageSpeed} km/h${linkTravelTime ? `, travel time ${linkTravelTime}s` : ''}`,
              location: locationName,
              severity: alertSeverity,
              status: alertSeverity === 'High' ? 'red' : 'amber',
              source: 'scoot',
              affectsRoutes: affectedRoutes,
              routeMatchMethod: 'SCOOT Site Mapping',
              
              // SCOOT-specific data
              scootData: {
                systemCodeNumber,
                congestionPercent,
                averageSpeed,
                currentFlow,
                linkTravelTime,
                congestionSeverity,
                speedSeverity
              },
              
              // Enhanced metadata
              dataSource: 'SCOOT Traffic Intelligence Network',
              lastUpdated: lastUpdated,
              dataAge: Math.round(dataAge / 1000 / 60), // Age in minutes
              coordinates: null, // TODO: Add SCOOT site coordinates if available
              
              // Alert categorization
              category: 'traffic_intelligence',
              subcategory: congestionPercent > 50 ? 'severe_congestion' : 'moderate_congestion'
            };
            
            alerts.push(alert);
            processedSites++;
          }
        }
      } catch (siteError) {
        console.warn(`⚠️ Error processing SCOOT site ${site.systemCodeNumber}:`, siteError.message);
      }
    }
    
    console.log(`✅ [SCOOT] Processed ${processedSites} sites, generated ${alerts.length} traffic intelligence alerts`);
    
    return {
      success: true,
      data: alerts,
      method: 'SCOOT Real-time Traffic Intelligence',
      metadata: {
        sitesMonitored: ALL_MONITORED_SITES.length,
        sitesProcessed: processedSites,
        alertsGenerated: alerts.length,
        dataSource: 'North East Travel Data SCOOT Network',
        coverage: 'Go North East route corridors'
      }
    };
    
  } catch (error) {
    console.error('❌ [SCOOT] Traffic intelligence fetch failed:', error.message);
    
    // Check if it's an authentication error
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('🔑 SCOOT API authentication required - check API key configuration');
    }
    
    return {
      success: false,
      data: [],
      error: error.message,
      errorType: error.response?.status === 401 ? 'authentication' : 'network',
      requiresApiKey: error.response?.status === 401
    };
  }
}

// Function to get SCOOT statistics for monitoring
function getSCOOTStats() {
  return {
    monitoredSites: ALL_MONITORED_SITES.length,
    roadCorridos: Object.keys(SCOOT_SITES_OF_INTEREST).length,
    congestionThresholds: CONGESTION_THRESHOLDS,
    speedThresholds: SPEED_THRESHOLDS,
    updateFrequency: '5 minutes',
    coverage: 'Major roads used by Go North East routes'
  };
}

export { 
  fetchSCOOTTrafficData,
  getSCOOTStats,
  SCOOT_SITES_OF_INTEREST,
  CONGESTION_THRESHOLDS,
  SPEED_THRESHOLDS
};

export default { 
  fetchSCOOTTrafficData,
  getSCOOTStats
};
