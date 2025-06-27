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
      // First, try to get processed webhook data from Supabase
      const { data: webhookData, error: webhookError } = await supabase
        .from('streetmanager_notifications')
        .select('*')
        .eq('processing_status', 'processed')
        .order('webhook_received_at', { ascending: false })
        .limit(100);

      if (webhookError) {
        console.warn('⚠️ Failed to fetch webhook data, falling back to API');
      }

      // Also fetch directly from StreetManager API
      const apiData = await streetManager.fetchStreetManagerActivities(true);
      
      let combinedRoadworks = [];
      
      // Process webhook data if available
      if (webhookData && webhookData.length > 0) {
        const webhookRoadworks = await Promise.all(
          webhookData.map(async (item) => {
            try {
              // Process through streetManager service for enhanced analysis
              const processed = await streetManager.processStreetManagerWebhook({
                object_data: item.raw_webhook_data?.object_data || {},
                event_type: item.webhook_event_type,
                event_time: item.webhook_received_at
              });
              return processed;
            } catch (err) {
              console.warn('⚠️ Failed to process webhook item:', err.message);
              return this.normalizeStreetManagerData(item);
            }
          })
        );
        combinedRoadworks.push(...webhookRoadworks.filter(r => r));
      }
      
      // Add API data if available
      if (apiData.success && apiData.data) {
        combinedRoadworks.push(...apiData.data);
      }
      
      // Deduplicate by permit reference
      const uniqueRoadworks = Array.from(
        new Map(combinedRoadworks.map(r => [r.permitReference || r.id, r])).values()
      );
      
      console.log(`🚧 StreetManager: ${uniqueRoadworks.length} roadworks (${webhookData?.length || 0} webhook, ${apiData.data?.length || 0} API)`);
      
      return {
        success: true,
        data: uniqueRoadworks,
        lastUpdate: new Date().toISOString(),
        source: 'street_manager'
      };
    } catch (error) {
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
}

export default new UnifiedRoadworksManager();