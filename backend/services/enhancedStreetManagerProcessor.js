// Enhanced StreetManager Webhook Processor
// Comprehensive route impact analysis and intelligent notification system
// Designed for Go North East's 231+ bus routes with memory optimization

import { createClient } from '@supabase/supabase-js';
import routeImpactAnalyzer from './enhancedRouteImpactAnalyzer.js';
import severityClassifier from './streetManagerSeverityClassifier.js';
import memoryMonitor from './memoryMonitor.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Enhanced StreetManager Webhook Processor
 * Provides end-to-end processing of StreetManager notifications with intelligent route impact analysis
 */
class EnhancedStreetManagerProcessor {
  constructor() {
    this.processingQueue = [];
    this.maxQueueSize = 50; // Memory constraint
    this.isProcessing = false;
    this.processingStats = {
      total_processed: 0,
      successful_analyses: 0,
      failed_analyses: 0,
      notifications_sent: 0,
      average_processing_time: 0
    };
    
    // Memory cleanup callback
    this.registerMemoryCleanup();
  }

  /**
   * Register memory cleanup callback with memory monitor
   */
  registerMemoryCleanup() {
    if (typeof memoryMonitor?.registerCleanupCallback === 'function') {
      memoryMonitor.registerCleanupCallback((level) => {
        console.log(`🧹 Enhanced StreetManager Processor: ${level} memory cleanup`);
        
        if (level === 'emergency') {
          // Emergency: Clear processing queue
          this.processingQueue = [];
          console.log('🚨 Emergency cleanup: Processing queue cleared');
        } else {
          // Preventive: Trim queue to half size
          this.processingQueue = this.processingQueue.slice(-Math.floor(this.maxQueueSize / 2));
          console.log(`🧹 Preventive cleanup: Queue trimmed to ${this.processingQueue.length} items`);
        }
      });
    }
  }

  /**
   * Process StreetManager webhook notification with comprehensive analysis
   */
  async processWebhookNotification(notificationData, options = {}) {
    const processingId = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      console.log(`📨 [${processingId}] Processing StreetManager notification`);
      console.log(`🔍 [${processingId}] Event: ${notificationData.event_type}, Object: ${notificationData.object_type}`);
      
      // Validate notification data
      const validationResult = this.validateNotificationData(notificationData);
      if (!validationResult.valid) {
        console.warn(`⚠️ [${processingId}] Invalid notification: ${validationResult.reason}`);
        return this.createProcessingResult(processingId, 'invalid', validationResult.reason, startTime);
      }

      // Check if notification should be processed (geographic filtering)
      const shouldProcess = await this.shouldProcessNotification(notificationData);
      if (!shouldProcess.process) {
        console.log(`🚫 [${processingId}] Notification filtered: ${shouldProcess.reason}`);
        return this.createProcessingResult(processingId, 'filtered', shouldProcess.reason, startTime);
      }

      // Extract streetwork data from notification
      const streetworkData = this.extractStreetworkData(notificationData);

      // Perform severity classification
      console.log(`📊 [${processingId}] Classifying severity...`);
      const severityResult = await this.performSeverityClassification(streetworkData);

      // Perform route impact analysis
      console.log(`🚌 [${processingId}] Analyzing route impacts...`);
      const routeAnalysis = await this.performRouteImpactAnalysis(streetworkData);

      // Combine results and save to database
      const enhancedStreetwork = this.combineAnalysisResults(streetworkData, severityResult, routeAnalysis);
      
      // Save to enhanced streetworks table
      const saveResult = await this.saveEnhancedStreetwork(enhancedStreetwork, processingId);
      if (!saveResult.success) {
        throw new Error(`Database save failed: ${saveResult.error}`);
      }

      // Save detailed route impacts
      if (routeAnalysis.route_impacts && routeAnalysis.route_impacts.length > 0) {
        await this.saveRouteImpacts(saveResult.streetwork_id, routeAnalysis.route_impacts, processingId);
      }

      // Handle supervisor notifications if required
      if (severityResult.requires_notification || routeAnalysis.affected_route_count > 3) {
        await this.handleSupervisorNotification(enhancedStreetwork, processingId);
      }

      // Update processing statistics
      this.updateProcessingStats(startTime, true);

      const result = this.createProcessingResult(
        processingId, 
        'success', 
        `Processed with ${routeAnalysis.affected_route_count} affected routes`, 
        startTime,
        {
          streetwork_id: saveResult.streetwork_id,
          severity: severityResult.severity,
          affected_routes: routeAnalysis.affected_route_count,
          requires_notification: severityResult.requires_notification
        }
      );

      console.log(`✅ [${processingId}] Processing complete: ${result.processing_time_ms}ms`);
      return result;

    } catch (error) {
      console.error(`❌ [${processingId}] Processing failed:`, error.message);
      this.updateProcessingStats(startTime, false);
      
      return this.createProcessingResult(
        processingId, 
        'error', 
        error.message, 
        startTime,
        { error_stack: error.stack }
      );
    }
  }

  /**
   * Validate incoming notification data
   */
  validateNotificationData(data) {
    if (!data) {
      return { valid: false, reason: 'No notification data provided' };
    }

    if (!data.object_type) {
      return { valid: false, reason: 'Missing object_type field' };
    }

    if (!data.event_type) {
      return { valid: false, reason: 'Missing event_type field' };
    }

    if (!data.object_reference) {
      return { valid: false, reason: 'Missing object_reference field' };
    }

    // Only process ACTIVITY and PERMIT objects
    if (!['ACTIVITY', 'PERMIT'].includes(data.object_type)) {
      return { valid: false, reason: `Unsupported object_type: ${data.object_type}` };
    }

    return { valid: true };
  }

  /**
   * Determine if notification should be processed based on geographic and other filters
   */
  async shouldProcessNotification(data) {
    // Geographic filtering - only process North East England works
    if (data.area_name && !this.isNorthEastArea(data.area_name)) {
      return { process: false, reason: `Outside North East England: ${data.area_name}` };
    }

    // Event type filtering - focus on relevant events
    const relevantEvents = [
      'created', 'updated', 'work_started', 'work_completed', 
      'permit_granted', 'permit_modified', 'traffic_management_updated'
    ];
    
    if (!relevantEvents.includes(data.event_type)) {
      return { process: false, reason: `Non-relevant event type: ${data.event_type}` };
    }

    // Status filtering - don't process cancelled or expired permits
    if (data.work_status === 'cancelled' || data.permit_status === 'refused') {
      return { process: false, reason: `Work cancelled or permit refused` };
    }

    return { process: true };
  }

  /**
   * Check if area is within North East England
   */
  isNorthEastArea(areaName) {
    const northEastAreas = [
      'newcastle', 'gateshead', 'sunderland', 'durham', 'northumberland',
      'south tyneside', 'north tyneside', 'county durham', 'newcastle upon tyne',
      'washington', 'blaydon', 'consett', 'stanley', 'chester-le-street',
      'seaham', 'peterlee', 'newton aycliffe', 'bishop auckland', 'darlington'
    ];
    
    const lowerArea = areaName.toLowerCase();
    return northEastAreas.some(area => lowerArea.includes(area));
  }

  /**
   * Extract standardized streetwork data from various notification formats
   */
  extractStreetworkData(notificationData) {
    // StreetManager notifications can have different structures
    // This function normalizes them into a standard format
    
    const baseData = {
      permit_reference_number: notificationData.permit_reference_number || notificationData.object_reference,
      activity_reference_number: notificationData.activity_reference_number,
      event_type: notificationData.event_type,
      object_type: notificationData.object_type,
      
      // Work details
      work_category: notificationData.work_category_ref || notificationData.work_category,
      work_status: notificationData.work_status_ref || notificationData.activity_status,
      traffic_management_type: notificationData.traffic_management_type_ref || notificationData.traffic_management_type,
      
      // Location information
      area_name: notificationData.area_name,
      town: notificationData.town,
      street_name: notificationData.street_name,
      location_description: notificationData.location_description || notificationData.location_text,
      
      // Geographic data
      geometry: notificationData.geometry || notificationData.work_coordinates,
      latitude: notificationData.latitude,
      longitude: notificationData.longitude,
      
      // Timing
      proposed_start_date: notificationData.proposed_start_date || notificationData.actual_start_date_time,
      proposed_end_date: notificationData.proposed_end_date || notificationData.actual_end_date_time,
      actual_start_date: notificationData.actual_start_date_time,
      actual_end_date: notificationData.actual_end_date_time,
      
      // Flags
      is_emergency_works: notificationData.is_emergency_works,
      is_traffic_sensitive: notificationData.is_traffic_sensitive,
      
      // Description
      description: notificationData.description || notificationData.works_description,
      title: this.generateTitle(notificationData)
    };

    return baseData;
  }

  /**
   * Generate a human-readable title for the streetwork
   */
  generateTitle(data) {
    const workType = data.work_category_ref || data.work_category || 'Works';
    const location = data.street_name || data.location_description || 'Unknown location';
    const area = data.town || data.area_name || '';
    
    let title = `${workType} on ${location}`;
    if (area) {
      title += `, ${area}`;
    }
    
    return title;
  }

  /**
   * Perform severity classification using the enhanced classifier
   */
  async performSeverityClassification(streetworkData) {
    try {
      // Ensure classifier is initialized
      if (!severityClassifier.initialized) {
        await severityClassifier.initialize();
      }

      return severityClassifier.classifySeverity(streetworkData);
    } catch (error) {
      console.error('❌ Severity classification failed:', error.message);
      
      // Fallback classification
      return {
        severity: 'MEDIUM',
        impact_radius_meters: 200,
        requires_notification: false,
        advance_notice_hours: 4,
        confidence: 30,
        analysis_method: 'fallback',
        error: error.message
      };
    }
  }

  /**
   * Perform route impact analysis using the enhanced analyzer
   */
  async performRouteImpactAnalysis(streetworkData) {
    try {
      // Ensure analyzer is initialized
      if (!routeImpactAnalyzer.initialized) {
        await routeImpactAnalyzer.initialize();
      }

      return await routeImpactAnalyzer.analyzeRouteImpacts(streetworkData);
    } catch (error) {
      console.error('❌ Route impact analysis failed:', error.message);
      
      // Fallback analysis
      return {
        streetwork_id: streetworkData.permit_reference_number || streetworkData.activity_reference_number,
        coordinates: null,
        impact_severity: 'LOW',
        affected_routes: [],
        affected_route_count: 0,
        route_impacts: [],
        route_matching_confidence: 0,
        analysis_time_ms: 0,
        error: error.message
      };
    }
  }

  /**
   * Combine all analysis results into enhanced streetwork record
   */
  combineAnalysisResults(streetworkData, severityResult, routeAnalysis) {
    const id = streetworkData.permit_reference_number || streetworkData.activity_reference_number || `sm_${Date.now()}`;
    
    return {
      id: id,
      permit_reference_number: streetworkData.permit_reference_number,
      activity_reference_number: streetworkData.activity_reference_number,
      
      // Basic details
      title: streetworkData.title,
      description: streetworkData.description,
      location_description: streetworkData.location_description,
      
      // Geographic data
      latitude: routeAnalysis.coordinates?.lat,
      longitude: routeAnalysis.coordinates?.lon,
      geometry: streetworkData.geometry,
      
      // Location hierarchy
      area_name: streetworkData.area_name,
      town: streetworkData.town,
      street_name: streetworkData.street_name,
      
      // Work classification
      work_category: streetworkData.work_category,
      work_status: streetworkData.work_status,
      traffic_management_type: streetworkData.traffic_management_type,
      
      // Timing
      proposed_start_date: streetworkData.proposed_start_date,
      proposed_end_date: streetworkData.proposed_end_date,
      actual_start_date: streetworkData.actual_start_date,
      actual_end_date: streetworkData.actual_end_date,
      
      // Enhanced analysis results
      route_impact_analysis: {
        severity_analysis: severityResult,
        route_analysis: routeAnalysis,
        combined_at: new Date().toISOString()
      },
      affected_route_numbers: routeAnalysis.affected_routes,
      affected_route_count: routeAnalysis.affected_route_count,
      
      // Impact classification
      impact_severity: severityResult.severity,
      impact_radius_meters: severityResult.impact_radius_meters,
      
      // Route confidence
      route_matching_confidence: routeAnalysis.route_matching_confidence,
      geographical_accuracy: routeAnalysis.geographical_accuracy,
      
      // Notification management
      requires_supervisor_notification: severityResult.requires_notification,
      notification_sent: false,
      escalation_level: this.calculateEscalationLevel(severityResult, routeAnalysis),
      
      // Processing metadata
      source: 'streetmanager_webhook',
      notification_id: `${streetworkData.event_type}_${streetworkData.object_reference}_${Date.now()}`,
      event_type: streetworkData.event_type,
      last_route_analysis: new Date().toISOString()
    };
  }

  /**
   * Calculate escalation level based on analysis results
   */
  calculateEscalationLevel(severityResult, routeAnalysis) {
    if (severityResult.severity === 'CRITICAL' || routeAnalysis.affected_route_count > 10) {
      return 3; // Critical escalation
    }
    
    if (severityResult.severity === 'HIGH' || routeAnalysis.affected_route_count > 5) {
      return 2; // Urgent escalation
    }
    
    if (severityResult.requires_notification || routeAnalysis.affected_route_count > 2) {
      return 1; // Standard escalation
    }
    
    return 0; // No escalation
  }

  /**
   * Save enhanced streetwork to database
   */
  async saveEnhancedStreetwork(streetworkData, processingId) {
    try {
      const { data, error } = await supabase
        .from('streetworks_enhanced')
        .upsert(streetworkData, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      console.log(`✅ [${processingId}] Streetwork saved: ${streetworkData.id}`);
      return { success: true, streetwork_id: data.id };

    } catch (error) {
      console.error(`❌ [${processingId}] Failed to save streetwork:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save detailed route impacts
   */
  async saveRouteImpacts(streetworkId, routeImpacts, processingId) {
    try {
      const impactRecords = routeImpacts.map(impact => ({
        streetwork_id: streetworkId,
        ...impact
      }));

      const { error } = await supabase
        .from('route_impacts')
        .upsert(impactRecords, {
          onConflict: 'streetwork_id,route_number',
          ignoreDuplicates: false
        });

      if (error) {
        throw error;
      }

      console.log(`✅ [${processingId}] Saved ${routeImpacts.length} route impact records`);

    } catch (error) {
      console.error(`❌ [${processingId}] Failed to save route impacts:`, error.message);
    }
  }

  /**
   * Handle supervisor notification for critical impacts
   */
  async handleSupervisorNotification(streetworkData, processingId) {
    try {
      const notificationData = {
        streetwork_id: streetworkData.id,
        notification_type: this.determineNotificationType(streetworkData),
        priority_level: streetworkData.impact_severity,
        title: `Route Impact Alert: ${streetworkData.title}`,
        message: this.generateNotificationMessage(streetworkData),
        affected_routes: streetworkData.affected_route_numbers,
        scheduled_for: this.calculateNotificationTime(streetworkData),
        advance_notice_hours: streetworkData.route_impact_analysis?.severity_analysis?.advance_notice_hours || 4
      };

      const { error } = await supabase
        .from('supervisor_notifications')
        .insert(notificationData);

      if (error) {
        throw error;
      }

      console.log(`📢 [${processingId}] Supervisor notification scheduled for ${streetworkData.affected_route_count} affected routes`);

    } catch (error) {
      console.error(`❌ [${processingId}] Failed to create supervisor notification:`, error.message);
    }
  }

  /**
   * Determine notification type based on streetwork characteristics
   */
  determineNotificationType(streetworkData) {
    if (streetworkData.traffic_management_type === 'road_closure') {
      return 'ROUTE_CLOSURE';
    }
    
    if (streetworkData.impact_severity === 'CRITICAL') {
      return 'CRITICAL_IMPACT';
    }
    
    if (streetworkData.escalation_level >= 2) {
      return 'DIVERSION_REQUIRED';
    }
    
    if (streetworkData.proposed_start_date && new Date(streetworkData.proposed_start_date) > new Date()) {
      return 'ADVANCE_WARNING';
    }
    
    return 'TIMING_CHANGE';
  }

  /**
   * Generate human-readable notification message
   */
  generateNotificationMessage(streetworkData) {
    const routes = streetworkData.affected_route_numbers.slice(0, 5).join(', ');
    const moreRoutes = streetworkData.affected_route_count > 5 ? ` and ${streetworkData.affected_route_count - 5} more` : '';
    
    let message = `${streetworkData.title}\n\n`;
    message += `Severity: ${streetworkData.impact_severity}\n`;
    message += `Affected Routes: ${routes}${moreRoutes}\n`;
    message += `Location: ${streetworkData.location_description}\n`;
    
    if (streetworkData.proposed_start_date) {
      message += `Proposed Start: ${new Date(streetworkData.proposed_start_date).toLocaleDateString()}\n`;
    }
    
    if (streetworkData.traffic_management_type) {
      message += `Traffic Management: ${streetworkData.traffic_management_type.replace(/_/g, ' ')}\n`;
    }
    
    return message;
  }

  /**
   * Calculate when notification should be sent
   */
  calculateNotificationTime(streetworkData) {
    const advanceHours = streetworkData.route_impact_analysis?.severity_analysis?.advance_notice_hours || 4;
    
    if (streetworkData.proposed_start_date) {
      const startDate = new Date(streetworkData.proposed_start_date);
      return new Date(startDate.getTime() - (advanceHours * 60 * 60 * 1000));
    }
    
    // For immediate works, send notification now
    return new Date();
  }

  /**
   * Create standardized processing result
   */
  createProcessingResult(processingId, status, message, startTime, metadata = {}) {
    return {
      processing_id: processingId,
      status: status,
      message: message,
      processing_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      ...metadata
    };
  }

  /**
   * Update processing statistics
   */
  updateProcessingStats(startTime, success) {
    this.processingStats.total_processed++;
    
    if (success) {
      this.processingStats.successful_analyses++;
    } else {
      this.processingStats.failed_analyses++;
    }
    
    const processingTime = Date.now() - startTime;
    this.processingStats.average_processing_time = 
      (this.processingStats.average_processing_time * (this.processingStats.total_processed - 1) + processingTime) / 
      this.processingStats.total_processed;
  }

  /**
   * Get processor status and statistics
   */
  getStatus() {
    return {
      queue_size: this.processingQueue.length,
      max_queue_size: this.maxQueueSize,
      is_processing: this.isProcessing,
      statistics: this.processingStats,
      analyzer_status: routeImpactAnalyzer.getStatus(),
      classifier_status: severityClassifier.getStatus()
    };
  }

  /**
   * Clear processing queues and caches for memory management
   */
  clearCaches() {
    this.processingQueue = [];
    routeImpactAnalyzer.clearCache();
    severityClassifier.clearCache();
    console.log('🧹 Enhanced StreetManager Processor caches cleared');
  }
}

// Export singleton instance
const enhancedProcessor = new EnhancedStreetManagerProcessor();

export default enhancedProcessor;
export { EnhancedStreetManagerProcessor };