// Breakdown Assessment API with Supervisor Authentication
// Logs all breakdown assessments with complete supervisor tracking

import express from 'express';
import { supabase } from '../services/supabaseService.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify supervisor authentication
const verifySupervisor = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No authentication token provided' 
            });
        }
        
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Verify supervisor exists in database
        const { data: supervisor, error } = await supabase
            .from('supervisors')
            .select('*')
            .eq('badge_number', decoded.badgeNumber)
            .single();
            
        if (error || !supervisor) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid supervisor credentials' 
            });
        }
        
        // Attach supervisor to request
        req.supervisor = supervisor;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication failed' 
        });
    }
};

// Log a complete breakdown assessment
router.post('/log-assessment', verifySupervisor, async (req, res) => {
    try {
        const assessment = req.body;
        const supervisor = req.supervisor;
        
        console.log(`Logging assessment for supervisor ${supervisor.badge_number}`);
        
        // Validate required fields
        if (!assessment.wizardType || !assessment.fleetNumber || !assessment.finalDecision) {
            return res.status(400).json({
                success: false,
                message: 'Missing required assessment fields'
            });
        }
        
        // Create assessment record with supervisor verification
        const assessmentRecord = {
            // Core identification
            assessment_id: assessment.id,
            timestamp: assessment.timestamp || new Date().toISOString(),
            
            // Supervisor information (verified from token)
            supervisor_badge: supervisor.badge_number,
            supervisor_name: supervisor.name,
            supervisor_depot: supervisor.depot,
            supervisor_admin: supervisor.is_admin || false,
            
            // Vehicle information
            fleet_number: assessment.fleetNumber,
            vehicle_depot: assessment.vehicleDepot || assessment.depot,
            
            // Assessment details
            wizard_type: assessment.wizardType,
            final_decision: assessment.finalDecision, // STOP, AMBER, or CONTINUE
            safety_critical: assessment.finalDecision === 'STOP',
            
            // Duration and metrics
            start_time: assessment.startTime,
            end_time: assessment.endTime,
            duration_seconds: assessment.duration,
            total_actions: assessment.totalActions || assessment.actions?.length || 0,
            
            // Complete responses and actions
            responses: assessment.allResponses || assessment.responses,
            action_log: assessment.actions || [],
            
            // Additional context
            driver_name: assessment.allResponses?.driverName,
            driver_wellbeing: assessment.allResponses?.driverWellbeing,
            route: assessment.allResponses?.route,
            location: assessment.allResponses?.location,
            
            // Metadata
            browser_info: assessment.auditLog?.browserInfo,
            created_at: new Date().toISOString()
        };
        
        // Insert into breakdown_assessments table
        const { data: insertedAssessment, error: insertError } = await supabase
            .from('breakdown_assessments')
            .insert([assessmentRecord])
            .select()
            .single();
            
        if (insertError) {
            console.error('Failed to insert assessment:', insertError);
            
            // If table doesn't exist, try to create it
            if (insertError.code === '42P01') {
                await createAssessmentTable();
                // Retry insertion
                const { data: retryData, error: retryError } = await supabase
                    .from('breakdown_assessments')
                    .insert([assessmentRecord])
                    .select()
                    .single();
                    
                if (retryError) {
                    throw retryError;
                }
                
                insertedAssessment = retryData;
            } else {
                throw insertError;
            }
        }
        
        // Log each action separately for detailed audit trail
        if (assessment.actions && assessment.actions.length > 0) {
            const actionRecords = assessment.actions.map(action => ({
                assessment_id: assessment.id,
                supervisor_badge: supervisor.badge_number,
                timestamp: action.timestamp,
                action_type: action.actionType,
                details: action.details,
                sequence_number: action.sequenceNumber,
                created_at: new Date().toISOString()
            }));
            
            const { error: actionsError } = await supabase
                .from('breakdown_action_logs')
                .insert(actionRecords);
                
            if (actionsError && actionsError.code === '42P01') {
                // Table doesn't exist, create it
                await createActionLogsTable();
                // Retry
                await supabase
                    .from('breakdown_action_logs')
                    .insert(actionRecords);
            }
        }
        
        // Log supervisor activity
        await logSupervisorActivity(supervisor.badge_number, 'BREAKDOWN_ASSESSMENT', {
            assessment_id: assessment.id,
            wizard_type: assessment.wizardType,
            decision: assessment.finalDecision,
            fleet_number: assessment.fleetNumber
        });
        
        // Check for patterns if it's a STOP decision
        if (assessment.finalDecision === 'STOP') {
            await checkAndAlertPatterns(assessment.fleetNumber, assessment.wizardType);
        }
        
        console.log(`Assessment ${assessment.id} logged successfully`);
        
        res.json({
            success: true,
            message: 'Assessment logged successfully',
            assessmentId: assessment.id,
            decision: assessment.finalDecision
        });
        
    } catch (error) {
        console.error('Error logging assessment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to log assessment',
            error: error.message
        });
    }
});

// Get assessment history for a supervisor
router.get('/my-assessments', verifySupervisor, async (req, res) => {
    try {
        const supervisor = req.supervisor;
        const { days = 7 } = req.query;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
        
        const { data: assessments, error } = await supabase
            .from('breakdown_assessments')
            .select('*')
            .eq('supervisor_badge', supervisor.badge_number)
            .gte('timestamp', cutoffDate.toISOString())
            .order('timestamp', { ascending: false });
            
        if (error) throw error;
        
        res.json({
            success: true,
            assessments: assessments || [],
            supervisor: supervisor.badge_number,
            period: `Last ${days} days`
        });
        
    } catch (error) {
        console.error('Error fetching assessments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assessments',
            error: error.message
        });
    }
});

// Get breakdown statistics
router.get('/statistics', verifySupervisor, async (req, res) => {
    try {
        const { depot, days = 30 } = req.query;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
        
        let query = supabase
            .from('breakdown_assessments')
            .select('*')
            .gte('timestamp', cutoffDate.toISOString());
            
        if (depot) {
            query = query.eq('vehicle_depot', depot);
        }
        
        const { data: assessments, error } = await query;
        
        if (error) throw error;
        
        // Calculate statistics
        const stats = {
            totalAssessments: assessments.length,
            byDecision: {
                stop: assessments.filter(a => a.final_decision === 'STOP').length,
                amber: assessments.filter(a => a.final_decision === 'AMBER').length,
                continue: assessments.filter(a => a.final_decision === 'CONTINUE').length
            },
            byWizardType: {},
            bySupervisor: {},
            criticalIssues: assessments.filter(a => a.safety_critical).length,
            averageDuration: assessments.reduce((sum, a) => sum + (a.duration_seconds || 0), 0) / assessments.length
        };
        
        // Group by wizard type
        assessments.forEach(a => {
            stats.byWizardType[a.wizard_type] = (stats.byWizardType[a.wizard_type] || 0) + 1;
            stats.bySupervisor[a.supervisor_badge] = (stats.bySupervisor[a.supervisor_badge] || 0) + 1;
        });
        
        res.json({
            success: true,
            statistics: stats,
            period: `Last ${days} days`,
            depot: depot || 'All depots'
        });
        
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
});

// Helper function to create assessment table if it doesn't exist
async function createAssessmentTable() {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS breakdown_assessments (
            id SERIAL PRIMARY KEY,
            assessment_id VARCHAR(100) UNIQUE NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE,
            
            -- Supervisor information
            supervisor_badge VARCHAR(20) NOT NULL,
            supervisor_name VARCHAR(100),
            supervisor_depot VARCHAR(50),
            supervisor_admin BOOLEAN DEFAULT FALSE,
            
            -- Vehicle information
            fleet_number VARCHAR(20) NOT NULL,
            vehicle_depot VARCHAR(50),
            
            -- Assessment details
            wizard_type VARCHAR(50) NOT NULL,
            final_decision VARCHAR(20) NOT NULL,
            safety_critical BOOLEAN DEFAULT FALSE,
            
            -- Timing
            start_time TIMESTAMP WITH TIME ZONE,
            end_time TIMESTAMP WITH TIME ZONE,
            duration_seconds INTEGER,
            total_actions INTEGER,
            
            -- Data
            responses JSONB,
            action_log JSONB,
            
            -- Context
            driver_name VARCHAR(100),
            driver_wellbeing VARCHAR(50),
            route VARCHAR(50),
            location TEXT,
            
            -- Metadata
            browser_info TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- Indexes
            INDEX idx_supervisor (supervisor_badge),
            INDEX idx_fleet (fleet_number),
            INDEX idx_timestamp (timestamp),
            INDEX idx_decision (final_decision)
        );
    `;
    
    try {
        await supabase.rpc('exec_sql', { sql: createTableSQL });
        console.log('Created breakdown_assessments table');
    } catch (error) {
        console.error('Error creating table:', error);
    }
}

// Helper function to create action logs table
async function createActionLogsTable() {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS breakdown_action_logs (
            id SERIAL PRIMARY KEY,
            assessment_id VARCHAR(100) NOT NULL,
            supervisor_badge VARCHAR(20) NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE,
            action_type VARCHAR(50),
            details JSONB,
            sequence_number INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            INDEX idx_assessment (assessment_id),
            INDEX idx_supervisor_action (supervisor_badge)
        );
    `;
    
    try {
        await supabase.rpc('exec_sql', { sql: createTableSQL });
        console.log('Created breakdown_action_logs table');
    } catch (error) {
        console.error('Error creating action logs table:', error);
    }
}

// Helper function to log supervisor activity
async function logSupervisorActivity(badge, action, details) {
    try {
        await supabase
            .from('supervisor_activity_logs')
            .insert([{
                supervisor_badge: badge,
                action_type: action,
                details: details,
                timestamp: new Date().toISOString()
            }]);
    } catch (error) {
        console.error('Error logging supervisor activity:', error);
    }
}

// Helper function to check for patterns
async function checkAndAlertPatterns(fleetNumber, wizardType) {
    try {
        // Check for repeat issues with same vehicle
        const { data: recentIssues } = await supabase
            .from('breakdown_assessments')
            .select('*')
            .eq('fleet_number', fleetNumber)
            .eq('final_decision', 'STOP')
            .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
            
        if (recentIssues && recentIssues.length >= 3) {
            console.log(`PATTERN ALERT: Fleet ${fleetNumber} has ${recentIssues.length} STOP decisions in last 7 days`);
            // Could trigger additional notifications here
        }
    } catch (error) {
        console.error('Error checking patterns:', error);
    }
}

export default router;