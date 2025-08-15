// Enhanced Breakdown Logger with Supervisor Tracking
// Logs every assessment action with complete supervisor details

(function() {
    'use strict';

    const BACKEND_URL = window.BACKEND_URL || 'https://go-barry.onrender.com';
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
            
            // Initialize sync interval for offline logs
            this.startSyncInterval();
        }
        
        // Set the current supervisor session
        setSupervisor(session) {
            this.supervisor = session;
            console.log(`Logger initialized for supervisor: ${session.supervisorId}`);
        }
        
        // Start a new assessment with breakdown tracking
        async startAssessment(wizardType, fleetNumber, depot) {
            if (!this.supervisor) {
                console.error('No supervisor logged in');
                return false;
            }
            
            // Call new API to start breakdown
            try {
                const response = await fetch(`${BACKEND_URL}/api/breakdowns/start`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fleet_number: fleetNumber,
                        supervisor_badge: this.supervisor.supervisorId,
                        supervisor_name: this.supervisor.supervisorName,
                        location: await this.getCurrentLocation(),
                        depot_id: depot,
                        wizard_type: wizardType
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    this.breakdownId = data.breakdown_id;
                    this.dailyId = data.daily_id;
                    
                    // Show repeat warning if applicable
                    if (data.data && data.data.repeat_warning) {
                        alert(data.data.repeat_warning);
                    }
                }
            } catch (error) {
                console.error('Error starting breakdown:', error);
            }
            
            this.assessmentStartTime = new Date();
            this.currentAssessment = {
                id: `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                breakdown_id: this.breakdownId,
                daily_id: this.dailyId,
                supervisorId: this.supervisor.supervisorId,
                supervisorName: this.supervisor.supervisorName,
                supervisorDepot: this.supervisor.depot,
                wizardType: wizardType,
                fleetNumber: fleetNumber,
                vehicleDepot: depot,
                startTime: this.assessmentStartTime.toISOString(),
                actions: []
            };
            
            this.actionLog = [];
            
            // Log assessment start
            this.logAction('ASSESSMENT_START', {
                wizardType: wizardType,
                fleetNumber: fleetNumber,
                depot: depot,
                breakdownId: this.breakdownId
            });
            
            return true;
        }
        
        // Log every action taken during assessment
        logAction(actionType, details) {
            if (!this.supervisor) {
                console.error('No supervisor logged in');
                return;
            }
            
            const action = {
                timestamp: new Date().toISOString(),
                supervisorId: this.supervisor.supervisorId,
                actionType: actionType,
                details: details,
                sequenceNumber: this.actionLog.length + 1
            };
            
            this.actionLog.push(action);
            
            if (this.currentAssessment) {
                this.currentAssessment.actions.push(action);
            }
            
            // Store locally for offline capability
            this.storeLocalLog(action);
            
            console.log(`Action logged: ${actionType}`, details);
        }
        
        // Log wizard step progression
        logStepProgression(stepNumber, stepName, responses) {
            this.logAction('STEP_COMPLETED', {
                stepNumber: stepNumber,
                stepName: stepName,
                responses: responses,
                timeOnStep: this.calculateTimeOnStep()
            });
        }
        
        // Log specific decisions (critical for safety)
        logDecision(decisionType, value, reason) {
            this.logAction('DECISION_MADE', {
                decisionType: decisionType,
                value: value,
                reason: reason,
                isCritical: this.isCriticalDecision(decisionType, value)
            });
        }
        
        // New method for logging wizard steps to breakdown tracker
        async logWizardStep(stepType, stepData) {
            if (!this.breakdownId) return;
            
            try {
                await fetch(`${BACKEND_URL}/api/breakdowns/step`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        breakdown_id: this.breakdownId,
                        step_type: stepType,
                        step_data: stepData,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (error) {
                console.error('Error logging step:', error);
            }
            
            // Also log through the original system
            this.logAction('WIZARD_STEP', {
                stepType: stepType,
                stepData: stepData
            });
        }
        
        // Method for diagnosis completion with severity tracking
        async completeWizardDiagnosis(severity, resolution) {
            if (!this.breakdownId) return;
            
            try {
                const response = await fetch(`${BACKEND_URL}/api/breakdowns/diagnose`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        breakdown_id: this.breakdownId,
                        diagnosis: resolution,
                        severity: severity || 'AMBER',
                        passenger_cloud_required: false // Will be set by button click
                    })
                });
                
                if (response.ok) {
                    // Show Passenger Cloud option
                    this.showPassengerCloudOption();
                }
            } catch (error) {
                console.error('Error completing diagnosis:', error);
            }
        }
        
        // Show Passenger Cloud integration modal
        showPassengerCloudOption() {
            const modalHTML = `
                <div id="passenger-cloud-modal" style="
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    z-index: 10000;
                ">
                    <h3>Journey Cancellation Required?</h3>
                    <p>Does this breakdown require journey cancellation in Passenger Cloud?</p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.openPassengerCloud()" style="
                            background: #dc2626;
                            color: white;
                            padding: 10px 20px;
                            border: none;
                            border-radius: 5px;
                            margin-right: 10px;
                            cursor: pointer;
                        ">Yes - Open Passenger Cloud</button>
                        <button onclick="window.closePassengerModal()" style="
                            background: #059669;
                            color: white;
                            padding: 10px 20px;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                        ">No - Continue</button>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
        
        // Helper function for location
        async getCurrentLocation() {
            // Try to get location if available
            if (navigator.geolocation) {
                return new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            resolve(`${position.coords.latitude},${position.coords.longitude}`);
                        },
                        () => {
                            resolve('Location unavailable');
                        },
                        { timeout: 5000 }
                    );
                });
            }
            return 'Location unavailable';
        }
        
        // Log safety-critical determinations
        logSafetyDetermination(category, severity, action) {
            this.logAction('SAFETY_DETERMINATION', {
                category: category,
                severity: severity,
                recommendedAction: action,
                timestamp: new Date().toISOString()
            });
        }
        
        // Complete the assessment and send to backend
        async completeAssessment(finalDecision, responses) {
            if (!this.currentAssessment) {
                console.error('No active assessment');
                return { success: false, error: 'No active assessment' };
            }
            
            // Add final details
            this.currentAssessment.endTime = new Date().toISOString();
            this.currentAssessment.duration = this.calculateDuration();
            this.currentAssessment.finalDecision = finalDecision;
            this.currentAssessment.allResponses = responses;
            this.currentAssessment.totalActions = this.actionLog.length;
            
            // Log completion
            this.logAction('ASSESSMENT_COMPLETE', {
                finalDecision: finalDecision,
                duration: this.currentAssessment.duration,
                totalSteps: this.actionLog.length
            });
            
            // Send to backend
            const result = await this.syncToBackend(this.currentAssessment);
            
            // Store locally regardless of sync result
            this.storeCompleteAssessment(this.currentAssessment);
            
            // Reset for next assessment
            this.currentAssessment = null;
            this.assessmentStartTime = null;
            this.actionLog = [];
            
            return result;
        }
        
        // Sync assessment to backend
        async syncToBackend(assessment) {
            try {
                const response = await fetch(`${BACKEND_URL}/api/breakdown-assessments/log-assessment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.supervisor.token}`
                    },
                    body: JSON.stringify(assessment)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Assessment synced to backend:', data);
                    return { success: true, data: data };
                } else {
                    throw new Error(`Sync failed: ${response.status}`);
                }
            } catch (error) {
                console.error('Failed to sync assessment:', error);
                // Store for later sync
                this.storePendingSync(assessment);
                return { success: false, error: error.message, offline: true };
            }
        }
        
        // Store log locally
        storeLocalLog(action) {
            try {
                const logs = this.getLocalLogs();
                logs.push(action);
                // Keep only last 1000 actions locally
                if (logs.length > 1000) {
                    logs.shift();
                }
                localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
            } catch (error) {
                console.error('Failed to store local log:', error);
            }
        }
        
        // Get local logs
        getLocalLogs() {
            try {
                const data = localStorage.getItem(LOG_STORAGE_KEY);
                return data ? JSON.parse(data) : [];
            } catch (error) {
                console.error('Failed to retrieve local logs:', error);
                return [];
            }
        }
        
        // Store complete assessment locally
        storeCompleteAssessment(assessment) {
            try {
                const key = `assessment_${assessment.id}`;
                localStorage.setItem(key, JSON.stringify(assessment));
                
                // Update index of assessments
                const index = this.getAssessmentIndex();
                index.push({
                    id: assessment.id,
                    timestamp: assessment.startTime,
                    supervisor: assessment.supervisorId,
                    wizardType: assessment.wizardType,
                    decision: assessment.finalDecision
                });
                localStorage.setItem('assessment_index', JSON.stringify(index));
            } catch (error) {
                console.error('Failed to store assessment:', error);
            }
        }
        
        // Get assessment index
        getAssessmentIndex() {
            try {
                const data = localStorage.getItem('assessment_index');
                return data ? JSON.parse(data) : [];
            } catch (error) {
                return [];
            }
        }
        
        // Store for pending sync
        storePendingSync(assessment) {
            try {
                const pending = this.getPendingSync();
                pending.push(assessment);
                localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
            } catch (error) {
                console.error('Failed to store pending sync:', error);
            }
        }
        
        // Get pending sync items
        getPendingSync() {
            try {
                const data = localStorage.getItem(PENDING_SYNC_KEY);
                return data ? JSON.parse(data) : [];
            } catch (error) {
                return [];
            }
        }
        
        // Sync pending assessments
        async syncPendingAssessments() {
            if (!this.supervisor) return;
            
            const pending = this.getPendingSync();
            if (pending.length === 0) return;
            
            console.log(`Syncing ${pending.length} pending assessments...`);
            const synced = [];
            
            for (const assessment of pending) {
                const result = await this.syncToBackend(assessment);
                if (result.success) {
                    synced.push(assessment.id);
                }
            }
            
            // Remove synced items
            if (synced.length > 0) {
                const remaining = pending.filter(a => !synced.includes(a.id));
                localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(remaining));
                console.log(`Synced ${synced.length} assessments`);
            }
        }
        
        // Start sync interval for offline logs
        startSyncInterval() {
            // Try to sync pending assessments every 30 seconds
            this.syncInterval = setInterval(() => {
                this.syncPendingAssessments();
            }, 30000);
        }
        
        // Calculate time on current step
        calculateTimeOnStep() {
            if (!this.assessmentStartTime) return 0;
            const now = new Date();
            const lastAction = this.actionLog[this.actionLog.length - 2];
            const lastTime = lastAction ? new Date(lastAction.timestamp) : this.assessmentStartTime;
            return Math.round((now - lastTime) / 1000); // seconds
        }
        
        // Calculate total duration
        calculateDuration() {
            if (!this.assessmentStartTime) return 0;
            const now = new Date();
            return Math.round((now - this.assessmentStartTime) / 1000); // seconds
        }
        
        // Check if decision is critical
        isCriticalDecision(decisionType, value) {
            const criticalTypes = [
                'brakeToFloor', 'delayedBraking', 'brakeLeaks', 
                'steeringFailure', 'wheelNuts', 'oilWarning'
            ];
            
            const criticalValues = ['yes', 'severe', 'STOP', 'critical'];
            
            return criticalTypes.includes(decisionType) || 
                   criticalValues.includes(value?.toLowerCase());
        }
        
        // Get assessment statistics
        getStatistics() {
            const index = this.getAssessmentIndex();
            const logs = this.getLocalLogs();
            
            return {
                totalAssessments: index.length,
                totalActions: logs.length,
                pendingSync: this.getPendingSync().length,
                currentSupervisor: this.supervisor?.supervisorId,
                recentAssessments: index.slice(-10).reverse()
            };
        }
        
        // Export data for analysis
        exportData() {
            return {
                assessments: this.getAssessmentIndex(),
                logs: this.getLocalLogs(),
                pending: this.getPendingSync(),
                exported: new Date().toISOString()
            };
        }
        
        // Clear local data (with confirmation)
        clearLocalData() {
            if (confirm('This will clear all local assessment data. Are you sure?')) {
                localStorage.removeItem(LOG_STORAGE_KEY);
                localStorage.removeItem(PENDING_SYNC_KEY);
                localStorage.removeItem('assessment_index');
                console.log('Local assessment data cleared');
                return true;
            }
            return false;
        }
    }
    
    // Initialize and expose globally
    window.SupervisorBreakdownLogger = new SupervisorBreakdownLogger();
    
    // Also expose to BreakdownAnalytics for compatibility
    if (window.BreakdownAnalytics) {
        window.BreakdownAnalytics.logger = window.SupervisorBreakdownLogger;
    }
    
})();