// Go_BARRY/public/breakdownLogger.js
// Frontend helper for logging vehicle breakdowns
// This file provides a global function to log breakdowns to the backend

(function() {
    'use strict';
    
    // Configuration
    const API_BASE_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : 'https://go-barry.onrender.com';
    
    // Expose the logBreakdown function globally
    window.logBreakdown = async function(breakdownData) {
        try {
            // Validate required fields
            const requiredFields = ['supervisorId', 'vehicleReg', 'fleetNo', 'breakdownType'];
            for (const field of requiredFields) {
                if (!breakdownData[field]) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }
            
            // Add timestamp if not provided
            if (!breakdownData.timestamp) {
                breakdownData.timestamp = new Date().toISOString();
            }
            
            // Log to console for debugging
            console.log('🔧 Logging breakdown:', breakdownData);
            
            // Send POST request to backend
            const response = await fetch(`${API_BASE_URL}/api/breakdowns/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(breakdownData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to log breakdown');
            }
            
            // Log success for debugging
            console.log('✅ Breakdown logged successfully:', result);
            
            // Show success notification if available
            if (window.showNotification) {
                window.showNotification('Breakdown logged successfully', 'success');
            } else if (window.showToast) {
                window.showToast('Breakdown logged successfully', 'success');
            }
            
            // Dispatch custom event for other components to listen to
            window.dispatchEvent(new CustomEvent('breakdownLogged', {
                detail: {
                    breakdown: breakdownData,
                    response: result
                }
            }));
            
            return result;
            
        } catch (error) {
            console.error('❌ Error logging breakdown:', error);
            
            // Show error notification if available
            if (window.showNotification) {
                window.showNotification(`Failed to log breakdown: ${error.message}`, 'error');
            } else if (window.showToast) {
                window.showToast(`Failed to log breakdown: ${error.message}`, 'error');
            } else {
                // Fallback to alert
                alert(`Failed to log breakdown: ${error.message}`);
            }
            
            // Dispatch error event
            window.dispatchEvent(new CustomEvent('breakdownLogError', {
                detail: {
                    breakdown: breakdownData,
                    error: error.message
                }
            }));
            
            throw error;
        }
    };
    
    // Helper function to get current breakdown data with defaults
    window.getBreakdownData = function(breakdownType) {
        return {
            supervisorId: window.AppConstants?.currentSupervisor || window.currentSupervisor || '',
            vehicleReg: window.selectedReg || window.currentVehicleReg || '',
            fleetNo: window.selectedFleetNo || window.currentFleetNo || '',
            breakdownType: breakdownType,
            timestamp: new Date().toISOString()
        };
    };
    
    // Helper to check if breakdown logging is available
    window.isBreakdownLoggingAvailable = function() {
        const hasSupervisor = !!(window.AppConstants?.currentSupervisor || window.currentSupervisor);
        const hasVehicle = !!(window.selectedReg || window.currentVehicleReg);
        const hasFleetNo = !!(window.selectedFleetNo || window.currentFleetNo);
        
        return {
            available: hasSupervisor && hasVehicle && hasFleetNo,
            missing: {
                supervisor: !hasSupervisor,
                vehicleReg: !hasVehicle,
                fleetNo: !hasFleetNo
            }
        };
    };
    
    // Log when the module is loaded
    console.log('🔧 Breakdown Logger loaded');
    console.log('   Functions available: window.logBreakdown(), window.getBreakdownData(), window.isBreakdownLoggingAvailable()');
    
})();
