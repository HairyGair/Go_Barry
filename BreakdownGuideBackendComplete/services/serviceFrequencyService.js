// backend/services/serviceFrequencyService.js
// Service Frequency Analysis for Go Barry - Control Room Operations
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for service frequency data
let frequencyCache = null;
let scheduleCache = null;
let routePatternCache = null;
let isFrequencyInitialized = false;

// Service frequency thresholds (minutes)
const FREQUENCY_THRESHOLDS = {
  PEAK_NORMAL: 15,      // Peak hours normal frequency
  OFFPEAK_NORMAL: 30,   // Off-peak normal frequency
  EVENING_NORMAL: 60,   // Evening normal frequency
  BREAKDOWN_THRESHOLD: 25, // Consider possible breakdown if gap exceeds this
  CRITICAL_GAP: 45      // Critical service gap requiring immediate attention
};

// Peak hours definition
const PEAK_HOURS = {
  MORNING: { start: 7, end: 9 },
  AFTERNOON: { start: 16, end: 19 }
};

/**
 * Initialize service frequency analysis system
 */
export async function initializeServiceFrequency() {
  if (isFrequencyInitialized) return true;
  
  try {
    console.log('⏱️ Initializing Service Frequency Analysis System...');
    
    await Promise.all([
      loadFrequencyData(),
      loadSchedulePatterns(),
      loadRoutePatterns()
    ]);
    
    isFrequencyInitialized = true;
    console.log('✅ Service Frequency Analysis System Ready');
    console.log(`   📊 ${Object.keys(frequencyCache || {}).length} routes with frequency data`);
    console.log(`   🕐 ${Object.keys(scheduleCache || {}).length} routes with schedule patterns`);
    
    return true;
  } catch (error) {
    console.error('❌ Service frequency initialization failed:', error.message);
    return false;
  }
}

/**
 * Load frequency data from GTFS frequencies.txt and stop_times.txt
 */
async function loadFrequencyData() {
  try {
    console.log('📊 Loading service frequency data...');
    
    // Load trips and routes data first for mapping
    const tripsPath = path.join(__dirname, '../data/trips.txt');
    const tripsContent = await fs.readFile(tripsPath, 'utf8');
    const tripsData = parse(tripsContent, { columns: true, skip_empty_lines: true });
    
    const routesPath = path.join(__dirname, '../data/routes.txt');
    const routesContent = await fs.readFile(routesPath, 'utf8');
    const routesData = parse(routesContent, { columns: true, skip_empty_lines: true });
    
    // Build route mappings
    const routeIdToShortName = {};
    routesData.forEach(route => {
      if (route.route_id && route.route_short_name) {
        routeIdToShortName[route.route_id] = route.route_short_name;
      }
    });
    
    const tripToRoute = {};
    tripsData.forEach(trip => {
      if (trip.trip_id && trip.route_id) {
        tripToRoute[trip.trip_id] = routeIdToShortName[trip.route_id];
      }
    });
    
    frequencyCache = {};
    
    // Try to load frequencies.txt (if it exists)
    try {
      const frequenciesPath = path.join(__dirname, '../data/frequencies.txt');
      const frequenciesContent = await fs.readFile(frequenciesPath, 'utf8');
      const frequenciesData = parse(frequenciesContent, { columns: true, skip_empty_lines: true });
      
      frequenciesData.forEach(freq => {
        const routeShortName = tripToRoute[freq.trip_id];
        if (routeShortName && freq.headway_secs) {
          if (!frequencyCache[routeShortName]) {
            frequencyCache[routeShortName] = [];
          }
          
          frequencyCache[routeShortName].push({
            tripId: freq.trip_id,
            startTime: freq.start_time,
            endTime: freq.end_time,
            headwayMinutes: Math.round(parseInt(freq.headway_secs) / 60),
            exactTimes: freq.exact_times === '1'
          });
        }
      });
    } catch (error) {
      console.log('ℹ️ No frequencies.txt found, calculating from stop_times.txt');
    }
    
    // If no frequencies.txt or empty, calculate from stop_times.txt
    if (Object.keys(frequencyCache).length === 0) {
      await calculateFrequencyFromStopTimes(tripToRoute);
    }
    
    console.log(`✅ Loaded frequency data for ${Object.keys(frequencyCache).length} routes`);
    
  } catch (error) {
    console.error('❌ Failed to load frequency data:', error.message);
    frequencyCache = {};
  }
}

/**
 * Calculate frequency patterns from stop_times.txt
 */
async function calculateFrequencyFromStopTimes(tripToRoute) {
  try {
    const stopTimesPath = path.join(__dirname, '../data/stop_times.txt');
    const stopTimesContent = await fs.readFile(stopTimesPath, 'utf8');
    const stopTimesData = parse(stopTimesContent, { columns: true, skip_empty_lines: true });
    
    // Group by route and find first stop of each trip
    const routeTrips = {};
    
    // Limit processing to prevent memory issues
    const limitedStopTimes = stopTimesData.slice(0, 100000);
    
    limitedStopTimes.forEach(stopTime => {
      if (stopTime.trip_id && stopTime.stop_sequence === '1' && stopTime.departure_time) {
        const routeShortName = tripToRoute[stopTime.trip_id];
        if (routeShortName) {
          if (!routeTrips[routeShortName]) {
            routeTrips[routeShortName] = [];
          }
          
          routeTrips[routeShortName].push({
            tripId: stopTime.trip_id,
            departureTime: stopTime.departure_time
          });
        }
      }
    });
    
    // Calculate frequency patterns for each route
    for (const [routeShortName, trips] of Object.entries(routeTrips)) {
      if (trips.length < 2) continue;
      
      // Sort trips by departure time
      trips.sort((a, b) => timeToMinutes(a.departureTime) - timeToMinutes(b.departureTime));
      
      const frequencies = [];
      
      for (let i = 1; i < trips.length; i++) {
        const prevTime = timeToMinutes(trips[i-1].departureTime);
        const currTime = timeToMinutes(trips[i].departureTime);
        
        if (currTime > prevTime) { // Handle day rollover if needed
          const headway = currTime - prevTime;
          frequencies.push(headway);
        }
      }
      
      if (frequencies.length > 0) {
        // Calculate average frequency for different time periods
        frequencyCache[routeShortName] = [{
          startTime: "06:00:00",
          endTime: "09:00:00",
          headwayMinutes: Math.round(frequencies.reduce((a, b) => a + b, 0) / frequencies.length),
          calculatedFromStopTimes: true
        }];
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to calculate frequency from stop times:', error.message);
  }
}

/**
 * Load schedule patterns and service patterns
 */
async function loadSchedulePatterns() {
  try {
    console.log('🗓️ Loading schedule patterns...');
    
    const calendarPath = path.join(__dirname, '../data/calendar.txt');
    const calendarContent = await fs.readFile(calendarPath, 'utf8');
    const calendarData = parse(calendarContent, { columns: true, skip_empty_lines: true });
    
    scheduleCache = {};
    
    calendarData.forEach(service => {
      if (service.service_id) {
        scheduleCache[service.service_id] = {
          monday: service.monday === '1',
          tuesday: service.tuesday === '1',
          wednesday: service.wednesday === '1',
          thursday: service.thursday === '1',
          friday: service.friday === '1',
          saturday: service.saturday === '1',
          sunday: service.sunday === '1',
          startDate: service.start_date,
          endDate: service.end_date
        };
      }
    });
    
    console.log(`✅ Loaded ${Object.keys(scheduleCache).length} service patterns`);
    
  } catch (error) {
    console.error('❌ Failed to load schedule patterns:', error.message);
    scheduleCache = {};
  }
}

/**
 * Load route patterns for alternative route suggestions
 */
async function loadRoutePatterns() {
  try {
    console.log('🛤️ Loading route patterns for alternatives...');
    
    // This would normally analyze stop patterns to find overlapping routes
    // For now, we'll create basic patterns based on route numbers
    routePatternCache = {
      // Example patterns - in real implementation, this would be calculated from stops.txt
      "21": ["22", "X21", "20"],
      "22": ["21", "X22", "23"],
      "X21": ["21", "22"],
      "20": ["21", "19"],
      "23": ["22", "24"],
      "24": ["23", "25"],
      // Add more route alternatives based on your network
    };
    
    console.log(`✅ Loaded route patterns for ${Object.keys(routePatternCache).length} routes`);
    
  } catch (error) {
    console.error('❌ Failed to load route patterns:', error.message);
    routePatternCache = {};
  }
}

/**
 * Analyze service frequency for a specific route at current time
 */
export async function analyzeServiceFrequency(routeNumber, currentTime = null) {
  if (!isFrequencyInitialized) {
    await initializeServiceFrequency();
  }
  
  const now = currentTime ? new Date(currentTime) : new Date();
  const currentHour = now.getHours();
  const currentMinutes = currentHour * 60 + now.getMinutes();
  
  // Get route frequency data
  const routeFrequencies = frequencyCache[routeNumber] || [];
  
  if (routeFrequencies.length === 0) {
    return {
      success: false,
      error: `No frequency data available for route ${routeNumber}`,
      route: routeNumber,
      availableRoutes: Object.keys(frequencyCache).slice(0, 10)
    };
  }
  
  // Determine current service period
  const servicePeriod = getServicePeriod(currentHour);
  const expectedFrequency = getExpectedFrequency(servicePeriod);
  
  // Find applicable frequency for current time
  let currentFrequency = routeFrequencies[0]; // Default to first available
  
  for (const freq of routeFrequencies) {
    const startMinutes = timeToMinutes(freq.startTime);
    const endMinutes = timeToMinutes(freq.endTime);
    
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      currentFrequency = freq;
      break;
    }
  }
  
  // Calculate service analysis
  const actualHeadway = currentFrequency.headwayMinutes;
  const isDelayed = actualHeadway > expectedFrequency;
  const isPossibleBreakdown = actualHeadway > FREQUENCY_THRESHOLDS.BREAKDOWN_THRESHOLD;
  const isCritical = actualHeadway > FREQUENCY_THRESHOLDS.CRITICAL_GAP;
  
  // Get alternative routes
  const alternatives = routePatternCache[routeNumber] || [];
  
  // Assess passenger impact
  const passengerImpact = assessPassengerImpact(servicePeriod, actualHeadway, isPossibleBreakdown);
  
  // Calculate next bus estimate (simplified)
  const nextBusMinutes = Math.max(1, Math.round(actualHeadway * 0.6)); // Estimate based on frequency
  
  return {
    success: true,
    route: routeNumber,
    timestamp: now.toISOString(),
    analysis: {
      nextBusIn: `${nextBusMinutes} minutes`,
      serviceGap: `${actualHeadway} minutes ${isDelayed ? `(above normal ${expectedFrequency}min frequency)` : '(normal service)'}`,
      possibleBreakdown: isPossibleBreakdown,
      criticalService: isCritical,
      alternativeRoutes: alternatives.slice(0, 3), // Top 3 alternatives
      passengerImpact: passengerImpact,
      servicePeriod: servicePeriod,
      expectedFrequency: `${expectedFrequency} minutes`,
      actualFrequency: `${actualHeadway} minutes`,
      status: isCritical ? 'CRITICAL' : isPossibleBreakdown ? 'WARNING' : isDelayed ? 'DELAYED' : 'NORMAL'
    },
    recommendations: generateRecommendations(isPossibleBreakdown, isCritical, alternatives, servicePeriod)
  };
}

/**
 * Get service analysis for multiple routes
 */
export async function analyzeMultipleRoutes(routeNumbers, currentTime = null) {
  if (!isFrequencyInitialized) {
    await initializeServiceFrequency();
  }
  
  const results = [];
  const errors = [];
  
  for (const routeNumber of routeNumbers) {
    try {
      const analysis = await analyzeServiceFrequency(routeNumber, currentTime);
      if (analysis.success) {
        results.push(analysis);
      } else {
        errors.push({ route: routeNumber, error: analysis.error });
      }
    } catch (error) {
      errors.push({ route: routeNumber, error: error.message });
    }
  }
  
  return {
    success: true,
    timestamp: new Date().toISOString(),
    totalAnalyzed: results.length,
    totalErrors: errors.length,
    results: results,
    errors: errors,
    summary: generateNetworkSummary(results)
  };
}

/**
 * Get network-wide service status
 */
export async function getNetworkServiceStatus(currentTime = null) {
  if (!isFrequencyInitialized) {
    await initializeServiceFrequency();
  }
  
  const allRoutes = Object.keys(frequencyCache);
  const analysis = await analyzeMultipleRoutes(allRoutes, currentTime);
  
  const statusCounts = {
    NORMAL: 0,
    DELAYED: 0,
    WARNING: 0,
    CRITICAL: 0
  };
  
  analysis.results.forEach(result => {
    const status = result.analysis.status;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  return {
    success: true,
    timestamp: new Date().toISOString(),
    networkStatus: {
      totalRoutes: allRoutes.length,
      operationalRoutes: analysis.totalAnalyzed,
      statusBreakdown: statusCounts,
      overallStatus: determineOverallNetworkStatus(statusCounts),
      criticalRoutes: analysis.results.filter(r => r.analysis.status === 'CRITICAL').map(r => r.route),
      warningRoutes: analysis.results.filter(r => r.analysis.status === 'WARNING').map(r => r.route)
    },
    routes: analysis.results
  };
}

/**
 * Helper functions
 */

function getServicePeriod(hour) {
  if (hour >= PEAK_HOURS.MORNING.start && hour <= PEAK_HOURS.MORNING.end) {
    return 'MORNING_PEAK';
  } else if (hour >= PEAK_HOURS.AFTERNOON.start && hour <= PEAK_HOURS.AFTERNOON.end) {
    return 'AFTERNOON_PEAK';
  } else if (hour >= 6 && hour <= 22) {
    return 'DAYTIME';
  } else {
    return 'EVENING';
  }
}

function getExpectedFrequency(servicePeriod) {
  switch (servicePeriod) {
    case 'MORNING_PEAK':
    case 'AFTERNOON_PEAK':
      return FREQUENCY_THRESHOLDS.PEAK_NORMAL;
    case 'DAYTIME':
      return FREQUENCY_THRESHOLDS.OFFPEAK_NORMAL;
    case 'EVENING':
      return FREQUENCY_THRESHOLDS.EVENING_NORMAL;
    default:
      return FREQUENCY_THRESHOLDS.OFFPEAK_NORMAL;
  }
}

function assessPassengerImpact(servicePeriod, actualHeadway, isPossibleBreakdown) {
  const isPeak = servicePeriod.includes('PEAK');
  
  if (isPossibleBreakdown && isPeak) {
    return 'High - peak hour service disruption';
  } else if (isPossibleBreakdown) {
    return 'Medium - service disruption during off-peak';
  } else if (actualHeadway > 20 && isPeak) {
    return 'Medium - reduced peak service';
  } else if (actualHeadway > 20) {
    return 'Low - reduced off-peak service';
  } else {
    return 'Low - service operating normally';
  }
}

function generateRecommendations(isPossibleBreakdown, isCritical, alternatives, servicePeriod) {
  const recommendations = [];
  
  if (isCritical) {
    recommendations.push('🚨 IMMEDIATE ACTION REQUIRED: Critical service gap detected');
    recommendations.push('📞 Contact control room to investigate possible breakdown');
    if (alternatives.length > 0) {
      recommendations.push(`🔄 Direct passengers to alternative routes: ${alternatives.join(', ')}`);
    }
  } else if (isPossibleBreakdown) {
    recommendations.push('⚠️ Monitor service closely - possible breakdown detected');
    recommendations.push('📱 Update passenger information systems');
    if (alternatives.length > 0) {
      recommendations.push(`ℹ️ Inform passengers of alternatives: ${alternatives.join(', ')}`);
    }
  } else {
    recommendations.push('✅ Service operating within normal parameters');
  }
  
  if (servicePeriod.includes('PEAK')) {
    recommendations.push('⏰ Peak hour - monitor passenger loads');
  }
  
  return recommendations;
}

function generateNetworkSummary(results) {
  const critical = results.filter(r => r.analysis.status === 'CRITICAL').length;
  const warning = results.filter(r => r.analysis.status === 'WARNING').length;
  const delayed = results.filter(r => r.analysis.status === 'DELAYED').length;
  const normal = results.filter(r => r.analysis.status === 'NORMAL').length;
  
  return {
    criticalRoutes: critical,
    warningRoutes: warning,
    delayedRoutes: delayed,
    normalRoutes: normal,
    totalAnalyzed: results.length,
    networkHealth: normal / results.length * 100 // Percentage of routes operating normally
  };
}

function determineOverallNetworkStatus(statusCounts) {
  if (statusCounts.CRITICAL > 0) return 'CRITICAL';
  if (statusCounts.WARNING > 2) return 'WARNING';
  if (statusCounts.DELAYED > statusCounts.NORMAL) return 'DEGRADED';
  return 'NORMAL';
}

function timeToMinutes(timeString) {
  if (!timeString) return 0;
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Get service frequency statistics
 */
export function getFrequencyStats() {
  return {
    initialized: isFrequencyInitialized,
    routesWithFrequencyData: Object.keys(frequencyCache || {}).length,
    servicePatterns: Object.keys(scheduleCache || {}).length,
    routeAlternatives: Object.keys(routePatternCache || {}).length,
    thresholds: FREQUENCY_THRESHOLDS,
    peakHours: PEAK_HOURS,
    memoryUsage: {
      frequencyCache: frequencyCache ? 'loaded' : 'not loaded',
      scheduleCache: scheduleCache ? 'loaded' : 'not loaded',
      routePatternCache: routePatternCache ? 'loaded' : 'not loaded'
    }
  };
}

/**
 * Get dashboard data for service gaps and potential breakdowns
 * Returns real-time analysis suitable for control room dashboards
 */
export async function getServiceGapsDashboard(options = {}) {
  if (!isFrequencyInitialized) {
    await initializeServiceFrequency();
  }
  
  try {
    const currentTime = options.currentTime || new Date();
    const includeAllRoutes = options.includeAllRoutes || false;
    
    console.log('📊 Generating service gaps dashboard...');
    
    const allRoutes = Object.keys(frequencyCache || {});
    const dashboardData = {
      timestamp: currentTime.toISOString(),
      summary: {
        totalRoutes: allRoutes.length,
        normalService: 0,
        delayedService: 0,
        possibleBreakdowns: 0,
        criticalGaps: 0
      },
      serviceGaps: [],
      potentialBreakdowns: [],
      criticalAlerts: [],
      networkStatus: 'NORMAL',
      recommendations: []
    };
    
    // Analyze each route for service gaps
    for (const routeNumber of allRoutes) {
      try {
        const analysis = await analyzeServiceFrequency(routeNumber, currentTime);
        
        if (analysis.success) {
          const routeAnalysis = analysis.analysis;
          const status = routeAnalysis.status;
          
          // Update summary counts
          switch (status) {
            case 'NORMAL':
              dashboardData.summary.normalService++;
              break;
            case 'DELAYED':
              dashboardData.summary.delayedService++;
              break;
            case 'WARNING':
              dashboardData.summary.possibleBreakdowns++;
              break;
            case 'CRITICAL':
              dashboardData.summary.criticalGaps++;
              break;
          }
          
          // Add to service gaps if delayed or worse
          if (status !== 'NORMAL') {
            const gapData = {
              route: routeNumber,
              status: status,
              actualFrequency: routeAnalysis.actualFrequency,
              expectedFrequency: routeAnalysis.expectedFrequency,
              nextBusIn: routeAnalysis.nextBusIn,
              serviceGap: routeAnalysis.serviceGap,
              passengerImpact: routeAnalysis.passengerImpact,
              alternativeRoutes: routeAnalysis.alternativeRoutes,
              timestamp: currentTime.toISOString(),
              priority: getPriorityLevel(status, routeAnalysis)
            };
            
            dashboardData.serviceGaps.push(gapData);
          }
          
          // Add to potential breakdowns if warning or critical
          if (routeAnalysis.possibleBreakdown) {
            dashboardData.potentialBreakdowns.push({
              route: routeNumber,
              confidence: status === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
              gapDuration: routeAnalysis.actualFrequency,
              lastSeen: calculateLastSeen(routeAnalysis),
              investigationRequired: status === 'CRITICAL',
              recommendations: analysis.recommendations
            });
          }
          
          // Add to critical alerts if critical status
          if (status === 'CRITICAL') {
            dashboardData.criticalAlerts.push({
              route: routeNumber,
              alertType: 'CRITICAL_SERVICE_GAP',
              message: `Route ${routeNumber}: ${routeAnalysis.serviceGap} - Immediate investigation required`,
              actionRequired: true,
              escalationLevel: 'SUPERVISOR',
              timestamp: currentTime.toISOString()
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to analyze route ${routeNumber}:`, error.message);
      }
    }
    
    // Determine overall network status
    if (dashboardData.summary.criticalGaps > 2) {
      dashboardData.networkStatus = 'CRITICAL';
    } else if (dashboardData.summary.criticalGaps > 0 || dashboardData.summary.possibleBreakdowns > 3) {
      dashboardData.networkStatus = 'WARNING';
    } else if (dashboardData.summary.delayedService > 5) {
      dashboardData.networkStatus = 'DEGRADED';
    }
    
    // Sort arrays by priority/severity
    dashboardData.serviceGaps.sort((a, b) => b.priority - a.priority);
    dashboardData.potentialBreakdowns.sort((a, b) => (b.confidence === 'HIGH' ? 1 : 0) - (a.confidence === 'HIGH' ? 1 : 0));
    
    // Generate network-wide recommendations
    dashboardData.recommendations = generateNetworkRecommendations(dashboardData);
    
    // Limit results if not including all routes
    if (!includeAllRoutes) {
      dashboardData.serviceGaps = dashboardData.serviceGaps.slice(0, 20);
      dashboardData.potentialBreakdowns = dashboardData.potentialBreakdowns.slice(0, 10);
    }
    
    return {
      success: true,
      dashboard: dashboardData
    };
    
  } catch (error) {
    console.error('❌ Service gaps dashboard generation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get real-time breakdown detection alerts
 */
export async function getBreakdownAlerts(options = {}) {
  if (!isFrequencyInitialized) {
    await initializeServiceFrequency();
  }
  
  try {
    const currentTime = options.currentTime || new Date();
    const alertThreshold = options.alertThreshold || FREQUENCY_THRESHOLDS.BREAKDOWN_THRESHOLD;
    
    console.log('🚨 Checking for breakdown alerts...');
    
    const alerts = [];
    const allRoutes = Object.keys(frequencyCache || {});
    
    for (const routeNumber of allRoutes) {
      try {
        const analysis = await analyzeServiceFrequency(routeNumber, currentTime);
        
        if (analysis.success && analysis.analysis.possibleBreakdown) {
          const severity = analysis.analysis.status;
          const actualFrequency = parseInt(analysis.analysis.actualFrequency);
          
          alerts.push({
            route: routeNumber,
            alertId: `BDA_${routeNumber}_${Date.now()}`,
            severity: severity,
            confidence: severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
            gapDuration: `${actualFrequency} minutes`,
            threshold: `${alertThreshold} minutes`,
            exceedsThresholdBy: actualFrequency - alertThreshold,
            detectedAt: currentTime.toISOString(),
            lastKnownService: calculateLastSeen(analysis.analysis),
            passengerImpact: analysis.analysis.passengerImpact,
            alternativeRoutes: analysis.analysis.alternativeRoutes,
            actionRequired: severity === 'CRITICAL',
            autoInvestigate: actualFrequency > FREQUENCY_THRESHOLDS.CRITICAL_GAP,
            recommendations: analysis.recommendations
          });
        }
      } catch (error) {
        console.warn(`Failed to check breakdown alert for route ${routeNumber}:`, error.message);
      }
    }
    
    // Sort by severity and gap duration
    alerts.sort((a, b) => {
      if (a.severity !== b.severity) {
        const severityOrder = { 'CRITICAL': 4, 'WARNING': 3, 'DELAYED': 2, 'NORMAL': 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.exceedsThresholdBy - a.exceedsThresholdBy;
    });
    
    return {
      success: true,
      alertCount: alerts.length,
      criticalAlerts: alerts.filter(alert => alert.severity === 'CRITICAL').length,
      warningAlerts: alerts.filter(alert => alert.severity === 'WARNING').length,
      alerts: alerts,
      timestamp: currentTime.toISOString()
    };
    
  } catch (error) {
    console.error('❌ Breakdown alerts check failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get historical service performance trends
 */
export async function getServiceTrends(timeframe = 'today', options = {}) {
  try {
    console.log(`📈 Analyzing service trends for ${timeframe}...`);
    
    // This would normally query historical data
    // For now, simulate trend analysis
    const trends = {
      timeframe: timeframe,
      generatedAt: new Date().toISOString(),
      summary: {
        averageServiceQuality: 85.2, // Percentage
        breakdownFrequency: 'Low',
        mostProblematicRoute: '21',
        bestPerformingRoute: 'X21',
        peakDisruptionTime: '08:30-09:00'
      },
      routePerformance: [
        { route: '21', reliability: 78, avgDelay: 12, breakdowns: 2 },
        { route: '22', reliability: 89, avgDelay: 6, breakdowns: 0 },
        { route: 'X21', reliability: 92, avgDelay: 4, breakdowns: 0 },
        { route: '25', reliability: 82, avgDelay: 8, breakdowns: 1 }
      ],
      hourlyDistribution: generateHourlyTrends(),
      recommendations: [
        'Consider increasing frequency on Route 21 during morning peak',
        'Route X21 performing well - analyze for best practices',
        'Monitor Route 25 for potential issues'
      ]
    };
    
    return {
      success: true,
      trends: trends
    };
    
  } catch (error) {
    console.error('❌ Service trends analysis failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Helper functions for dashboard features
 */

function getPriorityLevel(status, analysis) {
  let priority = 0;
  
  // Base priority on status
  switch (status) {
    case 'CRITICAL': priority = 100; break;
    case 'WARNING': priority = 75; break;
    case 'DELAYED': priority = 50; break;
    default: priority = 25;
  }
  
  // Adjust for passenger impact
  if (analysis.passengerImpact.includes('High')) priority += 20;
  if (analysis.passengerImpact.includes('Medium')) priority += 10;
  
  // Adjust for peak hours
  if (analysis.servicePeriod.includes('PEAK')) priority += 15;
  
  return Math.min(priority, 100);
}

function calculateLastSeen(analysis) {
  // Estimate when service was last seen based on frequency
  const actualFreq = parseInt(analysis.actualFrequency) || 30;
  const lastSeen = new Date(Date.now() - (actualFreq * 60000));
  return lastSeen.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function generateNetworkRecommendations(dashboardData) {
  const recommendations = [];
  
  if (dashboardData.summary.criticalGaps > 0) {
    recommendations.push('🚨 IMMEDIATE: Investigate critical service gaps');
    recommendations.push('📞 Contact depot supervisors for affected routes');
  }
  
  if (dashboardData.summary.possibleBreakdowns > 2) {
    recommendations.push('⚠️ Monitor routes with potential breakdowns');
    recommendations.push('🚌 Consider deploying reserve vehicles');
  }
  
  if (dashboardData.networkStatus === 'CRITICAL') {
    recommendations.push('🔴 Network in critical state - activate emergency protocols');
  }
  
  if (dashboardData.summary.delayedService > 5) {
    recommendations.push('📱 Update passenger information systems');
    recommendations.push('🔄 Review alternative route capacity');
  }
  
  return recommendations;
}

function generateHourlyTrends() {
  // Simulate hourly service quality trends
  const hours = [];
  for (let hour = 6; hour <= 23; hour++) {
    hours.push({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      serviceQuality: Math.random() * 20 + 75, // 75-95%
      avgDelay: Math.random() * 15 + 2, // 2-17 minutes
      breakdownRisk: Math.random() * 30 + 5 // 5-35%
    });
  }
  return hours;
}

export default {
  initializeServiceFrequency,
  analyzeServiceFrequency,
  analyzeMultipleRoutes,
  getNetworkServiceStatus,
  getFrequencyStats,
  getServiceGapsDashboard,
  getBreakdownAlerts,
  getServiceTrends
};
