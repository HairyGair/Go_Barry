// backend/services/unifiedRoadworksManager.js
// Unified roadworks data aggregator and management system with StreetManager fallback

// Removed axios import - app only uses database/webhook data, not external API calls
import { generateAlertHash } from '../utils/alertDeduplication.js';
// Removed streetManager import - app only uses AWS webhook data, not external API calls
import { convexSync } from './convexSync.js';
import { supabaseOptimizer } from './supabaseOptimizer.js';
import { loadStreetManagerFallback, checkWebhookHealth } from './streetManagerFallback.js';
import { bngToLatLng, parseStreetManagerGeometry } from '../utils/bngToLatLng.js';

// Lazy load Supabase client only when needed
let supabase = null;
async function getSupabaseClient() {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  }
  return supabase;
}

/**
 * Unified Roadworks Manager
 * Aggregates data from:
 * 1. Street Manager (national UK system - comprehensive coverage)
 * 2. Manual incidents
 */
class UnifiedRoadworksManager {
  constructor() {
    this.sources = {
      streetManager: { enabled: true, priority: 1 },
      manual: { enabled: true, priority: 2 }
    };
    this.lastUpdate = null;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Circuit breaker for Street Manager
    this.streetManagerFailures = 0;
    this.streetManagerLastFailure = 0;
    this.streetManagerDisabled = false;
    this.streetManagerDisabledUntil = 0;
  }

  /**
   * Enhanced coordinate extraction from StreetManager webhook data
   * Handles multiple coordinate formats including BNG conversion
   */
  extractCoordinatesFromWebhook(streetwork) {
    console.log(`🗺️ Extracting coordinates for streetwork ${streetwork.id}...`);
    
    // Method 1: Check pre-converted WGS84 coordinates (most reliable)
    if (streetwork.latitude && streetwork.longitude) {
      const lat = parseFloat(streetwork.latitude);
      const lng = parseFloat(streetwork.longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        console.log(`✅ Found pre-converted WGS84: ${lat}, ${lng}`);
        return {
          lat,
          lng,
          source: 'streetworks_wgs84'
        };
      }
    }
    
    // Method 2: Check BNG coordinates in streetworks table
    if (streetwork.sm_easting && streetwork.sm_northing) {
      try {
        const eastingVal = parseFloat(streetwork.sm_easting);
        const northingVal = parseFloat(streetwork.sm_northing);
        
        if (!isNaN(eastingVal) && !isNaN(northingVal)) {
          console.log(`🗺️ Converting BNG coordinates: ${eastingVal}, ${northingVal}`);
          const wgs84 = bngToLatLng(eastingVal, northingVal);
          console.log(`✅ Converted BNG to WGS84: ${wgs84.lat}, ${wgs84.lng}`);
          return {
            lat: wgs84.lat,
            lng: wgs84.lng,
            source: 'streetworks_bng_converted',
            originalBNG: { easting: eastingVal, northing: northingVal }
          };
        }
      } catch (e) {
        console.warn(`⚠️ Failed to convert BNG coordinates:`, e.message);
      }
    }
    
    // Method 3: Parse works_location_coordinates from raw webhook data
    if (streetwork.raw_webhook_data) {
      try {
        const rawData = typeof streetwork.raw_webhook_data === 'string' ? 
          JSON.parse(streetwork.raw_webhook_data) : streetwork.raw_webhook_data;
        
        if (rawData && rawData.object_data && rawData.object_data.works_location_coordinates) {
          const geometryString = rawData.object_data.works_location_coordinates;
          console.log(`🗺️ Found works_location_coordinates: ${geometryString}`);
          
          const parsed = parseStreetManagerGeometry(geometryString);
          if (parsed) {
            console.log(`✅ Parsed geometry to WGS84: ${parsed.lat}, ${parsed.lng} (${parsed.source})`);
            return parsed;
          }
        }
      } catch (e) {
        console.warn(`⚠️ Failed to parse raw webhook data for ${streetwork.id}:`, e.message);
        // Log the raw data structure for debugging
        console.log(`Raw data type: ${typeof streetwork.raw_webhook_data}`);
      }
    }
    
    console.log(`❌ No coordinates found for streetwork ${streetwork.id}`);
    return null;
  }

  /**
   * Get all roadworks from all sources
   */
  async getAllRoadworks(options = {}) {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Fetching unified roadworks data (optimized)...');
      
      const results = {
        streetManager: [],
        manual: [],
        combined: [],
        metadata: {
          sources: {},
          totalCount: 0,
          lastUpdate: new Date().toISOString(),
          processingTime: 0
        }
      };

      // Fetch from all enabled sources in parallel with global timeout
      const promises = [];

      if (this.sources.streetManager.enabled) {
        promises.push(this.getStreetManagerRoadworks());
      }

      if (this.sources.manual.enabled) {
        promises.push(this.getManualRoadworks());
      }

      // Add global timeout for the entire operation
      const globalTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Global unified roadworks timeout')), 15000) // 15 second max
      );

      const sourceResults = await Promise.race([
        Promise.allSettled(promises),
        globalTimeout
      ]);

      // Process results
      let sourceIndex = 0;
      if (this.sources.streetManager.enabled) {
        const smResult = sourceResults[sourceIndex++];
        if (smResult.status === 'fulfilled') {
          results.streetManager = smResult.value.data || [];
          results.metadata.sources.streetManager = {
            success: true,
            count: results.streetManager.length,
            lastUpdate: smResult.value.lastUpdate,
            features: {
              webhookIntegration: true,
              routeMatching: true,
              mlPrediction: true,
              realTimeSync: true
            }
          };
        } else {
          results.metadata.sources.streetManager = {
            success: false,
            error: smResult.reason?.message
          };
        }
      }

      if (this.sources.manual.enabled) {
        const manualResult = sourceResults[sourceIndex++];
        if (manualResult.status === 'fulfilled') {
          results.manual = manualResult.value.data || [];
          results.metadata.sources.manual = {
            success: true,
            count: results.manual.length,
            lastUpdate: manualResult.value.lastUpdate
          };
        } else {
          results.metadata.sources.manual = {
            success: false,  
            error: manualResult.reason?.message
          };
        }
      }

      // Combine all roadworks
      results.combined = [
        ...results.streetManager,
        ...results.manual
      ];

      // Fast deduplication by location and timing (simplified for performance)
      if (results.combined.length > 0) {
        console.log(`🔄 Fast deduplicating ${results.combined.length} roadworks...`);
        results.combined = this.deduplicateRoadworksFast(results.combined);
      }

      // Calculate metadata
      results.metadata.totalCount = results.combined.length;
      results.metadata.criticalCount = results.combined.filter(r => r.severity === 'Critical' || r.severity === 'High').length;
      results.metadata.highImpactCount = results.combined.filter(r => r.hasRouteImpact).length;
      results.metadata.processingTime = Date.now() - startTime;

      // Cache the results
      this.lastUpdate = new Date();

      console.log(`✅ Unified roadworks completed in ${results.metadata.processingTime}ms: ${results.combined.length} total (Street Manager: ${results.streetManager.length}, Manual: ${results.manual.length})`);

      // Skip Convex sync for performance (can be done asynchronously later)
      const highImpactCount = results.combined.filter(r => 
        r.severity === 'Critical' || r.severity === 'High' || r.hasRouteImpact
      ).length;
      
      if (highImpactCount > 0) {
        console.log(`📊 Found ${highImpactCount} high-impact roadworks (sync skipped for performance)`);
      }

      return {
        success: true,
        ...results
      };

    } catch (error) {
      console.error('❌ Error fetching unified roadworks:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Sync high-impact roadworks to real-time systems
   */
  async syncHighImpactRoadworks(roadworks = []) {
    try {
      if (roadworks.length === 0) return;
      
      const highPriorityRoadworks = roadworks.filter(r => 
        r.severity === 'Critical' || 
        r.severity === 'High' || 
        (r.affectedRoutes && r.affectedRoutes.length > 3) ||
        r.isTrafficSensitive ||
        r.trafficManagement === 'road_closure'
      );
      
      if (highPriorityRoadworks.length > 0) {
        await convexSync.syncUrgentRoadworks(highPriorityRoadworks.map(r => ({
          ...r,
          urgentReason: `High priority: ${r.severity} severity, ${r.affectedRoutes?.length || 0} routes affected`,
          syncedAt: new Date().toISOString()
        })));
        
        console.log(`🚨 Synced ${highPriorityRoadworks.length} high-priority roadworks for real-time updates`);
      }
    } catch (syncError) {
      console.error('⚠️ Failed to sync high-impact roadworks:', syncError.message);
    }
  }

  /**
   * Get StreetManager roadworks with dual-table support
   * Queries both 'streetworks' (webhook data) and 'roadworks' (manual/processed data)
   */
  async getStreetManagerRoadworks() {
    const startTime = Date.now();
    
    try {
      console.log('🚧 Fetching unified roadworks data from both tables...');
      
      // Check circuit breaker
      if (this.streetManagerDisabled && Date.now() < this.streetManagerDisabledUntil) {
        const remainingTime = Math.round((this.streetManagerDisabledUntil - Date.now()) / 1000);
        console.log(`🚨 Street Manager disabled by circuit breaker for ${remainingTime}s`);
        
        return {
          success: false,
          data: [],
          error: 'Street Manager disabled by circuit breaker',
          circuitBreaker: true,
          retryAfter: this.streetManagerDisabledUntil - Date.now(),
          source: 'street_manager'
        };
      }
      
      // Check cache first for recent data (5 minute cache)
      const cached = this.cache.get('unified_roadworks_data');
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        console.log(`📋 Using cached unified roadworks data (${Date.now() - cached.timestamp}ms old)`);
        return {
          success: true,
          data: cached.data,
          cached: true,
          source: 'unified_cache',
          metadata: cached.metadata
        };
      }
      
      // Query both tables in parallel for optimal performance
      let streetworksData = [];
      let roadworksData = [];
      let combinedData = [];
      
      try {
        console.log('📨 Fetching data from both streetworks and roadworks tables...');
        
        // Add timeout wrapper for database calls
        const dbTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 8000)
        );
        
        const supabaseClient = await getSupabaseClient();
        if (!supabaseClient) {
          throw new Error('Supabase client not available');
        }
        
        // Query streetworks table (Street Manager webhook data)
        const streetworksQuery = supabaseClient
          .from('streetworks')
          .select(`
            id, sm_reference, sm_permit_reference, sm_promoter_name, 
            sm_works_description, sm_works_category, sm_traffic_sensitive,
            sm_highway_authority, sm_works_state, sm_location_description,
            sm_street_name, sm_area_name, sm_easting, sm_northing,
            sm_start_date, sm_end_date, sm_actual_start_date, sm_actual_end_date,
            sm_traffic_management_type, latitude, longitude, severity, 
            webhook_received_at, raw_webhook_data, status, 
            auto_matched_routes, confirmed_routes, created_at, updated_at
          `)
          .order('webhook_received_at', { ascending: false })
          .limit(300); // Reduced limit for performance
        
        // Query roadworks table (manual/processed roadworks)
        const roadworksQuery = supabaseClient
          .from('roadworks')
          .select(`
            id, title, description, location, authority, coordinates,
            affects_routes, start_date, end_date, status, severity, type,
            source, permit_reference, work_reference, promoter, work_category,
            traffic_impact, work_status, last_updated, processed_at,
            created_at, updated_at, created_by_supervisor_id, created_by_name,
            routes_affected, raw_data
          `)
          .order('updated_at', { ascending: false })
          .limit(100); // All manual roadworks
        
        // Execute both queries in parallel with timeout
        const [streetworksResult, roadworksResult] = await Promise.race([
          Promise.allSettled([streetworksQuery, roadworksQuery]),
          dbTimeout
        ]);
        
        // Process streetworks data
        if (streetworksResult.status === 'fulfilled') {
          const { data: streetworksRecords, error: streetworksError } = streetworksResult.value;
          if (streetworksError) {
            console.warn('⚠️ Streetworks query error:', streetworksError.message);
          } else if (streetworksRecords && streetworksRecords.length > 0) {
            console.log(`✅ Found ${streetworksRecords.length} streetworks records`);
            streetworksData = this.transformStreetworksData(streetworksRecords);
          }
        } else {
          console.warn('⚠️ Streetworks query failed:', streetworksResult.reason?.message);
        }
        
        // Process roadworks data
        if (roadworksResult.status === 'fulfilled') {
          const { data: roadworksRecords, error: roadworksError } = roadworksResult.value;
          if (roadworksError) {
            console.warn('⚠️ Roadworks query error:', roadworksError.message);
          } else if (roadworksRecords && roadworksRecords.length > 0) {
            console.log(`✅ Found ${roadworksRecords.length} roadworks records`);
            roadworksData = this.transformRoadworksData(roadworksRecords);
          }
        } else {
          console.warn('⚠️ Roadworks query failed:', roadworksResult.reason?.message);
        }
        
        // Combine data from both sources
        combinedData = [...streetworksData, ...roadworksData];
        console.log(`🔄 Combined data: ${streetworksData.length} streetworks + ${roadworksData.length} roadworks = ${combinedData.length} total`);
        
      } catch (error) {
        console.warn(`⚠️ Database error (${Date.now() - startTime}ms):`, error.message);
        // When database fails, force use of fallback data
        combinedData = [];
      }
      
      // If no combined data, try fallback data source
      if (combinedData.length === 0) {
        console.log('📁 No roadworks data found, loading fallback data...');
        try {
          const fallbackResult = await loadStreetManagerFallback();
          if (fallbackResult.success && fallbackResult.data.length > 0) {
            console.log(`📁 Using ${fallbackResult.data.length} fallback StreetManager records`);
            const fallbackRoadworks = this.transformFallbackData(fallbackResult.data);
            
            // Cache fallback data
            const cacheData = {
              data: fallbackRoadworks,
              timestamp: Date.now(),
              source: 'street_manager_fallback',
              metadata: {
                streetworksCount: 0,
                roadworksCount: 0,
                fallbackCount: fallbackRoadworks.length
              }
            };
            this.cache.set('unified_roadworks_data', cacheData);
            
            return {
              success: true,
              data: fallbackRoadworks,
              lastUpdate: new Date().toISOString(),
              source: 'street_manager_fallback',
              processingTime: Date.now() - startTime,
              fallbackUsed: true,
              metadata: {
                streetworksCount: 0,
                roadworksCount: 0,
                fallbackCount: fallbackRoadworks.length,
                totalCount: fallbackRoadworks.length
              }
            };
          }
        } catch (fallbackError) {
          console.warn('⚠️ Fallback data loading failed:', fallbackError.message);
        }
      }
      
      // Cache the results for next time
      if (combinedData.length > 0) {
        const metadata = {
          streetworksCount: streetworksData.length,
          roadworksCount: roadworksData.length,
          totalCount: combinedData.length,
          lastFetch: new Date().toISOString()
        };
        
        const cacheData = {
          data: combinedData,
          timestamp: Date.now(),
          source: 'unified_tables',
          metadata
        };
        this.cache.set('unified_roadworks_data', cacheData);
      }
      
      console.log(`✅ Unified roadworks fetch completed in ${Date.now() - startTime}ms: ${combinedData.length} total items (${streetworksData.length} streetworks + ${roadworksData.length} roadworks)`);
      
      return {
        success: true,
        data: combinedData,
        lastUpdate: new Date().toISOString(),
        source: 'unified_tables',
        processingTime: Date.now() - startTime,
        metadata: {
          streetworksCount: streetworksData.length,
          roadworksCount: roadworksData.length,
          totalCount: combinedData.length,
          dataSourcesUsed: ['streetworks', 'roadworks']
        }
      };
        
    } catch (error) {
      console.error(`❌ Error in getStreetManagerRoadworks (${Date.now() - startTime}ms):`, error.message);
      
      // Increment failure count for circuit breaker
      this.streetManagerFailures++;
      this.streetManagerLastFailure = Date.now();
      
      // Enable circuit breaker after 3 failures
      if (this.streetManagerFailures >= 3) {
        this.streetManagerDisabled = true;
        this.streetManagerDisabledUntil = Date.now() + (5 * 60 * 1000); // 5 minute cooldown
        console.log(`🚨 Street Manager circuit breaker activated for 5 minutes`);
      }
      
      return {
        success: false,
        data: [],
        error: error.message,
        source: 'street_manager',
        processingTime: Date.now() - startTime,
        failures: this.streetManagerFailures
      };
    }
  }
  
  /**
   * Transform streetworks table data to unified roadworks format
   * Handles Street Manager webhook data with rich schema
   */
  transformStreetworksData(streetworksRecords) {
    console.log(`🔄 Transforming ${streetworksRecords.length} streetworks records...`);
    const startTime = Date.now();
    
    const roadworks = streetworksRecords.map(record => {
      // Extract coordinates from multiple sources
      let coordinates = null;
      
      // Try direct WGS84 coordinates first
      if (record.latitude && record.longitude) {
        coordinates = [parseFloat(record.latitude), parseFloat(record.longitude)];
      } 
      // Try BNG coordinates conversion
      else if (record.sm_easting && record.sm_northing) {
        try {
          const wgs84 = bngToLatLng(parseFloat(record.sm_easting), parseFloat(record.sm_northing));
          coordinates = [wgs84.lat, wgs84.lng];
        } catch (e) {
          console.warn(`⚠️ BNG conversion failed for ${record.id}:`, e.message);
        }
      }
      // Fallback to webhook data coordinates
      else {
        const coords = this.extractCoordinatesFromWebhook(record);
        if (coords) {
          coordinates = [coords.lat, coords.lng];
        }
      }
      
      // Build location description
      const locationParts = [
        record.sm_location_description,
        record.sm_street_name,
        record.sm_area_name
      ].filter(Boolean);
      const location = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown location';
      
      // Determine severity based on traffic impact and work category
      let severity = record.severity || 'medium';
      if (record.sm_traffic_sensitive || record.sm_traffic_management_type?.includes('closure')) {
        severity = 'high';
      }
      
      return {
        id: record.id,
        title: `Street Manager: ${record.sm_street_name || location}`,
        location: location,
        description: record.sm_works_description || 'Street works activity',
        startDate: record.sm_actual_start_date || record.sm_start_date,
        endDate: record.sm_actual_end_date || record.sm_end_date,
        source: 'StreetManager',
        dataSource: 'streetworks_table',
        severity: severity,
        status: record.status || 'active',
        coordinates: coordinates,
        
        // Street Manager specific fields
        permitReference: record.sm_permit_reference,
        workReference: record.sm_reference,
        promoter: record.sm_promoter_name,
        authority: record.sm_highway_authority,
        workCategory: record.sm_works_category,
        workState: record.sm_works_state,
        trafficSensitive: record.sm_traffic_sensitive,
        trafficManagement: record.sm_traffic_management_type,
        
        // Route matching
        affectedRoutes: record.auto_matched_routes || record.confirmed_routes || [],
        hasRouteImpact: (record.auto_matched_routes?.length || 0) > 0 || (record.confirmed_routes?.length || 0) > 0,
        
        // Metadata
        isAutomatic: true,
        canEdit: false,
        canDismiss: true,
        webhookData: true,
        timestamp: Date.now(),
        receivedAt: record.webhook_received_at,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      };
    });
    
    console.log(`✅ Streetworks transformation completed in ${Date.now() - startTime}ms`);
    return roadworks;
  }

  /**
   * Transform roadworks table data to unified roadworks format
   * Handles manual and processed roadworks data
   */
  transformRoadworksData(roadworksRecords) {
    console.log(`🔄 Transforming ${roadworksRecords.length} roadworks records...`);
    const startTime = Date.now();
    
    const roadworks = roadworksRecords.map(record => {
      // Parse coordinates if they exist
      let coordinates = null;
      if (record.coordinates) {
        try {
          // Handle different coordinate formats
          if (typeof record.coordinates === 'string') {
            coordinates = JSON.parse(record.coordinates);
          } else if (Array.isArray(record.coordinates)) {
            coordinates = record.coordinates;
          }
        } catch (e) {
          console.warn(`⚠️ Failed to parse coordinates for ${record.id}:`, e.message);
        }
      }
      
      return {
        id: record.id,
        title: record.title || `Manual: ${record.location}`,
        location: record.location || 'Unknown location',
        description: record.description || 'Manual roadwork entry',
        startDate: record.start_date,
        endDate: record.end_date,
        source: record.source || 'Manual',
        dataSource: 'roadworks_table',
        severity: record.severity || 'medium',
        status: record.status || 'active',
        coordinates: coordinates,
        
        // Roadworks specific fields
        authority: record.authority,
        permitReference: record.permit_reference,
        workReference: record.work_reference,
        promoter: record.promoter,
        workCategory: record.work_category,
        trafficImpact: record.traffic_impact,
        workStatus: record.work_status,
        type: record.type,
        
        // Route information
        affectedRoutes: record.routes_affected || record.affects_routes || [],
        hasRouteImpact: (record.routes_affected?.length || 0) > 0 || (record.affects_routes?.length || 0) > 0,
        
        // Supervisor attribution
        createdBy: record.created_by_name,
        createdBySupervisorId: record.created_by_supervisor_id,
        
        // Metadata
        isAutomatic: record.source !== 'Manual' && record.created_by_supervisor_id === 'WEBHOOK',
        canEdit: true,
        canDismiss: true,
        manualEntry: record.source === 'Manual' || record.created_by_supervisor_id !== 'WEBHOOK',
        timestamp: Date.now(),
        lastUpdated: record.last_updated,
        processedAt: record.processed_at,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        rawData: record.raw_data
      };
    });
    
    console.log(`✅ Roadworks transformation completed in ${Date.now() - startTime}ms`);
    return roadworks;
  }

  /**
   * Fast transformation of webhook data to roadworks format (legacy)
   * Optimized for performance with minimal processing
   */
  transformWebhookDataFast(notifications) {
    console.log(`🔄 Fast transforming ${notifications.length} webhook notifications...`);
    const startTime = Date.now();
    
    const roadworks = notifications.map(notification => {
      // Extract coordinates from multiple sources
      let coordinates = null;
      
      // Try direct lat/lng first
      if (notification.latitude && notification.longitude) {
        coordinates = [notification.latitude, notification.longitude];
      } 
      // Fallback to webhook data coordinates using existing method
      else {
        const coords = this.extractCoordinatesFromWebhook(notification);
        if (coords) {
          coordinates = [coords.lat, coords.lng];
        }
      }
      
      // Determine location description
      const location = notification.sm_location_description || 
                      notification.sm_street_name || 
                      notification.raw_webhook_data?.object_data?.street_name ||
                      'Unknown location';
      
      // Determine activity type/description
      const description = notification.sm_works_description || 
                         notification.raw_webhook_data?.object_data?.activity_type ||
                         'Street works activity';
      
      // Fast transformation with correct column mapping
      return {
        id: notification.id || `street_${Date.now()}_${Math.random()}`,
        title: `StreetManager: ${location}`,
        location: location,
        description: description,
        startDate: notification.sm_actual_start_date || notification.raw_webhook_data?.object_data?.actual_start_date_time,
        endDate: notification.sm_end_date || notification.raw_webhook_data?.object_data?.proposed_end_date,
        source: 'StreetManager',
        severity: notification.severity || 'medium',
        status: 'active',
        coordinates: coordinates,
        permitReference: notification.sm_permit_reference || notification.raw_webhook_data?.object_data?.permit_reference_number,
        timestamp: Date.now(),
        receivedAt: notification.webhook_received_at
      };
    });
    
    console.log(`✅ Fast transformation completed in ${Date.now() - startTime}ms`);
    return roadworks;
  }

  /**
   * Transform webhook data to roadworks format (legacy - more comprehensive)
   */
  transformWebhookData(notifications) {
    return notifications.map(notification => this.transformSingleWebhookRecord(notification));
  }
  
  /**
   * Transform single webhook notification to roadwork format
   */
  transformSingleWebhookRecord(notification) {
    const rawData = notification.raw_webhook_data || {};
    const objectData = rawData.object_data || {};
    
    // Extract coordinates using enhanced method
    const extractedCoords = this.extractCoordinatesFromWebhook(notification);
    const coordinates = extractedCoords ? [extractedCoords.lat, extractedCoords.lng] : null;
    
    if (extractedCoords) {
      console.log(`🎯 Successfully extracted coordinates for ${notification.id}: [${extractedCoords.lat}, ${extractedCoords.lng}] from ${extractedCoords.source}`);
    } else {
      console.log(`❌ No coordinates extracted for ${notification.id}`);
    }
    
    return {
      id: notification.notification_id,
      title: notification.title || `${objectData.activity_type || 'Roadwork'} - ${objectData.street_name || 'Unknown Street'}`,
      description: notification.description || `Street Manager notification: ${notification.webhook_event_type}`,
      location: notification.location_description || `${objectData.street_name || 'Unknown'}, ${objectData.area_name || 'Unknown'}`,
      coordinates: coordinates,
      coordinateSource: extractedCoords?.source || 'none',
      
      // Status and severity
      status: notification.alert_status || 'amber',
      severity: notification.severity || 'Medium',
      
      // Source information
      source: 'StreetManager',
      dataSource: 'StreetManager Webhook',
      sourceId: notification.notification_id,
      
      // Timing
      startDate: notification.proposed_start_date,
      endDate: notification.proposed_end_date,
      lastUpdated: notification.webhook_received_at,
      
      // Street Manager specific
      permitReference: notification.permit_reference_number,
      activityReference: notification.activity_reference_number,
      workCategory: notification.work_category_ref,
      authority: notification.highway_authority,
      streetName: notification.street_name,
      areaName: notification.area_name,
      town: notification.town,
      eventType: notification.webhook_event_type,
      
      // Work details
      activityType: notification.activity_type,
      isTrafficSensitive: notification.is_traffic_sensitive,
      trafficManagement: notification.traffic_management_type,
      
      // Route impact
      hasRouteImpact: (notification.affected_routes?.length || 0) > 0,
      affectedRoutes: notification.affected_routes || [],
      
      // UI metadata
      isAutomatic: true,
      canEdit: false,
      canDismiss: true,
      canPromoteToDisplay: true,
      webhookData: true,
      realTimeData: true
    };
  }
  
  /**
   * Transform fallback data to roadworks format
   */
  transformFallbackData(fallbackRecords) {
    return fallbackRecords.map(record => this.transformSingleFallbackRecord(record));
  }
  
  /**
   * Transform single fallback record to roadwork format
   */
  transformSingleFallbackRecord(record) {
    // Extract coordinates using enhanced method
    const extractedCoords = this.extractCoordinatesFromWebhook(record);
    const coordinates = extractedCoords ? [extractedCoords.lat, extractedCoords.lng] : null;
    
    if (extractedCoords) {
      console.log(`🎯 Successfully extracted coordinates for fallback ${record.notification_id}: [${extractedCoords.lat}, ${extractedCoords.lng}] from ${extractedCoords.source}`);
    } else {
      console.log(`❌ No coordinates extracted for fallback ${record.notification_id}`);
    }
    
    return {
      id: record.notification_id,
      title: record.title,
      description: record.description,
      location: record.location_description,
      coordinates: coordinates,
      coordinateSource: extractedCoords?.source || 'none',
      
      // Status and severity
      status: record.alert_status || 'amber',
      severity: record.severity || 'Medium',
      
      // Source information
      source: 'StreetManager',
      dataSource: 'StreetManager Fallback',
      sourceId: record.notification_id,
      
      // Timing
      startDate: record.proposed_start_date,
      endDate: record.proposed_end_date,
      lastUpdated: record.webhook_received_at,
      
      // Street Manager specific
      permitReference: record.permit_reference_number,
      workCategory: record.work_category_ref,
      authority: record.highway_authority,
      streetName: record.street_name,
      areaName: record.area_name,
      town: record.town,
      eventType: record.webhook_event_type,
      
      // Route impact
      hasRouteImpact: (record.affected_routes?.length || 0) > 0,
      affectedRoutes: record.affected_routes || [],
      
      // UI metadata
      isAutomatic: true,
      canEdit: false,
      canDismiss: true,
      canPromoteToDisplay: true,
      fallbackData: true,
      realTimeData: false
    };
  }

  /**
   * Get manual roadworks/incidents
   */
  async getManualRoadworks() {
    const startTime = Date.now();
    
    try {
      console.log('📋 Fast fetching manual roadworks...');

      // Fast timeout for manual roadworks to prevent hanging
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Manual roadworks timeout')), 3000)
      );
      
      const supabaseClient = await getSupabaseClient();
      if (!supabaseClient) {
        console.log('⚠️ Supabase client not available for manual roadworks');
        return {
          success: true,
          data: [],
          lastUpdate: new Date().toISOString(),
          source: 'manual',
          processingTime: Date.now() - startTime
        };
      }
      
      const query = supabaseClient
        .from('manual_incidents')
        .select('id, location, description, created_at, severity, status')
        .order('created_at', { ascending: false })
        .limit(100); // Reduced limit for performance
      
      const { data: manualIncidents, error } = await Promise.race([query, timeout]);
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log('⚠️ manual_incidents table does not exist');
          return {
            success: false,
            error: 'Manual roadworks fetch failed: relation "public.manual_incidents" does not exist',
            data: [],
            processingTime: Date.now() - startTime
          };
        }
        throw error;
      }
      
      if (!manualIncidents || manualIncidents.length === 0) {
        console.log('📭 No manual roadworks found');
        return {
          success: true,
          data: [],
          lastUpdate: new Date().toISOString(),
          source: 'manual',
          processingTime: Date.now() - startTime
        };
      }

      // Fast transformation
      const roadworks = manualIncidents.map(incident => ({
        id: incident.id,
        title: `Manual: ${incident.location || 'Unknown location'}`,
        location: incident.location || 'Unknown location',
        description: incident.description || 'Manual incident',
        startDate: incident.created_at,
        source: 'manual',
        severity: incident.severity || 'medium',
        status: incident.status || 'active',
        timestamp: Date.now()
      }));

      console.log(`✅ Manual roadworks completed in ${Date.now() - startTime}ms: ${roadworks.length} items`);
      
      return {
        success: true,
        data: roadworks,
        lastUpdate: new Date().toISOString(),
        source: 'manual',
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.warn(`⚠️ Manual roadworks error (${Date.now() - startTime}ms):`, error.message);
      
      return {
        success: false,
        error: `Manual roadworks fetch failed: ${error.message}`,
        data: [],
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Fast deduplication for performance (simplified logic)
   */
  deduplicateRoadworksFast(roadworks) {
    const seen = new Set();
    const deduplicated = [];
    
    for (const roadwork of roadworks) {
      // Simple dedup key based on location and source
      const key = `${roadwork.source}_${roadwork.location?.toLowerCase().substring(0, 50)}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(roadwork);
      }
    }
    
    console.log(`🔄 Fast dedup: ${roadworks.length} -> ${deduplicated.length}`);
    return deduplicated;
  }

  /**
   * Deduplicate roadworks by location and timing (legacy - comprehensive)
   */
  deduplicateRoadworks(roadworks) {
    const seen = new Map();
    const deduplicated = [];

    for (const roadwork of roadworks) {
      // Create deduplication key based on location and approximate timing
      const key = generateAlertHash({
        location: roadwork.location?.toLowerCase().trim(),
        startDate: roadwork.startDate,
        authority: roadwork.authority,
        workCategory: roadwork.workCategory
      });

      if (!seen.has(key)) {
        seen.set(key, roadwork);
        deduplicated.push(roadwork);
      } else {
        // Keep the one with more complete data or more recent update
        const existing = seen.get(key);
        const current = roadwork;
        
        // Prefer StreetManager over manual entries
        if (current.source === 'StreetManager' && existing.source !== 'StreetManager') {
          seen.set(key, current);
          const existingIndex = deduplicated.findIndex(r => r.id === existing.id);
          if (existingIndex >= 0) {
            deduplicated[existingIndex] = current;
          }
        }
      }
    }

    console.log(`🔄 Deduplicated ${roadworks.length} → ${deduplicated.length} roadworks`);
    return deduplicated;
  }

  /**
   * Determine which table contains the roadwork (memory-optimized)
   * Checks both manual_incidents and streetworks tables efficiently
   */
  async determineRoadworkTable(roadworkId) {
    try {
      const supabaseClient = await getSupabaseClient();
      if (!supabaseClient) {
        return { exists: false, table: null, error: 'Supabase client not available' };
      }
      
      // Check manual_incidents first (typically smaller table)
      const { data: manualData, error: manualError } = await supabaseClient
        .from('manual_incidents')
        .select('id')
        .eq('id', roadworkId)
        .limit(1)
        .single();
      
      if (!manualError && manualData) {
        return { exists: true, table: 'manual_incidents', id: manualData.id };
      }
      
      // Check streetworks table
      const { data: streetData, error: streetError } = await supabaseClient
        .from('streetworks')
        .select('id, notification_id')
        .or(`id.eq.${roadworkId},notification_id.eq.${roadworkId}`)
        .limit(1)
        .single();
      
      if (!streetError && streetData) {
        return { exists: true, table: 'streetworks', id: streetData.id };
      }
      
      return { exists: false, table: null, id: null };
    } catch (error) {
      console.error('❌ Error determining roadwork table:', error);
      return { exists: false, table: null, error: error.message };
    }
  }

  /**
   * Smart cache invalidation - only clear specific entries instead of entire cache
   * Memory-optimized for 2GB RAM constraint
   */
  invalidateRoadworkCache(roadworkId) {
    try {
      // Remove specific cache entries related to this roadwork
      const keysToRemove = [];
      
      for (const [key, value] of this.cache.entries()) {
        if (key.includes(roadworkId) || 
            (value.data && Array.isArray(value.data) && 
             value.data.some(item => item.id === roadworkId))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => this.cache.delete(key));
      
      if (keysToRemove.length > 0) {
        console.log(`🗑️ Invalidated ${keysToRemove.length} cache entries for roadwork ${roadworkId}`);
      }
    } catch (error) {
      console.warn('⚠️ Error during cache invalidation:', error.message);
      // Fallback to clearing specific common cache keys
      this.cache.delete('streetmanager_data');
      this.cache.delete('manual_roadworks');
    }
  }

  // ... rest of the class methods remain the same ...
  
  async dismissRoadwork(roadworkId, reason, supervisorName, supervisorBadge = null, supervisorId = null) {
    try {
      console.log(`🙅 Dismissing roadwork ${roadworkId} by ${supervisorName}`);
      
      // Input validation
      if (!roadworkId || !supervisorName) {
        return { success: false, error: 'Missing required parameters: roadworkId and supervisorName' };
      }

      const supabaseClient = await getSupabaseClient();
      if (!supabaseClient) {
        return { success: false, error: 'Supabase client not available' };
      }
      
      const timestamp = new Date().toISOString();
      const sanitizedReason = reason ? reason.substring(0, 500) : 'Dismissed by supervisor';

      // Determine which table contains the roadwork
      const tableInfo = await this.determineRoadworkTable(roadworkId);
      if (!tableInfo.exists) {
        console.error(`❌ Roadwork ${roadworkId} not found in any table`);
        return { success: false, error: 'Roadwork not found', notFound: true };
      }

      console.log(`🔍 Found roadwork ${roadworkId} in ${tableInfo.table} table`);
      
      let updateResult;
      let originalData;
      
      // Update the appropriate table
      if (tableInfo.table === 'manual_incidents') {
        const { data, error } = await supabaseClient
          .from('manual_incidents')
          .update({
            status: 'dismissed',
            dismissed_at: timestamp,
            dismissed_by: supervisorName,
            dismissal_reason: sanitizedReason,
            updated_at: timestamp
          })
          .eq('id', roadworkId)
          .select()
          .single();

        if (error) {
          console.error('❌ Error dismissing manual incident:', error);
          return { success: false, error: `Database error: ${error.message}`, dbError: true };
        }
        
        updateResult = { data, source: 'manual', table: 'manual_incidents' };
        originalData = data;
        
      } else if (tableInfo.table === 'streetworks') {
        // First get the original data for logging
        const { data: originalRecord, error: fetchError } = await supabaseClient
          .from('streetworks')
          .select('*')
          .eq('id', roadworkId)
          .single();

        if (fetchError) {
          console.error('❌ Error fetching streetwork for dismissal:', fetchError);
          return { success: false, error: `Fetch error: ${fetchError.message}`, dbError: true };
        }

        // Update streetworks table - Street Manager data is typically read-only but we can add dismissal flags
        const { data, error } = await supabaseClient
          .from('streetworks')
          .update({
            dismissed_at: timestamp,
            dismissed_by: supervisorName,
            dismissal_reason: sanitizedReason,
            is_dismissed: true
          })
          .eq('id', roadworkId)
          .select()
          .single();
          
        if (error) {
          console.error('❌ Error dismissing streetwork:', error);
          return { success: false, error: `Database error: ${error.message}`, dbError: true };
        }
        
        updateResult = { data, source: 'streetworks', table: 'streetworks' };
        originalData = originalRecord;
      }

      // Log dismissal to dismissed_alerts table
      try {
        const dismissalRecord = {
          id: `dismiss_${roadworkId}_${Date.now()}`,
          supervisor_id: supervisorId, // Use provided ID or null
          supervisor_badge: supervisorBadge || supervisorName, // Use badge if provided, fallback to name
          reason: sanitizedReason,
          timestamp: timestamp,
          alert_hash: generateAlertHash(originalData),
          alert_data: {
            roadworkId: roadworkId,
            originalData: originalData,
            source: updateResult.source,
            table: updateResult.table,
            dismissedBy: supervisorName,
            supervisorBadge: supervisorBadge,
            supervisorId: supervisorId,
            dismissalReason: sanitizedReason,
            dismissedAt: timestamp
          }
        };

        const { error: dismissalError } = await supabaseClient
          .from('dismissed_alerts')
          .insert(dismissalRecord);

        if (dismissalError) {
          console.error('⚠️ Warning: Failed to log dismissal to dismissed_alerts table:', dismissalError);
          // Continue execution - dismissal logging is not critical to the main operation
        } else {
          console.log(`📝 Dismissal logged to dismissed_alerts table for roadwork ${roadworkId}`);
        }
      } catch (loggingError) {
        console.error('⚠️ Warning: Error logging dismissal:', loggingError);
        // Continue execution - dismissal logging is not critical
      }

      // Smart cache invalidation - only clear relevant cache entries
      this.invalidateRoadworkCache(roadworkId);

      // Sync to Convex with enhanced error handling
      try {
        await convexSync.syncAlert({
          ...updateResult.data,
          status: 'dismissed',
          dismissedBy: supervisorName,
          dismissalReason: sanitizedReason,
          dismissedAt: timestamp
        });
      } catch (convexError) {
        console.error('⚠️ Warning: Convex sync failed for dismissed roadwork:', convexError);
        // Continue - Convex sync failure shouldn't break the dismissal
      }

      console.log(`✅ Roadwork ${roadworkId} dismissed successfully from ${updateResult.table}`);
      return { success: true, data: updateResult.data, source: updateResult.source };
    } catch (error) {
      console.error('❌ Error in dismissRoadwork:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Acknowledge a roadwork with enhanced error handling and memory optimization
   * Handles both manual incidents and streetworks tables efficiently
   */
  async acknowledgeRoadwork(roadworkId, note, supervisorName) {
    try {
      console.log(`✅ Acknowledging roadwork ${roadworkId} by ${supervisorName}`);
      
      // Input validation
      if (!roadworkId || !supervisorName) {
        return { success: false, error: 'Missing required parameters: roadworkId and supervisorName' };
      }

      const timestamp = new Date().toISOString();
      const sanitizedNote = note ? note.substring(0, 500) : 'Acknowledged'; // Limit note length
      
      // Pre-validate roadwork existence and determine table
      const tableInfo = await this.determineRoadworkTable(roadworkId);
      if (!tableInfo.exists) {
        console.error(`❌ Roadwork ${roadworkId} not found in any table`);
        return { success: false, error: 'Roadwork not found', notFound: true };
      }

      console.log(`🔍 Found roadwork ${roadworkId} in ${tableInfo.table} table`);
      
      let updateResult;
      
      const supabaseClient = await getSupabaseClient();
      if (!supabaseClient) {
        return { success: false, error: 'Supabase client not available' };
      }
      
      if (tableInfo.table === 'manual_incidents') {
        const { data, error } = await supabaseClient
          .from('manual_incidents')
          .update({
            status: 'acknowledged',
            acknowledged_at: timestamp,
            acknowledged_by: supervisorName,
            acknowledgment_note: sanitizedNote,
            updated_at: timestamp
          })
          .eq('id', roadworkId)
          .select()
          .single();
          
        if (error) {
          console.error('❌ Error updating manual incident:', error);
          return { success: false, error: `Database error: ${error.message}`, dbError: true };
        }
        
        updateResult = { data, source: 'manual', table: 'manual_incidents' };
        
      } else if (tableInfo.table === 'streetworks') {
        const { data, error } = await supabaseClient
          .from('streetworks')
          .update({
            acknowledged_at: timestamp,
            acknowledged_by: supervisorName,
            acknowledgment_note: sanitizedNote,
            is_acknowledged: true
          })
          .eq('id', roadworkId)
          .select()
          .single();
          
        if (error) {
          console.error('❌ Error updating streetwork:', error);
          return { success: false, error: `Database error: ${error.message}`, dbError: true };
        }
        
        updateResult = { data, source: 'streetworks', table: 'streetworks' };
      }

      // Smart cache invalidation - only clear relevant cache entries
      this.invalidateRoadworkCache(roadworkId);

      // Sync to Convex with enhanced error handling
      try {
        await convexSync.syncAlert({
          ...updateResult.data,
          acknowledged: true,
          acknowledgedAt: timestamp,
          acknowledgedBy: supervisorName,
          acknowledgmentNote: sanitizedNote,
          source: updateResult.source,
          table: updateResult.table
        });
        console.log(`📡 Successfully synced acknowledgment to Convex`);
      } catch (syncError) {
        console.warn('⚠️ Convex sync failed but database updated:', syncError.message);
        // Continue - database is updated even if sync fails
      }

      console.log(`✅ Roadwork ${roadworkId} acknowledged successfully in ${updateResult.table}`);
      return { 
        success: true, 
        data: {
          ...updateResult.data,
          acknowledgedAt: timestamp,
          acknowledgedBy: supervisorName,
          table: updateResult.table
        },
        metadata: {
          table: updateResult.table,
          timestamp: timestamp,
          noteLength: sanitizedNote.length
        }
      };
    } catch (error) {
      console.error('❌ Error in acknowledgeRoadwork:', error);
      return { 
        success: false, 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }
  /**
   * Save/bookmark a roadwork (placeholder - to be implemented)
   */
  async saveRoadwork(roadworkId, supervisorName, notes = '') {
    // TODO: Implement roadwork bookmarking functionality
    console.log(`📌 Save roadwork ${roadworkId} by ${supervisorName} with notes: ${notes}`);
    return { success: false, error: 'Save roadwork functionality not yet implemented' };
  }

  /**
   * Get roadwork history (placeholder - to be implemented)
   */
  async getRoadworkHistory(roadworkId) {
    // TODO: Implement roadwork history retrieval
    console.log(`📜 Get history for roadwork ${roadworkId}`);
    return { success: false, error: 'Roadwork history functionality not yet implemented' };
  }

  /**
   * Get management statistics (placeholder - to be implemented)
   */
  async getManagementStats(timeframe = '7d') {
    // TODO: Implement roadwork management statistics
    console.log(`📊 Get management stats for timeframe: ${timeframe}`);
    return { success: false, error: 'Management statistics functionality not yet implemented' };
  }
}

export default new UnifiedRoadworksManager();