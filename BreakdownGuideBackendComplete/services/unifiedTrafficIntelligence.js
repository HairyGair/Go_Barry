// services/unifiedTrafficIntelligence.js
// Unified Traffic Intelligence System - TomTom Flow + National Highways + Smart Analysis
import { trafficFlowAnalyzer } from './intelligentTrafficFlow.js';
import { nhProcessor } from './enhancedNationalHighways.js';
import { fetchTomTomTrafficWithStreetNames } from './tomtom.js';

export class UnifiedTrafficIntelligence {
  constructor() {
    this.alertCache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes cache (increased to reduce API calls)
    this.lastUpdate = null;
    this.maxCacheSize = 100; // Limit cache size to prevent memory bloat
    
    // Quota protection
    this.quotaExhausted = false;
    this.quotaResetTime = null;
    this.dailyAPICallCount = 0;
    this.maxDailyAPICalls = 0; // Emergency quota protection - disable all TomTom calls today
    
    // Set up cache cleanup
    setInterval(() => this.cleanupCache(), 60000); // Clean every minute
    
    // Reset quota counter at midnight
    this.scheduleQuotaReset();
  }
  
  scheduleQuotaReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    setTimeout(() => {
      this.dailyAPICallCount = 0;
      this.quotaExhausted = false;
      console.log('🔄 TomTom API quota reset for new day');
      this.scheduleQuotaReset(); // Schedule next reset
    }, msUntilMidnight);
  }

  checkQuotaLimit() {
    if (this.dailyAPICallCount >= this.maxDailyAPICalls) {
      this.quotaExhausted = true;
      console.log(`⚠️ TomTom API quota limit reached: ${this.dailyAPICallCount}/${this.maxDailyAPICalls} calls used today`);
      return false;
    }
    return true;
  }

  incrementAPICallCount() {
    this.dailyAPICallCount++;
    console.log(`📊 TomTom API calls today: ${this.dailyAPICallCount}/${this.maxDailyAPICalls}`);
  }

  cleanupCache() {
    // Remove expired entries
    const now = Date.now();
    for (const [key, value] of this.alertCache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.alertCache.delete(key);
      }
    }
    
    // If still over limit, remove oldest entries
    if (this.alertCache.size > this.maxCacheSize) {
      const entries = Array.from(this.alertCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, entries.length - this.maxCacheSize);
      toRemove.forEach(([key]) => this.alertCache.delete(key));
    }
  }

  /**
   * Fetch comprehensive traffic intelligence from all sources
   */
  async getTrafficIntelligence() {
    console.log('🧠 Fetching unified traffic intelligence...');
    
    // Check cache first to avoid unnecessary API calls
    const cachedResult = this.getCachedResult();
    if (cachedResult) {
      console.log(`📋 Using cached traffic intelligence (${Math.round((Date.now() - this.lastUpdate) / 1000)}s old)`);
      return cachedResult;
    }
    
    // Check quota before making any API calls
    if (this.quotaExhausted || !this.checkQuotaLimit()) {
      console.log('⚠️ TomTom API quota exhausted, using National Highways only');
      return this.getNationalHighwaysOnly();
    }
    
    const startTime = Date.now();
    
    try {
      // Fetch from all sources with proper error handling
      // Only make TomTom calls if quota allows
      const promises = [];
      
      if (this.checkQuotaLimit()) {
        promises.push(trafficFlowAnalyzer.analyzeTrafficFlow());
        this.incrementAPICallCount();
      } else {
        promises.push(Promise.resolve({ success: false, reason: 'Quota exhausted' }));
      }
      
      if (this.checkQuotaLimit()) {
        promises.push(fetchTomTomTrafficWithStreetNames());
        this.incrementAPICallCount();
      } else {
        promises.push(Promise.resolve({ success: false, reason: 'Quota exhausted' }));
      }
      
      // National Highways doesn't use TomTom quota
      promises.push(nhProcessor.fetchEnhancedIncidents());
      
      const [
        tomtomFlowResult,
        tomtomIncidentsResult,
        nhResult
      ] = await Promise.allSettled(promises);

      // Process results
      const intelligence = {
        success: true,
        data: [],
        metadata: {
          sources: {},
          statistics: {},
          processingTime: 0,
          lastUpdated: new Date().toISOString()
        }
      };

      // Process TomTom Flow data (congestion analysis)
      if (tomtomFlowResult.status === 'fulfilled' && tomtomFlowResult.value.success) {
        const flowAlerts = tomtomFlowResult.value.data;
        intelligence.data.push(...flowAlerts);
        intelligence.metadata.sources.tomtomFlow = {
          success: true,
          alerts: flowAlerts.length,
          congestionAlerts: flowAlerts.filter(a => a.type === 'congestion').length
        };
        console.log(`✅ TomTom Flow: ${flowAlerts.length} congestion alerts`);
      } else {
        intelligence.metadata.sources.tomtomFlow = {
          success: false,
          error: tomtomFlowResult.reason?.message || 'Unknown error'
        };
      }

      // Process TomTom Incidents
      if (tomtomIncidentsResult.status === 'fulfilled' && tomtomIncidentsResult.value.success) {
        const incidentAlerts = tomtomIncidentsResult.value.data;
        intelligence.data.push(...incidentAlerts);
        intelligence.metadata.sources.tomtomIncidents = {
          success: true,
          alerts: incidentAlerts.length,
          incidents: incidentAlerts.filter(a => a.type === 'incident').length,
          roadworks: incidentAlerts.filter(a => a.type === 'roadwork').length
        };
        console.log(`✅ TomTom Incidents: ${incidentAlerts.length} incident alerts`);
      } else {
        intelligence.metadata.sources.tomtomIncidents = {
          success: false,
          error: tomtomIncidentsResult.reason?.message || 'Unknown error'
        };
      }

      // Process National Highways data
      if (nhResult.status === 'fulfilled' && nhResult.value.success) {
        const nhAlerts = nhResult.value.data;
        intelligence.data.push(...nhAlerts);
        intelligence.metadata.sources.nationalHighways = {
          success: true,
          alerts: nhAlerts.length,
          critical: nhAlerts.filter(a => a.classification === 'CRITICAL').length,
          high: nhAlerts.filter(a => a.classification === 'HIGH').length,
          roadworks: nhAlerts.filter(a => a.classification === 'ROADWORKS').length
        };
        console.log(`✅ National Highways: ${nhAlerts.length} enhanced alerts`);
      } else {
        intelligence.metadata.sources.nationalHighways = {
          success: false,
          error: nhResult.reason?.message || 'Unknown error'
        };
      }

      // Note: Real-time congestion detection moved to TomTom Flow analysis
      intelligence.metadata.sources.realTimeCongestion = {
        success: true,
        note: 'Integrated into TomTom Flow analysis',
        alerts: intelligence.data.filter(a => a.source === 'tomtom_flow').length
      };

      // Remove duplicates and enhance alerts
      intelligence.data = this.removeDuplicates(intelligence.data);
      intelligence.data = this.enhanceAlerts(intelligence.data);
      
      // Separate roadworks from incidents
      const separatedData = this.separateRoadworksFromIncidents(intelligence.data);
      intelligence.incidents = separatedData.incidents;
      intelligence.roadworks = separatedData.roadworks;
      intelligence.data = separatedData.incidents; // Keep incidents in main data for backward compatibility
      
      // Sort by priority and impact
      intelligence.incidents = this.sortByIntelligence(intelligence.incidents);
      intelligence.roadworks = this.sortByIntelligence(intelligence.roadworks);
      
      // Generate statistics
      intelligence.metadata.statistics = this.generateStatistics(intelligence.incidents);
      intelligence.metadata.roadworksStatistics = this.generateStatistics(intelligence.roadworks);
      intelligence.metadata.processingTime = Date.now() - startTime;

      console.log(`🎯 Traffic Intelligence: ${intelligence.incidents.length} incidents, ${intelligence.roadworks.length} roadworks processed in ${intelligence.metadata.processingTime}ms`);
      
      // Cache the result
      this.cacheResult(intelligence);
      
      return intelligence;

    } catch (error) {
      console.error('❌ Unified traffic intelligence failed:', error.message);
      return {
        success: false,
        data: [],
        error: error.message,
        metadata: {
          processingTime: Date.now() - startTime,
          lastUpdated: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Fallback method when TomTom quota is exhausted - use National Highways only
   */
  async getNationalHighwaysOnly() {
    console.log('🛣️ Using National Highways only (quota protection)');
    
    const startTime = Date.now();
    
    try {
      const nhResult = await nhProcessor.fetchEnhancedIncidents();
      
      const intelligence = {
        success: true,
        data: [],
        incidents: [],
        roadworks: [],
        metadata: {
          sources: {
            tomtomFlow: { success: false, reason: 'Quota exhausted' },
            tomtomIncidents: { success: false, reason: 'Quota exhausted' },
            nationalHighways: { success: false }
          },
          statistics: {},
          processingTime: 0,
          lastUpdated: new Date().toISOString(),
          quotaProtection: true
        }
      };

      // Process National Highways data
      if (nhResult && nhResult.success) {
        intelligence.data = nhResult.data || [];
        intelligence.metadata.sources.nationalHighways = {
          success: true,
          alerts: intelligence.data.length
        };
        console.log(`✅ National Highways: ${intelligence.data.length} enhanced alerts`);
      } else {
        intelligence.metadata.sources.nationalHighways = {
          success: false,
          error: nhResult?.reason?.message || 'Failed to fetch'
        };
      }

      // Separate roadworks from incidents
      const separatedData = this.separateRoadworksFromIncidents(intelligence.data);
      intelligence.incidents = separatedData.incidents;
      intelligence.roadworks = separatedData.roadworks;
      intelligence.data = separatedData.incidents;
      
      // Sort and generate statistics
      intelligence.incidents = this.sortByIntelligence(intelligence.incidents);
      intelligence.roadworks = this.sortByIntelligence(intelligence.roadworks);
      intelligence.metadata.statistics = this.generateStatistics(intelligence.incidents);
      intelligence.metadata.roadworksStatistics = this.generateStatistics(intelligence.roadworks);
      intelligence.metadata.processingTime = Date.now() - startTime;

      console.log(`🎯 National Highways Only: ${intelligence.incidents.length} incidents, ${intelligence.roadworks.length} roadworks processed in ${intelligence.metadata.processingTime}ms`);
      
      return intelligence;

    } catch (error) {
      console.error('❌ National Highways fallback failed:', error.message);
      return {
        success: false,
        data: [],
        incidents: [],
        roadworks: [],
        error: error.message,
        metadata: {
          processingTime: Date.now() - startTime,
          lastUpdated: new Date().toISOString(),
          quotaProtection: true
        }
      };
    }
  }

  /**
   * Remove duplicate alerts from different sources
   */
  removeDuplicates(alerts) {
    const uniqueAlerts = [];
    const seen = new Set();
    
    for (const alert of alerts) {
      // Create unique key based on location and type
      const key = this.createAlertKey(alert);
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueAlerts.push(alert);
      } else {
        // Find existing alert and merge if needed
        const existingIndex = uniqueAlerts.findIndex(a => 
          this.createAlertKey(a) === key
        );
        
        if (existingIndex >= 0) {
          uniqueAlerts[existingIndex] = this.mergeAlerts(
            uniqueAlerts[existingIndex], 
            alert
          );
        }
      }
    }
    
    console.log(`🔄 Deduplication: ${alerts.length} → ${uniqueAlerts.length} unique alerts`);
    return uniqueAlerts;
  }

  /**
   * Create unique key for alert deduplication
   */
  createAlertKey(alert) {
    const location = alert.location || '';
    const type = alert.type || '';
    const severity = alert.severity || '';
    
    // Normalize location for comparison
    const normalizedLocation = location.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
    
    return `${type}_${normalizedLocation}_${severity}`;
  }

  /**
   * Merge alerts from different sources
   */
  mergeAlerts(existing, incoming) {
    // Prefer more detailed sources
    const sourceRanking = {
      'tomtom_flow': 1,
      'tomtom': 2,
      'national_highways': 3
    };
    
    const existingRank = sourceRanking[existing.source] || 999;
    const incomingRank = sourceRanking[incoming.source] || 999;
    
    // Keep the higher-ranked source as primary
    const primary = existingRank <= incomingRank ? existing : incoming;
    const secondary = existingRank <= incomingRank ? incoming : existing;
    
    return {
      ...primary,
      // Merge route data
      affectsRoutes: [
        ...new Set([
          ...(primary.affectsRoutes || []),
          ...(secondary.affectsRoutes || [])
        ])
      ],
      // Combine sources
      sources: [
        ...(primary.sources || [primary.source]),
        ...(secondary.sources || [secondary.source])
      ].filter(Boolean),
      // Keep the more severe classification
      severity: this.getHigherSeverity(primary.severity, secondary.severity),
      status: this.getHigherStatus(primary.status, secondary.status),
      // Merge additional data
      additionalData: {
        ...(primary.additionalData || {}),
        ...(secondary.additionalData || {}),
        mergedSources: true
      }
    };
  }

  /**
   * Get higher severity between two alerts
   */
  getHigherSeverity(severity1, severity2) {
    const severityRank = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const rank1 = severityRank[severity1] || 0;
    const rank2 = severityRank[severity2] || 0;
    
    return rank1 >= rank2 ? severity1 : severity2;
  }

  /**
   * Get higher status between two alerts
   */
  getHigherStatus(status1, status2) {
    const statusRank = { 'red': 3, 'amber': 2, 'green': 1 };
    const rank1 = statusRank[status1] || 0;
    const rank2 = statusRank[status2] || 0;
    
    return rank1 >= rank2 ? status1 : status2;
  }

  /**
   * Enhance alerts with additional intelligence
   */
  enhanceAlerts(alerts) {
    return alerts.map(alert => {
      // Add intelligence score
      alert.intelligenceScore = this.calculateIntelligenceScore(alert);
      
      // Add congestion context
      if (alert.type === 'congestion') {
        alert.congestionContext = this.generateCongestionContext(alert);
      }
      
      // Add route impact assessment
      alert.routeImpact = this.assessRouteImpact(alert);
      
      // Add time-based context
      alert.timeContext = this.generateTimeContext(alert);
      
      return alert;
    });
  }

  /**
   * Calculate intelligence score for alert prioritization
   */
  calculateIntelligenceScore(alert) {
    let score = 0;
    
    // Severity weight (40%)
    const severityScores = { 'High': 40, 'Medium': 25, 'Low': 10 };
    score += severityScores[alert.severity] || 0;
    
    // Status weight (30%)
    const statusScores = { 'red': 30, 'amber': 20, 'green': 10 };
    score += statusScores[alert.status] || 0;
    
    // Route count weight (20%)
    const routeCount = alert.affectsRoutes?.length || 0;
    score += Math.min(20, routeCount * 2);
    
    // Source reliability (10%)
    const sourceScores = {
      'tomtom_flow': 10,
      'tomtom': 8,
      'national_highways': 7
    };
    score += sourceScores[alert.source] || 5;
    
    // Additional factors
    if (alert.classification === 'CRITICAL') score += 10;
    if (alert.congestionLevel && alert.congestionLevel > 50) score += 5;
    if (alert.roadPriority === 'critical') score += 5;
    
    return Math.min(100, score);
  }

  /**
   * Generate congestion context for traffic alerts
   */
  generateCongestionContext(alert) {
    if (!alert.congestionLevel) return null;
    
    const level = alert.congestionLevel;
    let context = {
      level: level,
      description: '',
      expectedDelay: alert.delayMinutes || 0,
      recommendation: ''
    };
    
    if (level >= 70) {
      context.description = 'Severe congestion - traffic at standstill';
      context.recommendation = 'Avoid route, seek alternatives';
    } else if (level >= 50) {
      context.description = 'Heavy congestion - significant delays';
      context.recommendation = 'Expect major delays';
    } else if (level >= 30) {
      context.description = 'Moderate congestion - some delays';
      context.recommendation = 'Allow extra time';
    } else {
      context.description = 'Light congestion - minor delays';
      context.recommendation = 'Monitor situation';
    }
    
    return context;
  }

  /**
   * Assess route impact for planning
   */
  assessRouteImpact(alert) {
    const routes = alert.affectsRoutes || [];
    if (routes.length === 0) return { level: 'none', routes: [] };
    
    // Categorize routes by frequency/importance
    const highFrequencyRoutes = ['1', '2', '10', '21', '22', 'Q3', 'X21'];
    const mediumFrequencyRoutes = ['27', '28', '307', '309', '56', '57', '58'];
    
    const highImpact = routes.filter(r => highFrequencyRoutes.includes(r));
    const mediumImpact = routes.filter(r => mediumFrequencyRoutes.includes(r));
    
    let level = 'low';
    if (highImpact.length > 0) level = 'high';
    else if (mediumImpact.length > 0) level = 'medium';
    
    return {
      level: level,
      routes: routes,
      highFrequency: highImpact,
      mediumFrequency: mediumImpact,
      totalRoutes: routes.length
    };
  }

  /**
   * Generate time-based context
   */
  generateTimeContext(alert) {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    let context = {
      timeOfDay: this.getTimeOfDay(hour),
      dayType: day >= 1 && day <= 5 ? 'weekday' : 'weekend',
      rushHour: this.isRushHour(hour, day),
      schoolHours: this.isSchoolHours(hour, day)
    };
    
    // Add recommendations based on time
    if (context.rushHour) {
      context.recommendation = 'High impact expected - rush hour traffic';
    } else if (context.schoolHours) {
      context.recommendation = 'Moderate impact - school travel times';
    } else {
      context.recommendation = 'Lower impact - off-peak hours';
    }
    
    return context;
  }

  /**
   * Helper methods for time context
   */
  getTimeOfDay(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  isRushHour(hour, day) {
    if (day < 1 || day > 5) return false; // Weekend
    return (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
  }

  isSchoolHours(hour, day) {
    if (day < 1 || day > 5) return false; // Weekend
    return (hour >= 8 && hour <= 9) || (hour >= 15 && hour <= 16);
  }

  /**
   * Separate roadworks from incidents based on classification and type
   */
  separateRoadworksFromIncidents(alerts) {
    const incidents = [];
    const roadworks = [];
    
    for (const alert of alerts) {
      // Check multiple criteria to determine if it's a roadwork
      const isRoadwork = this.isRoadwork(alert);
      
      if (isRoadwork) {
        roadworks.push({
          ...alert,
          category: 'roadwork',
          managerType: 'roadworks'
        });
      } else {
        incidents.push({
          ...alert,
          category: 'incident',
          managerType: 'incidents'
        });
      }
    }
    
    console.log(`📊 Separated: ${incidents.length} incidents, ${roadworks.length} roadworks`);
    
    return {
      incidents,
      roadworks
    };
  }

  /**
   * Determine if an alert is a roadwork or incident
   */
  isRoadwork(alert) {
    // Check National Highways classification first (most reliable)
    if (alert.classification === 'ROADWORKS') {
      return true;
    }
    
    // Check explicit type mapping
    if (alert.type === 'roadwork' || alert.type === 'roadworks') {
      return true;
    }
    
    const text = `${alert.title || ''} ${alert.description || ''}`.toLowerCase();
    
    // Check for specific roadwork keywords (more precise)
    const roadworkKeywords = [
      'roadworks', 'road works', 'planned works', 'scheduled works', 
      'maintenance works', 'resurfacing', 'construction', 'repair work',
      'surface treatment', 'bridge work', 'barrier replacement', 'carriageway works'
    ];
    
    for (const keyword of roadworkKeywords) {
      if (text.includes(keyword)) {
        return true;
      }
    }
    
    // Check for planned/scheduled status indicators (but be more specific)
    if (text.includes('roadworks are planned') || 
        text.includes('maintenance is planned') ||
        text.includes('works are planned') ||
        text.includes('scheduled maintenance') ||
        text.includes('planned closure')) {
      return true;
    }
    
    // Incidents: Check for incident-specific keywords
    const incidentKeywords = [
      'accident', 'incident', 'collision', 'breakdown', 'vehicle fire',
      'overturned vehicle', 'congestion', 'traffic jam', 'emergency',
      'police incident', 'serious incident'
    ];
    
    for (const keyword of incidentKeywords) {
      if (text.includes(keyword)) {
        return false; // Definitely an incident, not roadwork
      }
    }
    
    // Default: if classification is CRITICAL/HIGH/MEDIUM and no clear roadwork indicators, treat as incident
    if ((alert.classification === 'CRITICAL' || alert.classification === 'HIGH' || alert.classification === 'MEDIUM') && 
        !text.includes('works') && !text.includes('maintenance')) {
      return false;
    }
    
    return false; // Default to incident if unclear
  }

  /**
   * Sort alerts by intelligence score and priority
   */
  sortByIntelligence(alerts) {
    return alerts.sort((a, b) => {
      // First by intelligence score
      const scoreA = a.intelligenceScore || 0;
      const scoreB = b.intelligenceScore || 0;
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      
      // Then by route impact
      const routeImpactScore = {
        'high': 3,
        'medium': 2,
        'low': 1,
        'none': 0
      };
      
      const impactA = routeImpactScore[a.routeImpact?.level] || 0;
      const impactB = routeImpactScore[b.routeImpact?.level] || 0;
      
      return impactB - impactA;
    });
  }

  /**
   * Generate comprehensive statistics
   */
  generateStatistics(alerts) {
    const stats = {
      total: alerts.length,
      byType: {},
      bySeverity: {},
      byStatus: {},
      bySource: {},
      congestionLevels: {},
      routeImpact: {},
      timeContext: {}
    };
    
    alerts.forEach(alert => {
      // By type
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
      
      // By severity
      stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
      
      // By status
      stats.byStatus[alert.status] = (stats.byStatus[alert.status] || 0) + 1;
      
      // By source
      stats.bySource[alert.source] = (stats.bySource[alert.source] || 0) + 1;
      
      // Congestion levels
      if (alert.congestionLevel) {
        const level = alert.congestionLevel >= 70 ? 'severe' :
                     alert.congestionLevel >= 50 ? 'major' :
                     alert.congestionLevel >= 30 ? 'moderate' : 'minor';
        stats.congestionLevels[level] = (stats.congestionLevels[level] || 0) + 1;
      }
      
      // Route impact
      if (alert.routeImpact) {
        stats.routeImpact[alert.routeImpact.level] = (stats.routeImpact[alert.routeImpact.level] || 0) + 1;
      }
      
      // Time context
      if (alert.timeContext) {
        stats.timeContext[alert.timeContext.timeOfDay] = (stats.timeContext[alert.timeContext.timeOfDay] || 0) + 1;
      }
    });
    
    return stats;
  }

  /**
   * Cache result with TTL
   */
  cacheResult(intelligence) {
    this.alertCache.set('latest', {
      data: intelligence,
      timestamp: Date.now()
    });
    this.lastUpdate = Date.now();
  }

  /**
   * Get cached result if available
   */
  getCachedResult() {
    const cached = this.alertCache.get('latest');
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    this.alertCache.clear();
    trafficFlowAnalyzer.clearCache();
    nhProcessor.clearCache();
    console.log('🗑️ All traffic intelligence caches cleared');
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      lastUpdate: this.lastUpdate,
      cacheSize: this.alertCache.size,
      cacheStatus: this.getCachedResult() ? 'hit' : 'miss',
      uptime: Date.now() - (this.lastUpdate || Date.now())
    };
  }
}

// Export singleton instance
export const trafficIntelligence = new UnifiedTrafficIntelligence();
export default trafficIntelligence;