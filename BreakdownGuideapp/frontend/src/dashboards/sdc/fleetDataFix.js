// Fix for capturing fleet number when assessment completes
// Add this to your wizard completion handler

export const captureFleetNumberProperly = () => {
  // Method 1: Get from selected vehicle in sessionStorage
  const getFleetFromSession = () => {
    try {
      const selectedVehicle = sessionStorage.getItem('selectedVehicle');
      if (selectedVehicle) {
        const vehicle = JSON.parse(selectedVehicle);
        return vehicle.fleetNumber || vehicle.fleet_number || vehicle.fleet_no || null;
      }
    } catch (e) {
      console.error('Error parsing selected vehicle:', e);
    }
    return null;
  };

  // Method 2: Get from fleet selection modal data
  const getFleetFromModal = () => {
    try {
      // Check various possible storage keys
      const keys = ['selectedFleetNumber', 'currentFleetNumber', 'fleetNumber'];
      for (const key of keys) {
        const value = sessionStorage.getItem(key) || localStorage.getItem(key);
        if (value) return value;
      }
    } catch (e) {
      console.error('Error getting fleet from modal:', e);
    }
    return null;
  };

  // Method 3: Get from breakdown guide state
  const getFleetFromBreakdownGuide = () => {
    try {
      const breakdownData = sessionStorage.getItem('currentBreakdown');
      if (breakdownData) {
        const breakdown = JSON.parse(breakdownData);
        return breakdown.fleet_no || breakdown.fleet_number || null;
      }
    } catch (e) {
      console.error('Error getting fleet from breakdown guide:', e);
    }
    return null;
  };

  // Try all methods
  const fleetNumber = getFleetFromSession() || getFleetFromModal() || getFleetFromBreakdownGuide();
  
  if (!fleetNumber) {
    console.error('⚠️ No fleet number found! Vehicle selection may not be working properly.');
    // Prompt user to enter it manually if critical
    return prompt('Enter fleet number (e.g., 5401):') || 'Unknown';
  }
  
  return fleetNumber;
};

// IMPORTANT: Update your wizard completion to use this
export const completeAssessmentWithFleetData = (wizardType, decision, notes) => {
  // Get the fleet number properly
  const fleetNumber = captureFleetNumberProperly();
  
  // Get location (try to get from geolocation or stored data)
  const location = sessionStorage.getItem('currentLocation') || 
                  localStorage.getItem('lastLocation') || 
                  'Unknown Location';
  
  // Get supervisor
  const supervisor = JSON.parse(localStorage.getItem('currentSupervisor') || '{}');
  
  // Build complete breakdown data WITH FLEET NUMBER
  const breakdownData = {
    breakdown_id: `BD-${Date.now()}`,
    fleet_no: fleetNumber, // CRITICAL: Include fleet number
    fleet_number: fleetNumber, // Include both fields to be safe
    location: location,
    issue_type: wizardType.replace('Wizard', ''),
    wizard_type: wizardType,
    severity: decision,
    wizard_decision: decision,
    supervisor_name: supervisor.name || 'Unknown',
    supervisor_badge: supervisor.badge || '',
    created_at: new Date().toISOString(),
    notes: notes || '',
    
    // Also include vehicle object for compatibility
    vehicle: {
      fleetNumber: fleetNumber,
      fleet_number: fleetNumber
    }
  };
  
  // Store locally for SDC Dashboard to pick up
  const key = `breakdown_${breakdownData.breakdown_id}`;
  localStorage.setItem(key, JSON.stringify(breakdownData));
  
  // Also store as latest
  localStorage.setItem('latestBreakdown', JSON.stringify(breakdownData));
  
  console.log('✅ Assessment completed with fleet data:', breakdownData);
  
  // Send to backend
  fetch('/api/breakdowns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(breakdownData)
  }).catch(err => console.error('Failed to send to backend:', err));
  
  return breakdownData;
};

// Function to store vehicle when selected in fleet modal
export const storeSelectedVehicle = (vehicle) => {
  if (!vehicle) {
    console.error('No vehicle provided to store');
    return;
  }
  
  console.log('🚗 Storing vehicle data:', vehicle);
  
  // Store in multiple places to ensure it's available
  const vehicleData = {
    // Fleet number (multiple field names for compatibility)
    fleetNumber: vehicle.fleetNumber || vehicle.fleet_number || vehicle.fleet_no,
    fleet_number: vehicle.fleetNumber || vehicle.fleet_number || vehicle.fleet_no,
    fleet_no: vehicle.fleetNumber || vehicle.fleet_number || vehicle.fleet_no,
    
    // Registration
    registration: vehicle.registration || vehicle.regNo || '',
    regNo: vehicle.regNo || vehicle.registration || '',
    
    // Depot
    depot: vehicle.depot || 'Unknown',
    depot_id: vehicle.depot || 'Unknown',
    depot_name: vehicle.depot || 'Unknown',
    
    // Vehicle type
    vehicleType: vehicle.vehicleType || vehicle.type || '',
    vehicle_type: vehicle.vehicleType || vehicle.type || '',
    type: vehicle.vehicleType || vehicle.type || '',
    
    // Metadata
    selected_at: new Date().toISOString(),
    route: vehicle.route || '',
    routeName: vehicle.routeName || '',
    location: vehicle.location || null
  };
  
  // Store in multiple locations
  sessionStorage.setItem('selectedVehicle', JSON.stringify(vehicleData));
  sessionStorage.setItem('selectedFleetNumber', vehicleData.fleetNumber);
  sessionStorage.setItem('currentVehicle', JSON.stringify(vehicleData));
  localStorage.setItem('lastSelectedVehicle', JSON.stringify(vehicleData));
  localStorage.setItem('lastFleetNumber', vehicleData.fleetNumber);
  
  console.log('✅ Vehicle stored successfully:', vehicleData);
};

export default {
  captureFleetNumberProperly,
  completeAssessmentWithFleetData,
  storeSelectedVehicle
};
