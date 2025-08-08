import express from 'express';
import { lazyImport } from '../index.js';

const router = express.Router();

// Get display screen data including roadworks and incidents
router.get('/alerts', async (req, res) => {
  try {
    console.log('📺 Fetching display screen alerts...');
    
    // Lazy load services
    const [
      roadworksService,
      incidentService,
      alertUtils,
      supervisorManager
    ] = await Promise.all([
      lazyImport('../services/roadworksService.js'),
      lazyImport('../services/incidentService.js'),
      lazyImport('../utils/alertDeduplication.js'),
      lazyImport('../services/supervisorManager.js')
    ]);

    // Fetch data from multiple sources
    const [roadworks, incidents] = await Promise.all([
      roadworksService.getActiveRoadworks().catch(err => {
        console.error('❌ Roadworks fetch error:', err);
        return [];
      }),
      incidentService.getActiveIncidents().catch(err => {
        console.error('❌ Incidents fetch error:', err);
        return [];
      })
    ]);

    // Transform roadworks to display format
    const roadworkAlerts = roadworks.map(rw => ({
      id: `roadwork-${rw.id || rw.permitReferenceNumber}`,
      type: 'ROADWORK',
      severity: rw.severity === 'high' ? 'CRITICAL' : 
                rw.severity === 'medium' ? 'MAJOR' : 'MINOR',
      title: rw.streetName || rw.location || 'Roadworks',
      location: rw.town ? `${rw.streetName}, ${rw.town}` : rw.streetName,
      coordinates: rw.coordinates || null,
      affectedRoutes: rw.affectedRoutes || [],
      description: rw.workDescription || rw.description || 'Road maintenance',
      startTime: rw.actualStartDateTime || rw.proposedStartDateTime,
      estimatedEndTime: rw.actualEndDateTime || rw.proposedEndDateTime,
      source: 'street_manager'
    }));

    // Transform incidents to display format
    const incidentAlerts = incidents.map(inc => ({
      id: `incident-${inc.id}`,
      type: 'INCIDENT',
      severity: inc.severity === 'critical' ? 'CRITICAL' :
                inc.severity === 'major' ? 'MAJOR' : 'MINOR',
      title: inc.title || inc.incidentType || 'Traffic Incident',
      location: inc.location,
      coordinates: inc.coordinates || null,
      affectedRoutes: inc.affectedRoutes || [],
      description: inc.description,
      startTime: inc.createdAt,
      estimatedEndTime: inc.estimatedClearTime,
      source: inc.source || 'supervisor'
    }));

    // Combine and deduplicate
    let allAlerts = [...roadworkAlerts, ...incidentAlerts];
    
    // Sort by severity and time
    allAlerts.sort((a, b) => {
      const severityOrder = { 'CRITICAL': 0, 'MAJOR': 1, 'MINOR': 2 };
      const aSev = severityOrder[a.severity] ?? 3;
      const bSev = severityOrder[b.severity] ?? 3;
      
      if (aSev !== bSev) return aSev - bSev;
      
      // Same severity - sort by start time (newer first)
      return new Date(b.startTime) - new Date(a.startTime);
    });

    // Apply supervisor dismissals if requested
    const supervisorId = req.query.supervisorId;
    if (supervisorId && supervisorManager.default) {
      allAlerts = supervisorManager.default.filterDismissedAlerts(allAlerts, supervisorId);
    }

    res.json({
      success: true,
      alerts: allAlerts,
      metadata: {
        total: allAlerts.length,
        roadworks: roadworkAlerts.length,
        incidents: incidentAlerts.length,
        critical: allAlerts.filter(a => a.severity === 'CRITICAL').length,
        major: allAlerts.filter(a => a.severity === 'MAJOR').length,
        minor: allAlerts.filter(a => a.severity === 'MINOR').length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Display alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: []
    });
  }
});

// Get current display state
router.get('/current-state', async (req, res) => {
  try {
    // Return current operational state for display
    res.json({
      success: true,
      currentState: {
        alerts: {
          active: 0, // Will be populated from real data
          critical: 0,
          acknowledged: 0
        },
        supervisors: {
          online: 0,
          lastActivity: null
        },
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
