// backend/routes/incidentAPI.js
// Phase 2: GTFS-Powered Incident Management API Routes

import express from 'express';
import geocodingService, { geocodeLocation } from '../services/geocoding.js';
import findGTFSRoutesNearCoordinates from '../gtfs-route-matcher.js';

const router = express.Router();

// In-memory incident storage (in production, use database)
let incidents = [];
let incidentCounter = 1;

// GET /api/incidents - Get all incidents
router.get('/', async (req, res) => {
  try {
    // Filter active incidents
    const activeIncidents = incidents.filter(incident => 
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

    incidents.push(incident);

    console.log(`✅ Created incident: ${incident.id} at ${location} affecting ${affectedRoutes.length} routes`);

    res.json({
      success: true,
      incident,
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

    const incidentIndex = incidents.findIndex(incident => incident.id === id);
    if (incidentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    // Update incident
    incidents[incidentIndex] = {
      ...incidents[incidentIndex],
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    console.log(`✅ Updated incident: ${id}`);

    res.json({
      success: true,
      incident: incidents[incidentIndex],
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

    const incidentIndex = incidents.findIndex(incident => incident.id === id);
    if (incidentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    // Remove incident
    const deletedIncident = incidents.splice(incidentIndex, 1)[0];

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

// GET /api/incidents/:id - Get specific incident
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const incident = incidents.find(incident => incident.id === id);
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

// GET /api/incidents/stats - Get incident statistics
router.get('/stats', async (req, res) => {
  try {
    const activeIncidents = incidents.filter(i => i.status === 'active');
    const resolvedIncidents = incidents.filter(i => i.status === 'resolved');
    
    const incidentsByType = {};
    const incidentsBySeverity = {};
    const affectedRoutesSet = new Set();

    incidents.forEach(incident => {
      // Count by type
      incidentsByType[incident.type] = (incidentsByType[incident.type] || 0) + 1;
      
      // Count by severity
      incidentsBySeverity[incident.severity] = (incidentsBySeverity[incident.severity] || 0) + 1;
      
      // Collect affected routes
      if (incident.affectsRoutes) {
        incident.affectsRoutes.forEach(route => affectedRoutesSet.add(route));
      }
    });

    res.json({
      success: true,
      stats: {
        total: incidents.length,
        active: activeIncidents.length,
        resolved: resolvedIncidents.length,
        byType: incidentsByType,
        bySeverity: incidentsBySeverity,
        affectedRoutes: Array.from(affectedRoutesSet),
        affectedRoutesCount: affectedRoutesSet.size
      }
    });

  } catch (error) {
    console.error('Failed to get incident stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get incident statistics'
    });
  }
});

export default router;
