// backend/api-endpoints-complete.js
// Complete implementation of missing API endpoints for BARRY Enhanced Backend

// Add these endpoints to your main index.js file

// NEW: Enhanced congestion endpoint with detailed analysis
app.get('/api/congestion', async (req, res) => {
  try {
    if (!latestUnifiedData) {
      latestUnifiedData = await fetchUnifiedAlertsWithTraffic();
      lastUnifiedFetchTime = Date.now();
    }
    
    const congestionAlerts = latestUnifiedData.alerts.filter(alert => 
      alert.type === 'congestion' && (alert.congestionLevel >= 4 || alert.jamFactor >= 0.3)
    );
    
    // Analyze congestion patterns
    const congestionAnalysis = {
      hotspots: congestionAlerts
        .sort((a, b) => (b.congestionLevel || 0) - (a.congestionLevel || 0))
        .slice(0, 15),
      
      severityBreakdown: {
        severe: congestionAlerts.filter(a => a.congestionLevel >= 8).length,
        moderate: congestionAlerts.filter(a => a.congestionLevel >= 5 && a.congestionLevel < 8).length,
        light: congestionAlerts.filter(a => a.congestionLevel >= 3 && a.congestionLevel < 5).length
      },
      
      roadwayAnalysis: analyzeCongestionByRoadway(congestionAlerts),
      
      timeImpact: {
        totalDelayMinutes: congestionAlerts.reduce((sum, a) => sum + (a.delayMinutes || 0), 0),
        averageDelay: Math.round(
          congestionAlerts.reduce((sum, a) => sum + (a.delayMinutes || 0), 0) / 
          (congestionAlerts.length || 1)
        ),
        maxDelay: Math.max(...congestionAlerts.map(a => a.delayMinutes || 0))
      },
      
      routeImpact: analyzeRouteImpactByCongestion(congestionAlerts)
    };
    
    res.json({
      success: true,
      congestion: congestionAlerts,
      analysis: congestionAnalysis,
      metadata: {
        count: congestionAlerts.length,
        averageCongestionLevel: Math.round(
          congestionAlerts.reduce((sum, a) => sum + (a.congestionLevel || 0), 0) / 
          (congestionAlerts.length || 1)
        ),
        dataQuality: {
          withJamFactor: congestionAlerts.filter(a => a.jamFactor).length,
          withCoordinates: congestionAlerts.filter(a => a.coordinates).length,
          withDelayEstimate: congestionAlerts.filter(a => a.delayMinutes).length
        },
        lastUpdated: latestUnifiedData.metadata.lastUpdated
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      congestion: []
    });
  }
});

// NEW: Enhanced incidents endpoint
app.get('/api/incidents', async (req, res) => {
  try {
    if (!latestUnifiedData) {
      latestUnifiedData = await fetchUnifiedAlertsWithTraffic();
      lastUnifiedFetchTime = Date.now();
    }
    
    const incidents = latestUnifiedData.alerts.filter(alert => alert.type === 'incident');
    
    // Analyze incidents
    const incidentAnalysis = {
      active: incidents.filter(i => i.status === 'red'),
      byType: analyzeIncidentsByType(incidents),
      bySeverity: {
        high: incidents.filter(i => i.severity === 'High'),
        medium: incidents.filter(i => i.severity === 'Medium'),
        low: incidents.filter(i => i.severity === 'Low')
      },
      withRoadClosure: incidents.filter(i => i.roadClosed),
      estimatedClearTimes: incidents
        .filter(i => i.endTime || i.estimatedClearTime)
        .map(i => ({
          id: i.id,
          location: i.location,
          clearTime: i.endTime || i.estimatedClearTime,
          minutesRemaining: calculateMinutesUntilClear(i.endTime || i.estimatedClearTime)
        }))
        .sort((a, b) => a.minutesRemaining - b.minutesRemaining)
    };
    
    res.json({
      success: true,
      incidents,
      analysis: incidentAnalysis,
      metadata: {
        total: incidents.length,
        active: incidents.filter(i => i.status === 'red').length,
        withEstimatedClearTime: incidents.filter(i => i.endTime || i.estimatedClearTime).length,
        averageSeverity: calculateAverageSeverity(incidents),
        sources: {
          here: incidents.filter(i => i.source === 'here').length,
          mapquest: incidents.filter(i => i.source === 'mapquest').length,
          nationalHighways: incidents.filter(i => i.source === 'national_highways').length
        },
        lastUpdated: latestUnifiedData.metadata.lastUpdated
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      incidents: []
    });
  }
});

// NEW: Route delays analysis endpoint
app.get('/api/route-delays', async (req, res) => {
  try {
    if (!latestUnifiedData) {
      latestUnifiedData = await fetchUnifiedAlertsWithTraffic();
      lastUnifiedFetchTime = Date.now();
    }
    
    // Calculate route delays from all alert types
    const routeDelays = calculateComprehensiveRouteDelays(latestUnifiedData.alerts);
    
    // Analyze route performance
    const routeAnalysis = {
      summary: {
        totalRoutes: routeDelays.length,
        routesWithDelays: routeDelays.filter(r => r.totalDelayMinutes > 0).length,
        averageDelay: Math.round(
          routeDelays.reduce((sum, r) => sum + r.averageDelay, 0) / (routeDelays.length || 1)
        ),
        totalDelayMinutes: routeDelays.reduce((sum, r) => sum + r.totalDelayMinutes, 0)
      },
      
      worstAffected: routeDelays
        .filter(r => r.totalDelayMinutes > 0)
        .sort((a, b) => b.totalDelayMinutes - a.totalDelayMinutes)
        .slice(0, 10),
      
      byService: categorizeRoutesByService(routeDelays),
      
      recommendations: generateDiversionRecommendations(routeDelays, latestUnifiedData.alerts)
    };
    
    res.json({
      success: true,
      routeDelays,
      analysis: routeAnalysis,
      metadata: {
        lastUpdated: latestUnifiedData.metadata.lastUpdated,
        dataQuality: {
          alertsWithRoutes: latestUnifiedData.alerts.filter(a => a.affectsRoutes?.length > 0).length,
          alertsWithDelays: latestUnifiedData.alerts.filter(a => a.delayMinutes > 0).length
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      routeDelays: []
    });
  }
});

// NEW: Enhanced streetworks endpoint with traffic correlation
app.get('/api/streetworks', async (req, res) => {
  try {
    const streetManagerData = await loadStreetManagerData();
    
    // Correlate street works with traffic data if available
    let correlatedData = streetManagerData.data;
    
    if (latestUnifiedData) {
      correlatedData = streetManagerData.data.map(work => {
        // Find nearby traffic alerts that might be related
        const nearbyTrafficAlerts = findNearbyTrafficAlerts(work, latestUnifiedData.alerts);
        
        return {
          ...work,
          relatedTrafficAlerts: nearbyTrafficAlerts.length,
          trafficImpact: nearbyTrafficAlerts.length > 0 ? 'high' : 'low',
          estimatedDelay: nearbyTrafficAlerts.reduce((sum, alert) => 
            sum + (alert.delayMinutes || 0), 0
          )
        };
      });
    }
    
    res.json({
      success: true,
      streetworks: correlatedData,
      metadata: {
        source: streetManagerData.source || 'Street Manager via AWS SNS',
        method: 'AWS SNS Webhooks + Traffic Correlation',
        count: correlatedData.length,
        withTrafficCorrelation: latestUnifiedData ? true : false,
        highTrafficImpact: correlatedData.filter(w => w.trafficImpact === 'high').length,
        lastUpdated: streetManagerData.lastUpdated || new Date().toISOString()
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      streetworks: []
    });
  }
});

// NEW: Enhanced roadworks endpoint (National Highways + traffic correlation)
app.get('/api/roadworks', async (req, res) => {
  try {
    if (!latestUnifiedData) {
      latestUnifiedData = await fetchUnifiedAlertsWithTraffic();
      lastUnifiedFetchTime = Date.now();
    }
    
    const roadworks = latestUnifiedData.alerts.filter(alert => alert.type === 'roadwork');
    
    // Enhanced roadworks analysis
    const roadworksAnalysis = {
      active: roadworks.filter(r => r.status === 'red'),
      upcoming: roadworks.filter(r => r.status === 'amber'),
      planned: roadworks.filter(r => r.status === 'green'),
      
      byAuthority: {
        nationalHighways: roadworks.filter(r => r.source === 'national_highways'),
        streetManager: roadworks.filter(r => r.source === 'streetmanager'),
        localAuthorities: roadworks.filter(r => r.source === 'streetmanager')
      },
      
      withTrafficImpact: roadworks.filter(r => r.estimatedDelay > 0),
      
      upcomingDeadlines: roadworks
        .filter(r => r.endDate)
        .map(r => ({
          id: r.id,
          title: r.title,
          location: r.location,
          endDate: r.endDate,
          daysRemaining: Math.ceil((new Date(r.endDate) - new Date()) / (1000 * 60 * 60 * 24))
        }))
        .filter(r => r.daysRemaining > 0 && r.daysRemaining <= 30)
        .sort((a, b) => a.daysRemaining - b.daysRemaining)
    };
    
    res.json({
      success: true,
      roadworks,
      analysis: roadworksAnalysis,
      metadata: {
        count: roadworks.length,
        sources: {
          nationalHighways: roadworksAnalysis.byAuthority.nationalHighways.length,
          streetManager: roadworksAnalysis.byAuthority.streetManager.length
        },
        lastUpdated: latestUnifiedData.metadata.lastUpdated
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      roadworks: []
    });
  }
});

// NEW: API usage monitoring endpoint
app.get('/api/usage', async (req, res) => {
  try {
    const usage = await getAPIUsageStats();
    
    res.json({
      success: true,
      usage,
      limits: {
        here: { monthly: 1000, daily: Math.floor(1000 / 30) },
        mapquest: { monthly: 15000, daily: Math.floor(15000 / 30) },
        nationalHighways: { unlimited: true },
        streetManager: { unlimited: true }
      },
      recommendations: generateUsageRecommendations(usage),
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      usage: null
    });
  }
});

// Helper functions for the above endpoints

function analyzeCongestionByRoadway(congestionAlerts) {
  const roadways = {};
  
  congestionAlerts.forEach(alert => {
    const roadway = extractRoadwayFromLocation(alert.location);
    if (!roadways[roadway]) {
      roadways[roadway] = {
        roadway,
        alertCount: 0,
        totalCongestionLevel: 0,
        maxCongestionLevel: 0,
        totalDelay: 0
      };
    }
    
    roadways[roadway].alertCount++;
    roadways[roadway].totalCongestionLevel += (alert.congestionLevel || 0);
    roadways[roadway].maxCongestionLevel = Math.max(
      roadways[roadway].maxCongestionLevel, 
      alert.congestionLevel || 0
    );
    roadways[roadway].totalDelay += (alert.delayMinutes || 0);
  });
  
  return Object.values(roadways)
    .map(r => ({
      ...r,
      averageCongestionLevel: Math.round(r.totalCongestionLevel / r.alertCount)
    }))
    .sort((a, b) => b.maxCongestionLevel - a.maxCongestionLevel);
}

function analyzeRouteImpactByCongestion(congestionAlerts) {
  const routeImpacts = {};
  
  congestionAlerts.forEach(alert => {
    if (alert.affectsRoutes) {
      alert.affectsRoutes.forEach(route => {
        if (!routeImpacts[route]) {
          routeImpacts[route] = {
            route,
            congestionPoints: 0,
            totalDelay: 0,
            maxCongestionLevel: 0
          };
        }
        
        routeImpacts[route].congestionPoints++;
        routeImpacts[route].totalDelay += (alert.delayMinutes || 0);
        routeImpacts[route].maxCongestionLevel = Math.max(
          routeImpacts[route].maxCongestionLevel,
          alert.congestionLevel || 0
        );
      });
    }
  });
  
  return Object.values(routeImpacts)
    .sort((a, b) => b.totalDelay - a.totalDelay)
    .slice(0, 15);
}

function analyzeIncidentsByType(incidents) {
  const types = {};
  
  incidents.forEach(incident => {
    const type = incident.incidentType || incident.type || 'unknown';
    if (!types[type]) {
      types[type] = {
        type,
        count: 0,
        highSeverity: 0,
        withRoadClosure: 0
      };
    }
    
    types[type].count++;
    if (incident.severity === 'High') types[type].highSeverity++;
    if (incident.roadClosed) types[type].withRoadClosure++;
  });
  
  return Object.values(types).sort((a, b) => b.count - a.count);
}

function calculateMinutesUntilClear(clearTime) {
  if (!clearTime) return Infinity;
  
  try {
    const clear = new Date(clearTime);
    const now = new Date();
    return Math.max(0, Math.round((clear - now) / (1000 * 60)));
  } catch {
    return Infinity;
  }
}

function calculateAverageSeverity(incidents) {
  const severityScores = { High: 3, Medium: 2, Low: 1 };
  const totalScore = incidents.reduce((sum, incident) => 
    sum + (severityScores[incident.severity] || 1), 0
  );
  const averageScore = totalScore / (incidents.length || 1);
  
  if (averageScore >= 2.5) return 'High';
  if (averageScore >= 1.5) return 'Medium';
  return 'Low';
}

function calculateComprehensiveRouteDelays(alerts) {
  const routeDelays = {};
  
  alerts.forEach(alert => {
    if (alert.affectsRoutes && alert.delayMinutes > 0) {
      alert.affectsRoutes.forEach(route => {
        if (!routeDelays[route]) {
          routeDelays[route] = {
            route,
            totalDelayMinutes: 0,
            alertCount: 0,
            incidents: 0,
            congestion: 0,
            roadworks: 0,
            maxDelay: 0,
            causes: []
          };
        }
        
        routeDelays[route].totalDelayMinutes += alert.delayMinutes;
        routeDelays[route].alertCount++;
        routeDelays[route].maxDelay = Math.max(routeDelays[route].maxDelay, alert.delayMinutes);
        
        if (alert.type === 'incident') routeDelays[route].incidents++;
        else if (alert.type === 'congestion') routeDelays[route].congestion++;
        else if (alert.type === 'roadwork') routeDelays[route].roadworks++;
        
        if (!routeDelays[route].causes.includes(alert.type)) {
          routeDelays[route].causes.push(alert.type);
        }
      });
    }
  });
  
  return Object.values(routeDelays)
    .map(route => ({
      ...route,
      averageDelay: Math.round(route.totalDelayMinutes / route.alertCount)
    }))
    .sort((a, b) => b.totalDelayMinutes - a.totalDelayMinutes);
}

function categorizeRoutesByService(routeDelays) {
  const servicePatterns = {
    express: /^X\d+$/,        // X9, X10, X21, etc.
    mainRoutes: /^[1-9]\d*$/,  // 1, 2, 21, etc.
    quayside: /^Q\d+$/,       // Q1, Q2, Q3
    special: /^[A-Z]/         // Other letter-prefixed routes
  };
  
  const categorized = {
    express: [],
    mainRoutes: [],
    quayside: [],
    special: []
  };
  
  routeDelays.forEach(route => {
    const routeNum = route.route;
    
    if (servicePatterns.express.test(routeNum)) {
      categorized.express.push(route);
    } else if (servicePatterns.quayside.test(routeNum)) {
      categorized.quayside.push(route);
    } else if (servicePatterns.special.test(routeNum)) {
      categorized.special.push(route);
    } else {
      categorized.mainRoutes.push(route);
    }
  });
  
  return categorized;
}

function generateDiversionRecommendations(routeDelays, alerts) {
  const recommendations = [];
  
  // Find routes with significant delays
  const problematicRoutes = routeDelays.filter(r => r.totalDelayMinutes >= 10);
  
  problematicRoutes.forEach(route => {
    // Find alternative routes serving similar areas
    const alternatives = findAlternativeRoutes(route.route, routeDelays);
    
    if (alternatives.length > 0) {
      recommendations.push({
        affectedRoute: route.route,
        currentDelay: route.totalDelayMinutes,
        cause: route.causes.join(', '),
        alternatives: alternatives.slice(0, 3),
        recommendation: `Consider diverting ${route.route} passengers to ${alternatives[0].route} (saves ${route.totalDelayMinutes - alternatives[0].totalDelayMinutes} minutes)`
      });
    }
  });
  
  return recommendations.slice(0, 10);
}

function findAlternativeRoutes(routeNumber, allRoutes) {
  // Simple alternative route logic - in practice this would be more sophisticated
  const routeAreas = {
    'X9': ['21', 'X21', '43', '44'],    // A1 alternatives
    'X10': ['21', 'X21', '43', '44'],   // A1 alternatives
    '1': ['2', '308', '309'],           // Coast road alternatives
    '2': ['1', '308', '309'],           // Coast road alternatives
    '21': ['X21', '50', 'X9'],          // Durham road alternatives
    'X21': ['21', '50', 'X9']           // Durham road alternatives
  };
  
  const alternatives = routeAreas[routeNumber] || [];
  
  return alternatives
    .map(altRoute => allRoutes.find(r => r.route === altRoute))
    .filter(Boolean)
    .sort((a, b) => a.totalDelayMinutes - b.totalDelayMinutes);
}

function findNearbyTrafficAlerts(streetWork, trafficAlerts) {
  // Simple proximity check - in practice would use proper geo calculations
  const workLocation = (streetWork.location || '').toLowerCase();
  
  return trafficAlerts.filter(alert => {
    if (alert.type !== 'congestion' && alert.type !== 'incident') return false;
    
    const alertLocation = (alert.location || '').toLowerCase();
    
    // Check for common location keywords
    const workKeywords = extractLocationKeywords(workLocation);
    const alertKeywords = extractLocationKeywords(alertLocation);
    
    return workKeywords.some(keyword => 
      alertKeywords.some(alertKeyword => 
        alertKeyword.includes(keyword) || keyword.includes(alertKeyword)
      )
    );
  });
}

function extractRoadwayFromLocation(location) {
  const roadPattern = /\b(A\d+|M\d+|B\d+)\b/i;
  const match = location.match(roadPattern);
  return match ? match[1].toUpperCase() : 'Local Road';
}

function extractLocationKeywords(location) {
  return location
    .toLowerCase()
    .split(/[\s,\-\(\)]+/)
    .filter(word => word.length > 2)
    .filter(word => !['the', 'and', 'near', 'between'].includes(word));
}

async function getAPIUsageStats() {
  // This would integrate with your actual usage tracking
  // For now, return mock data structure
  return {
    here: {
      today: 0,
      thisMonth: 0,
      lastReset: new Date().toISOString()
    },
    mapquest: {
      today: 0,
      thisMonth: 0,
      lastReset: new Date().toISOString()
    }
  };
}

function generateUsageRecommendations(usage) {
  const recommendations = [];
  
  if (usage.here.thisMonth > 800) {
    recommendations.push({
      api: 'HERE',
      type: 'warning',
      message: 'Approaching monthly limit. Consider reducing fetch frequency.'
    });
  }
  
  if (usage.mapquest.thisMonth > 12000) {
    recommendations.push({
      api: 'MapQuest',
      type: 'warning', 
      message: 'High usage detected. Monitor for overage charges.'
    });
  }
  
  return recommendations;
}