// Go_BARRY/public/breakdown-guide/components/wizards/SteeringWizard-with-logging.js
// Example of how to integrate breakdown logging into the Steering Wizard
// This shows the modifications needed to add breakdown logging

const SteeringWizardWithLogging = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle } = window.Icons;
    
    // Handle breakdown confirmation and logging
    const handleBreakdownConfirmed = async () => {
        try {
            // Check if breakdown logging is available
            const loggingStatus = window.isBreakdownLoggingAvailable();
            
            if (!loggingStatus.available) {
                console.warn('Breakdown logging not available:', loggingStatus.missing);
                // Continue with normal flow even if logging fails
                onComplete();
                return;
            }
            
            // Log the breakdown
            await window.logBreakdown({
                supervisorId: window.AppConstants.currentSupervisor,
                vehicleReg: window.selectedReg || window.currentVehicleReg,
                fleetNo: window.selectedFleetNo || window.currentFleetNo,
                breakdownType: 'Steering',
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ Steering breakdown logged successfully');
            
            // Continue with completion
            onComplete();
            
        } catch (error) {
            console.error('Failed to log steering breakdown:', error);
            // Don't block the user - continue with normal flow
            onComplete();
        }
    };
    
    // Modify the final step to include breakdown logging
    if (currentStep === 5) { // Assuming step 5 is the final confirmation
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">⚠️ Steering System Critical Stop</h2>
                    <p className="text-gray-300">Vehicle must remain stationary - Engineering attendance required</p>
                </div>
                
                <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                    <h3 className="text-lg font-semibold text-red-200 mb-4">🛑 IMMEDIATE ACTIONS REQUIRED</h3>
                    <ol className="list-decimal list-inside space-y-2 text-red-300/90">
                        <li>Switch off vehicle immediately</li>
                        <li>Secure vehicle with handbrake</li>
                        <li>Place warning triangles if safe</li>
                        <li>Await engineering attendance</li>
                        <li>Document all observations</li>
                    </ol>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                    <h3 className="text-lg font-semibold text-white mb-4">Confirmation</h3>
                    <p className="text-gray-300 mb-4">
                        By confirming, you acknowledge that:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-300 mb-6">
                        <li>The vehicle has a critical steering defect</li>
                        <li>The vehicle will remain stationary</li>
                        <li>Engineering has been notified</li>
                        <li>This breakdown will be logged in the system</li>
                    </ul>
                    
                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back</span>
                        </button>
                        
                        <button
                            onClick={handleBreakdownConfirmed}
                            className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                            <CheckCircle className="w-5 h-5" />
                            <span>Confirm Breakdown</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    // ... rest of the wizard steps remain the same ...
    
    switch (currentStep) {
        case 1:
            // ... existing step 1 code ...
            break;
        case 2:
            // ... existing step 2 code ...
            break;
        // ... other steps ...
        default:
            return null;
    }
};

// Export the component
window.SteeringWizardWithLogging = SteeringWizardWithLogging;
