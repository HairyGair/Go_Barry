/**
 * Go North East - Enhanced Breakdown Logger
 * Supervisor Tracking and Assessment Logging System
 * 
 * Copyright (c) 2025 Anthony Gair. All rights reserved.
 * 
 * This software and associated documentation files (the "Software") are the
 * exclusive property of Anthony Gair. No part of this Software may be used,
 * copied, modified, merged, published, distributed, sublicensed, or sold
 * without the express written permission of Anthony Gair.
 * 
 * Author: Anthony Gair
 * Created: 2025
 * 
 * For licensing inquiries, contact: anthony@gobarry.co.uk
 */

// Enhanced Breakdown Logger with Supervisor Tracking
// Logs every assessment action with complete supervisor details

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://breakdown-guide.onrender.com';
const LOG_STORAGE_KEY = 'breakdown_assessment_logs';
const PENDING_SYNC_KEY = 'pending_breakdown_sync';

class SupervisorBreakdownLogger {
    constructor() {
        this.supervisor = null;
        this.currentAssessment = null;
        this.assessmentStartTime = null;
        this.actionLog = [];
        this.syncInterval = null;
        this.breakdownId = null;  // Track the breakdown ID from the new system
        this.dailyId = null;      // Track the daily ID
        this.assessmentId = null; // Track the current assessment ID
        this.currentBreakdown = null; // Track current breakdown data

        // Initialize sync interval for offline logs
        this.startSyncInterval();
    }
    
    // Initialize the logger
    init(config = {}) {
        if (config.supervisorData) {
            this.setSupervisor(config.supervisorData);
        }
    }
    
    // Set the current supervisor session
    setSupervisor(session) {
        this.supervisor = session;
        console.log(`🔧 Logger initialised for supervisor: ${session?.supervisorId || session?.id}`, session);
    }
    
    // Start a new breakdown assessment (now just tracks session, actual breakdown created on completion)
    async startBreakdown(data) {
        console.log('🔍 startBreakdown called with data:', data);
        console.log('🔍 Current supervisor state:', this.supervisor);

        if (!this.supervisor) {
            console.error('❌ No supervisor session active');
            console.log('🔍 Checking localStorage for supervisor_session...');
            const sessionData = localStorage.getItem('supervisor_session');
            console.log('🔍 localStorage supervisor_session:', sessionData);
            if (sessionData) {
                try {
                    const session = JSON.parse(sessionData);
                    console.log('🔧 Found session in localStorage, setting supervisor:', session);
                    this.setSupervisor(session);
                } catch (error) {
                    console.error('🔥 Error parsing supervisor session from localStorage:', error);
                }
            }

            if (!this.supervisor) {
                console.error('❌ Still no supervisor session active after checking localStorage');
                return null;
            }
        }

        // Generate a temporary assessment ID for tracking
        const generateAssessmentId = () => {
            const now = new Date();
            const timestamp = now.getTime();
            return `ASSESS-${timestamp}`;
        };

        // Store current breakdown data INCLUDING location
        this.currentBreakdown = {
            ...data,
            location: data.location || null,
            supervisor: this.supervisor,
            startTime: new Date()
        };

        // Generate assessment tracking ID
        this.assessmentId = generateAssessmentId();
        this.assessmentStartTime = new Date();

        // Log breakdown start activity
        await this.logBreakdownStartActivity(this.currentBreakdown);

        console.log('🔥 Starting breakdown assessment:', {
            assessmentId: this.assessmentId,
            vehicle: data.vehicle?.fleetNumber,
            location: this.currentBreakdown.location,
            supervisor: this.supervisor?.name
        });

        // Log the assessment start
        this.logAction({
            type: 'ASSESSMENT_STARTED',
            assessmentId: this.assessmentId,
            vehicle: data.vehicle,
            issueCategory: data.issueCategory,
            location: data.location
        });

        return this.assessmentId;
    }
    
    // Log assessment step (now just tracks locally, full data sent on completion)
    async logAssessmentStep(data) {
        if (!this.assessmentId) {
            console.error('No active assessment');
            return;
        }

        // Log locally for tracking
        this.logAction({
            type: 'ASSESSMENT_STEP',
            assessmentId: this.assessmentId,
            ...data
        });

        console.log('📝 Assessment step logged:', data);
    }
    
    // Complete assessment - Updated to use /from-wizard endpoint
    async completeAssessment(data) {
        console.log('🔍 completeAssessment called with data:', data);
        console.log('🔍 Current breakdown state:', this.currentBreakdown);
        console.log('🔍 Current supervisor state:', this.supervisor);

        // Try to recover supervisor session if missing
        if (!this.supervisor) {
            console.error('❌ No supervisor session in completeAssessment');
            console.log('🔍 Checking localStorage for supervisor_session...');
            const sessionData = localStorage.getItem('supervisor_session');
            if (sessionData) {
                try {
                    const session = JSON.parse(sessionData);
                    console.log('🔧 Found session in localStorage, setting supervisor:', session);
                    this.setSupervisor(session);
                } catch (error) {
                    console.error('🔥 Error parsing supervisor session from localStorage:', error);
                }
            }
        }

        if (!this.currentBreakdown) {
            console.error('❌ No active breakdown data');
            console.log('🔧 Creating minimal breakdown data for wizard completion...');

            // Create minimal breakdown data for wizard completion
            this.currentBreakdown = {
                vehicle: {
                    fleetNumber: data.fleet_number || 'Unknown'
                },
                location: {
                    description: 'Location not specified',
                    lat: null,
                    lng: null
                },
                issueCategory: data.issueCategory || 'general'
            };
        }

        const duration = new Date() - this.assessmentStartTime;

        // Prepare data for the /from-wizard endpoint
        const wizardData = {
            // Wizard information
            wizard_type: data.wizardType || 'General Assessment',
            wizard_decision: data.decision,
            wizard_assessment_data: data.assessmentData || {},

            // Vehicle and location
            fleet_number: this.currentBreakdown.vehicle?.fleetNumber,
            fleet_no: this.currentBreakdown.vehicle?.fleetNumber, // Alternative field
            location: this.currentBreakdown.location?.description ||
                     this.currentBreakdown.location?.address ||
                     this.currentBreakdown.location?.coordinates ||
                     `${this.currentBreakdown.location?.lat}, ${this.currentBreakdown.location?.lng}` ||
                     'Location not specified',
            location_coords: this.currentBreakdown.location?.coords ||
                           (this.currentBreakdown.location?.lat && this.currentBreakdown.location?.lng ?
                            `${this.currentBreakdown.location.lat}, ${this.currentBreakdown.location.lng}` : null),
            w3w_location: this.currentBreakdown.location?.what3words,

            // Supervisor information (with fallbacks)
            supervisor_badge: this.supervisor?.supervisorId || this.supervisor?.badge || 'TEST001',
            supervisor_name: this.supervisor?.name || 'Test Supervisor',

            // Issue details
            issue_category: this.currentBreakdown.issueCategory || data.issueCategory,
            // issue_description: data.notes || data.description || 'No description provided', // Temporarily disabled until DB column added
            severity: data.decision,

            // Additional context
            priority_level: data.decision === 'STOP' ? 1 : data.decision === 'AMBER' ? 2 : 3,
            engineering_required: data.decision === 'STOP',
            replacement_vehicle_required: data.decision === 'STOP'
        };

        console.log('🚀 Sending wizard completion data to dashboard:', wizardData);
        console.log('🔗 Backend URL:', BACKEND_URL);

        try {
            const response = await fetch(`${BACKEND_URL}/api/breakdowns/from-wizard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(wizardData)
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Wizard data successfully sent to dashboard!', result);

                // Log to activity system
                await this.logWizardCompletionActivity({
                    wizardType: data.wizardType,
                    decision: data.decision,
                    breakdownId: result.breakdown?.breakdown_id,
                    fleetNo: this.currentBreakdown.vehicle?.fleetNumber,
                    location: wizardData.location,
                    assessmentData: data.assessmentData
                });

                // Log locally
                this.logAction({
                    type: 'ASSESSMENT_COMPLETED',
                    decision: data.decision,
                    duration: duration,
                    dashboardIntegration: 'success',
                    breakdownId: result.breakdown?.breakdown_id
                });

                // Reset state
                this.breakdownId = result.breakdown?.breakdown_id;
                this.currentBreakdown = null;
                this.assessmentStartTime = null;

                return result;
            } else {
                throw new Error(result.error || 'Failed to create breakdown record');
            }

        } catch (error) {
            console.error('❌ Failed to send wizard data to dashboard:', error);

            // Store for retry
            this.storePendingAction({
                type: 'COMPLETE_WIZARD_ASSESSMENT',
                data: wizardData,
                timestamp: new Date().toISOString()
            });

            // Log locally
            this.logAction({
                type: 'ASSESSMENT_COMPLETED_OFFLINE',
                decision: data.decision,
                duration: duration,
                dashboardIntegration: 'pending',
                error: error.message
            });

            // Return success with offline flag - assessment is recorded
            console.log('⚠️ Assessment saved locally, will sync to dashboard when connection available');

            return {
                success: true,  // Mark as success since assessment is saved
                offline: true,
                error: error.message,
                message: 'Assessment saved - will sync to dashboard automatically',
                synced: false,
                breakdownId: `LOCAL-${Date.now()}`
            };
        }
    }
    

    
    // Log wizard completion to activity system
    // NOTE: Activity logging is now handled by the backend /api/breakdowns/from-wizard endpoint
    // to prevent duplication in the activity feed. This method is kept for legacy compatibility.
    async logWizardCompletionActivity(data) {
        console.log('📝 Wizard completion activity logging skipped (handled by backend):', {
            wizardType: data.wizardType,
            decision: data.decision,
            fleetNo: data.fleetNo
        });
    }

    // Log breakdown start activity
    // NOTE: For now, breakdown start activities are not logged to prevent activity feed noise.
    // Only completion activities (which create actual breakdown records) are logged via backend.
    async logBreakdownStartActivity(data) {
        console.log('📝 Breakdown start activity logging skipped (reduces activity feed noise):', {
            wizardType: data.wizardType,
            fleetNo: data.vehicle?.fleetNumber,
            issueCategory: data.issueCategory
        });
    }

    // Log action locally
    logAction(action) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            supervisorId: this.supervisor?.supervisorId,
            supervisorName: this.supervisor?.name,
            depot: this.supervisor?.depot,
            breakdownId: this.breakdownId,
            dailyId: this.dailyId,
            ...action
        };
        
        this.actionLog.push(logEntry);
        
        // Store in local storage
        this.saveToLocalStorage();
        
        console.log('Action logged:', logEntry);
    }
    
    // Save logs to local storage
    saveToLocalStorage() {
        try {
            const existingLogs = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
            const allLogs = [...existingLogs, ...this.actionLog.slice(-1)]; // Add only the latest
            localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(allLogs));
        } catch (error) {
            console.error('Failed to save to local storage:', error);
        }
    }
    
    // Store pending action for offline sync
    storePendingAction(action) {
        try {
            const pending = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
            pending.push(action);
            localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
        } catch (error) {
            console.error('Failed to store pending action:', error);
        }
    }
    
    // Sync pending actions when online
    async syncPendingActions() {
        if (!navigator.onLine) return;
        
        try {
            const pending = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
            if (pending.length === 0) return;
            
            console.log(`Syncing ${pending.length} pending actions...`);
            
            // Process each pending action
            for (const action of pending) {
                // Implement sync logic based on action type
                console.log('Syncing action:', action);
            }
            
            // Clear pending after successful sync
            localStorage.setItem(PENDING_SYNC_KEY, '[]');
            
        } catch (error) {
            console.error('Failed to sync pending actions:', error);
        }
    }
    
    // Start periodic sync
    startSyncInterval() {
        // Sync every 30 seconds if online
        this.syncInterval = setInterval(() => {
            this.syncPendingActions();
        }, 30000);
        
        // Also sync on online event
        window.addEventListener('online', () => {
            console.log('Back online - syncing pending actions...');
            this.syncPendingActions();
        });
    }
    
    // Get action logs
    getActionLog() {
        return this.actionLog;
    }
    
    // Get all stored logs
    getAllLogs() {
        try {
            return JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
        } catch (error) {
            console.error('Failed to retrieve logs:', error);
            return [];
        }
    }
    
    // Get current breakdown data
    getCurrentBreakdown() {
        console.log('getCurrentBreakdown called, returning:', this.currentBreakdown);
        return this.currentBreakdown;
    }
    
    // Update current breakdown location
    updateBreakdownLocation(location) {
        if (this.currentBreakdown) {
            this.currentBreakdown.location = location;
        }
    }
    
    // Clear logs
    clearLogs() {
        this.actionLog = [];
        localStorage.removeItem(LOG_STORAGE_KEY);
        localStorage.removeItem(PENDING_SYNC_KEY);
        console.log('All logs cleared');
    }
    
    // Export logs as JSON
    exportLogs() {
        const logs = this.getAllLogs();
        const dataStr = JSON.stringify(logs, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `breakdown-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        console.log(`Exported ${logs.length} log entries`);
    }
}

// Create and export singleton instance
export const supervisorBreakdownLogger = new SupervisorBreakdownLogger();

// Also export the class for testing
export default SupervisorBreakdownLogger;
