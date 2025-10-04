/**
 * Breakdowns API Routes for SDC Dashboard Integration
 * Provides real-time breakdown data, assessment tracking, and audit capabilities
 */

import express from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../server.js';
import webSocketHandler from './webSocketHandler.js';
import Joi from 'joi';
import {
  validateBody,
  acknowledgeBreakdownSchema,
  recordDecisionSchema,
  addNoteSchema,
  requestEngineeringSchema,
  sanitizeNotes
} from '../middleware/validationMiddleware.js';
import { activityLogger, ACTIVITY_TYPES, SEVERITY_LEVELS } from '../services/activityLogger.js';

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
    
    // Query Supabase for active breakdowns (exclude resolved)
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

// POST /api/sdc/acknowledge - SDC acknowledges a breakdown
router.post('/acknowledge', validateBody(acknowledgeBreakdownSchema), sanitizeNotes, async (req, res) => {
  try {
    const { breakdown_id, acknowledged_by, supervisor_badge, notes } = req.body;

    console.log(`✅ SDC API: Acknowledging breakdown ${breakdown_id}`);

    // Validation
    if (!breakdown_id) {
      return res.status(400).json({
        success: false,
        error: 'breakdown_id is required'
      });
    }

    const acknowledgedAt = new Date().toISOString();

    // Update breakdown in Supabase
    const { data: breakdown, error: updateError } = await supabase
      .from('breakdowns')
      .update({
        acknowledged_at: acknowledgedAt,
        acknowledged_by: acknowledged_by || supervisor_badge || 'SDC',
        sdc_notes: notes || null,
        status: 'acknowledged'
      })
      .eq('breakdown_id', breakdown_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating breakdown:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to acknowledge breakdown',
        details: updateError.message
      });
    }

    // Log activity
    const activitiesData = loadJSONFile(ACTIVITIES_PATH, { activities: [] });
    const newActivity = {
      id: Date.now(),
      timestamp: acknowledgedAt,
      type: 'sdc_acknowledged',
      activity_type: 'sdc_acknowledged',
      breakdown_id: breakdown_id,
      fleet_no: breakdown?.fleet_number,
      fleet_number: breakdown?.fleet_number,
      supervisor_badge: supervisor_badge || acknowledged_by,
      message: `SDC acknowledged breakdown${notes ? ': ' + notes : ''}`,
      notes: notes
    };

    activitiesData.activities.unshift(newActivity);
    if (activitiesData.activities.length > 500) {
      activitiesData.activities = activitiesData.activities.slice(0, 500);
    }
    saveJSONFile(ACTIVITIES_PATH, activitiesData);

    // Log audit event
    logAuditEvent({
      action: 'sdc_acknowledged',
      breakdown_id: breakdown_id,
      user_type: 'sdc_operator',
      acknowledged_by: acknowledged_by || supervisor_badge || 'SDC',
      notes: notes,
      metadata: {
        fleet_number: breakdown?.fleet_number,
        location: breakdown?.location
      }
    });

    const response = {
      success: true,
      message: 'Breakdown acknowledged successfully',
      breakdown_id: breakdown_id,
      acknowledged_at: acknowledgedAt,
      breakdown: breakdown,
      timestamp: new Date().toISOString()
    };

    // Broadcast to WebSocket clients
    webSocketHandler.broadcast('sdc-dashboard', {
      type: 'sdc_acknowledged',
      breakdown_id: breakdown_id,
      breakdown: breakdown,
      acknowledged_at: acknowledgedAt,
      acknowledged_by: acknowledged_by || supervisor_badge || 'SDC',
      timestamp: acknowledgedAt
    });

    console.log(`✅ SDC API: Breakdown ${breakdown_id} acknowledged`);

    res.json(response);

  } catch (error) {
    console.error('Error acknowledging breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge breakdown',
      message: error.message
    });
  }
});

// POST /api/sdc/decision - SDC records operational decision
router.post('/decision', validateBody(recordDecisionSchema), sanitizeNotes, async (req, res) => {
  try {
    const { breakdown_id, decision, decided_by, supervisor_badge, notes, decision_notes } = req.body;

    console.log(`📋 SDC API: Recording decision for breakdown ${breakdown_id}: ${decision}`);

    // Validation
    if (!breakdown_id) {
      return res.status(400).json({
        success: false,
        error: 'breakdown_id is required'
      });
    }

    if (!decision) {
      return res.status(400).json({
        success: false,
        error: 'decision is required (STOP, AMBER, CONTINUE)'
      });
    }

    // Validate decision value
    const validDecisions = ['STOP', 'AMBER', 'CONTINUE', 'CHANGEOVER'];
    if (!validDecisions.includes(decision.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid decision. Must be one of: ${validDecisions.join(', ')}`
      });
    }

    const decisionAt = new Date().toISOString();
    const normalizedDecision = decision.toUpperCase();

    // Update breakdown in Supabase
    const { data: breakdown, error: updateError } = await supabase
      .from('breakdowns')
      .update({
        decision_at: decisionAt,
        decided_by: decided_by || supervisor_badge || 'SDC',
        sdc_decision: normalizedDecision,
        decision_notes: decision_notes || notes || null,
        severity: normalizedDecision,
        status: 'decision_made'
      })
      .eq('breakdown_id', breakdown_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating breakdown decision:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to record decision',
        details: updateError.message
      });
    }

    // Log activity
    const activitiesData = loadJSONFile(ACTIVITIES_PATH, { activities: [] });
    const newActivity = {
      id: Date.now(),
      timestamp: decisionAt,
      type: 'sdc_decision',
      activity_type: 'sdc_decision',
      breakdown_id: breakdown_id,
      fleet_no: breakdown?.fleet_number,
      fleet_number: breakdown?.fleet_number,
      supervisor_badge: supervisor_badge || decided_by,
      decision: normalizedDecision,
      message: `SDC decision: ${normalizedDecision}${decision_notes || notes ? ' - ' + (decision_notes || notes) : ''}`,
      notes: decision_notes || notes
    };

    activitiesData.activities.unshift(newActivity);
    if (activitiesData.activities.length > 500) {
      activitiesData.activities = activitiesData.activities.slice(0, 500);
    }
    saveJSONFile(ACTIVITIES_PATH, activitiesData);

    // Log audit event
    logAuditEvent({
      action: 'sdc_decision_recorded',
      breakdown_id: breakdown_id,
      user_type: 'sdc_operator',
      decided_by: decided_by || supervisor_badge || 'SDC',
      decision: normalizedDecision,
      notes: decision_notes || notes,
      metadata: {
        fleet_number: breakdown?.fleet_number,
        location: breakdown?.location,
        severity: normalizedDecision
      }
    });

    const response = {
      success: true,
      message: `Decision recorded: ${normalizedDecision}`,
      breakdown_id: breakdown_id,
      decision: normalizedDecision,
      decision_at: decisionAt,
      breakdown: breakdown,
      timestamp: new Date().toISOString()
    };

    // Broadcast to WebSocket clients
    webSocketHandler.broadcast('sdc-dashboard', {
      type: 'sdc_decision',
      breakdown_id: breakdown_id,
      breakdown: breakdown,
      decision: normalizedDecision,
      decision_at: decisionAt,
      decided_by: decided_by || supervisor_badge || 'SDC',
      notes: decision_notes || notes,
      timestamp: decisionAt
    });

    console.log(`📋 SDC API: Decision ${normalizedDecision} recorded for ${breakdown_id}`);

    res.json(response);

  } catch (error) {
    console.error('Error recording decision:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record decision',
      message: error.message
    });
  }
});

// POST /api/sdc/add-note - Add operational note to breakdown
router.post('/add-note', validateBody(addNoteSchema), sanitizeNotes, async (req, res) => {
  try {
    const { breakdown_id, note, added_by, supervisor_badge, note_type } = req.body;

    console.log(`📝 SDC API: Adding note to breakdown ${breakdown_id}`);

    // Validation
    if (!breakdown_id) {
      return res.status(400).json({
        success: false,
        error: 'breakdown_id is required'
      });
    }

    if (!note || note.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'note is required and cannot be empty'
      });
    }

    // Sanitize note (basic protection against XSS)
    const sanitizedNote = note.trim().substring(0, 1000); // Max 1000 chars
    const noteTimestamp = new Date().toISOString();

    // Get current breakdown to append note
    const { data: currentBreakdown, error: fetchError } = await supabase
      .from('breakdowns')
      .select('sdc_notes, fleet_number, location')
      .eq('breakdown_id', breakdown_id)
      .single();

    if (fetchError || !currentBreakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    // Create note entry
    const noteEntry = {
      timestamp: noteTimestamp,
      note: sanitizedNote,
      added_by: added_by || supervisor_badge || 'SDC',
      note_type: note_type || 'operational'
    };

    // Append to existing notes (stored as JSONB array)
    let updatedNotes = [];
    try {
      if (currentBreakdown.sdc_notes) {
        if (typeof currentBreakdown.sdc_notes === 'string') {
          updatedNotes = JSON.parse(currentBreakdown.sdc_notes);
        } else if (Array.isArray(currentBreakdown.sdc_notes)) {
          updatedNotes = currentBreakdown.sdc_notes;
        }
      }
    } catch (e) {
      console.warn('Could not parse existing notes, starting fresh');
    }

    updatedNotes.unshift(noteEntry);

    // Keep only last 50 notes
    if (updatedNotes.length > 50) {
      updatedNotes = updatedNotes.slice(0, 50);
    }

    // Update breakdown in Supabase
    const { data: breakdown, error: updateError } = await supabase
      .from('breakdowns')
      .update({
        sdc_notes: updatedNotes,
        last_note_at: noteTimestamp
      })
      .eq('breakdown_id', breakdown_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error adding note to breakdown:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to add note',
        details: updateError.message
      });
    }

    // Log activity
    const activitiesData = loadJSONFile(ACTIVITIES_PATH, { activities: [] });
    const newActivity = {
      id: Date.now(),
      timestamp: noteTimestamp,
      type: 'note_added',
      activity_type: 'note_added',
      breakdown_id: breakdown_id,
      fleet_no: currentBreakdown.fleet_number,
      fleet_number: currentBreakdown.fleet_number,
      supervisor_badge: supervisor_badge || added_by,
      message: `Note added: ${sanitizedNote.substring(0, 100)}${sanitizedNote.length > 100 ? '...' : ''}`,
      note: sanitizedNote,
      note_type: note_type || 'operational'
    };

    activitiesData.activities.unshift(newActivity);
    if (activitiesData.activities.length > 500) {
      activitiesData.activities = activitiesData.activities.slice(0, 500);
    }
    saveJSONFile(ACTIVITIES_PATH, activitiesData);

    // Log audit event
    logAuditEvent({
      action: 'note_added',
      breakdown_id: breakdown_id,
      user_type: 'sdc_operator',
      added_by: added_by || supervisor_badge || 'SDC',
      note_preview: sanitizedNote.substring(0, 100),
      note_type: note_type || 'operational',
      metadata: {
        fleet_number: currentBreakdown.fleet_number,
        location: currentBreakdown.location,
        note_length: sanitizedNote.length
      }
    });

    const response = {
      success: true,
      message: 'Note added successfully',
      breakdown_id: breakdown_id,
      note: noteEntry,
      total_notes: updatedNotes.length,
      timestamp: noteTimestamp
    };

    // Broadcast to WebSocket clients
    webSocketHandler.broadcast('sdc-dashboard', {
      type: 'note_added',
      breakdown_id: breakdown_id,
      note: noteEntry,
      total_notes: updatedNotes.length,
      fleet_number: currentBreakdown.fleet_number,
      timestamp: noteTimestamp
    });

    console.log(`📝 SDC API: Note added to breakdown ${breakdown_id}`);

    res.json(response);

  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add note',
      message: error.message
    });
  }
});

// POST /api/sdc/request-engineering - Request engineering assistance
router.post('/request-engineering', validateBody(requestEngineeringSchema), sanitizeNotes, async (req, res) => {
  try {
    const {
      breakdown_id,
      requested_by,
      supervisor_badge,
      priority,
      notes,
      required_skills,
      estimated_arrival
    } = req.body;

    console.log(`🔧 SDC API: Requesting engineering for breakdown ${breakdown_id}`);

    // Validation
    if (!breakdown_id) {
      return res.status(400).json({
        success: false,
        error: 'breakdown_id is required'
      });
    }

    const requestedAt = new Date().toISOString();
    const requestPriority = priority || 'normal';

    // Validate priority
    const validPriorities = ['critical', 'high', 'normal', 'low'];
    if (!validPriorities.includes(requestPriority)) {
      return res.status(400).json({
        success: false,
        error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
      });
    }

    // Get breakdown details
    const { data: currentBreakdown, error: fetchError } = await supabase
      .from('breakdowns')
      .select('*')
      .eq('breakdown_id', breakdown_id)
      .single();

    if (fetchError || !currentBreakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    // Create engineering request object
    const engineeringRequest = {
      request_id: `ENG-${Date.now()}`,
      breakdown_id: breakdown_id,
      requested_at: requestedAt,
      requested_by: requested_by || supervisor_badge || 'SDC',
      priority: requestPriority,
      notes: notes || null,
      required_skills: required_skills || [],
      estimated_arrival: estimated_arrival || null,
      status: 'pending',
      fleet_number: currentBreakdown.fleet_number,
      location: currentBreakdown.location,
      issue_category: currentBreakdown.issue_category
    };

    // Update breakdown in Supabase
    const { data: breakdown, error: updateError } = await supabase
      .from('breakdowns')
      .update({
        engineering_requested_at: requestedAt,
        engineering_request_priority: requestPriority,
        engineering_notes: notes || null,
        status: 'engineering_requested'
      })
      .eq('breakdown_id', breakdown_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error requesting engineering:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to request engineering',
        details: updateError.message
      });
    }

    // Log activity
    const activitiesData = loadJSONFile(ACTIVITIES_PATH, { activities: [] });
    const newActivity = {
      id: Date.now(),
      timestamp: requestedAt,
      type: 'engineering_requested',
      activity_type: 'engineering_requested',
      breakdown_id: breakdown_id,
      fleet_no: currentBreakdown.fleet_number,
      fleet_number: currentBreakdown.fleet_number,
      supervisor_badge: supervisor_badge || requested_by,
      message: `Engineering requested - Priority: ${requestPriority}${notes ? ' - ' + notes : ''}`,
      priority: requestPriority,
      notes: notes,
      engineering_request: engineeringRequest
    };

    activitiesData.activities.unshift(newActivity);
    if (activitiesData.activities.length > 500) {
      activitiesData.activities = activitiesData.activities.slice(0, 500);
    }
    saveJSONFile(ACTIVITIES_PATH, activitiesData);

    // Log audit event
    logAuditEvent({
      action: 'engineering_requested',
      breakdown_id: breakdown_id,
      user_type: 'sdc_operator',
      requested_by: requested_by || supervisor_badge || 'SDC',
      priority: requestPriority,
      notes: notes,
      metadata: {
        fleet_number: currentBreakdown.fleet_number,
        location: currentBreakdown.location,
        issue_category: currentBreakdown.issue_category,
        required_skills: required_skills,
        estimated_arrival: estimated_arrival,
        request_id: engineeringRequest.request_id
      }
    });

    const response = {
      success: true,
      message: `Engineering assistance requested - Priority: ${requestPriority}`,
      breakdown_id: breakdown_id,
      engineering_request: engineeringRequest,
      requested_at: requestedAt,
      breakdown: breakdown,
      timestamp: new Date().toISOString()
    };

    // Broadcast to WebSocket clients
    webSocketHandler.broadcast('sdc-dashboard', {
      type: 'engineering_requested',
      breakdown_id: breakdown_id,
      breakdown: breakdown,
      engineering_request: engineeringRequest,
      priority: requestPriority,
      requested_at: requestedAt,
      requested_by: requested_by || supervisor_badge || 'SDC',
      timestamp: requestedAt
    });

    console.log(`🔧 SDC API: Engineering requested for ${breakdown_id} with priority ${requestPriority}`);

    res.json(response);

  } catch (error) {
    console.error('Error requesting engineering:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request engineering',
      message: error.message
    });
  }
});

// POST /api/sdc/resolve - Mark breakdown as resolved/completed
router.post('/resolve', validateBody(Joi.object({
  breakdown_id: Joi.string()
    .required()
    .trim()
    .max(50)
    .pattern(/^[A-Z0-9-]+$/)
    .messages({
      'string.empty': 'Breakdown ID is required',
      'string.pattern.base': 'Breakdown ID must contain only uppercase letters, numbers, and hyphens',
      'any.required': 'Breakdown ID is required'
    }),

  resolved_by: Joi.string()
    .trim()
    .max(100)
    .default('SDC')
    .messages({
      'string.max': 'Resolved by name cannot exceed 100 characters'
    }),

  supervisor_badge: Joi.string()
    .trim()
    .max(20)
    .pattern(/^[A-Z0-9]+$/)
    .messages({
      'string.max': 'Supervisor badge cannot exceed 20 characters',
      'string.pattern.base': 'Supervisor badge must contain only uppercase letters and numbers'
    }),

  resolution_notes: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .messages({
      'string.max': 'Resolution notes cannot exceed 1000 characters'
    }),

  returned_to_service: Joi.boolean()
    .default(true),

  resolution_type: Joi.string()
    .lowercase()
    .valid('fixed', 'changeover', 'cancelled', 'duplicate', 'other')
    .default('fixed')
    .messages({
      'any.only': 'Resolution type must be one of: fixed, changeover, cancelled, duplicate, other'
    })
})), sanitizeNotes, async (req, res) => {
  try {
    const {
      breakdown_id,
      resolved_by,
      supervisor_badge,
      resolution_notes,
      returned_to_service,
      resolution_type
    } = req.body;

    console.log(`✅ SDC API: Resolving breakdown ${breakdown_id}`);

    // Verify breakdown exists
    const { data: currentBreakdown, error: fetchError } = await supabase
      .from('breakdowns')
      .select('*')
      .eq('breakdown_id', breakdown_id)
      .single();

    if (fetchError || !currentBreakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found',
        code: 'BREAKDOWN_NOT_FOUND',
        breakdown_id: breakdown_id,
        timestamp: new Date().toISOString()
      });
    }

    // Check if already resolved
    if (currentBreakdown.status === 'cleared' || currentBreakdown.status === 'resolved') {
      return res.status(400).json({
        success: false,
        error: 'Breakdown already resolved',
        code: 'ALREADY_RESOLVED',
        breakdown_id: breakdown_id,
        resolved_at: currentBreakdown.updated_at,
        timestamp: new Date().toISOString()
      });
    }

    const resolvedAt = new Date().toISOString();
    const resolvingUser = resolved_by || supervisor_badge || 'SDC';

    // Update breakdown status to resolved in database
    const { data: breakdown, error: updateError } = await supabase
      .from('breakdowns')
      .update({
        status: 'cleared',
        resolved_at: resolvedAt,
        resolved_by: resolvingUser,
        resolution_notes: resolution_notes || null,
        resolution_type: resolution_type,
        returned_to_service: returned_to_service
      })
      .eq('breakdown_id', breakdown_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating breakdown resolution:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update breakdown resolution',
        code: 'UPDATE_ERROR',
        details: process.env.NODE_ENV === 'development' ? updateError.message : undefined,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ Breakdown ${breakdown_id} marked as resolved in database`);

    // Log activity to database using Activity Logger
    const activityData = await activityLogger.logActivity({
      activityType: ACTIVITY_TYPES.BREAKDOWN_RESOLVED,
      action: `resolved ${resolution_type} - ${breakdown.fleet_number || breakdown.fleet_no}`,
      actorType: 'supervisor',
      actorId: supervisor_badge || 'SDC',
      actorName: resolvingUser,
      entityType: 'breakdown',
      entityId: breakdown_id,
      entityDetails: {
        fleetNo: breakdown.fleet_number || breakdown.fleet_no,
        location: breakdown.location,
        issueCategory: breakdown.issue_category,
        resolutionType: resolution_type,
        returnedToService: returned_to_service
      },
      depot: breakdown.depot,
      severity: returned_to_service ? SEVERITY_LEVELS.SUCCESS : SEVERITY_LEVELS.INFO,
      source: 'sdc_operations',
      metadata: {
        resolutionNotes: resolution_notes,
        elapsedTime: Math.floor((new Date(resolvedAt) - new Date(breakdown.created_at)) / 1000 / 60)
      },
      icon: returned_to_service ? '✅' : '📋',
      message: `Breakdown ${breakdown_id} resolved by ${resolvingUser} - ${resolution_type}${resolution_notes ? ': ' + resolution_notes : ''}`
    });

    console.log(`📝 Activity logged to database:`, activityData?.id || 'queued');

    // Log audit event
    logAuditEvent({
      action: 'breakdown_resolved',
      breakdown_id: breakdown_id,
      user_type: 'sdc_operator',
      resolved_by: resolvingUser,
      resolution_type: resolution_type,
      returned_to_service: returned_to_service,
      metadata: {
        fleet_number: breakdown.fleet_number,
        location: breakdown.location,
        issue_category: breakdown.issue_category,
        resolution_notes: resolution_notes,
        elapsed_time_minutes: Math.floor((new Date(resolvedAt) - new Date(breakdown.created_at)) / 1000 / 60)
      }
    });

    const response = {
      success: true,
      message: 'Breakdown resolved successfully',
      breakdown_id: breakdown_id,
      resolution_type: resolution_type,
      resolved_at: resolvedAt,
      resolved_by: resolvingUser,
      returned_to_service: returned_to_service,
      breakdown: breakdown,
      timestamp: resolvedAt
    };

    // Broadcast to WebSocket clients - breakdown resolved event
    webSocketHandler.broadcast('sdc-dashboard', {
      type: 'breakdown_resolved',
      breakdown_id: breakdown_id,
      breakdown: breakdown,
      resolution_type: resolution_type,
      resolved_at: resolvedAt,
      resolved_by: resolvingUser,
      returned_to_service: returned_to_service,
      resolution_notes: resolution_notes,
      timestamp: resolvedAt
    });

    // Broadcast activity created event for activity feed sync
    if (activityData) {
      webSocketHandler.broadcast('sdc-dashboard', {
        type: 'activity_created',
        activity: activityData,
        timestamp: resolvedAt
      });

      // Also broadcast to general channel for other dashboards
      webSocketHandler.broadcast('general', {
        type: 'activity_created',
        activity: activityData,
        timestamp: resolvedAt
      });
    }

    console.log(`✅ SDC API: Breakdown ${breakdown_id} resolved - ${resolution_type}`);

    res.json(response);
  } catch (error) {
    console.error('❌ SDC API: Error resolving breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve breakdown',
      code: 'RESOLVE_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
