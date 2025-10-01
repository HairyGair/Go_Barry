// SDC Operations Dashboard Connector
// Bridges Breakdown Guide assessments with SDC Operations Dashboard
// Copyright (c) 2025 Anthony Gair. All rights reserved.

(function() {
    'use strict';
    
    const BACKEND_URL = window.BACKEND_URL || 'https://breakdown-guide.onrender.com';
    
    // SDC Dashboard Integration Module
    window.SDCDashboardConnector = {
        
        // Initialize the connector
        init: function() {
            console.log('SDC Dashboard Connector initialized');
            
            // Listen for breakdown events from the Breakdown Guide
            window.addEventListener('breakdownAssessmentStarted', this.handleAssessmentStart.bind(this));
            window.addEventListener('breakdownAssessmentCompleted', this.handleAssessmentComplete.bind(this));
            window.addEventListener('breakdownStatusUpdated', this.handleStatusUpdate.bind(this));
            
            // Connect to existing supervisor logger if available
            if (window.supervisorBreakdownLogger) {
                this.connectToLogger(window.supervisorBreakdownLogger);
            }
        },
        
        // Connect to the supervisor breakdown logger
        connectToLogger: function(logger) {
            console.log('Connecting to Supervisor Breakdown Logger');
            
            // Override the logger methods to add dashboard notifications
            const originalStartAssessment = logger.startAssessment.bind(logger);
            const originalCompleteAssessment = logger.completeAssessment.bind(logger);
            const originalLogAction = logger.logAction.bind(logger);
            
            // Enhanced start assessment
            logger.startAssessment = async function(wizardType, fleetNumber, depot) {
                const result = await originalStartAssessment(wizardType, fleetNumber, depot);
                
                // Notify dashboard
                if (result) {
                    window.SDCDashboardConnector.notifyDashboard('ASSESSMENT_STARTED', {
                        breakdownId: this.breakdownId,
                        dailyId: this.dailyId,
                        wizardType: wizardType,
                        fleetNumber: fleetNumber,
                        depot: depot,
                        supervisor: this.supervisor,
                        timestamp: new Date().toISOString()
                    });
                }
                
                return result;
            };
            
            // Enhanced complete assessment
            logger.completeAssessment = async function(decision, notes) {
                const result = await originalCompleteAssessment(decision, notes);
                
                // Notify dashboard
                if (result) {
                    window.SDCDashboardConnector.notifyDashboard('ASSESSMENT_COMPLETED', {
                        breakdownId: this.breakdownId,
                        dailyId: this.dailyId,
                        decision: decision,
                        notes: notes,
                        supervisor: this.supervisor,
                        duration: this.calculateDuration(),
                        timestamp: new Date().toISOString()
                    });
                }
                
                return result;
            };
            
            // Enhanced log action
            logger.logAction = function(actionType, details) {
                originalLogAction(actionType, details);
                
                // Notify dashboard for key actions
                if (['STEP_COMPLETED', 'DECISION_MADE', 'ENGINEER_REQUESTED'].includes(actionType)) {
                    window.SDCDashboardConnector.notifyDashboard('ACTION_LOGGED', {
                        breakdownId: this.breakdownId,
                        actionType: actionType,
                        details: details,
                        supervisor: this.supervisor,
                        timestamp: new Date().toISOString()
                    });
                }
            };
        },
        
        // Handle assessment start event
        handleAssessmentStart: function(event) {
            const data = event.detail;
            this.updateDashboard('assessment_started', data);
        },
        
        // Handle assessment complete event
        handleAssessmentComplete: function(event) {
            const data = event.detail;
            this.updateDashboard('assessment_completed', data);
        },
        
        // Handle status update event
        handleStatusUpdate: function(event) {
            const data = event.detail;
            this.updateDashboard('status_updated', data);
        },
        
        // Notify dashboard of changes
        notifyDashboard: async function(eventType, data) {
            try {
                // Send update to backend
                const response = await fetch(`${BACKEND_URL}/api/breakdowns/dashboard-update`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        event_type: eventType,
                        data: data,
                        timestamp: new Date().toISOString()
                    })
                });
                
                if (!response.ok) {
                    console.error('Failed to notify dashboard:', response.status);
                }
                
                // Also broadcast locally for any listening dashboards
                window.postMessage({
                    type: 'SDC_DASHBOARD_UPDATE',
                    eventType: eventType,
                    data: data
                }, '*');
                
                // Store in localStorage for dashboard to pick up
                this.storeUpdate(eventType, data);
                
            } catch (error) {
                console.error('Error notifying dashboard:', error);
            }
        },
        
        // Store update in localStorage for dashboard
        storeUpdate: function(eventType, data) {
            try {
                const updates = JSON.parse(localStorage.getItem('sdc_dashboard_updates') || '[]');
                updates.push({
                    eventType: eventType,
                    data: data,
                    timestamp: new Date().toISOString()
                });
                
                // Keep only last 100 updates
                if (updates.length > 100) {
                    updates.splice(0, updates.length - 100);
                }
                
                localStorage.setItem('sdc_dashboard_updates', JSON.stringify(updates));
                
                // Trigger storage event for other tabs
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'sdc_dashboard_updates',
                    newValue: JSON.stringify(updates),
                    url: window.location.href
                }));
                
            } catch (error) {
                console.error('Error storing update:', error);
            }
        },
        
        // Update dashboard directly (for same-window updates)
        updateDashboard: function(action, data) {
            // Check if we're on the dashboard page
            if (window.location.pathname.includes('sdc-operations-dashboard')) {
                // Direct update
                if (typeof window.handleDashboardUpdate === 'function') {
                    window.handleDashboardUpdate(action, data);
                }
            } else {
                // Store for dashboard to pick up
                this.notifyDashboard(action, data);
            }
        },
        
        // Get recent updates for dashboard
        getRecentUpdates: function() {
            try {
                return JSON.parse(localStorage.getItem('sdc_dashboard_updates') || '[]');
            } catch (error) {
                console.error('Error getting updates:', error);
                return [];
            }
        },
        
        // Clear old updates
        clearOldUpdates: function() {
            try {
                const updates = this.getRecentUpdates();
                const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
                
                const filtered = updates.filter(u => 
                    new Date(u.timestamp) > cutoff
                );
                
                localStorage.setItem('sdc_dashboard_updates', JSON.stringify(filtered));
            } catch (error) {
                console.error('Error clearing old updates:', error);
            }
        },
        
        // Send heartbeat to dashboard
        sendHeartbeat: function(supervisorData) {
            this.notifyDashboard('SUPERVISOR_HEARTBEAT', {
                supervisor: supervisorData,
                activeAssessment: window.supervisorBreakdownLogger?.currentAssessment,
                timestamp: new Date().toISOString()
            });
        },
        
        // Integration with Passenger Cloud
        notifyPassengerCloud: async function(breakdownData) {
            if (breakdownData.severity === 'STOP' || 
                (breakdownData.severity === 'AMBER' && breakdownData.route_id)) {
                
                try {
                    const response = await fetch(`${BACKEND_URL}/api/passenger-cloud/disruption`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            fleet_number: breakdownData.vehicle_id,
                            route: breakdownData.route_id,
                            severity: breakdownData.severity,
                            location: breakdownData.location,
                            estimated_delay: breakdownData.severity === 'STOP' ? 'Service terminated' : '10-15 minutes',
                            timestamp: new Date().toISOString()
                        })
                    });
                    
                    if (response.ok) {
                        console.log('Passenger Cloud notified of disruption');
                    }
                } catch (error) {
                    console.error('Error notifying Passenger Cloud:', error);
                }
            }
        },
        
        // Integration with Engineering
        requestEngineer: async function(breakdownData) {
            try {
                const response = await fetch(`${BACKEND_URL}/api/engineering/dispatch`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        breakdown_id: breakdownData.breakdown_id,
                        fleet_number: breakdownData.vehicle_id,
                        location: breakdownData.location,
                        severity: breakdownData.severity,
                        issue_type: breakdownData.wizard_type,
                        priority: breakdownData.is_priority || breakdownData.severity === 'STOP',
                        supervisor: breakdownData.supervisor_badge,
                        notes: breakdownData.notes
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('Engineer dispatched:', result.engineer_id);
                    
                    // Update breakdown status
                    this.notifyDashboard('ENGINEER_DISPATCHED', {
                        breakdown_id: breakdownData.breakdown_id,
                        engineer_id: result.engineer_id,
                        estimated_arrival: result.estimated_arrival
                    });
                }
            } catch (error) {
                console.error('Error requesting engineer:', error);
            }
        }
    };
    
    // Dashboard update handler for the SDC Operations Dashboard page
    if (window.location.pathname.includes('sdc-operations-dashboard')) {
        window.handleDashboardUpdate = function(action, data) {
            console.log('Dashboard update received:', action, data);
            
            // Trigger dashboard refresh
            if (typeof window.loadDashboardData === 'function') {
                window.loadDashboardData();
            }
            
            // Show notification for critical updates
            if (action === 'assessment_completed' && data.decision === 'STOP') {
                // Show alert banner
                const alertBanner = document.getElementById('alertBanner');
                const alertText = document.getElementById('alertText');
                
                if (alertBanner && alertText) {
                    alertText.textContent = `STOP decision on Fleet ${data.fleetNumber} - ${data.notes || 'Immediate action required'}`;
                    alertBanner.classList.add('show');
                }
            }
        };
        
        // Listen for updates from other tabs
        window.addEventListener('storage', function(event) {
            if (event.key === 'sdc_dashboard_updates') {
                console.log('Storage update received');
                if (typeof window.loadDashboardData === 'function') {
                    window.loadDashboardData();
                }
            }
        });
        
        // Listen for postMessage updates
        window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'SDC_DASHBOARD_UPDATE') {
                console.log('PostMessage update received:', event.data);
                if (typeof window.loadDashboardData === 'function') {
                    window.loadDashboardData();
                }
            }
        });
    }
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.SDCDashboardConnector.init();
        });
    } else {
        window.SDCDashboardConnector.init();
    }
    
    // Clean up old updates periodically
    setInterval(function() {
        window.SDCDashboardConnector.clearOldUpdates();
    }, 60 * 60 * 1000); // Every hour
    
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.SDCDashboardConnector;
}
