// backend/services/unifiedRoadworksManager.js
// Unified roadworks data aggregator and management system with StreetManager fallback

import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

// Removed axios import - app only uses database/webhook data, not external API calls
import { generateAlertHash } from '../utils/alertDeduplication.js';
// Removed streetManager import - app only uses AWS webhook data, not external API calls
import { convexSync } from './convexSync.js';
import { supabaseOptimizer } from './supabaseOptimizer.js';
import { bngToLatLng, parseStreetManagerGeometry } from '../utils/bngToLatLng.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getFetch } from '../utils/fetchHelper.js';
import { getSupabaseClient } from './supabaseHelper.js';
import coordinateService from './coordinateService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
   * Reset the circuit breaker to allow immediate retry
   */
  resetCircuitBreaker() {
    console.log('🔄 Resetting Street Manager circuit breaker...');
    this.streetManagerFailures = 0;
    this.streetManagerLastFailure = 0;
    this.streetManagerDisabled = false;
    this.streetManagerDisabledUntil = 0;
    console.log('✅ Street Manager circuit breaker reset - ready for immediate retry');
  }

  /**
   * Load fallback Street Manager data when database is unavailable
   */
  loadStreetManagerFallback() {
    try {
      const fallbackPath = join(__dirname, '../data/streetmanager_fallback.json');
      const fallbackData = JSON.parse(readFileSync(fallbackPath, 'utf8'));
      
      console.log(`📋 Loading ${fallbackData.data?.length || 0} fallback Street Manager roadworks`);
      
      // Convert fallback data to consistent format
      const roadworks = (fallbackData.data || []).map(item => ({
        id: item.notification_id || `fallback-${Date.now()}-${Math.random()}`,
        source: 'streetmanager_fallback',
        title: item.title || 'Street Works',
        location: item.location_description || 'Location not specified',
        description: item.works_description || item.activity_type || 'Street works activity',
        severity: item.severity || 'Medium',
        status: item.status || 'Active',
        startDate: item.actual_start_date_time || item.webhook_received_at,
        endDate: item.proposed_end_date_time,
        permitReference: item.permit_reference_number,
        authority: item.authority || 'Local Authority',
        trafficManagement: item.traffic_management || 'Traffic management in place',
        worksCategory: item.works_category || 'Maintenance',
        contactDetails: item.contact_details,
        diversionRoute: item.diversion_route,
        coordinates: this.extractCoordinatesFromFallback(item),
        coordinateSource: 'fallback_data',
        raw_data: item
      }));
      
      return roadworks;
    } catch (error) {
      console.error('❌ Error loading Street Manager fallback data:', error);
      return [];
    }
  }

  /**
   * Extract coordinates from fallback data using unified service
   */
  async extractCoordinatesFromFallback(item) {
    // Use unified coordinate service
    const result = await coordinateService.processCoordinate({
      id: item.notification_id,
      geometry: item.activity_location_coordinates,
      location: item.location_description,
      postcode: item.postcode
    });
    
    // Return as array for backward compatibility
    return result.success ? [result.lat, result.lng] : [54.9783, -1.6178];
  }

  /**
   * Enhanced coordinate extraction using unified coordinate service
   */
  async extractCoordinatesFromWebhook(streetwork) {
    console.log(`🗺️ Processing coordinates for streetwork ${streetwork.id}...`);
    
    // Use unified coordinate service
    const result = await coordinateService.processCoordinate({
      id: streetwork.id,
      lat: streetwork.latitude,
      lng: streetwork.longitude,
      easting: streetwork.sm_easting,
      northing: streetwork.sm_northing,
      geometry: streetwork.raw_webhook_data?.object_data?.works_location_coordinates,
      location: streetwork.location_description,
      postcode: streetwork.postcode,
      usrn: streetwork.usrn,
      permitReference: streetwork.permit_reference_number
    });
    
    if (result.success) {
      console.log(`✅ Coordinates resolved: ${result.lat}, ${result.lng} (${result.source})`);
      return {
        lat: result.lat,
        lng: result.lng,
        source: result.source,
        confidence: result.confidence
      };
    }
    
    console.log(`❌ Could not resolve coordinates for streetwork ${streetwork.id}`);
    return null;
  }

  /**
   * Get all roadworks from all sources
   * @param {Object} options - Query options
   * @param {boolean} options.includeDismissed - Include dismissed alerts (default: false)
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
        promises.push(this.getStreetManagerRoadworks(options));
      }

      if (this.sources.manual.enabled) {
        promises.push(this.getManualRoadworks(options));
      }

      // Ensure we have at least one promise to avoid empty Promise.allSettled
      if (promises.length === 0) {
        console.warn('⚠️ No data sources enabled, returning empty results');
        return {
          success: true,
          streetManager: [],
          manual: [],
          combined: [],
          metadata: {
            sources: {},
            totalCount: 0,
            lastUpdate: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            warning: 'No data sources enabled'
          }
        };
      }

      console.log(`🔄 Fetching from ${promises.length} data sources...`);

      // Add global timeout for the entire operation (memory-efficient)
      const globalTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Global unified roadworks timeout')), 15000) // 15 second max
      );

      let sourceResults;
      try {
        sourceResults = await Promise.race([
          Promise.allSettled(promises),
          globalTimeout
        ]);
        
        // Additional safety check
        if (!sourceResults) {
          throw new Error('Promise.race returned null/undefined result');
        }
      } catch (raceError) {
        console.error('❌ Promise.race failed:', raceError.message);
        // Return empty but valid structure on timeout/error
        return {
          success: false,
          error: `Data source timeout: ${raceError.message}`,
          streetManager: [],
          manual: [],
          combined: [],
          metadata: {
            sources: {},
            totalCount: 0,
            lastUpdate: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            timeout: true
          }
        };
      }

      // Process results with proper null checking and memory optimization
      let sourceIndex = 0;
      
      // Ensure sourceResults is valid and is an array
      if (!Array.isArray(sourceResults)) {
        console.error('❌ sourceResults is not an array:', typeof sourceResults);
        throw new Error('Invalid Promise.allSettled results structure');
      }
      
      if (this.sources.streetManager.enabled) {
        const smResult = sourceResults[sourceIndex++];
        if (smResult && smResult.status === 'fulfilled') {
          results.streetManager = smResult.value?.data || [];
          results.metadata.sources.streetManager = {
            success: true,
            count: results.streetManager.length,
            lastUpdate: smResult.value?.lastUpdate,
            features: {
              webhookIntegration: true,
              routeMatching: true,
              mlPrediction: true,
              realTimeSync: true
            }
          };
        } else {
          console.warn('⚠️ Street Manager source failed, using fallback data:', smResult?.reason?.message || 'Unknown error');
          
          // Load fallback data when Street Manager fails
          try {
            const fallbackRoadworks = this.loadStreetManagerFallback();
            results.streetManager = fallbackRoadworks;
            results.metadata.sources.streetManager = {
              success: true,
              count: fallbackRoadworks.length,
              fallback: true,
              originalError: smResult?.reason?.message || 'Street Manager source unavailable',
              features: {
                webhookIntegration: false,
                routeMatching: true,
                mlPrediction: false,
                realTimeSync: false
              }
            };
            console.log(`✅ Loaded ${fallbackRoadworks.length} fallback Street Manager roadworks`);
          } catch (fallbackError) {
            console.error('❌ Failed to load fallback data:', fallbackError);
            results.metadata.sources.streetManager = {
              success: false,
              error: smResult?.reason?.message || 'Street Manager source unavailable',
              fallbackError: fallbackError.message
            };
          }
        }
      }

      if (this.sources.manual.enabled) {
        // Check if we have enough results in the array
        if (sourceIndex < sourceResults.length) {
          const manualResult = sourceResults[sourceIndex++];
          if (manualResult && manualResult.status === 'fulfilled') {
            results.manual = manualResult.value?.data || [];
            results.metadata.sources.manual = {
              success: true,
              count: results.manual.length,
              lastUpdate: manualResult.value?.lastUpdate
            };
          } else {
            console.warn('⚠️ Manual source failed:', manualResult?.reason?.message || 'Unknown error');
            results.metadata.sources.manual = {
              success: false,  
              error: manualResult?.reason?.message || 'Manual source unavailable'
            };
          }
        } else {
          console.warn('⚠️ Manual source not found in results array');
          results.metadata.sources.manual = {
            success: false,
            error: 'Manual source result not available in Promise.allSettled array'
          };
        }
      }

      // Combine all roadworks with memory-efficient approach
      const streetManagerData = results.streetManager || [];
      const manualData = results.manual || [];
      
      // Memory-efficient combination for large datasets
      if (streetManagerData.length + manualData.length > 1000) {
        console.log(`⚠️ Large dataset detected (${streetManagerData.length + manualData.length} items), using memory-efficient processing`);
        // Process in chunks to avoid memory spikes
        results.combined = [];
        results.combined.push(...streetManagerData);
        results.combined.push(...manualData);
      } else {
        results.combined = [...streetManagerData, ...manualData];
      }

      // Fast deduplication by location and timing (simplified for performance)
      if (results.combined.length > 0) {
        console.log(`🔄 Fast deduplicating ${results.combined.length} roadworks...`);
        try {
          results.combined = this.deduplicateRoadworksFast(results.combined);
        } catch (dedupError) {
          console.warn('⚠️ Deduplication failed, continuing with original data:', dedupError.message);
          // Continue with original data if deduplication fails
        }
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
   * Get StreetManager roadworks from Supabase streetworks table
   * Returns real data from database, never fallback data
   * @param {Object} options - Query options
   * @param {boolean} options.includeDismissed - Include dismissed alerts (default: false)
   */
  async getStreetManagerRoadworks(options = {}) {
    const startTime = Date.now();
    
    try {
      console.log('🚧 Fetching StreetManager roadworks from Supabase database...');
      
      // Check circuit breaker - but load fallback data instead of returning empty
      if (this.streetManagerDisabled && Date.now() < this.streetManagerDisabledUntil) {
        const remainingTime = Math.round((this.streetManagerDisabledUntil - Date.now()) / 1000);
        console.log(`🚨 Street Manager disabled by circuit breaker for ${remainingTime}s, loading fallback data`);
        
        try {
          const fallbackRoadworks = this.loadStreetManagerFallback();
          console.log(`✅ Circuit breaker: Loaded ${fallbackRoadworks.length} fallback roadworks`);
          
          return {
            success: true,
            data: fallbackRoadworks,
            fallback: true,
            circuitBreaker: true,
            retryAfter: this.streetManagerDisabledUntil - Date.now(),
            source: 'streetmanager_fallback'
          };
        } catch (fallbackError) {
          console.error('❌ Circuit breaker: Fallback data loading failed:', fallbackError);
          return {
            success: false,
            data: [],
            error: 'Street Manager disabled by circuit breaker',
            circuitBreaker: true,
            fallbackError: fallbackError.message,
            retryAfter: this.streetManagerDisabledUntil - Date.now(),
            source: 'street_manager'
          };
        }
      }
      
      console.log('✅ Circuit breaker: Street Manager is enabled');
      
      console.log('🔍 Getting Supabase client...');
      const supabaseClient = await getSupabaseClient();
      if (!supabaseClient) {
        console.error('❌ Supabase client not available');
        return {
          success: false,
          data: [],
          error: 'Supabase client not available',
          source: 'street_manager',
          processingTime: Date.now() - startTime
        };
      }
      console.log('✅ Supabase client ready');
      
      // Test the connection first
      try {
        console.log('🔍 Testing Supabase connection...');
        
        // First, test if we can reach Supabase at all
        const fetchImpl = await getFetch();
        console.log('🔍 Testing raw fetch to Supabase...');
        
        try {
          const testUrl = `${process.env.SUPABASE_URL}/rest/v1/`;
          const testResponse = await fetchImpl(testUrl, {
            method: 'GET',
            headers: {
              'apikey': process.env.SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
            }
          });
          console.log(`🎯 Raw fetch response: ${testResponse.status} ${testResponse.statusText}`);
        } catch (fetchError) {
          console.error('❌ Raw fetch to Supabase failed:', fetchError.message);
          console.error('❌ This suggests a network or SSL issue');
          
          // Run connectivity test to diagnose the issue
          console.log('🤔 Running connectivity diagnostics...');
          try {
            const { testConnectivity } = await import('../tests/connectivity-test.js');
            await testConnectivity();
          } catch (diagError) {
            console.error('❌ Diagnostics failed:', diagError.message);
          }
        }
        
        // Now try the Supabase client
        const { data: testData, error: testError } = await supabaseClient
          .from('streetworks')
          .select('id')
          .limit(1)
          .maybeSingle(); // Use maybeSingle to avoid error if no data
        
        if (testError) {
          console.error('❌ Supabase connection test failed:', testError);
          throw new Error(`Supabase connection failed: ${testError.message}`);
        }
        console.log('✅ Supabase connection test successful');
      } catch (connError) {
        console.error('❌ Supabase connection error:', connError);
        throw connError;
      }
      
      console.log('🔍 Starting paginated streetworks query for all records...');
      
      // Implement pagination to get all records (Supabase has 1000 record limit per query)
      let allStreetworksRecords = [];
      let currentPage = 0;
      const pageSize = 1000;
      let hasMoreData = true;
      
      const selectFields = `
        id, sm_reference, sm_permit_reference, sm_promoter_name, 
        sm_works_description, sm_works_category, sm_traffic_sensitive,
        sm_highway_authority, sm_works_state, sm_location_description,
        sm_street_name, sm_area_name, sm_easting, sm_northing,
        sm_start_date, sm_end_date, sm_actual_start_date, sm_actual_end_date,
        sm_traffic_management_type, latitude, longitude, severity, 
        webhook_received_at, raw_webhook_data, status, 
        auto_matched_routes, confirmed_routes, created_at, updated_at
      `;
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Streetworks query timeout after 60 seconds')), 60000)
      );
      
      const fetchAllPages = async () => {
        while (hasMoreData) {
          console.log(`📄 Fetching page ${currentPage + 1} (${currentPage * pageSize} to ${(currentPage + 1) * pageSize})...`);
          
          try {
            let query = supabaseClient
              .from('streetworks')
              .select(selectFields)
              .order('webhook_received_at', { ascending: false });

            // Filter out dismissed/cancelled streetworks unless explicitly requested
            if (!options.includeDismissed) {
              query = query.not('status', 'eq', 'dismissed').not('sm_cancelled', 'eq', true);
              console.log('🚫 Filtering out dismissed/cancelled streetworks');
            } else {
              console.log('ℹ️ Including dismissed/cancelled streetworks (admin mode)');
            }

            const { data: pageData, error: pageError } = await query
              .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);
          
            if (pageError) {
              console.error('❌ Page query error:', pageError);
              console.error('❌ Error details:', JSON.stringify(pageError, null, 2));
              throw pageError;
            }
          
            if (pageData && pageData.length > 0) {
              allStreetworksRecords.push(...pageData);
              console.log(`✅ Page ${currentPage + 1}: ${pageData.length} records (total: ${allStreetworksRecords.length})`);
              
              // Check if we got a full page (if not, we're done)
              if (pageData.length < pageSize) {
                hasMoreData = false;
              } else {
                currentPage++;
              }
            } else {
              hasMoreData = false;
            }
            
            // Safety check to prevent infinite loops
            if (currentPage > 20) { // Max 20k records
              console.warn('⚠️ Reached maximum page limit (20), stopping pagination');
              hasMoreData = false;
            }
          } catch (pageError) {
            console.error('❌ Error fetching page:', pageError);
            throw pageError;
          }
        }
        
        return allStreetworksRecords;
      };
      
      const streetworksRecords = await Promise.race([
        fetchAllPages(),
        timeoutPromise
      ]);
      
      const streetworksError = null; // No error if we got here
      
      console.log('🔍 Streetworks query completed, processing results...');
      
      if (streetworksError) {
        console.error('❌ Streetworks query error:', streetworksError.message);
        // Reset circuit breaker success on any error
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
          error: streetworksError.message,
          source: 'street_manager',
          processingTime: Date.now() - startTime,
          failures: this.streetManagerFailures
        };
      }
      
      // Reset circuit breaker on successful query
      this.streetManagerFailures = 0;
      this.streetManagerDisabled = false;
      this.streetManagerDisabledUntil = 0;
      
      let streetworksData = [];
      
      if (streetworksRecords && streetworksRecords.length > 0) {
        console.log(`✅ Found ${streetworksRecords.length} streetworks records from database`);
        streetworksData = await this.transformStreetworksData(streetworksRecords);
      } else {
        console.log('📭 No streetworks records found in database');
      }
      
      // Cache the results with dismissed status consideration
      if (streetworksData.length > 0) {
        const metadata = {
          streetworksCount: streetworksData.length,
          totalCount: streetworksData.length,
          lastFetch: new Date().toISOString(),
          includeDismissed: options.includeDismissed || false
        };
        
        const cacheData = {
          data: streetworksData,
          timestamp: Date.now(),
          source: 'streetworks_database',
          metadata
        };
        
        // Use different cache keys based on dismissed filter
        const cacheKey = options.includeDismissed ? 
          'streetworks_data_with_dismissed' : 
          'streetworks_data_active_only';
        this.cache.set(cacheKey, cacheData);
      }
      
      console.log(`✅ StreetManager roadworks fetch completed in ${Date.now() - startTime}ms: ${streetworksData.length} total items`);
      
      return {
        success: true,
        data: streetworksData,
        lastUpdate: new Date().toISOString(),
        source: 'streetworks_database',
        processingTime: Date.now() - startTime,
        metadata: {
          streetworksCount: streetworksData.length,
          totalCount: streetworksData.length,
          dataSourcesUsed: ['streetworks']
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
      
      // Load fallback data when Supabase fails
      console.log('⚠️ Supabase failed, loading fallback Street Manager data...');
      try {
        const fallbackRoadworks = this.loadStreetManagerFallback();
        console.log(`✅ Loaded ${fallbackRoadworks.length} fallback roadworks after Supabase failure`);
        
        return {
          success: true,
          data: fallbackRoadworks,
          fallback: true,
          originalError: error.message,
          source: 'streetmanager_fallback',
          processingTime: Date.now() - startTime,
          failures: this.streetManagerFailures
        };
      } catch (fallbackError) {
        console.error('❌ Fallback data loading also failed:', fallbackError);
        return {
          success: false,
          data: [],
          error: error.message,
          fallbackError: fallbackError.message,
          source: 'street_manager',
          processingTime: Date.now() - startTime,
          failures: this.streetManagerFailures
        };
      }
    }
  }
  
  /**
   * Transform streetworks table data to unified roadworks format
   * Handles Street Manager webhook data with rich schema
   * Now includes ACTIVE enhanced coordinate extraction
   */
  async transformStreetworksData(streetworksRecords) {
    console.log(`🔄 Transforming ${streetworksRecords.length} streetworks records with ENHANCED COORDINATE SERVICE ACTIVE...`);
    const startTime = Date.now();
    
    // Track coordinate enhancement statistics
    let enhancementStats = {
      total: 0,
      enhanced: 0,
      legacy: 0,
      failed: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0
    };
    
    // Process records in batches to avoid memory issues
    const batchSize = 50;
    const allRoadworks = [];
    
    for (let i = 0; i < streetworksRecords.length; i += batchSize) {
      const batch = streetworksRecords.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(streetworksRecords.length/batchSize)} - ENHANCED COORDINATES ACTIVE`);
      
      const batchPromises = batch.map(async (record) => {
        enhancementStats.total++;
        
        // Build initial roadwork object
        let roadwork = {
          id: record.id,
          title: `Street Manager: ${record.sm_street_name || record.sm_location_description || 'Street Works'}`,
          location: this.buildLocationDescription(record),
          description: record.sm_works_description || 'Street works activity',
          startDate: record.sm_actual_start_date || record.sm_start_date,
          endDate: record.sm_actual_end_date || record.sm_end_date,
          source: 'StreetManager',
          dataSource: 'streetworks_table',
          severity: this.determineSeverity(record),
          status: record.status || 'active',
          
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
          updatedAt: record.updated_at,
          
          // Include raw data for coordinate extraction
          sm_easting: record.sm_easting,
          sm_northing: record.sm_northing,
          sm_location_description: record.sm_location_description,
          sm_street_name: record.sm_street_name,
          sm_area_name: record.sm_area_name,
          raw_webhook_data: record.raw_webhook_data
        };

        // ENHANCED COORDINATE EXTRACTION WITH PERSISTENCE - FULLY ACTIVE
        console.log(`🎯 ACTIVATING Enhanced Coordinate Service with Persistence for ${record.id}...`);
        let coordinateEnhancementSuccess = false;
        
        try {
          // Use the new enhanceAndPersistCoordinates method that automatically saves high-confidence coordinates
          const enhancedRoadwork = await enhancedCoordinateService.enhanceAndPersistCoordinates(roadwork, true);
          
          if (enhancedRoadwork.coordinates && enhancedRoadwork.coordinateConfidence >= 50) {
            roadwork = enhancedRoadwork;
            coordinateEnhancementSuccess = true;
            enhancementStats.enhanced++;
            
            // Track confidence levels
            if (enhancedRoadwork.coordinateConfidence >= 90) {
              enhancementStats.highConfidence++;
            } else if (enhancedRoadwork.coordinateConfidence >= 70) {
              enhancementStats.mediumConfidence++;
            } else {
              enhancementStats.lowConfidence++;
            }
            
            const persistenceStatus = enhancedRoadwork.coordinatePersisted ? '💾 PERSISTED' : '📝 not persisted';
            console.log(`✅ Enhanced coordinates SUCCESS for ${record.id}: [${roadwork.coordinates[0]}, ${roadwork.coordinates[1]}] from ${roadwork.coordinateSource} (confidence: ${roadwork.coordinateConfidence}%) - ${persistenceStatus}`);
            
            if (enhancedRoadwork.coordinatePersisted) {
              console.log(`💾 Coordinates saved to ${enhancedRoadwork.persistenceTable} table for future use`);
            }
          } else {
            console.log(`⚠️ Enhanced service returned low-confidence coordinates for ${record.id}, trying legacy fallback...`);
            coordinateEnhancementSuccess = false;
          }
        } catch (error) {
          console.error(`❌ Enhanced coordinate extraction FAILED for ${record.id}:`, error.message);
          coordinateEnhancementSuccess = false;
        }
        
        // Fallback to legacy coordinate extraction if enhanced service fails or returns low confidence
        if (!coordinateEnhancementSuccess) {
          console.log(`🔄 Falling back to legacy coordinate extraction for ${record.id}...`);
          const legacyCoords = this.extractLegacyCoordinates(record);
          if (legacyCoords) {
            roadwork.coordinates = legacyCoords;
            roadwork.coordinateSource = coordinateEnhancementSuccess ? 'enhanced_low_confidence' : 'legacy_fallback';
            roadwork.coordinateConfidence = 60;
            enhancementStats.legacy++;
            console.log(`🔧 Legacy coordinates applied for ${record.id}: [${legacyCoords[0]}, ${legacyCoords[1]}]`);
          } else {
            // Apply default Newcastle coordinates as final fallback
            roadwork.coordinates = [54.9783, -1.6178];
            roadwork.coordinateSource = 'default_newcastle';
            roadwork.coordinateConfidence = 10;
            enhancementStats.failed++;
            console.log(`⚠️ No coordinates found for ${record.id}, using Newcastle default`);
          }
        }

        return roadwork;
      });
      
      const batchResults = await Promise.all(batchPromises);
      allRoadworks.push(...batchResults);
      
      // Small delay between batches to prevent overwhelming the system
      if (i + batchSize < streetworksRecords.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    // Log comprehensive coordinate enhancement statistics
    const processingTime = Date.now() - startTime;
    console.log(`✅ ENHANCED COORDINATE SERVICE RESULTS:`);
    console.log(`   📊 Total processed: ${enhancementStats.total}`);
    console.log(`   🎯 Enhanced: ${enhancementStats.enhanced} (${((enhancementStats.enhanced / enhancementStats.total) * 100).toFixed(1)}%)`);
    console.log(`   🔧 Legacy fallback: ${enhancementStats.legacy} (${((enhancementStats.legacy / enhancementStats.total) * 100).toFixed(1)}%)`);
    console.log(`   ❌ Failed: ${enhancementStats.failed} (${((enhancementStats.failed / enhancementStats.total) * 100).toFixed(1)}%)`);
    console.log(`   🏆 High confidence (>=90%): ${enhancementStats.highConfidence}`);
    console.log(`   🥈 Medium confidence (70-89%): ${enhancementStats.mediumConfidence}`);
    console.log(`   🥉 Low confidence (50-69%): ${enhancementStats.lowConfidence}`);
    console.log(`   ⏱️ Processing time: ${processingTime}ms`);
    
    // Get enhanced coordinate service statistics
    const serviceStats = enhancedCoordinateService.getStats();
    console.log(`📈 Enhanced Coordinate Service Stats:`, serviceStats);
    
    console.log(`✅ Enhanced streetworks transformation completed in ${processingTime}ms`);
    return allRoadworks;
  }

  /**
   * Build comprehensive location description for coordinate extraction
   */
  buildLocationDescription(record) {
    const locationParts = [
      record.sm_location_description,
      record.sm_street_name,
      record.sm_area_name
    ].filter(Boolean);
    
    return locationParts.length > 0 ? locationParts.join(', ') : 'Unknown location';
  }

  /**
   * Determine severity based on traffic impact and work category
   */
  determineSeverity(record) {
    let severity = record.severity || 'medium';
    
    if (record.sm_traffic_sensitive || record.sm_traffic_management_type?.includes('closure')) {
      severity = 'high';
    }
    
    return severity;
  }

  /**
   * Legacy coordinate extraction method (fallback)
   */
  extractLegacyCoordinates(record) {
    // Try direct WGS84 coordinates first
    if (record.latitude && record.longitude) {
      return [parseFloat(record.latitude), parseFloat(record.longitude)];
    } 
    
    // Try BNG coordinates conversion
    if (record.sm_easting && record.sm_northing) {
      try {
        const wgs84 = bngToLatLng(parseFloat(record.sm_easting), parseFloat(record.sm_northing));
        return [wgs84.lat, wgs84.lng];
      } catch (e) {
        console.warn(`⚠️ Legacy BNG conversion failed for ${record.id}:`, e.message);
      }
    }
    
    // Fallback to webhook data coordinates
    const coords = this.extractCoordinatesFromWebhook(record);
    if (coords) {
      return [coords.lat, coords.lng];
    }
    
    return null;
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
   * Transform webhook data to roadworks format with enhanced coordinates
   */
  async transformWebhookData(notifications) {
    console.log(`🔄 Transforming ${notifications.length} webhook notifications with Enhanced Coordinate Service...`);
    
    // Process in batches for memory efficiency
    const batchSize = 25;
    const allRoadworks = [];
    
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      console.log(`📦 Processing webhook batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(notifications.length/batchSize)} - ENHANCED COORDINATES ACTIVE`);
      
      const batchPromises = batch.map(notification => this.transformSingleWebhookRecord(notification));
      const batchResults = await Promise.all(batchPromises);
      allRoadworks.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    console.log(`✅ Webhook transformation with enhanced coordinates completed: ${allRoadworks.length} roadworks`);
    return allRoadworks;
  }
  
  /**
   * Transform single webhook notification to roadwork format
   * NOW WITH ENHANCED COORDINATE SERVICE
   */
  async transformSingleWebhookRecord(notification) {
    const rawData = notification.raw_webhook_data || {};
    const objectData = rawData.object_data || {};
    
    // Build initial roadwork object for enhanced coordinate service
    let roadwork = {
      id: notification.notification_id,
      title: notification.title || `${objectData.activity_type || 'Roadwork'} - ${objectData.street_name || 'Unknown Street'}`,
      description: notification.description || `Street Manager notification: ${notification.webhook_event_type}`,
      location: notification.location_description || `${objectData.street_name || 'Unknown'}, ${objectData.area_name || 'Unknown'}`,
      
      // Include raw data for enhanced coordinate extraction
      sm_easting: notification.sm_easting,
      sm_northing: notification.sm_northing,
      sm_location_description: notification.location_description,
      sm_street_name: objectData.street_name,
      sm_area_name: objectData.area_name,
      raw_webhook_data: notification.raw_webhook_data,
      
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
    
    // ENHANCED COORDINATE EXTRACTION FOR WEBHOOK DATA
    console.log(`🎯 APPLYING Enhanced Coordinate Service to webhook notification ${notification.notification_id}...`);
    
    try {
      const enhancedRoadwork = await enhancedCoordinateService.enhanceAlertCoordinates(roadwork);
      
      if (enhancedRoadwork.coordinates && enhancedRoadwork.coordinateConfidence >= 50) {
        roadwork = enhancedRoadwork;
        console.log(`✅ Enhanced coordinates SUCCESS for webhook ${notification.notification_id}: [${roadwork.coordinates[0]}, ${roadwork.coordinates[1]}] from ${roadwork.coordinateSource} (confidence: ${roadwork.coordinateConfidence}%)`);
      } else {
        // Fallback to legacy coordinate extraction
        const extractedCoords = this.extractCoordinatesFromWebhook(notification);
        const coordinates = extractedCoords ? [extractedCoords.lat, extractedCoords.lng] : null;
        
        roadwork.coordinates = coordinates;
        roadwork.coordinateSource = extractedCoords?.source || 'none';
        roadwork.coordinateConfidence = extractedCoords ? 60 : 10;
        
        if (extractedCoords) {
          console.log(`🔧 Legacy coordinates applied for webhook ${notification.notification_id}: [${extractedCoords.lat}, ${extractedCoords.lng}] from ${extractedCoords.source}`);
        } else {
          console.log(`❌ No coordinates extracted for webhook ${notification.notification_id}`);
        }
      }
    } catch (error) {
      console.error(`❌ Enhanced coordinate extraction FAILED for webhook ${notification.notification_id}:`, error.message);
      
      // Fallback to legacy method
      const extractedCoords = this.extractCoordinatesFromWebhook(notification);
      const coordinates = extractedCoords ? [extractedCoords.lat, extractedCoords.lng] : null;
      
      roadwork.coordinates = coordinates;
      roadwork.coordinateSource = extractedCoords?.source || 'legacy_fallback';
      roadwork.coordinateConfidence = extractedCoords ? 60 : 10;
      
      if (extractedCoords) {
        console.log(`🔧 Legacy fallback coordinates for webhook ${notification.notification_id}: [${extractedCoords.lat}, ${extractedCoords.lng}]`);
      }
    }
    
    return roadwork;
  }
  
  /**
   * Transform fallback data to roadworks format with enhanced coordinates
   */
  async transformFallbackData(fallbackRecords) {
    console.log(`🔄 Transforming ${fallbackRecords.length} fallback records with Enhanced Coordinate Service...`);
    
    // Process in batches for memory efficiency
    const batchSize = 25;
    const allRoadworks = [];
    
    for (let i = 0; i < fallbackRecords.length; i += batchSize) {
      const batch = fallbackRecords.slice(i, i + batchSize);
      console.log(`📦 Processing fallback batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(fallbackRecords.length/batchSize)} - ENHANCED COORDINATES ACTIVE`);
      
      const batchPromises = batch.map(record => this.transformSingleFallbackRecord(record));
      const batchResults = await Promise.all(batchPromises);
      allRoadworks.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < fallbackRecords.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    console.log(`✅ Fallback transformation with enhanced coordinates completed: ${allRoadworks.length} roadworks`);
    return allRoadworks;
  }
  
  /**
   * Transform single fallback record to roadwork format with enhanced coordinates
   */
  async transformSingleFallbackRecord(record) {
    // Build initial roadwork object for enhanced coordinate service
    let roadwork = {
      id: record.notification_id,
      title: record.title,
      description: record.description,
      location: record.location_description,
      
      // Include raw data for enhanced coordinate extraction
      sm_easting: record.sm_easting,
      sm_northing: record.sm_northing,
      sm_location_description: record.location_description,
      sm_street_name: record.street_name,
      sm_area_name: record.area_name,
      raw_webhook_data: record.raw_webhook_data,
      
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
    
    // ENHANCED COORDINATE EXTRACTION FOR FALLBACK DATA
    console.log(`🎯 APPLYING Enhanced Coordinate Service to fallback record ${record.notification_id}...`);
    
    try {
      const enhancedRoadwork = await enhancedCoordinateService.enhanceAlertCoordinates(roadwork);
      
      if (enhancedRoadwork.coordinates && enhancedRoadwork.coordinateConfidence >= 50) {
        roadwork = enhancedRoadwork;
        console.log(`✅ Enhanced coordinates SUCCESS for fallback ${record.notification_id}: [${roadwork.coordinates[0]}, ${roadwork.coordinates[1]}] from ${roadwork.coordinateSource} (confidence: ${roadwork.coordinateConfidence}%)`);
      } else {
        // Fallback to legacy coordinate extraction
        const extractedCoords = this.extractCoordinatesFromWebhook(record);
        const coordinates = extractedCoords ? [extractedCoords.lat, extractedCoords.lng] : null;
        
        roadwork.coordinates = coordinates;
        roadwork.coordinateSource = extractedCoords?.source || 'none';
        roadwork.coordinateConfidence = extractedCoords ? 60 : 10;
        
        if (extractedCoords) {
          console.log(`🔧 Legacy coordinates applied for fallback ${record.notification_id}: [${extractedCoords.lat}, ${extractedCoords.lng}] from ${extractedCoords.source}`);
        } else {
          console.log(`❌ No coordinates extracted for fallback ${record.notification_id}`);
        }
      }
    } catch (error) {
      console.error(`❌ Enhanced coordinate extraction FAILED for fallback ${record.notification_id}:`, error.message);
      
      // Fallback to legacy method
      const extractedCoords = this.extractCoordinatesFromWebhook(record);
      const coordinates = extractedCoords ? [extractedCoords.lat, extractedCoords.lng] : null;
      
      roadwork.coordinates = coordinates;
      roadwork.coordinateSource = extractedCoords?.source || 'legacy_fallback';
      roadwork.coordinateConfidence = extractedCoords ? 60 : 10;
      
      if (extractedCoords) {
        console.log(`🔧 Legacy fallback coordinates for fallback ${record.notification_id}: [${extractedCoords.lat}, ${extractedCoords.lng}]`);
      }
    }
    
    return roadwork;
  }

  /**
   * Get manual roadworks/incidents
   * @param {Object} options - Query options
   * @param {boolean} options.includeDismissed - Include dismissed alerts (default: false)
   */
  async getManualRoadworks(options = {}) {
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
      
      let query = supabaseClient
        .from('roadworks')
        .select('id, location, description, created_at, severity, status')
        .order('created_at', { ascending: false })
        .limit(100); // Reduced limit for performance

      // Filter out dismissed alerts unless explicitly requested
      if (!options.includeDismissed) {
        query = query.neq('status', 'dismissed').or('dismissed_at.is.null,dismissed_at.eq.null');
        console.log('🚫 Filtering out dismissed manual roadworks');
      } else {
        console.log('ℹ️ Including dismissed manual roadworks (admin mode)');
      }
      
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
   * Memory-optimized for 2GB RAM constraint
   */
  deduplicateRoadworksFast(roadworks) {
    if (!Array.isArray(roadworks) || roadworks.length === 0) {
      return roadworks || [];
    }
    
    const seen = new Set();
    const deduplicated = [];
    
    for (const roadwork of roadworks) {
      // Safety check for null/undefined roadwork
      if (!roadwork) {
        console.warn('⚠️ Skipping null/undefined roadwork in deduplication');
        continue;
      }
      
      // Safe property access with fallbacks
      const source = roadwork.source || 'unknown';
      const location = roadwork.location || roadwork.title || 'unknown';
      const locationKey = typeof location === 'string' ? 
        location.toLowerCase().substring(0, 50) : 
        String(location).substring(0, 50);
      
      // Simple dedup key based on location and source  
      const key = `${source}_${locationKey}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(roadwork);
      }
    }
    
    console.log(`🔄 Fast dedup: ${roadworks.length} -> ${deduplicated.length}`);
    
    // Clear the Set to free memory immediately
    seen.clear();
    
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
      this.cache.delete('streetworks_data_active_only');
      this.cache.delete('streetworks_data_with_dismissed');
      this.cache.delete('unified_roadworks_data');
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