// Enhanced Roadworks Workflow API (Phase 1)
// Provides advanced status management, escalation, and review workflow capabilities

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import supervisorManager from '../services/supervisorManager.js';

const router = express.Router();

// Initialize Supabase client with error handling
let supabase;
try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.log('⚠️ Enhanced Workflow API: Supabase environment variables not configured');
    supabase = null;
  } else {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
    );
    console.log('✅ Enhanced Workflow API: Supabase client initialized');
  }
} catch (error) {
  console.error('❌ Enhanced Workflow API: Failed to initialize Supabase client:', error.message);
  supabase = null;
}

// Enhanced status definitions
const ENHANCED_STATUSES = {
  // Main statuses
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved', 
  ACTIVE: 'active',
  MONITORING: 'monitoring',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
  
  // Sub-statuses for detailed tracking
  SUB_STATUSES: {
    pending_review: ['under_review', 'review_assigned', 'review_overdue'],
    approved: ['awaiting_start', 'ready_to_activate', 'activation_pending'],
    monitoring: ['daily_check', 'weekly_check', 'escalated', 'intervention_required'],
    rejected: ['archived', 'pending_resubmission']
  }
};

const ESCALATION_LEVELS = {
  NORMAL: 0,
  ATTENTION_REQUIRED: 1,
  URGENT: 2,
  CRITICAL: 3,
  EMERGENCY: 4
};

// Helper function to check if Supabase is available
const checkSupabaseAvailability = (res) => {
  if (!supabase) {
    res.status(503).json({
      success: false,
      error: 'Database service temporarily unavailable',
      message: 'The enhanced workflow features require database connectivity. Please try again later.',
      fallback: true
    });
    return false;
  }
  return true;
};

// Middleware to validate supervisor session
const validateSupervisor = (req, res, next) => {
  const sessionId = req.headers['x-session-id'] || req.body.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ success: false, error: 'Session ID required' });
  }
  
  const validation = supervisorManager.validateSupervisorSession(sessionId);
  if (!validation.success) {
    return res.status(401).json({ success: false, error: 'Invalid session' });
  }
  
  req.supervisor = validation.supervisor;
  next();
};

// GET /api/enhanced-workflow/status-definitions
// Returns available statuses and sub-statuses
router.get('/status-definitions', (req, res) => {
  res.json({
    success: true,
    data: {
      statuses: ENHANCED_STATUSES,
      escalationLevels: ESCALATION_LEVELS,
      workflowStages: [
        'initial', 'review', 'planning', 'execution', 'monitoring', 'completion', 'archived'
      ]
    }
  });
});

// GET /api/enhanced-workflow/roadworks
// Get roadworks with enhanced workflow filtering
router.get('/roadworks', validateSupervisor, async (req, res) => {
  try {
    const { 
      status, 
      sub_status, 
      escalation_level, 
      workflow_stage,
      assigned_to,
      overdue_only = false,
      limit = 50,
      offset = 0 
    } = req.query;
    
    let query = supabase
      .from('enhanced_roadworks_workflow')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (status) query = query.eq('status', status);
    if (sub_status) query = query.eq('sub_status', sub_status);
    if (escalation_level) query = query.gte('escalation_level', parseInt(escalation_level));
    if (workflow_stage) query = query.eq('workflow_stage', workflow_stage);
    if (assigned_to) query = query.eq('review_assigned_to', assigned_to);
    if (overdue_only === 'true') query = query.eq('is_overdue', true);
    
    // Pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data || [],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: data?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Enhanced workflow query error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/enhanced-workflow/transition
// Perform enhanced status transition with validation
router.post('/transition', validateSupervisor, async (req, res) => {
  try {
    const {
      roadworkId,
      roadworkType = 'streetworks',
      toStatus,
      toSubStatus,
      transitionReason,
      escalationChange = 0,
      assignTo,
      reviewNotes
    } = req.body;
    
    if (!roadworkId || !toStatus) {
      return res.status(400).json({ 
        success: false, 
        error: 'roadworkId and toStatus are required' 
      });
    }
    
    // Get current roadwork
    const tableName = roadworkType === 'manual_roadworks' ? 'manual_roadworks' : 'streetworks';
    const { data: currentRoadwork, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', roadworkId)
      .single();
    
    if (fetchError) throw fetchError;
    if (!currentRoadwork) {
      return res.status(404).json({ success: false, error: 'Roadwork not found' });
    }
    
    // Validate transition logic
    const transitionValidation = validateStatusTransition(
      currentRoadwork.status, 
      toStatus, 
      currentRoadwork.sub_status, 
      toSubStatus
    );
    
    if (!transitionValidation.valid) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid transition: ${transitionValidation.reason}` 
      });
    }
    
    // Prepare update data
    const updateData = {
      status: toStatus,
      sub_status: toSubStatus,
      updated_at: new Date().toISOString(),
      updated_by: req.supervisor.name
    };
    
    // Handle escalation changes
    if (escalationChange !== 0) {
      updateData.escalation_level = Math.max(0, (currentRoadwork.escalation_level || 0) + escalationChange);
    }
    
    // Handle review assignment
    if (assignTo) {
      updateData.review_assigned_to = assignTo;
      updateData.review_assigned_at = new Date().toISOString();
    }
    
    // Add review notes
    if (reviewNotes) {
      updateData.review_notes = reviewNotes;
    }
    
    // Set next review date for monitoring status
    if (toStatus === 'monitoring') {
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + (toSubStatus === 'daily_check' ? 1 : 7));
      updateData.next_review_date = nextReviewDate.toISOString().split('T')[0];
    }
    
    // Update workflow stage
    updateData.workflow_stage = getWorkflowStage(toStatus);
    
    // Perform the update
    const { data: updatedRoadwork, error: updateError } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', roadworkId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Log the transition
    await logStatusTransition({
      roadworkId,
      roadworkType,
      fromStatus: currentRoadwork.status,
      toStatus,
      fromSubStatus: currentRoadwork.sub_status,
      toSubStatus,
      transitionType: 'manual',
      triggeredBy: req.supervisor.name,
      transitionReason,
      escalationLevelChange: escalationChange
    });
    
    // Handle escalation tracking if escalation changed
    if (escalationChange > 0) {
      await createEscalation({
        roadworkId,
        roadworkType,
        escalationLevel: updateData.escalation_level,
        escalatedBy: req.supervisor.name,
        escalationReason: transitionReason || 'Manual escalation',
        assignedTo: assignTo || req.supervisor.name
      });
    }
    
    // Create review assignment if needed
    if (assignTo && toStatus === 'pending_review') {
      await createReviewAssignment({
        roadworkId,
        roadworkType,
        assignedTo: assignTo,
        assignedBy: req.supervisor.name,
        assignmentReason: 'Manual assignment',
        priority: updateData.escalation_level > 1 ? 1 : 3
      });
    }
    
    res.json({
      success: true,
      data: updatedRoadwork,
      message: `Status transitioned from ${currentRoadwork.status} to ${toStatus}`
    });
    
  } catch (error) {
    console.error('Status transition error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/enhanced-workflow/escalate
// Escalate a roadwork item
router.post('/escalate', validateSupervisor, async (req, res) => {
  try {
    const {
      roadworkId,
      roadworkType = 'streetworks',
      escalationReason,
      assignTo,
      expectedResolutionDate
    } = req.body;
    
    if (!roadworkId || !escalationReason) {
      return res.status(400).json({ 
        success: false, 
        error: 'roadworkId and escalationReason are required' 
      });
    }
    
    // Get current roadwork
    const tableName = roadworkType === 'manual_roadworks' ? 'manual_roadworks' : 'streetworks';
    const { data: roadwork } = await supabase
      .from(tableName)
      .select('escalation_level')
      .eq('id', roadworkId)
      .single();
    
    const newEscalationLevel = Math.min(4, (roadwork?.escalation_level || 0) + 1);
    
    // Update escalation level
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ 
        escalation_level: newEscalationLevel,
        updated_by: req.supervisor.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', roadworkId);
    
    if (updateError) throw updateError;
    
    // Create escalation record
    await createEscalation({
      roadworkId,
      roadworkType,
      escalationLevel: newEscalationLevel,
      escalatedBy: req.supervisor.name,
      escalationReason,
      assignedTo: assignTo || req.supervisor.name,
      expectedResolutionDate
    });
    
    res.json({
      success: true,
      message: `Roadwork escalated to level ${newEscalationLevel}`,
      escalationLevel: newEscalationLevel
    });
    
  } catch (error) {
    console.error('Escalation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/enhanced-workflow/analytics
// Get workflow analytics and performance metrics
router.get('/analytics', validateSupervisor, async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    const days = timeframe === '30d' ? 30 : timeframe === '7d' ? 7 : 1;
    startDate.setDate(startDate.getDate() - days);
    
    // Get status distribution
    const { data: statusStats } = await supabase
      .from('streetworks')
      .select('status, escalation_level')
      .gte('created_at', startDate.toISOString());
    
    // Get transition stats
    const { data: transitionStats } = await supabase
      .from('roadwork_status_transitions')
      .select('*')
      .gte('created_at', startDate.toISOString());
    
    // Get escalation stats
    const { data: escalationStats } = await supabase
      .from('roadwork_escalations')
      .select('*')
      .gte('created_at', startDate.toISOString());
    
    // Process analytics
    const analytics = {
      statusDistribution: processStatusDistribution(statusStats || []),
      transitionMetrics: processTransitionMetrics(transitionStats || []),
      escalationMetrics: processEscalationMetrics(escalationStats || []),
      overallMetrics: {
        totalRoadworks: statusStats?.length || 0,
        totalTransitions: transitionStats?.length || 0,
        totalEscalations: escalationStats?.length || 0,
        averageResolutionTime: calculateAverageResolutionTime(transitionStats || [])
      }
    };
    
    res.json({
      success: true,
      data: analytics,
      timeframe,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions
function validateStatusTransition(fromStatus, toStatus, fromSubStatus, toSubStatus) {
  // Define valid transitions
  const validTransitions = {
    'pending_review': ['approved', 'rejected', 'monitoring'],
    'approved': ['active', 'monitoring', 'rejected'],
    'active': ['monitoring', 'completed', 'rejected'],
    'monitoring': ['active', 'completed', 'escalated'],
    'completed': ['archived'],
    'rejected': ['archived', 'pending_review']
  };
  
  const allowedTransitions = validTransitions[fromStatus] || [];
  
  if (!allowedTransitions.includes(toStatus)) {
    return {
      valid: false,
      reason: `Cannot transition from ${fromStatus} to ${toStatus}`
    };
  }
  
  return { valid: true };
}

function getWorkflowStage(status) {
  const stageMap = {
    'pending_review': 'review',
    'approved': 'planning',
    'active': 'execution',
    'monitoring': 'monitoring',
    'completed': 'completion',
    'rejected': 'archived',
    'archived': 'archived'
  };
  
  return stageMap[status] || 'initial';
}

async function logStatusTransition(transitionData) {
  const { error } = await supabase
    .from('roadwork_status_transitions')
    .insert([{
      roadwork_id: transitionData.roadworkId,
      roadwork_type: transitionData.roadworkType,
      from_status: transitionData.fromStatus,
      to_status: transitionData.toStatus,
      from_sub_status: transitionData.fromSubStatus,
      to_sub_status: transitionData.toSubStatus,
      transition_type: transitionData.transitionType,
      triggered_by: transitionData.triggeredBy,
      transition_reason: transitionData.transitionReason,
      escalation_level_change: transitionData.escalationLevelChange || 0
    }]);
  
  if (error) console.error('Failed to log status transition:', error);
}

async function createEscalation(escalationData) {
  const { error } = await supabase
    .from('roadwork_escalations')
    .insert([{
      roadwork_id: escalationData.roadworkId,
      roadwork_type: escalationData.roadworkType,
      escalation_level: escalationData.escalationLevel,
      escalated_by: escalationData.escalatedBy,
      escalation_reason: escalationData.escalationReason,
      assigned_to: escalationData.assignedTo,
      expected_resolution_date: escalationData.expectedResolutionDate
    }]);
  
  if (error) console.error('Failed to create escalation:', error);
}

async function createReviewAssignment(assignmentData) {
  const { error } = await supabase
    .from('roadwork_review_assignments')
    .insert([{
      roadwork_id: assignmentData.roadworkId,
      roadwork_type: assignmentData.roadworkType,
      assigned_to: assignmentData.assignedTo,
      assigned_by: assignmentData.assignedBy,
      assignment_reason: assignmentData.assignmentReason,
      priority: assignmentData.priority || 3,
      due_date: assignmentData.dueDate
    }]);
  
  if (error) console.error('Failed to create review assignment:', error);
}

function processStatusDistribution(statusData) {
  const distribution = {};
  statusData.forEach(item => {
    distribution[item.status] = (distribution[item.status] || 0) + 1;
  });
  return distribution;
}

function processTransitionMetrics(transitionData) {
  const metrics = {
    totalTransitions: transitionData.length,
    transitionsByType: {},
    averageTransitionTime: 0
  };
  
  transitionData.forEach(transition => {
    const key = `${transition.from_status}_to_${transition.to_status}`;
    metrics.transitionsByType[key] = (metrics.transitionsByType[key] || 0) + 1;
  });
  
  return metrics;
}

function processEscalationMetrics(escalationData) {
  return {
    totalEscalations: escalationData.length,
    byLevel: escalationData.reduce((acc, esc) => {
      acc[esc.escalation_level] = (acc[esc.escalation_level] || 0) + 1;
      return acc;
    }, {}),
    unresolved: escalationData.filter(esc => !esc.resolved_at).length
  };
}

function calculateAverageResolutionTime(transitionData) {
  // Simplified calculation - could be enhanced
  const completedTransitions = transitionData.filter(t => t.to_status === 'completed');
  if (completedTransitions.length === 0) return 0;
  
  // Return average time in hours (simplified)
  return 24; // Placeholder
}

export default router;