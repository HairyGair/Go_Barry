// backend/routes/roadworksAPI.js
// Complete Roadworks Task Management API for Go BARRY
// Operational workflow for diversion planning, communication generation, and council coordination

import express from 'express';
import supervisorManager, { validateSupervisorSession } from '../services/supervisorManager.js';
import geocodingService, { geocodeLocation } from '../services/geocoding.js';
import findGTFSRoutesNearCoordinates from '../gtfs-route-matcher.js';
import { generateDiversionPDF, generateTicketMachineMessage } from '../services/roadworksServices.js';
import supervisorActivityLogger from '../services/supervisorActivityLogger.js';
import supabaseRoadworksStorage from '../services/supabaseRoadworksStorage.js';

const router = express.Router();

// Using Supabase storage for persistence
let roadworksCounter = 1;

// Initialize with current week's roadworks
// Initialize Supabase storage on startup
supabaseRoadworksStorage.initializeStorage();

// Roadworks workflow statuses
const ROADWORKS_STATUSES = {
  REPORTED: 'reported',           // New roadwork report received
  ASSESSING: 'assessing',         // Supervisor reviewing impact
  PLANNING: 'planning',           // Creating diversion plans
  APPROVED: 'approved',           // Plans approved, ready to implement
  ACTIVE: 'active',               // Roadworks live, diversions in effect
  MONITORING: 'monitoring',       // Ongoing monitoring of service
  COMPLETED: 'completed',         // Roadworks finished
  CANCELLED: 'cancelled'          // Roadworks cancelled
};

// Roadworks priority levels
const PRIORITY_LEVELS = {
  CRITICAL: 'critical',      // Major route closure, immediate action needed
  HIGH: 'high',             // Important route affected, plan within 2 hours
  MEDIUM: 'medium',         // Minor route impact, plan within 8 hours
  LOW: 'low',               // Minimal impact, plan within 24 hours
  PLANNED: 'planned'        // Scheduled roadworks, advance planning
};

// Communication types needed
const COMMUNICATION_TYPES = {
  BLINK_PDF: 'blink_pdf',                    // PDF with Google Maps view + description
  TICKET_MACHINE: 'ticket_machine',          // Full diversion details for ticket machines
  DRIVER_BRIEFING: 'driver_briefing',        // Driver briefing sheet
  CUSTOMER_NOTICE: 'customer_notice',        // Customer communication
  COUNCIL_COORDINATION: 'council_coordination' // Council/external coordination
};

// GET /api/roadworks - Get all roadworks with filtering
router.get('/', async (req, res) => {
  try {
    const { status, priority, assignedTo, dateFrom, dateTo } = req.query;
    
    const filteredRoadworks = await supabaseRoadworksStorage.getAllRoadworks({ status, priority, assignedTo, dateFrom, dateTo });
    
    // Sorting is handled in Supabase query
    
    res.json({
      success: true,
      roadworks: filteredRoadworks,
      count: filteredRoadworks.length,
      filters: { status, priority, assignedTo, dateFrom, dateTo },
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch roadworks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roadworks'
    });
  }
});

// POST /api/roadworks - Create new roadworks task
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      coordinates,
      authority,
      contactPerson,
      contactPhone,
      contactEmail,
      plannedStartDate,
      plannedEndDate,
      estimatedDuration,
      roadworkType,
      trafficManagement,
      priority,
      sessionId,
      sourceType,
      sourceReference,
      notificationMethod
    } = req.body;

    // Validate required fields
    if (!title || !location || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Title, location, and supervisor session are required'
      });
    }

    // Validate supervisor session
    const sessionValidation = validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }

    const supervisor = sessionValidation.supervisor;

    // Enhance location with coordinates if not provided
    let enhancedCoordinates = coordinates;
    let enhancedLocationName = location;
    
    if (!coordinates && location) {
      try {
        const locationData = await geocodeLocation(location);
        if (locationData) {
          enhancedCoordinates = {
            latitude: locationData.latitude,
            longitude: locationData.longitude
          };
          enhancedLocationName = locationData.name || location;
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
          500 // 500m radius for roadworks (wider than incidents)
        );
      } catch (error) {
        console.warn('Failed to find affected routes:', error.message);
      }
    }

    // Determine priority if not provided
    const determinedPriority = priority || determinePriority(affectedRoutes, roadworkType, estimatedDuration);

    // Create roadworks task
    const roadwork = {
      id: `roadwork_${roadworksCounter++}`,
      title,
      description: description || '',
      location: enhancedLocationName,
      coordinates: enhancedCoordinates,
      
      // Authority/Contact Information
      authority: authority || 'Unknown Authority',
      contactPerson: contactPerson || '',
      contactPhone: contactPhone || '',
      contactEmail: contactEmail || '',
      
      // Timing
      plannedStartDate: plannedStartDate || new Date().toISOString(),
      plannedEndDate,
      estimatedDuration: estimatedDuration || 'Unknown',
      actualStartDate: null,
      actualEndDate: null,
      
      // Classification
      roadworkType: roadworkType || 'general',
      trafficManagement: trafficManagement || 'traffic_control',
      priority: determinedPriority,
      
      // Route Impact
      affectedRoutes: affectedRoutes.slice(0, 15), // Limit to 15 routes
      impactAssessment: generateImpactAssessment(affectedRoutes, roadworkType),
      
      // Workflow
      status: ROADWORKS_STATUSES.REPORTED,
      assignedTo: supervisor.id,
      assignedToName: supervisor.name,
      
      // Task Management
      tasks: generateInitialTasks(determinedPriority, affectedRoutes),
      communications: [],
      diversions: [],
      councilCoordination: [],
      
      // Audit Trail
      createdBy: supervisor.id,
      createdByName: supervisor.name,
      createdByRole: supervisor.role,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      
      // Source Information
      sourceType: sourceType || 'manual', // manual, streetmanager, council, public
      sourceReference: sourceReference || '',
      notificationMethod: notificationMethod || 'manual',
      
      // Display Control
      promotedToDisplay: false,
      displayPromotedBy: null,
      displayPromotedAt: null,
      displayNotes: ''
    };

    const savedRoadwork = await supabaseRoadworksStorage.addRoadwork(roadwork);

    console.log(`✅ Created roadworks task: ${savedRoadwork.id} at ${location} affecting ${affectedRoutes.length} routes`);
    console.log(`   📋 Priority: ${determinedPriority} | Assigned to: ${supervisor.name}`);
    console.log(`   🚌 Routes affected: ${affectedRoutes.slice(0, 5).join(', ')}${affectedRoutes.length > 5 ? '...' : ''}`);

    // Log roadwork creation activity
    await supervisorActivityLogger.logRoadworkCreation(
      supervisor.badge,
      supervisor.name,
      {
        location: enhancedLocationName,
        severity: determinedPriority,
        status: savedRoadwork.status,
        affected_routes: affectedRoutes.length
      }
    );

    res.json({
      success: true,
      roadwork: savedRoadwork,
      message: 'Roadworks task created successfully'
    });

  } catch (error) {
    console.error('Failed to create roadworks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create roadworks task'
    });
  }
});

// PUT /api/roadworks/:id/status - Update roadworks status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, sessionId, notes, actualStartDate, actualEndDate } = req.body;

    // Validate inputs
    if (!status || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Status and session ID are required'
      });
    }

    if (!Object.values(ROADWORKS_STATUSES).includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    // Validate supervisor session
    const sessionValidation = validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }

    const supervisor = sessionValidation.supervisor;

    // Get current roadwork
    const roadwork = await supabaseRoadworksStorage.getRoadworkById(id);
    if (!roadwork) {
      return res.status(404).json({
        success: false,
        error: 'Roadworks not found'
      });
    }

    const previousStatus = roadwork.status;
    const updates = {
      status,
      notes,
      actualStartDate,
      actualEndDate,
      updatedBy: supervisor.id,
      updatedByName: supervisor.name
    };

    // Handle timing updates
    if (status === ROADWORKS_STATUSES.ACTIVE && !roadwork.actualStartDate) {
      updates.actualStartDate = actualStartDate || new Date().toISOString();
    }
    
    if (status === ROADWORKS_STATUSES.COMPLETED && !roadwork.actualEndDate) {
      updates.actualEndDate = actualEndDate || new Date().toISOString();
    }

    // Add status change to audit trail
    const statusHistory = roadwork.statusHistory || [];
    statusHistory.push({
      from: previousStatus,
      to: status,
      changedBy: supervisor.id,
      changedByName: supervisor.name,
      changedAt: new Date().toISOString(),
      notes: notes || ''
    });
    updates.statusHistory = statusHistory;

    const updatedRoadwork = await supabaseRoadworksStorage.updateRoadwork(id, updates);

    console.log(`✅ Roadworks ${id} status updated: ${previousStatus} → ${status} by ${supervisor.name}`);

    res.json({
      success: true,
      roadwork: updatedRoadwork,
      statusChange: {
        from: previousStatus,
        to: status,
        changedBy: supervisor.name
      },
      message: 'Status updated successfully'
    });

  } catch (error) {
    console.error('Failed to update roadworks status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    });
  }
});

// POST /api/roadworks/:id/diversion - Create diversion plan
router.post('/:id/diversion', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      routeNumbers, 
      diversionDescription, 
      waypoints, 
      estimatedDelay, 
      sessionId,
      communicationType 
    } = req.body;

    // Validate supervisor session
    const sessionValidation = validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }

    const supervisor = sessionValidation.supervisor;

    // Find roadwork
    const roadwork = await supabaseRoadworksStorage.getRoadworkById(id);
    if (!roadwork) {
      return res.status(404).json({
        success: false,
        error: 'Roadworks not found'
      });
    }

    // Create diversion plan
    const diversionPlan = {
      id: `diversion_${Date.now()}`,
      roadworkId: id,
      routeNumbers: routeNumbers || [],
      description: diversionDescription,
      waypoints: waypoints || [],
      estimatedDelay: estimatedDelay || 'Unknown',
      createdBy: supervisor.id,
      createdByName: supervisor.name,
      createdAt: new Date().toISOString(),
      status: 'draft',
      communications: []
    };

    // Generate communications based on type
    if (communicationType === COMMUNICATION_TYPES.BLINK_PDF) {
      try {
        const pdfResult = await generateDiversionPDF(diversionPlan, roadwork);
        diversionPlan.communications.push({
          type: COMMUNICATION_TYPES.BLINK_PDF,
          content: pdfResult.content,
          fileName: pdfResult.fileName,
          generatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Failed to generate Blink PDF:', error.message);
      }
    }

    if (communicationType === COMMUNICATION_TYPES.TICKET_MACHINE) {
      try {
        const ticketMessage = await generateTicketMachineMessage(diversionPlan, roadwork);
        diversionPlan.communications.push({
          type: COMMUNICATION_TYPES.TICKET_MACHINE,
          content: ticketMessage,
          generatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Failed to generate ticket machine message:', error.message);
      }
    }

    // Add diversion to roadwork
    const diversions = roadwork.diversions || [];
    diversions.push(diversionPlan);
    
    const updatedRoadwork = await supabaseRoadworksStorage.updateRoadwork(id, {
      diversions,
      lastUpdated: new Date().toISOString()
    });

    console.log(`✅ Created diversion plan for roadwork ${id}: Routes ${routeNumbers.join(', ')}`);

    res.json({
      success: true,
      diversionPlan,
      roadwork: updatedRoadwork,
      message: 'Diversion plan created successfully'
    });

  } catch (error) {
    console.error('Failed to create diversion plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create diversion plan'
    });
  }
});

// POST /api/roadworks/:id/promote-to-display - Promote roadworks to display screen
router.post('/:id/promote-to-display', async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId, displayNotes, reason } = req.body;

    // Validate supervisor session
    const sessionValidation = validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }

    const supervisor = sessionValidation.supervisor;

    // Find and update roadwork
    const roadwork = await supabaseRoadworksStorage.getRoadworkById(id);
    if (!roadwork) {
      return res.status(404).json({
        success: false,
        error: 'Roadworks not found'
      });
    }

    const updatedRoadwork = await supabaseRoadworksStorage.updateRoadwork(id, {
      promotedToDisplay: true,
      displayPromotedBy: supervisor.id,
      displayPromotedByName: supervisor.name,
      displayPromotedAt: new Date().toISOString(),
      displayNotes: displayNotes || '',
      displayPromotionReason: reason || ''
    });

    console.log(`📺 Roadwork ${id} promoted to display by ${supervisor.name}: ${reason || 'No reason provided'}`);

    res.json({
      success: true,
      roadwork: updatedRoadwork,
      message: 'Roadworks promoted to display screen successfully'
    });

  } catch (error) {
    console.error('Failed to promote roadworks to display:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to promote to display'
    });
  }
});

// DELETE /api/roadworks/:id/remove-from-display - Remove from display screen
router.delete('/:id/remove-from-display', async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId, reason } = req.body;

    // Validate supervisor session
    const sessionValidation = validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }

    const supervisor = sessionValidation.supervisor;

    // Find and update roadwork
    const roadwork = await supabaseRoadworksStorage.getRoadworkById(id);
    if (!roadwork) {
      return res.status(404).json({
        success: false,
        error: 'Roadworks not found'
      });
    }

    const updatedRoadwork = await supabaseRoadworksStorage.updateRoadwork(id, {
      promotedToDisplay: false,
      displayRemovedBy: supervisor.id,
      displayRemovedByName: supervisor.name,
      displayRemovedAt: new Date().toISOString(),
      displayRemovalReason: reason || ''
    });

    console.log(`📺 Roadwork ${id} removed from display by ${supervisor.name}: ${reason || 'No reason provided'}`);

    res.json({
      success: true,
      roadwork: updatedRoadwork,
      message: 'Roadworks removed from display screen successfully'
    });

  } catch (error) {
    console.error('Failed to remove roadworks from display:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove from display'
    });
  }
});

// GET /api/roadworks/display - Get roadworks for display screen
router.get('/display', async (req, res) => {
  try {
    const displayRoadworks = await supabaseRoadworksStorage.getDisplayRoadworks();

    res.json({
      success: true,
      roadworks: displayRoadworks,
      count: displayRoadworks.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to fetch display roadworks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch display roadworks'
    });
  }
});

// GET /api/roadworks/stats - Get roadworks statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await supabaseRoadworksStorage.getRoadworksStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Failed to get roadworks stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

// Helper Functions

function determinePriority(affectedRoutes, roadworkType, estimatedDuration) {
  // High-frequency/important routes
  const criticalRoutes = ['21', 'X21', 'Q3', '10', '12', '22', '56'];
  const highRoutes = ['16', '20', '27', '28', '29', '47', '53', '54', '57', '58'];
  
  // Check for critical routes
  if (affectedRoutes.some(route => criticalRoutes.includes(route))) {
    return PRIORITY_LEVELS.CRITICAL;
  }
  
  // Check for high-priority routes
  if (affectedRoutes.some(route => highRoutes.includes(route))) {
    return PRIORITY_LEVELS.HIGH;
  }
  
  // Check roadwork type
  if (roadworkType === 'road_closure' || roadworkType === 'major_works') {
    return PRIORITY_LEVELS.HIGH;
  }
  
  // Check duration
  if (estimatedDuration && estimatedDuration.includes('week') || estimatedDuration.includes('month')) {
    return PRIORITY_LEVELS.HIGH;
  }
  
  // Check number of affected routes
  if (affectedRoutes.length >= 5) {
    return PRIORITY_LEVELS.MEDIUM;
  }
  
  return PRIORITY_LEVELS.LOW;
}

function generateImpactAssessment(affectedRoutes, roadworkType) {
  const impact = {
    routeCount: affectedRoutes.length,
    severity: 'low',
    estimatedPassengerImpact: 'minimal',
    recommendedActions: []
  };
  
  if (affectedRoutes.length >= 5) {
    impact.severity = 'high';
    impact.estimatedPassengerImpact = 'significant';
    impact.recommendedActions.push('Implement comprehensive diversion plan');
    impact.recommendedActions.push('Coordinate with council for additional services');
  } else if (affectedRoutes.length >= 2) {
    impact.severity = 'medium';
    impact.estimatedPassengerImpact = 'moderate';
    impact.recommendedActions.push('Create route-specific diversions');
  }
  
  if (roadworkType === 'road_closure') {
    impact.severity = 'high';
    impact.recommendedActions.push('Emergency diversion planning required');
  }
  
  return impact;
}

function generateInitialTasks(priority, affectedRoutes) {
  const tasks = [];
  
  // Standard tasks based on priority
  if (priority === PRIORITY_LEVELS.CRITICAL || priority === PRIORITY_LEVELS.HIGH) {
    tasks.push(
      {
        id: `task_${Date.now()}_1`,
        title: 'Create Blink PDF Diversion Map',
        description: 'Generate PDF with Google Maps top-down view and diversion description',
        type: COMMUNICATION_TYPES.BLINK_PDF,
        priority: 'urgent',
        status: 'pending',
        assignedTo: null,
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
      },
      {
        id: `task_${Date.now()}_2`,
        title: 'Generate Ticket Machine Messages',
        description: 'Create full diversion details for bus ticket machines',
        type: COMMUNICATION_TYPES.TICKET_MACHINE,
        priority: 'urgent',
        status: 'pending',
        assignedTo: null,
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
      },
      {
        id: `task_${Date.now()}_3`,
        title: 'Council Coordination',
        description: 'Contact council for potential shuttle service coordination',
        type: COMMUNICATION_TYPES.COUNCIL_COORDINATION,
        priority: 'high',
        status: 'pending',
        assignedTo: null,
        dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
      }
    );
  }
  
  // Add route-specific tasks
  if (affectedRoutes.length > 0) {
    tasks.push({
      id: `task_${Date.now()}_routes`,
      title: `Route Impact Assessment (${affectedRoutes.length} routes)`,
      description: `Assess impact on routes: ${affectedRoutes.slice(0, 5).join(', ')}${affectedRoutes.length > 5 ? '...' : ''}`,
      type: 'assessment',
      priority: 'high',
      status: 'pending',
      assignedTo: null,
      dueDate: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
    });
  }
  
  return tasks;
}

export default router;