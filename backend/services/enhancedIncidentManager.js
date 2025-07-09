// services/enhancedIncidentManager.js
// Enhanced Incident Manager with Traffic Intelligence Integration
import supabaseStorage from './supabaseIncidentStorage.js';
import { enhanceIncidentWithTomTom } from './tomtomEnhancementService.js';
import { geocodeLocation } from './geocoding.js';
import { findAffectedRoutesEnhanced } from '../utils/gtfsRouteMatching.js';

// Counter for incident IDs
let incidentCounter = Date.now();

export class EnhancedIncidentManager {
  constructor() {
    this.controlRoomDisplays = new Map(); // Track control room displays
    this.bulkOperations = new Map(); // Track bulk operations
  }

  /**
   * Create incident with enhanced features
   */
  async createIncident(incidentData) {
    try {
      // Generate unique ID
      const incidentId = `incident_${incidentCounter++}`;
      
      // Enhance location with coordinates if not provided
      let enhancedCoordinates = incidentData.coordinates;
      if (!enhancedCoordinates && incidentData.location) {
        try {
          const locationData = await geocodeLocation(incidentData.location);
          if (locationData) {
            enhancedCoordinates = [locationData.latitude, locationData.longitude];
          }
        } catch (error) {
          console.warn('Failed to enhance location:', error.message);
        }
      }

      // Find affected routes using enhanced GTFS matching
      let affectedRoutes = incidentData.affectedRoutes || [];
      if (enhancedCoordinates && affectedRoutes.length === 0) {
        try {
          affectedRoutes = await findAffectedRoutesEnhanced(
            enhancedCoordinates[0],
            enhancedCoordinates[1],
            incidentData.location || 'Incident location',
            300 // 300m radius
          );
        } catch (error) {
          console.warn('Failed to find affected routes:', error.message);
        }
      }

      // Create enhanced incident object
      const incident = {
        id: incidentId,
        title: incidentData.title || this.generateTitle(incidentData),
        type: incidentData.type || 'Traffic Alert',
        subtype: incidentData.subtype || null,
        location: incidentData.location,
        coordinates: enhancedCoordinates,
        description: incidentData.description || '',
        priority: incidentData.priority || 'Medium',
        severity: incidentData.severity || 'Medium',
        status: incidentData.status || 'Active',
        
        // Route information
        affectsRoutes: affectedRoutes.slice(0, 15), // Limit to 15 routes
        
        // Timestamps
        startTime: incidentData.startTime || new Date().toISOString(),
        endTime: incidentData.endTime || null,
        detectedAt: incidentData.detectedAt || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        
        // Creator information
        createdBy: incidentData.createdBy || 'System',
        createdByRole: incidentData.createdByRole || 'Automated',
        
        // Source tracking
        source: incidentData.source || 'manual',
        sourceAlert: incidentData.sourceAlert || null,
        
        // Auto-creation metadata
        autoCreated: incidentData.autoCreated || false,
        autoCreationScore: incidentData.autoCreationScore || null,
        autoCreationReason: incidentData.autoCreationReason || null,
        
        // Enhanced data
        trafficData: incidentData.trafficData || null,
        intelligenceScore: incidentData.intelligenceScore || null,
        
        // Control room display
        pushedToDisplay: false,
        displayPushedAt: null,
        displayPushedBy: null,
        
        // Notes and updates
        notes: incidentData.notes || '',
        updates: [],
        
        // Metadata
        metadata: {
          enhancedRouteMatching: true,
          geocoded: !!enhancedCoordinates,
          routeCount: affectedRoutes.length,
          created: new Date().toISOString()
        }
      };

      // Save to Supabase storage
      const savedIncident = await supabaseStorage.addIncident(incident);

      // Try to enhance with TomTom features (non-blocking)
      try {
        const enhanced = await enhanceIncidentWithTomTom(savedIncident);
        if (enhanced.enhancedWithTomTom) {
          await supabaseStorage.updateIncident(savedIncident.id, enhanced);
          console.log(`✨ Enhanced incident ${savedIncident.id} with TomTom data`);
          return enhanced;
        }
      } catch (enhanceError) {
        console.warn('TomTom enhancement failed:', enhanceError.message);
      }

      console.log(`✅ Created enhanced incident: ${savedIncident.id} at ${incident.location}`);
      return savedIncident;

    } catch (error) {
      console.error('❌ Failed to create incident:', error.message);
      throw error;
    }
  }

  /**
   * Create incident from traffic alert (enhanced ADD TO DB)
   */
  async createIncidentFromAlert(alert, supervisorData) {
    try {
      const incidentData = {
        title: alert.title || `Traffic Alert - ${alert.location}`,
        type: this.mapAlertTypeToIncidentType(alert.type),
        location: alert.location,
        coordinates: alert.coordinates,
        description: this.generateDescriptionFromAlert(alert),
        priority: this.mapSeverityToPriority(alert.severity),
        severity: alert.severity,
        status: 'Active',
        
        // Route information from alert
        affectedRoutes: alert.affectsRoutes || [],
        
        // Source tracking
        source: 'traffic_alert',
        sourceAlert: {
          id: alert.id,
          source: alert.source,
          intelligenceScore: alert.intelligenceScore || null,
          congestionLevel: alert.congestionLevel || null
        },
        
        // Traffic data
        trafficData: {
          congestionLevel: alert.congestionLevel,
          currentSpeed: alert.currentSpeed,
          freeFlowSpeed: alert.freeFlowSpeed,
          delayMinutes: alert.delayMinutes,
          classification: alert.classification,
          roadPriority: alert.roadPriority
        },
        
        // Intelligence data
        intelligenceScore: alert.intelligenceScore,
        
        // Creator information
        createdBy: supervisorData?.name || 'Supervisor',
        createdByRole: supervisorData?.role || 'Supervisor',
        
        // Detection time
        detectedAt: alert.lastUpdated || alert.startDate,
        
        // Notes
        notes: `Created from traffic alert (${alert.source}). Intelligence Score: ${alert.intelligenceScore || 'N/A'}/100`
      };

      return await this.createIncident(incidentData);

    } catch (error) {
      console.error('❌ Failed to create incident from alert:', error.message);
      throw error;
    }
  }

  /**
   * Bulk create incidents from multiple alerts
   */
  async bulkCreateIncidents(alerts, supervisorData, options = {}) {
    const operationId = `bulk_${Date.now()}`;
    console.log(`🔄 Starting bulk incident creation: ${operationId} (${alerts.length} alerts)`);

    const operation = {
      id: operationId,
      startTime: new Date().toISOString(),
      totalAlerts: alerts.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      incidents: [],
      errors: [],
      status: 'running'
    };

    this.bulkOperations.set(operationId, operation);

    try {
      // Process alerts in batches to avoid overwhelming the system
      const batchSize = options.batchSize || 5;
      const results = [];

      for (let i = 0; i < alerts.length; i += batchSize) {
        const batch = alerts.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (alert) => {
          try {
            // Apply filters if specified
            if (options.minIntelligenceScore && alert.intelligenceScore < options.minIntelligenceScore) {
              return { alert, status: 'skipped', reason: 'Intelligence score too low' };
            }
            
            if (options.requiredPriority && alert.severity !== options.requiredPriority) {
              return { alert, status: 'skipped', reason: 'Priority mismatch' };
            }

            const incident = await this.createIncidentFromAlert(alert, supervisorData);
            operation.succeeded++;
            return { alert, incident, status: 'success' };

          } catch (error) {
            operation.failed++;
            operation.errors.push({
              alertId: alert.id,
              error: error.message,
              timestamp: new Date().toISOString()
            });
            return { alert, status: 'error', error: error.message };
          } finally {
            operation.processed++;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Update operation status
        operation.incidents = results.filter(r => r.status === 'success').map(r => r.incident);
        
        // Small delay between batches
        if (i + batchSize < alerts.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      operation.status = 'completed';
      operation.endTime = new Date().toISOString();
      operation.duration = Date.now() - new Date(operation.startTime).getTime();

      console.log(`✅ Bulk operation ${operationId} completed: ${operation.succeeded} success, ${operation.failed} failed`);
      
      return {
        success: true,
        operationId: operationId,
        summary: {
          total: operation.totalAlerts,
          succeeded: operation.succeeded,
          failed: operation.failed,
          duration: operation.duration
        },
        incidents: operation.incidents,
        errors: operation.errors
      };

    } catch (error) {
      operation.status = 'failed';
      operation.endTime = new Date().toISOString();
      operation.error = error.message;
      
      console.error(`❌ Bulk operation ${operationId} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Push incident to control room display
   */
  async pushToControlRoomDisplay(incidentId, supervisorData, displayOptions = {}) {
    try {
      // Get incident
      const incident = await supabaseStorage.getIncident(incidentId);
      if (!incident) {
        throw new Error('Incident not found');
      }

      // Create display message
      const displayMessage = {
        id: `display_${Date.now()}`,
        type: 'incident',
        priority: incident.priority,
        title: incident.title,
        message: this.generateDisplayMessage(incident),
        location: incident.location,
        affectedRoutes: incident.affectsRoutes,
        
        // Display options
        duration: displayOptions.duration || 300, // 5 minutes default
        urgency: displayOptions.urgency || 'normal',
        color: this.getDisplayColor(incident.priority),
        
        // Source information
        incidentId: incidentId,
        pushedBy: supervisorData?.name || 'Supervisor',
        pushedAt: new Date().toISOString(),
        
        // Control room specific
        displayUntil: new Date(Date.now() + (displayOptions.duration || 300) * 1000).toISOString(),
        acknowledged: false,
        
        // Metadata
        metadata: {
          originalIncident: incident,
          displayOptions: displayOptions
        }
      };

      // Store display message (you would integrate with your display system here)
      this.controlRoomDisplays.set(displayMessage.id, displayMessage);

      // Update incident to mark as pushed to display
      await supabaseStorage.updateIncident(incidentId, {
        pushedToDisplay: true,
        displayPushedAt: new Date().toISOString(),
        displayPushedBy: supervisorData?.name || 'Supervisor',
        displayMessageId: displayMessage.id
      });

      console.log(`📺 Pushed incident ${incidentId} to control room display`);
      
      return {
        success: true,
        displayMessage: displayMessage,
        message: 'Incident pushed to control room display successfully'
      };

    } catch (error) {
      console.error('❌ Failed to push to control room display:', error.message);
      throw error;
    }
  }

  /**
   * Get control room display messages
   */
  getControlRoomDisplayMessages() {
    const now = new Date();
    const activeMessages = Array.from(this.controlRoomDisplays.values())
      .filter(msg => new Date(msg.displayUntil) > now)
      .sort((a, b) => {
        // Sort by priority then by time
        const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        const aPriority = priorityOrder[a.priority] || 0;
        const bPriority = priorityOrder[b.priority] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return new Date(b.pushedAt) - new Date(a.pushedAt);
      });

    return activeMessages;
  }

  /**
   * Get bulk operation status
   */
  getBulkOperationStatus(operationId) {
    return this.bulkOperations.get(operationId) || null;
  }

  /**
   * Helper methods
   */
  generateTitle(incidentData) {
    if (incidentData.type === 'Traffic Congestion') {
      return `🚦 Traffic Congestion - ${incidentData.location}`;
    } else if (incidentData.type === 'Traffic Incident') {
      return `🚨 Traffic Incident - ${incidentData.location}`;
    } else if (incidentData.type === 'Planned Roadworks') {
      return `🚧 Roadworks - ${incidentData.location}`;
    }
    return `⚠️ ${incidentData.type} - ${incidentData.location}`;
  }

  generateDescriptionFromAlert(alert) {
    const parts = [];
    
    if (alert.description) {
      parts.push(alert.description);
    }
    
    if (alert.congestionLevel) {
      parts.push(`Congestion Level: ${alert.congestionLevel}% speed reduction`);
    }
    
    if (alert.currentSpeed && alert.freeFlowSpeed) {
      parts.push(`Current Speed: ${alert.currentSpeed} km/h (Normal: ${alert.freeFlowSpeed} km/h)`);
    }
    
    if (alert.delayMinutes) {
      parts.push(`Estimated Delay: ${alert.delayMinutes} min/km`);
    }
    
    if (alert.classification) {
      parts.push(`Classification: ${alert.classification}`);
    }
    
    parts.push(`Source: ${alert.source}`);
    parts.push(`Intelligence Score: ${alert.intelligenceScore || 'N/A'}/100`);
    
    return parts.join('\n');
  }

  generateDisplayMessage(incident) {
    const parts = [];
    
    if (incident.priority === 'Critical') {
      parts.push('🚨 CRITICAL INCIDENT');
    } else if (incident.priority === 'High') {
      parts.push('⚠️ HIGH PRIORITY');
    }
    
    parts.push(incident.title);
    
    if (incident.affectsRoutes && incident.affectsRoutes.length > 0) {
      parts.push(`Routes: ${incident.affectsRoutes.slice(0, 6).join(', ')}`);
    }
    
    if (incident.trafficData?.congestionLevel) {
      parts.push(`Congestion: ${incident.trafficData.congestionLevel}%`);
    }
    
    return parts.join(' • ');
  }

  mapAlertTypeToIncidentType(alertType) {
    const mapping = {
      'congestion': 'Traffic Congestion',
      'incident': 'Traffic Incident',
      'roadwork': 'Planned Roadworks',
      'weather': 'Weather Related'
    };
    return mapping[alertType] || 'Traffic Alert';
  }

  mapSeverityToPriority(severity) {
    const mapping = {
      'High': 'Critical',
      'Medium': 'High',
      'Low': 'Medium'
    };
    return mapping[severity] || 'Medium';
  }

  getDisplayColor(priority) {
    const colors = {
      'Critical': '#DC2626',
      'High': '#F59E0B',
      'Medium': '#10B981',
      'Low': '#6B7280'
    };
    return colors[priority] || '#6B7280';
  }
}

// Export both the class and a function for backward compatibility
export const enhancedIncidentManager = new EnhancedIncidentManager();

export const createIncident = (incidentData) => {
  return enhancedIncidentManager.createIncident(incidentData);
};

export const createIncidentFromAlert = (alert, supervisorData) => {
  return enhancedIncidentManager.createIncidentFromAlert(alert, supervisorData);
};

export const bulkCreateIncidents = (alerts, supervisorData, options) => {
  return enhancedIncidentManager.bulkCreateIncidents(alerts, supervisorData, options);
};

export const pushToControlRoomDisplay = (incidentId, supervisorData, displayOptions) => {
  return enhancedIncidentManager.pushToControlRoomDisplay(incidentId, supervisorData, displayOptions);
};

export default enhancedIncidentManager;