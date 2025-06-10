// backend/services/enhancedDataSourceManager.js
// Enhanced Traffic Data Integration for Go BARRY Intelligence System

import intelligenceEngine from './intelligenceEngine.js';

class EnhancedDataSourceManager {
  constructor() {
    this.sourceConfigs = {
      tomtom: { name: 'TomTom Traffic', reliability: 0.9, enabled: true },
      here: { name: 'HERE Traffic', reliability: 0.85, enabled: true },
      national_highways: { name: 'National Highways', reliability: 0.95, enabled: true }
    };
    
    this.aggregatedData = { incidents: [], lastUpdate: null, confidence: 0 };
    this.sourceHealth = new Map();
  }

  // Main aggregation with ML enhancement
  async aggregateAllSources() {
    console.log('🔄 Starting enhanced data aggregation...');
    
    const results = await Promise.allSettled([
      this.fetchTomTomData(),
      this.fetchHereData(), 
      this.fetchNationalHighwaysData()
    ]);
    
    const allIncidents = [];
    const successfulSources = [];
    
    results.forEach((result, index) => {
      const sourceIds = ['tomtom', 'here', 'national_highways'];
      if (result.status === 'fulfilled' && result.value.success) {
        allIncidents.push(...result.value.incidents);
        successfulSources.push(sourceIds[index]);
      }
    });
    
    // ML-enhanced processing
    const enhancedIncidents = this.enhanceWithML(allIncidents);
    const prioritizedIncidents = this.prioritizeIncidents(enhancedIncidents);
    
    this.aggregatedData = {
      incidents: prioritizedIncidents,
      lastUpdate: new Date().toISOString(),
      sources: successfulSources,
      confidence: this.calculateConfidence(successfulSources),
      stats: {
        total: prioritizedIncidents.length,
        highPriority: prioritizedIncidents.filter(i => i.mlPrediction?.severity >= 3).length,
        criticalImpact: prioritizedIncidents.filter(i => i.routeImpact?.impactLevel === 'CRITICAL').length
      }
    };
    
    console.log(`✅ Enhanced aggregation: ${prioritizedIncidents.length} incidents`);
    return this.aggregatedData;
  }

  // Enhance incidents with ML predictions
  enhanceWithML(incidents) {
    return incidents.map(incident => {
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
    });
  }

  // Prioritize using ML predictions and route impact
  prioritizeIncidents(incidents) {
    return incidents.sort((a, b) => {
      const severityDiff = (b.mlPrediction?.severity || 2) - (a.mlPrediction?.severity || 2);
      if (Math.abs(severityDiff) > 0.5) return severityDiff;
      
      const impactDiff = (b.routeImpact?.totalImpactScore || 0) - (a.routeImpact?.totalImpactScore || 0);
      return impactDiff;
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
    if (incident.coordinates?.lat && incident.coordinates?.lng) completeness += 0.4;
    if (incident.title && incident.title.length > 10) completeness += 0.3;
    if (incident.location) completeness += 0.3;
    
    return Math.max(0.1, Math.min(1.0, (confidence + completeness) / 2));
  }

  // Placeholder fetch methods (simplified for brevity)
  async fetchTomTomData() {
    try {
      // Simulated TomTom data fetch
      return {
        success: true,
        incidents: [{
          id: 'tomtom_001',
          source: 'tomtom',
          title: 'Traffic Delay - A1 Northbound',
          location: 'A1 Junction 65',
          coordinates: { lat: 54.9158, lng: -1.5721 },
          severity: 'moderate'
        }]
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fetchHereData() {
    try {
      return {
        success: true,
        incidents: [{
          id: 'here_001', 
          source: 'here',
          title: 'Road Works - Gateshead',
          location: 'A184 Gateshead',
          coordinates: { lat: 54.9526, lng: -1.6014 },
          severity: 'minor'
        }]
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fetchNationalHighwaysData() {
    try {
      return {
        success: true,
        incidents: [{
          id: 'nh_001',
          source: 'national_highways',
          title: 'Vehicle Breakdown - A19',
          location: 'A19 Southbound J63',
          coordinates: { lat: 54.8973, lng: -1.4123 },
          severity: 'major'
        }]
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
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
      confidence: this.aggregatedData.confidence
    };
  }
}

const enhancedDataSourceManager = new EnhancedDataSourceManager();
export default enhancedDataSourceManager;