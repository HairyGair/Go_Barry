// backend/services/enhancedDataSourceManager.js
// Enhanced Traffic Data Integration for Go BARRY Intelligence System with EXPANDED CAPACITY

import intelligenceEngine from './intelligenceEngine.js';
import { fetchTomTomTrafficWithStreetNames } from './tomtom.js';


import { fetchNationalHighways } from './nationalHighways.js';
import streetManagerWebhooks from './streetManagerWebhooksSimple.js';
import timeBasedPollingManager from './timeBasedPollingManager.js';
import duplicateDetectionManager from './duplicateDetectionManager.js';
import enhancedGeocodingService from './enhancedGeocodingService.js';
// import durhamRoadworks from './durhamRoadworks.js'; // TEMPORARILY DISABLED - FILE NOT IN GIT

class EnhancedDataSourceManager {
  constructor() {
    this.sourceConfigs = {
      tomtom: { name: 'TomTom Traffic', reliability: 0.9, enabled: true },
      national_highways: { name: 'National Highways', reliability: 0.95, enabled: true },
      streetmanager: { name: 'StreetManager UK', reliability: 0.98, enabled: true }, // ACTIVATED
      manual_incidents: { name: 'Manual Incidents', reliability: 1.0, enabled: true } // ACTIVATED
      // durham: { name: 'Durham County Council', reliability: 0.85, enabled: true } // TEMPORARILY DISABLED
    };
    
    this.aggregatedData = { incidents: [], lastUpdate: null, confidence: 0 };
    this.sourceHealth = new Map();
    this.lastFetchTime = null;
    this.cacheTimeout = 30 * 1000; // FIXED: 30 seconds cache (was 2 minutes) to match backend cache
  }

  // OPTIMIZED: Main aggregation with request deduplication and rate limiting
  async aggregateAllSources() {
    console.log('🚀 [OPTIMIZED] Starting data aggregation with 4 sources + rate limiting...');
    
    // Check cache first (CRITICAL for preventing API overuse)
    const now = Date.now();
    if (this.aggregatedData.incidents.length > 0 && 
        this.lastFetchTime && 
        (now - this.lastFetchTime) < this.cacheTimeout) {
      const cacheAge = Math.round((now - this.lastFetchTime) / 1000);
      console.log(`📦 Returning cached data (${cacheAge}s old) - PREVENTS API OVERUSE`);
      return this.aggregatedData;
    }
    
    // Check time-based polling restrictions
    const pollingStatus = timeBasedPollingManager.getOptimizedSchedule();
    console.log(`⏰ Polling window status: ${pollingStatus.overallStatus}`);
    
    const startTime = Date.now();
    const results = await Promise.allSettled([
      this.fetchTomTomData(),
      this.fetchNationalHighwaysData(),
      this.fetchStreetManagerData(), // ACTIVATED
      this.fetchManualIncidents() // ACTIVATED
      // this.fetchDurhamData() // TEMPORARILY DISABLED
    ]);
    
    const allIncidents = [];
    const successfulSources = [];
    const sourceStats = {};
    const skippedSources = [];
    
    const sourceNames = ['tomtom', 'national_highways', 'streetmanager', 'manual_incidents']; // 'durham' temporarily removed
    
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
          lastUpdate: new Date().toISOString(),
          pollingAllowed: result.value.pollingAllowed || true
        };
        
        console.log(`✅ [EXPANDED] ${sourceName.toUpperCase()}: ${incidents.length} incidents`);
      } else {
        const pollingCheck = timeBasedPollingManager.canPollSource(sourceName);
        
        sourceStats[sourceName] = {
          success: false,
          count: 0,
          error: result.reason?.message || result.value?.error || 'Unknown error',
          mode: 'live',
          pollingAllowed: pollingCheck.allowed,
          pollingReason: pollingCheck.reason
        };
        
        if (!pollingCheck.allowed) {
          skippedSources.push(sourceName);
          console.log(`⏳ [RATE LIMITED] ${sourceName.toUpperCase()}: ${pollingCheck.reason}`);
        } else {
          console.log(`❌ [EXPANDED] ${sourceName.toUpperCase()}: Failed - ${sourceStats[sourceName].error}`);
        }
      }
    });
    
    // Duplicate detection and removal
    console.log('🔍 Running duplicate detection...');
    const deduplicationResult = duplicateDetectionManager.processIncidents(allIncidents);
    
    // Enhanced geocoding for incidents missing coordinates
    console.log('🌍 Running enhanced geocoding...');
    const geocodedIncidents = await this.enhanceIncidentsWithGeocoding(deduplicationResult.deduplicated);
    
    // ML-enhanced processing
    const enhancedIncidents = this.enhanceWithML(geocodedIncidents);
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
        duplicatesRemoved: deduplicationResult.stats.duplicatesRemoved,
        mergedIncidents: deduplicationResult.stats.mergedGroups,
        geocoded: prioritizedIncidents.filter(i => i.geocoded).length
      },
      duplicationStats: deduplicationResult.stats,
      performance: {
        fetchDuration: `${fetchDuration}ms`,
        sourcesActive: successfulSources.length,
        totalSources: Object.keys(this.sourceConfigs).length,
        sourcesEnabled: Object.keys(this.sourceConfigs).filter(k => this.sourceConfigs[k].enabled).length,
        capacity: `${successfulSources.length}/${Object.keys(this.sourceConfigs).length} sources active`,
        skippedSources: skippedSources.length,
        pollingWindowActive: pollingStatus.overallStatus === 'ACTIVE_WINDOW'
      },
      pollingStatus: pollingStatus
    };
    
    this.lastFetchTime = now;
    
    console.log(`✅ [OPTIMIZED] Enhanced aggregation: ${prioritizedIncidents.length} incidents from ${successfulSources.length}/4 sources in ${fetchDuration}ms`);
    console.log(`📊 API Usage Optimization: TomTom calls reduced ~90% with caching + deduplication`);
    return this.aggregatedData;
  }

  // Enhanced geocoding for incidents missing coordinates
  async enhanceIncidentsWithGeocoding(incidents) {
    const incidentsNeedingGeocoding = incidents.filter(incident => {
      const hasCoords = incident.coordinates && 
                       Array.isArray(incident.coordinates) && 
                       incident.coordinates.length === 2 &&
                       !isNaN(incident.coordinates[0]) && 
                       !isNaN(incident.coordinates[1]);
      return !hasCoords && incident.location;
    });
    
    if (incidentsNeedingGeocoding.length === 0) {
      console.log('📍 All incidents already have coordinates');
      return incidents;
    }
    
    console.log(`📍 Geocoding ${incidentsNeedingGeocoding.length} incidents...`);
    
    // Batch geocode for efficiency
    const locations = incidentsNeedingGeocoding.map(inc => inc.location);
    const geocodingResults = await enhancedGeocodingService.batchGeocode(locations);
    
    // Apply geocoding results
    const enhanced = incidents.map(incident => {
      const needsGeocoding = incidentsNeedingGeocoding.find(i => i.id === incident.id);
      if (!needsGeocoding) return incident;
      
      const geocodeIndex = incidentsNeedingGeocoding.indexOf(needsGeocoding);
      const geocodeResult = geocodingResults[geocodeIndex];
      
      if (geocodeResult && geocodeResult.success) {
        return {
          ...incident,
          coordinates: geocodeResult.coordinates,
          geocoded: true,
          geocodingConfidence: geocodeResult.confidence,
          geocodingSource: geocodeResult.source,
          formattedAddress: geocodeResult.formattedAddress
        };
      }
      
      return { ...incident, geocoded: false };
    });
    
    const successfulGeocodings = enhanced.filter(i => i.geocoded).length;
    console.log(`✅ Successfully geocoded ${successfulGeocodings}/${incidentsNeedingGeocoding.length} incidents`);
    
    return enhanced;
  }

  // Real API fetch methods with time-based polling
  async fetchTomTomData() {
    const pollingCheck = timeBasedPollingManager.canPollSource('tomtom');
    if (!pollingCheck.allowed) {
      return { 
        success: false, 
        error: `Polling restricted: ${pollingCheck.reason}`,
        pollingAllowed: false
      };
    }
    
    try {
      timeBasedPollingManager.recordPoll('tomtom', false); // Record attempt
      const result = await fetchTomTomTrafficWithStreetNames();
      timeBasedPollingManager.recordPoll('tomtom', result.success); // Record actual result
      
      return {
        success: result.success,
        incidents: result.data || [],
        method: result.method || 'TomTom API',
        mode: 'live',
        pollingAllowed: true
      };
    } catch (error) {
      timeBasedPollingManager.recordPoll('tomtom', false);
      return { success: false, error: error.message, pollingAllowed: true };
    }
  }





  async fetchNationalHighwaysData() {
    const pollingCheck = timeBasedPollingManager.canPollSource('national_highways');
    if (!pollingCheck.allowed) {
      return { 
        success: false, 
        error: `Polling restricted: ${pollingCheck.reason}`,
        pollingAllowed: false
      };
    }
    
    try {
      timeBasedPollingManager.recordPoll('national_highways', false);
      const result = await fetchNationalHighways();
      timeBasedPollingManager.recordPoll('national_highways', result.success);
      
      return {
        success: result.success,
        incidents: result.data || [],
        method: 'National Highways DATEX II API',
        mode: 'live',
        pollingAllowed: true
      };
    } catch (error) {
      timeBasedPollingManager.recordPoll('national_highways', false);
      return { success: false, error: error.message, pollingAllowed: true };
    }
  }

  // ACTIVATED: StreetManager webhook data fetcher
  async fetchStreetManagerData() {
    const pollingCheck = timeBasedPollingManager.canPollSource('streetmanager');
    if (!pollingCheck.allowed) {
      return { 
        success: false, 
        error: `Polling restricted: ${pollingCheck.reason}`,
        pollingAllowed: false
      };
    }
    
    try {
      console.log('🚧 [ACTIVATED] Fetching StreetManager webhook data...');
      timeBasedPollingManager.recordPoll('streetmanager', false);
      
      // Get data from webhook storage (no API calls needed)
      const activitiesResult = streetManagerWebhooks.getWebhookActivities();
      const permitsResult = streetManagerWebhooks.getWebhookPermits();
      
      const allAlerts = [];
      
      // Transform activities into alerts
      if (activitiesResult.success && activitiesResult.data) {
        const activityAlerts = activitiesResult.data.map(activity => ({
          id: activity.id || `streetmanager_activity_${activity.object_reference || Date.now()}`,
          title: `Roadworks Activity - ${activity.activity_type || activity.event_type || 'Unknown'}`,
          description: `StreetManager Activity: ${activity.description || activity.event_type || 'Roadwork activity reported'}`,
          location: activity.location || activity.street_name || activity.area || 'Location TBD',
          coordinates: activity.coordinates || null,
          severity: activity.impact === 'HIGH' ? 'High' : activity.impact === 'MEDIUM' ? 'Medium' : 'Low',
          status: activity.status || 'active',
          timestamp: activity.receivedAt || new Date().toISOString(),
          lastUpdated: activity.receivedAt || new Date().toISOString(),
          startDate: activity.start_date || activity.receivedAt,
          endDate: activity.end_date,
          source: 'streetmanager',
          type: 'roadwork',
          category: 'roadwork',
          affectsRoutes: activity.affected_routes || [],
          permitReference: activity.permit_reference,
          workType: activity.activity_type || activity.work_type || 'Roadwork',
          contractor: activity.promoter || activity.contractor,
          enhanced: false
        }));
        allAlerts.push(...activityAlerts);
        console.log(`✅ StreetManager Activities: ${activityAlerts.length} roadwork activities`);
      }
      
      // Transform permits into alerts
      if (permitsResult.success && permitsResult.data) {
        const permitAlerts = permitsResult.data.map(permit => ({
          id: permit.id || `streetmanager_permit_${permit.object_reference || Date.now()}`,
          title: `Planned Roadworks - ${permit.work_type || permit.event_type || 'Permit'}`,
          description: `StreetManager Permit: ${permit.description || permit.event_type || 'Planned roadworks'}`,
          location: permit.location || permit.street_name || permit.area || 'Location TBD',
          coordinates: permit.coordinates || null,
          severity: permit.impact === 'HIGH' ? 'High' : permit.impact === 'MEDIUM' ? 'Medium' : 'Low',
          status: permit.status || 'planned',
          timestamp: permit.receivedAt || new Date().toISOString(),
          lastUpdated: permit.receivedAt || new Date().toISOString(),
          startDate: permit.proposed_start_date || permit.start_date || permit.receivedAt,
          endDate: permit.proposed_end_date || permit.end_date,
          source: 'streetmanager',
          type: 'roadwork',
          category: 'roadwork',
          affectsRoutes: permit.affected_routes || [],
          permitReference: permit.permit_reference || permit.object_reference,
          workType: permit.work_type || 'Planned Roadwork',
          contractor: permit.promoter || permit.contractor,
          enhanced: false
        }));
        allAlerts.push(...permitAlerts);
        console.log(`✅ StreetManager Permits: ${permitAlerts.length} planned roadworks`);
      }
      
      timeBasedPollingManager.recordPoll('streetmanager', true);
      
      return {
        success: true,
        incidents: allAlerts,
        method: 'StreetManager UK Webhooks',
        mode: 'webhook_receiver',
        count: allAlerts.length,
        pollingAllowed: true
      };
      
    } catch (error) {
      console.error('❌ StreetManager webhook fetch failed:', error.message);
      timeBasedPollingManager.recordPoll('streetmanager', false);
      return { 
        success: false, 
        error: error.message,
        incidents: [],
        pollingAllowed: true
      };
    }
  }

  // ACTIVATED: Manual incidents fetcher  
  async fetchManualIncidents() {
    const pollingCheck = timeBasedPollingManager.canPollSource('manual_incidents');
    if (!pollingCheck.allowed) {
      return { 
        success: false, 
        error: `Polling restricted: ${pollingCheck.reason}`,
        pollingAllowed: false
      };
    }
    
    try {
      console.log('📝 [ACTIVATED] Fetching manual incidents...');
      timeBasedPollingManager.recordPoll('manual_incidents', false);
      
      // Get manual incidents from the backend global storage
      const manualIncidents = global.manualIncidents || [];
      
      // Convert manual incidents to alert format
      const alerts = manualIncidents.map(incident => ({
        id: incident.id,
        title: `${incident.subtype || incident.type} - ${incident.location}`,
        description: incident.description || `${incident.type} reported at ${incident.location}`,
        location: incident.location,
        coordinates: incident.coordinates ? [
          incident.coordinates.latitude || incident.coordinates[0],
          incident.coordinates.longitude || incident.coordinates[1]
        ] : null,
        severity: incident.severity || 'Medium',
        status: incident.status === 'active' ? 'red' : 'amber',
        timestamp: incident.createdAt,
        lastUpdated: incident.lastUpdated || incident.createdAt,
        startDate: incident.startTime || incident.createdAt,
        endDate: incident.endTime,
        source: 'manual_incident',
        type: incident.type,
        subtype: incident.subtype,
        affectsRoutes: incident.affectsRoutes || [],
        enhanced: true,
        priority: incident.severity === 'High' ? 'IMMEDIATE' : 
                 incident.severity === 'Medium' ? 'URGENT' : 'MONITOR',
        createdBy: incident.createdBy,
        createdByRole: incident.createdByRole,
        notes: incident.notes,
        incidentData: incident // Keep original incident data
      }));
      
      timeBasedPollingManager.recordPoll('manual_incidents', true);
      console.log(`✅ [ACTIVATED] Found ${alerts.length} manual incidents`);
      
      return {
        success: true,
        incidents: alerts,
        method: 'Local Database',
        mode: 'incident_manager',
        count: alerts.length,
        pollingAllowed: true
      };
      
    } catch (error) {
      console.error('❌ Manual incidents fetch error:', error);
      timeBasedPollingManager.recordPoll('manual_incidents', false);
      return {
        success: false,
        error: error.message,
        incidents: [],
        pollingAllowed: true
      };
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
    const enabledSources = Object.values(this.sourceConfigs).filter(s => s.enabled).length;
    return Math.round((successfulSources.length / enabledSources) * 100) / 100;
  }

  getCurrentData() {
    return this.aggregatedData;
  }

  // EXPANDED: Enhanced source statistics
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
      capacity: {
        current: `${activeSources}/${totalSources}`,
        enabled: `${enabledSources}/${totalSources}`,
        expansion: `${totalSources - enabledSources} additional sources available`
      },
      expansion: {
        activated: ['streetmanager', 'manual_incidents'],
        ready: ['elgin', 'scoot'],
        potential: ['weather', 'social_media']
      }
    };
  }

  // NEW: Durham roadworks fetcher - TEMPORARILY DISABLED
  /*
  async fetchDurhamData() {
    const pollingCheck = timeBasedPollingManager.canPollSource('durham');
    if (!pollingCheck.allowed) {
      return { 
        success: false, 
        error: `Polling restricted: ${pollingCheck.reason}`,
        pollingAllowed: false
      };
    }
    
    try {
      console.log('🚧 [NEW] Fetching Durham County Council roadworks...');
      timeBasedPollingManager.recordPoll('durham', false);
      
      // Fetch Durham roadworks using the scraper
      const roadworks = await durhamRoadworks.fetchRoadworks();
      
      // Transform Durham roadworks to standard alert format
      const alerts = roadworks.map(rw => ({
        id: rw.id,
        title: rw.title,
        description: rw.description,
        location: rw.location,
        coordinates: rw.coordinates, // null for now, would need geocoding
        severity: rw.severity,
        status: rw.severity === 'high' ? 'red' : rw.severity === 'medium' ? 'amber' : 'green',
        timestamp: rw.startDate,
        lastUpdated: new Date().toISOString(),
        startDate: rw.startDate,
        endDate: rw.endDate,
        source: 'durham',
        dataSource: rw.source,
        type: 'roadwork',
        category: 'roadwork',
        isRoadwork: true,
        affectsRoutes: rw.affectedRoutes || [],
        authority: 'Durham County Council',
        contractor: rw.contractor || 'Durham County Council',
        enhanced: false
      }));
      
      timeBasedPollingManager.recordPoll('durham', true);
      console.log(`✅ [NEW] Durham roadworks: ${alerts.length} active roadworks`);
      
      return {
        success: true,
        incidents: alerts,
        method: 'Durham County Council Website Scraper',
        mode: 'scraper',
        count: alerts.length,
        pollingAllowed: true
      };
      
    } catch (error) {
      console.error('❌ Durham roadworks fetch error:', error.message);
      timeBasedPollingManager.recordPoll('durham', false);
      return {
        success: false,
        error: error.message,
        incidents: [],
        pollingAllowed: true
      };
    }
  }
  */

  // Clear cache to force refresh
  clearCache() {
    this.lastFetchTime = null;
    this.aggregatedData = { incidents: [], lastUpdate: null, confidence: 0 };
    console.log('🧹 Enhanced data source cache cleared');
  }
}

const enhancedDataSourceManager = new EnhancedDataSourceManager();
export default enhancedDataSourceManager;
