// backend/services/unifiedRoadworksManager.js
// Unified roadworks data aggregator and management system

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import durhamRoadworks from './durhamRoadworks.js';
import { generateAlertHash } from '../utils/alertDeduplication.js';
import streetManager from './streetManager.js';
import { convexSync } from './convexSync.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

/**
 * Unified Roadworks Manager
 * Aggregates data from:
 * 1. Street Manager (national UK system)
 * 2. Durham County Council
 * 3. Other local council sources
 * 4. Manual incidents
 */
class UnifiedRoadworksManager {
  constructor() {
    this.sources = {
      streetManager: { enabled: true, priority: 1 },
      durham: { enabled: true, priority: 2 },
      manual: { enabled: true, priority: 3 }
    };
    this.lastUpdate = null;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get all roadworks from all sources
   */
  async getAllRoadworks(options = {}) {
    try {
      console.log('🔄 Fetching unified roadworks data from all sources...');
      
      const results = {
        streetManager: [],
        durham: [],
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

      if (this.sources.durham.enabled) {
        promises.push(this.getDurhamRoadworks());
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

      if (this.sources.durham.enabled) {
        const durhamResult = sourceResults[sourceIndex++];
        if (durhamResult.status === 'fulfilled') {
          results.durham = durhamResult.value.data || [];
          results.metadata.sources.durham = {
            success: true,
            count: results.durham.length,
            lastUpdate: durhamResult.value.lastUpdate
          };
        } else {
          results.metadata.sources.durham = {
            success: false,
            error: durhamResult.reason?.message
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
        ...results.durham,
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
        
        // Use the StreetManager sync function which handles both Intelligence Engine and Convex
        const result = await streetManager.syncStreetManagerToSystems();
        
        if (result.success) {
          console.log(`✅ Systems sync complete: ${result.convexSynced} to Convex, ${result.enhancedAlerts} with ML predictions`);
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
      // 🔧 FIXED: Read directly from streetmanager_notifications (webhook data)
      console.log('📊 Fetching Street Manager data from webhook notifications...');
      
      // Import location validation
      const { isNorthEastLocation } = await import('./locationValidation.js');
      
      const { data: notifications, error: notifError } = await supabase
        .from('streetmanager_notifications')
        .select('*')
        .order('webhook_received_at', { ascending: false })
        .limit(500); // Increased limit

      if (notifError) {
        console.error('❌ Street Manager notifications error:', notifError);
        console.warn('⚠️ Failed to fetch Street Manager notifications:', notifError);
        return {
          success: false,
          data: [],
          error: notifError.message,
          source: 'street_manager'
        };
      }

      console.log(`📨 Found ${notifications?.length || 0} Street Manager webhook notifications`);
      
      if (!notifications || notifications.length === 0) {
        console.log('📋 No notifications found, returning empty array');
        return {
          success: true,
          data: [],
          lastUpdate: new Date().toISOString(),
          source: 'street_manager',
          metadata: {
            webhookNotifications: 0,
            processedRoadworks: 0,
            total: 0,
            directWebhookRead: true
          }
        };
      }
      
      console.log('🔄 Converting notifications to roadworks format...');
      
      // Convert notifications to roadworks format
      const roadworks = [];
      
      for (let i = 0; i < notifications.length; i++) {
        try {
          const notification = notifications[i];
          const rawData = notification.raw_webhook_data || {};
          const objectData = rawData.object_data || {};
          
          console.log(`🔍 Processing notification ${i+1}/${notifications.length}: ${notification.notification_id}`);
          
          // 📍 FIXED: Extract location from raw webhook data
          const location = objectData.street_name || objectData.area_name || 
                          notification.street_name || notification.area_name || 
                          notification.location_description || 'Unknown location';
          
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
            id: notification.notification_id,
            title: `${objectData.activity_type || rawData.object_type} - ${objectData.street_name || 'Unknown Street'}`,
            description: `${objectData.work_category || 'Works'}: ${objectData.activity_type || 'Street Manager notification'} (${rawData.event_type})`,
            location: fullLocation,
            coordinates: notification.coordinates ? [notification.coordinates.lat, notification.coordinates.lng] : null,
            
            // Status and severity
            status: objectData.work_status_ref === 'completed' ? 'green' : 
                   objectData.work_status_ref === 'in_progress' ? 'red' : 'amber',
            severity: objectData.work_category === 'Major' ? 'High' : 
                     objectData.work_category === 'Standard' ? 'Medium' : 
                     objectData.is_traffic_sensitive === 'Yes' ? 'Medium' : 'Low',
            
            // Source information  
            source: 'StreetManager',
            dataSource: 'StreetManager Webhook',
            sourceId: notification.notification_id,
            
            // Timing
            startDate: objectData.actual_start_date_time || objectData.proposed_start_date,
            endDate: objectData.actual_end_date_time || objectData.proposed_end_date,
            lastUpdated: notification.webhook_received_at,
            
            // Street Manager specific
            permitReference: objectData.permit_reference_number,
            activityReference: objectData.work_reference_number,
            workCategory: objectData.work_category,
            authority: objectData.highway_authority || objectData.promoter_organisation,
            streetName: objectData.street_name,
            areaName: objectData.area_name,
            town: objectData.town,
            eventType: notification.webhook_event_type,
            
            // Work details
            activityType: objectData.activity_type,
            workStatus: objectData.work_status,
            permitStatus: objectData.permit_status,
            trafficManagement: objectData.traffic_management_type,
            isTrafficSensitive: objectData.is_traffic_sensitive === 'Yes',
            workLocationCoordinates: objectData.works_location_coordinates,
            
            // Processing status
            processingStatus: notification.processing_status,
            processedAt: notification.processed_at,
            
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
          console.log(`✅ Successfully converted notification ${i+1}: ${roadwork.title}`);
          
        } catch (conversionError) {
          console.error(`❌ Error converting notification ${i+1}:`, conversionError);
          console.error('Notification data:', notifications[i]);
        }
      }
      
      console.log(`🚧 Converted ${roadworks.length}/${notifications.length} notifications to roadworks`);
      
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
      
      return {
        success: true,
        data: uniqueRoadworks,
        lastUpdate: new Date().toISOString(),
        source: 'street_manager',
        metadata: {
          webhookNotifications: roadworks.length,
          processedRoadworks: additionalRoadworks.length,
          total: uniqueRoadworks.length,
          directWebhookRead: true
        }
      };
    } catch (error) {
      console.error('❌ CRITICAL: Street Manager fetch failed:', error);
      console.error('Stack trace:', error.stack);
      throw new Error(`Street Manager fetch failed: ${error.message}`);
    }
  }

  /**
   * Get Durham County Council roadworks via web scraping
   */
  async getDurhamRoadworks() {
    try {
      // Use the Durham scraper service with Puppeteer
      const durhamData = await durhamRoadworks.fetchRoadworks();
      
      // Data is already normalized by the Durham service
      return {
        success: true,
        data: durhamData,
        lastUpdate: new Date().toISOString(),
        source: 'durham_council'
      };
    } catch (error) {
      console.warn('⚠️ Durham roadworks fetch failed:', error.message);
      
      // Specific handling for Chrome not found
      if (error.message.includes('Could not find Chrome')) {
        console.log('📵 Durham scraper disabled - Chrome not available on this platform');
      }
      
      return {
        success: false,
        data: [],
        error: error.message,
        source: 'durham_council'
      };
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
      const priorityOrder = { street_manager: 1, durham_council: 2, manual: 3 };
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
      const [dismissals, acknowledgments, saves] = await Promise.all([
        supabase.from('roadwork_dismissals').select('*').eq('roadwork_id', roadworkId),
        supabase.from('roadwork_acknowledgments').select('*').eq('roadwork_id', roadworkId),
        supabase.from('saved_roadworks').select('*').eq('roadwork_id', roadworkId)
      ]);

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
      
      // Fetch all notifications
      const { data: notifications, error } = await supabase
        .from('streetmanager_notifications')
        .select('*')
        .order('webhook_received_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch notifications:', error);
        return { success: false, error: error.message };
      }

      console.log(`📊 Found ${notifications.length} total notifications to check`);
      
      const toDelete = [];
      let northEastCount = 0;
      
      // Check each notification
      for (const notification of notifications) {
        const rawData = notification.raw_webhook_data || {};
        const objectData = rawData.object_data || {};
        
        const locationData = {
          location: objectData.street_name || objectData.area_name || notification.location_description,
          town: objectData.town,
          authority: objectData.highway_authority || objectData.promoter_organisation,
          areaName: objectData.area_name || notification.area_name,
          streetName: objectData.street_name || notification.street_name,
          coordinates: notification.coordinates
        };
        
        if (!isNorthEastLocation(locationData)) {
          toDelete.push(notification.notification_id);
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
            .from('streetmanager_notifications')
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
          totalChecked: notifications.length,
          northEastKept: northEastCount,
          deleted: deleted
        };
      } else {
        console.log('✅ No non-NE roadworks found - database is clean!');
        return {
          success: true,
          totalChecked: notifications.length,
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
      
      const { data: notifications, error } = await supabase
        .from('streetmanager_notifications')
        .select('notification_id, location_description, street_name, area_name, town, raw_webhook_data')
        .order('webhook_received_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      let northEast = 0;
      let nonNorthEast = 0;
      const sampleNonNE = [];
      
      for (const notification of notifications) {
        const rawData = notification.raw_webhook_data || {};
        const objectData = rawData.object_data || {};
        
        const locationData = {
          location: objectData.street_name || objectData.area_name || notification.location_description,
          town: objectData.town,
          authority: objectData.highway_authority || objectData.promoter_organisation,
          areaName: objectData.area_name || notification.area_name,
          streetName: objectData.street_name || notification.street_name
        };
        
        if (isNorthEastLocation(locationData)) {
          northEast++;
        } else {
          nonNorthEast++;
          if (sampleNonNE.length < 10) {
            sampleNonNE.push({
              id: notification.notification_id,
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
          total: notifications.length,
          northEast,
          nonNorthEast,
          percentageNE: Math.round((northEast / notifications.length) * 100),
          sampleNonNE
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new UnifiedRoadworksManager();