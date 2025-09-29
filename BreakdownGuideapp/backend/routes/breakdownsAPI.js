/**
 * Breakdowns API Routes for SDC Dashboard Integration
 * Provides real-time breakdown data, assessment tracking, and audit capabilities
 */

import express from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../server.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Data file paths
const BREAKDOWN_COUNTER_PATH = join(__dirname, '../data/breakdown-counter.json');
const ACTIVITIES_PATH = join(__dirname, '../data/activities.json');
const AUDIT_LOG_PATH = join(__dirname, '../data/audit-log.json');

// Helper functions
const loadJSONFile = (filePath, defaultValue = {}) => {
  try {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf8'));
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return defaultValue;
  }
};

const saveJSONFile = (filePath, data) => {
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error);
    return false;
  }
};

const logAuditEvent = (event) => {
  const auditLog = loadJSONFile(AUDIT_LOG_PATH, { events: [] });
  
  const auditEvent = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    ...event
  };
  
  auditLog.events.unshift(auditEvent);
  
  // Keep only last 1000 events
  if (auditLog.events.length > 1000) {
    auditLog.events = auditLog.events.slice(0, 1000);
  }
  
  saveJSONFile(AUDIT_LOG_PATH, auditLog);
  return auditEvent;
};

// GET /api/breakdowns/live - Active breakdowns with assessment data
router.get('/live', async (req, res) => {
  try {
    console.log('📊 SDC API: Fetching live breakdowns');
    
    // Query Supabase for active breakdowns
    const { data: breakdowns, error: breakdownError } = await supabase
      .from('breakdowns')
      .select('*')
      .neq('status', 'resolved')
      .order('created_at', { ascending: false })
      .limit(100);

    if (breakdownError) {
      console.error('Error fetching breakdowns from Supabase:', breakdownError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch breakdown data',
        breakdowns: []
      });
    }

    console.log('📊 Loaded breakdown data from Supabase:', { 
      breakdownCount: breakdowns?.length || 0
    });
    
    // Load recent activities to get assessment data
    const activitiesData = loadJSONFile(ACTIVITIES_PATH, { activities: [] });
    const recentActivities = activitiesData.activities || [];
    
    // Ensure breakdowns array exists
    const validBreakdowns = breakdowns || [];
    
    // Process breakdowns and enrich with assessment data
    const liveBreakdowns = validBreakdowns.map(breakdown => {
      // Find related activities for this breakdown
      const breakdownActivities = recentActivities.filter(activity => 
        activity.breakdown_id === breakdown.breakdown_id ||
        activity.fleet_no === breakdown.fleet_number ||
        activity.fleet_number === breakdown.fleet_number
      );
      
      // Find latest assessment status
      const wizardStarted = breakdownActivities.find(a => 
        a.type === 'wizard_started' || a.activity_type === 'wizard_started' ||
        a.message?.toLowerCase().includes('started')
      );
      
      const wizardCompleted = breakdownActivities.find(a => 
        a.type === 'wizard_completed' || a.activity_type === 'wizard_completed' ||
        a.message?.toLowerCase().includes('completed')
      );
      
      const wizardProgress = breakdownActivities.filter(a => 
        a.type === 'wizard_step' || a.activity_type === 'wizard_step' ||
        a.message?.toLowerCase().includes('step')
      );
      
      // Determine current status
      let status = 'active';
      let decision = breakdown.wizard_decision || breakdown.decision || null;
      let inAssessment = false;
      let currentStep = '1/5';
      let stepDescription = 'Initial assessment';
      
      if (wizardStarted && !wizardCompleted) {
        inAssessment = true;
        status = 'in_progress';
        
        // Calculate current step from progress activities
        if (wizardProgress.length > 0) {
          const latestProgress = wizardProgress[wizardProgress.length - 1];
          currentStep = latestProgress.current_step || `${wizardProgress.length + 1}/5`;
          stepDescription = latestProgress.step_description || 'Assessment in progress';
        }
      } else if (wizardCompleted) {
        status = 'completed';
        decision = wizardCompleted.decision || breakdown.wizard_decision || breakdown.decision;
      }
      
      // Enhanced breakdown object for SDC Dashboard
      return {
        // Core identification
        id: breakdown.breakdown_id,
        breakdown_id: breakdown.breakdown_id,
        daily_id: breakdown.daily_id || breakdown.breakdown_id?.split('-').pop() || '000',
        
        // Vehicle information
        vehicleFleet: breakdown.fleet_number,
        fleet_number: breakdown.fleet_number,
        route: breakdown.route || extractRouteFromLocation(breakdown.location),
        
        // Location and context
        location: breakdown.location || 'Location not specified',
        coordinates: breakdown.coordinates || null,
        
        // Assessment details
        assessmentType: breakdown.issue_category || breakdown.issue_type || 'General',
        issue_category: breakdown.issue_category || breakdown.issue_type || 'General',
        wizard_type: normalizeWizardType(breakdown.issue_category || breakdown.issue_type),
        
        // Personnel
        supervisor: breakdown.supervisor_name || 'Unknown',
        supervisor_name: breakdown.supervisor_name || 'Unknown',
        supervisor_badge: breakdown.supervisor_badge || null,
        
        // Status and progress
        status: status,
        decision: decision,
        severity: decision || breakdown.severity || null,
        currentStep: currentStep,
        stepDescription: stepDescription,
        progress_percentage: calculateProgressPercentage(currentStep),
        
        // Wizard data
        wizardResponses: formatWizardResponses(breakdown.wizard_responses || {}),
        
        // SDC specific actions
        recommendedActions: generateRecommendedActions(decision, breakdown),
        
        // Timeline
        createdAt: breakdown.created_at || breakdown.timestamp || new Date().toISOString(),
        startedAt: wizardStarted?.timestamp || breakdown.started_at || null,
        completedAt: wizardCompleted?.timestamp || breakdown.completed_at || null,
        acknowledgedAt: breakdown.acknowledged_at || null,
        
        // Edit history from activities
        editHistory: formatEditHistory(breakdownActivities),
        
        // SDC workflow states
        sdc_acknowledged: !!breakdown.acknowledged_at,
        engineering_requested: !!breakdown.engineer_assigned,
        engineer_assigned: breakdown.engineer_assigned || null,
        engineer_name: breakdown.engineer_name || null,
        dispatched_at: breakdown.dispatched_at || null,
        
        // Dashboard flags
        isCritical: decision === 'STOP' || breakdown.severity === 'STOP',
        isPending: !breakdown.acknowledged_at,
        isDispatched: !!breakdown.engineer_assigned,
        inAssessment: inAssessment,
        hasActiveAssessment: inAssessment,
        isPriorityRoute: isPriorityRoute(breakdown.route || breakdown.location),
        
        // Raw activities for debugging
        activities: breakdownActivities,
        
        // Metadata
        lastUpdated: new Date().toISOString()
      };
    });
    
    // Calculate statistics
    const activeBreakdowns = liveBreakdowns.filter(b => b.status !== 'completed');
    const criticalCount = activeBreakdowns.filter(b => b.isCritical).length;
    const pendingCount = activeBreakdowns.filter(b => b.isPending).length;
    const dispatchedCount = activeBreakdowns.filter(b => b.isDispatched).length;
    const inAssessmentCount = activeBreakdowns.filter(b => b.inAssessment).length;
    
    const response = {
      success: true,
      breakdowns: liveBreakdowns,
      total: activeBreakdowns.length,
      critical: criticalCount,
      pending: pendingCount,
      dispatched: dispatchedCount,
      in_assessment: inAssessmentCount,
      timestamp: new Date().toISOString(),
      source: 'live_data'
    };
    
    console.log(`📊 SDC API: Returning ${liveBreakdowns.length} breakdowns (${activeBreakdowns.length} active, ${criticalCount} critical, ${inAssessmentCount} in assessment)`);
    
    res.json(response);
    
  } catch (error) {
    console.error('Error fetching live breakdowns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live breakdown data',
      message: error.message
    });
  }
});

// GET /api/breakdowns/in-progress - Currently being assessed
router.get('/in-progress', async (req, res) => {
  try {
    console.log('🔄 SDC API: Fetching in-progress assessments');
    
    // Load activities to find active assessments
    const activitiesData = loadJSONFile(ACTIVITIES_PATH, { activities: [] });
    const activities = activitiesData.activities || [];
    
    // Find wizard sessions that started but haven't completed
    const wizardStarted = activities.filter(a => 
      a.type === 'wizard_started' || a.activity_type === 'wizard_started' ||
      a.message?.toLowerCase().includes('started')
    );
    
    const wizardCompleted = activities.filter(a => 
      a.type === 'wizard_completed' || a.activity_type === 'wizard_completed' ||
      a.message?.toLowerCase().includes('completed')
    );
    
    // Find active assessments (started but not completed in last 30 minutes)
    const activeAssessments = wizardStarted.filter(started => {
      const hasCompleted = wizardCompleted.some(completed => 
        completed.breakdown_id === started.breakdown_id ||
        completed.fleet_no === started.fleet_no ||
        completed.fleet_number === started.fleet_number
      );
      
      // Only show if assessment was started in the last 30 minutes
      const startTime = new Date(started.timestamp);
      const now = new Date();
      const ageMinutes = (now - startTime) / (1000 * 60);
      
      return !hasCompleted && ageMinutes <= 30;
    });
    
    // Enrich with progress data
    const inProgressAssessments = activeAssessments.map(assessment => {
      // Find progress activities for this assessment
      const progressActivities = activities.filter(a => 
        (a.breakdown_id === assessment.breakdown_id || 
         a.fleet_no === assessment.fleet_no ||
         a.fleet_number === assessment.fleet_number) &&
        (a.type === 'wizard_step' || a.activity_type === 'wizard_step' ||
         a.message?.toLowerCase().includes('step'))
      );
      
      const latestProgress = progressActivities[progressActivities.length - 1];
      const stepCount = progressActivities.length + 1;
      
      return {
        breakdownId: assessment.breakdown_id,
        breakdown_id: assessment.breakdown_id,
        fleetNumber: assessment.fleet_no || assessment.fleet_number,
        fleet_number: assessment.fleet_no || assessment.fleet_number,
        route: assessment.route,
        location: assessment.location,
        assessmentType: assessment.issue_category || assessment.issue_type || 'General',
        wizard_type: normalizeWizardType(assessment.issue_category || assessment.issue_type),
        supervisor: assessment.supervisor_name || assessment.supervisor || 'Unknown',
        supervisor_name: assessment.supervisor_name || assessment.supervisor || 'Unknown',
        supervisor_badge: assessment.supervisor_badge,
        startTime: assessment.timestamp,
        startedAt: assessment.timestamp,
        currentStep: latestProgress?.current_step || `${stepCount}/5`,
        stepDescription: latestProgress?.step_description || 'Assessment in progress...',
        estimatedCompletion: calculateEstimatedCompletion(assessment.issue_category, stepCount),
        priority: calculatePriority(assessment),
        progress_percentage: calculateProgressPercentage(`${stepCount}/5`),
        elapsed_minutes: Math.floor((Date.now() - new Date(assessment.timestamp)) / 60000),
        activities: progressActivities,
        lastUpdate: latestProgress?.timestamp || assessment.timestamp
      };
    });
    
    const response = {
      success: true,
      assessments: inProgressAssessments,
      count: inProgressAssessments.length,
      timestamp: new Date().toISOString()
    };
    
    console.log(`🔄 SDC API: Found ${inProgressAssessments.length} active assessments`);
    
    res.json(response);
    
  } catch (error) {
    console.error('Error fetching in-progress assessments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch in-progress assessments',
      message: error.message
    });
  }
});

// POST /api/breakdowns/{id}/edit - Start assessment edit
router.post('/:id/edit', async (req, res) => {
  try {
    const breakdownId = req.params.id;
    const { reason, user_type = 'sdc_operator', source = 'sdc_dashboard' } = req.body;
    
    console.log(`✏️ SDC API: Starting assessment edit for ${breakdownId}`);
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Edit reason is required'
      });
    }
    
    // Load breakdown data to verify it exists
    const breakdownData = loadJSONFile(BREAKDOWN_COUNTER_PATH, { breakdowns: [] });
    const breakdown = breakdownData.breakdowns.find(b => b.breakdown_id === breakdownId);
    
    if (!breakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }
    
    // Log audit event
    const auditEvent = logAuditEvent({
      action: 'assessment_edit_initiated',
      breakdown_id: breakdownId,
      reason: reason.trim(),
      user_type: user_type,
      source: source,
      original_decision: breakdown.wizard_decision || breakdown.decision || 'UNKNOWN',
      fleet_number: breakdown.fleet_number,
      supervisor_badge: breakdown.supervisor_badge,
      metadata: {
        location: breakdown.location,
        issue_category: breakdown.issue_category,
        initiated_from: req.get('User-Agent') || 'Unknown'
      }
    });
    
    // Log activity
    const activitiesData = loadJSONFile(ACTIVITIES_PATH, { activities: [] });
    const newActivity = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: 'edit_initiated',
      activity_type: 'edit_initiated',
      breakdown_id: breakdownId,
      fleet_no: breakdown.fleet_number,
      fleet_number: breakdown.fleet_number,
      supervisor_name: breakdown.supervisor_name,
      supervisor_badge: breakdown.supervisor_badge,
      message: `Assessment edit initiated: ${reason}`,
      reason: reason,
      source: source,
      user_type: user_type
    };
    
    activitiesData.activities.unshift(newActivity);
    
    // Keep only last 500 activities
    if (activitiesData.activities.length > 500) {
      activitiesData.activities = activitiesData.activities.slice(0, 500);
    }
    
    saveJSONFile(ACTIVITIES_PATH, activitiesData);
    
    // Prepare edit context
    const editContext = {
      breakdown_id: breakdownId,
      fleet_number: breakdown.fleet_number,
      location: breakdown.location,
      issue_category: breakdown.issue_category,
      supervisor_badge: breakdown.supervisor_badge,
      original_decision: breakdown.wizard_decision || breakdown.decision,
      edit_reason: reason,
      edit_initiated_at: new Date().toISOString(),
      return_url: req.body.return_url || `/dashboards/sdc?highlight=${breakdownId}`,
      audit_id: auditEvent.id
    };
    
    const response = {
      success: true,
      message: 'Assessment edit initiated successfully',
      edit_context: editContext,
      audit_event: auditEvent,
      redirect_url: `/breakdown-guide?edit=${breakdownId}&return=${encodeURIComponent(editContext.return_url)}&reason=${encodeURIComponent(reason)}`,
      timestamp: new Date().toISOString()
    };
    
    console.log(`✏️ SDC API: Edit initiated for ${breakdownId} with reason: ${reason}`);
    
    res.json(response);
    
  } catch (error) {
    console.error('Error initiating assessment edit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate assessment edit',
      message: error.message
    });
  }
});

// GET /api/breakdowns/{id}/audit - Get edit history
router.get('/:id/audit', async (req, res) => {
  try {
    const breakdownId = req.params.id;
    
    console.log(`📜 SDC API: Fetching audit trail for ${breakdownId}`);
    
    // Load audit log
    const auditLog = loadJSONFile(AUDIT_LOG_PATH, { events: [] });
    
    // Load activities for additional audit data
    const activitiesData = loadJSONFile(ACTIVITIES_PATH, { activities: [] });
    
    // Filter audit events for this breakdown
    const breakdownAuditEvents = auditLog.events.filter(event => 
      event.breakdown_id === breakdownId
    );
    
    // Filter activities for this breakdown
    const breakdownActivities = activitiesData.activities.filter(activity => 
      activity.breakdown_id === breakdownId ||
      activity.fleet_no === breakdownId ||
      activity.fleet_number === breakdownId
    );
    
    // Combine and format audit trail
    const auditTrail = [];
    
    // Add audit events
    breakdownAuditEvents.forEach(event => {
      auditTrail.push({
        id: event.id,
        timestamp: event.timestamp,
        action: formatAuditAction(event.action),
        user: event.user_type || 'Unknown',
        details: event.reason || event.message || 'No details available',
        source: event.source || 'system',
        type: 'audit_event',
        metadata: event.metadata || {}
      });
    });
    
    // Add relevant activities
    breakdownActivities.forEach(activity => {
      auditTrail.push({
        id: activity.id,
        timestamp: activity.timestamp,
        action: formatActivityAction(activity.type || activity.activity_type),
        user: activity.supervisor_name || activity.supervisor || 'System',
        details: activity.message || 'Activity recorded',
        source: activity.source || 'breakdown_guide',
        type: 'activity',
        metadata: {
          fleet_number: activity.fleet_no || activity.fleet_number,
          location: activity.location,
          issue_category: activity.issue_category
        }
      });
    });
    
    // Sort by timestamp (newest first)
    auditTrail.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const response = {
      success: true,
      breakdown_id: breakdownId,
      audit_trail: auditTrail,
      total_events: auditTrail.length,
      audit_events: breakdownAuditEvents.length,
      activity_events: breakdownActivities.length,
      timestamp: new Date().toISOString()
    };
    
    console.log(`📜 SDC API: Found ${auditTrail.length} audit entries for ${breakdownId}`);
    
    res.json(response);
    
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit trail',
      message: error.message
    });
  }
});

// GET /api/breakdowns/{id} - Get specific breakdown details
router.get('/:id', async (req, res) => {
  try {
    const breakdownId = req.params.id;
    
    console.log(`📋 SDC API: Fetching breakdown details for ${breakdownId}`);
    
    // Load breakdown data
    const breakdownData = loadJSONFile(BREAKDOWN_COUNTER_PATH, { breakdowns: [] });
    const breakdown = breakdownData.breakdowns.find(b => b.breakdown_id === breakdownId);
    
    if (!breakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }
    
    // Load related activities
    const activitiesData = loadJSONFile(ACTIVITIES_PATH, { activities: [] });
    const relatedActivities = activitiesData.activities.filter(activity => 
      activity.breakdown_id === breakdownId ||
      activity.fleet_no === breakdown.fleet_number ||
      activity.fleet_number === breakdown.fleet_number
    );
    
    // Enrich breakdown with assessment data
    const enrichedBreakdown = {
      ...breakdown,
      activities: relatedActivities,
      assessment_status: determineAssessmentStatus(relatedActivities),
      progress_data: calculateProgressData(relatedActivities),
      audit_summary: {
        total_events: relatedActivities.length,
        last_activity: relatedActivities[0]?.timestamp,
        has_edits: relatedActivities.some(a => a.type === 'edit_initiated')
      }
    };
    
    const response = {
      success: true,
      breakdown: enrichedBreakdown,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Error fetching breakdown details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch breakdown details',
      message: error.message
    });
  }
});

// Utility functions
const extractRouteFromLocation = (location) => {
  if (!location) return null;
  const routeMatch = location.match(/(?:Route\s+)?([XA]?\d+[A-Z]?)/i);
  return routeMatch ? routeMatch[1] : null;
};

const normalizeWizardType = (type) => {
  if (!type) return 'general';
  return type.toLowerCase().replace(/\s+/g, '_');
};

const calculateProgressPercentage = (currentStep) => {
  if (!currentStep) return 0;
  const [current, total] = currentStep.split('/').map(Number);
  return Math.round((current / total) * 100);
};

const formatWizardResponses = (responses) => {
  if (Array.isArray(responses)) return responses;
  if (typeof responses === 'object') {
    return Object.entries(responses).map(([key, value], index) => ({
      step: index + 1,
      question: key.replace(/_/g, ' '),
      answer: String(value),
      timestamp: new Date().toISOString()
    }));
  }
  return [];
};

const generateRecommendedActions = (decision, breakdown) => {
  const actions = [];
  
  if (decision === 'STOP') {
    actions.push({
      type: 'immediate_stop',
      description: 'Vehicle must be stopped immediately - safety critical',
      priority: 'critical',
      icon: '🛑'
    });
    actions.push({
      type: 'engineer_dispatch',
      description: 'Request immediate engineering assistance',
      priority: 'high',
      icon: '🔧'
    });
  } else if (decision === 'AMBER' || decision === 'CHANGEOVER') {
    actions.push({
      type: 'changeover_required',
      description: 'Arrange vehicle changeover at next suitable location',
      priority: 'high',
      icon: '⚡'
    });
  } else if (decision === 'CONTINUE') {
    actions.push({
      type: 'continue_service',
      description: 'Vehicle cleared to continue in service',
      priority: 'low',
      icon: '✅'
    });
  }
  
  return actions;
};

const formatEditHistory = (activities) => {
  return activities.map(activity => ({
    id: activity.id,
    timestamp: activity.timestamp,
    action: activity.type || activity.activity_type || 'unknown',
    user: activity.supervisor_name || activity.supervisor || 'Unknown',
    details: activity.message || 'No details available'
  }));
};

const isPriorityRoute = (routeOrLocation) => {
  if (!routeOrLocation) return false;
  const priorityRoutes = ['X10', 'X21', '21', '56', '1', 'A19', 'A1', 'M1'];
  return priorityRoutes.some(route => 
    routeOrLocation.toUpperCase().includes(route)
  );
};

const calculateEstimatedCompletion = (assessmentType, currentStep) => {
  const timeEstimates = {
    'steering': 6,
    'brakes': 8,
    'engine': 10,
    'electrical': 7,
    'general': 5
  };
  
  const normalizedType = normalizeWizardType(assessmentType);
  const totalTime = timeEstimates[normalizedType] || 5;
  const remainingSteps = Math.max(0, 5 - currentStep);
  const remainingTime = Math.ceil((remainingSteps / 5) * totalTime);
  
  return remainingTime === 0 ? 'Almost done' : `${remainingTime} mins`;
};

const calculatePriority = (assessment) => {
  if (assessment.issue_category?.toLowerCase().includes('brake') || 
      assessment.issue_category?.toLowerCase().includes('steering')) {
    return 'critical';
  }
  if (isPriorityRoute(assessment.route || assessment.location)) {
    return 'high';
  }
  return 'normal';
};

const formatAuditAction = (action) => {
  const actionMap = {
    'assessment_edit_initiated': 'Assessment Edit Initiated',
    'assessment_edit_completed': 'Assessment Edit Completed',
    'decision_changed': 'Decision Modified',
    'engineer_assigned': 'Engineer Assigned',
    'sdc_acknowledged': 'SDC Acknowledged'
  };
  return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatActivityAction = (activityType) => {
  const actionMap = {
    'wizard_started': 'Assessment Started',
    'wizard_completed': 'Assessment Completed',
    'wizard_step': 'Assessment Step',
    'edit_initiated': 'Edit Initiated',
    'breakdown_reported': 'Breakdown Reported'
  };
  return actionMap[activityType] || activityType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const determineAssessmentStatus = (activities) => {
  const wizardStarted = activities.find(a => a.type === 'wizard_started');
  const wizardCompleted = activities.find(a => a.type === 'wizard_completed');
  
  if (wizardStarted && !wizardCompleted) {
    return 'in_progress';
  } else if (wizardCompleted) {
    return 'completed';
  }
  return 'not_started';
};

const calculateProgressData = (activities) => {
  const stepActivities = activities.filter(a => a.type === 'wizard_step');
  const currentStep = stepActivities.length + 1;
  
  return {
    currentStep: `${Math.min(currentStep, 5)}/5`,
    stepsCompleted: stepActivities.length,
    progress_percentage: Math.round((Math.min(currentStep, 5) / 5) * 100)
  };
};

export default router;