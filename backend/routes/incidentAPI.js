// backend/routes/incidentAPI.js
// Phase 2: GTFS-Powered Incident Management API Routes with Shared Storage

import express from 'express';
import geocodingService, { geocodeLocation } from '../services/geocoding.js';
import findGTFSRoutesNearCoordinates from '../gtfs-route-matcher.js';
import supabaseStorage from '../services/supabaseIncidentStorage.js';
import { enhanceIncidentWithTomTom } from '../services/tomtomEnhancementService.js';

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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch incidents'
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

// PUT /api/incidents/:id - Update incident
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedIncident = await supabaseStorage.updateIncident(id, updates);
    
    if (!updatedIncident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    console.log(`✅ Updated incident: ${id}`);

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

export default router;
