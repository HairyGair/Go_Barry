// backend/services/unifiedRoadworksManager.js
// Unified roadworks data aggregator and management system

import { createClient } from '@supabase/supabase-js';
// Removed axios import - app only uses database/webhook data, not external API calls
import { generateAlertHash } from '../utils/alertDeduplication.js';
// Removed streetManager import - app only uses AWS webhook data, not external API calls
import { convexSync } from './convexSync.js';
import { supabaseOptimizer } from './supabaseOptimizer.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

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
   * Get all roadworks from all sources
   */
  async getAllRoadworks(options = {}) {
    try {
      console.log('🔄 Fetching unified roadworks data from all sources...');
      
      const results = {
        streetManager: [],
        manual: [],
        combined: [],
        metadata: {
          sources: {},
          totalCount: 0,
          lastUpdate: new Date().toISOString()
        }
      };

      // Fetch from all enabled sources in parallel
      const promises = [];

      if (this.sources.streetManager.enabled) {
        promises.push(this.getStreetManagerRoadworks());
      }

      if (this.sources.manual.enabled) {
        promises.push(this.getManualRoadworks());
      }

      const sourceResults = await Promise.allSettled(promises);

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

      // Combine and deduplicate
      results.combined = this.combineAndDeduplicateRoadworks([
        ...results.streetManager,
        ...results.manual
      ]);

      results.metadata.totalCount = results.combined.length;
      results.metadata.criticalCount = results.combined.filter(r => 
        r.severity === 'Critical' || r.severity === 'critical'
      ).length;
      results.metadata.highImpactCount = results.combined.filter(r => 
        r.affectedRoutes?.length > 3 || r.impactScore > 70
      ).length;
      
      this.lastUpdate = new Date();

      console.log(`✅ Unified roadworks: ${results.combined.length} total from ${Object.keys(results.metadata.sources).length} sources`);
      console.log(`   🔴 Critical: ${results.metadata.criticalCount}, 🚨 High Impact: ${results.metadata.highImpactCount}`);
      
      // Sync high-impact roadworks to systems
      if (options.syncToSystems !== false) {
        this.syncHighImpactRoadworks(results.combined);
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
   * Sync high-impact roadworks to Intelligence Engine and Convex
   */
  async syncHighImpactRoadworks(roadworks) {
    try {
      const highImpact = roadworks.filter(r => 
        r.severity === 'Critical' || 
        r.severity === 'High' ||
        r.affectedRoutes?.length > 3 ||
        r.impactScore > 70
      );
      
      if (highImpact.length > 0) {
        console.log(`🔄 Syncing ${highImpact.length} high-impact roadworks to systems...`);
        
        // ✅ FIXED: Use existing webhook data instead of external API calls
        // Sync the high-impact roadworks we already have to Convex
        try {
          const convexResult = await convexSync.syncStreetManagerRoadworks(highImpact);
          if (convexResult.success) {
            console.log(`✅ Systems sync complete: ${convexResult.count} to Convex`);
          } else {
            console.warn('⚠️ Convex sync failed:', convexResult.error);
          }
        } catch (syncError) {
          console.error('❌ Failed to sync roadworks to Convex:', syncError.message);
        }
      }
    } catch (error) {
      console.error('⚠️ Failed to sync high-impact roadworks:', error);
    }
  }

  /**
   * Get Street Manager roadworks from Supabase
   */
  async getStreetManagerRoadworks() {
    try {
      // Check circuit breaker
      if (this.streetManagerDisabled && Date.now() < this.streetManagerDisabledUntil) {
        const remainingTime = Math.round((this.streetManagerDisabledUntil - Date.now()) / 1000);
        console.log(`🚨 Street Manager disabled by circuit breaker for ${remainingTime}s`);
        
        // Try to return cached data
        if (this.cache.has('streetmanager_data')) {
          const cached = this.cache.get('streetmanager_data');
          console.log('📋 Returning cached data during circuit breaker cooldown');
          return {
            success: true,
            data: cached.data,
            cached: true,
            circuitBreaker: true,
            source: 'street_manager_cached'
          };
        }
        
        return {
          success: false,
          data: [],
          error: 'Street Manager disabled by circuit breaker',
          circuitBreaker: true,
          retryAfter: this.streetManagerDisabledUntil - Date.now(),
          source: 'street_manager'
        };
      }
      
      // 🔧 FIXED: Read directly from streetmanager_summaries (processed webhook data)
      console.log('📊 Fetching Street Manager data from processed summaries...');
      
      // Import location validation
      const { isNorthEastLocation } = await import('./locationValidation.js');
      
      // Enhanced retry logic with exponential backoff and connection recovery
      let summaries = null;
      let notifError = null;
      
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          console.log(`🔄 Street Manager connection attempt ${attempt}/5...`);
          
          // Test basic connection first
          if (attempt > 1) {
            try {
              await supabase.from('streetmanager_summaries').select('id').limit(1);
              console.log(`✅ Connection test passed on attempt ${attempt}`);
            } catch (connError) {
              console.warn(`⚠️ Connection test failed on attempt ${attempt}:`, connError.message);
              throw connError;
            }
          }
          
          const result = await Promise.race([
            supabase
              .from('streetmanager_summaries')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(500),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database timeout after 15s')), 15000)
            )
          ]);
          
          summaries = result.data;
          notifError = result.error;
          
          if (!notifError && summaries) {
            console.log(`✅ Street Manager data fetch successful on attempt ${attempt}`);
            break;
          } else if (notifError) {
            throw new Error(notifError.message);
          }
          
        } catch (error) {
          console.warn(`⚠️ Street Manager query attempt ${attempt}/5 failed:`, error.message);
          notifError = error;
          
          if (attempt < 5) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      if (notifError) {
        console.error('❌ Street Manager notifications error after 5 attempts:', notifError);
        
        // Try to return cached data if available
        if (this.cache.has('streetmanager_data')) {
          const cached = this.cache.get('streetmanager_data');
          if (Date.now() - cached.timestamp < this.cacheTimeout * 6) { // Allow longer stale cache during errors
            console.log('📋 Returning cached Street Manager data due to database error');
            console.log(`   Cache age: ${Math.round((Date.now() - cached.timestamp) / 1000 / 60)} minutes`);
            return {
              success: true,
              data: cached.data,
              cached: true,
              cacheAge: Date.now() - cached.timestamp,
              error: `Database error: ${notifError.message}`,
              source: 'street_manager_cached'
            };
          } else {
            console.warn('⚠️ Cached data too old, not using');
          }
        }
        
        // Try local file fallback for critical scenarios
        try {
          const fs = await import('fs');
          const path = await import('path');
          const fallbackPath = path.join(process.cwd(), 'data', 'streetmanager_fallback.json');
          
          if (fs.existsSync(fallbackPath)) {
            const fallbackData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
            console.log('📁 Using local fallback Street Manager data');
            return {
              success: true,
              data: fallbackData.data || [],
              fallback: true,
              fallbackAge: fallbackData.timestamp ? Date.now() - fallbackData.timestamp : 'unknown',
              error: `Database error, using fallback: ${notifError.message}`,
              source: 'street_manager_fallback'
            };
          }
        } catch (fallbackError) {
          console.warn('⚠️ Failed to load fallback data:', fallbackError.message);
        }
        
        // Return empty data but mark as degraded service
        console.warn('⚠️ No cached or fallback data available - returning empty (degraded service)');
        return {
          success: false,
          data: [],
          error: `Critical: Database connection failed after 5 attempts: ${notifError.message}`,
          source: 'street_manager',
          degraded: true,
          retryAfter: 60000 // Suggest retry after 1 minute
        };
      }

      console.log(`📨 Found ${summaries?.length || 0} Street Manager summaries`);
      
      if (!summaries || summaries.length === 0) {
        console.log('📋 No summaries found, returning empty array');
        return {
          success: true,
          data: [],
          lastUpdate: new Date().toISOString(),
          source: 'street_manager',
          metadata: {
            webhookSummaries: 0,
            processedRoadworks: 0,
            total: 0,
            directWebhookRead: true
          }
        };
      }
      
      console.log('🔄 Converting summaries to roadworks format...');
      
      // Convert summaries to roadworks format
      const roadworks = [];
      
      for (let i = 0; i < summaries.length; i++) {
        try {
          const summary = summaries[i];
          const rawData = summary.raw_webhook_data || {};
          const objectData = rawData.object_data || {};
          
          console.log(`🔍 Processing summary ${i+1}/${summaries.length}: ${summary.notification_id}`);
          
          // 📍 FIXED: Extract location from raw webhook data
          const location = objectData.street_name || objectData.area_name || 
                          summary.street_name || summary.area_name || 
                          summary.location_description || 'Unknown location';
          
          const fullLocation = objectData.town ? 
            `${location}, ${objectData.town}` : location;
          
          // CRITICAL: Filter out non-North East locations
          const locationData = {
            location: fullLocation,
            town: objectData.town,
            authority: objectData.highway_authority || objectData.promoter_organisation,
            areaName: objectData.area_name,
            streetName: objectData.street_name
          };
          
          if (!isNorthEastLocation(locationData)) {
            console.log(`⏭️ Skipping non-NE roadwork: ${fullLocation}`);
            continue;
          }
          
          const roadwork = {
            id: summary.notification_id,
            title: `${objectData.activity_type || rawData.object_type} - ${objectData.street_name || 'Unknown Street'}`,
            description: `${objectData.work_category || 'Works'}: ${objectData.activity_type || 'Street Manager summary'} (${rawData.event_type})`,
            location: fullLocation,
            coordinates: summary.coordinates ? [summary.coordinates.lat, summary.coordinates.lng] : null,
            
            // Status and severity
            status: objectData.work_status_ref === 'completed' ? 'green' : 
                   objectData.work_status_ref === 'in_progress' ? 'red' : 'amber',
            severity: objectData.work_category === 'Major' ? 'High' : 
                     objectData.work_category === 'Standard' ? 'Medium' : 
                     objectData.is_traffic_sensitive === 'Yes' ? 'Medium' : 'Low',
            
            // Source information  
            source: 'StreetManager',
            dataSource: 'StreetManager Webhook',
            sourceId: summary.notification_id,
            
            // Timing
            startDate: objectData.actual_start_date_time || objectData.proposed_start_date,
            endDate: objectData.actual_end_date_time || objectData.proposed_end_date,
            lastUpdated: summary.webhook_received_at,
            
            // Street Manager specific
            permitReference: objectData.permit_reference_number,
            activityReference: objectData.work_reference_number,
            workCategory: objectData.work_category,
            authority: objectData.highway_authority || objectData.promoter_organisation,
            streetName: objectData.street_name,
            areaName: objectData.area_name,
            town: objectData.town,
            eventType: summary.webhook_event_type,
            
            // Work details
            activityType: objectData.activity_type,
            workStatus: objectData.work_status,
            permitStatus: objectData.permit_status,
            trafficManagement: objectData.traffic_management_type,
            isTrafficSensitive: objectData.is_traffic_sensitive === 'Yes',
            workLocationCoordinates: objectData.works_location_coordinates,
            
            // Processing status
            processingStatus: summary.processing_status,
            processedAt: summary.processed_at,
            
            // Enhancement flags
            locationAccuracy: objectData.works_location_coordinates ? 'high' : 
                            objectData.street_name ? 'medium' : 'low',
            routeMatchMethod: 'webhook_direct',
            officialSource: true,
            realTimeUpdate: true,
            
            // Management actions
            managementActions: {
              canDismiss: true,
              canAcknowledge: true,
              canCreateDiversion: !!objectData.works_location_coordinates,
              canNotifyDrivers: !!objectData.works_location_coordinates,
              canSave: true,
              canEdit: false
            },
            
            // Raw webhook data for debugging
            webhookData: rawData
          };
          
          roadworks.push(roadwork);
          console.log(`✅ Successfully converted summary ${i+1}: ${roadwork.title}`);
          
        } catch (conversionError) {
          console.error(`❌ Error converting summary ${i+1}:`, conversionError);
          console.error('Summary data:', summaries[i]);
        }
      }
      
      console.log(`🚧 Converted ${roadworks.length}/${summaries.length} summaries to roadworks`);
      
      // Also try to fetch from processed tables (fallback)
      let additionalRoadworks = [];
      
      try {
        console.log('📊 Fetching processed roadworks as fallback...');
        const { data: processedRoadworks, error: roadworksError } = await supabase
          .from('roadworks')
          .select('*')
          .eq('source', 'StreetManager')
          .order('created_at', { ascending: false })
          .limit(100);

        if (roadworksError) {
          console.warn('⚠️ Failed to fetch processed roadworks:', roadworksError);
        } else if (processedRoadworks) {
          additionalRoadworks = processedRoadworks;
          console.log(`📊 Found ${processedRoadworks.length} processed Street Manager roadworks`);
        }
      } catch (err) {
        console.warn('⚠️ Failed to fetch processed roadworks:', err.message);
      }
      
      // Combine and deduplicate
      const allRoadworks = [...roadworks, ...additionalRoadworks];
      const uniqueRoadworks = this.deduplicateByReference(allRoadworks);
      
      console.log(`🚧 Street Manager: ${uniqueRoadworks.length} total roadworks (${roadworks.length} from webhooks, ${additionalRoadworks.length} processed)`);
      
      const result = {
        success: true,
        data: uniqueRoadworks,
        lastUpdate: new Date().toISOString(),
        source: 'street_manager',
        metadata: {
          webhookSummaries: roadworks.length,
          processedRoadworks: additionalRoadworks.length,
          total: uniqueRoadworks.length,
          directWebhookRead: true
        }
      };
      
      // Cache successful results for resilience
      this.cache.set('streetmanager_data', {
        data: uniqueRoadworks,
        timestamp: Date.now()
      });
      
      // Also save to local file as emergency fallback
      try {
        const fs = await import('fs');
        const path = await import('path');
        const fallbackDir = path.join(process.cwd(), 'data');
        const fallbackPath = path.join(fallbackDir, 'streetmanager_fallback.json');
        
        // Ensure directory exists
        if (!fs.existsSync(fallbackDir)) {
          fs.mkdirSync(fallbackDir, { recursive: true });
        }
        
        const fallbackData = {
          data: uniqueRoadworks,
          timestamp: Date.now(),
          lastUpdate: new Date().toISOString(),
          count: uniqueRoadworks.length
        };
        
        fs.writeFileSync(fallbackPath, JSON.stringify(fallbackData, null, 2));
        console.log(`🗄️ Cached ${uniqueRoadworks.length} Street Manager roadworks (memory + file fallback)`);
      } catch (fallbackSaveError) {
        console.warn('⚠️ Failed to save fallback data:', fallbackSaveError.message);
        console.log(`🗄️ Cached ${uniqueRoadworks.length} Street Manager roadworks (memory only)`);
      }
      
      // Reset circuit breaker on success
      this.streetManagerFailures = 0;
      this.streetManagerDisabled = false;
      
      return result;
    } catch (error) {
      console.error('❌ CRITICAL: Street Manager fetch failed:', error);
      console.error('Stack trace:', error.stack);
      
      // Circuit breaker logic
      this.streetManagerFailures++;
      this.streetManagerLastFailure = Date.now();
      
      if (this.streetManagerFailures >= 3) {
        this.streetManagerDisabled = true;
        this.streetManagerDisabledUntil = Date.now() + (5 * 60 * 1000); // 5 minute cooldown
        console.warn(`🚨 Street Manager circuit breaker activated: ${this.streetManagerFailures} consecutive failures`);
        console.warn(`⏰ Will retry after 5 minutes`);
        
        // Try to return cached data during circuit breaker
        if (this.cache.has('streetmanager_data')) {
          const cached = this.cache.get('streetmanager_data');
          console.log('📋 Returning cached data due to circuit breaker activation');
          return {
            success: true,
            data: cached.data,
            cached: true,
            circuitBreaker: true,
            error: `Circuit breaker: ${error.message}`,
            source: 'street_manager_cached'
          };
        }
      }
      
      throw new Error(`Street Manager fetch failed: ${error.message}`);
    }
  }

  /**
   * Get manual roadworks/incidents
   */
  async getManualRoadworks() {
    try {
      const { data, error } = await supabase
        .from('manual_incidents')
        .select('*')
        .eq('type', 'roadwork')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const roadworks = data.map(item => this.normalizeManualData(item));
      
      return {
        success: true,
        data: roadworks,
        lastUpdate: new Date().toISOString(),
        source: 'manual'
      };
    } catch (error) {
      throw new Error(`Manual roadworks fetch failed: ${error.message}`);
    }
  }



  /**
   * Normalize Street Manager data to unified format
   */
  normalizeStreetManagerData(item) {
    // If already processed by streetManager service, return as-is
    if (item.source === 'StreetManager' && item.enhancedAnalysis) {
      return {
        ...item,
        id: item.id || `sm_${item.notification_id}`,
        managementActions: {
          canDismiss: true,
          canAcknowledge: true,
          canCreateDiversion: item.affectedRoutes?.length > 0,
          canNotifyDrivers: item.affectedRoutes?.length > 0,
          canSave: true,
          canEdit: false
        }
      };
    }
    
    // Otherwise normalize raw data
    return {
      id: `sm_${item.notification_id}`,
      title: item.title || `${item.object_type} - ${item.webhook_event_type}`,
      description: item.work_description || item.description,
      location: item.location_description || item.street_name,
      streetName: item.street_name,
      areaName: item.area_name,
      coordinates: item.coordinates,
      startDate: item.proposed_start_date || item.actual_start_date,
      endDate: item.proposed_end_date || item.actual_end_date,
      status: item.permit_status || item.work_status || item.activity_status,
      severity: item.severity || 'Medium',
      source: 'StreetManager',
      dataSource: 'StreetManager',
      sourceId: item.notification_id,
      promoter: item.promoter_organisation,
      authority: item.highway_authority,
      workCategory: item.work_category,
      lastUpdated: item.webhook_received_at,
      permitReference: item.permit_reference_number,
      workReference: item.work_reference_number,
      trafficManagement: item.traffic_management_type,
      affectedRoutes: [],
      managementActions: {
        canDismiss: true,
        canAcknowledge: true,
        canCreateDiversion: false,
        canNotifyDrivers: false,
        canSave: true,
        canEdit: false
      }
    };
  }



  /**
   * Normalize manual data to unified format
   */
  normalizeManualData(item) {
    return {
      id: `manual_${item.id}`,
      title: item.title,
      description: item.description,
      location: item.location,
      streetName: item.street_name,
      areaName: item.area,
      coordinates: item.coordinates,
      startDate: item.start_date,
      endDate: item.end_date,
      status: item.status,
      severity: item.severity || 'Medium',
      source: 'manual',
      sourceId: item.id,
      promoter: item.promoter || 'Manual Entry',
      authority: item.authority || 'Unknown',
      workCategory: item.category,
      lastUpdated: item.updated_at || item.created_at,
      managementActions: {
        canDismiss: true,
        canAcknowledge: true,
        canSave: true,
        canEdit: true
      }
    };
  }

  /**
   * Deduplicate roadworks by permit/activity reference
   */
  deduplicateByReference(roadworks) {
    const uniqueMap = new Map();
    
    roadworks.forEach(r => {
      const key = r.permitReference || r.activityReference || r.sourceId || r.id;
      if (!uniqueMap.has(key) || (r.processedAt && !uniqueMap.get(key).processedAt)) {
        uniqueMap.set(key, r);
      }
    });
    
    return Array.from(uniqueMap.values());
  }

  /**
   * Combine and deduplicate roadworks from multiple sources
   */
  combineAndDeduplicateRoadworks(roadworks) {
    const seen = new Set();
    const deduped = [];

    for (const roadwork of roadworks) {
      // Create a hash based on location and description for deduplication
      const hash = generateAlertHash({
        location: roadwork.location,
        description: roadwork.description,
        streetName: roadwork.streetName
      });

      if (!seen.has(hash)) {
        seen.add(hash);
        roadwork.deduplicationHash = hash;
        deduped.push(roadwork);
      } else {
        console.log(`🔄 Deduplicated roadwork: ${roadwork.title}`);
      }
    }

    // Sort by priority (Street Manager first, then others)
    return deduped.sort((a, b) => {
      const priorityOrder = { street_manager: 1, manual: 2 };
      return priorityOrder[a.source] - priorityOrder[b.source];
    });
  }

  /**
   * Dismiss a roadwork
   */
  async dismissRoadwork(roadworkId, reason, supervisorName) {
    try {
      const { data, error } = await supabase
        .from('roadwork_dismissals')
        .insert({
          roadwork_id: roadworkId,
          reason: reason,
          dismissed_by: supervisorName,
          dismissed_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log(`✅ Dismissed roadwork ${roadworkId}: ${reason}`);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error dismissing roadwork:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Acknowledge a roadwork
   */
  async acknowledgeRoadwork(roadworkId, note, supervisorName) {
    try {
      const { data, error } = await supabase
        .from('roadwork_acknowledgments')
        .insert({
          roadwork_id: roadworkId,
          note: note,
          acknowledged_by: supervisorName,
          acknowledged_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log(`✅ Acknowledged roadwork ${roadworkId}`);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error acknowledging roadwork:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save/bookmark a roadwork
   */
  async saveRoadwork(roadworkId, supervisorName, notes = '') {
    try {
      const { data, error } = await supabase
        .from('saved_roadworks')
        .upsert({
          roadwork_id: roadworkId,
          saved_by: supervisorName,
          notes: notes,
          saved_at: new Date().toISOString()
        }, {
          onConflict: 'roadwork_id,saved_by'
        });

      if (error) throw error;

      console.log(`✅ Saved roadwork ${roadworkId}`);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error saving roadwork:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get roadwork management history
   */
  async getRoadworkHistory(roadworkId) {
    try {
      // Use optimized batch queries
      const historyQueries = [
        { key: 'dismissals', table: 'roadwork_dismissals', options: { filters: { roadwork_id: roadworkId }, limit: 50, cacheTTL: 600 }},
        { key: 'acknowledgments', table: 'roadwork_acknowledgments', options: { filters: { roadwork_id: roadworkId }, limit: 50, cacheTTL: 600 }},
        { key: 'saves', table: 'saved_roadworks', options: { filters: { roadwork_id: roadworkId }, limit: 50, cacheTTL: 600 }}
      ];
      
      const batchResults = await supabaseOptimizer.batchSelect(supabase, historyQueries);
      const dismissals = batchResults.dismissals;
      const acknowledgments = batchResults.acknowledgments;
      const saves = batchResults.saves;

      return {
        success: true,
        history: {
          dismissals: dismissals.data || [],
          acknowledgments: acknowledgments.data || [],
          saves: saves.data || []
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get statistics about roadworks management
   */
  async getManagementStats(timeframe = '7d') {
    try {
      const startDate = new Date();
      if (timeframe === '7d') startDate.setDate(startDate.getDate() - 7);
      else if (timeframe === '30d') startDate.setMonth(startDate.getMonth() - 1);
      
      const [dismissals, acknowledgments, saves] = await Promise.all([
        supabase.from('roadwork_dismissals').select('*').gte('dismissed_at', startDate.toISOString()),
        supabase.from('roadwork_acknowledgments').select('*').gte('acknowledged_at', startDate.toISOString()),
        supabase.from('saved_roadworks').select('*').gte('saved_at', startDate.toISOString())
      ]);

      return {
        success: true,
        stats: {
          period: timeframe,
          dismissals: dismissals.data?.length || 0,
          acknowledgments: acknowledgments.data?.length || 0,
          saves: saves.data?.length || 0,
          totalActions: (dismissals.data?.length || 0) + (acknowledgments.data?.length || 0) + (saves.data?.length || 0)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up non-North East roadworks from Supabase
   */
  async cleanupNonNorthEastRoadworks() {
    try {
      console.log('🧹 Starting cleanup of non-North East roadworks...');
      
      // Import location validation
      const { isNorthEastLocation } = await import('./locationValidation.js');
      
      // Fetch all summaries
      const { data: summaries, error } = await supabase
        .from('streetmanager_summaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch summaries:', error);
        return { success: false, error: error.message };
      }

      console.log(`📊 Found ${summaries.length} total summaries to check`);
      
      const toDelete = [];
      let northEastCount = 0;
      
      // Check each summary
      for (const summary of summaries) {
        const rawData = summary.raw_webhook_data || {};
        const objectData = rawData.object_data || {};
        
        const locationData = {
          location: objectData.street_name || objectData.area_name || summary.location_description,
          town: objectData.town,
          authority: objectData.highway_authority || objectData.promoter_organisation,
          areaName: objectData.area_name || summary.area_name,
          streetName: objectData.street_name || summary.street_name,
          coordinates: summary.coordinates
        };
        
        if (!isNorthEastLocation(locationData)) {
          toDelete.push(summary.notification_id);
          console.log(`🗑️ Marked for deletion: ${locationData.location} (${locationData.authority})`);
        } else {
          northEastCount++;
        }
      }
      
      console.log(`📊 Analysis complete:`);
      console.log(`   ✅ North East roadworks: ${northEastCount}`);
      console.log(`   ❌ Non-NE to delete: ${toDelete.length}`);
      
      // Delete non-NE roadworks in batches
      if (toDelete.length > 0) {
        const batchSize = 100;
        let deleted = 0;
        
        for (let i = 0; i < toDelete.length; i += batchSize) {
          const batch = toDelete.slice(i, i + batchSize);
          
          const { error: deleteError } = await supabase
            .from('streetmanager_summaries')
            .delete()
            .in('notification_id', batch);
          
          if (deleteError) {
            console.error(`❌ Batch deletion error:`, deleteError);
          } else {
            deleted += batch.length;
            console.log(`🗑️ Deleted batch: ${deleted}/${toDelete.length}`);
          }
        }
        
        console.log(`✅ Cleanup complete: ${deleted} non-NE roadworks removed`);
        
        return {
          success: true,
          totalChecked: summaries.length,
          northEastKept: northEastCount,
          deleted: deleted
        };
      } else {
        console.log('✅ No non-NE roadworks found - database is clean!');
        return {
          success: true,
          totalChecked: summaries.length,
          northEastKept: northEastCount,
          deleted: 0
        };
      }
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get cleanup statistics without deleting
   */
  async getCleanupStats() {
    try {
      const { isNorthEastLocation } = await import('./locationValidation.js');
      
      const { data: summaries, error } = await supabase
        .from('streetmanager_summaries')
        .select('notification_id, location_description, street_name, area_name, town, raw_webhook_data')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      let northEast = 0;
      let nonNorthEast = 0;
      const sampleNonNE = [];
      
      for (const summary of summaries) {
        const rawData = summary.raw_webhook_data || {};
        const objectData = rawData.object_data || {};
        
        const locationData = {
          location: objectData.street_name || objectData.area_name || summary.location_description,
          town: objectData.town,
          authority: objectData.highway_authority || objectData.promoter_organisation,
          areaName: objectData.area_name || summary.area_name,
          streetName: objectData.street_name || summary.street_name
        };
        
        if (isNorthEastLocation(locationData)) {
          northEast++;
        } else {
          nonNorthEast++;
          if (sampleNonNE.length < 10) {
            sampleNonNE.push({
              id: summary.notification_id,
              location: locationData.location,
              authority: locationData.authority,
              town: locationData.town
            });
          }
        }
      }
      
      return {
        success: true,
        stats: {
          total: summaries.length,
          northEast,
          nonNorthEast,
          percentageNE: Math.round((northEast / summaries.length) * 100),
          sampleNonNE
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new UnifiedRoadworksManager();