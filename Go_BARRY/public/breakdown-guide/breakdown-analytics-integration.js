// Breakdown Analytics Integration Fix
// Ensures completed wizard assessments are recorded in the analytics system

(function() {
    'use strict';
    
    console.log('🔧 Installing Breakdown Analytics Integration Fix...');
    
    // Wait for both systems to be ready
    const waitForSystems = () => {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.SupervisorBreakdownLogger && window.BreakdownAnalytics) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    };
    
    // Install the integration
    const installIntegration = async () => {
        await waitForSystems();
        
        console.log('✅ Both systems ready, installing integration...');
        
        // Store original completeAssessment function
        const originalCompleteAssessment = window.SupervisorBreakdownLogger.completeAssessment;
        
        // Override completeAssessment to also record in analytics
        window.SupervisorBreakdownLogger.completeAssessment = async function(finalDecision, responses) {
            console.log('📊 Recording breakdown in analytics system...');
            
            // Call original function
            const result = await originalCompleteAssessment.call(this, finalDecision, responses);
            
            // Also record in BreakdownAnalytics for the dashboard
            if (this.currentAssessment && window.BreakdownAnalytics) {
                try {
                    // Ensure supervisor session is set
                    if (this.supervisor && window.BreakdownAnalytics.setSupervisor) {
                        window.BreakdownAnalytics.setSupervisor(this.supervisor);
                    }
                    
                    // Record the breakdown for analytics
                    const analyticsResult = await window.BreakdownAnalytics.recordBreakdown(
                        this.currentAssessment.wizardType,
                        {
                            ...responses,
                            fleetNumber: this.currentAssessment.fleetNumber || responses.fleetNumber,
                            depot: this.currentAssessment.vehicleDepot || responses.depot,
                            driverName: responses.driverName || 'Not Recorded',
                            route: responses.route || 'Not Recorded',
                            location: responses.location || 'Not Recorded',
                            goCheckReported: responses.goCheckReported || false
                        },
                        finalDecision
                    );
                    
                    if (analyticsResult.success) {
                        console.log('✅ Breakdown recorded in analytics:', analyticsResult.breakdown);
                        
                        // Fire event for UI updates
                        window.dispatchEvent(new CustomEvent('breakdown-recorded', {
                            detail: analyticsResult.breakdown
                        }));
                    } else {
                        console.error('❌ Failed to record in analytics:', analyticsResult.error);
                    }
                } catch (error) {
                    console.error('❌ Error recording in analytics:', error);
                }
            }
            
            return result;
        }.bind(window.SupervisorBreakdownLogger);
        
        console.log('✅ Integration installed successfully');
        
        // Also ensure startAssessment records the fleet number properly
        const originalStartAssessment = window.SupervisorBreakdownLogger.startAssessment;
        
        window.SupervisorBreakdownLogger.startAssessment = function(wizardType, fleetNumber, depot) {
            console.log(`📝 Starting assessment for fleet ${fleetNumber} at ${depot}`);
            
            // Ensure fleet number is stored
            const result = originalStartAssessment.call(this, wizardType, fleetNumber, depot);
            
            // Store fleet info for later use
            if (this.currentAssessment) {
                this.currentAssessment.fleetNumber = fleetNumber;
                this.currentAssessment.vehicleDepot = depot;
            }
            
            return result;
        }.bind(window.SupervisorBreakdownLogger);
        
        // Test the integration
        testIntegration();
    };
    
    // Test function to verify integration
    const testIntegration = () => {
        console.log('🧪 Testing integration...');
        
        // Check if analytics can retrieve data
        if (window.BreakdownAnalytics) {
            const breakdowns = window.BreakdownAnalytics.getAllBreakdowns();
            console.log(`📊 Current breakdowns in analytics: ${breakdowns.length}`);
            
            const summary = window.BreakdownAnalytics.getAnalyticsSummary();
            console.log('📈 Analytics Summary:', {
                total: summary.totalBreakdowns,
                vehicles: summary.vehiclesAffected,
                safetyCritical: summary.safetyCritical,
                decisions: {
                    stop: summary.stopDecisions,
                    amber: summary.amberDecisions,
                    continue: summary.continueDecisions
                }
            });
        }
    };
    
    // Install the integration when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', installIntegration);
    } else {
        installIntegration();
    }
    
    // Expose test function globally
    window.testBreakdownIntegration = testIntegration;
    
    // Add function to manually sync existing data
    window.syncExistingAssessments = async () => {
        console.log('🔄 Syncing existing assessments to analytics...');
        
        if (!window.SupervisorBreakdownLogger || !window.BreakdownAnalytics) {
            console.error('Systems not ready');
            return;
        }
        
        const index = window.SupervisorBreakdownLogger.getAssessmentIndex();
        console.log(`Found ${index.length} existing assessments`);
        
        let synced = 0;
        for (const item of index) {
            try {
                const assessmentKey = `assessment_${item.id}`;
                const assessmentData = localStorage.getItem(assessmentKey);
                
                if (assessmentData) {
                    const assessment = JSON.parse(assessmentData);
                    
                    // Record in analytics
                    await window.BreakdownAnalytics.recordBreakdown(
                        assessment.wizardType,
                        assessment.allResponses || {},
                        assessment.finalDecision
                    );
                    
                    synced++;
                }
            } catch (error) {
                console.error('Error syncing assessment:', item.id, error);
            }
        }
        
        console.log(`✅ Synced ${synced} assessments to analytics`);
        window.testBreakdownIntegration();
    };
    
})();
