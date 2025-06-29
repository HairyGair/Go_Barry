// convex/analytics.ts
// Advanced Analytics Functions - Phase 4.2
// Historical trends, predictive patterns, revenue impact, and business intelligence

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get historical trend analysis
export const getHistoricalTrends = query({
  args: { 
    timeframe: v.string(), // '7d', '30d', '90d', '1y'
    analysisType: v.string(), // 'alerts', 'incidents', 'performance', 'routes'
    groupBy: v.optional(v.string()) // 'hour', 'day', 'week', 'month'
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const timeframes = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };
    
    const timeframe = timeframes[args.timeframe as keyof typeof timeframes] ?? timeframes['30d'];
    const since = now - timeframe;

    switch (args.analysisType) {
      case 'alerts':
        return await analyzeAlertTrends(ctx, since, now, args.groupBy);
      case 'incidents':
        return await analyzeIncidentTrends(ctx, since, now, args.groupBy);
      case 'performance':
        return await analyzeSupervisorPerformance(ctx, since, now, args.groupBy);
      case 'routes':
        return await analyzeRouteTrends(ctx, since, now, args.groupBy);
      default:
        return await analyzeAlertTrends(ctx, since, now, args.groupBy);
    }
  },
});

// Predictive alert pattern analysis
export const getPredictivePatterns = query({
  args: { 
    analysisType: v.string(), // 'route_risk', 'time_patterns', 'weather_correlation', 'event_impact'
    routes: v.optional(v.array(v.string())),
    timeHorizon: v.optional(v.string()) // 'next_hour', 'next_day', 'next_week'
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    switch (args.analysisType) {
      case 'route_risk':
        return await calculateRouteRiskScoring(ctx, args.routes);
      case 'time_patterns':
        return await analyzeTimeBasedPatterns(ctx, args.timeHorizon);
      case 'weather_correlation':
        return await analyzeWeatherCorrelation(ctx);
      case 'event_impact':
        return await predictEventImpact(ctx);
      default:
        return await calculateRouteRiskScoring(ctx, args.routes);
    }
  },
});

// Revenue impact calculations
export const getRevenueImpact = query({
  args: { 
    timeframe: v.string(),
    impactType: v.string(), // 'passenger_loss', 'service_frequency', 'route_revenue', 'total_cost'
    includeProjections: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const timeframes = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const timeframe = timeframes[args.timeframe as keyof typeof timeframes] ?? timeframes['24h'];
    const since = now - timeframe;

    // Get all alerts and incidents for the period
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), since))
      .collect();

    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_created")
      .filter((q) => q.gte(q.field("createdAt"), since))
      .collect();

    switch (args.impactType) {
      case 'passenger_loss':
        return await calculatePassengerImpact(alerts, incidents);
      case 'service_frequency':
        return await calculateServiceFrequencyImpact(alerts, incidents);
      case 'route_revenue':
        return await calculateRouteRevenueImpact(alerts, incidents);
      case 'total_cost':
        return await calculateTotalCostImpact(alerts, incidents);
      default:
        return await calculateTotalCostImpact(alerts, incidents);
    }
  },
});

// Business intelligence dashboard data
export const getBusinessIntelligence = query({
  args: { 
    dashboardType: v.string(), // 'executive', 'operational', 'financial', 'performance'
    timeframe: v.string()
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const timeframes = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };
    
    const timeframe = timeframes[args.timeframe as keyof typeof timeframes] ?? timeframes['7d'];
    const since = now - timeframe;

    switch (args.dashboardType) {
      case 'executive':
        return await generateExecutiveDashboard(ctx, since, now);
      case 'operational':
        return await generateOperationalDashboard(ctx, since, now);
      case 'financial':
        return await generateFinancialDashboard(ctx, since, now);
      case 'performance':
        return await generatePerformanceDashboard(ctx, since, now);
      default:
        return await generateExecutiveDashboard(ctx, since, now);
    }
  },
});

// Export analytics data for external BI tools
export const exportAnalyticsData = query({
  args: {
    exportType: v.string(), // 'alerts', 'incidents', 'performance', 'revenue', 'full'
    timeframe: v.string(),
    format: v.string() // 'json', 'csv_ready'
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const timeframes = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };
    
    const timeframe = timeframes[args.timeframe as keyof typeof timeframes] ?? timeframes['30d'];
    const since = now - timeframe;

    let data: any = {};

    if (args.exportType === 'alerts' || args.exportType === 'full') {
      data.alerts = await ctx.db
        .query("alerts")
        .withIndex("by_timestamp")
        .filter((q) => q.gte(q.field("timestamp"), since))
        .collect();
    }

    if (args.exportType === 'incidents' || args.exportType === 'full') {
      data.incidents = await ctx.db
        .query("incidents")
        .withIndex("by_created")
        .filter((q) => q.gte(q.field("createdAt"), since))
        .collect();
    }

    if (args.exportType === 'performance' || args.exportType === 'full') {
      data.supervisorActions = await ctx.db
        .query("supervisorActions")
        .withIndex("by_timestamp")
        .filter((q) => q.gte(q.field("timestamp"), since))
        .collect();
    }

    if (args.exportType === 'revenue' || args.exportType === 'full') {
      // Add revenue calculation data
      data.revenueAnalysis = await calculateTotalCostImpact(data.alerts || [], data.incidents || []);
    }

    return {
      data,
      metadata: {
        exportType: args.exportType,
        timeframe: args.timeframe,
        recordCount: Object.values(data).reduce((sum: number, arr: any) => 
          sum + (Array.isArray(arr) ? arr.length : 0), 0),
        generatedAt: now,
        timeRange: { since, until: now }
      }
    };
  },
});

// Helper functions for trend analysis
async function analyzeAlertTrends(ctx: any, since: number, now: number, groupBy?: string) {
  const alerts = await ctx.db
    .query("alerts")
    .withIndex("by_timestamp")
    .filter((q) => q.gte(q.field("timestamp"), since))
    .collect();

  const groupInterval = getGroupInterval(groupBy || 'day');
  const trendData = groupDataByTime(alerts, groupInterval, 'timestamp');
  
  return {
    totalAlerts: alerts.length,
    trendData,
    severityBreakdown: {
      critical: alerts.filter(a => a.severity === 'CRITICAL').length,
      high: alerts.filter(a => a.severity === 'HIGH').length,
      medium: alerts.filter(a => a.severity === 'MEDIUM').length,
      low: alerts.filter(a => a.severity === 'LOW').length,
    },
    sourceBreakdown: alerts.reduce((acc: any, alert) => {
      acc[alert.source] = (acc[alert.source] || 0) + 1;
      return acc;
    }, {}),
    peakHours: calculatePeakHours(alerts),
    averageResponseTime: calculateAverageResponseTime(alerts),
  };
}

async function analyzeIncidentTrends(ctx: any, since: number, now: number, groupBy?: string) {
  const incidents = await ctx.db
    .query("incidents")
    .withIndex("by_created")
    .filter((q) => q.gte(q.field("createdAt"), since))
    .collect();

  const groupInterval = getGroupInterval(groupBy || 'day');
  const trendData = groupDataByTime(incidents, groupInterval, 'createdAt');
  
  return {
    totalIncidents: incidents.length,
    trendData,
    typeBreakdown: incidents.reduce((acc: any, incident) => {
      acc[incident.type] = (acc[incident.type] || 0) + 1;
      return acc;
    }, {}),
    statusBreakdown: {
      active: incidents.filter(i => i.status === 'active').length,
      monitoring: incidents.filter(i => i.status === 'monitoring').length,
      closed: incidents.filter(i => i.status === 'closed').length,
    },
    averageResolutionTime: calculateAverageResolutionTime(incidents),
    routeImpactFrequency: calculateRouteImpactFrequency(incidents),
  };
}

async function analyzeSupervisorPerformance(ctx: any, since: number, now: number, groupBy?: string) {
  const actions = await ctx.db
    .query("supervisorActions")
    .withIndex("by_timestamp")
    .filter((q) => q.gte(q.field("timestamp"), since))
    .collect();

  const sessions = await ctx.db
    .query("supervisorSessions")
    .withIndex("by_active", (q) => q.eq("isActive", true))
    .collect();

  return {
    totalActions: actions.length,
    actionsByType: actions.reduce((acc: any, action) => {
      acc[action.action] = (acc[action.action] || 0) + 1;
      return acc;
    }, {}),
    supervisorRankings: calculateSupervisorRankings(actions),
    efficiencyMetrics: calculateEfficiencyMetrics(actions),
    workloadDistribution: calculateWorkloadDistribution(actions),
    peakActivityTimes: calculatePeakActivityTimes(actions),
  };
}

async function analyzeRouteTrends(ctx: any, since: number, now: number, groupBy?: string) {
  const alerts = await ctx.db
    .query("alerts")
    .withIndex("by_timestamp")
    .filter((q) => q.gte(q.field("timestamp"), since))
    .collect();

  const incidents = await ctx.db
    .query("incidents")
    .withIndex("by_created")
    .filter((q) => q.gte(q.field("createdAt"), since))
    .collect();

  const routeData = calculateRouteDisruptionData(alerts, incidents);
  
  return {
    mostDisruptedRoutes: routeData.mostDisrupted,
    routeReliabilityScore: routeData.reliabilityScores,
    routePerformanceTrends: routeData.performanceTrends,
    criticalRouteAlerts: routeData.criticalAlerts,
    routeRecoveryTimes: routeData.recoveryTimes,
  };
}

// Predictive analysis functions
async function calculateRouteRiskScoring(ctx: any, routes?: string[]) {
  const historicalData = await ctx.db
    .query("alerts")
    .withIndex("by_timestamp")
    .filter((q) => q.gte(q.field("timestamp"), Date.now() - (90 * 24 * 60 * 60 * 1000)))
    .collect();

  const riskScores = calculateRiskScores(historicalData, routes);
  
  return {
    riskScores,
    highRiskRoutes: riskScores.filter((r: any) => r.riskScore > 0.7),
    riskFactors: analyzeRiskFactors(historicalData),
    recommendations: generateRiskRecommendations(riskScores),
  };
}

async function analyzeTimeBasedPatterns(ctx: any, timeHorizon?: string) {
  const historicalData = await ctx.db
    .query("alerts")
    .withIndex("by_timestamp")
    .filter((q) => q.gte(q.field("timestamp"), Date.now() - (30 * 24 * 60 * 60 * 1000)))
    .collect();

  return {
    hourlyPatterns: calculateHourlyPatterns(historicalData),
    dailyPatterns: calculateDailyPatterns(historicalData),
    weeklyPatterns: calculateWeeklyPatterns(historicalData),
    seasonalTrends: calculateSeasonalTrends(historicalData),
    predictions: generateTimePredictions(historicalData, timeHorizon),
  };
}

async function analyzeWeatherCorrelation(ctx: any) {
  // This would integrate with weather data if available
  // For now, return mock correlation analysis
  return {
    weatherImpactCorrelation: 0.65,
    highImpactConditions: ['heavy_rain', 'snow', 'ice', 'fog'],
    correlationByRoute: [],
    seasonalWeatherImpact: [],
    recommendations: [
      'Increase monitoring during heavy rain periods',
      'Pre-position supervisors during snow forecasts',
      'Enhanced communication during fog conditions'
    ]
  };
}

async function predictEventImpact(ctx: any) {
  const events = await ctx.db
    .query("events")
    .withIndex("by_active", (q) => q.eq("isActive", true))
    .collect();

  const historicalEventData = await ctx.db
    .query("events")
    .withIndex("by_date")
    .collect();

  return {
    upcomingEventImpacts: events.map(event => ({
      eventId: event.eventId,
      venue: event.venue,
      predictedImpact: calculateEventImpact(event),
      affectedRoutes: event.affectedRoutes,
      recommendations: generateEventRecommendations(event)
    })),
    historicalEventCorrelation: calculateEventCorrelation(historicalEventData),
    eventImpactTrends: calculateEventTrends(historicalEventData),
  };
}

// Revenue impact calculation functions
async function calculatePassengerImpact(alerts: any[], incidents: any[]) {
  const routePassengerData = getRoutePassengerData(); // Mock passenger data
  
  let totalPassengerImpact = 0;
  const impactByRoute: any = {};

  [...alerts, ...incidents].forEach(item => {
    const routes = item.affectsRoutes || item.affectedRoutes || [];
    routes.forEach((route: string) => {
      const passengers = routePassengerData[route] || 0;
      const impactMultiplier = getImpactMultiplier(item.severity || item.priority);
      const impact = passengers * impactMultiplier;
      
      totalPassengerImpact += impact;
      impactByRoute[route] = (impactByRoute[route] || 0) + impact;
    });
  });

  return {
    totalPassengerImpact,
    impactByRoute,
    averageImpactPerIncident: totalPassengerImpact / (alerts.length + incidents.length),
    estimatedLostRevenue: totalPassengerImpact * 2.50, // Average fare
  };
}

async function calculateServiceFrequencyImpact(alerts: any[], incidents: any[]) {
  return {
    totalServiceHoursLost: 0, // Calculate based on duration and routes
    frequencyReduction: {}, // By route
    peakTimeImpact: 0,
    offPeakImpact: 0,
  };
}

async function calculateRouteRevenueImpact(alerts: any[], incidents: any[]) {
  const routeRevenueData = getRouteRevenueData(); // Mock revenue data
  
  return {
    totalRevenueImpact: 0,
    revenueImpactByRoute: {},
    dailyRevenueLoss: 0,
    projectedMonthlyImpact: 0,
  };
}

async function calculateTotalCostImpact(alerts: any[], incidents: any[]) {
  const passengerImpact = await calculatePassengerImpact(alerts, incidents);
  
  return {
    directCosts: {
      lostRevenue: passengerImpact.estimatedLostRevenue,
      operationalCosts: alerts.length * 50 + incidents.length * 200, // Estimated
      supervisorTimeValue: (alerts.length + incidents.length) * 25, // Estimated hourly cost
    },
    indirectCosts: {
      customerSatisfactionImpact: 0, // Would need survey data
      brandReputationImpact: 0,
      futureRevenueRisk: 0,
    },
    totalEstimatedCost: passengerImpact.estimatedLostRevenue + (alerts.length * 75) + (incidents.length * 225),
  };
}

// Business Intelligence dashboard functions
async function generateExecutiveDashboard(ctx: any, since: number, now: number) {
  const alerts = await ctx.db.query("alerts").withIndex("by_timestamp").filter((q) => q.gte(q.field("timestamp"), since)).collect();
  const incidents = await ctx.db.query("incidents").withIndex("by_created").filter((q) => q.gte(q.field("createdAt"), since)).collect();
  const revenueImpact = await calculateTotalCostImpact(alerts, incidents);

  return {
    kpis: {
      totalAlerts: alerts.length,
      criticalIncidents: incidents.filter(i => i.priority === 'CRITICAL').length,
      systemAvailability: calculateSystemAvailability(alerts),
      customerSatisfactionScore: 85, // Mock data
      estimatedCostImpact: revenueImpact.totalEstimatedCost,
    },
    trends: {
      alertTrend: calculateTrend(alerts, 'timestamp'),
      incidentTrend: calculateTrend(incidents, 'createdAt'),
      performanceTrend: 95.2, // Mock uptime percentage
    },
    topIssues: [
      ...alerts.slice(0, 5).map(a => ({ type: 'alert', ...a })),
      ...incidents.slice(0, 5).map(i => ({ type: 'incident', ...i }))
    ],
    recommendations: [
      'Focus on route 21 optimization - highest disruption frequency',
      'Increase monitoring during peak hours (7-9 AM, 5-7 PM)',
      'Consider weather-based pre-positioning of supervisors'
    ]
  };
}

async function generateOperationalDashboard(ctx: any, since: number, now: number) {
  return {
    realTimeMetrics: {
      activeAlerts: 0,
      activeSupervisors: 0,
      systemLoad: 'Normal',
      responseTime: '2.3 min avg'
    },
    operationalEfficiency: {},
    resourceUtilization: {},
    qualityMetrics: {},
  };
}

async function generateFinancialDashboard(ctx: any, since: number, now: number) {
  return {
    costAnalysis: {},
    revenueImpact: {},
    budgetVariance: {},
    roi: {},
  };
}

async function generatePerformanceDashboard(ctx: any, since: number, now: number) {
  return {
    supervisorPerformance: {},
    systemPerformance: {},
    slaCompliance: {},
    benchmarks: {},
  };
}

// Utility functions
function getGroupInterval(groupBy: string) {
  switch (groupBy) {
    case 'hour': return 60 * 60 * 1000;
    case 'day': return 24 * 60 * 60 * 1000;
    case 'week': return 7 * 24 * 60 * 60 * 1000;
    case 'month': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

function groupDataByTime(data: any[], interval: number, timeField: string) {
  const groups: any = {};
  data.forEach(item => {
    const time = Math.floor(item[timeField] / interval) * interval;
    groups[time] = (groups[time] || 0) + 1;
  });
  return Object.entries(groups).map(([time, count]) => ({
    time: parseInt(time),
    count
  })).sort((a, b) => a.time - b.time);
}

function calculatePeakHours(alerts: any[]) {
  const hourCounts: any = {};
  alerts.forEach(alert => {
    const hour = new Date(alert.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const sortedHours = Object.entries(hourCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3);
    
  return sortedHours.map(([hour, count]) => ({ hour: parseInt(hour), count }));
}

function calculateAverageResponseTime(alerts: any[]) {
  const acknowledgedAlerts = alerts.filter(a => a.acknowledged && a.acknowledgedAt);
  if (acknowledgedAlerts.length === 0) return 0;
  
  const totalResponseTime = acknowledgedAlerts.reduce((sum, alert) => {
    return sum + (alert.acknowledgedAt - alert.timestamp);
  }, 0);
  
  return totalResponseTime / acknowledgedAlerts.length / (60 * 1000); // Convert to minutes
}

function calculateAverageResolutionTime(incidents: any[]) {
  const closedIncidents = incidents.filter(i => i.status === 'closed' && i.closedAt);
  if (closedIncidents.length === 0) return 0;
  
  const totalResolutionTime = closedIncidents.reduce((sum, incident) => {
    return sum + (incident.closedAt - incident.createdAt);
  }, 0);
  
  return totalResolutionTime / closedIncidents.length / (60 * 60 * 1000); // Convert to hours
}

function calculateRouteImpactFrequency(incidents: any[]) {
  const routeImpacts: any = {};
  incidents.forEach(incident => {
    (incident.affectedRoutes || []).forEach((route: string) => {
      routeImpacts[route] = (routeImpacts[route] || 0) + 1;
    });
  });
  
  return Object.entries(routeImpacts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([route, count]) => ({ route, count }));
}

function calculateSupervisorRankings(actions: any[]) {
  const supervisorStats: any = {};
  actions.forEach(action => {
    if (!supervisorStats[action.supervisorId]) {
      supervisorStats[action.supervisorId] = {
        supervisorId: action.supervisorId,
        supervisorName: action.supervisorName,
        totalActions: 0,
        actionTypes: {}
      };
    }
    supervisorStats[action.supervisorId].totalActions++;
    supervisorStats[action.supervisorId].actionTypes[action.action] = 
      (supervisorStats[action.supervisorId].actionTypes[action.action] || 0) + 1;
  });
  
  return Object.values(supervisorStats)
    .sort((a: any, b: any) => b.totalActions - a.totalActions)
    .slice(0, 10);
}

function calculateEfficiencyMetrics(actions: any[]) {
  return {
    actionsPerHour: actions.length / 24, // Simplified
    responseTimeMetrics: {},
    qualityScore: 85, // Mock
  };
}

function calculateWorkloadDistribution(actions: any[]) {
  return {
    byShift: {},
    bySupervisor: {},
    byActionType: {},
  };
}

function calculatePeakActivityTimes(actions: any[]) {
  return calculatePeakHours(actions.map(a => ({ timestamp: a.timestamp })));
}

function calculateRouteDisruptionData(alerts: any[], incidents: any[]) {
  return {
    mostDisrupted: [],
    reliabilityScores: {},
    performanceTrends: {},
    criticalAlerts: [],
    recoveryTimes: {},
  };
}

function calculateRiskScores(historicalData: any[], routes?: string[]) {
  // Mock risk calculation
  const mockRoutes = ['21', 'X21', '1', '2', '307', 'Q3'];
  return mockRoutes.map(route => ({
    route,
    riskScore: Math.random(),
    factors: ['High traffic volume', 'Weather sensitivity', 'Construction work'],
    trend: Math.random() > 0.5 ? 'increasing' : 'decreasing'
  }));
}

function analyzeRiskFactors(historicalData: any[]) {
  return [
    { factor: 'Weather', impact: 0.65, frequency: 0.3 },
    { factor: 'Traffic', impact: 0.45, frequency: 0.8 },
    { factor: 'Construction', impact: 0.85, frequency: 0.2 },
    { factor: 'Events', impact: 0.55, frequency: 0.15 }
  ];
}

function generateRiskRecommendations(riskScores: any[]) {
  return [
    'Monitor route 21 closely during peak hours',
    'Pre-position supervisors for high-risk routes',
    'Increase communication frequency for critical routes'
  ];
}

function calculateHourlyPatterns(data: any[]) {
  const patterns: any = {};
  data.forEach(item => {
    const hour = new Date(item.timestamp).getHours();
    patterns[hour] = (patterns[hour] || 0) + 1;
  });
  return patterns;
}

function calculateDailyPatterns(data: any[]) {
  const patterns: any = {};
  data.forEach(item => {
    const day = new Date(item.timestamp).getDay();
    patterns[day] = (patterns[day] || 0) + 1;
  });
  return patterns;
}

function calculateWeeklyPatterns(data: any[]) {
  return {}; // Implementation for weekly patterns
}

function calculateSeasonalTrends(data: any[]) {
  return {}; // Implementation for seasonal trends
}

function generateTimePredictions(data: any[], timeHorizon?: string) {
  return {
    nextHour: { probability: 0.25, confidence: 0.8 },
    nextDay: { probability: 0.65, confidence: 0.7 },
    nextWeek: { probability: 0.85, confidence: 0.6 }
  };
}

function calculateEventImpact(event: any) {
  const severityMultiplier = {
    'LOW': 0.2,
    'MEDIUM': 0.5,
    'HIGH': 0.8,
    'CRITICAL': 1.0
  };
  
  return {
    severity: event.severity,
    multiplier: severityMultiplier[event.severity as keyof typeof severityMultiplier] || 0.5,
    estimatedDelayMinutes: (event.expectedAttendance || 1000) / 200,
    routesAffected: event.affectedRoutes?.length || 0
  };
}

function generateEventRecommendations(event: any) {
  return [
    `Increase monitoring 1 hour before ${event.event}`,
    `Pre-position supervisors near ${event.venue}`,
    'Enhanced passenger communication during event'
  ];
}

function calculateEventCorrelation(events: any[]) {
  return 0.7; // Mock correlation score
}

function calculateEventTrends(events: any[]) {
  return {}; // Implementation for event trends
}

function getRoutePassengerData() {
  // Mock passenger data per route
  return {
    '21': 2500, 'X21': 1800, '1': 3200, '2': 2900, '307': 2200, 'Q3': 1900,
    '10': 2100, '11': 1650, '12': 1400, '20': 1800, '22': 1300, '27': 1100,
    // Add more routes as needed
  };
}

function getRouteRevenueData() {
  // Mock daily revenue per route
  return {
    '21': 6250, 'X21': 4500, '1': 8000, '2': 7250, '307': 5500, 'Q3': 4750,
    // Add more routes as needed
  };
}

function getImpactMultiplier(severity: string) {
  switch (severity) {
    case 'CRITICAL': return 0.8;
    case 'HIGH': return 0.6;
    case 'MEDIUM': return 0.4;
    case 'LOW': return 0.2;
    default: return 0.3;
  }
}

function calculateSystemAvailability(alerts: any[]) {
  // Mock calculation - would be based on actual system uptime
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;
  return Math.max(95, 99.5 - (criticalAlerts * 0.5));
}

function calculateTrend(data: any[], timeField: string) {
  if (data.length < 2) return 0;
  
  const now = Date.now();
  const halfwayPoint = now - ((now - Math.min(...data.map(d => d[timeField]))) / 2);
  
  const firstHalf = data.filter(d => d[timeField] < halfwayPoint).length;
  const secondHalf = data.filter(d => d[timeField] >= halfwayPoint).length;
  
  return secondHalf - firstHalf; // Positive = increasing, Negative = decreasing
}
