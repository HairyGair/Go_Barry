// enhanced-data-source-manager-expanded.js
// EXPANDED: Add StreetManager + Elgin + Full Capacity

import intelligenceEngine from './intelligenceEngine.js';
import { fetchTomTomTrafficWithStreetNames } from './tomtom.js';
import { fetchHERETrafficWithStreetNames } from './here.js';
import { fetchMapQuestTrafficWithStreetNames } from './mapquest.js';
import { fetchNationalHighways } from './nationalHighways.js';
import { fetchStreetManagerActivities, fetchStreetManagerPermits } from './streetManager.js';

class ExpandedDataSourceManager {
  constructor() {
    this.sourceConfigs = {
      // Core Traffic APIs
      tomtom: { name: 'TomTom Traffic', reliability: 0.9, enabled: true, category: 'traffic' },
      here: { name: 'HERE Traffic', reliability: 0.85, enabled: true, category: 'traffic' },
      mapquest: { name: 'MapQuest Traffic', reliability: 0.75, enabled: true, category: 'traffic' },
      
      // Official Government Sources  
      national_highways: { name: 'National Highways', reliability: 0.95, enabled: true, category: 'official' },
      streetmanager: { name: 'StreetManager UK', reliability: 0.98, enabled: true, category: 'official' },
      
      // Regional Traffic Systems
      elgin: { name: 'Elgin Traffic Management', reliability: 0.8, enabled: false, category: 'regional' }, // Enable when ready
      scoot: { name: 'SCOOT Traffic Control', reliability: 0.85, enabled: false, category: 'regional' }, // Enable when ready
      
      // Manual/Internal
      manual_incidents: { name: 'Manual Incidents', reliability: 1.0, enabled: true, category: 'internal' }
    };
    
    this.aggregatedData = { incidents: [], lastUpdate: null, confidence: 0 };
    this.sourceHealth = new Map();
    this.lastFetchTime = null;
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes
  }

  // EXPANDED: Main aggregation with all available sources
  async aggregateAllSources() {
    console.log('🚀 [EXPANDED] Starting enhanced data aggregation with 6+ sources...');
    
    // Check cache first
    const now = Date.now();
    if (this.aggregatedData.incidents.length > 0 && 
        this.lastFetchTime && 
        (now - this.lastFetchTime) < this.cacheTimeout) {
      console.log('📦 Returning cached enhanced data');
      return this.aggregatedData;
    }
    
    const startTime = Date.now();
    
    // Fetch from all enabled sources in parallel
    const fetchPromises = [];
    const sourceNames = [];
    
    // Core traffic APIs
    if (this.sourceConfigs.tomtom.enabled) {
      fetchPromises.push(this.fetchTomTomData());
      sourceNames.push('tomtom');
    }
    
    if (this.sourceConfigs.here.enabled) {
      fetchPromises.push(this.fetchHereData());
      sourceNames.push('here');
    }
    
    if (this.sourceConfigs.mapquest.enabled) {
      fetchPromises.push(this.fetchMapQuestData());
      sourceNames.push('mapquest');
    }
    
    // Official sources
    if (this.sourceConfigs.national_highways.enabled) {
      fetchPromises.push(this.fetchNationalHighwaysData());
      sourceNames.push('national_highways');
    }
    
    if (this.sourceConfigs.streetmanager.enabled) {
      fetchPromises.push(this.fetchStreetManagerData());
      sourceNames.push('streetmanager');
    }
    
    // Manual incidents (always enabled)
    fetchPromises.push(this.fetchManualIncidents());
    sourceNames.push('manual_incidents');
    
    // Execute all fetches
    const results = await Promise.allSettled(fetchPromises);
    
    const allIncidents = [];
    const successfulSources = [];
    const sourceStats = {};
    
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
          mode: result.value.mode || 'live',
          lastUpdate: new Date().toISOString()
        };
        
        console.log(`✅ [EXPANDED] ${sourceName.toUpperCase()}: ${incidents.length} incidents`);
      } else {
        sourceStats[sourceName] = {
          success: false,
          count: 0,
          error: result.reason?.message || result.value?.error || 'Unknown error',
          mode: 'failed'
        };
        
        console.log(`❌ [EXPANDED] ${sourceName.toUpperCase()}: Failed - ${sourceStats[sourceName].error}`);
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
        withCoordinates: prioritizedIncidents.filter(i => i.coordinates?.length === 2).length,
        byCategory: this.categorizeIncidents(prioritizedIncidents)
      },
      performance: {
        fetchDuration: `${fetchDuration}ms`,
        sourcesActive: successfulSources.length,
        totalSources: Object.keys(this.sourceConfigs).filter(s => s.enabled).length,
        sourcesEnabled: Object.keys(this.sourceConfigs).filter(k => this.sourceConfigs[k].enabled).length,
        sourcesTotal: Object.keys(this.sourceConfigs).length
      }
    };
    
    this.lastFetchTime = now;
    
    console.log(`✅ [EXPANDED] Enhanced aggregation: ${prioritizedIncidents.length} incidents from ${successfulSources.length}/${sourceNames.length} sources in ${fetchDuration}ms`);
    return this.aggregatedData;
  }

  // NEW: StreetManager data fetcher
  async fetchStreetManagerData() {
    try {
      console.log('🚧 [EXPANDED] Fetching StreetManager UK data...');
      
      // Fetch both activities and permits in parallel
      const [activitiesResult, permitsResult] = await Promise.allSettled([
        fetchStreetManagerActivities(),
        fetchStreetManagerPermits()
      ]);
      
      const allData = [];
      let totalCount = 0;
      
      if (activitiesResult.status === 'fulfilled' && activitiesResult.value.success) {
        const activities = activitiesResult.value.data || [];
        allData.push(...activities);
        totalCount += activities.length;
        console.log(`✅ StreetManager Activities: ${activities.length} roadworks`);
      }
      
      if (permitsResult.status === 'fulfilled' && permitsResult.value.success) {
        const permits = permitsResult.value.data || [];
        allData.push(...permits);
        totalCount += permits.length;
        console.log(`✅ StreetManager Permits: ${permits.length} planned works`);
      }
      
      return {
        success: true,
        incidents: allData,
        method: 'StreetManager UK Official API',
        mode: 'live',
        coverage: 'National UK roadworks registry',
        count: totalCount
      };
      
    } catch (error) {
      console.error('❌ StreetManager fetch failed:', error.message);
      return { 
        success: false, 
        error: error.message,
        incidents: [] 
      };
    }
  }

  // NEW: Manual incidents fetcher (placeholder)
  async fetchManualIncidents() {
    try {
      // TODO: Integrate with actual manual incidents database
      console.log('📝 [EXPANDED] Fetching manual incidents...');
      
      // For now, return empty - this would connect to Supabase/local storage
      return {
        success: true,
        incidents: [],
        method: 'Local Database',
        mode: 'incident_manager',
        count: 0
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        incidents: []
      };
    }
  }

  // Existing fetch methods (unchanged)
  async fetchTomTomData() {
    try {
      const result = await fetchTomTomTrafficWithStreetNames();
      return {
        success: result.success,
        incidents: result.data || [],
        method: result.method || 'TomTom API',
        mode: 'live'
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
        method: result.method || 'HERE API',
        mode: 'live'
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
        method: result.method || 'MapQuest API',
        mode: 'live'
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
        method: 'National Highways DATEX II API',
        mode: 'live'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // NEW: Categorize incidents by source type
  categorizeIncidents(incidents) {
    const categories = {
      traffic: incidents.filter(i => ['tomtom', 'here', 'mapquest'].includes(i.source)),
      official: incidents.filter(i => ['national_highways', 'streetmanager'].includes(i.source)),
      regional: incidents.filter(i => ['elgin', 'scoot'].includes(i.source)),
      manual: incidents.filter(i => i.source === 'manual_incidents')
    };
    
    return {
      traffic: categories.traffic.length,
      official: categories.official.length,
      regional: categories.regional.length,
      manual: categories.manual.length
    };
  }

  // Enhanced statistics with expanded capacity info
  getSourceStatistics() {
    const enabledSources = Object.values(this.sourceConfigs).filter(s => s.enabled).length;
    const totalSources = Object.keys(this.sourceConfigs).length;
    const activeSources = this.aggregatedData.sources?.length || 0;
    
    return {
      totalSources: totalSources,
      enabledSources: enabledSources,
      activeSources: activeSources,
      utilizationRate: Math.round((activeSources / totalSources) * 100),
      lastUpdate: this.aggregatedData.lastUpdate,
      confidence: this.aggregatedData.confidence,
      performance: this.aggregatedData.performance || {},
      sourceStats: this.aggregatedData.sourceStats || {},
      categories: {
        traffic: Object.keys(this.sourceConfigs).filter(k => this.sourceConfigs[k].category === 'traffic').length,
        official: Object.keys(this.sourceConfigs).filter(k => this.sourceConfigs[k].category === 'official').length,
        regional: Object.keys(this.sourceConfigs).filter(k => this.sourceConfigs[k].category === 'regional').length,
        internal: Object.keys(this.sourceConfigs).filter(k => this.sourceConfigs[k].category === 'internal').length
      },
      expansionPotential: `${totalSources - enabledSources} additional sources available`
    };
  }

  // Existing methods (unchanged)
  enhanceWithML(incidents) {
    return incidents.map(incident => {
      try {
        const mlPrediction = intelligenceEngine.predictSeverity(incident);
        const routeImpact = intelligenceEngine.calculateRouteImpactScore(incident);
        
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

  prioritizeIncidents(incidents) {
    return incidents.sort((a, b) => {
      const severityA = a.mlPrediction?.severity || 2;
      const severityB = b.mlPrediction?.severity || 2;
      const severityDiff = severityB - severityA;
      
      if (Math.abs(severityDiff) > 0.5) return severityDiff;
      
      const impactA = a.routeImpact?.totalImpactScore || 0;
      const impactB = b.routeImpact?.totalImpactScore || 0;
      const impactDiff = impactB - impactA;
      
      if (Math.abs(impactDiff) > 0.1) return impactDiff;
      
      const routesA = a.affectsRoutes?.length || 0;
      const routesB = b.affectsRoutes?.length || 0;
      return routesB - routesA;
    });
  }

  calculateIncidentConfidence(incident, mlPrediction) {
    let confidence = 0.5;
    
    const sourceReliability = this.sourceConfigs[incident.source]?.reliability || 0.5;
    confidence = (confidence + sourceReliability) / 2;
    
    if (mlPrediction?.confidence) {
      confidence = (confidence + mlPrediction.confidence) / 2;
    }
    
    let completeness = 0;
    if (incident.coordinates && Array.isArray(incident.coordinates) && incident.coordinates.length === 2) {
      completeness += 0.4;
    }
    if (incident.title && incident.title.length > 10) completeness += 0.3;
    if (incident.location && incident.location.length > 5) completeness += 0.3;
    
    return Math.max(0.1, Math.min(1.0, (confidence + completeness) / 2));
  }

  calculateConfidence(successfulSources) {
    const enabledSources = Object.values(this.sourceConfigs).filter(s => s.enabled).length;
    return Math.round((successfulSources.length / enabledSources) * 100) / 100;
  }

  getCurrentData() {
    return this.aggregatedData;
  }

  clearCache() {
    this.lastFetchTime = null;
    this.aggregatedData = { incidents: [], lastUpdate: null, confidence: 0 };
    console.log('🧹 [EXPANDED] Enhanced data source cache cleared');
  }

  // NEW: Enable/disable sources dynamically
  enableSource(sourceName) {
    if (this.sourceConfigs[sourceName]) {
      this.sourceConfigs[sourceName].enabled = true;
      console.log(`✅ Enabled source: ${sourceName}`);
      this.clearCache(); // Force refresh
      return true;
    }
    return false;
  }

  disableSource(sourceName) {
    if (this.sourceConfigs[sourceName]) {
      this.sourceConfigs[sourceName].enabled = false;
      console.log(`⛔ Disabled source: ${sourceName}`);
      this.clearCache(); // Force refresh
      return true;
    }
    return false;
  }

  getCapacityReport() {
    const enabled = Object.keys(this.sourceConfigs).filter(k => this.sourceConfigs[k].enabled);
    const disabled = Object.keys(this.sourceConfigs).filter(k => !this.sourceConfigs[k].enabled);
    const active = this.aggregatedData.sources || [];
    
    return {
      current: {
        enabled: enabled.length,
        active: active.length,
        working: active,
        failing: enabled.filter(s => !active.includes(s))
      },
      potential: {
        available: disabled.length,
        total: Object.keys(this.sourceConfigs).length,
        unutilized: disabled
      },
      utilization: `${active.length}/${Object.keys(this.sourceConfigs).length} (${Math.round((active.length / Object.keys(this.sourceConfigs).length) * 100)}%)`
    };
  }
}

const expandedDataSourceManager = new ExpandedDataSourceManager();
export default expandedDataSourceManager;
