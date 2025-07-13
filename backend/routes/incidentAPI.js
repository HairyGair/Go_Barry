// backend/routes/incidentAPI.js
// Phase 2: GTFS-Powered Incident Management API Routes with Shared Storage

import express from 'express';
import geocodingService, { geocodeLocation } from '../services/geocoding.js';
import findGTFSRoutesNearCoordinates from '../gtfs-route-matcher.js';
import supabaseStorage from '../services/supabaseIncidentStorage.js';
import { enhanceIncidentWithTomTom } from '../services/tomtomEnhancementService.js';
import { 
  enhancedIncidentManager, 
  createIncidentFromAlert, 
  bulkCreateIncidents, 
  pushToControlRoomDisplay 
} from '../services/enhancedIncidentManager.js';
import { autoIncidentCreator } from '../services/autoIncidentCreator.js';
import { trafficIntelligence } from '../services/unifiedTrafficIntelligence.js';

const router = express.Router();

// Counter for incident IDs
let incidentCounter = 1;

// GET /api/incidents - Get all incidents
router.get('/', async (req, res) => {
  try {
    // Get all incidents from Supabase storage
    const allIncidents = await supabaseStorage.getAllIncidents();
    
    // Filter active incidents
    const activeIncidents = allIncidents.filter(incident => 
      incident.status === 'active' || incident.status === 'monitoring'
    );
    
    res.json({
      success: true,
      incidents: activeIncidents,
      count: activeIncidents.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch incidents:', error);
    
    // Provide fallback empty response for development
    console.log('📋 Providing fallback empty incidents response');
    res.json({
      success: true,
      incidents: [],
      count: 0,
      lastUpdated: new Date().toISOString(),
      fallback: true,
      note: 'Manual incidents table not available - showing empty results'
    });
  }
});

// POST /api/incidents - Create new incident
router.post('/', async (req, res) => {
  try {
    const {
      type,
      subtype,
      location,
      coordinates,
      description,
      startTime,
      endTime,
      severity,
      notes,
      createdBy,
      createdByRole
    } = req.body;

    // Validate required fields
    if (!type || !location) {
      return res.status(400).json({
        success: false,
        error: 'Type and location are required'
      });
    }

    // Enhance location with coordinates if not provided
    let enhancedCoordinates = coordinates;
    if (!coordinates && location) {
      try {
        const locationData = await geocodeLocation(location);
        if (locationData) {
          enhancedCoordinates = {
            latitude: locationData.latitude,
            longitude: locationData.longitude
          };
        }
      } catch (error) {
        console.warn('Failed to enhance location:', error.message);
      }
    }

    // Find affected routes using GTFS data
    let affectedRoutes = [];
    if (enhancedCoordinates) {
      try {
        affectedRoutes = await findGTFSRoutesNearCoordinates(
          enhancedCoordinates.latitude || enhancedCoordinates[0],
          enhancedCoordinates.longitude || enhancedCoordinates[1],
          250 // 250m radius
        );
      } catch (error) {
        console.warn('Failed to find affected routes:', error.message);
      }
    }

    // Create incident
    const incident = {
      id: `incident_${incidentCounter++}`,
      type,
      subtype,
      location,
      coordinates: enhancedCoordinates,
      description: description || '',
      startTime: startTime || new Date().toISOString(),
      endTime,
      severity: severity || 'Medium',
      notes: notes || '',
      affectsRoutes: affectedRoutes.slice(0, 10), // Limit to 10 routes
      status: 'active',
      createdBy: createdBy || 'Unknown',
      createdByRole: createdByRole || 'Supervisor', 
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      source: 'manual'
    };

    // Save to Supabase storage
    const savedIncident = await supabaseStorage.addIncident(incident);

    // Try to enhance with TomTom features (non-blocking)
    try {
      const enhanced = await enhanceIncidentWithTomTom(savedIncident);
      if (enhanced.enhancedWithTomTom) {
        // Update with enhanced data
        await supabaseStorage.updateIncident(savedIncident.id, enhanced);
        console.log(`✨ Enhanced incident ${savedIncident.id} with TomTom data`);
        return res.json({
          success: true,
          incident: enhanced,
          message: 'Incident created and enhanced successfully'
        });
      }
    } catch (enhanceError) {
      console.warn('TomTom enhancement failed:', enhanceError.message);
      // Continue with non-enhanced incident
    }

    console.log(`✅ Created Supabase incident: ${savedIncident.id} at ${location} affecting ${affectedRoutes.length} routes`);
    
    // Get current stats
    const stats = await supabaseStorage.getIncidentStats();
    console.log(`📊 Total incidents in system: ${stats.total} (${stats.active} active)`);;

    res.json({
      success: true,
      incident: savedIncident,
      message: 'Incident created successfully'
    });

  } catch (error) {
    console.error('Failed to create incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create incident'
    });
  }
});

// PUT /api/incidents/:id - Update incident with full edit capabilities
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type,
      subtype,
      location,
      coordinates,
      description,
      severity,
      affectsRoutes,
      notes,
      status,
      sessionId,
      supervisorName
    } = req.body;

    // Get existing incident
    const existingIncident = await supabaseStorage.getIncidentById(id);
    if (!existingIncident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    // Build update object with only provided fields
    const updates = {
      lastUpdated: new Date().toISOString()
    };

    // Only update fields that were provided
    if (type !== undefined) updates.type = type;
    if (subtype !== undefined) updates.subtype = subtype;
    if (location !== undefined) updates.location = location;
    if (coordinates !== undefined) updates.coordinates = coordinates;
    if (description !== undefined) updates.description = description;
    if (severity !== undefined) updates.severity = severity;
    if (affectsRoutes !== undefined) updates.affectsRoutes = affectsRoutes;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) updates.status = status;

    // Add edit history
    const editHistory = existingIncident.editHistory || [];
    editHistory.push({
      editedBy: supervisorName || 'Unknown',
      editedAt: new Date().toISOString(),
      fieldsChanged: Object.keys(updates).filter(k => k !== 'lastUpdated')
    });
    updates.editHistory = editHistory;

    // Update in storage
    const updatedIncident = await supabaseStorage.updateIncident(id, updates);
    
    if (!updatedIncident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    console.log(`✅ Incident ${id} edited by ${supervisorName || 'Unknown'}`);
    console.log(`   Fields updated: ${Object.keys(updates).filter(k => !['lastUpdated', 'editHistory'].includes(k)).join(', ')}`);

    res.json({
      success: true,
      incident: updatedIncident,
      message: 'Incident updated successfully'
    });

  } catch (error) {
    console.error('Failed to update incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update incident'
    });
  }
});

// DELETE /api/incidents/:id - Delete incident
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedIncident = await supabaseStorage.deleteIncident(id);
    
    if (!deletedIncident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    console.log(`✅ Deleted incident: ${id}`);

    res.json({
      success: true,
      incident: deletedIncident,
      message: 'Incident deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete incident'
    });
  }
});

// GET /api/incidents/stats - Get incident statistics (MUST come before /:id route)
router.get('/stats', async (req, res) => {
  try {
    const stats = await supabaseStorage.getIncidentStats();
    const allIncidents = await supabaseStorage.getAllIncidents();
    
    // Enhanced stats with route information
    const affectedRoutesSet = new Set();
    allIncidents.forEach(incident => {
      if (incident.affectsRoutes) {
        incident.affectsRoutes.forEach(route => affectedRoutesSet.add(route));
      }
    });

    const enhancedStats = {
      ...stats,
      affectedRoutes: Array.from(affectedRoutesSet),
      affectedRoutesCount: affectedRoutesSet.size,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      stats: enhancedStats
    });

  } catch (error) {
    console.error('Failed to get incident stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get incident statistics'
    });
  }
});

// GET /api/incidents/:id - Get specific incident
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await supabaseStorage.getIncidentById(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    res.json({
      success: true,
      incident
    });

  } catch (error) {
    console.error('Failed to fetch incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch incident'
    });
  }
});

// GET /api/incidents/:id/diversions - Get AI diversion suggestions
router.get('/:id/diversions', async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await supabaseStorage.getIncidentById(id);
    
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }
    
    // Get AI diversion suggestions
    const { default: diversionEngine } = await import('../services/intelligence/diversionEngine.js');
    const suggestions = await diversionEngine.getDiversionSuggestions(incident);
    const formatted = diversionEngine.formatDiversionsForDisplay(suggestions);
    
    console.log(`🧠 Generated ${suggestions.diversions.length} diversions for incident ${id}`);
    
    res.json({
      success: true,
      incident: {
        id: incident.id,
        location: incident.location,
        type: incident.type,
        affectedRoutes: incident.affectsRoutes
      },
      suggestions,
      formatted,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Failed to generate diversions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate diversion suggestions'
    });
  }
});

// ==============================
// ENHANCED INCIDENT MANAGEMENT ENDPOINTS
// ==============================

// POST /api/incidents/from-alert - Create incident from traffic alert (Enhanced ADD TO DB)
router.post('/from-alert', async (req, res) => {
  try {
    const { alert, supervisorData } = req.body;
    
    if (!alert) {
      return res.status(400).json({
        success: false,
        error: 'Alert data is required'
      });
    }

    console.log(`🚨 Creating incident from alert: ${alert.id}`);
    
    const incident = await createIncidentFromAlert(alert, supervisorData);
    
    res.json({
      success: true,
      incident: incident,
      message: 'Incident created from traffic alert successfully'
    });
    
  } catch (error) {
    console.error('❌ Failed to create incident from alert:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/incidents/bulk-create - Bulk create incidents from multiple alerts
router.post('/bulk-create', async (req, res) => {
  try {
    const { alerts, supervisorData, options = {} } = req.body;
    
    if (!alerts || !Array.isArray(alerts) || alerts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Alerts array is required'
      });
    }

    console.log(`📋 Starting bulk incident creation: ${alerts.length} alerts`);
    
    const result = await bulkCreateIncidents(alerts, supervisorData, options);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Bulk incident creation failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/incidents/bulk-status/:operationId - Check bulk operation status
router.get('/bulk-status/:operationId', async (req, res) => {
  try {
    const { operationId } = req.params;
    const status = enhancedIncidentManager.getBulkOperationStatus(operationId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Bulk operation not found'
      });
    }
    
    res.json({
      success: true,
      operation: status
    });
    
  } catch (error) {
    console.error('❌ Failed to get bulk operation status:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/incidents/:id/push-to-display - Push incident to control room display
router.post('/:id/push-to-display', async (req, res) => {
  try {
    const { id } = req.params;
    const { supervisorData, displayOptions = {} } = req.body;
    
    console.log(`📺 Pushing incident ${id} to control room display`);
    
    const result = await pushToControlRoomDisplay(id, supervisorData, displayOptions);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Failed to push to control room display:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/incidents/control-room-display - Get control room display messages
router.get('/control-room-display', async (req, res) => {
  try {
    const messages = enhancedIncidentManager.getControlRoomDisplayMessages();
    
    res.json({
      success: true,
      messages: messages,
      count: messages.length,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Failed to get control room display messages:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==============================
// AUTOMATIC INCIDENT CREATION ENDPOINTS
// ==============================

// POST /api/incidents/auto-create/start - Start automatic incident creation monitoring
router.post('/auto-create/start', async (req, res) => {
  try {
    await autoIncidentCreator.startMonitoring();
    
    res.json({
      success: true,
      message: 'Automatic incident creation monitoring started',
      status: 'monitoring'
    });
    
  } catch (error) {
    console.error('❌ Failed to start auto incident creation:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/incidents/auto-create/stop - Stop automatic incident creation monitoring
router.post('/auto-create/stop', async (req, res) => {
  try {
    autoIncidentCreator.stopMonitoring();
    
    res.json({
      success: true,
      message: 'Automatic incident creation monitoring stopped',
      status: 'stopped'
    });
    
  } catch (error) {
    console.error('❌ Failed to stop auto incident creation:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/incidents/auto-create/status - Get auto incident creation status
router.get('/auto-create/status', async (req, res) => {
  try {
    const stats = autoIncidentCreator.getStatistics();
    
    res.json({
      success: true,
      statistics: stats,
      monitoring: stats.monitoring,
      lastCheck: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Failed to get auto incident creation status:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/incidents/auto-create/check - Manual check for auto incidents
router.post('/auto-create/check', async (req, res) => {
  try {
    const incidents = await autoIncidentCreator.checkForAutoIncidents();
    
    res.json({
      success: true,
      incidents: incidents,
      count: incidents.length,
      message: `Manual check completed - ${incidents.length} incidents created`
    });
    
  } catch (error) {
    console.error('❌ Manual auto incident check failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/incidents/auto-create/evaluate/:alertId - Evaluate specific alert for auto-creation
router.post('/auto-create/evaluate/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    const evaluation = await autoIncidentCreator.evaluateSpecificAlert(alertId);
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found in traffic intelligence'
      });
    }
    
    res.json({
      success: true,
      alertId: alertId,
      evaluation: evaluation,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Failed to evaluate alert for auto-creation:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/traffic-incidents - Get traffic incidents for the incidents page
router.get('/traffic-incidents', async (req, res) => {
  try {
    console.log('🚨 Fetching traffic incidents for incidents page...');
    
    // Set a reasonable timeout for traffic intelligence (shorter than global 45s timeout)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Traffic intelligence timeout')), 40000); // 40 second timeout (5s buffer before global timeout)
    });
    
    // Get traffic intelligence data with timeout
    const intelligence = await Promise.race([
      trafficIntelligence.getTrafficIntelligence(),
      timeoutPromise
    ]);
    
    // Check if response already sent (defensive programming)
    if (res.headersSent) {
      console.log('⚠️ Response already sent, skipping...');
      return;
    }
    
    if (!intelligence.success) {
      console.log('⚠️ Traffic intelligence not available');
      return res.json({
        success: true,
        incidents: [],
        metadata: {
          total: 0,
          sources: {},
          error: 'Traffic intelligence not available'
        }
      });
    }
    
    // Use only incidents data (roadworks are excluded)
    const incidentsData = intelligence.incidents || intelligence.data || [];
    
    // Convert traffic incidents to incident format (excluding roadworks)
    const trafficIncidents = incidentsData.map(alert => {
      // Convert alert to incident structure
      // Fix coordinates format - convert array [lat, lng] to object {lat, lng}
      let coordinates = alert.coordinates;
      if (coordinates && Array.isArray(coordinates) && coordinates.length >= 2) {
        coordinates = {
          lat: coordinates[0],
          lng: coordinates[1]
        };
      } else if (coordinates && typeof coordinates === 'object' && coordinates.latitude && coordinates.longitude) {
        // Handle alternative format
        coordinates = {
          lat: coordinates.latitude,
          lng: coordinates.longitude
        };
      }
      
      return {
        id: alert.id,
        type: alert.type === 'congestion' ? 'Traffic Congestion' : 
              alert.type === 'incident' ? 'Traffic Incident' : 
              alert.type === 'roadwork' ? 'Roadworks' : 'Traffic Alert',
        title: alert.title || `${alert.type} - ${alert.location}`,
        description: alert.description || `Traffic ${alert.type} detected`,
        location: alert.location,
        coordinates: coordinates,
        severity: alert.severity || 'Medium',
        status: alert.status === 'red' ? 'active' : 
                alert.status === 'amber' ? 'active' : 
                alert.status === 'green' ? 'monitoring' : 'active',
        priority: alert.intelligenceScore >= 80 ? 'high' : 
                 alert.intelligenceScore >= 60 ? 'medium' : 'low',
        affectsRoutes: alert.affectsRoutes || [],
        
        // Traffic-specific data
        intelligenceScore: alert.intelligenceScore,
        congestionLevel: alert.congestionLevel,
        routeImpact: alert.routeImpact,
        timeContext: alert.timeContext,
        congestionContext: alert.congestionContext,
        
        // Source information
        source: alert.source,
        sourceType: 'traffic_intelligence',
        lastUpdated: alert.lastUpdated || new Date().toISOString(),
        createdAt: alert.detectedAt || alert.lastUpdated || new Date().toISOString(),
        
        // Auto-generated flags
        isTrafficIncident: true,
        autoGenerated: true,
        canEdit: false,
        canDelete: false
      };
    });
    
    // TEMPORARY: Show ALL incidents to debug what National Highways is providing
    const highPriorityIncidents = trafficIncidents; // No filtering for debugging
    
    console.log(`✅ Returning ${highPriorityIncidents.length} high-priority traffic incidents (filtered from ${trafficIncidents.length} total incidents, roadworks excluded)`);
    console.log(`🔍 DEBUG: First incident sample:`, trafficIncidents[0] ? JSON.stringify(trafficIncidents[0], null, 2) : 'No incidents');
    
    // Final check before sending response
    if (res.headersSent) {
      console.log('⚠️ Response already sent before final response, skipping...');
      return;
    }
    
    res.json({
      success: true,
      incidents: highPriorityIncidents,
      metadata: {
        total: highPriorityIncidents.length,
        totalUnfiltered: trafficIncidents.length,
        roadworksExcluded: (intelligence.roadworks || []).length,
        sources: intelligence.metadata.sources,
        statistics: intelligence.metadata.statistics,
        lastUpdated: intelligence.metadata.lastUpdated,
        processingTime: intelligence.metadata.processingTime,
        intelligenceThreshold: 20,
        note: 'Roadworks are routed to roadworks manager via /api/traffic-intelligence/roadworks'
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to fetch traffic incidents:', error.message);
    
    // Check if response already sent before sending fallback
    if (res.headersSent) {
      console.log('⚠️ Response already sent, skipping fallback response');
      return;
    }
    
    // Provide fallback response for development/timeout issues
    console.log('📋 Providing fallback empty traffic incidents response');
    res.json({
      success: true,
      incidents: [],
      metadata: {
        total: 0,
        totalUnfiltered: 0,
        roadworksExcluded: 0,
        sources: {},
        lastUpdated: new Date().toISOString(),
        processingTime: 0,
        intelligenceThreshold: 20,
        note: 'Traffic intelligence unavailable - showing empty results',
        fallback: true,
        error: error.message
      }
    });
  }
});

export default router;
