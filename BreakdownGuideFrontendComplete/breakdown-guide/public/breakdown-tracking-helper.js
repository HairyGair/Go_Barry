// Breakdown Tracking Integration Helper
// Provides helper functions for wizards to integrate with the new breakdown tracking system

(function() {
    'use strict';

    const BACKEND_URL = window.BACKEND_URL || 'https://go-barry.onrender.com';
    
    class BreakdownTrackingHelper {
        constructor() {
            this.currentBreakdownId = null;
            this.currentDailyId = null;
        }
        
        // Start a new breakdown tracking session
        async startBreakdownTracking(fleetNumber, supervisorBadge, supervisorName, depot, wizardType) {
            try {
                // Get current location
                const location = await this.getCurrentLocation();
                
                const response = await fetch(`${BACKEND_URL}/api/breakdowns/start`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fleet_number: fleetNumber,
                        supervisor_badge: supervisorBadge,
                        supervisor_name: supervisorName,
                        location: location,
                        depot_id: depot,
                        wizard_type: wizardType
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    this.currentBreakdownId = data.breakdown_id;
                    this.currentDailyId = data.daily_id;
                    
                    // Show repeat warning if applicable
                    if (data.data && data.data.repeat_warning) {
                        this.showRepeatWarning(data.data.repeat_warning);
                    }
                    
                    console.log(`Breakdown tracking started: ${this.currentBreakdownId} (${this.currentDailyId})`);
                    return data;
                }
            } catch (error) {
                console.error('Error starting breakdown tracking:', error);
                return { success: false, error: error.message };
            }
        }
        
        // Log a wizard step
        async logStep(stepType, stepData) {
            if (!this.currentBreakdownId) {
                console.warn('No active breakdown ID - cannot log step');
                return;
            }
            
            try {
                await fetch(`${BACKEND_URL}/api/breakdowns/step`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        breakdown_id: this.currentBreakdownId,
                        step_type: stepType,
                        step_data: stepData,
                        timestamp: new Date().toISOString()
                    })
                });
                
                console.log(`Step logged: ${stepType}`, stepData);
            } catch (error) {
                console.error('Error logging step:', error);
            }
        }
        
        // Complete diagnosis with severity
        async completeDiagnosis(severity, diagnosis, passengerCloudRequired = false) {
            if (!this.currentBreakdownId) {
                console.warn('No active breakdown ID - cannot complete diagnosis');
                return;
            }
            
            try {
                const response = await fetch(`${BACKEND_URL}/api/breakdowns/diagnose`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        breakdown_id: this.currentBreakdownId,
                        diagnosis: diagnosis,
                        severity: severity,
                        passenger_cloud_required: passengerCloudRequired
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    console.log(`Diagnosis completed: ${severity} - ${diagnosis}`);
                    
                    // Show Passenger Cloud modal if needed
                    if (severity === 'STOP' || severity === 'RED') {
                        this.showPassengerCloudModal();
                    }
                }
                
                return data;
            } catch (error) {
                console.error('Error completing diagnosis:', error);
                return { success: false, error: error.message };
            }
        }
        
        // Show repeat warning
        showRepeatWarning(message) {
            const warningDiv = document.createElement('div');
            warningDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fef2f2;
                border: 2px solid #dc2626;
                border-radius: 8px;
                padding: 15px;
                max-width: 350px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 9999;
            `;
            warningDiv.innerHTML = `
                <div style="display: flex; align-items: start; gap: 10px;">
                    <span style="font-size: 24px;">⚠️</span>
                    <div>
                        <h4 style="font-weight: bold; color: #dc2626; margin: 0 0 5px 0;">Repeat Breakdown Alert</h4>
                        <p style="color: #7f1d1d; margin: 0; font-size: 14px;">${message}</p>
                    </div>
                </div>
                <button onclick="this.parentElement.remove()" style="
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #dc2626;
                ">×</button>
            `;
            document.body.appendChild(warningDiv);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (warningDiv.parentElement) {
                    warningDiv.remove();
                }
            }, 10000);
        }
        
        // Show Passenger Cloud modal
        showPassengerCloudModal() {
            // Remove any existing modal
            const existingModal = document.getElementById('passenger-cloud-modal');
            if (existingModal) existingModal.remove();
            
            const modal = document.createElement('div');
            modal.id = 'passenger-cloud-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;
            modal.innerHTML = `
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    max-width: 450px;
                    width: 90%;
                ">
                    <h3 style="margin: 0 0 10px 0; color: #111827;">🚌 Journey Cancellation Required?</h3>
                    <p style="color: #6b7280; margin: 0 0 20px 0;">
                        This breakdown severity may require journey cancellation. 
                        Do you need to cancel journeys in Passenger Cloud?
                    </p>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="window.openPassengerCloud()" style="
                            flex: 1;
                            background: #dc2626;
                            color: white;
                            padding: 12px 20px;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                        ">Yes - Open Passenger Cloud</button>
                        <button onclick="window.closePassengerModal()" style="
                            flex: 1;
                            background: #059669;
                            color: white;
                            padding: 12px 20px;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                        ">No - Continue</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Get current location
        async getCurrentLocation() {
            if (!navigator.geolocation) {
                return 'Location unavailable';
            }
            
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
        
        // Get status of current breakdown
        async getBreakdownStatus() {
            if (!this.currentBreakdownId) {
                return null;
            }
            
            try {
                const response = await fetch(`${BACKEND_URL}/api/breakdowns/${this.currentBreakdownId}`);
                const data = await response.json();
                return data.success ? data.breakdown : null;
            } catch (error) {
                console.error('Error getting breakdown status:', error);
                return null;
            }
        }
        
        // Clear current breakdown session
        clearSession() {
            this.currentBreakdownId = null;
            this.currentDailyId = null;
        }
    }
    
    // Create global instance
    window.BreakdownTracker = new BreakdownTrackingHelper();
    
    // Also ensure Passenger Cloud functions are available
    if (!window.openPassengerCloud) {
        window.openPassengerCloud = function() {
            if (window.BreakdownTracker && window.BreakdownTracker.currentBreakdownId) {
                // Log that Passenger Cloud was opened
                fetch(`${BACKEND_URL}/api/breakdowns/step`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        breakdown_id: window.BreakdownTracker.currentBreakdownId,
                        step_type: 'passenger_cloud_opened',
                        step_data: { 
                            timestamp: new Date().toISOString(),
                            action: 'journey_cancellation'
                        }
                    })
                });
            }
            
            // Open Passenger Cloud
            window.open('https://gonortheast.passenger-app.com/network/journeys/cancellations', '_blank');
            window.closePassengerModal();
        };
    }
    
    if (!window.closePassengerModal) {
        window.closePassengerModal = function() {
            const modal = document.getElementById('passenger-cloud-modal');
            if (modal) modal.remove();
        };
    }
    
    console.log('✅ Breakdown Tracking Helper initialized');
})();
