// backend/services/enhancedDataSourceManager.js
// Enhanced Traffic Data Integration for Go BARRY Intelligence System

import intelligenceEngine from './intelligenceEngine.js';
import { fetchTomTomTrafficWithStreetNames } from './tomtom.js';
import { fetchHERETrafficWithStreetNames } from './here.js';
import { fetchMapQuestTrafficWithStreetNames } from './mapquest.js';
import { fetchNationalHighways } from './nationalHighways.js';

class EnhancedDataSourceManager {
  constructor() {
    this.sourceConfigs = {
      tomtom: { name: 'TomTom Traffic', reliability: 0.9, enabled: true },
      here: { name: 'HERE Traffic', reliability: 0.85, enabled: true },
      mapquest: { name: 'MapQuest Traffic', reliability: 0.75, enabled: true },
      national_highways: { name: 'National Highways', reliability: 0.95, enabled: true }
    };
    
    this.aggregatedData = { incidents: [], lastUpdate: null, confidence: 0 };
    this.sourceHealth = new Map();
    this.lastFetchTime = null;
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes
  }

  // Main aggregation with ML enhancement
  async aggregateAllSources() {
    console.log('🔄 Starting enhanced data aggregation with real APIs...');
    
    // Check cache first
    const now = Date.now();
    if (this.aggregatedData.incidents.length > 0 && 
        this.lastFetchTime && 
        (now - this.lastFetchTime) < this.cacheTimeout) {
      console.log('📦 Returning cached enhanced data');
      return this.aggregatedData;
    }
    
    const startTime = Date.now();
    const results = await Promise.allSettled([
      this.fetchTomTomData(),
      this.fetchHereData(), 
      this.fetchMapQuestData(),
      this.fetchNationalHighwaysData()
    ]);
    
    const allIncidents = [];
    const successfulSources = [];
    const sourceStats = {};
    
    const sourceNames = ['tomtom', 'here', 'mapquest', 'national_highways'];
    
    results.forEach((result, index) => {
      const sourceName = sourceNames[index];
      
      if (result.status === 'fulfilled' && result.value.success) {
        const incidents = result.value.incidents || result.value.data || [];
        allIncidents.push(...incidents);
        successfulSources.push(sourceName);
        
        sourceStats[sourceName] = {
          success: true,
          count: incidents.length,
          method: result.value.method || 'API',
          lastUpdate: new Date().toISOString()
        };
        
        console.log(`✅ ${sourceName.toUpperCase()}: ${incidents.length} incidents`);
      } else {
        sourceStats[sourceName] = {
          success: false,
          count: 0,
          error: result.reason?.message || result.value?.error || 'Unknown error',
          lastUpdate: new Date().toISOString()
        };
        
        console.log(`❌ ${sourceName.toUpperCase()}: Failed - ${sourceStats[sourceName].error}`);
      }
    });
    
    // ML-enhanced processing
    const enhancedIncidents = this.enhanceWithML(allIncidents);
    const prioritizedIncidents = this.prioritizeIncidents(enhancedIncidents);
    
    const fetchDuration = Date.now() - startTime;
    
    this.aggregatedData = {
      incidents: prioritizedIncidents,
      lastUpdate: new Date().toISOString(),
      sources: successfulSources,
      sourceStats,
      confidence: this.calculateConfidence(successfulSources),
      stats: {
        total: prioritizedIncidents.length,
        enhanced: prioritizedIncidents.filter(i => i.enhanced).length,
        highPriority: prioritizedIncidents.filter(i => i.mlPrediction?.severity >= 3).length,
        criticalImpact: prioritizedIncidents.filter(i => i.routeImpact?.impactLevel === 'CRITICAL').length,
        withRoutes: prioritizedIncidents.filter(i => i.affectsRoutes?.length > 0).length,
        withCoordinates: prioritizedIncidents.filter(i => i.coordinates?.length === 2).length
      },
      performance: {
        fetchDuration: `${fetchDuration}ms`,
        sourcesActive: successfulSources.length,
        totalSources: Object.keys(this.sourceConfigs).length
      }
    };
    
    this.lastFetchTime = now;
    
    console.log(`✅ Enhanced aggregation: ${prioritizedIncidents.length} incidents from ${successfulSources.length}/4 sources in ${fetchDuration}ms`);
    return this.aggregatedData;
  }

  // Real API fetch methods
  async fetchTomTomData() {
    try {
      const result = await fetchTomTomTrafficWithStreetNames();
      return {
        success: result.success,
        incidents: result.data || [],
        method: result.method || 'TomTom API'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fetchHereData() {
    try {
      const result = await fetchHERETrafficWithStreetNames();
      return {
        success: result.success,
        incidents: result.data || [],
        method: result.method || 'HERE API'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fetchMapQuestData() {
    try {
      const result = await fetchMapQuestTrafficWithStreetNames();
      return {
        success: result.success,
        incidents: result.data || [],
        method: result.method || 'MapQuest API'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fetchNationalHighwaysData() {
    try {
      const result = await fetchNationalHighways();
      return {
        success: result.success,
        incidents: result.data || [],
        method: 'National Highways API'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Enhance incidents with ML predictions
  enhanceWithML(incidents) {
    return incidents.map(incident => {
      try {
        const mlPrediction = intelligenceEngine.predictSeverity(incident);
        const routeImpact = intelligenceEngine.calculateRouteImpactScore(incident);
        
        // Record for learning
        intelligenceEngine.recordIncident(incident);
        
        return {
          ...incident,
          mlPrediction,
          routeImpact,
          enhanced: true,
          confidenceScore: this.calculateIncidentConfidence(incident, mlPrediction)
        };
      } catch (error) {
        console.warn(`⚠️ ML enhancement failed for incident ${incident.id}:`, error.message);
        return {
          ...incident,
          enhanced: false,
          confidenceScore: 0.5
        };
      }
    });
  }

  // Prioritize using ML predictions and route impact
  prioritizeIncidents(incidents) {
    return incidents.sort((a, b) => {
      // First sort by ML severity prediction
      const severityA = a.mlPrediction?.severity || 2;
      const severityB = b.mlPrediction?.severity || 2;
      const severityDiff = severityB - severityA;
      
      if (Math.abs(severityDiff) > 0.5) return severityDiff;
      
      // Then by route impact score
      const impactA = a.routeImpact?.totalImpactScore || 0;
      const impactB = b.routeImpact?.totalImpactScore || 0;
      const impactDiff = impactB - impactA;
      
      if (Math.abs(impactDiff) > 0.1) return impactDiff;
      
      // Finally by number of affected routes
      const routesA = a.affectsRoutes?.length || 0;
      const routesB = b.affectsRoutes?.length || 0;
      return routesB - routesA;
    });
  }

  calculateIncidentConfidence(incident, mlPrediction) {
    let confidence = 0.5;
    
    // Source reliability
    const sourceReliability = this.sourceConfigs[incident.source]?.reliability || 0.5;
    confidence = (confidence + sourceReliability) / 2;
    
    // ML confidence
    if (mlPrediction?.confidence) {
      confidence = (confidence + mlPrediction.confidence) / 2;
    }
    
    // Data completeness
    let completeness = 0;
    if (incident.coordinates && Array.isArray(incident.coordinates) && incident.coordinates.length === 2) {
      completeness += 0.4;
    }
    if (incident.title && incident.title.length > 10) completeness += 0.3;
    if (incident.location && incident.location.length > 5) completeness += 0.3;
    
    return Math.max(0.1, Math.min(1.0, (confidence + completeness) / 2));
  }

  calculateConfidence(successfulSources) {
    const totalSources = Object.keys(this.sourceConfigs).length;
    return Math.round((successfulSources.length / totalSources) * 100) / 100;
  }

  getCurrentData() {
    return this.aggregatedData;
  }

  getSourceStatistics() {
    return {
      totalSources: Object.keys(this.sourceConfigs).length,
      activeSources: Object.values(this.sourceConfigs).filter(s => s.enabled).length,
      lastUpdate: this.aggregatedData.lastUpdate,
      confidence: this.aggregatedData.confidence,
      performance: this.aggregatedData.performance || {},
      sourceStats: this.aggregatedData.sourceStats || {}
    };
  }

  // Clear cache to force refresh
  clearCache() {
    this.lastFetchTime = null;
    this.aggregatedData = { incidents: [], lastUpdate: null, confidence: 0 };
    console.log('🧹 Enhanced data source cache cleared');
  }
}

const enhancedDataSourceManager = new EnhancedDataSourceManager();
export default enhancedDataSourceManager;